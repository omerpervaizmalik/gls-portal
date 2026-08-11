import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { clientId, amount, description, date, status } = data;

    if (!clientId || !amount || !description || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const disbursement = await prisma.disbursement.create({
      data: {
        clientId,
        amount: parseFloat(amount),
        description,
        date: new Date(date),
        status: status || "PENDING"
      }
    });

    return NextResponse.json(disbursement);
  } catch (error: any) {
    console.error("Failed to add disbursement", error);
    return NextResponse.json({ error: "Failed to add disbursement" }, { status: 500 });
  }
}
