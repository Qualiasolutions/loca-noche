import { GET, POST } from '@/app/api/events/route'
import { NextRequest } from 'next/server'

// Mock Prisma client
const mockPrisma = {
  event: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  }
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}))

describe('/api/events', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return events with pagination', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'Test Event',
          description: 'Test Description',
          eventDate: new Date('2025-06-01'),
          venue: { name: 'Test Venue' },
          ticketTypes: [{ id: '1', name: 'Standard', price: 25, isActive: true }],
          _count: { bookings: 10, reviews: 5 }
        }
      ]

      mockPrisma.event.findMany.mockResolvedValue(mockEvents)
      mockPrisma.event.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/events?page=1&limit=10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.events).toHaveLength(1)
      expect(data.events[0].title).toBe('Test Event')
      expect(data.pagination.total).toBe(1)
      expect(data.pagination.page).toBe(1)
    })

    it('should filter events by category', async () => {
      mockPrisma.event.findMany.mockResolvedValue([])
      mockPrisma.event.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/events?category=CONCERT')
      await GET(request)

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'CONCERT'
          })
        })
      )
    })

    it('should search events by text', async () => {
      mockPrisma.event.findMany.mockResolvedValue([])
      mockPrisma.event.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/events?search=concert')
      await GET(request)

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: { contains: 'concert', mode: 'insensitive' } },
              { description: { contains: 'concert', mode: 'insensitive' } },
              { tags: { has: 'concert' } }
            ])
          })
        })
      )
    })

    it('should handle database errors', async () => {
      mockPrisma.event.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/events')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to fetch events')
    })
  })

  describe('POST', () => {
    it('should create a new event', async () => {
      const mockEvent = {
        id: '1',
        title: 'New Event',
        slug: 'new-event',
        description: 'Event description',
        category: 'CONCERT',
        venueId: 'venue-1',
        eventDate: new Date('2025-06-01'),
        startTime: new Date('2025-06-01T20:00:00'),
        capacity: 500,
        venue: { name: 'Test Venue' },
        ticketTypes: []
      }

      mockPrisma.event.create.mockResolvedValue(mockEvent)

      const requestBody = {
        title: 'New Event',
        description: 'Event description',
        category: 'CONCERT',
        venueId: 'venue-1',
        eventDate: '2025-06-01T20:00:00Z',
        startTime: '2025-06-01T20:00:00Z',
        capacity: 500,
        ticketTypes: []
      }

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.title).toBe('New Event')
      expect(mockPrisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'New Event',
            slug: 'new-event',
            category: 'CONCERT',
            status: 'DRAFT'
          })
        })
      )
    })

    it('should handle event creation errors', async () => {
      mockPrisma.event.create.mockRejectedValue(new Error('Creation failed'))

      const requestBody = {
        title: 'New Event',
        description: 'Event description',
        category: 'CONCERT',
        venueId: 'venue-1',
        eventDate: '2025-06-01T20:00:00Z',
        startTime: '2025-06-01T20:00:00Z',
        capacity: 500
      }

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to create event')
    })
  })
})