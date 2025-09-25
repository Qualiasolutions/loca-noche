import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔍 Validation request received:', { body })

    const { ticketNumber, ticketId, qrCode, validatorId, deviceInfo } = body

    // Find the ticket using various identifiers
    let ticket = null
    
    if (qrCode) {
      ticket = await prisma.ticket.findUnique({
        where: { qrCode },
        include: {
          booking: {
            include: {
              event: {
                include: {
                  venue: true
                }
              }
            }
          },
          ticketType: true
        }
      })
    } else if (ticketId) {
      ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          booking: {
            include: {
              event: {
                include: {
                  venue: true
                }
              }
            }
          },
          ticketType: true
        }
      })
    } else if (ticketNumber) {
      // Try to find by QR code that might match the ticket number pattern
      ticket = await prisma.ticket.findFirst({
        where: {
          OR: [
            { qrCode: ticketNumber },
            { qrCode: { contains: ticketNumber } }
          ]
        },
        include: {
          booking: {
            include: {
              event: {
                include: {
                  venue: true
                }
              }
            }
          },
          ticketType: true
        }
      })
    }

    if (!ticket) {
      console.log('❌ Ticket not found for:', { qrCode, ticketId, ticketNumber })
      return NextResponse.json({
        valid: false,
        message: 'Ticket not found',
        error: 'No ticket exists with this ID',
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    console.log('✅ Ticket found:', { id: ticket.id, qrCode: ticket.qrCode, status: ticket.status })

    // Check if ticket is valid
    if (ticket.status !== 'VALID') {
      return NextResponse.json({
        valid: false,
        message: `Ticket is ${ticket.status}`,
        error: ticket.status === 'USED' ? 'This ticket has already been used' : 'This ticket is not valid',
        ticket: {
          id: ticket.id,
          status: ticket.status,
          usedAt: ticket.usedAt
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Check if booking is confirmed
    if (ticket.booking.status !== 'CONFIRMED') {
      return NextResponse.json({
        valid: false,
        message: 'Booking not confirmed',
        error: `Booking status is ${ticket.booking.status}`,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Check event date (allow entry 2 hours before event)
    const eventDate = new Date(ticket.booking.event.eventDate)
    const now = new Date()
    const twoHoursBefore = new Date(eventDate.getTime() - 2 * 60 * 60 * 1000)
    
    if (now < twoHoursBefore) {
      return NextResponse.json({
        valid: false,
        message: 'Too early',
        error: `Event starts at ${eventDate.toLocaleString()}. Entry allowed from ${twoHoursBefore.toLocaleString()}`,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Mark ticket as used
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: 'USED',
        usedAt: new Date(),
        validatedBy: validatorId || 'STAFF'
      }
    })

    // Log validation
    console.log(`✅ Ticket ${ticket.qrCode} validated for ${ticket.booking.customerName}`)

    return NextResponse.json({
      valid: true,
      message: 'Ticket is valid',
      ticket: {
        id: ticket.id,
        number: ticket.qrCode,
        customerName: ticket.booking.customerName,
        eventName: ticket.booking.event.title,
        eventDate: ticket.booking.event.eventDate,
        venue: ticket.booking.event.venue.name,
        ticketType: ticket.ticketType.name,
        validatedAt: updatedTicket.usedAt
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('🚨 Ticket validation error:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    })

    // Return more specific error information for debugging
    return NextResponse.json({
      valid: false,
      message: 'Validation failed',
      error: process.env.NODE_ENV === 'development'
        ? `${error.message} ${error.code ? `(${error.code})` : ''}`
        : 'Internal server error',
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { debug: { code: error.code, meta: error.meta } })
    }, { status: 500 })
  } finally {
    // Clean up Prisma connection
    await prisma.$disconnect()
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Ticket Validation API',
    endpoints: {
      POST: '/api/tickets/validate - Validate a ticket'
    },
    parameters: {
      qrCode: 'QR code from ticket',
      ticketId: 'Database ticket ID',
      ticketNumber: 'Ticket number',
      validatorId: 'Staff member ID',
      deviceInfo: 'Device information'
    }
  })
}