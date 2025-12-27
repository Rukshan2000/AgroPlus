"use client"

import { useEffect, useState } from "react"
import ProductDistributionTable from "@/components/product-distribution-table"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Truck, Package, MapPin, TrendingUp } from "lucide-react"

async function fetchDistributions() {
  try {
    const res = await fetch("/api/product-distribute?page=1&limit=100")
    if (res.ok) {
      const data = await res.json()
      return data
    }
  } catch (error) {
    console.error("Error fetching distributions:", error)
  }
  return { distributions: [], total: 0 }
}

async function fetchProducts() {
  try {
    const res = await fetch("/api/products?page=1&limit=1000")
    if (res.ok) {
      const data = await res.json()
      return data.products || []
    }
  } catch (error) {
    console.error("Error fetching products:", error)
  }
  return []
}

async function fetchOutlets() {
  try {
    const res = await fetch("/api/outlets?page=1&limit=1000")
    if (res.ok) {
      const data = await res.json()
      return data.outlets || []
    }
  } catch (error) {
    console.error("Error fetching outlets:", error)
  }
  return []
}

export default function ProductDistributePage() {
  const [initialData, setInitialData] = useState({
    distributions: [],
    products: [],
    outlets: [],
    stats: {}
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [distributionsData, productsData, outletsData] = await Promise.all([
          fetchDistributions(),
          fetchProducts(),
          fetchOutlets()
        ])

        // Calculate stats
        const stats = {
          totalDistributions: distributionsData.total || 0,
          totalQuantity: distributionsData.distributions?.reduce((sum, d) => sum + parseFloat(d.quantity_distributed || 0), 0) || 0,
          uniqueProducts: new Set(distributionsData.distributions?.map(d => d.product_id)).size || 0,
          uniqueOutlets: new Set(distributionsData.distributions?.map(d => d.outlet_id)).size || 0,
        }

        setInitialData({
          distributions: distributionsData.distributions || [],
          products: productsData,
          outlets: outletsData,
          stats
        })
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            Loading product distribution data...
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Truck className="h-8 w-8" />
          Product Distribution
        </h1>
        <p className="text-muted-foreground mt-2">
          Distribute available products from warehouse to different outlets
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distributions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialData.stats.totalDistributions}</div>
            <p className="text-xs text-muted-foreground">Distribution records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialData.stats.totalQuantity.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Units distributed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialData.stats.uniqueProducts}</div>
            <p className="text-xs text-muted-foreground">Unique products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outlets</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialData.stats.uniqueOutlets}</div>
            <p className="text-xs text-muted-foreground">Receiving outlets</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Table */}
      <ProductDistributionTable
        initialDistributions={initialData.distributions}
        products={initialData.products}
        outlets={initialData.outlets}
      />
    </div>
  )
}
