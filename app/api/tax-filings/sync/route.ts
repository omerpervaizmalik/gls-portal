import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { year } = await req.json();
    if (!year) return NextResponse.json({ error: "Year is required" }, { status: 400 });

    const currentYear = parseInt(year);

    // Get active tax clients (excluding legal clients)
    const activeClients = await prisma.client.findMany({
      where: {
        NOT: [
          { status: "LEFT" },
          { clientType: "LEGAL" }
        ]
      }
    });

    // Delete filings for left clients or legal clients for this year
    await prisma.filing.deleteMany({
      where: {
        year: currentYear,
        client: {
          OR: [
            { status: "LEFT" },
            { clientType: "LEGAL" }
          ]
        }
      }
    });

    // Insert active clients if they don't have a filing
    let addedCount = 0;
    for (const client of activeClients) {
      const existingFiling = await prisma.filing.findFirst({
        where: {
          clientId: client.id,
          year: currentYear
        }
      });

      if (!existingFiling) {
        await prisma.filing.create({
          data: {
            clientId: client.id,
            year: currentYear,
            status: "PENDING",
            isContacted: false,
            docsObtained: false,
            isWorking: false,
            isFiled: false,
            isBilled: false,
            isPaid: false,
            billAmount: 0,
            paymentAmount: 0,
          }
        });
        addedCount++;
      }
    }

    return NextResponse.json({ message: `Tax Year ${currentYear} synchronized. Added ${addedCount} new clients and removed left clients.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
