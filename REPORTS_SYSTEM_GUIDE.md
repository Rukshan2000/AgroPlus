# 📊 Business Reports System - Implementation Guide

## Overview

A comprehensive reporting system for your POS application with **15 different report types** covering Sales, Inventory, Financial, and Analytics insights. Features role-based access (Admin/Manager only), date filtering, CSV export, and **thermal printing** for key reports.

---

## 🎯 Features Implemented

### 1. **Sales Reports** (5 Reports)
- ✅ Daily Sales Summary - Complete overview of daily transactions
- ✅ Sales by Product - Best/worst selling products
- ✅ Sales by Category - Category-wise performance
- ✅ Sales by Hour/Shift - Peak business hours analysis
- ✅ Discounts & Returns - All discounts and refunds tracking

### 2. **Inventory Reports** (4 Reports)
- ✅ Stock on Hand - Current inventory with values
- ✅ Low Stock / Reorder - Items below minimum threshold
- ✅ Inventory Valuation - Total stock value (cost & retail)
- ✅ Stock Movement - Incoming/outgoing quantities

### 3. **Financial Reports** (3 Reports)
- ✅ Profit & Loss (P&L) - Revenue, COGS, profit margins
- ✅ Payment Type Report - Cash/Card/Digital breakdown
- ✅ Cash Flow Report - Money inflow/outflow

### 4. **Analytics / Insights** (3 Reports)
- ✅ Sales Trend Analysis - Performance over time
- ✅ Category Contribution - Profit drivers by category
- ✅ Gross Margin Analysis - Product/category profitability

---

## 🏗️ Architecture

### Files Created

```
models/
  └── reportsModel.js          # SQL queries for all reports (smart JOINs)

controllers/
  └── reportsController.js     # Business logic & data formatting

app/
  └── api/
      └── reports/
          └── route.js         # API endpoint with auth & role checks

app/(app)/
  └── reports/
      └── page.jsx             # Main reports UI with tabs & filters

components/
  └── thermal-report-prints.jsx  # Thermal print components
      ├── DailySalesSummaryThermal
      ├── LowStockReportThermal
      └── ProfitLossReportThermal

components/
  └── sidebar.jsx              # Updated with Reports navigation link
```

---

## 🔐 Access Control

**Allowed Roles:** `admin`, `manager` only

The system includes:
- API-level authentication check
- Role-based authorization
- Client-side route protection
- Automatic redirect to `/forbidden` for unauthorized users

---

## 📡 API Usage

### Endpoint
```
GET /api/reports?type={REPORT_TYPE}&start_date={DATE}&end_date={DATE}
```

### Available Report Types
```javascript
// Sales Reports
'daily_sales_summary'
'sales_by_product'
'sales_by_category'
'sales_by_hour'
'discounts_and_returns'

// Inventory Reports
'stock_on_hand'
'low_stock'
'inventory_valuation'
'stock_movement'

// Financial Reports
'profit_and_loss'
'payment_type'
'cash_flow'

// Analytics Reports
'sales_trend'          // Add: &period=daily|monthly|yearly
'category_contribution'
'gross_margin'         // Add: &group_by=product|category
```

### Example API Calls

```javascript
// Daily Sales Summary for Today
fetch('/api/reports?type=daily_sales_summary&date=2025-11-02')

// Sales by Product (Last 7 days)
fetch('/api/reports?type=sales_by_product&start_date=2025-10-26&end_date=2025-11-02')

// Low Stock Alert
fetch('/api/reports?type=low_stock')

// Monthly Sales Trend
fetch('/api/reports?type=sales_trend&period=monthly&start_date=2024-11-01&end_date=2025-11-02')

// Gross Margin by Category
fetch('/api/reports?type=gross_margin&group_by=category&start_date=2025-10-01&end_date=2025-11-02')
```

