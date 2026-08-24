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
      status, isContacted, docsObtained, isWorking, isDraftReady, isFiled, isBilled, isPaid, 
      billAmount, paymentAmount, notes, filledBy 
    } = body;

    // Automatically set filledBy if isFiled is true and filledBy is empty
    const finalFilledBy = isFiled && !filledBy ? (session?.user?.name || "System") : filledBy;

    await prisma.filing.update({
      where: { id },
      data: {
        status: status || undefined,
        isContacted: isContacted !== undefined ? (typeof isContacted === 'boolean' ? isContacted : !!isContacted) : undefined,
        docsObtained: docsObtained !== undefined ? (typeof docsObtained === 'boolean' ? docsObtained : !!docsObtained) : undefined,
        isWorking: isWorking !== undefined ? (typeof isWorking === 'boolean' ? isWorking : !!isWorking) : undefined,
        isDraftReady: isDraftReady !== undefined ? (typeof isDraftReady === 'boolean' ? isDraftReady : !!isDraftReady) : undefined,
        isFiled: isFiled !== undefined ? (typeof isFiled === 'boolean' ? isFiled : !!isFiled) : undefined,
        isBilled: isBilled !== undefined ? (typeof isBilled === 'boolean' ? isBilled : !!isBilled) : undefined,
        isPaid: isPaid !== undefined ? (typeof isPaid === 'boolean' ? isPaid : !!isPaid) : undefined,
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
