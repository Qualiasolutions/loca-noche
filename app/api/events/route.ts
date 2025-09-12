import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const featured = searchParams.get('featured')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')

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

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        include: {
          venue: true,
          ticketTypes: {
            where: { isActive: true },
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

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
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