import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { service: 'eva-storefront', status: 'ok', timestamp: new Date().toISOString() },
    { headers: { 'cache-control': 'no-store' } },
  );
}
