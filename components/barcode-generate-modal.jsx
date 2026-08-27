'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Alert, AlertDescription } from './ui/alert'
import { Loader2, Download, Copy, AlertTriangle } from 'lucide-react'

export function BarcodeGenerateModal({ isOpen, onClose, user, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [barcode, setBarcode] = useState(null)
  const [copied, setCopied] = useState(false)

  const generateBarcode = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/users/${user.id}/barcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to generate barcode')
        return
      }

      const data = await response.json()
      setBarcode(data)
      onSuccess?.(data)
    } catch (err) {
      console.error('Barcode generation error:', err)
      setError(`Error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadBarcode = async (format = 'pdf') => {
    try {
      // Get the QR code image that's already displayed
      const qrImage = document.querySelector('img[alt="Barcode QR Code"]')
      if (!qrImage) {
        setError('QR code image not found')
        return
      }

      // Create a canvas from the displayed QR code image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Load the image
      const img = new Image()
      img.onload = () => {
        // Set canvas size for proper quality (2" x 2" at 300 DPI)
        canvas.width = 600
        canvas.height = 600
        
        // White background
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Draw QR code centered
        const qrSize = 520
        const qrX = (canvas.width - qrSize) / 2
        const qrY = (canvas.height - qrSize) / 2
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize)
        
        // Add text below QR code
        ctx.fillStyle = 'black'
        ctx.textAlign = 'center'
        ctx.font = 'bold 14px Arial'
        ctx.fillText(`${user.name}`, canvas.width / 2, canvas.height - 30)
        
        ctx.font = '12px Arial'
        ctx.fillText(`${user.email}`, canvas.width / 2, canvas.height - 10)
        
        // Download based on format
        if (format === 'png') {
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `barcode-${user.email}-${new Date().getTime()}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          })
        } else if (format === 'pdf') {
          // For PDF, we'll use a simple approach with canvas
          const pdf = new (window.jsPDF || {})('p', 'mm', 'A4')
          const imgData = canvas.toDataURL('image/png')
          pdf.addImage(imgData, 'PNG', 30, 30, 150, 150)
          pdf.text(`Barcode for: ${user.name}`, 30, 200)
          pdf.text(`Email: ${user.email}`, 30, 210)
          pdf.text(`Barcode ID: ${barcode.barcodeId}`, 30, 220)
          pdf.save(`barcode-${user.email}-${new Date().getTime()}.pdf`)
        }
      }
      img.src = qrImage.src
    } catch (err) {
      console.error('Download error:', err)
      setError(`Download error: ${err.message}`)
    }
  }

  const copyBarcodeId = () => {
    if (barcode?.barcodeId) {
      navigator.clipboard.writeText(barcode.barcodeId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setBarcode(null)
        setError(null)
        setCopied(false)
        onClose()
      }
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Barcode for {user.name}</DialogTitle>
          <DialogDescription>
            Create a new login barcode for this user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!barcode ? (
            <>
              {/* Warning */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  This will create a new barcode. Previous barcode will be invalidated.
                </AlertDescription>
              </Alert>

              {/* Error */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-gray-900">{user.email}</p>
                <p className="text-sm text-gray-600 mt-2">Name</p>
                <p className="font-semibold text-gray-900">{user.name}</p>
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateBarcode}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Barcode'
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Success Message */}
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  ✓ Barcode generated successfully!
                </AlertDescription>
              </Alert>

              {/* QR Code Display */}
              <div className="flex flex-col items-center space-y-3">
                <img
                  src={barcode.qrCode}
                  alt="Barcode QR Code"
                  className="w-48 h-48 border-2 border-gray-200 rounded-lg p-2"
                />
                <p className="text-xs text-gray-500 text-center">
                  Scan to login instantly
                </p>
              </div>

              {/* Barcode ID */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Barcode ID (for manual entry)</p>
                <div className="flex gap-2 items-center">
                  <p className="font-mono text-sm break-all flex-1 text-gray-900">
                    {barcode.barcodeId}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyBarcodeId}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {copied && <p className="text-xs text-green-600 mt-1">Copied!</p>}
              </div>

              {/* Download Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => downloadBarcode('pdf')}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => downloadBarcode('png')}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PNG
                </Button>
              </div>

              {/* Close Button */}
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
