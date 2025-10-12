import { Booking, Event, Venue, Ticket, TicketType, User } from '@prisma/client'
import { generateQRCodeImage, generateTicketHTML, generateQRCodeData, TicketData } from '@/lib/tickets/qr-generator'

export interface BookingWithDetails extends Booking {
  event: Event & {
    venue: Venue
  }
  tickets: (Ticket & {
    ticketType: TicketType
  })[]
  user?: User
}

export class EmailService {
  private brevoApiKey: string
  private fromEmail: string
  private fromName: string

  constructor() {
    this.brevoApiKey = process.env.BREVO_API_KEY || ''
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@locanoche.com'
    this.fromName = process.env.EMAIL_FROM_NAME || 'Loca Noche'

    if (!this.brevoApiKey) {
      console.warn('BREVO_API_KEY not configured - emails will not be sent')
    }
  }

  async sendBookingConfirmation(booking: BookingWithDetails): Promise<void> {
    try {
      if (!this.brevoApiKey) {
        console.error('BREVO_API_KEY not configured')
        return
      }

      const subject = `🎭 Booking Confirmed - ${booking.event.title}`
      const emailHTML = this.generateBookingConfirmationHTML(booking)

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: this.fromName, email: this.fromEmail },
          to: [{ email: booking.customerEmail, name: booking.customerName }],
          subject,
          htmlContent: emailHTML,
          replyTo: { email: this.fromEmail, name: this.fromName }
        })
      })

      if (response.ok) {
        console.log(`✅ Booking confirmation email sent to ${booking.customerEmail}`)
        
        // Send admin notification
        await this.sendAdminNotification(booking)
      } else {
        const errorText = await response.text()
        console.error(`❌ Brevo API error:`, errorText)
        throw new Error(`Brevo API error: ${errorText}`)
      }
    } catch (error) {
      console.error('Error sending booking confirmation email:', error)
      throw error
    }
  }

  async sendPaymentFailedNotification(booking: BookingWithDetails): Promise<void> {
    try {
      if (!this.brevoApiKey) {
        console.error('BREVO_API_KEY not configured')
        return
      }

      const subject = `⚠️ Payment Failed - ${booking.event.title}`
      const emailHTML = this.generatePaymentFailedHTML(booking)

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: this.fromName, email: this.fromEmail },
          to: [{ email: booking.customerEmail, name: booking.customerName }],
          subject,
          htmlContent: emailHTML,
          replyTo: { email: this.fromEmail, name: this.fromName }
        })
      })

      if (response.ok) {
        console.log(`✅ Payment failed email sent to ${booking.customerEmail}`)
      } else {
        const errorText = await response.text()
        console.error(`❌ Brevo API error:`, errorText)
        throw new Error(`Brevo API error: ${errorText}`)
      }
    } catch (error) {
      console.error('Error sending payment failed email:', error)
      throw error
    }
  }

  async sendEventReminder(booking: BookingWithDetails): Promise<void> {
    try {
      if (!this.brevoApiKey) {
        console.error('BREVO_API_KEY not configured')
        return
      }

      const subject = `🎭 Event Reminder - ${booking.event.title} Tomorrow!`
      const emailHTML = this.generateEventReminderHTML(booking)

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: this.fromName, email: this.fromEmail },
          to: [{ email: booking.customerEmail, name: booking.customerName }],
          subject,
          htmlContent: emailHTML,
          replyTo: { email: this.fromEmail, name: this.fromName }
        })
      })

      if (response.ok) {
        console.log(`✅ Event reminder email sent to ${booking.customerEmail}`)
      } else {
        const errorText = await response.text()
        console.error(`❌ Brevo API error:`, errorText)
        throw new Error(`Brevo API error: ${errorText}`)
      }
    } catch (error) {
      console.error('Error sending event reminder email:', error)
      throw error
    }
  }

  private async sendAdminNotification(booking: BookingWithDetails): Promise<void> {
    try {
      const subject = `💰 New Booking: ${booking.customerName} - €${Number(booking.totalAmount).toFixed(2)}`
      const adminHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Booking Received</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
            <p><strong>Customer:</strong> ${booking.customerName} (${booking.customerEmail})</p>
            <p><strong>Event:</strong> ${booking.event.title}</p>
            <p><strong>Date:</strong> ${new Date(booking.event.eventDate).toLocaleDateString('en-GB')}</p>
            <p><strong>Venue:</strong> ${booking.event.venue.name}</p>
            <p><strong>Tickets:</strong> ${booking.quantity}</p>
            <p><strong>Amount:</strong> €${Number(booking.totalAmount).toFixed(2)}</p>
            <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
            <p><strong>Customer Phone:</strong> ${booking.customerPhone || 'Not provided'}</p>
          </div>
        </div>
      `

      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Loca Noche Bookings', email: this.fromEmail },
          to: [{ email: 'Locanocheuk@hotmail.com' }],
          subject,
          htmlContent: adminHTML,
          replyTo: { email: booking.customerEmail, name: booking.customerName }
        })
      })

      console.log('✅ Admin notification sent')
    } catch (error) {
      console.error('Error sending admin notification:', error)
    }
  }

  private generateBookingConfirmationHTML(booking: BookingWithDetails): string {
    const eventDate = new Date(booking.event.eventDate)
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Booking Confirmed</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #ef4444, #f59e0b); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .event-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .booking-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .info-item { padding: 15px; background: #f0f0f0; border-radius: 6px; }
          .label { font-size: 12px; color: #666; margin-bottom: 5px; text-transform: uppercase; font-weight: bold; }
          .value { font-size: 16px; color: #333; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
            <p>Thank you for your purchase</p>
          </div>
          
          <div class="content">
            <p>Dear ${booking.customerName},</p>
            <p>Your booking has been confirmed! Here are your event details:</p>
            
            <div class="event-details">
              <h2>${booking.event.title}</h2>
              <p><strong>Venue:</strong> ${booking.event.venue.name}</p>
              <p><strong>Date:</strong> ${eventDate.toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</p>
              <p><strong>Time:</strong> ${eventDate.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}</p>
            </div>

            <div class="booking-info">
              <div class="info-item">
                <div class="label">Booking Reference</div>
                <div class="value">${booking.bookingReference}</div>
              </div>
              <div class="info-item">
                <div class="label">Number of Tickets</div>
                <div class="value">${booking.quantity}</div>
              </div>
              <div class="info-item">
                <div class="label">Total Amount</div>
                <div class="value">€${Number(booking.totalAmount).toFixed(2)}</div>
              </div>
              <div class="info-item">
                <div class="label">Payment Status</div>
                <div class="value">Confirmed ✅</div>
              </div>
            </div>

            <p><strong>Your tickets are attached to this email.</strong> Please save them or take screenshots for entry.</p>
            
            <p>Need help? Contact us:</p>
            <ul>
              <li>📞 Phone: 99107227</li>
              <li>📧 Email: Locanocheuk@hotmail.com</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>© 2025 Loca Noche Entertainment • Nicosia, Cyprus</p>
            <p>See you at the show! 🎭</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generatePaymentFailedHTML(booking: BookingWithDetails): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Failed</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: #dc2626; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Payment Failed</h1>
            <p>Your booking could not be completed</p>
          </div>
          
          <div class="content">
            <p>Dear ${booking.customerName},</p>
            <p>Unfortunately, we were unable to process your payment for:</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>${booking.event.title}</h3>
              <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
              <p><strong>Amount:</strong> €${Number(booking.totalAmount).toFixed(2)}</p>
            </div>

            <p>This could be due to:</p>
            <ul>
              <li>Insufficient funds</li>
              <li>Card expired or blocked</li>
              <li>Technical issue with payment processor</li>
            </ul>

            <p>Your tickets have been released and are now available for other customers.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${booking.event.id}" class="button">
              Try Booking Again
            </a>

            <p>If you continue to experience issues, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generateEventReminderHTML(booking: BookingWithDetails): string {
    const eventDate = new Date(booking.event.eventDate)
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Event Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #ef4444, #f59e0b); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎭 Event Reminder</h1>
            <p>Don't forget about your upcoming event!</p>
          </div>
          
          <div class="content">
            <p>Dear ${booking.customerName},</p>
            <p>This is a friendly reminder that your event is tomorrow:</p>
            
            <div style="background: linear-gradient(135deg, #fef3c7, #fed7aa); padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h2 style="margin: 0 0 10px 0; color: #92400e;">${booking.event.title}</h2>
              <p style="margin: 5px 0; color: #92400e;"><strong>📍 ${booking.event.venue.name}</strong></p>
              <p style="margin: 5px 0; color: #92400e;"><strong>📅 ${eventDate.toLocaleDateString('en-GB')}</strong></p>
              <p style="margin: 5px 0; color: #92400e;"><strong>⏰ ${eventDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</strong></p>
            </div>

            <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
            <p><strong>Number of Tickets:</strong> ${booking.quantity}</p>

            <p><strong>Important Reminders:</strong></p>
            <ul>
              <li>🎫 Bring your tickets (attached to confirmation email)</li>
              <li>🆔 Bring valid ID for entry</li>
              <li>⏰ Arrive early to avoid queues</li>
              <li>📱 Have your QR codes ready for scanning</li>
            </ul>

            <p>We can't wait to see you there! 🎉</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

export const emailService = new EmailService()