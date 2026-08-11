import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  if (!session || (session as any)?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const existing = await prisma.incomeRecord.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Income record not found" }, { status: 404 });
    }

    if (existing.clientId) {
      const ledgerEntry = await prisma.ledgerEntry.findFirst({
        where: {
          clientId: existing.clientId,
          type: 'CREDIT',
          amount: existing.amount,
          date: existing.date,
        }
      });

      if (ledgerEntry) {
        await prisma.ledgerEntry.delete({
          where: { id: ledgerEntry.id }
        });
      }
    }

    await prisma.incomeRecord.delete({
      where: { id: params.id }
    });

    revalidatePath("/fams");
    revalidatePath("/fams/income");
    revalidatePath("/fams/ledger");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
