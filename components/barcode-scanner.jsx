'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Alert, AlertDescription } from './ui/alert'
import { Loader2, AlertTriangle, Camera, AlertCircle } from 'lucide-react'

/**
 * Barcode Scanner Component
 * Supports both camera scanning and manual input
 */
export function BarcodeScanner({ onScan, onError, disabled = false }) {
  const [scanMethod, setScanMethod] = useState('camera') // 'camera' or 'manual'
  const [manualInput, setManualInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState(null)
  const [stream, setStream] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  // Request camera permission and start scanning
  const startCameraScanning = async () => {
    try {
      setError(null)
      setIsScanning(true)

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream

        // Start frame capture for barcode detection
        scanFrames(videoRef.current, mediaStream)
      }
    } catch (err) {
      const errorMsg = err?.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access.'
        : 'Could not access camera. Please ensure camera is available.'

      setError(errorMsg)
      setIsScanning(false)
      onError?.(errorMsg)
    }
  }

  // Scan video frames for barcode
  const scanFrames = async (video, mediaStream) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const scanLoop = setInterval(async () => {
      if (!mediaStream.active) {
        clearInterval(scanLoop)
        return
      }

      try {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

        // Try to detect barcode (QR code format)
        const barcodeData = await detectBarcode(imageData)

        if (barcodeData) {
          stopCameraScanning()
          onScan?.(barcodeData)
          setError(null)
        }
      } catch (err) {
        // Continue scanning on error
        console.error('Barcode detection error:', err)
      }
    }, 100) // Scan every 100ms

    return () => clearInterval(scanLoop)
  }

  // Simple barcode detection (QR code pattern)
  const detectBarcode = async (imageData) => {
    try {
      // For production, consider using jsQR or other barcode libraries
      // This is a placeholder for barcode detection logic
      // In a real app, you'd use a library like jsQR or @zxing/library

      // For now, return null - actual detection requires external library
      return null
    } catch (error) {
      return null
    }
  }

  const stopCameraScanning = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsScanning(false)
  }

  const handleManualScan = (e) => {
    e.preventDefault()
    if (manualInput.trim()) {
      onScan?.(manualInput.trim())
      setManualInput('')
      setError(null)
    }
  }

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Barcode Login</CardTitle>
        <CardDescription>Scan your barcode or enter ID manually</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Scan Method Tabs */}
        <div className="flex gap-2">
          <Button
            variant={scanMethod === 'camera' ? 'default' : 'outline'}
            onClick={() => {
              setScanMethod('camera')
              if (isScanning) {
                startCameraScanning()
              }
            }}
            disabled={disabled}
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            Camera
          </Button>
          <Button
            variant={scanMethod === 'manual' ? 'default' : 'outline'}
            onClick={() => {
              setScanMethod('manual')
              stopCameraScanning()
            }}
            disabled={disabled}
            className="flex-1"
          >
            Manual
          </Button>
        </div>

        {/* Camera Scanning */}
        {scanMethod === 'camera' && (
          <div className="space-y-3">
            {isScanning ? (
              <div className="space-y-3">
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Scanning indicator */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-green-500 rounded-lg w-48 h-32 animate-pulse" />
                  </div>

                  {/* Loading indicator */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/50 px-3 py-2 rounded">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span className="text-sm text-white">Scanning...</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={stopCameraScanning}
                  disabled={disabled}
                  className="w-full"
                >
                  Stop Scanning
                </Button>
              </div>
            ) : (
              <Button
                onClick={startCameraScanning}
                disabled={disabled}
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Point your device camera at the barcode to scan. Make sure the barcode is clearly visible.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Manual Input */}
        {scanMethod === 'manual' && (
          <form onSubmit={handleManualScan} className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Barcode ID</label>
              <Input
                type="text"
                placeholder="Enter barcode ID"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                disabled={disabled}
                autoFocus
                className="font-mono"
              />
            </div>
            <Button
              type="submit"
              disabled={disabled || !manualInput.trim()}
              className="w-full"
            >
              Submit
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
