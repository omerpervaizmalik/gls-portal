import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");

  if (!year) {
    try {
      const filings = await prisma.filing.findMany({
        select: { year: true },
        distinct: ['year'],
        orderBy: { year: 'desc' }
      });
      return NextResponse.json(filings);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  try {
    const filings = await prisma.filing.findMany({
      where: { year: parseInt(year) },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            cfNo: true,
            mobileNo: true
          }
        }
      }
    });
    
    const sortedFilings = filings.sort((a, b) => {
      const aNo = parseInt(a.client?.cfNo || "0");
      const bNo = parseInt(b.client?.cfNo || "0");
      return aNo - bNo;
    });

    return NextResponse.json(sortedFilings);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { year } = await req.json();
    if (!year) return NextResponse.json({ error: "Year is required" }, { status: 400 });

    const clients = await prisma.client.findMany({
      where: { 
        NOT: { status: "LEFT" }
      }
    });

    for (const client of clients) {
      // Using quoted identifiers for Postgres compatibility
      await prisma.$executeRaw`
        INSERT INTO "Filing" ("id", "clientId", "year", "status", "isContacted", "docsObtained", "isWorking", "isFiled", "isBilled", "isPaid", "billAmount", "paymentAmount", "createdAt", "updatedAt")
        VALUES (${Math.random().toString(36).substring(7)}, ${client.id}, ${parseInt(year)}, 'PENDING', false, false, false, false, false, false, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("clientId", "year") DO NOTHING
      `;
    }

    return NextResponse.json({ message: `Tax Year ${year} initialized with ${clients.length} clients.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    if (!year) return NextResponse.json({ error: "Year is required" }, { status: 400 });

    await prisma.filing.deleteMany({
      where: { year: parseInt(year) }
    });

    return NextResponse.json({ message: `Tax Year ${year} deleted successfully.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
