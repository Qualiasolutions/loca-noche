import nodemailer from 'nodemailer'

interface TicketData {
  orderId: string
  eventId: string
  customerEmail: string
  customerName: string
  totalAmount: number
  totalQuantity: number
  adultTickets: number
  childTickets: number
  tickets: Array<{
    id: string
    qrCode: string
    type: string
    price: number
  }>
  eventDetails: {
    title: string
    date: string
    venue: string
    address: string
  }
}

interface EmailService {
  sendTicketConfirmation(ticketData: TicketData): Promise<boolean>
  sendTicketQR(ticketData: TicketData): Promise<boolean>
  sendPaymentFailedNotification(customerEmail: string, orderId: string): Promise<boolean>
}

class NodemailerEmailService implements EmailService {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    this.initializeTransporter()
  }

  private initializeTransporter() {
    try {
      if (process.env.EMAIL_SERVICE_HOST && process.env.EMAIL_SERVICE_USER && process.env.EMAIL_SERVICE_PASS) {
        this.transporter = nodemailer.createTransporter({
          host: process.env.EMAIL_SERVICE_HOST,
          port: parseInt(process.env.EMAIL_SERVICE_PORT || '587'),
          secure: process.env.EMAIL_SERVICE_PORT === '465', // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL_SERVICE_USER,
            pass: process.env.EMAIL_SERVICE_PASS,
          },
          tls: {
            rejectUnauthorized: false // Allow self-signed certificates
          }
        })

        console.log('✅ Email service initialized with Nodemailer')
      } else {
        console.warn('⚠️ Email service credentials not configured')
      }
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error)
    }
  }

  async sendTicketConfirmation(ticketData: TicketData): Promise<boolean> {
    if (!this.transporter) {
      console.warn('❌ Email transporter not available')
      return false
    }

    try {
      const htmlContent = this.generateTicketConfirmationHTML(ticketData)

      const mailOptions = {
        from: `"Loca Noche" <${process.env.EMAIL_SERVICE_USER}>`,
        to: ticketData.customerEmail,
        subject: `🎫 Your Loca Noche Tickets - Order ${ticketData.orderId}`,
        html: htmlContent,
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log('✅ Ticket confirmation email sent:', info.messageId)
      return true
    } catch (error) {
      console.error('❌ Failed to send ticket confirmation email:', error)
      return false
    }
  }

  async sendTicketQR(ticketData: TicketData): Promise<boolean> {
    if (!this.transporter) {
      console.warn('❌ Email transporter not available')
      return false
    }

    try {
      const htmlContent = this.generateTicketQRHTML(ticketData)

      const mailOptions = {
        from: `"Loca Noche" <${process.env.EMAIL_SERVICE_USER}>`,
        to: ticketData.customerEmail,
        subject: `🎫 Your Loca Noche QR Tickets - Order ${ticketData.orderId}`,
        html: htmlContent,
        attachments: this.generateQRAttachments(ticketData)
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log('✅ Ticket QR email sent:', info.messageId)
      return true
    } catch (error) {
      console.error('❌ Failed to send ticket QR email:', error)
      return false
    }
  }

  async sendPaymentFailedNotification(customerEmail: string, orderId: string): Promise<boolean> {
    if (!this.transporter) {
      console.warn('❌ Email transporter not available')
      return false
    }

    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 32px;">Payment Issue</h1>
            <p style="color: #e0e0e0; margin: 10px 0 0 0;">Loca Noche Entertainment</p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545;">
            <h2 style="color: #dc3545; margin-top: 0;">Payment Processing Issue</h2>
            <p>Hello,</p>
            <p>We encountered an issue processing your payment for order <strong>${orderId}</strong>.</p>
            <p>Don't worry - no charges were made. You can try again or contact our support team for assistance.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://locanoche.com/tickets" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Try Again</a>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 30px;">
            <h3>Need Help?</h3>
            <p>Contact our support team:</p>
            <ul style="text-align: left;">
              <li>Email: <a href="mailto:support@locanoche.cy">support@locanoche.cy</a></li>
              <li>Phone: +357 XXXX XXXX</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px;">
            <p>© 2024 Loca Noche Entertainment. All rights reserved.</p>
            <p>Cyprus's Premier Entertainment Experience</p>
          </div>
        </div>
      `

      const mailOptions = {
        from: `"Loca Noche Support" <${process.env.EMAIL_SERVICE_USER}>`,
        to: customerEmail,
        subject: `Payment Issue - Order ${orderId}`,
        html: htmlContent,
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log('✅ Payment failed notification sent:', info.messageId)
      return true
    } catch (error) {
      console.error('❌ Failed to send payment failed notification:', error)
      return false
    }
  }

  private generateTicketConfirmationHTML(ticketData: TicketData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Payment Confirmed!</h1>
          <p style="color: #e0e0e0; margin: 10px 0 0 0;">Your Loca Noche tickets are ready</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Order Details</h2>
          <p><strong>Order ID:</strong> ${ticketData.orderId}</p>
          <p><strong>Customer:</strong> ${ticketData.customerName}</p>
          <p><strong>Email:</strong> ${ticketData.customerEmail}</p>
          <p><strong>Total Amount:</strong> €${ticketData.totalAmount.toFixed(2)}</p>
          <p><strong>Total Tickets:</strong> ${ticketData.totalQuantity}</p>
          ${ticketData.adultTickets > 0 ? `<p><strong>Adult Tickets:</strong> ${ticketData.adultTickets}</p>` : ''}
          ${ticketData.childTickets > 0 ? `<p><strong>Child Tickets:</strong> ${ticketData.childTickets}</p>` : ''}
        </div>

        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
          <h3 style="color: #28a745; margin-top: 0;">✅ Payment Status</h3>
          <p>Your payment has been successfully processed and confirmed.</p>
          <p>Your tickets with QR codes will be sent to you in a separate email.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #6c757d;">Thank you for choosing Loca Noche Entertainment!</p>
          <p style="color: #6c757d;">We can't wait to see you at the event.</p>
        </div>

        <div style="text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px;">
          <p>© 2024 Loca Noche Entertainment. All rights reserved.</p>
          <p>Cyprus's Premier Entertainment Experience</p>
        </div>
      </div>
    `
  }

  private generateTicketQRHTML(ticketData: TicketData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 32px;">🎫 Your Tickets Are Ready!</h1>
          <p style="color: #e0e0e0; margin: 10px 0 0 0;">Scan QR codes at venue entrance</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Event Information</h2>
          <p><strong>Event:</strong> ${ticketData.eventDetails.title}</p>
          <p><strong>Date:</strong> ${new Date(ticketData.eventDetails.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Venue:</strong> ${ticketData.eventDetails.venue}</p>
          <p><strong>Address:</strong> ${ticketData.eventDetails.address}</p>
        </div>

        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
          <h3 style="color: #856404; margin-top: 0;">📱 Important Instructions</h3>
          <ul>
            <li>Save this email - you'll need it for entry</li>
            <li>Arrive 30 minutes before the event starts</li>
            <li>Have your QR codes ready for scanning</li>
            <li>Each QR code can only be used once</li>
          </ul>
        </div>

        <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #17a2b8;">
          <h3 style="color: #0c5460; margin-top: 0;">🎟️ Your Tickets</h3>
          <p>Your QR codes are attached to this email as separate images.</p>
          <p>Please keep them safe and do not share them with others.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #6c757d;">We look forward to seeing you there!</p>
          <p style="color: #6c757d;">For questions, contact: support@locanoche.cy</p>
        </div>

        <div style="text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px;">
          <p>© 2024 Loca Noche Entertainment. All rights reserved.</p>
          <p>Cyprus's Premier Entertainment Experience</p>
        </div>
      </div>
    `
  }

  private generateQRAttachments(ticketData: TicketData) {
    // This would generate actual QR code images in a real implementation
    // For now, we'll return an empty array
    return []
  }
}

// Fallback email service that logs instead of sending
class ConsoleEmailService implements EmailService {
  async sendTicketConfirmation(ticketData: TicketData): Promise<boolean> {
    console.log('📧 [MOCK] Sending ticket confirmation:', ticketData)
    return true
  }

  async sendTicketQR(ticketData: TicketData): Promise<boolean> {
    console.log('📧 [MOCK] Sending ticket QR codes:', ticketData)
    return true
  }

  async sendPaymentFailedNotification(customerEmail: string, orderId: string): Promise<boolean> {
    console.log(`📧 [MOCK] Sending payment failed notification to ${customerEmail} for order ${orderId}`)
    return true
  }
}

// Factory function to get the appropriate email service
export function createEmailService(): EmailService {
  if (process.env.EMAIL_SERVICE_HOST && process.env.EMAIL_SERVICE_USER && process.env.EMAIL_SERVICE_PASS) {
    console.log('✅ Using Nodemailer email service')
    return new NodemailerEmailService()
  } else {
    console.log('⚠️ Using console email service (email credentials not configured)')
    return new ConsoleEmailService()
  }
}

export { TicketData, EmailService }