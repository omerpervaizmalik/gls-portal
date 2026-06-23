import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;
  const { folderName, parentPath } = await req.json();

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { permissions: true }
    });

    const hasWritePermission = user?.role === 'ADMIN' || 
      user?.permissions.some((p: any) => (parentPath || '').includes(p.folderPath) && p.canWrite);

    if (!hasWritePermission) {
      return NextResponse.json({ error: 'No write access to this folder' }, { status: 403 });
    }

    const result = await storage.createFolder(parentPath || '', folderName);
    
    await logActivity({
      userId: session.user.id,
      action: 'CREATE_FOLDER',
      module: 'FILE_ARCHIVE',
      resource: result.id || `${parentPath}/${folderName}`,
      details: `Created new folder ${folderName}`
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
