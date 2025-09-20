'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/use-session'

export default function CashierRedirect() {
  const { session, isLoading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && session?.user?.role === 'cashier') {
      // Only redirect if not already on POS page
      if (window.location.pathname !== '/pos') {
        router.replace('/pos')
      }
    }
  }, [session, isLoading, router])

  // Don't render anything
  return null
}
