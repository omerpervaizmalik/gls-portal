import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('API_DEBUG: TEST_API_RUNNING');
  return NextResponse.json([
    { id: '1', name: 'If you see this, the API is working', folder: {}, size: 0, lastModifiedDateTime: new Date().toISOString(), path: 'test' }
  ]);
}
