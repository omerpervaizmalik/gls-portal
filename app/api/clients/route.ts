import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic so no static caching on Vercel
export const dynamic = "force-dynamic";

// GET all clients with search support
export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search") || "";
  const status = req.nextUrl.searchParams.get("status") || "";

  try {
    // 1. Build the where clause for Prisma
    const where: any = {
      AND: [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { cfNo: { contains: search, mode: 'insensitive' } },
            { cnic: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ]
        }
      ]
    };

    if (status) {
      where.AND.push({ status: status });
    }

    // 2. Fetch clients with filings included
    const clients = await prisma.client.findMany({
      where,
      include: {
        filings: {
          orderBy: { year: 'asc' }
        }
      }
    });

    // 3. Sort manually by cfNo as integer (Prisma doesn't support casting in orderBy yet)
    const sortedClients = clients.sort((a, b) => {
      const aNo = parseInt(a.cfNo || "0");
      const bNo = parseInt(b.cfNo || "0");
      return aNo - bNo;
    });

    return NextResponse.json({ clients: sortedClients, total: sortedClients.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST create a new client
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      cfNo, name, cnic, email, irisPassword, mobileNo, 
      address, city, ntn, strn, businessName, profileImage, description, category, entryDate,
      reference, status, filings, clientType = "TAX"
    } = body;

    let finalCfNo = cfNo;

    if (clientType === "LEGAL") {
      if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }

      const result = await prisma.$queryRaw`
        SELECT "cfNo" 
        FROM "Client" 
        WHERE "cfNo" ~ '^L-[0-9]+$' 
        ORDER BY CAST(SUBSTRING("cfNo" FROM 3) AS INTEGER) DESC 
        LIMIT 1
      `;
      if (Array.isArray(result) && result.length > 0 && (result as any)[0].cfNo) {
        const currentHighest = parseInt(((result as any)[0].cfNo as string).substring(2), 10);
        finalCfNo = `L-${currentHighest + 1}`;
      } else {
        finalCfNo = "L-1";
      }
    } else {
      if (!cfNo || !name) {
        return NextResponse.json({ error: "CF No and Name are required" }, { status: 400 });
      }

      // ── Duplicate checks ──────────────────────────────────────────────────────

      // 1. Check CF No (always unique)
      const existingCf = await prisma.client.findUnique({ where: { cfNo } });
      if (existingCf) {
        return NextResponse.json(
          { error: `CF No "${cfNo}" is already assigned to "${existingCf.name}". Please use the next available CF No.` },
          { status: 409 }
        );
      }

      // 2. Check CNIC (only if provided and non-empty)
      if (cnic && cnic.trim() !== "") {
        const existingCnic = await prisma.client.findFirst({ where: { cnic: cnic.trim() } });
        if (existingCnic) {
          return NextResponse.json(
            { error: `CNIC "${cnic}" is already registered under "${existingCnic.name}" (CF #${existingCnic.cfNo}).` },
            { status: 409 }
          );
        }
      }

      // 3. Check NTN (only if provided and non-empty)
      if (ntn && ntn.trim() !== "") {
        const existingNtn = await prisma.client.findFirst({ where: { ntn: ntn.trim() } });
        if (existingNtn) {
          return NextResponse.json(
            { error: `NTN "${ntn}" is already registered under "${existingNtn.name}" (CF #${existingNtn.cfNo}).` },
            { status: 409 }
          );
        }
      }
    }

    // ── Create client ─────────────────────────────────────────────────────────
    const client = await prisma.client.create({
      data: {
        cfNo: finalCfNo,
        clientType,
        name,
        cnic: cnic?.trim() || null,
        email,
        irisPassword,
        mobileNo,
        address,
        city,
        ntn: ntn?.trim() || null,
        strn,
        businessName,
        profileImage,
        description,
        category,
        entryDate: entryDate ? new Date(entryDate) : undefined,
        reference,
        status: status || "ACTIVE",
        filings: filings
          ? {
              create: filings.map((f: any) => ({
                year: f.year,
                status: f.status,
                paymentAmount: f.paymentAmount || 0,
                filledBy: f.filledBy,
              })),
            }
          : undefined,
      },
      include: { filings: true },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
