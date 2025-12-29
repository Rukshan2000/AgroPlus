'use client'

import { useState, useRef, useEffect } from 'react'
import jsQR from 'jsqr'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Loader2 } from 'lucide-react'

export function BarcodeLoginScanner({ isOpen, onClose, onSuccess, onError }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const scanIntervalRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [scannedData, setScannedData] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      // Clean up camera when modal closes
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      return
    }

    const startCamera = async () => {
      try {
        setCameraError(null)
        setPermissionDenied(false)
        setScannedData(null)
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          
          // Wait for video to actually start playing and have data
          const onPlayHandler = () => {
            console.log('[QR Scanner] Video is now playing, starting scan...')
            setTimeout(() => {
              startScanning()
            }, 500) // Small delay to ensure video has buffered data
          }
          
          videoRef.current.onplay = onPlayHandler
          videoRef.current.play().catch(err => console.warn('[QR Scanner] Auto-play failed:', err))
        }
      } catch (err) {
        console.error('Camera error:', err)
        if (err.name === 'NotAllowedError') {
          setPermissionDenied(true)
          setCameraError('Camera permission denied. Please allow camera access in your browser settings.')
        } else {
          setCameraError('Unable to access camera. Please check your device.')
        }
        onError?.(err)
      }
    }

    const startScanning = () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }

      let scanCount = 0
      scanIntervalRef.current = setInterval(() => {
        scanCount++
        
        if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          const canvas = canvasRef.current
          const context = canvas.getContext('2d', { willReadFrequently: true })
          
          canvas.width = videoRef.current.videoWidth
          canvas.height = videoRef.current.videoHeight
          
          // Log camera preview status
          if (scanCount % 10 === 0) { // Log every second (100ms * 10)
            console.log(`[QR Scanner] Checking camera preview... (${scanCount} scans)`)
          }
          
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

          // Try to decode QR code using jsQR library
          try {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(imageData.data, imageData.width, imageData.height)
            
            if (code && code.data) {
              console.log('✅ QR Code DETECTED:', code.data)
              console.log('QR Data location:', code.location)
              console.log('QR Data length:', code.data.length)
              console.log('QR Data bytes:', Array.from(code.data).map(c => c.charCodeAt(0)))
              clearInterval(scanIntervalRef.current)
              setScannedData(code.data)
              loginWithBarcode(code.data)
            } else {
              if (scanCount % 20 === 0) { // Log every 2 seconds
                console.log(`[QR Scanner] No QR code found in frame`)
              }
            }
          } catch (err) {
            console.error('[QR Scanner] Error decoding QR code:', err)
          }
        } else {
          if (scanCount % 10 === 0) {
            console.log('[QR Scanner] Video not ready or canvas missing', {
              videoReady: videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA,
              hasCanvas: !!canvasRef.current
            })
          }
        }
      }, 100) // Scan every 100ms for better detection
      
      console.log('[QR Scanner] Scanning started')
    }

    startCamera()

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [isOpen, onError])

  const handleManualEntry = async () => {
    const barcodeId = prompt('Enter barcode ID:')
    if (barcodeId && barcodeId.trim()) {
      await loginWithBarcode(barcodeId.trim())
    }
  }

  // Simple QR code decoder - looks for QR patterns
  const decodeQRCode = (imageData) => {
    // This is a simplified detector that looks for the characteristic QR code patterns
    // For production, use a library like jsQR or ZXing
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height

    // Look for the timing pattern (alternating black/white lines)
    // This is a very basic detection - check for contrasting areas
    let darkCount = 0
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      if (brightness < 128) {
        darkCount++
      }
    }

    // If roughly 50% dark pixels, likely a QR code
    const darkRatio = darkCount / (width * height)
    if (darkRatio > 0.3 && darkRatio < 0.7) {
      // Try to extract data from the QR code pattern
      // Since we can't fully decode without a proper library, return a placeholder
      return extractQRData(imageData)
    }

    return null
  }

  // Extract data from detected QR code
  const extractQRData = (imageData) => {
    // This is a simplified extraction that looks for barcode-like patterns
    // In production, use jsQR library for proper decoding
    try {
      const canvas = canvasRef.current
      if (!canvas) return null

      // For now, return a signal that QR was detected
      // The actual barcode extraction would need jsQR library
      // This will be caught by the manual entry fallback
      return null
    } catch (e) {
      return null
    }
  }

  const loginWithBarcode = async (barcodeId) => {
    try {
      setIsLoading(true)
      setCameraError(null)
      
      console.log('[Barcode Login] Sending barcode to server:', barcodeId)
      
      const response = await fetch('/api/auth/barcode-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcodeId })
      })

      const data = await response.json()
      
      console.log('[Barcode Login] Response status:', response.status)
      console.log('[Barcode Login] Response data:', data)

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to login with barcode'
        console.error('Barcode login error:', errorMsg)
        setCameraError(errorMsg)
        onError?.(new Error(errorMsg))
        return
      }

      console.log('Barcode login successful:', data.user)
      onSuccess?.(data.user)
    } catch (err) {
      console.error('Barcode login error:', err)
      const errorMsg = err.message || 'Failed to login with barcode'
      setCameraError(errorMsg)
      onError?.(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
        onClose()
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Barcode to Login</DialogTitle>
          <DialogDescription>
            Position the QR code in view of your camera
          </DialogDescription>
        </DialogHeader>

        {/* Hidden canvas for QR code scanning */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="space-y-4 py-4">
          {cameraError ? (
            <>
              <Alert variant="destructive">
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
              
              {permissionDenied && (
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>To enable camera access:</strong></p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Click the lock icon in the address bar</li>
                    <li>Find "Camera" in the permissions list</li>
                    <li>Set it to "Allow"</li>
                    <li>Refresh the page</li>
                  </ol>
                </div>
              )}

              <Button
                onClick={handleManualEntry}
                className="w-full"
              >
                Enter Barcode Manually
              </Button>
            </>
          ) : (
            <>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-green-500 rounded-lg">
                  <div className="absolute inset-4 border-2 border-dashed border-green-500 opacity-50" />
                </div>
              </div>

              <Button
                onClick={handleManualEntry}
                variant="outline"
                className="w-full"
              >
                Enter Barcode Manually
              </Button>

              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full"
              >
                Cancel
              </Button>
            </>
          )}

          {isLoading && (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Authenticating...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
