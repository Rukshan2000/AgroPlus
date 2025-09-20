'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/use-session'

export default function RoleGuard({ children, allowedRoles = [], redirectTo = '/login' }) {
  const { session, isLoading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        router.replace('/login')
        return
      }

      const userRole = session.user.role

      // Special handling for cashier - redirect to POS if trying to access other pages
      if (userRole === 'cashier' && window.location.pathname !== '/pos') {
        router.replace('/pos')
        return
      }

      // Check if user has required role
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        router.replace(redirectTo)
        return
      }
    }
  }, [session, isLoading, router, allowedRoles, redirectTo])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const userRole = session.user.role

  // Don't render if cashier is trying to access non-POS pages
  if (userRole === 'cashier' && window.location.pathname !== '/pos') {
    return null
  }

  // Don't render if user doesn't have required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return null
  }

  return children
}
