import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";


// GET single client
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: { filings: { orderBy: { year: "asc" } } },
    });
    if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    // Manually fetch extra fields
    const extras = await prisma.$queryRaw`SELECT description, category FROM "Client" WHERE id = ${params.id}`;
    if (extras && (extras as any[]).length > 0) {
      client.description = (extras as any)[0].description;
      client.category = (extras as any)[0].category;
    }

    return NextResponse.json(client);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT update a client
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { 
      cfNo, name, cnic, email, irisPassword, mobileNo, 
      address, city, ntn, strn, businessName, profileImage, description, category, entryDate,
      reference, status, filings 
    } = body;

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        cfNo,
        name,
        cnic,
        email,
        irisPassword,
        mobileNo,
        address,
        city,
        ntn,
        strn,
        businessName,
        profileImage,
        entryDate: entryDate ? new Date(entryDate) : undefined,
        reference,
        status,
      },
    });

    // Handle recently added fields with raw SQL to bypass potentially outdated Prisma Client
    if (description !== undefined) {
      await prisma.$executeRaw`UPDATE "Client" SET description = ${description} WHERE id = ${params.id}`;
    }
    if (category !== undefined) {
      await prisma.$executeRaw`UPDATE "Client" SET category = ${category} WHERE id = ${params.id}`;
    }

    // UPDATE "Filing"s if provided
    if (filings && Array.isArray(filings)) {
      for (const f of filings) {
        await prisma.filing.upsert({
          where: { clientId_year: { clientId: params.id, year: f.year } },
          create: {
            clientId: params.id,
            year: f.year,
            status: f.status,
            paymentAmount: f.paymentAmount || f.payment || 0,
            filledBy: f.filledBy,
          },
          update: {
            status: f.status,
            paymentAmount: f.paymentAmount || f.payment || 0,
            filledBy: f.filledBy,
          },
        });
      }
    }

    const updated = await prisma.client.findUnique({
      where: { id: params.id },
      include: { filings: { orderBy: { year: "asc" } } },
    });

    if (updated) {
      const extras = await prisma.$queryRaw`SELECT description, category FROM "Client" WHERE id = ${params.id}`;
      if (extras && (extras as any[]).length > 0) {
        (updated as any).description = (extras as any)[0].description;
        (updated as any).category = (extras as any)[0].category;
      }
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE a client
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized: Admins only" }, { status: 401 });
  }

  try {
    await prisma.client.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[CLIENT_DELETE_ERROR]", e);
    return NextResponse.json({ error: e.message || "Failed to delete client" }, { status: 500 });
  }
}
