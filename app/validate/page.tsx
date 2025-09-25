"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { QrCode, Shield, CheckCircle, XCircle, Loader2, User, Calendar, MapPin } from "lucide-react"
import { LogoHeader } from "@/components/logo-header"

interface ValidationResult {
  success: boolean
  valid: boolean
  ticket?: {
    number: string
    customerName: string
    eventName: string
  }
  message: string
  error?: string
  details?: any
  timestamp: string
  action: 'ALLOW_ENTRY' | 'DENY_ENTRY'
}

export default function TicketValidationPage() {
  const [qrData, setQrData] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [scanHistory, setScanHistory] = useState<ValidationResult[]>([])

  const validateTicket = async (qrCodeData: string) => {
    setIsValidating(true)
    setValidationResult(null)

    try {
      const response = await fetch('https://tasos8.app.n8n.cloud/webhook/loca-noche-ticket-validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrData: qrCodeData,
          scannerInfo: {
            userId: 'venue-staff',
            location: 'main-entrance',
            timestamp: new Date().toISOString()
          }
        }),
      })

      const result = await response.json()
      setValidationResult(result)

      // Add to scan history
      setScanHistory(prev => [result, ...prev.slice(0, 9)]) // Keep last 10 scans

    } catch (error) {
      console.error('Validation error:', error)
      const errorResult: ValidationResult = {
        success: false,
        valid: false,
        message: 'Connection error - Please check your internet connection',
        timestamp: new Date().toISOString(),
        action: 'DENY_ENTRY'
      }
      setValidationResult(errorResult)
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (qrData.trim()) {
      validateTicket(qrData.trim())
    }
  }

  const handleQuickScan = (sampleData: string) => {
    setQrData(sampleData)
    validateTicket(sampleData)
  }

  const clearHistory = () => {
    setScanHistory([])
    setValidationResult(null)
  }

  // Sample QR data for testing
  const sampleQRData = JSON.stringify({
    ticketId: "test-ticket-123",
    ticketNumber: "LN-TEST-001",
    bookingRef: "LN-TEST-BOOKING",
    eventId: "event1",
    type: "ADULT",
    valid: true
  })

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-black to-green-900/30"></div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-center">
            <LogoHeader />
          </nav>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Shield className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-green-300 to-blue-500 bg-clip-text text-transparent">
                TICKET VALIDATOR
              </h1>
            </div>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Venue Staff Portal - Scan QR codes to validate tickets
            </p>
            <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-green-400 mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* QR Scanner Section */}
            <Card className="bg-gray-900/80 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center space-x-2">
                  <QrCode className="w-6 h-6 text-blue-400" />
                  <span>QR Code Scanner</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="qrData" className="text-gray-300">
                      QR Code Data
                    </Label>
                    <Input
                      id="qrData"
                      type="text"
                      value={qrData}
                      onChange={(e) => setQrData(e.target.value)}
                      placeholder="Paste QR code data here or scan with camera"
                      className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                      disabled={isValidating}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold"
                    disabled={isValidating || !qrData.trim()}
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4 mr-2" />
                        Validate Ticket
                      </>
                    )}
                  </Button>
                </form>

                <Separator className="bg-gray-700" />

                {/* Quick Test */}
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">Quick Test:</p>
                  <Button
                    onClick={() => handleQuickScan(sampleQRData)}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                    disabled={isValidating}
                  >
                    Test with Sample QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Validation Result */}
            <Card className="bg-gray-900/80 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl text-white">Validation Result</CardTitle>
              </CardHeader>
              <CardContent>
                {validationResult ? (
                  <div className="space-y-4">
                    <Alert className={`border ${
                      validationResult.valid
                        ? 'border-green-500 bg-green-900/20'
                        : 'border-red-500 bg-red-900/20'
                    }`}>
                      <div className="flex items-center space-x-2">
                        {validationResult.valid ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <Badge className={`${
                          validationResult.valid
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {validationResult.action}
                        </Badge>
                      </div>
                      <AlertDescription className="mt-2 text-white">
                        {validationResult.message}
                      </AlertDescription>
                    </Alert>

                    {validationResult.valid && validationResult.ticket && (
                      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 space-y-2">
                        <h4 className="text-white font-medium flex items-center space-x-2">
                          <User className="w-4 h-4 text-green-400" />
                          <span>Ticket Details</span>
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Customer:</span>
                            <span className="text-white">{validationResult.ticket.customerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Ticket #:</span>
                            <span className="text-white font-mono text-xs">{validationResult.ticket.number}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Event:</span>
                            <span className="text-white">{validationResult.ticket.eventName}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {validationResult.details && (
                      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
                        <p className="text-xs text-gray-400 font-mono">
                          {JSON.stringify(validationResult.details, null, 2)}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 text-center">
                      Scanned at {new Date(validationResult.timestamp).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <QrCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Scan a QR code to validate the ticket</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <Card className="bg-gray-900/80 border-gray-700 mt-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl text-white">Recent Scans</CardTitle>
                <Button
                  onClick={clearHistory}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Clear History
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {scanHistory.map((scan, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {scan.valid ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <div>
                          <p className="text-white text-sm">
                            {scan.ticket?.customerName || 'Invalid Ticket'}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {new Date(scan.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${
                        scan.valid
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {scan.action}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}