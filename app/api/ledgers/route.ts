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
    const { clientId, type, amount, date, description, paymentMode } = await req.json();

    if (!clientId || !type || !amount || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const entry = await prisma.ledgerEntry.create({
      data: {
        clientId,
        type, // "DEBIT" (Invoice/Owes) or "CREDIT" (Payment)
        amount: parseFloat(amount),
        date: new Date(date || new Date()),
        description,
        paymentMode,
      }
    });

    revalidatePath("/fams");
    revalidatePath(`/fams/ledger/${clientId}`);
    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id, type, amount, date, description, paymentMode, clientId } = await req.json();

    if (!id || !type || !amount || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const entry = await prisma.ledgerEntry.update({
      where: { id },
      data: {
        type,
        amount: parseFloat(amount),
        date: new Date(date || new Date()),
        description,
        paymentMode,
      }
    });

    revalidatePath("/fams");
    if (clientId) revalidatePath(`/fams/ledger/${clientId}`);
    return NextResponse.json(entry, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id, clientId } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await prisma.ledgerEntry.delete({
      where: { id }
    });

    revalidatePath("/fams");
    if (clientId) revalidatePath(`/fams/ledger/${clientId}`);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

