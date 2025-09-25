import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create venue
  const venue = await prisma.venue.upsert({
    where: { id: 'river-park-lakatamia' },
    update: {},
    create: {
      id: 'river-park-lakatamia',
      name: 'River Park Lakatamia',
      address: 'Lakatamia Avenue',
      city: 'Lakatamia',
      country: 'Cyprus',
      postalCode: '2540',
      latitude: 35.1264,
      longitude: 33.3628,
      capacity: 500,
      description: 'Premier outdoor venue in Lakatamia perfect for festivals and concerts',
      amenities: {
        parking: true,
        accessible: true,
        bar: true,
        restrooms: true,
        soundSystem: true,
        lighting: true
      },
      images: [
        '/venue-river-park-1.jpg',
        '/venue-river-park-2.jpg'
      ],
    },
  })

  // Create venue sections
  const mainSection = await prisma.venueSection.upsert({
    where: { id: 'river-park-main' },
    update: {},
    create: {
      id: 'river-park-main',
      venueId: venue.id,
      name: 'Main Area',
      capacity: 500,
      rowCount: 20,
      seatsPerRow: 25,
      seatMap: {
        type: 'general_admission',
        layout: 'open_floor'
      }
    }
  })

  // Create Oktoberfest Events
  console.log('Creating Oktoberfest events...')

  // Event 1: Minus One
  const minusOneEvent = await prisma.event.upsert({
    where: { id: 'oktoberfest-minus-one-2024' },
    update: {},
    create: {
      id: 'oktoberfest-minus-one-2024',
      title: 'Lakatamia Hofbräu Oktoberfest - Minus One',
      slug: 'oktoberfest-minus-one-2024',
      description: 'Lakatamia Hofbräu in München Oktoberfest presents Minus One - An authentic German beer festival experience with live music from Cyprus\'s beloved rock band Minus One.',
      shortDescription: 'Authentic Bavarian festivities with Minus One live performance',
      category: 'FESTIVAL',
      status: 'PUBLISHED',
      venueId: venue.id,
      eventDate: new Date('2024-10-11T17:00:00Z'),
      startTime: new Date('2024-10-11T17:00:00Z'),
      endTime: new Date('2024-10-12T00:00:00Z'),
      capacity: 300,
      images: [
        'https://i.ibb.co/DDXtKYmG/NICOSIA-Instagram-Post-45-7.png'
      ],
      videos: [],
      tags: [
        'oktoberfest',
        'minus-one',
        'bavarian',
        'beer-festival',
        'live-music'
      ],
      featured: true,
      publishedAt: new Date()
    },
  })

  // Event 2: Giannis Margaris
  const giannisEvent = await prisma.event.upsert({
    where: { id: 'oktoberfest-giannis-margaris-2024' },
    update: {},
    create: {
      id: 'oktoberfest-giannis-margaris-2024',
      title: 'Lakatamia Hofbräu Oktoberfest - Giannis Margaris',
      slug: 'oktoberfest-giannis-margaris-2024',
      description: 'Lakatamia Hofbräu in München Oktoberfest presents Giannis Margaris - Traditional Bavarian celebration with live entertainment by popular Greek-Cypriot performer Giannis Margaris.',
      shortDescription: 'Traditional Bavarian celebration with Giannis Margaris',
      category: 'FESTIVAL',
      status: 'PUBLISHED',
      venueId: venue.id,
      eventDate: new Date('2024-10-12T17:00:00Z'),
      startTime: new Date('2024-10-12T17:00:00Z'),
      endTime: new Date('2024-10-13T00:00:00Z'),
      capacity: 300,
      images: [
        'https://i.ibb.co/S42KhYHF/NICOSIA-Instagram-Post-45-6.png'
      ],
      videos: [],
      tags: [
        'oktoberfest',
        'giannis-margaris',
        'bavarian',
        'beer-festival',
        'live-music'
      ],
      featured: true,
      publishedAt: new Date()
    },
  })

  // Create ticket types for Minus One event
  console.log('Creating ticket types...')

  await prisma.ticketType.upsert({
    where: { id: 'minus-one-adult-ticket' },
    update: {},
    create: {
      id: 'minus-one-adult-ticket',
      eventId: minusOneEvent.id,
      name: 'Adult Ticket',
      description: 'General admission ticket for adults',
      price: 10.00,
      currency: 'EUR',
      quantity: 250,
      sold: 0,
      maxPerOrder: 8,
      isActive: true
    }
  })

  await prisma.ticketType.upsert({
    where: { id: 'minus-one-child-ticket' },
    update: {},
    create: {
      id: 'minus-one-child-ticket',
      eventId: minusOneEvent.id,
      name: 'Child Ticket (Under 12)',
      description: 'General admission ticket for children under 12',
      price: 5.00,
      currency: 'EUR',
      quantity: 50,
      sold: 0,
      maxPerOrder: 4,
      isActive: true
    }
  })

  // Create ticket types for Giannis Margaris event
  await prisma.ticketType.upsert({
    where: { id: 'giannis-adult-ticket' },
    update: {},
    create: {
      id: 'giannis-adult-ticket',
      eventId: giannisEvent.id,
      name: 'Adult Ticket',
      description: 'General admission ticket for adults',
      price: 10.00,
      currency: 'EUR',
      quantity: 250,
      sold: 0,
      maxPerOrder: 8,
      isActive: true
    }
  })

  await prisma.ticketType.upsert({
    where: { id: 'giannis-child-ticket' },
    update: {},
    create: {
      id: 'giannis-child-ticket',
      eventId: giannisEvent.id,
      name: 'Child Ticket (Under 12)',
      description: 'General admission ticket for children under 12',
      price: 5.00,
      currency: 'EUR',
      quantity: 50,
      sold: 0,
      maxPerOrder: 4,
      isActive: true
    }
  })

  // Create simplified event records for N8N workflow compatibility
  console.log('Creating N8N-compatible event records...')

  await prisma.event.upsert({
    where: { id: 'event1' },
    update: {},
    create: {
      id: 'event1',
      title: 'Oktoberfest - Minus One',
      slug: 'event1',
      description: 'Lakatamia Hofbräu Oktoberfest with Minus One',
      shortDescription: 'Oktoberfest with Minus One',
      category: 'FESTIVAL',
      status: 'PUBLISHED',
      venueId: venue.id,
      eventDate: new Date('2024-10-11T17:00:00Z'),
      startTime: new Date('2024-10-11T17:00:00Z'),
      endTime: new Date('2024-10-12T00:00:00Z'),
      capacity: 300,
      images: [
        'https://i.ibb.co/DDXtKYmG/NICOSIA-Instagram-Post-45-7.png'
      ],
      videos: [],
      tags: ['oktoberfest', 'minus-one'],
      featured: true,
      publishedAt: new Date()
    }
  })

  await prisma.event.upsert({
    where: { id: 'event2' },
    update: {},
    create: {
      id: 'event2',
      title: 'Oktoberfest - Giannis Margaris',
      slug: 'event2',
      description: 'Lakatamia Hofbräu Oktoberfest with Giannis Margaris',
      shortDescription: 'Oktoberfest with Giannis Margaris',
      category: 'FESTIVAL',
      status: 'PUBLISHED',
      venueId: venue.id,
      eventDate: new Date('2024-10-12T17:00:00Z'),
      startTime: new Date('2024-10-12T17:00:00Z'),
      endTime: new Date('2024-10-13T00:00:00Z'),
      capacity: 300,
      images: [
        'https://i.ibb.co/S42KhYHF/NICOSIA-Instagram-Post-45-6.png'
      ],
      videos: [],
      tags: ['oktoberfest', 'giannis-margaris'],
      featured: true,
      publishedAt: new Date()
    }
  })

  // Create test bookings and tickets for QR code validation testing
  console.log('Creating test tickets with QR codes for validation testing...')

  const minusOneAdultType = await prisma.ticketType.findUnique({
    where: { id: 'minus-one-adult-ticket' }
  })

  if (minusOneAdultType) {
    // Create test booking
    const testBooking = await prisma.booking.upsert({
      where: { id: 'test-booking-001' },
      update: {},
      create: {
        id: 'test-booking-001',
        eventId: minusOneEvent.id,
        bookingReference: 'LN-TEST-001',
        quantity: 2,
        subtotal: 20.00,
        serviceFee: 2.00,
        tax: 0.00,
        totalAmount: 22.00,
        status: 'CONFIRMED',
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        customerPhone: '+35799123456'
      }
    })

    // Create test tickets with QR codes
    await prisma.ticket.upsert({
      where: { id: 'test-ticket-001' },
      update: {},
      create: {
        id: 'test-ticket-001',
        bookingId: testBooking.id,
        ticketTypeId: minusOneAdultType.id,
        sectionId: mainSection.id,
        qrCode: 'LN-TEST-QR-001',
        status: 'VALID'
      }
    })

    await prisma.ticket.upsert({
      where: { id: 'test-ticket-002' },
      update: {},
      create: {
        id: 'test-ticket-002',
        bookingId: testBooking.id,
        ticketTypeId: minusOneAdultType.id,
        sectionId: mainSection.id,
        qrCode: 'LN-TEST-QR-002',
        status: 'VALID'
      }
    })

    // Create a used ticket for testing
    await prisma.ticket.upsert({
      where: { id: 'test-ticket-used' },
      update: {},
      create: {
        id: 'test-ticket-used',
        bookingId: testBooking.id,
        ticketTypeId: minusOneAdultType.id,
        sectionId: mainSection.id,
        qrCode: 'LN-TEST-QR-USED',
        status: 'USED',
        usedAt: new Date('2024-10-11T17:30:00Z'),
        validatedBy: 'STAFF-TEST'
      }
    })

    console.log('✅ Created test tickets:')
    console.log('   📱 LN-TEST-QR-001 (VALID)')
    console.log('   📱 LN-TEST-QR-002 (VALID)')
    console.log('   📱 LN-TEST-QR-USED (USED - for testing)')
  }

  console.log('✅ Database seeded successfully!')
  console.log('🎪 Created venue: River Park Lakatamia')
  console.log('🎫 Created 2 Oktoberfest events with ticket types')
  console.log('🎟️  Created test tickets with QR codes for validation')
  console.log('🍺 Ready for bookings and QR validation testing!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })