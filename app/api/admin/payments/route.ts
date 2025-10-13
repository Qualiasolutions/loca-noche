import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {}
    if (status && status !== 'ALL') {
      where.status = status
    }

    // Get total count for pagination
    const totalPayments = await prisma.payment.count({ where })

    // Get payments without including relations (relation is broken)
    const payments = await prisma.payment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get bookings separately to correlate data (only if payments exist)
    const bookings = payments.length > 0
      ? await prisma.booking.findMany({
          where: {
            paymentId: {
              in: payments.map(p => p.id)
            }
          },
          include: {
            Event: {
              select: {
                title: true
              }
            }
          }
        })
      : []

    // Create a map for quick lookup
    const bookingMap = new Map(bookings.map(b => [b.paymentId!, b]))

    // Format payments data
    const formattedPayments = payments.map(payment => {
      const booking = bookingMap.get(payment.id)
      return {
        id: payment.id,
        orderCode: booking?.vivaOrderCode || 'N/A',
        date: payment.createdAt.toISOString(),
        customerName: booking?.customerName || 'N/A',
        amount: Number(payment.amount),
        method: payment.method.replace('_', ' '),
        status: payment.status,
        event: booking?.Event?.title || 'N/A'
      }
    })

    return NextResponse.json({
      payments: formattedPayments,
      pagination: {
        page,
        limit,
        total: totalPayments,
        totalPages: Math.ceil(totalPayments / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}