### Response Format
```json
{
  "success": true,
  "report": [
    {
      "sale_date": "2025-11-02",
      "total_transactions": 45,
      "total_sales": 125000.00,
      "total_profit": 35000.00,
      "profit_margin_percentage": 28.00,
      ...
    }
  ],
  "metadata": {
    "type": "daily_sales_summary",
    "generated_at": "2025-11-02T10:30:00.000Z",
    "filters": {
      "date": "2025-11-02"
    }
  }
}
```

---

## 🖨️ Thermal Printing

### Supported Reports for Thermal Printing
1. **Daily Sales Summary** (`thermal-daily-summary`)
2. **Low Stock Report** (`thermal-low-stock`)
3. **Profit & Loss** (`thermal-profit-loss`)

### How to Print
```javascript
import { printThermalReport } from '@/components/thermal-report-prints'

// Print Daily Sales Summary
await printThermalReport('thermal-daily-summary')

// Print Low Stock Alert
await printThermalReport('thermal-low-stock')

// Print P&L Statement
await printThermalReport('thermal-profit-loss')
```

### Thermal Print Features
- 80mm thermal paper format
- Receipt-style layout with clear sections
- Professional headers and footers
- Color indicators (red for alerts, green for profits)
- Optimized for monospace fonts
- Auto-calculated totals and summaries

---

## 💡 Smart SQL Queries

The reports use **optimized JOIN queries** to leverage existing tables without creating new ones:

### Example: Daily Sales Summary Query
```sql
SELECT 
  DATE(s.sale_date) as sale_date,
  COUNT(DISTINCT s.transaction_id) as total_transactions,
  SUM(s.total_amount) as total_sales,
  SUM(s.discount_amount) as total_discounts,
  SUM(CASE WHEN s.payment_method = 'cash' THEN s.total_amount ELSE 0 END) as cash_sales,
  SUM(s.total_profit) as total_profit,
  (SUM(s.total_profit) / SUM(s.total_amount)) * 100 as profit_margin_percentage
FROM sales s
WHERE DATE(s.sale_date) = CURRENT_DATE
GROUP BY DATE(s.sale_date)
```

### Key Benefits
- No new tables needed
- Efficient aggregations
- Real-time data
- Proper indexing utilization
- Category & product JOINs for enriched data

---

## 🎨 UI Features

### Navigation
- **Reports** menu item in sidebar (Admin/Manager only)
- Collapsible menu structure
- Active route highlighting

### Report Cards
- Categorized into 4 tabs: Sales, Inventory, Financial, Analytics
- Visual icons for each report type
- One-click generation
- Featured reports (P&L highlighted)

### Date Range Selector
- Custom date range picker
- Quick filters: Today, Last 7 Days, Last 30 Days
- Persistent date selection across reports

### Data Display
- Responsive table layout
- Formatted currency (LKR)
- Formatted percentages
- Color-coded values
- Hover effects for better UX

### Export Options
- **Print** - Browser print or thermal print
- **Download CSV** - Export data for Excel/analysis

---

## 📊 Report Details

### 1. Daily Sales Summary
**Purpose:** Complete daily performance overview

**Metrics:**
- Total transactions & line items
- Total sales revenue
- Average ticket size
- Payment method breakdown (Cash, Card, Digital, Other)
- Total discounts & refunds
- Total profit & margin %

**Use Case:** Daily closing report, manager review, performance tracking

---

### 2. Sales by Product
**Purpose:** Identify top/bottom performers

**Metrics:**
- Quantity sold
- Number of sales
- Total revenue
- Average selling price
- Discounts given
- Profit & margin %
- Current stock level

**Use Case:** Inventory planning, pricing strategy, promotional planning

---

### 3. Sales by Category
**Purpose:** Category performance analysis

**Metrics:**
- Unique products sold
- Total quantity & revenue
- Discounts by category
- Profit & margin %

**Use Case:** Category management, product mix optimization

---

### 4. Sales by Hour/Shift
**Purpose:** Peak hours identification

**Metrics:**
- Hourly transaction counts
- Items sold per hour
- Revenue by hour
- Shift-wise breakdown (Morning/Afternoon/Evening/Night)

**Use Case:** Staff scheduling, inventory stocking times

---

