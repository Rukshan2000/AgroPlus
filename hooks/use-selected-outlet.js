import { useEffect, useState } from "react"

/**
 * Hook to get the selected outlet from localStorage
 * Returns null if no outlet is selected
 */
export function useSelectedOutlet() {
  const [outletId, setOutletId] = useState(null)
  const [outletName, setOutletName] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Client-side only
    if (typeof window !== "undefined") {
      const selected = localStorage.getItem("selectedOutlet")
      const name = localStorage.getItem("selectedOutletName")
      
      setOutletId(selected ? parseInt(selected) : null)
      setOutletName(name || null)
      setIsLoading(false)
    }
  }, [])

  return { outletId, outletName, isLoading }
}

/**
 * Set the selected outlet in localStorage
 */
export function setSelectedOutlet(outletId, outletName) {
  if (typeof window !== "undefined") {
    localStorage.setItem("selectedOutlet", outletId.toString())
    localStorage.setItem("selectedOutletName", outletName)
  }
}

/**
 * Clear the selected outlet from localStorage
 */
export function clearSelectedOutlet() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("selectedOutlet")
    localStorage.removeItem("selectedOutletName")
  }
}
