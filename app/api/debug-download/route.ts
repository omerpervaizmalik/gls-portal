import { NextRequest, NextResponse } from 'next/server';
import { onedrive } from '@/lib/onedrive';

export async function GET(req: NextRequest) {
  try {
    const itemPath = req.nextUrl.searchParams.get('path');
    if (!itemPath) return NextResponse.json({ error: 'no path' });
    
    const url = await onedrive.getDownloadUrl(itemPath);
    if (!url) return NextResponse.json({ error: 'no downloadUrl' });

    const response = await fetch(url);
    const ok = response.ok;
    const status = response.status;
    const text = await response.text();

    return NextResponse.json({ url, ok, status, textPreview: text.substring(0, 100) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack });
  }
}
