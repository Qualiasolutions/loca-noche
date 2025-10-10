import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Only show in non-production or with secret key
  const secret = request.nextUrl.searchParams.get('secret')

  if (secret !== 'debug-loca-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env: {
      N8N_EVENT1_WEBHOOK_URL: process.env.N8N_EVENT1_WEBHOOK_URL ? 'SET' : 'NOT_SET',
      N8N_EVENT2_WEBHOOK_URL: process.env.N8N_EVENT2_WEBHOOK_URL ? 'SET' : 'NOT_SET',
      N8N_SUCCESS_WEBHOOK_URL: process.env.N8N_SUCCESS_WEBHOOK_URL ? 'SET' : 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      // Show partial URL for debugging
      EVENT1_URL_PREFIX: process.env.N8N_EVENT1_WEBHOOK_URL ?
        process.env.N8N_EVENT1_WEBHOOK_URL.substring(0, 40) + '...' :
        'undefined',
      EVENT2_URL_PREFIX: process.env.N8N_EVENT2_WEBHOOK_URL ?
        process.env.N8N_EVENT2_WEBHOOK_URL.substring(0, 40) + '...' :
        'undefined',
    }
  })
}