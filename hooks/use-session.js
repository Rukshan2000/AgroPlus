'use client'

import { useState, useEffect } from 'react'

export function useSession() {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function getSession() {
      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const sessionData = await response.json()
          setSession(sessionData)
        }
      } catch (error) {
        console.error('Failed to fetch session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getSession()
  }, [])

  return { session, isLoading }
}
