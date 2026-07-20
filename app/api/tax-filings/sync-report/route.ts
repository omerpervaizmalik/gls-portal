import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get('year');
  if (!yearParam) {
    return NextResponse.json({ error: "Year is required" }, { status: 400 });
  }
  
  const currentYear = parseInt(yearParam);
  const previousYear = currentYear - 1;

  try {
    // Get current year filings and previous year filings
    const [currentFilings, previousFilings] = await Promise.all([
      prisma.filing.findMany({
        where: { year: currentYear },
        include: { client: true }
      }),
      prisma.filing.findMany({
        where: { year: previousYear },
        include: { client: true }
      })
    ]);

    const previousClientIds = new Set(previousFilings.map(f => f.clientId));
    const currentClientIds = new Set(currentFilings.map(f => f.clientId));

    // To Add: Clients in current year but NOT in previous year, AND whose status is not LEFT
    const toAddFilings = currentFilings.filter(f => 
      !previousClientIds.has(f.clientId) && f.client.status !== 'LEFT' && f.client.status !== 'CLOSED'
    );
    const toAdd = toAddFilings.map(f => f.client);

    // To Remove: 
    // 1. Clients in previous year but NOT in current year
    // 2. Clients in current year who are explicitly marked as LEFT or CLOSED
    const missingFromCurrent = previousFilings
      .filter(f => !currentClientIds.has(f.clientId))
      .map(f => f.client);
      
    const explicitlyLeft = currentFilings
      .filter(f => f.client.status === 'LEFT' || f.client.status === 'CLOSED')
      .map(f => f.client);
      
    // Combine and deduplicate toRemove
    const toRemoveMap = new Map();
    missingFromCurrent.forEach(c => toRemoveMap.set(c.id, c));
    explicitlyLeft.forEach(c => toRemoveMap.set(c.id, c));
    
    const toRemove = Array.from(toRemoveMap.values());

    return NextResponse.json({ 
      toAdd, 
      toRemove 
    });
  } catch (error: any) {
    console.error("Error generating sync report:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
