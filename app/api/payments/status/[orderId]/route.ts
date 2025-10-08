import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Checking payment status for order: ${orderId}`)

    // Check if payment has been confirmed via webhook
    // We'll check for a confirmed booking with this order code
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { bookingReference: orderId },
          { vivaOrderCode: orderId }
        ]
      },
      include: {
        tickets: true,
        payment: true
      }
    })

    if (!booking) {
      // No booking found yet - payment still processing
      return NextResponse.json({
        status: 'processing',
        message: 'Payment is being processed',
        orderId
      })
    }

    // Check booking status
    if (booking.status === 'CONFIRMED') {
      return NextResponse.json({
        status: 'confirmed',
        message: 'Payment confirmed and tickets generated',
        orderId,
        bookingId: booking.id,
        ticketCount: booking.tickets.length,
        customerEmail: booking.customerEmail
      })
    }

    if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
      return NextResponse.json({
        status: 'failed',
        message: `Payment was ${booking.status.toLowerCase()}`,
        orderId,
        bookingId: booking.id
      })
    }

    if (booking.status === 'PENDING') {
      // Check if payment has timed out (created more than 15 minutes ago)
      const paymentTimeout = 15 * 60 * 1000 // 15 minutes
      const now = new Date()
      const createdAt = new Date(booking.createdAt)

      if (now.getTime() - createdAt.getTime() > paymentTimeout) {
        // Update booking to expired
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'EXPIRED' }
        })

        return NextResponse.json({
          status: 'failed',
          message: 'Payment session expired',
          orderId,
          bookingId: booking.id
        })
      }

      return NextResponse.json({
        status: 'processing',
        message: 'Payment is being processed',
        orderId,
        bookingId: booking.id,
        createdAt: booking.createdAt
      })
    }

    // Default to processing for any other status
    return NextResponse.json({
      status: 'processing',
      message: 'Payment is being processed',
      orderId,
      bookingId: booking.id,
      bookingStatus: booking.status
    })

  } catch (error) {
    console.error('❌ Error checking payment status:', error)
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    )
  }
}