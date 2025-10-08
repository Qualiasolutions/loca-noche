"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw, Mail, Database, Zap, CreditCard } from "lucide-react"

interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  message?: string
  responseTime?: number
  lastChecked: string
}

interface HealthData {
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

export default function PaymentMonitoringDashboard() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchHealthData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealthData(data)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to fetch health data:', error)
      setHealthData({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: { status: 'unhealthy', message: 'Failed to fetch', lastChecked: new Date().toISOString() },
          email: { status: 'unhealthy', message: 'Failed to fetch', lastChecked: new Date().toISOString() },
          n8n: { status: 'unhealthy', message: 'Failed to fetch', lastChecked: new Date().toISOString() },
          vivaPayments: { status: 'unhealthy', message: 'Failed to fetch', lastChecked: new Date().toISOString() }
        },
        errors: ['Failed to fetch health data']
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthData()
    const interval = setInterval(fetchHealthData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />
    }
  }

  const getStatusBadge = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500">Healthy</Badge>
      case 'degraded':
        return <Badge className="bg-yellow-500">Degraded</Badge>
      case 'unhealthy':
        return <Badge className="bg-red-500">Unhealthy</Badge>
    }
  }

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'database':
        return <Database className="w-6 h-6" />
      case 'email':
        return <Mail className="w-6 h-6" />
      case 'n8n':
        return <Zap className="w-6 h-6" />
      case 'vivaPayments':
        return <CreditCard className="w-6 h-6" />
      default:
        return <RefreshCw className="w-6 h-6" />
    }
  }

  const formatLastChecked = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  if (isLoading && !healthData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading monitoring data...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment System Monitoring</h1>
          <p className="text-gray-600">Real-time status of payment processing services</p>
        </div>
        <Button onClick={fetchHealthData} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      {healthData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(healthData.status)}
                <CardTitle>System Status</CardTitle>
                {getStatusBadge(healthData.status)}
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {healthData.status === 'healthy' && 'All systems are operating normally.'}
              {healthData.status === 'degraded' && 'Some systems are experiencing issues but payments may still work.'}
              {healthData.status === 'unhealthy' && 'Critical issues detected. Payment processing may be affected.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {healthData?.errors && healthData.errors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">System Issues Detected</AlertTitle>
          <AlertDescription className="text-red-700">
            <ul className="list-disc list-inside space-y-1">
              {healthData.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Service Status Grid */}
      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(healthData.services).map(([serviceName, status]) => (
            <Card key={serviceName} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getServiceIcon(serviceName)}
                    <CardTitle className="text-lg">
                      {serviceName === 'database' && 'Database'}
                      {serviceName === 'email' && 'Email Service'}
                      {serviceName === 'n8n' && 'N8N Workflows'}
                      {serviceName === 'vivaPayments' && 'Viva Payments'}
                    </CardTitle>
                  </div>
                  {getStatusIcon(status.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(status.status)}
                </div>

                {status.responseTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Response Time:</span>
                    <span className="text-sm text-gray-600">{status.responseTime}ms</span>
                  </div>
                )}

                {status.message && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {status.message}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Last checked: {formatLastChecked(status.lastChecked)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting & Actions</CardTitle>
          <CardDescription>Recommended actions based on current system status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthData?.services.database.status === 'unhealthy' && (
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800">Database Issues</h4>
                  <p className="text-sm text-red-700">Check database connection and verify environment variables.</p>
                </div>
              </div>
            )}

            {healthData?.services.email.status === 'unhealthy' && (
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Email Service Issues</h4>
                  <p className="text-sm text-yellow-700">Configure email service credentials in environment variables.</p>
                </div>
              </div>
            )}

            {healthData?.services.n8n.status === 'unhealthy' && (
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800">N8N Workflow Issues</h4>
                  <p className="text-sm text-red-700">Check N8N instance status and webhook configurations.</p>
                </div>
              </div>
            )}

            {healthData?.services.vivaPayments.status === 'unhealthy' && (
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800">Viva Payments Issues</h4>
                  <p className="text-sm text-red-700">Verify Viva Payments API credentials and service status.</p>
                </div>
              </div>
            )}

            {healthData?.status === 'healthy' && (
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-800">All Systems Operational</h4>
                  <p className="text-sm text-green-700">Payment processing is functioning normally.</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}