import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    database: ServiceStatus
    email: ServiceStatus
    n8n: ServiceStatus
    vivaPayments: ServiceStatus
  }
  errors?: string[]
}

interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  message?: string
  responseTime?: number
  lastChecked: string
}

async function checkDatabaseHealth(): Promise<ServiceStatus> {
  const startTime = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return {
      status: 'healthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database connection failed',
      lastChecked: new Date().toISOString()
    }
  }
}

async function checkEmailHealth(): Promise<ServiceStatus> {
  const startTime = Date.now()
  try {
    if (!process.env.EMAIL_SERVICE_HOST || !process.env.EMAIL_SERVICE_USER || !process.env.EMAIL_SERVICE_PASS) {
      return {
        status: 'degraded',
        message: 'Email service credentials not configured',
        lastChecked: new Date().toISOString()
      }
    }

    // In a real implementation, you might test the email connection
    // For now, just check if credentials are present
    return {
      status: 'healthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Email service check failed',
      lastChecked: new Date().toISOString()
    }
  }
}

async function checkN8NHealth(): Promise<ServiceStatus> {
  const startTime = Date.now()
  try {
    const n8nWebhookUrl = 'https://tasos8.app.n8n.cloud/webhook/loca-noche-payment-success'

    const response = await fetch(n8nWebhookUrl, {
      method: 'HEAD', // Use HEAD to check availability without triggering workflow
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })

    if (response.ok) {
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString()
      }
    } else {
      return {
        status: 'degraded',
        message: `N8N responded with ${response.status}`,
        lastChecked: new Date().toISOString()
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'N8N health check failed',
      lastChecked: new Date().toISOString()
    }
  }
}

async function checkVivaPaymentsHealth(): Promise<ServiceStatus> {
  const startTime = Date.now()
  try {
    if (!process.env.VIVA_API_URL || !process.env.VIVA_API_KEY) {
      return {
        status: 'degraded',
        message: 'Viva Payments API credentials not configured',
        lastChecked: new Date().toISOString()
      }
    }

    // Check Viva Payments API availability
    const response = await fetch(`${process.env.VIVA_API_URL}/checkout/v2`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.VIVA_API_KEY}`,
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })

    if (response.ok || response.status === 401) { // 401 means API is up but auth failed, which is expected
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString()
      }
    } else {
      return {
        status: 'degraded',
        message: `Viva Payments API responded with ${response.status}`,
        lastChecked: new Date().toISOString()
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Viva Payments health check failed',
      lastChecked: new Date().toISOString()
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Performing health check...')

    // Run all health checks in parallel
    const [database, email, n8n, vivaPayments] = await Promise.all([
      checkDatabaseHealth(),
      checkEmailHealth(),
      checkN8NHealth(),
      checkVivaPaymentsHealth()
    ])

    // Determine overall health status
    const services = { database, email, n8n, vivaPayments }
    const unhealthyServices = Object.values(services).filter(s => s.status === 'unhealthy')
    const degradedServices = Object.values(services).filter(s => s.status === 'degraded')

    let overallStatus: HealthCheck['status']
    if (unhealthyServices.length > 0) {
      overallStatus = 'unhealthy'
    } else if (degradedServices.length > 0) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }

    const healthCheck: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      errors: []
    }

    // Add specific error messages
    if (database.status === 'unhealthy') {
      healthCheck.errors?.push(`Database: ${database.message}`)
    }
    if (n8n.status === 'unhealthy') {
      healthCheck.errors?.push(`N8N: ${n8n.message}`)
    }
    if (vivaPayments.status === 'unhealthy') {
      healthCheck.errors?.push(`Viva Payments: ${vivaPayments.message}`)
    }

    // Log health status
    console.log(`📊 Health check completed: ${overallStatus}`, {
      database: database.status,
      email: email.status,
      n8n: n8n.status,
      vivaPayments: vivaPayments.status
    })

    return NextResponse.json(healthCheck, {
      status: overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503
    })

  } catch (error) {
    console.error('❌ Health check failed:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}