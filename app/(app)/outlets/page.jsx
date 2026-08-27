"use client"

import { useEffect, useState } from "react"
import OutletsTable from "@/components/outlets-table"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function OutletsPage() {
  const [initialOutlets, setInitialOutlets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const res = await fetch('/api/outlets')
        if (res.ok) {
          const data = await res.json()
          setInitialOutlets(data.outlets || [])
        }
      } catch (error) {
        console.error('Error fetching outlets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            Loading outlets...
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Outlets</h1>
        <p className="text-muted-foreground mt-2">Manage your store outlets and locations</p>
      </div>

      <OutletsTable initialOutlets={initialOutlets} />
    </div>
  )
}
