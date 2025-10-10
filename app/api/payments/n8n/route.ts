import { NextRequest, NextResponse } from 'next/server'
import { n8nPaymentService } from '@/lib/payment/n8n-payment'

interface TicketSelection {
  ticketTypeId: string
  ticketTypeName: string
  quantity: number
  price: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Support both new mixed selection format and legacy single ticket format
    if (body.ticketSelections) {
      // New mixed ticket format
      const { eventId, ticketSelections, total, description } = body

      // Validate the request
      if (!eventId || !Array.isArray(ticketSelections) || ticketSelections.length === 0) {
        return NextResponse.json(
          { error: 'Invalid request: eventId and ticketSelections are required' },
          { status: 400 }
        )
      }

      // Calculate total quantity and create description
      const totalQuantity = ticketSelections.reduce((sum: number, selection: TicketSelection) => sum + selection.quantity, 0)
      const detailedDescription = ticketSelections
        .map((selection: TicketSelection) => `${selection.quantity}x ${selection.ticketTypeName}`)
        .join(', ')

      // Create payment order via N8N webhook with calculated total
      console.log('🎫 Creating payment:', { eventId, total, totalQuantity, customerData: body.customerData })
      
      const paymentResult = await n8nPaymentService.createPaymentOrderWithAmount({
        eventId,
        totalAmount: total,
        totalQuantity,
        description: `${n8nPaymentService.getEventName(eventId)} - ${detailedDescription}`,
        customerData: body.customerData // Pass customer data to N8N
      })

      console.log('💳 Payment result:', paymentResult)

      if (!paymentResult || !paymentResult.success) {
        console.error('❌ Payment failed:', paymentResult?.error)
        return NextResponse.json(
          { error: paymentResult?.error || 'Payment creation failed' },
          { status: 500 }
        )
      }

      const response = {
        success: true,
        paymentUrl: paymentResult.paymentUrl || '',
        orderCode: paymentResult.orderCode || '',
        amount: paymentResult.amount || total,
        quantity: totalQuantity,
        ticketSelections,
        event: paymentResult.event || n8nPaymentService.getEventName(eventId),
        eventId: paymentResult.eventId || eventId,
        description: paymentResult.description || detailedDescription,
        total,
        eventName: n8nPaymentService.getEventName(eventId),
        paymentCode: n8nPaymentService.getPaymentCode(eventId)
      }

      console.log('✅ Sending response:', response)
      return NextResponse.json(response)
    } else {
      // Legacy single ticket format (backward compatibility)
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
    }
  } catch (error) {
    console.error('❌ N8N payment API error:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
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