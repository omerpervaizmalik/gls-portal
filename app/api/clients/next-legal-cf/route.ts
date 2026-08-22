import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await prisma.$queryRaw`SELECT "cfNo" FROM "Client" WHERE "cfNo" LIKE 'L-%' ORDER BY CAST(SUBSTRING("cfNo" FROM 3) AS INTEGER) DESC LIMIT 1`;
    let nextCf = "L-1";
    if (Array.isArray(result) && result.length > 0 && (result as any)[0].cfNo) {
      const currentHighest = parseInt(((result as any)[0].cfNo as string).substring(2), 10);
      nextCf = `L-${currentHighest + 1}`;
    }
    
    return NextResponse.json({ nextCf });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
