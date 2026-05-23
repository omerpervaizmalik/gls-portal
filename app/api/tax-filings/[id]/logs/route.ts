import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const logs = await prisma.filingLog.findMany({
      where: { filingId: id },
      orderBy: { timestamp: 'desc' }
    });
    return NextResponse.json(logs);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const session = await getServerSession(authOptions);
  
  try {
    const { note, stage, type } = await req.json();
    
    const log = await prisma.filingLog.create({
      data: {
        filingId: id,
        userId: (session?.user as any)?.id || null,
        userName: session?.user?.name || "System",
        note,
        stage: stage || "General",
        type: type || 'CONTACT',
      }
    });

    return NextResponse.json({ message: "Log added", log });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
