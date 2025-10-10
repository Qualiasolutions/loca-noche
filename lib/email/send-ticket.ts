import nodemailer from 'nodemailer'
import QRCode from 'qrcode'

interface TicketEmailData {
  to: string
  customerName: string
  eventName: string
  eventDate: string
  eventTime: string
  venue: string
  bookingReference: string
  tickets: Array<{
    ticketId: string
    qrCodeDataUrl?: string
    qrData: any
  }>
  totalAmount: number
}

// Create reusable transporter
const createTransporter = () => {
  const emailHost = process.env.EMAIL_SERVICE_HOST || 'smtp.gmail.com'
  const emailPort = parseInt(process.env.EMAIL_SERVICE_PORT || '587')
  const emailUser = process.env.EMAIL_SERVICE_USER
  const emailPass = process.env.EMAIL_SERVICE_PASS

  if (!emailUser || !emailPass) {
    console.warn('Email credentials not configured')
    return null
  }

  return nodemailer.createTransporter({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465,
    auth: {
      user: emailUser,
      pass: emailPass
    }
  })
}

export async function sendTicketEmail(data: TicketEmailData): Promise<boolean> {
  try {
    const transporter = createTransporter()
    if (!transporter) {
      console.error('Email transporter not configured')
      return false
    }

    // Generate QR codes if not provided
    const ticketsWithQR = await Promise.all(
      data.tickets.map(async (ticket) => {
        let qrCodeDataUrl = ticket.qrCodeDataUrl

        if (!qrCodeDataUrl) {
          // Generate QR code
          qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(ticket.qrData), {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })
        }

        return {
          ...ticket,
          qrCodeDataUrl
        }
      })
    )

    // Create HTML email content
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Your Oktoberfest Tickets</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f7f7f7;
            }
            .container {
              background: white;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #f0f0f0;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              background: linear-gradient(135deg, #ff0000 0%, #ffcc00 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            h1 {
              color: #2c3e50;
              margin: 20px 0;
              font-size: 24px;
            }
            .event-details {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin: 10px 0;
              padding: 5px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #6c757d;
            }
            .detail-value {
              color: #212529;
            }
            .ticket-section {
              margin: 30px 0;
              padding: 20px;
              border: 2px dashed #dee2e6;
              border-radius: 8px;
              background: #fafafa;
            }
            .ticket-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .ticket-id {
              font-size: 18px;
              font-weight: bold;
              color: #28a745;
              margin-bottom: 15px;
            }
            .qr-code {
              text-align: center;
              margin: 20px 0;
            }
            .qr-code img {
              border: 10px solid white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .instructions {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #f0f0f0;
              color: #6c757d;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #ff0000 0%, #ffcc00 100%);
              color: white;
              text-decoration: none;
              border-radius: 25px;
              font-weight: bold;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">LOCA NOCHE</div>
              <h1>Your Oktoberfest Tickets Are Ready! 🎉</h1>
            </div>

            <p>Dear ${data.customerName},</p>
            <p>Thank you for your purchase! Your tickets for <strong>${data.eventName}</strong> have been confirmed.</p>

            <div class="event-details">
              <h2 style="margin-top: 0;">Event Details</h2>
              <div class="detail-row">
                <span class="detail-label">Booking Reference:</span>
                <span class="detail-value">${data.bookingReference}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Event:</span>
                <span class="detail-value">${data.eventName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${data.eventDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${data.eventTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Venue:</span>
                <span class="detail-value">${data.venue}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Number of Tickets:</span>
                <span class="detail-value">${data.tickets.length}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Amount Paid:</span>
                <span class="detail-value">€${data.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            ${ticketsWithQR.map((ticket, index) => `
              <div class="ticket-section">
                <div class="ticket-header">
                  <div class="ticket-id">TICKET ${index + 1} - ${ticket.ticketId}</div>
                </div>
                <div class="qr-code">
                  <img src="${ticket.qrCodeDataUrl}" alt="QR Code for ${ticket.ticketId}" width="250" height="250">
                </div>
                <p style="text-align: center; color: #6c757d; font-size: 14px;">
                  Present this QR code at the venue entrance
                </p>
              </div>
            `).join('')}

            <div class="instructions">
              <h3 style="margin-top: 0;">Important Information</h3>
              <ul>
                <li>Please arrive at least 15 minutes before the event starts</li>
                <li>Each QR code is unique and can only be used once</li>
                <li>You can show the QR codes from your phone or print this email</li>
                <li>Keep your tickets safe - they cannot be reissued if lost</li>
                <li>Valid ID may be required at the entrance</li>
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="https://locanoche.com" class="button">Visit Our Website</a>
            </div>

            <div class="footer">
              <p>If you have any questions, please contact us at <a href="mailto:support@locanoche.com">support@locanoche.com</a></p>
              <p>© 2024 Loca Noche Entertainment. All rights reserved.</p>
              <p style="margin-top: 20px; font-size: 12px;">
                This is an automated email. Please do not reply directly to this message.
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email
    const info = await transporter.sendMail({
      from: `"Loca Noche Tickets" <${process.env.EMAIL_SERVICE_USER}>`,
      to: data.to,
      subject: `Your Oktoberfest Tickets - ${data.eventName} - Booking ${data.bookingReference}`,
      text: `Your tickets for ${data.eventName} have been confirmed. Please check the HTML version of this email to see your QR codes.`,
      html: html
    })

    console.log('✅ Ticket email sent:', info.messageId)
    return true

  } catch (error) {
    console.error('❌ Error sending ticket email:', error)
    return false
  }
}