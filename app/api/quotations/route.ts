import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { clientId, date, items, totalAmount } = await req.json();

    if (!clientId || !items || totalAmount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create Quotation record (no ledger entry)
    const quotation = await prisma.quotation.create({
      data: {
        clientId,
        date: new Date(date || new Date()),
        items, // JSON array
        totalAmount,
      }
    });

    revalidatePath("/fams");
    revalidatePath("/fams/quote");

    return NextResponse.json(quotation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || "";
  const id = searchParams.get('id');

  try {
    if (id) {
      const quotation = await prisma.quotation.findUnique({
        where: { id },
        include: { client: true }
      });
      return NextResponse.json(quotation ? [quotation] : []);
    }

    const quotations = await prisma.quotation.findMany({
      where: {
        OR: [
          { client: { name: { contains: q, mode: 'insensitive' } } }
        ]
      },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json(quotations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
