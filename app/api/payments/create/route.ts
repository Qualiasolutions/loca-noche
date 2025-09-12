import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { vivaPaymentService } from '@/lib/payment/viva-payment'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId } = body

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: true,
        tickets: {
          include: {
            ticketType: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.status !== 'RESERVED') {
      return NextResponse.json(
        { error: 'Booking is not in reserved status' },
        { status: 400 }
      )
    }

    // Check if booking has expired
    if (booking.expiresAt && new Date() > booking.expiresAt) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'EXPIRED' },
      })
      return NextResponse.json(
        { error: 'Booking has expired' },
        { status: 400 }
      )
    }

    // Create payment order with Viva Payments
    const paymentOrder = await vivaPaymentService.createPaymentOrder({
      amount: Number(booking.totalAmount),
      bookingReference: booking.bookingReference,
      customerEmail: booking.customerEmail,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone || undefined,
      description: `Tickets for ${booking.event.title}`,
    })

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount: booking.totalAmount,
        currency: 'EUR',
        method: 'CREDIT_CARD',
        status: 'PENDING',
        gatewayId: paymentOrder.orderCode.toString(),
        gatewayResponse: paymentOrder as any,
      },
    })

    // Update booking with payment ID
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentId: payment.id,
        status: 'PENDING',
      },
    })

    const paymentUrl = vivaPaymentService.getPaymentUrl(paymentOrder.orderCode)

    return NextResponse.json({
      paymentId: payment.id,
      orderCode: paymentOrder.orderCode,
      paymentUrl,
      amount: booking.totalAmount,
      currency: 'EUR',
    })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}