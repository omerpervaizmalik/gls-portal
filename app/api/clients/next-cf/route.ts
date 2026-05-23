import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering so this always reads fresh data from DB
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Fetch all "cfNo" to find the numerical maximum (since it's stored as TEXT)
    const result = await prisma.$queryRaw`SELECT MAX(CAST("cfNo" AS INTEGER)) as maxcf FROM "Client"`;
    const maxCf = Number((result as any)[0].maxcf || 0);
    return NextResponse.json({ nextCf: maxCf + 1, prevCf: maxCf });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
