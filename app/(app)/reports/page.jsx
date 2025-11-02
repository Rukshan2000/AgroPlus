'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "@/hooks/use-session"
import { 
  FileText, TrendingUp, Package, DollarSign, BarChart3, 
  Calendar, Download, Printer, RefreshCw, AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { 
  DailySalesSummaryThermal, 
  SalesByProductThermal,
  SalesByCategoryThermal,
  SalesByHourThermal,
  DiscountsAndReturnsThermal,
  StockOnHandThermal,
  LowStockReportThermal, 
  InventoryValuationThermal,
  StockMovementThermal,
  ProfitLossReportThermal,
  PaymentTypeReportThermal,
  CashFlowReportThermal,
  SalesTrendAnalysisThermal,
  CategoryContributionThermal,
  GrossMarginAnalysisThermal,
  printThermalReport 
} from '@/components/thermal-report-prints'

export default function ReportsPage() {
  const { session, loading: sessionLoading } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState('sales')
  const [reportData, setReportData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })

  // Check authorization
  useEffect(() => {
    if (!sessionLoading && session) {
      const allowedRoles = ['admin', 'manager']
      if (!allowedRoles.includes(session.user.role)) {
        router.push('/forbidden')
      }
    }
  }, [session, sessionLoading, router])

  const fetchReport = async (reportType, params = {}) => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        type: reportType,
        ...dateRange,
        ...params
      })
      
      console.log('Fetching report:', reportType, 'with params:', queryParams.toString())
      
      const response = await fetch(`/api/reports?${queryParams}`)
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || errorData.message || `Failed to fetch report (${response.status})`)
      }
      
      const data = await response.json()
      console.log('Report data received:', data)
      
      if (!data.success) {
        throw new Error(data.message || 'Report generation failed')
      }
      
      setReportData(data)
      
      toast({
        title: "Report generated",
        description: "Report data loaded successfully"
      })
    } catch (error) {
      console.error('Error fetching report:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintReport = async () => {
    if (!reportData) return
    
    const reportType = reportData.metadata.type
    
    // Map report types to their thermal component IDs
    const thermalReportMap = {
      'daily_sales_summary': 'thermal-daily-summary',
      'sales_by_product': 'thermal-sales-by-product',
      'sales_by_category': 'thermal-sales-by-category',
      'sales_by_hour': 'thermal-sales-by-hour',
      'discounts_and_returns': 'thermal-discounts-returns',
      'stock_on_hand': 'thermal-stock-on-hand',
      'low_stock': 'thermal-low-stock',
      'inventory_valuation': 'thermal-inventory-valuation',
      'stock_movement': 'thermal-stock-movement',
      'profit_and_loss': 'thermal-profit-loss',
      'payment_type': 'thermal-payment-type',
      'cash_flow': 'thermal-cash-flow',
      'sales_trend': 'thermal-sales-trend',
      'category_contribution': 'thermal-category-contribution',
      'gross_margin': 'thermal-gross-margin'
    }
    
    const thermalReportId = thermalReportMap[reportType]
    
    if (thermalReportId) {
      // Use thermal printing for supported reports
      const result = await printThermalReport(thermalReportId)
      if (result.success) {
        toast({
          title: "Printing",
          description: "Thermal print initiated"
        })
      } else {
        toast({
          title: "Print Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } else {
      // Fallback to regular browser print
      window.print()
    }
  }

  const handleDownloadCSV = () => {
    if (!reportData?.report) return
    
    const report = reportData.report
    const headers = Object.keys(report[0] || {})
    const csvContent = [
      headers.join(','),
      ...report.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report_${reportData.metadata.type}_${new Date().toISOString()}.csv`
    a.click()
    
    toast({
      title: "Download started",
      description: "CSV file is downloading"
    })
  }

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">📊 Business Reports</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Generate comprehensive reports for sales, inventory, and financial analysis
        </p>
      </div>

      {/* Date Range Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={() => setDateRange({
                  start_date: new Date().toISOString().split('T')[0],
                  end_date: new Date().toISOString().split('T')[0]
                })}
                variant="outline"
              >
                Today
              </Button>
              <Button
                onClick={() => setDateRange({
                  start_date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
                  end_date: new Date().toISOString().split('T')[0]
                })}
                variant="outline"
              >
                Last 7 Days
              </Button>
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={() => setDateRange({
                  start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
                  end_date: new Date().toISOString().split('T')[0]
                })}
                variant="outline"
              >
                Last 30 Days
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* SALES REPORTS TAB */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ReportCard
              title="Daily Sales Summary"
              description="Total sales, transactions, payment types, and discounts"
              icon={<FileText className="h-8 w-8 text-blue-500" />}
              onGenerate={() => fetchReport('daily_sales_summary')}
              isLoading={isLoading}
            />
            <ReportCard
              title="Sales by Product"
              description="Which products sell the most/least"
              icon={<Package className="h-8 w-8 text-green-500" />}
              onGenerate={() => fetchReport('sales_by_product')}
              isLoading={isLoading}
            />
            <ReportCard
              title="Sales by Category"
              description="Performance of product groups"
              icon={<BarChart3 className="h-8 w-8 text-purple-500" />}
              onGenerate={() => fetchReport('sales_by_category')}
              isLoading={isLoading}
            />
            <ReportCard
              title="Sales by Hour/Shift"
              description="Identifies peak business hours"
              icon={<Calendar className="h-8 w-8 text-orange-500" />}
              onGenerate={() => fetchReport('sales_by_hour')}
              isLoading={isLoading}
            />
            <ReportCard
              title="Discounts & Returns"
              description="All discounts and refunds issued"
              icon={<AlertCircle className="h-8 w-8 text-red-500" />}
              onGenerate={() => fetchReport('discounts_and_returns')}
              isLoading={isLoading}
            />
          </div>
        </TabsContent>

        {/* INVENTORY REPORTS TAB */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ReportCard
              title="Stock on Hand"
              description="Current quantity and value of each item"
              icon={<Package className="h-8 w-8 text-blue-500" />}
              onGenerate={() => fetchReport('stock_on_hand')}
              isLoading={isLoading}
            />
            <ReportCard
              title="Low Stock / Reorder"
              description="Items below minimum threshold"
              icon={<AlertCircle className="h-8 w-8 text-red-500" />}
              onGenerate={() => fetchReport('low_stock')}
              isLoading={isLoading}
            />
            <ReportCard
              title="Inventory Valuation"
              description="Total stock value at cost and retail"
              icon={<DollarSign className="h-8 w-8 text-green-500" />}
              onGenerate={() => fetchReport('inventory_valuation')}
              isLoading={isLoading}
            />
            <ReportCard
              title="Stock Movement"
              description="Incoming, outgoing, and adjusted quantities"
              icon={<TrendingUp className="h-8 w-8 text-purple-500" />}
              onGenerate={() => fetchReport('stock_movement')}
              isLoading={isLoading}
            />
          </div>
        </TabsContent>

        {/* FINANCIAL REPORTS TAB */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ReportCard
              title="Profit & Loss (P&L)"
              description="Revenue, COGS, and profit margin"
              icon={<DollarSign className="h-8 w-8 text-green-500" />}
              onGenerate={() => fetchReport('profit_and_loss')}
              isLoading={isLoading}
              featured
            />
            <ReportCard
              title="Payment Type Report"
              description="Breakdown by cash, card, digital wallet"
              icon={<FileText className="h-8 w-8 text-blue-500" />}
              onGenerate={() => fetchReport('payment_type')}
              isLoading={isLoading}
            />
            <ReportCard
              title="Cash Flow Report"
              description="Inflow and outflow of money"
              icon={<TrendingUp className="h-8 w-8 text-purple-500" />}
              onGenerate={() => fetchReport('cash_flow')}
              isLoading={isLoading}
            />
          </div>
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ReportCard
              title="Sales Trend Analysis"
              description="Compare performance over time"
              icon={<TrendingUp className="h-8 w-8 text-blue-500" />}
              onGenerate={() => fetchReport('sales_trend', { period: 'daily' })}
              isLoading={isLoading}
            />
            <ReportCard
              title="Category Contribution"
              description="Which categories drive the most profit"
              icon={<BarChart3 className="h-8 w-8 text-green-500" />}
              onGenerate={() => fetchReport('category_contribution')}
              isLoading={isLoading}
            />
            <ReportCard
              title="Gross Margin Analysis"
              description="Profitability by product or category"
              icon={<DollarSign className="h-8 w-8 text-purple-500" />}
              onGenerate={() => fetchReport('gross_margin', { group_by: 'product' })}
              isLoading={isLoading}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Report Display Area */}
      {reportData && (
        <>
          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Report Results</CardTitle>
                  <CardDescription>
                    {reportData.metadata.type.replace(/_/g, ' ').toUpperCase()} - 
                    Generated at {new Date(reportData.metadata.generated_at).toLocaleString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handlePrintReport} variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button onClick={handleDownloadCSV} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ReportDataTable data={reportData.report} type={reportData.metadata.type} />
            </CardContent>
          </Card>

          {/* Hidden Thermal Print Components */}
          <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
            {reportData.metadata.type === 'daily_sales_summary' && (
              <DailySalesSummaryThermal data={reportData.report} dateRange={dateRange} />
            )}
            {reportData.metadata.type === 'sales_by_product' && (
              <SalesByProductThermal data={reportData.report} />
            )}
            {reportData.metadata.type === 'sales_by_category' && (
              <SalesByCategoryThermal data={reportData.report} />
            )}
            {reportData.metadata.type === 'sales_by_hour' && (
              <SalesByHourThermal data={reportData.report} />
            )}
            {reportData.metadata.type === 'discounts_and_returns' && (
              <DiscountsAndReturnsThermal data={reportData.report} />
            )}
            {reportData.metadata.type === 'stock_on_hand' && (
              <StockOnHandThermal data={reportData.report} />
            )}
            {reportData.metadata.type === 'low_stock' && (
              <LowStockReportThermal data={reportData.report} />
            )}
            {reportData.metadata.type === 'inventory_valuation' && (
              <InventoryValuationThermal data={reportData.report} />
            )}
            {reportData.metadata.type === 'stock_movement' && (
              <StockMovementThermal data={reportData.report} />
            )}
            {reportData.metadata.type === 'profit_and_loss' && (
              <ProfitLossReportThermal data={reportData.report} dateRange={dateRange} />
            )}
            {reportData.metadata.type === 'payment_type' && (
              <PaymentTypeReportThermal data={reportData.report} />
            )}
            {reportData.metadata.type === 'cash_flow' && (
              <CashFlowReportThermal data={reportData.report} />
            )}
            {reportData.metadata.type === 'sales_trend' && (
              <SalesTrendAnalysisThermal data={reportData.report} />
            )}
            {reportData.metadata.type === 'category_contribution' && (
              <CategoryContributionThermal data={reportData.report} />
            )}
            {reportData.metadata.type === 'gross_margin' && (
              <GrossMarginAnalysisThermal data={reportData.report} />
            )}
          </div>
        </>
      )}
    </div>
  )
}

function ReportCard({ title, description, icon, onGenerate, isLoading, featured }) {
  return (
    <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${featured ? 'border-green-500 border-2' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
          <div className="ml-4">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={onGenerate} 
          disabled={isLoading}
          className="w-full"
          variant={featured ? "default" : "outline"}
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

function ReportDataTable({ data, type }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available for this report
      </div>
    )
  }

  const columns = Object.keys(data[0])
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            {columns.map(col => (
              <th key={col} className="px-4 py-3 text-left text-sm font-semibold border">
                {col.replace(/_/g, ' ').toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900">
              {columns.map(col => (
                <td key={col} className="px-4 py-3 text-sm border">
                  {formatCellValue(row[col], col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatCellValue(value, columnName) {
  if (value === null || value === undefined) return '-'
  
  // Format currency columns
  if (columnName.includes('amount') || columnName.includes('price') || 
      columnName.includes('value') || columnName.includes('profit') ||
      columnName.includes('cost') || columnName.includes('revenue') ||
      columnName.includes('sales') || columnName.includes('cash') ||
      columnName.includes('change') || columnName.includes('discount_amount')) {
    return `LKR ${parseFloat(value).toFixed(2)}`
  }
  
  // Format percentage columns
  if (columnName.includes('percentage') || columnName.includes('margin')) {
    return `${parseFloat(value).toFixed(2)}%`
  }
  
  // Format date columns
  if (columnName.includes('date') || columnName === 'period') {
    return new Date(value).toLocaleDateString()
  }
  
  // Format quantity columns
  if (columnName.includes('quantity') || columnName === 'total_items_sold') {
    return parseFloat(value).toFixed(2)
  }
  
  return value
}
