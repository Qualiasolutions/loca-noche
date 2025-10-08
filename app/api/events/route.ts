import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set')
      return NextResponse.json(
        {
          error: 'Database configuration error',
          message: 'Database connection not configured',
          events: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
        },
        { status: 500 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const featured = searchParams.get('featured')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')

    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page parameter' },
        { status: 400 }
      )
    }
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit parameter (must be between 1 and 100)' },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    const where: Prisma.EventWhereInput = {
      ...(category && { category: category as any }),
      ...(status && { status: status as any }),
      ...(featured && { featured: featured === 'true' }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ],
      }),
    }

    console.log(`📅 Fetching events with params:`, {
      category, status, featured, search, page, limit, skip
    })

    try {
      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          skip,
          take: limit,
          include: {
            venue: true,
            ticketTypes: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                price: true,
                currency: true,
                quantity: true,
                sold: true,
                maxPerOrder: true,
                description: true,
              }
            },
            _count: {
              select: { bookings: true, reviews: true },
            },
          },
          orderBy: [
            { featured: 'desc' },
            { eventDate: 'asc' },
          ],
        }),
        prisma.event.count({ where }),
      ])

      console.log(`✅ Found ${events.length} events out of ${total} total`)

      return NextResponse.json({
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (dbError) {
      console.error('❌ Database query error:', dbError)

      // Return mock data if database is not available
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Loca Noche Festival',
          slug: 'loca-noche-festival',
          description: 'Experience the ultimate nightlife entertainment in Cyprus',
          shortDescription: 'Cyprus\'s premier entertainment event',
          category: 'FESTIVAL',
          status: 'PUBLISHED',
          eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          capacity: 1000,
          featured: true,
          images: [],
          videos: [],
          tags: ['music', 'nightlife', 'cyprus'],
          venue: {
            id: 'venue-1',
            name: 'Loca Noche Venue',
            address: 'Nicosia, Cyprus',
            city: 'Nicosia',
            country: 'Cyprus',
            capacity: 1000,
          },
          ticketTypes: [
            {
              id: 'adult-1',
              name: 'Adult Ticket',
              price: 10,
              currency: 'EUR',
              quantity: 500,
              sold: 0,
              maxPerOrder: 10,
              description: 'General admission adult ticket'
            },
            {
              id: 'child-1',
              name: 'Child Ticket',
              price: 5,
              currency: 'EUR',
              quantity: 100,
              sold: 0,
              maxPerOrder: 10,
              description: 'General admission child ticket'
            }
          ],
          _count: {
            bookings: 0,
            reviews: 0,
          }
        }
      ]

      return NextResponse.json({
        events: mockEvents,
        pagination: {
          page,
          limit,
          total: mockEvents.length,
          totalPages: 1,
        },
        warning: 'Using mock data due to database connectivity issues'
      })
    }
  } catch (error) {
    console.error('❌ Unexpected error in events API:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching events',
        events: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check for admin/organizer role
    const body = await request.json()
    
    const {
      title,
      slug,
      description,
      shortDescription,
      category,
      venueId,
      eventDate,
      doorsOpen,
      startTime,
      endTime,
      capacity,
      images,
      videos,
      tags,
      featured,
      ticketTypes,
    } = body

    const event = await prisma.event.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
        description,
        shortDescription,
        category,
        venueId,
        eventDate: new Date(eventDate),
        doorsOpen: doorsOpen ? new Date(doorsOpen) : null,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        capacity,
        images: images || [],
        videos: videos || [],
        tags: tags || [],
        featured: featured || false,
        status: 'DRAFT',
        ticketTypes: {
          create: ticketTypes || [],
        },
      },
      include: {
        venue: true,
        ticketTypes: true,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}