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

    // Return hardcoded Oktoberfest events since database is not available
    const mockEvents = [
      {
        id: '1',
        title: 'Lakatamia Hofbräu Oktoberfest - Minus One',
        slug: 'oktoberfest-minus-one-2024',
        description: 'Lakatamia Hofbräu in München Oktoberfest presents Minus One - An authentic German beer festival experience with live music from Cyprus\'s beloved rock band Minus One.',
        shortDescription: 'Authentic Bavarian festivities with Minus One live performance',
        category: 'FESTIVAL',
        status: 'PUBLISHED',
        eventDate: '2024-10-11T17:00:00Z',
        startTime: '2024-10-11T17:00:00Z',
        endTime: '2024-10-12T00:00:00Z',
        capacity: 300,
        featured: true,
        images: ['https://i.ibb.co/DDXtKYmG/NICOSIA-Instagram-Post-45-7.png'],
        videos: [],
        tags: ['oktoberfest', 'minus-one', 'bavarian', 'beer-festival', 'live-music'],
        venue: {
          id: 'river-park-lakatamia',
          name: 'River Park Lakatamia',
          address: 'Lakatamia Avenue',
          city: 'Lakatamia',
          country: 'Cyprus',
          capacity: 500,
        },
        ticketTypes: [
          {
            id: 'adult-1',
            name: 'Adult Ticket',
            price: 10,
            currency: 'EUR',
            quantity: 250,
            sold: 0,
            maxPerOrder: 20,
            description: 'General admission - Adult'
          },
          {
            id: 'child-1',
            name: 'Child Ticket (Under 12)',
            price: 5,
            currency: 'EUR',
            quantity: 50,
            sold: 0,
            maxPerOrder: 20,
            description: 'General admission - Child'
          }
        ],
        _count: {
          bookings: 0,
          reviews: 0,
        }
      },
      {
        id: '2',
        title: 'Lakatamia Hofbräu Oktoberfest - Giannis Margaris',
        slug: 'oktoberfest-giannis-margaris-2024',
        description: 'Lakatamia Hofbräu in München Oktoberfest presents Giannis Margaris - Traditional Bavarian celebration with live entertainment by popular Greek-Cypriot performer Giannis Margaris.',
        shortDescription: 'Bavarian celebration with Giannis Margaris live performance',
        category: 'FESTIVAL',
        status: 'PUBLISHED',
        eventDate: '2024-10-12T17:00:00Z',
        startTime: '2024-10-12T17:00:00Z',
        endTime: '2024-10-13T00:00:00Z',
        capacity: 300,
        featured: true,
        images: ['https://i.ibb.co/S42KhYHF/NICOSIA-Instagram-Post-45-6.png'],
        videos: [],
        tags: ['oktoberfest', 'giannis-margaris', 'bavarian', 'beer-festival', 'live-music'],
        venue: {
          id: 'river-park-lakatamia',
          name: 'River Park Lakatamia',
          address: 'Lakatamia Avenue',
          city: 'Lakatamia',
          country: 'Cyprus',
          capacity: 500,
        },
        ticketTypes: [
          {
            id: 'adult-2',
            name: 'Adult Ticket',
            price: 10,
            currency: 'EUR',
            quantity: 250,
            sold: 0,
            maxPerOrder: 20,
            description: 'General admission - Adult'
          },
          {
            id: 'child-2',
            name: 'Child Ticket (Under 12)',
            price: 5,
            currency: 'EUR',
            quantity: 50,
            sold: 0,
            maxPerOrder: 20,
            description: 'General admission - Child'
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
    })
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