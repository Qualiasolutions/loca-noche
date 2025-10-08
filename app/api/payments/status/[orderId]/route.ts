import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Enhanced payment status check with multiple verification methods
async function checkPaymentStatusWithViva(orderId: string) {
  try {
    // If Viva Payments API is configured, check directly with Viva
    if (process.env.VIVA_API_URL && process.env.VIVA_API_KEY) {
      console.log(`🔍 Checking Viva Payments API for order: ${orderId}`)

      const response = await fetch(`${process.env.VIVA_API_URL}/checkout/v2/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.VIVA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const vivaData = await response.json()
        console.log(`✅ Viva API response for ${orderId}:`, vivaData)

        return {
          verified: true,
          vivaStatus: vivaData.StatusId,
          vivaData: vivaData
        }
      } else {
        console.warn(`⚠️ Viva API check failed for ${orderId}: ${response.status}`)
      }
    }
  } catch (error) {
    console.warn(`⚠️ Viva API check error for ${orderId}:`, error)
  }

  return { verified: false }
}

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

    console.log(`🔍 Enhanced payment status check for order: ${orderId}`)

    // First, try direct Viva Payments API verification
    const vivaCheck = await checkPaymentStatusWithViva(orderId)

    // Check if payment has been confirmed via webhook/database
    let booking = null
    try {
      booking = await prisma.booking.findFirst({
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
    } catch (dbError) {
      console.warn(`⚠️ Database check failed for ${orderId}:`, dbError)
    }

    // If we have Viva confirmation but no database record, create provisional response
    if (vivaCheck.verified && !booking) {
      const vivaStatusMap: { [key: number]: string } = {
        0: 'PENDING',     // New
        1: 'PENDING',     // Pending
        2: 'PENDING',     // Processing
        3: 'PENDING',     // Partially settled
        4: 'confirmed',   // Settled
        5: 'failed',      // Failed
        6: 'failed',      // Canceled
        7: 'failed',      // Refunded
        8: 'processing',  // Waiting for 3DS response
      }

      const status = vivaStatusMap[vivaCheck.vivaStatus] || 'processing'

      console.log(`✅ Using Viva API status for ${orderId}: ${status}`)

      return NextResponse.json({
        status,
        message: status === 'confirmed' ? 'Payment confirmed via Viva API' : 'Payment processing via Viva API',
        orderId,
        source: 'viva-api',
        vivaData: vivaCheck.vivaData
      })
    }

    if (!booking) {
      // No booking found and Viva check failed - still processing or expired
      const message = vivaCheck.verified
        ? 'Payment confirmed in Viva, not yet synced to database'
        : 'Payment is being processed or order not found'

      return NextResponse.json({
        status: 'processing',
        message,
        orderId,
        source: 'no-booking',
        vivaChecked: vivaCheck.verified
      })
    }

    // Check booking status with enhanced logic
    if (booking.status === 'CONFIRMED') {
      return NextResponse.json({
        status: 'confirmed',
        message: 'Payment confirmed and tickets generated',
        orderId,
        bookingId: booking.id,
        ticketCount: booking.tickets.length,
        customerEmail: booking.customerEmail,
        source: 'database-confirmed'
      })
    }

    if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
      return NextResponse.json({
        status: 'failed',
        message: `Payment was ${booking.status.toLowerCase()}`,
        orderId,
        bookingId: booking.id,
        source: 'database-failed'
      })
    }

    if (booking.status === 'PENDING') {
      // Check if payment has timed out (created more than 15 minutes ago)
      const paymentTimeout = 15 * 60 * 1000 // 15 minutes
      const now = new Date()
      const createdAt = new Date(booking.createdAt)

      if (now.getTime() - createdAt.getTime() > paymentTimeout) {
        // Update booking to expired if database is available
        try {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'EXPIRED' }
          })
        } catch (updateError) {
          console.warn(`⚠️ Failed to update booking status to expired:`, updateError)
        }

        return NextResponse.json({
          status: 'failed',
          message: 'Payment session expired',
          orderId,
          bookingId: booking.id,
          source: 'database-expired'
        })
      }

      // If Viva shows confirmed but database shows pending, trust Viva
      if (vivaCheck.verified && vivaCheck.vivaStatus === 4) { // StatusId 4 = Settled
        return NextResponse.json({
          status: 'confirmed',
          message: 'Payment confirmed (Viva API), updating database...',
          orderId,
          bookingId: booking.id,
          source: 'viva-override',
          vivaData: vivaCheck.vivaData
        })
      }

      return NextResponse.json({
        status: 'processing',
        message: 'Payment is being processed',
        orderId,
        bookingId: booking.id,
        createdAt: booking.createdAt,
        source: 'database-pending',
        vivaChecked: vivaCheck.verified
      })
    }

    // Default to processing for any other status
    return NextResponse.json({
      status: 'processing',
      message: 'Payment is being processed',
      orderId,
      bookingId: booking.id,
      bookingStatus: booking.status,
      source: 'database-default'
    })

  } catch (error) {
    console.error('❌ Error checking payment status:', error)
    return NextResponse.json(
      {
        error: 'Failed to check payment status',
        message: 'An unexpected error occurred while checking payment status',
        orderId: params.orderId
      },
      { status: 500 }
    )
  }
}