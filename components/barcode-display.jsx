'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Loader2, Download, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'

/**
 * Barcode Display and Download Component
 * Shows barcode after user creation
 */
export function BarcodeDisplay({ barcodeId, userName, userEmail, onClose }) {
  const [isLoading, setIsLoading] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [showBarcode, setShowBarcode] = useState(true)
  const [error, setError] = useState(null)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  // Fetch QR code
  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/user/barcode/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: null }) // Uses current user
        })

        if (response.ok) {
          const data = await response.json()
          setQrCode(data.qrCode)
        }
      } catch (err) {
        console.error('Error fetching QR code:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (barcodeId) {
      fetchQRCode()
    }
  }, [barcodeId])

  const downloadBarcode = async (format = 'pdf') => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/user/barcode/download?format=${format}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to download barcode' }))
        setError(errorData.error || 'Failed to download barcode')
        return
      }

      const contentType = response.headers.get('content-type')
      
      // Check if response is actually a file or error JSON
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to download barcode')
        return
      }

      const blob = await response.blob()
      
      // Verify blob has content
      if (!blob || blob.size === 0) {
        setError('Failed to generate barcode: Empty response')
        return
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename="')[1]?.split('"')[0]
        : `barcode.${format}`

      if (!filename) {
        setError('Failed to determine filename')
        window.URL.revokeObjectURL(url)
        return
      }

      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 3000)
    } catch (err) {
      console.error('Download error:', err)
      setError(`An error occurred during download: ${err.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Your Login Barcode</DialogTitle>
          <DialogDescription>
            Save or download your barcode to login quickly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Alert */}
          <Alert variant="default" className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Important:</strong> Keep your barcode safe and secure. Do not share it with others.
            </AlertDescription>
          </Alert>

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-semibold text-gray-900">{userName}</p>

            <p className="text-sm text-gray-600 mt-3">Email</p>
            <p className="font-semibold text-gray-900">{userEmail}</p>
          </div>

          {/* QR Code Display */}
          {showBarcode && (
            <div className="flex flex-col items-center space-y-3">
              {isLoading && !qrCode ? (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : qrCode ? (
                <div className="flex flex-col items-center">
                  <img
                    src={qrCode}
                    alt="Login Barcode"
                    className="w-64 h-64 border-2 border-gray-200 rounded-lg p-2"
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center max-w-xs">
                    Scan this QR code to login instantly
                  </p>
                </div>
              ) : (
                <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Could not generate barcode</p>
                </div>
              )}
            </div>
          )}

          {/* Barcode ID Display */}
          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-gray-600 mb-1">Barcode ID (for manual entry)</p>
              <p className="font-mono text-sm break-all text-gray-900">
                {showBarcode ? barcodeId : '••••••••••••••••'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBarcode(!showBarcode)}
            >
              {showBarcode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {downloadSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Barcode downloaded successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Download Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => downloadBarcode('pdf')}
              disabled={isLoading}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {isLoading ? 'Downloading...' : 'Download PDF'}
            </Button>
            <Button
              onClick={() => downloadBarcode('png')}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={onClose}
            className="flex-1"
            variant="default"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
