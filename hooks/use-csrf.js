'use client'

import { useState, useEffect } from 'react'

export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState('')

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        console.log('Fetching CSRF token...') // Debug log
        const response = await fetch('/api/auth/csrf')
        const data = await response.json()
        console.log('CSRF response:', { ok: response.ok, data }) // Debug log
        if (response.ok && data.csrfToken) {
          setCsrfToken(data.csrfToken)
          console.log('CSRF token set:', data.csrfToken) // Debug log
        } else {
          console.error('Failed to get CSRF token:', response.status, data)
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error)
      }
    }

    fetchCsrfToken()
  }, [])

  const getHeaders = (additionalHeaders = {}) => {
    return {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      ...additionalHeaders
    }
  }

  return { csrfToken, getHeaders }
}
