import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const clients = await prisma.client.findMany();
    const seen = new Set();
    let duplicates = 0;

    for (const client of clients) {
      const key = `${client.name}-${client.email || ''}-${client.mobileNo || ''}`;
      if (seen.has(key)) {
        await prisma.client.delete({ where: { id: client.id } });
        duplicates++;
      } else {
        seen.add(key);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${duplicates} duplicate clients.` 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
