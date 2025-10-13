import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get real stats from database
    const [
      totalRevenueResult,
      totalBookings,
      totalCustomers,
      successfulPayments,
      failedPayments,
      recentBookingsData
    ] = await Promise.all([
      // Sum of all completed payments
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED'
        },
        _sum: {
          amount: true
        }
      }),
      // Count of all confirmed bookings
      prisma.booking.count({
        where: {
          status: 'CONFIRMED'
        }
      }),
      // Count of unique customers
      prisma.booking.groupBy({
        by: ['customerEmail'],
        where: {
          status: 'CONFIRMED'
        }
      }).then(groups => groups.length),
      // Count of successful payments
      prisma.payment.count({
        where: {
          status: 'COMPLETED'
        }
      }),
      // Count of failed payments
      prisma.payment.count({
        where: {
          status: 'FAILED'
        }
      }),
      // Get recent bookings with event details
      prisma.booking.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          event: {
            select: {
              title: true
            }
          },
          tickets: {
            include: {
              ticketType: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })
    ])

    const totalRevenue = totalRevenueResult._sum.amount || 0
    const paymentSuccessRate = (successfulPayments + failedPayments) > 0
      ? (successfulPayments / (successfulPayments + failedPayments)) * 100
      : 0

    // Format recent bookings
    const recentBookings = recentBookingsData.map(booking => {
      const ticketCounts = booking.tickets.reduce((acc, ticket) => {
        acc[ticket.ticketType.name] = (acc[ticket.ticketType.name] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const ticketsString = Object.entries(ticketCounts)
        .map(([name, count]) => `${count} ${name}`)
        .join(', ')

      return {
        id: booking.bookingReference,
        customerName: booking.customerName,
        eventName: booking.event.title,
        tickets: ticketsString,
        amount: Number(booking.totalAmount),
        status: booking.status,
        createdAt: booking.createdAt.toISOString()
      }
    })

    return NextResponse.json({
      totalRevenue: Number(totalRevenue),
      totalBookings,
      totalCustomers,
      paymentSuccessRate: Math.round(paymentSuccessRate * 10) / 10,
      successfulPayments,
      failedPayments,
      recentBookings
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}