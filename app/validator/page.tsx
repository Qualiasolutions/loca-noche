'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode'

interface ValidationResult {
  message: string
  type: 'valid' | 'invalid' | 'loading'
  ticket?: {
    customerName: string
    eventName: string
    eventDate: string
    venue: string
    ticketType: string
  }
}

export default function ValidatorPage() {
  const [validCount, setValidCount] = useState(0)
  const [invalidCount, setInvalidCount] = useState(0)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [manualInput, setManualInput] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [cameras, setCameras] = useState<any[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const videoElementId = 'qr-code-scanner'

  useEffect(() => {
    // Load saved stats
    const savedValid = localStorage.getItem('locanoche_valid_count')
    const savedInvalid = localStorage.getItem('locanoche_invalid_count')
    if (savedValid) setValidCount(parseInt(savedValid))
    if (savedInvalid) setInvalidCount(parseInt(savedInvalid))

    // Get available cameras
    getCameras()

    // Cleanup scanner on unmount
    return () => {
      stopScanning()
    }
  }, [])

  useEffect(() => {
    // Save stats
    localStorage.setItem('locanoche_valid_count', validCount.toString())
    localStorage.setItem('locanoche_invalid_count', invalidCount.toString())
  }, [validCount, invalidCount])

  const getCameras = async () => {
    try {
      // First try to get camera permissions
      await navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          // Stop the test stream immediately
          stream.getTracks().forEach(track => track.stop())
        })
        .catch(error => {
          console.warn('Camera permission test failed:', error)
        })

      const devices = await Html5Qrcode.getCameras()
      console.log('Available cameras:', devices)
      setCameras(devices)

      // Try to select rear camera first
      const rearCamera = devices.find(camera =>
        camera.label.toLowerCase().includes('back') ||
        camera.label.toLowerCase().includes('rear') ||
        camera.label.toLowerCase().includes('environment')
      )

      if (rearCamera) {
        setSelectedCamera(rearCamera.id)
      } else if (devices.length > 0) {
        setSelectedCamera(devices[0].id)
      } else {
        // Fallback: try to use default camera
        setSelectedCamera('default')
        setCameras([{ id: 'default', label: 'Default Camera' }])
      }
    } catch (error) {
      console.error('Error getting cameras:', error)

      // Fallback: try to use environment facing mode
      setSelectedCamera('environment')
      setCameras([{ id: 'environment', label: 'Environment Camera (Rear)' }])

      setResult({
        message: 'Camera detection failed. Using fallback camera mode.',
        type: 'loading'
      })
    }
  }

  const startScanning = async () => {
    if (isScanning || !selectedCamera) return

    try {
      setResult({ message: 'Starting camera...', type: 'loading' })
      setIsScanning(true)

      const html5QrCode = new Html5Qrcode(videoElementId)
      html5QrCodeRef.current = html5QrCode

      const config = {
        fps: 10,
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1.0,
        disableFlip: false,
      }

      // Handle different camera ID formats
      let cameraId = selectedCamera
      if (selectedCamera === 'environment') {
        // Use facingMode constraint instead of device ID
        cameraId = { facingMode: 'environment' }
      } else if (selectedCamera === 'default') {
        // Use default camera
        cameraId = { facingMode: 'user' }
      }

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText, decodedResult) => {
          console.log('QR Code detected:', decodedText)
          onQrCodeScanned(decodedText)
        },
        (errorMessage) => {
          // Ignore routine scanning errors
          if (!errorMessage.includes('NotFoundException')) {
            console.log('Scanner error:', errorMessage)
          }
        }
      )

      setResult({ message: 'Camera active - Position QR code in frame', type: 'loading' })

    } catch (error: any) {
      console.error('Failed to start camera:', error)
      setIsScanning(false)

      if (error.name === 'NotAllowedError') {
        setResult({
          message: 'Camera permission denied. Please allow camera access and try again.',
          type: 'invalid'
        })
      } else if (error.name === 'NotFoundError') {
        // Try fallback with basic getUserMedia
        try {
          await tryFallbackCamera()
        } catch (fallbackError) {
          setResult({
            message: 'No camera found. Please check your device has a working camera.',
            type: 'invalid'
          })
        }
      } else {
        setResult({
          message: `Camera error: ${error.message || 'Failed to start camera'}`,
          type: 'invalid'
        })
      }
    }
  }

  const tryFallbackCamera = async () => {
    setResult({ message: 'Trying fallback camera method...', type: 'loading' })

    // Simple fallback using getUserMedia directly
    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      // Get the video element and set the stream
      const videoElement = document.getElementById(videoElementId) as HTMLVideoElement
      if (videoElement) {
        videoElement.srcObject = stream
        videoElement.play()
        setIsScanning(true)
        setResult({ message: 'Camera active (fallback mode) - QR scanning not available', type: 'loading' })
      }
    } catch (error) {
      throw error
    }
  }

  const stopScanning = async () => {
    if (!isScanning) return

    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current = null
      } else {
        // Handle fallback camera mode
        const videoElement = document.getElementById(videoElementId) as HTMLVideoElement
        if (videoElement && videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream
          stream.getTracks().forEach(track => track.stop())
          videoElement.srcObject = null
        }
      }
      setIsScanning(false)
      setResult({ message: 'Camera stopped', type: 'loading' })
    } catch (error) {
      console.error('Error stopping scanner:', error)
      setIsScanning(false)
    }
  }

  const switchCamera = async () => {
    if (!cameras || cameras.length <= 1) return

    const currentIndex = cameras.findIndex(cam => cam.id === selectedCamera)
    const nextIndex = (currentIndex + 1) % cameras.length
    const nextCamera = cameras[nextIndex]

    if (isScanning) {
      await stopScanning()
    }

    setSelectedCamera(nextCamera.id)
    setResult({
      message: `Switched to ${nextCamera.label || 'camera'}`,
      type: 'loading'
    })

    setTimeout(() => {
      startScanning()
    }, 1000)
  }

  const onQrCodeScanned = async (qrCode: string) => {
    console.log('QR Code scanned:', qrCode)
    await validateTicket({ qrCode })
  }

  const validateTicket = async (data: { qrCode?: string, ticketNumber?: string }) => {
    setResult({ message: 'Validating ticket...', type: 'loading' })

    try {
      const response = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCode: data.qrCode,
          ticketNumber: data.ticketNumber,
          validatorId: 'STAFF-VALIDATOR',
          deviceInfo: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            viewport: `${window.innerWidth}x${window.innerHeight}`
          }
        })
      })

      const result = await response.json()

      if (result.valid && result.ticket) {
        setResult({
          message: `✅ VALID TICKET`,
          type: 'valid',
          ticket: {
            customerName: result.ticket.customerName,
            eventName: result.ticket.eventName,
            eventDate: new Date(result.ticket.eventDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            venue: result.ticket.venue,
            ticketType: result.ticket.ticketType
          }
        })
        setValidCount(v => v + 1)
        if (soundEnabled) playSound('success')
      } else {
        setResult({
          message: `❌ ${result.message || 'INVALID TICKET'}`,
          type: 'invalid'
        })
        setInvalidCount(i => i + 1)
        if (soundEnabled) playSound('error')
      }
    } catch (error: any) {
      console.error('Validation error:', error)

      let errorMessage = 'Network connection failed'
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to validation server'
      } else if (error.message) {
        errorMessage = `API Error: ${error.message}`
      }

      setResult({ message: `🔌 ${errorMessage}`, type: 'invalid' })
      setInvalidCount(i => i + 1)
      if (soundEnabled) playSound('error')
    }
  }

  const handleManualValidate = async () => {
    if (!manualInput.trim()) return

    await validateTicket({ ticketNumber: manualInput })
    setManualInput('')
  }

  const playSound = (type: 'success' | 'error') => {
    try {
      const audio = new Audio(
        type === 'success'
          ? 'data:audio/wav;base64,UklGRiQEAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAeCC+HzvLZiTYIG2m98OTLR0w='
          : 'data:audio/wav;base64,UklGRiQEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAEAAB/h4qFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAeCC+HzvLZiTYIG2m98OTLR0w='
      )
      audio.play().catch(() => {})
    } catch (error) {
      // Silently fail if audio doesn't work
    }
  }

  const resetCounters = () => {
    setValidCount(0)
    setInvalidCount(0)
    localStorage.removeItem('locanoche_valid_count')
    localStorage.removeItem('locanoche_invalid_count')
    setResult({ message: 'Counters reset', type: 'loading' })

    setTimeout(() => {
      if (!isScanning) {
        setResult(null)
      }
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="text-center">
            <h1 className="text-2xl font-light tracking-wider text-white mb-1">LOCA NOCHE</h1>
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent mx-auto mb-2"></div>
            <p className="text-white/70 text-xs uppercase tracking-widest">Ticket Validator</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 text-center">
            <div className="text-3xl font-light text-green-400 mb-2">{validCount}</div>
            <div className="text-xs uppercase tracking-wider text-white/70">Valid Tickets</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 text-center">
            <div className="text-3xl font-light text-red-400 mb-2">{invalidCount}</div>
            <div className="text-xs uppercase tracking-wider text-white/70">Invalid Tickets</div>
          </div>
        </div>

        {/* Scanner Section */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-light text-white">QR Scanner</h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-white/30 bg-white/10 text-slate-600 focus:ring-slate-500 focus:ring-offset-0"
                />
                <span className="text-sm">Sound</span>
              </label>
              {cameras.length > 1 && (
                <button
                  onClick={switchCamera}
                  disabled={!cameras.length}
                  className="px-3 py-1 text-xs bg-white/20 text-white rounded border border-white/30 hover:bg-white/30 transition-colors disabled:opacity-50"
                >
                  📷 Switch
                </button>
              )}
            </div>
          </div>

          {/* Camera Display */}
          <div className="relative mb-6">
            <div
              id={videoElementId}
              className={`w-full min-h-[400px] bg-black rounded-lg flex items-center justify-center ${
                isScanning ? '' : 'border-2 border-dashed border-white/30'
              }`}
              style={{
                maxWidth: '100%',
                aspectRatio: '1 / 1'
              }}
            >
              {!isScanning && (
                <div className="text-center text-white/70">
                  <div className="text-6xl mb-4">📱</div>
                  <p className="text-lg mb-2">QR Code Scanner</p>
                  <p className="text-sm">Camera will appear here when started</p>
                  {cameras.length > 0 && (
                    <p className="text-xs mt-2 text-white/50">
                      Camera: {cameras.find(cam => cam.id === selectedCamera)?.label || 'Default'}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center mt-4">
              {!isScanning ? (
                <button
                  onClick={startScanning}
                  disabled={!selectedCamera}
                  className="px-8 py-3 bg-white text-slate-900 rounded-lg font-medium tracking-wide hover:bg-white/90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span className="text-xl">📷</span>
                  START SCANNER
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="px-8 py-3 bg-red-600 text-white rounded-lg font-medium tracking-wide hover:bg-red-700 transition-colors"
                >
                  STOP SCANNER
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Manual Entry */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
          <h3 className="text-lg font-light text-white mb-4">Manual Entry</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualValidate()}
              placeholder="Enter ticket code manually"
              className="flex-1 px-4 py-3 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/50 focus:border-white/60 focus:outline-none focus:bg-white/20 transition-colors"
            />
            <button
              onClick={handleManualValidate}
              disabled={!manualInput.trim()}
              className="px-6 py-3 bg-white text-slate-900 rounded-lg font-medium tracking-wide hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              VALIDATE
            </button>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className={`backdrop-blur-md border rounded-xl p-6 text-center ${
            result.type === 'valid'
              ? 'bg-green-500/20 border-green-500/40 text-green-100' :
            result.type === 'invalid'
              ? 'bg-red-500/20 border-red-500/40 text-red-100' :
              'bg-amber-500/20 border-amber-500/40 text-amber-100'
          }`}>
            <p className="text-lg font-medium mb-3">{result.message}</p>

            {result.ticket && (
              <div className="text-sm space-y-1 text-left bg-black/20 rounded-lg p-4">
                <div><strong>Customer:</strong> {result.ticket.customerName}</div>
                <div><strong>Event:</strong> {result.ticket.eventName}</div>
                <div><strong>Date:</strong> {result.ticket.eventDate}</div>
                <div><strong>Venue:</strong> {result.ticket.venue}</div>
                <div><strong>Type:</strong> {result.ticket.ticketType}</div>
              </div>
            )}
          </div>
        )}

        {/* Reset Button */}
        <div className="text-center">
          <button
            onClick={resetCounters}
            className="text-white/40 hover:text-white/70 text-sm uppercase tracking-wider transition-colors"
          >
            Reset Counters
          </button>
        </div>
      </div>
    </div>
  )
}