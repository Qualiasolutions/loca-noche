import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const timeframe = searchParams.get('timeframe') || 'all' // all, today, week, month

    // Calculate date range
    let dateFilter: any = {}
    const now = new Date()

    switch (timeframe) {
      case 'today':
        dateFilter.gte = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        dateFilter.gte = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        dateFilter.gte = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    // Get comprehensive payment analytics
    const [
      totalRevenue,
      successfulPayments,
      failedPayments,
      pendingPayments,
      refundedPayments,
      totalTransactions,
      averageTransactionValue,
      paymentsByStatus,
      paymentsByMethod,
      recentCompletedPayments,
      paymentTrends,
      conversionRate
    ] = await Promise.all([
      // Total revenue from completed payments
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: dateFilter
        },
        _sum: {
          amount: true
        }
      }),

      // Count successful payments
      prisma.payment.count({
        where: {
          status: 'COMPLETED',
          createdAt: dateFilter
        }
      }),

      // Count failed payments
      prisma.payment.count({
        where: {
          status: 'FAILED',
          createdAt: dateFilter
        }
      }),

      // Count pending payments
      prisma.payment.count({
        where: {
          status: 'PENDING',
          createdAt: dateFilter
        }
      }),

      // Count refunded payments
      prisma.payment.count({
        where: {
          status: 'REFUNDED',
          createdAt: dateFilter
        }
      }),

      // Total payment attempts
      prisma.payment.count({
        where: {
          createdAt: dateFilter
        }
      }),

      // Average transaction value
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: dateFilter
        },
        _avg: {
          amount: true
        }
      }),

      // Payments grouped by status
      prisma.payment.groupBy({
        by: ['status'],
        where: {
          createdAt: dateFilter
        },
        _count: true,
        _sum: {
          amount: true
        }
      }),

      // Payments grouped by method
      prisma.payment.groupBy({
        by: ['method'],
        where: {
          status: 'COMPLETED',
          createdAt: dateFilter
        },
        _count: true,
        _sum: {
          amount: true
        }
      }),

      // Recent completed payments with full details
      prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: dateFilter
        },
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
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
      }),

      // Payment trends (last 7 days)
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as successful_transactions,
          COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount END), 0) as daily_revenue
        FROM "Payment"
        WHERE created_at >= ${dateFilter.gte || new Date(0)}
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date DESC
        LIMIT 7
      `,

      // Conversion rate (bookings vs completed payments)
      prisma.booking.aggregate({
        where: {
          createdAt: dateFilter
        }
      }).then(async (bookingData) => {
        const completedPaymentCount = await prisma.payment.count({
          where: {
            status: 'COMPLETED',
            createdAt: dateFilter
          }
        })

        const totalBookings = await prisma.booking.count({
          where: {
            createdAt: dateFilter
          }
        })

        return {
          totalBookings,
          completedPayments: completedPaymentCount,
          conversionRate: totalBookings > 0 ? (completedPaymentCount / totalBookings) * 100 : 0
        }
      })
    ])

    // Format recent payments
    const formattedRecentPayments = recentCompletedPayments.map(payment => ({
      id: payment.id,
      orderCode: payment.booking?.vivaOrderCode || 'N/A',
      date: payment.createdAt.toISOString(),
      customerName: payment.booking?.customerName || 'N/A',
      customerEmail: payment.booking?.customerEmail || 'N/A',
      amount: Number(payment.amount),
      method: payment.method.replace('_', ' '),
      status: payment.status,
      event: payment.booking?.event.title || 'N/A',
      eventDate: payment.booking?.event.eventDate || null,
      processedAt: payment.processedAt?.toISOString() || null
    }))

    // Format payment trends
    const formattedTrends = (paymentTrends as any[]).map(trend => ({
      date: trend.date,
      totalTransactions: Number(trend.total_transactions),
      successfulTransactions: Number(trend.successful_transactions),
      dailyRevenue: Number(trend.daily_revenue),
      successRate: Number(trend.total_transactions) > 0
        ? (Number(trend.successful_transactions) / Number(trend.total_transactions)) * 100
        : 0
    }))

    return NextResponse.json({
      summary: {
        totalRevenue: Number(totalRevenue._sum.amount || 0),
        successfulPayments,
        failedPayments,
        pendingPayments,
        refundedPayments,
        totalTransactions,
        averageTransactionValue: Number(averageTransactionValue._avg.amount || 0),
        paymentSuccessRate: totalTransactions > 0 ? (successfulPayments / totalTransactions) * 100 : 0,
        conversionRate: conversionRate.conversionRate
      },

      breakdown: {
        byStatus: paymentsByStatus.map(item => ({
          status: item.status,
          count: item._count,
          totalAmount: Number(item._sum.amount || 0)
        })),
        byMethod: paymentsByMethod.map(item => ({
          method: item.method,
          count: item._count,
          totalAmount: Number(item._sum.amount || 0)
        }))
      },

      recentPayments: formattedRecentPayments,
      trends: formattedTrends,

      metrics: {
        totalBookings: conversionRate.totalBookings,
        bookingToPaymentConversion: conversionRate.conversionRate,
        paymentFailureRate: totalTransactions > 0 ? (failedPayments / totalTransactions) * 100 : 0,
        refundRate: successfulPayments > 0 ? (refundedPayments / successfulPayments) * 100 : 0
      }
    })

  } catch (error) {
    console.error('Error fetching payment analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment analytics' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}