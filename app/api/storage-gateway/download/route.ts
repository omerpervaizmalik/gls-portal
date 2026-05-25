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

    if (process.env.USE_CLOUD_STORAGE === 'true') {
      const { onedrive } = await import('@/lib/onedrive');
      const downloadUrl = await onedrive.getDownloadUrl(itemPath);
      return NextResponse.redirect(downloadUrl);
    }

    const fullPath = path.resolve(process.env.LOCAL_STORAGE_PATH || 'storage', itemPath);
    const fileBuffer = await fs.readFile(fullPath);
    const fileName = path.basename(fullPath);
    const ext = path.extname(fileName).toLowerCase();
    const mode = req.nextUrl.searchParams.get('mode') || 'download';

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

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Disposition': `${mode === 'view' ? 'inline' : 'attachment'}; filename="${fileName}"`,
        'Content-Type': contentType,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

