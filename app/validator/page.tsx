'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import jsQR from 'jsqr'

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

interface CameraState {
  isScanning: boolean
  hasPermission: boolean
  error: string | null
  stream: MediaStream | null
  devices: MediaDeviceInfo[]
  selectedDeviceId: string | null
}

export default function ValidatorPage() {
  const [validCount, setValidCount] = useState(0)
  const [invalidCount, setInvalidCount] = useState(0)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [manualInput, setManualInput] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)

  const [camera, setCamera] = useState<CameraState>({
    isScanning: false,
    hasPermission: false,
    error: null,
    stream: null,
    devices: [],
    selectedDeviceId: null
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load saved stats
  useEffect(() => {
    const savedValid = localStorage.getItem('locanoche_valid_count')
    const savedInvalid = localStorage.getItem('locanoche_invalid_count')
    if (savedValid) setValidCount(parseInt(savedValid))
    if (savedInvalid) setInvalidCount(parseInt(savedInvalid))

    // Get camera devices on mount
    getCameraDevices()

    // Cleanup on unmount
    return () => {
      stopCamera()
    }
  }, [])

  // Save stats
  useEffect(() => {
    localStorage.setItem('locanoche_valid_count', validCount.toString())
    localStorage.setItem('locanoche_invalid_count', invalidCount.toString())
  }, [validCount, invalidCount])

  const getCameraDevices = async () => {
    try {
      // First request permission to enumerate devices properly
      const testStream = await navigator.mediaDevices.getUserMedia({ video: true })
      testStream.getTracks().forEach(track => track.stop())

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')

      console.log('Found video devices:', videoDevices)

      // Prefer rear camera
      const rearCamera = videoDevices.find(device =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      )

      const selectedDevice = rearCamera || videoDevices[0]

      setCamera(prev => ({
        ...prev,
        devices: videoDevices,
        selectedDeviceId: selectedDevice?.deviceId || null,
        hasPermission: true,
        error: null
      }))

      setResult({
        message: `Camera ready - Found ${videoDevices.length} camera(s)`,
        type: 'loading'
      })

    } catch (error: any) {
      console.error('Camera device enumeration failed:', error)

      setCamera(prev => ({
        ...prev,
        error: error.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access.'
          : 'Unable to access camera devices.',
        hasPermission: false
      }))

      setResult({
        message: 'Camera access required. Please grant permission and try again.',
        type: 'invalid'
      })
    }
  }

  const startCamera = async () => {
    if (!camera.selectedDeviceId && camera.devices.length === 0) {
      // Try to get any camera if device enumeration failed
      await getCameraDevices()
    }

    try {
      setResult({ message: 'Starting camera...', type: 'loading' })

      // Progressive constraints - start with specific device, fallback to facingMode
      let constraints: MediaStreamConstraints = {
        video: camera.selectedDeviceId
          ? {
              deviceId: { exact: camera.selectedDeviceId },
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 }
            }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 }
            }
      }

      let stream: MediaStream

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (error: any) {
        console.warn('Failed with specific constraints, trying fallback:', error)

        // Fallback to basic constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { min: 640 },
            height: { min: 480 }
          }
        })
      }

      if (!videoRef.current) {
        throw new Error('Video element not found')
      }

      videoRef.current.srcObject = stream

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        const video = videoRef.current!

        const onLoadedMetadata = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
          resolve()
        }

        const onError = (error: Event) => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
          reject(new Error('Video failed to load'))
        }

        video.addEventListener('loadedmetadata', onLoadedMetadata)
        video.addEventListener('error', onError)

        video.play().catch(reject)
      })

      setCamera(prev => ({
        ...prev,
        isScanning: true,
        stream,
        error: null
      }))

      // Start QR scanning
      startQRScanning()

      setResult({
        message: 'Camera active - Position QR code in view',
        type: 'loading'
      })

    } catch (error: any) {
      console.error('Camera start failed:', error)

      let errorMessage = 'Camera failed to start'
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow access and try again.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please check your device has a working camera.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application.'
      } else if (error.message) {
        errorMessage = error.message
      }

      setCamera(prev => ({ ...prev, error: errorMessage }))
      setResult({ message: errorMessage, type: 'invalid' })
    }
  }

  const stopCamera = useCallback(() => {
    // Stop QR scanning
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    // Stop camera stream
    if (camera.stream) {
      camera.stream.getTracks().forEach(track => {
        track.stop()
      })
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCamera(prev => ({
      ...prev,
      isScanning: false,
      stream: null
    }))

    setResult({ message: 'Camera stopped', type: 'loading' })
  }, [camera.stream])

  const startQRScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }

    scanIntervalRef.current = setInterval(() => {
      scanQRCode()
    }, 250) // Scan 4 times per second
  }

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !camera.isScanning) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Scan for QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    })

    if (code && code.data) {
      console.log('QR Code detected:', code.data)

      // Pause scanning temporarily
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = null
      }

      onQRCodeScanned(code.data)

      // Resume scanning after 3 seconds
      setTimeout(() => {
        if (camera.isScanning) {
          startQRScanning()
        }
      }, 3000)
    }
  }

  const switchCamera = async () => {
    if (camera.devices.length <= 1) return

    const currentIndex = camera.devices.findIndex(d => d.deviceId === camera.selectedDeviceId)
    const nextIndex = (currentIndex + 1) % camera.devices.length
    const nextDevice = camera.devices[nextIndex]

    // Stop current camera
    stopCamera()

    // Wait a moment then start with new device
    setTimeout(() => {
      setCamera(prev => ({
        ...prev,
        selectedDeviceId: nextDevice.deviceId
      }))

      setResult({
        message: `Switching to ${nextDevice.label || 'next camera'}...`,
        type: 'loading'
      })

      // Start camera will automatically use the new selectedDeviceId
      setTimeout(startCamera, 500)
    }, 500)
  }

  const onQRCodeScanned = async (qrData: string) => {
    console.log('Processing QR code:', qrData)
    await validateTicket({ qrCode: qrData })
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
      if (!camera.isScanning) {
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

        {/* Camera Scanner Section */}
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
              {camera.devices.length > 1 && (
                <button
                  onClick={switchCamera}
                  disabled={!camera.hasPermission}
                  className="px-3 py-1 text-xs bg-white/20 text-white rounded border border-white/30 hover:bg-white/30 transition-colors disabled:opacity-50"
                >
                  📷 Switch
                </button>
              )}
            </div>
          </div>

          {/* Camera Display */}
          <div className="relative mb-6">
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: '400px' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${camera.isScanning ? 'block' : 'hidden'}`}
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />

              {!camera.isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="text-6xl text-white/50 mb-4">📱</div>
                  <p className="text-white/70 text-lg mb-2">QR Code Scanner</p>
                  {camera.error ? (
                    <p className="text-red-400 text-sm px-4">{camera.error}</p>
                  ) : camera.hasPermission ? (
                    <p className="text-white/50 text-sm">Ready to start scanning</p>
                  ) : (
                    <p className="text-white/50 text-sm">Camera permission required</p>
                  )}
                  {camera.devices.length > 0 && (
                    <p className="text-xs text-white/40 mt-2">
                      {camera.devices.length} camera(s) available
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center mt-4">
              {!camera.isScanning ? (
                <button
                  onClick={startCamera}
                  className="px-8 py-3 bg-white text-slate-900 rounded-lg font-medium tracking-wide hover:bg-white/90 transition-colors flex items-center gap-2"
                >
                  <span className="text-xl">📷</span>
                  START SCANNER
                </button>
              ) : (
                <button
                  onClick={stopCamera}
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