import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateBookingReference } from '@/lib/auth/auth'

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication and filter by user
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const skip = (page - 1) * limit

    const where = {
      ...(userId && { userId }),
      ...(status && { status: status as any }),
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          event: {
            include: {
              venue: true,
            },
          },
          tickets: {
            include: {
              ticketType: true,
            },
          },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ])

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      eventId,
      ticketTypeId,
      quantity,
      customerEmail,
      customerPhone,
      customerName,
      userId,
      notes,
    } = body

    // Validate ticket availability
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: { event: true },
    })

    if (!ticketType) {
      return NextResponse.json(
        { error: 'Ticket type not found' },
        { status: 404 }
      )
    }

    const availableTickets = ticketType.quantity - ticketType.sold
    if (availableTickets < quantity) {
      return NextResponse.json(
        { error: 'Not enough tickets available' },
        { status: 400 }
      )
    }

    // Calculate pricing
    const unitPrice = ticketType.earlyBirdDeadline && 
                     new Date() < ticketType.earlyBirdDeadline && 
                     ticketType.earlyBirdPrice
                     ? ticketType.earlyBirdPrice
                     : ticketType.price

    const subtotal = Number(unitPrice) * quantity
    const serviceFee = subtotal * 0.03 // 3% service fee
    const tax = (subtotal + serviceFee) * 0.19 // 19% VAT
    const totalAmount = subtotal + serviceFee + tax

    // Create booking with reservation timeout (15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    const booking = await prisma.$transaction(async (tx) => {
      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          eventId,
          userId,
          bookingReference: generateBookingReference(),
          quantity,
          subtotal,
          serviceFee,
          tax,
          totalAmount,
          status: 'RESERVED',
          customerEmail,
          customerPhone,
          customerName,
          notes,
          expiresAt,
        },
      })

      // Update ticket type sold count
      await tx.ticketType.update({
        where: { id: ticketTypeId },
        data: {
          sold: {
            increment: quantity,
          },
        },
      })

      // Generate tickets with QR codes
      const tickets = []
      for (let i = 0; i < quantity; i++) {
        const qrCode = `${newBooking.bookingReference}-${i + 1}-${Date.now()}`
        tickets.push({
          bookingId: newBooking.id,
          ticketTypeId,
          qrCode,
          status: 'VALID' as const,
        })
      }

      await tx.ticket.createMany({
        data: tickets,
      })

      return await tx.booking.findUnique({
        where: { id: newBooking.id },
        include: {
          event: {
            include: {
              venue: true,
            },
          },
          tickets: {
            include: {
              ticketType: true,
            },
          },
        },
      })
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}