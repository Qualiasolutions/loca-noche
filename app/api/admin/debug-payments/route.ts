import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Check what's in the Payment table
    const payments = await prisma.payment.findMany({
      include: {
        booking: {
          include: {
            event: {
              select: {
                title: true,
                eventDate: true
              }
            }
          }
        }
      }
    })

    // Check what's in the Booking table
    const bookings = await prisma.booking.findMany({
      include: {
        event: {
          select: {
            title: true
          }
        },
        payment: true
      }
    })

    return NextResponse.json({
      paymentsCount: payments.length,
      payments: payments,
      bookingsCount: bookings.length,
      bookings: bookings.map(b => ({
        id: b.id,
        customerName: b.customerName,
        totalAmount: Number(b.totalAmount),
        status: b.status,
        hasPayment: !!b.paymentId,
        paymentStatus: b.payment?.status
      }))
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: String(error) },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}