import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { vivaPaymentService } from '@/lib/payment/viva-payment'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { EventTypeId, EventData } = body

    // Validate webhook signature (implement this properly in production)
    // const signature = request.headers.get('authorization')
    // if (!vivaPaymentService.validateWebhookSignature(JSON.stringify(body), signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    if (EventTypeId === 1796) { // Payment completed
      const orderCode = EventData?.OrderCode
      
      if (!orderCode) {
        return NextResponse.json({ error: 'Missing order code' }, { status: 400 })
      }

      // Verify payment with Viva Payments
      const paymentVerification = await vivaPaymentService.verifyPayment(orderCode)

      // Find payment record
      const payment = await prisma.payment.findFirst({
        where: { gatewayId: orderCode.toString() },
        include: {
          booking: {
            include: {
              event: true,
              tickets: true,
            },
          },
        },
      })

      if (!payment) {
        console.error('Payment not found for order code:', orderCode)
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      // Update payment status based on verification
      const isSuccessful = paymentVerification.stateId === 6 // Captured
      
      await prisma.$transaction(async (tx) => {
        // Update payment
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: isSuccessful ? 'COMPLETED' : 'FAILED',
            processedAt: new Date(),
            gatewayResponse: paymentVerification as any,
            ...(paymentVerification.transactionId && {
              gatewayId: paymentVerification.transactionId,
            }),
          },
        })

        // Update booking
        await tx.booking.update({
          where: { id: payment.booking!.id },
          data: {
            status: isSuccessful ? 'CONFIRMED' : 'CANCELLED',
            completedAt: isSuccessful ? new Date() : null,
          },
        })

        if (isSuccessful) {
          // Confirm tickets
          await tx.ticket.updateMany({
            where: { bookingId: payment.booking!.id },
            data: { status: 'VALID' },
          })

          // Create notification
          if (payment.booking!.userId) {
            await tx.notification.create({
              data: {
                userId: payment.booking!.userId,
                type: 'BOOKING_CONFIRMATION',
                title: 'Booking Confirmed',
                message: `Your booking for ${payment.booking!.event.title} has been confirmed.`,
                data: {
                  bookingId: payment.booking!.id,
                  eventId: payment.booking!.eventId,
                },
              },
            })
          }

          // TODO: Send confirmation email with tickets
        } else {
          // Release reserved tickets
          await tx.ticket.updateMany({
            where: { bookingId: payment.booking!.id },
            data: { status: 'CANCELLED' },
          })

          // Decrease sold count on ticket types
          const ticketsByType = payment.booking!.tickets.reduce((acc, ticket) => {
            acc[ticket.ticketTypeId] = (acc[ticket.ticketTypeId] || 0) + 1
            return acc
          }, {} as Record<string, number>)

          for (const [ticketTypeId, count] of Object.entries(ticketsByType)) {
            await tx.ticketType.update({
              where: { id: ticketTypeId },
              data: {
                sold: {
                  decrement: count,
                },
              },
            })
          }
        }
      })

      console.log(`Payment ${isSuccessful ? 'confirmed' : 'failed'} for booking ${payment.booking!.bookingReference}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}