import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log('Testing basic Prisma connection...')

    // Test 1: Simple count
    const paymentCount = await prisma.payment.count()
    console.log('Payment count:', paymentCount)

    // Test 2: Simple findMany
    const payments = await prisma.payment.findMany({
      take: 1,
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true
      }
    })
    console.log('Sample payment:', payments)

    // Test 3: Simple aggregate
    const aggregate = await prisma.payment.aggregate({
      _count: true,
      _sum: { amount: true }
    })
    console.log('Aggregate:', aggregate)

    return NextResponse.json({
      success: true,
      paymentCount,
      samplePayment: payments[0] || null,
      aggregate,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        details: String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}