### 5. Discounts & Returns
**Purpose:** Track all price reductions and refunds

**Metrics:**
- Transaction ID & date
- Product details
- Original vs discounted price
- Discount %
- Transaction type (Discount/Return)
- Cashier name

**Use Case:** Loss prevention, cashier performance, discount policy review

---

### 6. Stock on Hand
**Purpose:** Current inventory snapshot

**Metrics:**
- Available quantity
- Stock value (cost & retail)
- Stock status (Good/Adequate/Low/Out)
- Expiry status
- Unit type & value

**Use Case:** Inventory audit, stock taking, valuation

---

### 7. Low Stock / Reorder Report
**Purpose:** Proactive inventory management

**Metrics:**
- Current vs minimum quantity
- Quantity to order
- Estimated reorder cost
- Average daily sales
- Days of stock remaining

**Use Case:** Purchase orders, supplier communication, stock planning

---

### 8. Inventory Valuation
**Purpose:** Financial inventory overview

**Metrics:**
- Total products & quantity by category
- Total cost value
- Total retail value
- Potential profit
- Profit margin %

**Use Case:** Financial reporting, insurance, business valuation

---

### 9. Stock Movement
**Purpose:** Inventory flow tracking

**Metrics:**
- Quantity out (sales)
- Quantity in (returns)
- Net movement
- Current stock level

**Use Case:** Audit trail, reconciliation, theft detection

---

### 10. Profit & Loss (P&L)
**Purpose:** Financial performance statement

**Metrics:**
- Gross revenue
- Discounts & refunds
- Net revenue
- Cost of Goods Sold (COGS)
- Gross & net profit
- Profit margins

**Use Case:** Financial reporting, investor presentations, tax filing

---

### 11. Payment Type Report
**Purpose:** Payment method analysis

**Metrics:**
- Transactions by payment type
- Revenue by payment type
- Average transaction value
- Percentage of total

**Use Case:** Cash management, bank reconciliation, payment strategy

---

### 12. Cash Flow Report
**Purpose:** Money movement tracking

**Metrics:**
- Cash inflows (sales)
- Cash outflows (refunds)
- Net cash flow
- Cash received by method
- Change given
- Net cash in hand

**Use Case:** Daily reconciliation, cash management, banking

---

### 13. Sales Trend Analysis
**Purpose:** Performance over time

**Metrics:**
- Period-based aggregation (daily/monthly/yearly)
- Total transactions & items
- Revenue & profit trends
- Average transaction value
- Profit margin trends

**Use Case:** Business growth tracking, forecasting, strategic planning

---

### 14. Category Contribution
**Purpose:** Profit driver identification

**Metrics:**
- Unique products per category
- Revenue & cost by category
- Profit contribution %
- Revenue contribution %
- Category margin %

**Use Case:** Category strategy, resource allocation, product focus

---

### 15. Gross Margin Analysis
**Purpose:** Profitability by product/category

**Metrics:**
- Total revenue & cost
- Gross profit
- Gross margin %
- Markup %

**Use Case:** Pricing strategy, product selection, profitability optimization

---

## 🚀 Usage Guide

### Step 1: Access Reports
1. Login as **Admin** or **Manager**
2. Click **Reports** in sidebar
3. Reports page opens with 4 tabs

### Step 2: Select Date Range
1. Use date pickers to set custom range
2. Or click quick filters (Today, Last 7 Days, Last 30 Days)

### Step 3: Generate Report
1. Navigate to appropriate tab (Sales/Inventory/Financial/Analytics)
2. Click **Generate Report** button on desired report card
3. Wait for data to load (loading indicator shows)

### Step 4: Review Data
1. Report displays in table format below
2. Scroll to view all data
3. Hover over cells for full values

### Step 5: Export/Print
1. Click **Print** to print report (thermal or browser)
2. Click **Download CSV** to export data
3. Use exported data in Excel/Google Sheets

---

## 🔧 Customization

### Add New Report Type

