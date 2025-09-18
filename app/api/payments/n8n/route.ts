import { NextRequest, NextResponse } from 'next/server'
import { n8nPaymentService } from '@/lib/payment/n8n-payment'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, quantity, ticketType, description } = body

    // Validate the request
    const validation = n8nPaymentService.validatePaymentRequest({
      eventId,
      quantity,
      ticketType,
      description
    })

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Create payment order via N8N webhook
    const paymentResult = await n8nPaymentService.createPaymentOrder({
      eventId,
      quantity,
      ticketType,
      description
    })

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error || 'Payment creation failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResult.paymentUrl,
      orderCode: paymentResult.orderCode,
      amount: paymentResult.amount,
      quantity: paymentResult.quantity,
      ticketType: paymentResult.ticketType,
      event: paymentResult.event,
      eventId: paymentResult.eventId,
      description: paymentResult.description,
      total: n8nPaymentService.calculateTotal(eventId, ticketType, quantity),
      eventName: n8nPaymentService.getEventName(eventId),
      paymentCode: n8nPaymentService.getPaymentCode(eventId)
    })
  } catch (error) {
    console.error('N8N payment API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'N8N Payment API',
    endpoints: {
      POST: '/api/payments/n8n - Create payment order via N8N webhook'
    },
    supportedEvents: [
      { id: '1', name: 'Oktoberfest - Minus One', paymentCode: '1309' },
      { id: '2', name: 'Oktoberfest - Giannis Margaris', paymentCode: '5711' }
    ],
    ticketTypes: ['adult', 'child'],
    pricing: {
      adult: 10,
      child: 5
    }
  })
}