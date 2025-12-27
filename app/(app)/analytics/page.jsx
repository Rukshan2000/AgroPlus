'use client'

import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Undo2,
  Users,
  Activity,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export default function AnalyticsPage() {
  const { toast } = useToast()
  const [outlets, setOutlets] = useState([])
  const [selectedOutlet, setSelectedOutlet] = useState('')
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [topCustomers, setTopCustomers] = useState([])
  const [returnAnalytics, setReturnAnalytics] = useState(null)

  useEffect(() => {
    loadOutlets()
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [selectedOutlet])

  const loadOutlets = async () => {
    try {
      const response = await fetch('/api/outlets?limit=1000')
      if (response.ok) {
        const data = await response.json()
        setOutlets(data.outlets || [])
        // Auto-select first outlet
        if (data.outlets && data.outlets.length > 0) {
          setSelectedOutlet(data.outlets[0].id.toString())
        }
      }
    } catch (error) {
      console.error('Failed to load outlets:', error)
    }
  }

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const promises = [
        // Sales metrics with stats
        fetch(`/api/sales?stats=true${selectedOutlet ? `&outlet_id=${selectedOutlet}` : ''}`),
        // Return analytics
        fetch(`/api/returns?stats=true&days=30${selectedOutlet ? `&outlet_id=${selectedOutlet}` : ''}`),
      ]

      const [metricsRes, returnsRes] = await Promise.all(promises)

      if (metricsRes.ok) {
        const data = await metricsRes.json()
        // Extract the data from the general stats
        setMetrics(data.general)
        // Set top products from the stats response
        setTopProducts(data.topProducts || [])
      }

      if (returnsRes.ok) {
        const data = await returnsRes.json()
        setReturnAnalytics(data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load analytics',
        variant: 'destructive',
      })
      console.error('Analytics error:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentOutletName = outlets.find(o => o.id.toString() === selectedOutlet)?.name || 'All Outlets'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">View detailed business metrics and insights</p>
        </div>
        <Button onClick={loadAnalytics} variant="outline">
          <Activity className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Outlet Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Outlet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white dark:bg-slate-950 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="">All Outlets</option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
            <div className="text-sm text-muted-foreground flex items-center">
              Showing data for: <Badge className="ml-2">{currentOutletName}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {!loading && metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Sales */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parseInt(metrics.total_sales) || 0}</div>
              <p className="text-xs text-muted-foreground">transactions completed</p>
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${parseFloat(metrics.total_revenue || 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: ${parseFloat(metrics.average_sale_amount || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Items Sold */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parseInt(metrics.total_items_sold) || 0}</div>
              <p className="text-xs text-muted-foreground">total units</p>
            </CardContent>
          </Card>

          {/* Returns Rate */}
          {returnAnalytics && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Returns Rate</CardTitle>
                <Undo2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {parseInt(metrics.total_sales) > 0
                    ? (
                        (parseInt(returnAnalytics.unique_sales_returned || 0) / parseInt(metrics.total_sales)) *
                        100
                      ).toFixed(2)
                    : '0'}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  {parseInt(returnAnalytics.total_returns) || 0} returns
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Most popular products by sales volume</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : topProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No sales data</div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Sold: {parseInt(product.total_quantity_sold) || 0} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${parseFloat(product.total_revenue || 0).toFixed(2)}</p>
                      <Badge variant="outline">{parseInt(product.sales_count)} sales</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Return Analytics */}
        {returnAnalytics && (
          <Card>
            <CardHeader>
              <CardTitle>Return Analysis (30 Days)</CardTitle>
              <CardDescription>Top reasons for product returns</CardDescription>
            </CardHeader>
            <CardContent>
              {returnAnalytics.top_reasons && returnAnalytics.top_reasons.length > 0 ? (
                <div className="space-y-4">
                  {returnAnalytics.top_reasons.slice(0, 5).map((reason, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{reason.return_reason || 'No reason'}</p>
                        <p className="text-xs text-muted-foreground">{reason.count} returns</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${parseFloat(reason.total_refund).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No returns data</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Performance Summary */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Sale Value</p>
                    <p className="text-2xl font-bold">
                      ${parseFloat(metrics.average_sale_amount || 0).toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Profit</p>
                    <p className="text-2xl font-bold">
                      ${parseFloat(metrics.total_profit || 0).toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Items per Sale</p>
                    <p className="text-2xl font-bold">
                      {parseInt(metrics.total_sales) > 0
                        ? (parseInt(metrics.total_items_sold) / parseInt(metrics.total_sales)).toFixed(2)
                        : '0'}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outlet Comparison */}
      {!selectedOutlet && outlets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Outlet Comparison</CardTitle>
            <CardDescription>Performance across all outlets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              Select a specific outlet above to view filtered analytics, or refresh to see all outlets data
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
