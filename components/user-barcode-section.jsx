'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Loader2, Download, Copy, QrCode, AlertTriangle } from 'lucide-react'
import { BarcodeGenerateModal } from './barcode-generate-modal'

/**
 * User Barcode Section Component
 * Shows existing barcode QR code or generate button
 */
export function UserBarcodeSection({ user }) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasBarcode, setHasBarcode] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)

  // Load user's barcode status and QR code
  useEffect(() => {
    const fetchBarcodeData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Check if user has a barcode
        const response = await fetch(`/api/users/${user.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch user data')
        }

        const userData = await response.json()
        
        if (userData.barcode_id) {
          setHasBarcode(true)
          
          // Fetch the QR code
          try {
            const qrResponse = await fetch(`/api/users/${user.id}/barcode/qr`)
            if (qrResponse.ok) {
              const qrData = await qrResponse.json()
              setQrCode(qrData.qrCode)
            } else {
              const errData = await qrResponse.json().catch(() => ({}))
              console.warn('QR code fetch error:', errData)
              // Don't set error, user has barcode, QR might just need regeneration
            }
          } catch (err) {
            console.error('Error fetching QR code:', err)
            // Don't fail completely if QR code fetch fails
          }
        } else {
          setHasBarcode(false)
        }
      } catch (err) {
        console.error('Error fetching barcode data:', err)
        setError(err.message || 'Failed to load barcode data')
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.id) {
      fetchBarcodeData()
    }
  }, [user?.id])

  const downloadBarcode = async (format = 'pdf') => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/user/barcode/download?format=${format}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to download' }))
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
    } catch (err) {
      console.error('Download error:', err)
      setError(`Download error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const copyQRCode = async () => {
    try {
      if (qrCode) {
        // Copy the QR code image as blob
        const response = await fetch(qrCode)
        const blob = await response.blob()
        
        // Use Clipboard API to copy image
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ])
        
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error('Error copying QR code:', err)
      setError('Failed to copy QR code')
    }
  }

  const handleBarcodeGenerated = () => {
    setIsGenerateModalOpen(false)
    // Refresh the page to show new barcode
    window.location.reload()
  }

  const retryLoadQRCode = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const qrResponse = await fetch(`/api/users/${user.id}/barcode/qr`)
      if (qrResponse.ok) {
        const qrData = await qrResponse.json()
        setQrCode(qrData.qrCode)
      } else {
        const errData = await qrResponse.json().catch(() => ({}))
        setError(errData.error || 'Failed to load QR code')
      }
    } catch (err) {
      console.error('Error retrying QR code fetch:', err)
      setError(err.message || 'Failed to load QR code')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !hasBarcode && !qrCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Login Barcode
          </CardTitle>
          <CardDescription>Manage your barcode for quick login</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Login Barcode
          </CardTitle>
          <CardDescription>
            {hasBarcode
              ? 'Your barcode for quick login'
              : 'Generate a barcode to enable quick login'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {hasBarcode && qrCode ? (
            // Show QR Code
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800">
                  ✓ Your barcode is active and ready to use
                </AlertDescription>
              </Alert>

              <div className="flex flex-col items-center space-y-4">
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                  <img
                    src={qrCode}
                    alt="Your Login QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Scan this code with your device to login quickly
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyQRCode}
                  disabled={isLoading}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadBarcode('pdf')}
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setIsGenerateModalOpen(true)}
              >
                Generate New Barcode
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Note: Generating a new barcode will invalidate your current one
              </p>
            </div>
          ) : hasBarcode && !qrCode ? (
            // User has barcode but QR code failed to load
            <div className="space-y-4">
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Your barcode exists but QR code failed to load. Try refreshing.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={retryLoadQRCode}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading QR Code...
                  </>
                ) : (
                  'Retry Loading QR Code'
                )}
              </Button>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setIsGenerateModalOpen(true)}
              >
                Generate New Barcode
              </Button>
            </div>
          ) : (
            // Show Generate Button
            <div className="space-y-4">
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  No barcode found. Generate one to enable quick login.
                </AlertDescription>
              </Alert>

              <div className="text-center py-4">
                <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm mb-4">
                  Create a unique barcode for your account
                </p>
              </div>

              <Button
                onClick={() => setIsGenerateModalOpen(true)}
                className="w-full"
                size="lg"
              >
                Generate Barcode
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Barcode Modal */}
      <BarcodeGenerateModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        user={user}
        onSuccess={handleBarcodeGenerated}
      />
    </>
  )
}
