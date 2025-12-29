'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export default function BarcodeLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleScan = async (barcodeId) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/barcode-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ barcodeId })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed. Please try again.')
        return
      }

      setSuccess(true)
      setError(null)

      // Redirect to dashboard after successful login
      setTimeout(() => {
        router.push('/app/dashboard')
      }, 500)
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Barcode login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleError = (errorMsg) => {
    setError(errorMsg)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle>Login Successful!</CardTitle>
            <CardDescription>Redirecting to dashboard...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Barcode Login</h1>
          <p className="text-gray-600 mt-2">Quick and secure authentication</p>
        </div>

        {/* Scanner Card */}
        <BarcodeScanner
          onScan={handleScan}
          onError={handleError}
          disabled={isLoading}
        />

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Links */}
        <div className="flex gap-2 justify-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            Email Login
          </Link>
          <span className="text-gray-300">•</span>
          <Link href="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-700">
              <strong>How it works:</strong> Your barcode ID uniquely identifies you. Scan the barcode on your login card to access your account instantly.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
