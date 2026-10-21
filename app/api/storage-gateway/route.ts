import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { getToken } from "next-auth/jwt";
import { logActivity } from "@/lib/logger";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const rawPath = searchParams.get('path') || '';
    let folderPath = rawPath.replace(/\\/g, '/').trim().replace(/^\/+|\/+$/g, '');
    if (folderPath.toLowerCase().startsWith('root/')) {
      folderPath = folderPath.slice(5).replace(/^\/+|\/+$/g, '');
    } else if (folderPath.toLowerCase() === 'root') {
      folderPath = '';
    }

    let user = null;
    if (token?.email) {
      const { prisma } = await import('@/lib/prisma');
      user = await prisma.user.findUnique({
        where: { email: token.email },
        include: { permissions: true }
      });
    }

    let items = await storage.listFolder(folderPath);
    
    // Filter items based on user permissions
    if (user && user.role !== 'ADMIN' && user.permissions) {
      items = items.filter((item: any) => {
        const itemPath = folderPath ? `${folderPath}/${item.name}` : item.name;
        return user!.permissions.some((p: any) => 
          itemPath.includes(p.folderPath) || p.folderPath === ''
        );
      });
    }

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("STORAGE_GATEWAY_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    // For now, allow uploads if they have a session.
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const rawTarget = formData.get('targetFolderPath') as string || '';
    let targetFolderPath = rawTarget.replace(/\\/g, '/').trim().replace(/^\/+|\/+$/g, '');
    if (targetFolderPath.toLowerCase().startsWith('root/')) {
      targetFolderPath = targetFolderPath.slice(5).replace(/^\/+|\/+$/g, '');
    } else if (targetFolderPath.toLowerCase() === 'root') {
      targetFolderPath = '';
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await storage.uploadFile(targetFolderPath, file.name, buffer);

    const session = await getServerSession(authOptions as any) as any;
    if (session?.user?.id) {
      await logActivity({
        userId: session.user.id,
        action: 'UPLOAD',
        module: 'FILE_ARCHIVE',
        resource: `${targetFolderPath}/${file.name}`,
        details: `Uploaded file ${file.name}`
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
