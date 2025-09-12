import QRCode from 'qrcode'
import { Ticket, Booking, Event, TicketType, Venue } from '@prisma/client'

export interface TicketData {
  ticket: Ticket & {
    booking: Booking
    ticketType: TicketType
  }
  event: Event & {
    venue: Venue
  }
}

export interface QRCodeData {
  ticketId: string
  bookingReference: string
  eventId: string
  eventTitle: string
  venue: string
  eventDate: string
  qrCode: string
  verificationUrl: string
}

export function generateQRCodeData(ticketData: TicketData): QRCodeData {
  const { ticket, event } = ticketData
  
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${ticket.qrCode}`
  
  return {
    ticketId: ticket.id,
    bookingReference: ticket.booking.bookingReference,
    eventId: event.id,
    eventTitle: event.title,
    venue: event.venue.name,
    eventDate: event.eventDate.toISOString(),
    qrCode: ticket.qrCode,
    verificationUrl,
  }
}

export async function generateQRCodeImage(data: QRCodeData): Promise<string> {
  try {
    const qrCodeString = JSON.stringify({
      id: data.ticketId,
      ref: data.bookingReference,
      event: data.eventId,
      qr: data.qrCode,
      url: data.verificationUrl,
    })

    const qrCodeDataURL = await QRCode.toDataURL(qrCodeString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 200,
    })

    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

export function generateTicketHTML(ticketData: TicketData, qrCodeImage: string): string {
  const { ticket, event } = ticketData
  const eventDate = new Date(event.eventDate)
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ticket - ${event.title}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .ticket {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .ticket-header {
          background: linear-gradient(135deg, #ef4444, #f59e0b);
          color: white;
          padding: 20px;
          text-align: center;
        }
        .ticket-body {
          padding: 30px;
        }
        .event-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .venue-name {
          font-size: 16px;
          opacity: 0.9;
        }
        .ticket-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }
        .info-item {
          padding: 10px;
          background: #f9f9f9;
          border-radius: 6px;
        }
        .info-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
          text-transform: uppercase;
          font-weight: bold;
        }
        .info-value {
          font-size: 16px;
          color: #333;
        }
        .qr-section {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px dashed #ddd;
        }
        .qr-code {
          margin: 20px 0;
        }
        .booking-ref {
          font-size: 20px;
          font-weight: bold;
          color: #ef4444;
          margin-bottom: 10px;
        }
        .instructions {
          font-size: 12px;
          color: #666;
          margin-top: 20px;
        }
        @media print {
          body { margin: 0; padding: 0; background: white; }
          .ticket { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="ticket-header">
          <div class="event-title">${event.title}</div>
          <div class="venue-name">${event.venue.name}</div>
        </div>
        
        <div class="ticket-body">
          <div class="ticket-info">
            <div class="info-item">
              <div class="info-label">Date</div>
              <div class="info-value">${eventDate.toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Time</div>
              <div class="info-value">${eventDate.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Ticket Type</div>
              <div class="info-value">${ticket.ticketType.name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Venue</div>
              <div class="info-value">${event.venue.name}</div>
            </div>
          </div>

          <div class="qr-section">
            <div class="booking-ref">${ticket.booking.bookingReference}</div>
            <div class="qr-code">
              <img src="${qrCodeImage}" alt="QR Code" style="width: 150px; height: 150px;" />
            </div>
            <div style="font-size: 14px; color: #333;">
              Ticket ID: ${ticket.id}
            </div>
            <div class="instructions">
              Please present this QR code at the venue for entry.<br>
              Screenshot or print this ticket for faster check-in.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}