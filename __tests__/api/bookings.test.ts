import { POST } from '@/app/api/bookings/route'
import { NextRequest } from 'next/server'

// Mock Prisma client with transaction support
const mockTransaction = jest.fn()
const mockPrisma = {
  ticketType: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  booking: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  ticket: {
    createMany: jest.fn(),
  },
  $transaction: mockTransaction,
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}))

jest.mock('@/lib/auth/auth', () => ({
  generateBookingReference: () => 'LN123ABC456'
}))

describe('/api/bookings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    it('should create a booking successfully', async () => {
      const mockTicketType = {
        id: 'ticket-type-1',
        name: 'Standard',
        price: 25,
        quantity: 100,
        sold: 10,
        earlyBirdDeadline: null,
        earlyBirdPrice: null,
        event: {
          id: 'event-1',
          title: 'Test Event'
        }
      }

      const mockBooking = {
        id: 'booking-1',
        bookingReference: 'LN123ABC456',
        quantity: 2,
        subtotal: 50,
        serviceFee: 1.5,
        tax: 9.785,
        totalAmount: 61.285,
        status: 'RESERVED',
        event: {
          id: 'event-1',
          title: 'Test Event',
          venue: { name: 'Test Venue' }
        },
        tickets: [
          {
            id: 'ticket-1',
            qrCode: 'LN123ABC456-1-123456789',
            ticketType: mockTicketType
          },
          {
            id: 'ticket-2', 
            qrCode: 'LN123ABC456-2-123456789',
            ticketType: mockTicketType
          }
        ]
      }

      mockPrisma.ticketType.findUnique.mockResolvedValue(mockTicketType)
      mockTransaction.mockImplementation(async (callback) => {
        return await callback({
          booking: {
            create: mockPrisma.booking.create.mockResolvedValue({
              id: 'booking-1',
              bookingReference: 'LN123ABC456'
            })
          },
          ticketType: {
            update: mockPrisma.ticketType.update
          },
          ticket: {
            createMany: mockPrisma.ticket.createMany
          },
          booking: {
            findUnique: mockPrisma.booking.findUnique.mockResolvedValue(mockBooking)
          }
        })
      })

      const requestBody = {
        eventId: 'event-1',
        ticketTypeId: 'ticket-type-1',
        quantity: 2,
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        customerPhone: '+357123456789'
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.bookingReference).toBe('LN123ABC456')
      expect(data.quantity).toBe(2)
      expect(data.tickets).toHaveLength(2)
    })

    it('should reject booking when ticket type not found', async () => {
      mockPrisma.ticketType.findUnique.mockResolvedValue(null)

      const requestBody = {
        eventId: 'event-1',
        ticketTypeId: 'invalid-ticket-type',
        quantity: 2,
        customerEmail: 'test@example.com',
        customerName: 'Test Customer'
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Ticket type not found')
    })

    it('should reject booking when not enough tickets available', async () => {
      const mockTicketType = {
        id: 'ticket-type-1',
        name: 'Standard',
        price: 25,
        quantity: 100,
        sold: 99, // Only 1 ticket available
        event: {
          id: 'event-1',
          title: 'Test Event'
        }
      }

      mockPrisma.ticketType.findUnique.mockResolvedValue(mockTicketType)

      const requestBody = {
        eventId: 'event-1',
        ticketTypeId: 'ticket-type-1',
        quantity: 2, // Requesting 2 tickets but only 1 available
        customerEmail: 'test@example.com',
        customerName: 'Test Customer'
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Not enough tickets available')
    })

    it('should calculate early bird pricing correctly', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7) // 7 days from now

      const mockTicketType = {
        id: 'ticket-type-1',
        name: 'Standard',
        price: 50,
        quantity: 100,
        sold: 10,
        earlyBirdDeadline: futureDate,
        earlyBirdPrice: 30,
        event: {
          id: 'event-1',
          title: 'Test Event'
        }
      }

      const mockBooking = {
        id: 'booking-1',
        bookingReference: 'LN123ABC456',
        quantity: 1,
        subtotal: 30, // Early bird price
        serviceFee: 0.9,
        tax: 5.871,
        totalAmount: 36.771,
        status: 'RESERVED',
        event: {
          id: 'event-1',
          title: 'Test Event',
          venue: { name: 'Test Venue' }
        },
        tickets: []
      }

      mockPrisma.ticketType.findUnique.mockResolvedValue(mockTicketType)
      mockTransaction.mockImplementation(async (callback) => {
        return await callback({
          booking: {
            create: mockPrisma.booking.create,
            findUnique: mockPrisma.booking.findUnique.mockResolvedValue(mockBooking)
          },
          ticketType: {
            update: mockPrisma.ticketType.update
          },
          ticket: {
            createMany: mockPrisma.ticket.createMany
          }
        })
      })

      const requestBody = {
        eventId: 'event-1',
        ticketTypeId: 'ticket-type-1',
        quantity: 1,
        customerEmail: 'test@example.com',
        customerName: 'Test Customer'
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.subtotal).toBe(30) // Early bird price applied
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.ticketType.findUnique.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        eventId: 'event-1',
        ticketTypeId: 'ticket-type-1',
        quantity: 1,
        customerEmail: 'test@example.com',
        customerName: 'Test Customer'
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create booking')
    })
  })
})