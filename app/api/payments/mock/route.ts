import { NextRequest, NextResponse } from 'next/server'

// Mock payment endpoint for testing when N8N is not available
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('Mock payment request received:', body)

    // Generate a mock order code
    const mockOrderCode = `MOCK-${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Return mock payment response that mimics N8N/VivaPayments
    const mockResponse = {
      success: true,
      paymentUrl: `https://www.vivapayments.com/web/checkout?ref=${mockOrderCode}`,
      orderCode: mockOrderCode,
      amount: body.totalAmount || 10,
      quantity: body.totalQuantity || 1,
      event: body.eventId === '2' ? 'Oktoberfest - Giannis Margaris' : 'Oktoberfest - Minus One',
      eventId: body.eventId || '1',
      description: body.description || 'Mock Oktoberfest Tickets',
      mock: true,
      message: 'This is a MOCK payment for testing. In production, this will create a real VivaPayments order.'
    }

    console.log('Mock payment response:', mockResponse)

    return NextResponse.json(mockResponse)
  } catch (error) {
    console.error('Mock payment error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Mock payment failed',
        mock: true
      },
      { status: 500 }
    )
  }
}