1. **Create SQL query in `models/reportsModel.js`:**
```javascript
export async function getMyNewReport({ start_date, end_date } = {}) {
  const result = await query(`
    SELECT 
      ...
    FROM sales s
    LEFT JOIN products p ON s.product_id = p.id
    WHERE DATE(s.sale_date) BETWEEN $1 AND $2
    GROUP BY ...
  `, [start_date, end_date])
  
  return result.rows
}
```

2. **Add controller in `controllers/reportsController.js`:**
```javascript
export async function getMyNewReport(req, res) {
  try {
    const { start_date, end_date } = req.query
    const report = await reportsModel.getMyNewReport({ start_date, end_date })
    
    return res.status(200).json({
      success: true,
      report,
      metadata: {
        type: 'my_new_report',
        generated_at: new Date().toISOString(),
        filters: { start_date, end_date }
      }
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    })
  }
}
```

3. **Add route case in `app/api/reports/route.js`:**
```javascript
case 'my_new_report':
  await reportsController.getMyNewReport(req, res)
  break
```

4. **Add UI card in `app/(app)/reports/page.jsx`:**
```jsx
<ReportCard
  title="My New Report"
  description="Description of what this report shows"
  icon={<Icon className="h-8 w-8 text-blue-500" />}
  onGenerate={() => fetchReport('my_new_report')}
  isLoading={isLoading}
/>
```

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" Error
**Solution:** Ensure you're logged in as Admin or Manager

### Issue: "No data available"
**Solution:** 
- Check if sales data exists for the date range
- Verify database connection
- Check browser console for errors

### Issue: CSV Download not working
**Solution:** Ensure report is generated first (reportData must exist)

### Issue: Thermal print not working
**Solution:** 
- Ensure printer settings are configured
- Check if report type supports thermal printing
- Falls back to browser print automatically

---

## 📈 Performance Considerations

1. **Indexed Columns:** Queries use indexed columns (sale_date, product_id, category)
2. **Aggregations:** Database-level aggregations (more efficient than client-side)
3. **Date Filtering:** Always include date filters to limit dataset size
4. **Pagination:** Consider adding pagination for large datasets (>1000 rows)
5. **Caching:** Consider implementing Redis cache for frequently accessed reports

---

## 🎯 Next Steps / Enhancements

1. **Chart Visualizations:** Add graphs using Chart.js or Recharts
2. **Scheduled Reports:** Email reports daily/weekly
3. **Report Subscriptions:** Users subscribe to specific reports
4. **Custom Report Builder:** Drag-drop report creator
5. **Dashboard Widgets:** Show key metrics on dashboard
6. **PDF Export:** Generate PDF reports with branding
7. **Report Comparison:** Compare two date ranges side-by-side
8. **Advanced Filters:** Filter by cashier, payment method, category
9. **Bookmarks:** Save frequently used report configurations
10. **Mobile Optimization:** Responsive design for tablets

---

## ✅ Testing Checklist

- [x] All 15 reports generate successfully
- [x] Date filters work correctly
- [x] Role-based access (Admin/Manager only)
- [x] CSV export works
- [x] Thermal printing works for supported reports
- [x] Browser printing works for all reports
- [x] Navigation link appears for authorized roles
- [x] Error handling for unauthorized access
- [x] Error handling for missing data
- [x] SQL queries are optimized
- [x] No new database tables needed
- [x] Proper currency formatting (LKR)
- [x] Percentage formatting
- [x] Date formatting

---

## 📝 Summary

You now have a **production-ready reporting system** with:
- ✅ 15 comprehensive business reports
- ✅ Smart SQL queries using existing tables
- ✅ Role-based access control
- ✅ Date filtering & quick filters
- ✅ CSV export functionality
- ✅ Thermal printing for key reports
- ✅ Professional UI with tabs & cards
- ✅ Fully integrated with navigation
- ✅ Proper error handling
- ✅ Optimized performance

**The system is ready to use!** Navigate to `/reports` as an Admin or Manager to start generating insights.

---

**Created:** November 2, 2025
**Version:** 1.0.0
**Status:** ✅ Complete & Production Ready
