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
    const search = searchParams.get('search')

    // Get all bookings first
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED'
      },
      include: {
        event: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Aggregate customers from bookings
    const customerMap = new Map<string, {
      name: string
      email: string
      phone: string | null
      memberSince: Date
      lastBookingDate: Date
      totalBookings: number
      totalSpent: number
      lastEvent: string | null
    }>()

    bookings.forEach(booking => {
      const key = booking.customerEmail
      if (customerMap.has(key)) {
        const customer = customerMap.get(key)!
        customer.totalBookings += 1
        customer.totalSpent += Number(booking.totalAmount)
        if (booking.createdAt > customer.lastBookingDate) {
          customer.lastBookingDate = booking.createdAt
          customer.lastEvent = booking.event?.title || 'N/A'
        }
      } else {
        customerMap.set(key, {
          name: booking.customerName,
          email: booking.customerEmail,
          phone: booking.customerPhone,
          memberSince: booking.createdAt,
          lastBookingDate: booking.createdAt,
          totalBookings: 1,
          totalSpent: Number(booking.totalAmount),
          lastEvent: booking.event?.title || 'N/A'
        })
      }
    })

    let customersData = Array.from(customerMap.values())

    // Filter customers if search term provided
    if (search) {
      const searchLower = search.toLowerCase()
      customersData = customersData.filter(customer =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        (customer.phone && customer.phone.includes(search))
      )
    }

    // Get total count for pagination
    const totalCustomers = customersData.length

    // Paginate results
    const startIndex = (page - 1) * limit
    const paginatedCustomers = customersData.slice(startIndex, startIndex + limit)

    // Format customers data
    const formattedCustomers = paginatedCustomers.map((customer, index) => ({
      id: `customer-${startIndex + index}`,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || 'N/A',
      totalBookings: customer.totalBookings,
      totalSpent: customer.totalSpent,
      lastEvent: customer.lastEvent,
      memberSince: customer.memberSince.toISOString()
    }))

    return NextResponse.json({
      customers: formattedCustomers,
      pagination: {
        page,
        limit,
        total: totalCustomers,
        totalPages: Math.ceil(totalCustomers / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}