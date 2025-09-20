'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import CashierRedirect from "../../../components/cashier-redirect"
import { useSession } from "@/hooks/use-session"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  AlertTriangle,
  Clock,
  Target,
  Activity,
  Calendar
} from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { session, isLoading: sessionLoading } = useSession()

  useEffect(() => {
    if (!sessionLoading && session) {
      fetchDashboardData()
    } else if (!sessionLoading && !session) {
      setError('Not authenticated')
      setLoading(false)
    }
  }, [session, sessionLoading])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      } else {
        throw new Error('Failed to fetch dashboard data')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sessionLoading || loading) {
    return (
      <div className="grid gap-6">
        <CashierRedirect />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-6">
        <CashierRedirect />
        <div className="text-center text-red-600">Error loading dashboard: {error}</div>
      </div>
    )
  }

  const { 
    salesStats, 
    dailySales, 
    topProducts, 
    categoryStats,
    cashierPerformance,
    hourlySales,
    monthlyTrends,
    lowStockAlerts,
    expiryAlerts,
    productStats,
    userStats,
    recentActivity
  } = dashboardData

  // Chart configurations
  const dailySalesChartData = {
    labels: dailySales?.map(d => new Date(d.sale_date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Daily Revenue',
        data: dailySales?.map(d => parseFloat(d.daily_revenue)) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  }

  const categoryChartData = {
    labels: categoryStats?.map(c => c.category) || [],
    datasets: [
      {
        data: categoryStats?.map(c => parseFloat(c.total_revenue)) || [],
        backgroundColor: [
          '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
          '#EC4899', '#6B7280', '#14B8A6', '#F97316', '#84CC16'
        ],
      },
    ],
  }

  const hourlySalesChartData = {
    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Sales Count',
        data: Array.from({length: 24}, (_, hour) => {
          const data = hourlySales?.find(h => parseInt(h.hour) === hour)
          return data ? parseInt(data.sales_count) : 0
        }),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="grid gap-6 p-6">
      <CashierRedirect />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${parseFloat(salesStats?.total_revenue || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From {salesStats?.total_sales || 0} sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesStats?.total_items_sold || 0}</div>
            <p className="text-xs text-muted-foreground">Total quantity sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${parseFloat(salesStats?.average_sale_amount || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productStats?.active_products || 0}</div>
            <p className="text-xs text-muted-foreground">Of {productStats?.total_products || 0} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line data={dailySalesChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return '$' + value;
                      }
                    }
                  }
                }
              }} />
            </div>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Doughnut data={categoryChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'right' },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return context.label + ': $' + context.parsed.toFixed(2);
                      }
                    }
                  }
                },
              }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Sales Pattern */}
        <Card>
          <CardHeader>
            <CardTitle>Hourly Sales Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={hourlySalesChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }} />
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts?.slice(0, 6).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.sku}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{product.total_quantity_sold} sold</div>
                    <div className="text-sm text-muted-foreground">${parseFloat(product.total_revenue).toFixed(2)}</div>
                  </div>
                </div>
              )) || <div className="text-center text-muted-foreground">No data available</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockAlerts?.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">{product.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${product.available_quantity === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {product.available_quantity} left
                    </div>
                    <div className="text-sm text-muted-foreground">{product.total_sold} sold this month</div>
                  </div>
                </div>
              )) || <div className="text-center text-muted-foreground p-4">No low stock alerts</div>}
            </div>
          </CardContent>
        </Card>

        {/* Expiry Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-600" />
              Expiry Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiryAlerts?.slice(0, 5).map((product) => (
                <div key={`expiry-${product.id}`} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">{product.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${product.expiry_status === 'expired' ? 'text-red-600' : 'text-orange-600'}`}>
                      {product.expiry_status === 'expired' ? 'Expired' : 
                       product.days_until_expiry === 0 ? 'Expires today' :
                       `${product.days_until_expiry} days`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : 'No expiry date'}
                    </div>
                  </div>
                </div>
              )) || <div className="text-center text-muted-foreground p-4">No expiry alerts</div>}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Recent Sales Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity?.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                  <div>
                    <div className="font-medium">{sale.product_name}</div>
                    <div className="text-sm text-muted-foreground">
                      By {sale.cashier_name || 'Unknown'} • {new Date(sale.sale_date).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${parseFloat(sale.total_amount).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Qty: {sale.quantity}</div>
                  </div>
                </div>
              )) || <div className="text-center text-muted-foreground p-4">No recent activity</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cashier Performance (Admin/Manager only) */}
      {cashierPerformance?.length > 0 && session?.user && (session.user.role === 'admin' || session.user.role === 'manager') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Cashier Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Cashier</th>
                    <th className="text-right p-2">Sales</th>
                    <th className="text-right p-2">Items Sold</th>
                    <th className="text-right p-2">Revenue</th>
                    <th className="text-right p-2">Avg Sale</th>
                  </tr>
                </thead>
                <tbody>
                  {cashierPerformance.map((cashier) => (
                    <tr key={cashier.id} className="border-b">
                      <td className="p-2">
                        <div className="font-medium">{cashier.name}</div>
                        <div className="text-sm text-muted-foreground">@{cashier.username}</div>
                      </td>
                      <td className="text-right p-2">{cashier.total_sales}</td>
                      <td className="text-right p-2">{cashier.items_sold}</td>
                      <td className="text-right p-2">${parseFloat(cashier.total_revenue).toFixed(2)}</td>
                      <td className="text-right p-2">${parseFloat(cashier.avg_sale_amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
