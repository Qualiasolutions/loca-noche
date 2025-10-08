import { NextRequest, NextResponse } from 'next/server'
import { n8nPaymentService } from '@/lib/payment/n8n-payment'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Forward Viva Payments webhook to N8N QR Payment Success Generator
    const n8nWebhookUrl = 'https://tasos8.app.n8n.cloud/webhook/loca-noche-payment-success'

    console.log('🔄 Forwarding Viva Payments webhook to N8N:', {
      eventTypeId: body.EventTypeId,
      orderCode: body.EventData?.OrderCode || body.OrderCode,
      timestamp: new Date().toISOString()
    })

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LocaNoche-Webhook-Forwarder/1.0'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      console.error('❌ Failed to forward to N8N:', {
        status: response.status,
        statusText: response.statusText
      })
      return NextResponse.json(
        { error: 'Failed to process payment webhook' },
        { status: 500 }
      )
    }

    const n8nResponse = await response.json()
    console.log('✅ N8N workflow response:', n8nResponse)

    return NextResponse.json({
      received: true,
      forwarded: true,
      n8nResponse: n8nResponse
    })

  } catch (error) {
    console.error('❌ Webhook forwarding error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}