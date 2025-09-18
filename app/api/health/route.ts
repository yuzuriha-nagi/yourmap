import { NextResponse } from 'next/server';

export async function GET() {
  const odptApiKey = process.env.NEXT_PUBLIC_ODPT_API_KEY || process.env.ODPT_API_KEY;
  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA;

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    config: {
      hasOdptApiKey: !!odptApiKey,
      odptApiKeyLength: odptApiKey ? odptApiKey.length : 0,
      useMockData: useMockData,
      vercelEnv: process.env.VERCEL_ENV || 'development'
    }
  });
}