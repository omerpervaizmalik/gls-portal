import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { invoiceNo, clientId, date, items, totalAmount } = await req.json();

    if (!invoiceNo || !clientId || !items || !totalAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Create Ledger Entry first
    const summary = Array.isArray(items) ? items.map((i: any) => i.description || 'Service').join(', ') : 'Service';
    const ledgerDescription = `Invoice ${invoiceNo}: ${summary}`;

    const ledgerEntry = await prisma.ledgerEntry.create({
      data: {
        clientId,
        type: 'DEBIT',
        amount: totalAmount,
        date: new Date(date || new Date()),
        description: ledgerDescription
      }
    });

    // 2. Create Invoice record
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        clientId,
        date: new Date(date || new Date()),
        items, // JSON array
        totalAmount,
        ledgerEntryId: ledgerEntry.id,
        status: 'ISSUED'
      }
    });

    revalidatePath("/fams");
    revalidatePath(`/fams/ledger/${clientId}`);
    revalidatePath("/fams/invoice");

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || "";
  const id = searchParams.get('id');

  try {
    if (id) {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { client: true }
      });
      return NextResponse.json(invoice ? [invoice] : []);
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { invoiceNo: { contains: q, mode: 'insensitive' } },
          { client: { name: { contains: q, mode: 'insensitive' } } }
        ]
      },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
