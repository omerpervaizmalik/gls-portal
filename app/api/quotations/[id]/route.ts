import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: { client: true }
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    return NextResponse.json(quotation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { clientId, date, items, totalAmount } = await req.json();

    const existing = await prisma.quotation.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const quotation = await prisma.quotation.update({
      where: { id: params.id },
      data: {
        clientId,
        date: new Date(date),
        items,
        totalAmount
      }
    });

    revalidatePath("/fams");
    revalidatePath("/fams/quote");

    return NextResponse.json(quotation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const existing = await prisma.quotation.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    await prisma.quotation.delete({
      where: { id: params.id }
    });

    revalidatePath("/fams");
    revalidatePath("/fams/quote");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
