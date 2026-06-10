import { NextRequest, NextResponse } from 'next/server';
import { localStorage } from '@/lib/local-storage';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId');
  const itemPath = req.nextUrl.searchParams.get('path');

  const isPublicProfile = itemPath?.startsWith('photos/') || itemPath?.startsWith('profiles/');

  if (!isPublicProfile && (!userId || !itemPath)) {
    return NextResponse.json({ error: 'Unauthorized or missing path' }, { status: 401 });
  }

  try {
    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: { permissions: true }
      });
    }

    if (!isPublicProfile && !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Check permissions
    const isTaskAttachment = itemPath?.startsWith('TaskAttachments/');
    
    const hasPermission = isPublicProfile || user?.role === 'ADMIN' || isTaskAttachment ||
      (user?.permissions && user.permissions.some(p => itemPath?.includes(p.folderPath) || p.folderPath === ''));

    if (!hasPermission) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const mode = req.nextUrl.searchParams.get('mode') || 'download';

    const fileName = path.basename(itemPath as string);
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
      '.txt': 'text/plain', '.html': 'text/html',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    if (process.env.USE_CLOUD_STORAGE === 'true') {
      const { onedrive } = await import('@/lib/onedrive');
      console.log("[DOWNLOAD] Getting download URL for:", itemPath);
      const downloadUrl = await onedrive.getDownloadUrl(itemPath as string);
      console.log("[DOWNLOAD] URL resolved to:", downloadUrl);
      
      if (!downloadUrl) {
        throw new Error("downloadUrl is undefined or null from OneDrive API");
      }

      if (mode === 'view') {
        const response = await fetch(downloadUrl);
        if (!response.ok) {
           throw new Error(`Failed to fetch from downloadUrl. Status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return new NextResponse(arrayBuffer, {
          headers: {
            'Content-Disposition': `inline; filename="${fileName}"`,
            'Content-Type': contentType,
          },
        });
      } else {
        return NextResponse.redirect(downloadUrl);
      }
    }

    const fullPath = path.resolve(process.env.LOCAL_STORAGE_PATH || 'storage', itemPath as string);
    const fileBuffer = await fs.readFile(fullPath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Disposition': `${mode === 'view' ? 'inline' : 'attachment'}; filename="${fileName}"`,
        'Content-Type': contentType,
      },
    });
  } catch (error: any) {
    console.error("[DOWNLOAD ERROR]", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

