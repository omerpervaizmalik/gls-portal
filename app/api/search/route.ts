import { NextRequest, NextResponse } from 'next/server';
import { localStorage } from '@/lib/local-storage';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function searchFiles(dirPath: string, query: string, relativePath: string = ''): Promise<any[]> {
    const results: any[] = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const currentRelative = path.join(relativePath, entry.name);

        if (entry.name.toLowerCase().includes(query.toLowerCase())) {
            const stats = await fs.stat(fullPath);
            results.push({
                name: entry.name,
                path: currentRelative,
                isFolder: entry.isDirectory(),
                size: stats.size,
                lastModified: stats.mtime
            });
        }

        if (entry.isDirectory()) {
            const subResults = await searchFiles(fullPath, query, currentRelative);
            results.push(...subResults);
        }
    }
    return results;
}

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  const query = req.nextUrl.searchParams.get('q');

  if (!userId || !query) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { permissions: true }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const rootStorage = process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'storage');
    const allMatches = await searchFiles(rootStorage, query);

    // Filter results based on user permissions
    const filteredMatches = allMatches.filter(match => {
        if (user.role === 'ADMIN') return true;
        return user.permissions.some((p: any) => match.path.startsWith(p.driveItemId));
    });

    return NextResponse.json(filteredMatches);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
