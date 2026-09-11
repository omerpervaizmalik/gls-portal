import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getNextInvoiceNumber } from "@/lib/invoices";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { invoiceNo, clientId, date, items, totalAmount, ledgerEntryId } = await req.json();

    if (!clientId || !items || !totalAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Determine unique invoice number
    let finalInvoiceNo = invoiceNo;
    if (!finalInvoiceNo) {
      finalInvoiceNo = await getNextInvoiceNumber();
    } else {
      const existing = await prisma.invoice.findUnique({ where: { invoiceNo: finalInvoiceNo } });
      if (existing) {
        finalInvoiceNo = await getNextInvoiceNumber();
      }
    }

    // 1. Handle Ledger Entry (link existing or create new)
    const summary = Array.isArray(items) ? items.map((i: any) => i.description || 'Service').join(', ') : 'Service';
    const ledgerDescription = `Invoice ${finalInvoiceNo}: ${summary}`;

    let finalLedgerEntryId: string | null = null;
    if (ledgerEntryId) {
      const existingLedger = await prisma.ledgerEntry.findUnique({ where: { id: ledgerEntryId } });
      if (existingLedger) {
        await prisma.ledgerEntry.update({
          where: { id: ledgerEntryId },
          data: {
            description: ledgerDescription
          }
        });
        finalLedgerEntryId = ledgerEntryId;
      }
    }

    if (!finalLedgerEntryId && clientId) {
      const ledgerEntry = await prisma.ledgerEntry.create({
        data: {
          clientId,
          type: 'DEBIT',
          amount: totalAmount,
          date: new Date(date || new Date()),
          description: ledgerDescription
        }
      });
      finalLedgerEntryId = ledgerEntry.id;
    }

    // 2. Create Invoice record
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: finalInvoiceNo,
        clientId,
        date: new Date(date || new Date()),
        items, // JSON array
        totalAmount,
        ledgerEntryId: finalLedgerEntryId,
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
