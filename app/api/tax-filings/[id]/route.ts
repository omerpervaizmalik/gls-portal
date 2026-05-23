import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const session = await getServerSession(authOptions);

  try {
    const body = await req.json();
    
    const { 
      status, isContacted, docsObtained, isWorking, isFiled, isBilled, isPaid, 
      billAmount, paymentAmount, notes, filledBy 
    } = body;

    // Automatically set filledBy if isFiled is true and filledBy is empty
    const finalFilledBy = isFiled && !filledBy ? (session?.user?.name || "System") : filledBy;

    await prisma.filing.update({
      where: { id },
      data: {
        status: status || undefined,
        isContacted: typeof isContacted === 'boolean' ? isContacted : !!isContacted,
        docsObtained: typeof docsObtained === 'boolean' ? docsObtained : !!docsObtained,
        isWorking: typeof isWorking === 'boolean' ? isWorking : !!isWorking,
        isFiled: typeof isFiled === 'boolean' ? isFiled : !!isFiled,
        isBilled: typeof isBilled === 'boolean' ? isBilled : !!isBilled,
        isPaid: typeof isPaid === 'boolean' ? isPaid : !!isPaid,
        billAmount: billAmount !== undefined ? parseFloat(billAmount.toString()) : undefined,
        paymentAmount: paymentAmount !== undefined ? parseFloat(paymentAmount.toString()) : undefined,
        notes: notes !== undefined ? notes : undefined,
        filledBy: finalFilledBy || undefined,
      }
    });

    return NextResponse.json({ message: "Updated successfully" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    await prisma.filing.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
