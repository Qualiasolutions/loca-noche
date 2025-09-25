'use client'

import { useState, useEffect, useRef } from 'react'
import Script from 'next/script'

export default function ValidatorPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [validCount, setValidCount] = useState(0)
  const [invalidCount, setInvalidCount] = useState(0)
  const [result, setResult] = useState<{ message: string; type: 'valid' | 'invalid' | 'loading' } | null>(null)
  const [manualInput, setManualInput] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [qrLibLoaded, setQrLibLoaded] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')

  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    // Load saved stats
    const savedValid = localStorage.getItem('locanoche_valid_count')
    const savedInvalid = localStorage.getItem('locanoche_invalid_count')
    if (savedValid) setValidCount(parseInt(savedValid))
    if (savedInvalid) setInvalidCount(parseInt(savedInvalid))

    // Check initial camera permissions
    checkCameraPermissions()

    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy()
        scannerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    // Save stats
    localStorage.setItem('locanoche_valid_count', validCount.toString())
    localStorage.setItem('locanoche_invalid_count', invalidCount.toString())
  }, [validCount, invalidCount])

  const checkCameraPermissions = async () => {
    try {
      const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName })
      setCameraPermission(permissions.state)

      permissions.addEventListener('change', () => {
        setCameraPermission(permissions.state)
      })
    } catch (error) {
      console.log('Permissions API not supported, will check on camera access')
      setCameraPermission('unknown')
    }
  }

  const requestCameraAccess = async (): Promise<boolean> => {
    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop())

      setCameraPermission('granted')
      return true
    } catch (error: any) {
      console.error('Camera access failed:', error)

      if (error.name === 'NotAllowedError') {
        setCameraPermission('denied')
        setResult({
          message: 'Camera permission denied. Please enable camera access in your browser settings and try again.',
          type: 'invalid'
        })
      } else if (error.name === 'NotFoundError') {
        setResult({
          message: 'No camera found on this device.',
          type: 'invalid'
        })
      } else {
        setResult({
          message: `Camera error: ${error.message || 'Unknown error'}`,
          type: 'invalid'
        })
      }

      return false
    }
  }

  const initScanner = async () => {
    if (!videoRef.current) {
      setResult({ message: 'Video element not ready', type: 'invalid' })
      return
    }

    if (!qrLibLoaded) {
      setResult({ message: 'QR Scanner library still loading...', type: 'loading' })
      return
    }

    try {
      // First check/request camera permissions
      setResult({ message: 'Requesting camera access...', type: 'loading' })
      const hasCamera = await requestCameraAccess()

      if (!hasCamera) {
        return // Error message already set in requestCameraAccess
      }

      // Wait for QrScanner to be available
      if (!(window as any).QrScanner) {
        setResult({ message: 'QR Scanner not available', type: 'invalid' })
        return
      }

      const QrScanner = (window as any).QrScanner

      setResult({ message: 'Initializing camera...', type: 'loading' })

      const scanner = new QrScanner(
        videoRef.current,
        (result: any) => onQrCodeScanned(result.data || result),
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          maxScansPerSecond: 5, // Limit scan rate for performance
        }
      )

      scannerRef.current = scanner

      // Start the scanner
      await scanner.start()
      setIsScanning(true)
      setResult({ message: 'Camera active - Position QR code in frame', type: 'loading' })

    } catch (error: any) {
      console.error('Failed to start scanner:', error)

      if (error.name === 'NotAllowedError') {
        setResult({
          message: 'Camera permission was denied. Please refresh the page and allow camera access.',
          type: 'invalid'
        })
      } else if (error.name === 'NotFoundError') {
        setResult({
          message: 'No camera found. Please ensure your device has a working camera.',
          type: 'invalid'
        })
      } else if (error.name === 'NotReadableError') {
        setResult({
          message: 'Camera is already in use by another application.',
          type: 'invalid'
        })
      } else {
        setResult({
          message: `Scanner failed to start: ${error.message || 'Unknown error'}`,
          type: 'invalid'
        })
      }
    }
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop()
      scannerRef.current.destroy()
      scannerRef.current = null
      setIsScanning(false)
      setResult({ message: 'Camera stopped', type: 'loading' })
    }
  }

  const switchCamera = async () => {
    if (!scannerRef.current) return

    try {
      const hasFlash = await scannerRef.current.hasFlash()
      if (hasFlash) {
        await scannerRef.current.turnFlashOff()
      }

      const cameras = await (window as any).QrScanner.listCameras(true)
      if (cameras.length > 1) {
        const currentCamera = scannerRef.current.camera
        const nextCameraIndex = cameras.findIndex((cam: any) => cam.id === currentCamera?.id) + 1
        const nextCamera = cameras[nextCameraIndex] || cameras[0]

        await scannerRef.current.setCamera(nextCamera.id)
        setResult({ message: `Switched to ${nextCamera.label || 'camera'}`, type: 'loading' })

        setTimeout(() => {
          if (isScanning) {
            setResult({ message: 'Camera active - Position QR code in frame', type: 'loading' })
          }
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to switch camera:', error)
      setResult({ message: 'Failed to switch camera', type: 'invalid' })
    }
  }

  const onQrCodeScanned = async (qrCode: string) => {
    if (!isScanning) return

    // Pause scanning
    setIsScanning(false)
    
    await validateTicket({ qrCode })

    // Resume after 3 seconds
    setTimeout(() => {
      setIsScanning(true)
    }, 3000)
  }

  const validateTicket = async (data: any) => {
    setResult({ message: 'Validating...', type: 'loading' })

    try {
      const response = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          validatorId: 'STAFF-001',
          deviceInfo: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        })
      })

      const result = await response.json()

      if (result.valid) {
        setResult({
          message: `✅ VALID - ${result.ticket.customerName} - ${result.ticket.eventName}`,
          type: 'valid'
        })
        setValidCount(v => v + 1)
        if (soundEnabled) playSound('success')
      } else {
        setResult({
          message: `❌ ${result.message}`,
          type: 'invalid'
        })
        setInvalidCount(i => i + 1)
        if (soundEnabled) playSound('error')
      }
    } catch (error: any) {
      console.error('Validation error:', error)

      // More detailed error messages
      let errorMessage = 'Connection error'
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network connection failed'
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
    
    await validateTicket({ 
      ticketNumber: manualInput,
      qrCode: manualInput 
    })
    
    setManualInput('')
  }

  const playSound = (type: 'success' | 'error') => {
    const audio = new Audio(
      type === 'success' 
        ? 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAeCC+HzvLZiTYIG2m98OTLR0w='
        : 'data:audio/wav;base64,UklGRiQEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAEAAB/h4qFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAeCC+HzvLZiTYIG2m98OTLR0w='
    )
    audio.play().catch(() => {})
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/95 backdrop-blur rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light tracking-wider mb-2">LOCA NOCHE</h1>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm uppercase tracking-widest">Ticket Validation System</p>
          </div>

          <div className="mb-6 flex justify-center">
            <label className="flex items-center gap-3 text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-slate-600 focus:ring-slate-500"
              />
              <span className="text-sm">Sound Feedback</span>
            </label>
          </div>

          {/* Camera Section */}
          <div className="mb-8">
            <div className="relative bg-black rounded-lg overflow-hidden mb-4 border border-gray-200" style={{ height: '300px' }}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{ display: isScanning ? 'block' : 'none' }}
                playsInline
                muted
                autoPlay
              />
              {!isScanning && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  {!qrLibLoaded ? (
                    <p className="text-gray-400 text-sm">Loading scanner library...</p>
                  ) : cameraPermission === 'denied' ? (
                    <div>
                      <p className="text-red-400 text-sm mb-2">Camera Access Denied</p>
                      <p className="text-gray-500 text-xs">Please enable camera permissions in your browser</p>
                    </div>
                  ) : cameraPermission === 'granted' ? (
                    <p className="text-gray-400 text-sm">Camera Ready - Click to start scanning</p>
                  ) : (
                    <p className="text-gray-400 text-sm">Camera Inactive</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              {!isScanning ? (
                <button
                  onClick={initScanner}
                  disabled={!qrLibLoaded}
                  className={`px-8 py-2.5 rounded-lg font-light tracking-wide transition-colors ${
                    !qrLibLoaded
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {!qrLibLoaded ? 'LOADING...' : 'START SCANNER'}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={stopScanner}
                    className="px-8 py-2.5 bg-slate-600 text-white rounded-lg font-light tracking-wide hover:bg-slate-700 transition-colors"
                  >
                    STOP
                  </button>
                  <button
                    onClick={switchCamera}
                    className="px-4 py-2.5 bg-slate-700 text-white rounded-lg font-light tracking-wide hover:bg-slate-600 transition-colors text-sm"
                  >
                    📷
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Manual Entry */}
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-sm uppercase tracking-wider text-gray-600 mb-4">Manual Validation</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualValidate()}
                placeholder="Enter ticket code"
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:border-slate-600 focus:outline-none text-sm"
              />
              <button
                onClick={handleManualValidate}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-light text-sm tracking-wide hover:bg-slate-800 transition-colors"
              >
                VALIDATE
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div
              className={`p-5 rounded-lg text-center mb-6 border ${
                result.type === 'valid' ? 'bg-green-50 border-green-200 text-green-800' :
                result.type === 'invalid' ? 'bg-red-50 border-red-200 text-red-800' :
                'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <p className="text-sm font-medium">{result.message}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-200 p-6 rounded-lg text-center">
              <div className="text-2xl font-light text-slate-900">{validCount}</div>
              <div className="text-xs uppercase tracking-wider text-gray-500 mt-2">Valid</div>
            </div>
            <div className="border border-gray-200 p-6 rounded-lg text-center">
              <div className="text-2xl font-light text-slate-900">{invalidCount}</div>
              <div className="text-xs uppercase tracking-wider text-gray-500 mt-2">Invalid</div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setValidCount(0)
                setInvalidCount(0)
                localStorage.removeItem('locanoche_valid_count')
                localStorage.removeItem('locanoche_invalid_count')
              }}
              className="text-gray-400 hover:text-gray-600 text-xs uppercase tracking-wider transition-colors"
            >
              Reset Counter
            </button>
          </div>
        </div>
      </div>

      {/* Load QR Scanner library */}
      <Script
        src="/qr-scanner.umd.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('QR Scanner library loaded successfully')
          setQrLibLoaded(true)
        }}
        onError={(e) => {
          console.error('Failed to load QR Scanner library:', e)
          setResult({ message: 'Failed to load scanner library', type: 'invalid' })
        }}
      />
    </div>
  )
}