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

    // Get payments with booking and event details
    const payments = await prisma.payment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        booking: {
          include: {
            event: {
              select: {
                title: true
              }
            }
          }
        }
      }
    })

    // Format payments data
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      orderCode: payment.booking?.vivaOrderCode || 'N/A',
      date: payment.createdAt.toISOString(),
      customerName: payment.booking?.customerName || 'N/A',
      amount: Number(payment.amount),
      method: payment.method.replace('_', ' '),
      status: payment.status,
      event: payment.booking?.event.title || 'N/A'
    }))

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