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

    // Get customers with aggregated booking data
    const customersData = await prisma.$queryRaw`
      WITH customer_stats AS (
        SELECT
          b.customer_email as email,
          b.customer_name as name,
          b.customer_phone as phone,
          MIN(b.created_at) as member_since,
          MAX(b.created_at) as last_booking_date,
          COUNT(DISTINCT b.id) as total_bookings,
          COALESCE(SUM(b.total_amount), 0) as total_spent,
          MAX(e.title) as last_event
        FROM bookings b
        LEFT JOIN events e ON b.event_id = e.id
        WHERE b.status = 'CONFIRMED'
        GROUP BY b.customer_email, b.customer_name, b.customer_phone
      )
      SELECT * FROM customer_stats
      ORDER BY last_booking_date DESC
    ` as Array<{
      email: string
      name: string
      phone: string | null
      member_since: Date
      last_booking_date: Date
      total_bookings: number
      total_spent: number
      last_event: string | null
    }>

    // Filter customers if search term provided
    let filteredCustomers = customersData
    if (search) {
      const searchLower = search.toLowerCase()
      filteredCustomers = customersData.filter(customer =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        (customer.phone && customer.phone.includes(search))
      )
    }

    // Get total count for pagination
    const totalCustomers = filteredCustomers.length

    // Paginate results
    const startIndex = (page - 1) * limit
    const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + limit)

    // Format customers data
    const formattedCustomers = paginatedCustomers.map((customer, index) => ({
      id: `customer-${index}`,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || 'N/A',
      totalBookings: customer.total_bookings,
      totalSpent: Number(customer.total_spent),
      lastEvent: customer.last_event || 'N/A',
      memberSince: customer.member_since.toISOString()
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