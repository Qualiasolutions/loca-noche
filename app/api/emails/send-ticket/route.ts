import { NextRequest, NextResponse } from 'next/server'
import { createEmailService, TicketData } from '@/lib/email/ticket-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      orderId,
      eventId,
      customerEmail,
      customerName,
      totalAmount,
      totalQuantity,
      adultTickets,
      childTickets,
      tickets,
      eventDetails
    } = body

    // Validate required fields
    if (!orderId || !customerEmail || !customerName) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, customerEmail, customerName' },
        { status: 400 }
      )
    }

    console.log('📧 Sending ticket confirmation email:', {
      orderId,
      customerEmail,
      customerName,
      totalAmount,
      totalQuantity
    })

    const emailService = createEmailService()

    // Create ticket data object
    const ticketData: TicketData = {
      orderId,
      eventId: eventId || 'event1',
      customerEmail,
      customerName,
      totalAmount: parseFloat(totalAmount) || 0,
      totalQuantity: parseInt(totalQuantity) || 1,
      adultTickets: parseInt(adultTickets) || 0,
      childTickets: parseInt(childTickets) || 0,
      tickets: tickets || [],
      eventDetails: eventDetails || {
        title: 'Loca Noche Event',
        date: new Date().toISOString(),
        venue: 'Loca Noche Venue',
        address: 'Nicosia, Cyprus'
      }
    }

    // Send ticket confirmation email
    const confirmationSent = await emailService.sendTicketConfirmation(ticketData)

    if (!confirmationSent) {
      return NextResponse.json(
        { error: 'Failed to send ticket confirmation email' },
        { status: 500 }
      )
    }

    // Send QR code tickets if available
    let qrSent = false
    if (tickets && tickets.length > 0) {
      qrSent = await emailService.sendTicketQR(ticketData)
    }

    console.log('✅ Email sending completed:', {
      orderId,
      confirmationSent,
      qrSent
    })

    return NextResponse.json({
      success: true,
      orderId,
      customerEmail,
      confirmationSent,
      qrSent,
      message: 'Ticket emails sent successfully'
    })

  } catch (error) {
    console.error('❌ Error sending ticket email:', error)
    return NextResponse.json(
      {
        error: 'Failed to send ticket email',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}