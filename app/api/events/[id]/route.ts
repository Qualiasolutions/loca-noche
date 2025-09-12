import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        venue: {
          include: {
            sections: true,
          },
        },
        ticketTypes: {
          where: { isActive: true },
        },
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Calculate availability
    const soldTickets = await prisma.ticket.count({
      where: {
        booking: {
          eventId: params.id,
          status: { in: ['CONFIRMED', 'RESERVED'] },
        },
      },
    })

    const availability = {
      total: event.capacity,
      sold: soldTickets,
      available: event.capacity - soldTickets,
      percentage: Math.round((soldTickets / event.capacity) * 100),
    }

    return NextResponse.json({ ...event, availability })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add authentication check for admin/organizer role
    const body = await request.json()
    
    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        ...body,
        eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
        doorsOpen: body.doorsOpen ? new Date(body.doorsOpen) : undefined,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
        updatedAt: new Date(),
      },
      include: {
        venue: true,
        ticketTypes: true,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add authentication check for admin role
    // Check if there are any confirmed bookings
    const bookingsCount = await prisma.booking.count({
      where: {
        eventId: params.id,
        status: { in: ['CONFIRMED', 'RESERVED'] },
      },
    })

    if (bookingsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete event with confirmed bookings' },
        { status: 400 }
      )
    }

    await prisma.event.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}