import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('📥 Received Viva Payments webhook:', {
      eventTypeId: body.EventTypeId,
      orderCode: body.EventData?.OrderCode || body.OrderCode,
      timestamp: new Date().toISOString()
    })

    // Forward to N8N for QR code generation and processing
    const n8nWebhookUrl = process.env.N8N_SUCCESS_WEBHOOK_URL || 'https://tasos8.app.n8n.cloud/webhook/loca-noche-payment-success'

    let n8nResponse = null
    let n8nSuccess = false

    try {
      console.log('🔄 Forwarding to N8N for QR generation and email delivery...')

      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LocaNoche-Webhook-Forwarder/1.0'
        },
        body: JSON.stringify({
          ...body,
          timestamp: new Date().toISOString(),
          source: 'viva-webhook'
        })
      })

      if (response.ok) {
        n8nResponse = await response.json()
        n8nSuccess = n8nResponse?.success === true || n8nResponse?.processed === true
        console.log('✅ N8N workflow response:', n8nResponse)
      } else {
        console.error('❌ Failed to forward to N8N:', {
          status: response.status,
          statusText: response.statusText
        })
      }
    } catch (n8nError) {
      console.error('❌ N8N forwarding error:', n8nError)
    }

    // Return appropriate response to VivaPayments
    return NextResponse.json({
      received: true,
      processed: n8nSuccess,
      n8nSuccess,
      n8nResponse: n8nSuccess ? n8nResponse : null,
      message: n8nSuccess
        ? 'Payment processed, QR codes generated, and emails sent'
        : 'Payment processed but ticket generation pending'
    })

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Add GET handler for VivaPayments verification
export async function GET(request: NextRequest) {
  // VivaPayments sends a GET request to verify the webhook endpoint
  return NextResponse.json({
    Key: 'F73C4955767486D598A166756EA64AD2F1667E5E',
    success: true,
    message: 'Webhook endpoint verified'
  })
}