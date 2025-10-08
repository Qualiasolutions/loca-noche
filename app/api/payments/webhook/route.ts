import { NextRequest, NextResponse } from 'next/server'
import { n8nPaymentService } from '@/lib/payment/n8n-payment'
import { createEmailService, TicketData } from '@/lib/email/ticket-service'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('📥 Received Viva Payments webhook:', {
      eventTypeId: body.EventTypeId,
      orderCode: body.EventData?.OrderCode || body.OrderCode,
      timestamp: new Date().toISOString()
    })

    // Forward to N8N for QR code generation and processing
    const n8nWebhookUrl = 'https://tasos8.app.n8n.cloud/webhook/loca-noche-payment-success'

    let n8nResponse = null
    let n8nSuccess = false

    try {
      console.log('🔄 Forwarding to N8N for QR generation...')

      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LocaNoche-Webhook-Forwarder/1.0'
        },
        body: JSON.stringify({
          ...body,
          timestamp: new Date().toISOString(),
          source: 'viva-webhook'
        })
      })

      if (response.ok) {
        n8nResponse = await response.json()
        n8nSuccess = true
        console.log('✅ N8N workflow response:', n8nResponse)
      } else {
        console.error('❌ Failed to forward to N8N:', {
          status: response.status,
          statusText: response.statusText
        })
      }
    } catch (n8nError) {
      console.error('❌ N8N forwarding error:', n8nError)
    }

    // Try to send confirmation email with or without N8N response
    let emailSent = false
    try {
      // Get order details from webhook or database
      const orderCode = body.EventData?.OrderCode || body.OrderCode
      if (orderCode) {
        const bookingData = await getBookingData(orderCode)
        if (bookingData) {
          const emailService = createEmailService()

          // Send ticket confirmation email
          emailSent = await emailService.sendTicketConfirmation(bookingData)

          // If we have QR codes from N8N, send those too
          if (emailSent && n8nSuccess && n8nResponse?.qrCodes) {
            const ticketDataWithQR = {
              ...bookingData,
              tickets: n8nResponse.qrCodes
            }
            await emailService.sendTicketQR(ticketDataWithQR)
          }

          console.log('📧 Email sending completed:', { orderCode, emailSent, n8nSuccess })
        }
      }
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError)
    }

    // Update database with payment confirmation if possible
    try {
      await updateBookingStatus(body)
    } catch (dbError) {
      console.error('❌ Database update error:', dbError)
    }

    return NextResponse.json({
      received: true,
      processed: true,
      n8nSuccess,
      emailSent,
      n8nResponse: n8nSuccess ? n8nResponse : null,
      message: n8nSuccess && emailSent
        ? 'Payment processed, QR codes generated, and emails sent'
        : 'Payment processed with partial success'
    })

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to get booking data from database
async function getBookingData(orderCode: string): Promise<TicketData | null> {
  try {
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { bookingReference: orderCode },
          { vivaOrderCode: orderCode }
        ]
      },
      include: {
        tickets: true,
        event: {
          include: {
            venue: true
          }
        }
      }
    })

    if (!booking) {
      console.warn(`⚠️ No booking found for order code: ${orderCode}`)
      return null
    }

    return {
      orderId: orderCode,
      eventId: booking.eventId,
      customerEmail: booking.customerEmail,
      customerName: booking.customerName,
      totalAmount: parseFloat(booking.totalAmount.toString()),
      totalQuantity: booking.quantity,
      adultTickets: booking.tickets.filter(t => t.ticketType.name.toLowerCase().includes('adult')).length,
      childTickets: booking.tickets.filter(t => t.ticketType.name.toLowerCase().includes('child')).length,
      tickets: booking.tickets.map(ticket => ({
        id: ticket.id,
        qrCode: ticket.qrCode,
        type: ticket.ticketType.name,
        price: parseFloat(ticket.ticketType.price.toString())
      })),
      eventDetails: {
        title: booking.event.title,
        date: booking.event.eventDate.toISOString(),
        venue: booking.event.venue.name,
        address: `${booking.event.venue.address}, ${booking.event.venue.city}, ${booking.event.venue.country}`
      }
    }
  } catch (error) {
    console.error('❌ Error getting booking data:', error)
    return null
  }
}

// Helper function to update booking status
async function updateBookingStatus(webhookData: any) {
  try {
    const orderCode = webhookData.EventData?.OrderCode || webhookData.OrderCode
    const eventTypeId = webhookData.EventTypeId

    if (!orderCode) return

    // Map Viva event types to booking statuses
    const statusMap: { [key: number]: string } = {
      1848: 'CONFIRMED', // Payment Success
      1849: 'FAILED',    // Payment Failed
      1850: 'FAILED',    // Payment Cancelled
      1851: 'REFUNDED'   // Payment Refunded
    }

    const bookingStatus = statusMap[eventTypeId]
    if (!bookingStatus) {
      console.warn(`⚠️ Unknown event type: ${eventTypeId}`)
      return
    }

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { bookingReference: orderCode },
          { vivaOrderCode: orderCode }
        ]
      }
    })

    if (booking && booking.status !== bookingStatus) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: bookingStatus as any,
          updatedAt: new Date()
        }
      })

      console.log(`✅ Updated booking ${booking.id} status to ${bookingStatus}`)
    }
  } catch (error) {
    console.error('❌ Error updating booking status:', error)
  }
}