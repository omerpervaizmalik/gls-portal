import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;
  const itemPath = req.nextUrl.searchParams.get('path');

  if (!session?.user?.id || !itemPath) return NextResponse.json({ error: 'Unauthorized or missing parameters' }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { permissions: true }
    });

    const canDelete = user?.role === 'ADMIN' || 
      user?.permissions.some((p: { folderPath: string; canWrite: boolean }) => itemPath.includes(p.folderPath) && p.canWrite);

    if (!canDelete) return NextResponse.json({ error: 'No delete access' }, { status: 403 });

    await storage.deleteItem(itemPath);
    
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        path: itemPath,
        details: `Deleted item from local storage`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
