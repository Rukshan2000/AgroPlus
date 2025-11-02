'use client'

// Common thermal receipt styles
const thermalStyles = {
  container: {
    width: '80mm',
    fontFamily: 'monospace',
    fontSize: '12px',
    padding: '10px',
    lineHeight: '1.4'
  },
  header: {
    textAlign: 'center',
    marginBottom: '15px'
  },
  title: {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0'
  },
  subtitle: {
    margin: '5px 0',
    fontSize: '11px'
  },
  divider: {
    borderTop: '2px dashed #000',
    borderBottom: '2px dashed #000',
    padding: '10px 0',
    margin: '10px 0',
    textAlign: 'center'
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 'bold',
    marginBottom: '8px',
    borderBottom: '1px solid #000',
    paddingBottom: '3px'
  },
  table: {
    width: '100%',
    fontSize: '11px'
  },
  footer: {
    borderTop: '2px dashed #000',
    paddingTop: '10px',
    marginTop: '15px',
    textAlign: 'center',
    fontSize: '10px'
  }
}

// Common Header Component
function ThermalHeader({ title, subtitle }) {
  return (
    <>
      <div style={thermalStyles.header}>
        <h2 style={thermalStyles.title}>GREEN PLUS AGRO</h2>
        <p style={thermalStyles.subtitle}>123 Farm Road, Green Valley</p>
        <p style={{ margin: '0', fontSize: '11px' }}>Tel: +94 77 123 4567</p>
      </div>
      <div style={thermalStyles.divider}>
        <h3 style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{title}</h3>
        {subtitle && <p style={{ margin: '5px 0', fontSize: '11px' }}>{subtitle}</p>}
      </div>
    </>
  )
}

// Common Footer Component
function ThermalFooter({ additionalInfo }) {
  return (
    <div style={thermalStyles.footer}>
      <p style={{ margin: '5px 0' }}>Printed: {new Date().toLocaleString()}</p>
      {additionalInfo && <p style={{ margin: '5px 0' }}>{additionalInfo}</p>}
      <p style={{ margin: '5px 0', fontWeight: 'bold' }}>*** End of Report ***</p>
    </div>
  )
}

// ==================== SALES REPORTS ====================

export function DailySalesSummaryThermal({ data, dateRange }) {
  if (!data || data.length === 0) return null

  const summary = data[0] // Take first row for single day summary
  
  return (
    <div id="thermal-daily-summary" className="thermal-receipt" style={{
      width: '80mm',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '10px',
      lineHeight: '1.4'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>
          GREEN PLUS AGRO
        </h2>
        <p style={{ margin: '5px 0', fontSize: '11px' }}>123 Farm Road, Green Valley</p>
        <p style={{ margin: '0', fontSize: '11px' }}>Tel: +94 77 123 4567</p>
      </div>

      <div style={{ borderTop: '2px dashed #000', borderBottom: '2px dashed #000', padding: '10px 0', margin: '10px 0', textAlign: 'center' }}>
        <h3 style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>
          📊 DAILY SALES SUMMARY
        </h3>
        <p style={{ margin: '5px 0', fontSize: '11px' }}>
          {new Date(summary.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Sales Overview */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #000', paddingBottom: '3px' }}>
          SALES OVERVIEW
        </h4>
        <table style={{ width: '100%', fontSize: '11px' }}>
          <tbody>
            <tr>
              <td>Total Transactions:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{summary.total_transactions}</td>
            </tr>
            <tr>
              <td>Total Items Sold:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{summary.total_line_items}</td>
            </tr>
            <tr>
              <td>Avg Ticket Size:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>LKR {parseFloat(summary.avg_ticket_size).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Revenue */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #000', paddingBottom: '3px' }}>
          REVENUE
        </h4>
        <table style={{ width: '100%', fontSize: '11px' }}>
          <tbody>
            <tr>
              <td>Total Sales:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                LKR {parseFloat(summary.total_sales).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td>Total Discounts:</td>
              <td style={{ textAlign: 'right', color: '#e74c3c' }}>
                -LKR {parseFloat(summary.total_discounts).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td>Total Refunds:</td>
              <td style={{ textAlign: 'right', color: '#e74c3c' }}>
                -LKR {parseFloat(summary.total_refunds).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Methods */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #000', paddingBottom: '3px' }}>
          PAYMENT BREAKDOWN
        </h4>
        <table style={{ width: '100%', fontSize: '11px' }}>
          <tbody>
            <tr>
              <td>💵 Cash:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>LKR {parseFloat(summary.cash_sales).toFixed(2)}</td>
            </tr>
            <tr>
              <td>💳 Card:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>LKR {parseFloat(summary.card_sales).toFixed(2)}</td>
            </tr>
            <tr>
              <td>📱 Digital:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>LKR {parseFloat(summary.digital_sales).toFixed(2)}</td>
            </tr>
            <tr>
              <td>🔄 Other:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>LKR {parseFloat(summary.other_sales).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Profit */}
      <div style={{ marginBottom: '15px', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
          💰 PROFIT
        </h4>
        <table style={{ width: '100%', fontSize: '11px' }}>
          <tbody>
            <tr>
              <td>Total Profit:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color: '#27ae60' }}>
                LKR {parseFloat(summary.total_profit).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td>Profit Margin:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>
                {parseFloat(summary.profit_margin_percentage).toFixed(2)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '2px dashed #000', paddingTop: '10px', marginTop: '15px', textAlign: 'center', fontSize: '10px' }}>
        <p style={{ margin: '5px 0' }}>Printed: {new Date().toLocaleString()}</p>
        <p style={{ margin: '5px 0' }}>Thank you for your business!</p>
        <p style={{ margin: '5px 0', fontWeight: 'bold' }}>*** End of Report ***</p>
      </div>
    </div>
  )
}

export function LowStockReportThermal({ data }) {
  if (!data || data.length === 0) return null

  return (
    <div id="thermal-low-stock" className="thermal-receipt" style={{
      width: '80mm',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '10px',
      lineHeight: '1.4'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>
          GREEN PLUS AGRO
        </h2>
        <p style={{ margin: '5px 0', fontSize: '11px' }}>123 Farm Road, Green Valley</p>
      </div>

      <div style={{ borderTop: '2px dashed #000', borderBottom: '2px dashed #000', padding: '10px 0', margin: '10px 0', textAlign: 'center' }}>
        <h3 style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>
          🚨 LOW STOCK ALERT
        </h3>
        <p style={{ margin: '5px 0', fontSize: '11px', color: '#e74c3c', fontWeight: 'bold' }}>
          REORDER REQUIRED
        </p>
      </div>

      {/* Summary */}
      <div style={{ marginBottom: '15px', backgroundColor: '#fff3cd', padding: '8px', borderRadius: '3px' }}>
        <p style={{ margin: '0', fontSize: '12px', textAlign: 'center', fontWeight: 'bold' }}>
          {data.length} Product{data.length !== 1 ? 's' : ''} Below Minimum Stock
        </p>
      </div>

      {/* Product List */}
      <div style={{ marginBottom: '15px' }}>
        {data.map((item, index) => (
          <div key={index} style={{ 
            marginBottom: '12px', 
            paddingBottom: '10px', 
            borderBottom: '1px dashed #ccc' 
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '3px' }}>
              {item.name}
            </div>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '3px' }}>
              SKU: {item.sku} | {item.category_name || 'N/A'}
            </div>
            <table style={{ width: '100%', fontSize: '10px' }}>
              <tbody>
                <tr>
                  <td>Current Stock:</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#e74c3c' }}>
                    {item.available_quantity} {item.unit_type}
                  </td>
                </tr>
                <tr>
                  <td>Minimum Required:</td>
                  <td style={{ textAlign: 'right' }}>{item.minimum_quantity}</td>
                </tr>
                <tr>
                  <td>To Order:</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#3498db' }}>
                    {item.qty_to_order}
                  </td>
                </tr>
                <tr>
                  <td>Est. Cost:</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    LKR {parseFloat(item.estimated_reorder_cost).toFixed(2)}
                  </td>
                </tr>
                {item.days_of_stock_remaining < 999 && (
                  <tr>
                    <td>Days Remaining:</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: item.days_of_stock_remaining <= 3 ? '#e74c3c' : '#f39c12' }}>
                      {Math.round(item.days_of_stock_remaining)} days
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Total Reorder Cost */}
      <div style={{ 
        marginTop: '15px', 
        paddingTop: '10px', 
        borderTop: '2px solid #000',
        backgroundColor: '#f0f0f0',
        padding: '10px',
        borderRadius: '5px'
      }}>
        <table style={{ width: '100%', fontSize: '12px' }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: 'bold' }}>Total Est. Reorder Cost:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>
                LKR {data.reduce((sum, item) => sum + parseFloat(item.estimated_reorder_cost), 0).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '2px dashed #000', paddingTop: '10px', marginTop: '15px', textAlign: 'center', fontSize: '10px' }}>
        <p style={{ margin: '5px 0' }}>Printed: {new Date().toLocaleString()}</p>
        <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#e74c3c' }}>
          ⚠️ URGENT - ACTION REQUIRED
        </p>
        <p style={{ margin: '5px 0', fontWeight: 'bold' }}>*** End of Report ***</p>
      </div>
    </div>
  )
}

export function ProfitLossReportThermal({ data, dateRange }) {
  if (!data || data.length === 0) return null

  // Calculate totals across date range
  const totals = data.reduce((acc, day) => ({
    gross_revenue: acc.gross_revenue + parseFloat(day.gross_revenue),
    total_discounts: acc.total_discounts + parseFloat(day.total_discounts),
    refunds: acc.refunds + parseFloat(day.refunds),
    net_revenue: acc.net_revenue + parseFloat(day.net_revenue),
    cogs: acc.cogs + parseFloat(day.cogs),
    gross_profit: acc.gross_profit + parseFloat(day.gross_profit),
    net_profit: acc.net_profit + parseFloat(day.net_profit),
    total_transactions: acc.total_transactions + parseInt(day.total_transactions)
  }), {
    gross_revenue: 0,
    total_discounts: 0,
    refunds: 0,
    net_revenue: 0,
    cogs: 0,
    gross_profit: 0,
    net_profit: 0,
    total_transactions: 0
  })

  const grossMargin = totals.net_revenue > 0 ? (totals.gross_profit / totals.net_revenue * 100) : 0
  const netMargin = totals.net_revenue > 0 ? (totals.net_profit / totals.net_revenue * 100) : 0

  return (
    <div id="thermal-profit-loss" className="thermal-receipt" style={{
      width: '80mm',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '10px',
      lineHeight: '1.4'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>
          GREEN PLUS AGRO
        </h2>
        <p style={{ margin: '5px 0', fontSize: '11px' }}>123 Farm Road, Green Valley</p>
      </div>

      <div style={{ borderTop: '2px dashed #000', borderBottom: '2px dashed #000', padding: '10px 0', margin: '10px 0', textAlign: 'center' }}>
        <h3 style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>
          💰 PROFIT & LOSS STATEMENT
        </h3>
        <p style={{ margin: '5px 0', fontSize: '11px' }}>
          {data.length} Day{data.length !== 1 ? 's' : ''} Period
        </p>
      </div>

      {/* Revenue Section */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #000', paddingBottom: '3px' }}>
          REVENUE
        </h4>
        <table style={{ width: '100%', fontSize: '11px' }}>
          <tbody>
            <tr>
              <td>Gross Revenue:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                LKR {totals.gross_revenue.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td>Less: Discounts:</td>
              <td style={{ textAlign: 'right', color: '#e74c3c' }}>
                -LKR {totals.total_discounts.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td>Less: Refunds:</td>
              <td style={{ textAlign: 'right', color: '#e74c3c' }}>
                -LKR {totals.refunds.toFixed(2)}
              </td>
            </tr>
            <tr style={{ borderTop: '1px solid #000' }}>
              <td style={{ fontWeight: 'bold' }}>Net Revenue:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                LKR {totals.net_revenue.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Cost Section */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #000', paddingBottom: '3px' }}>
          COSTS
        </h4>
        <table style={{ width: '100%', fontSize: '11px' }}>
          <tbody>
            <tr>
              <td>Cost of Goods Sold:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#e74c3c' }}>
                LKR {totals.cogs.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Profit Section */}
      <div style={{ marginBottom: '15px', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
          PROFIT
        </h4>
        <table style={{ width: '100%', fontSize: '11px' }}>
          <tbody>
            <tr>
              <td>Gross Profit:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>
                LKR {totals.gross_profit.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td>Gross Margin:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>
                {grossMargin.toFixed(2)}%
              </td>
            </tr>
            <tr style={{ borderTop: '1px solid #000', paddingTop: '5px' }}>
              <td style={{ fontWeight: 'bold' }}>Net Profit:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '14px', color: '#27ae60' }}>
                LKR {totals.net_profit.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold' }}>Net Margin:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color: '#27ae60' }}>
                {netMargin.toFixed(2)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div style={{ marginBottom: '15px', padding: '8px', border: '1px solid #ccc', borderRadius: '3px' }}>
        <table style={{ width: '100%', fontSize: '11px' }}>
          <tbody>
            <tr>
              <td>Total Transactions:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                {totals.total_transactions}
              </td>
            </tr>
            <tr>
              <td>Avg Transaction:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                LKR {(totals.net_revenue / totals.total_transactions).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td>Avg Daily Profit:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>
                LKR {(totals.net_profit / data.length).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '2px dashed #000', paddingTop: '10px', marginTop: '15px', textAlign: 'center', fontSize: '10px' }}>
        <p style={{ margin: '5px 0' }}>Printed: {new Date().toLocaleString()}</p>
        <p style={{ margin: '5px 0' }}>Confidential Financial Report</p>
        <p style={{ margin: '5px 0', fontWeight: 'bold' }}>*** End of Report ***</p>
      </div>
    </div>
  )
}

// Sales By Product Thermal
export function SalesByProductThermal({ data }) {
  if (!data || data.length === 0) return null
  const topProducts = data.slice(0, 20)
  
  return (
    <div id="thermal-sales-by-product" style={thermalStyles.container}>
      <ThermalHeader title="📦 SALES BY PRODUCT" subtitle={`Top ${topProducts.length} Products`} />
      
      {topProducts.map((item, index) => (
        <div key={index} style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px dashed #ccc' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>#{index + 1} {item.product_name}</div>
          <div style={{ fontSize: '10px', color: '#666' }}>SKU: {item.sku} | {item.category_name || 'N/A'}</div>
          <table style={{ width: '100%', fontSize: '10px', marginTop: '3px' }}>
            <tbody>
              <tr><td>Qty Sold:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(item.total_quantity_sold || 0).toFixed(2)}</td></tr>
              <tr><td>Revenue:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>LKR {parseFloat(item.total_revenue || 0).toFixed(2)}</td></tr>
              <tr><td>Profit:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#3498db' }}>LKR {parseFloat(item.total_profit || 0).toFixed(2)}</td></tr>
              <tr><td>Margin:</td><td style={{ textAlign: 'right' }}>{parseFloat(item.profit_margin_percentage || 0).toFixed(2)}%</td></tr>
            </tbody>
          </table>
        </div>
      ))}
      
      <ThermalFooter />
    </div>
  )
}

// Sales By Category Thermal
export function SalesByCategoryThermal({ data }) {
  if (!data || data.length === 0) return null
  
  const total = data.reduce((sum, cat) => sum + parseFloat(cat.total_revenue || 0), 0)
  
  return (
    <div id="thermal-sales-by-category" style={thermalStyles.container}>
      <ThermalHeader title="📊 SALES BY CATEGORY" />
      
      {data.map((item, index) => (
        <div key={index} style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px dashed #ccc' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{item.category_name}</div>
          <table style={{ width: '100%', fontSize: '10px', marginTop: '3px' }}>
            <tbody>
              <tr><td>Products:</td><td style={{ textAlign: 'right' }}>{item.unique_products_sold}</td></tr>
              <tr><td>Qty Sold:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(item.total_quantity_sold || 0).toFixed(2)}</td></tr>
              <tr><td>Revenue:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>LKR {parseFloat(item.total_revenue || 0).toFixed(2)}</td></tr>
              <tr><td>Contribution:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#3498db' }}>{total > 0 ? ((parseFloat(item.total_revenue || 0) / total) * 100).toFixed(2) : 0}%</td></tr>
              <tr><td>Margin:</td><td style={{ textAlign: 'right' }}>{parseFloat(item.profit_margin_percentage || 0).toFixed(2)}%</td></tr>
            </tbody>
          </table>
        </div>
      ))}
      
      <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '2px solid #000', backgroundColor: '#f0f0f0', padding: '10px' }}>
        <table style={thermalStyles.table}>
          <tbody>
            <tr><td style={{ fontWeight: 'bold' }}>Total Revenue:</td><td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>LKR {total.toFixed(2)}</td></tr>
          </tbody>
        </table>
      </div>
      
      <ThermalFooter />
    </div>
  )
}

// Sales By Hour Thermal
export function SalesByHourThermal({ data }) {
  if (!data || data.length === 0) return null
  
  return (
    <div id="thermal-sales-by-hour" style={thermalStyles.container}>
      <ThermalHeader title="🕐 SALES BY HOUR" subtitle="Peak Business Hours" />
      
      {data.map((item, index) => (
        <div key={index} style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px dashed #ccc' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
            {String(item.hour).padStart(2, '0')}:00 - {item.shift}
          </div>
          <table style={{ width: '100%', fontSize: '10px', marginTop: '3px' }}>
            <tbody>
              <tr><td>Transactions:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.total_transactions}</td></tr>
              <tr><td>Items Sold:</td><td style={{ textAlign: 'right' }}>{parseFloat(item.total_items_sold || 0).toFixed(2)}</td></tr>
              <tr><td>Sales:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>LKR {parseFloat(item.total_sales || 0).toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>
      ))}
      
      <ThermalFooter additionalInfo="Use this data for staff scheduling" />
    </div>
  )
}

// Discounts And Returns Thermal
export function DiscountsAndReturnsThermal({ data }) {
  if (!data || data.length === 0) return null
  const recentItems = data.slice(0, 30)
  
  const totalDiscounts = data.filter(item => item.transaction_type === 'Discount').reduce((sum, item) => sum + parseFloat(item.discount_amount || 0), 0)
  const totalReturns = data.filter(item => item.transaction_type === 'Return').reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0)
  
  return (
    <div id="thermal-discounts-returns" style={thermalStyles.container}>
      <ThermalHeader title="💸 DISCOUNTS & RETURNS" subtitle={`Last ${recentItems.length} Transactions`} />
      
      <div style={{ marginBottom: '15px', backgroundColor: '#fff3cd', padding: '8px' }}>
        <table style={thermalStyles.table}>
          <tbody>
            <tr><td>Total Discounts:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#f39c12' }}>LKR {totalDiscounts.toFixed(2)}</td></tr>
            <tr><td>Total Returns:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#e74c3c' }}>LKR {Math.abs(totalReturns).toFixed(2)}</td></tr>
          </tbody>
        </table>
      </div>
      
      {recentItems.map((item, index) => (
        <div key={index} style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px dashed #ccc' }}>
          <div style={{ fontSize: '10px' }}>
            {new Date(item.created_at).toLocaleString()} - 
            <span style={{ fontWeight: 'bold', color: item.transaction_type === 'Return' ? '#e74c3c' : '#f39c12' }}>
              {item.transaction_type}
            </span>
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{item.product_name}</div>
          <table style={{ width: '100%', fontSize: '10px' }}>
            <tbody>
              <tr><td>Original:</td><td style={{ textAlign: 'right' }}>LKR {parseFloat(item.original_price || 0).toFixed(2)}</td></tr>
              <tr><td>Final:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>LKR {parseFloat(item.unit_price || 0).toFixed(2)}</td></tr>
              <tr><td>Discount:</td><td style={{ textAlign: 'right', color: '#e74c3c' }}>{parseFloat(item.discount_percentage || 0).toFixed(2)}%</td></tr>
              <tr><td>Cashier:</td><td style={{ textAlign: 'right', fontSize: '9px' }}>{item.cashier_name}</td></tr>
            </tbody>
          </table>
        </div>
      ))}
      
      <ThermalFooter additionalInfo="Review for loss prevention" />
    </div>
  )
}

// Stock On Hand Thermal
export function StockOnHandThermal({ data }) {
  if (!data || data.length === 0) return null
  
  const totalCostValue = data.reduce((sum, item) => sum + parseFloat(item.stock_value_at_cost || 0), 0)
  const totalRetailValue = data.reduce((sum, item) => sum + parseFloat(item.stock_value_at_retail || 0), 0)
  
  return (
    <div id="thermal-stock-on-hand" style={thermalStyles.container}>
      <ThermalHeader title="📦 STOCK ON HAND" />
      
      <div style={{ marginBottom: '15px', backgroundColor: '#e8f5e9', padding: '8px' }}>
        <table style={thermalStyles.table}>
          <tbody>
            <tr><td>Total Items:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{data.length}</td></tr>
            <tr><td>Cost Value:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>LKR {totalCostValue.toFixed(2)}</td></tr>
            <tr><td>Retail Value:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>LKR {totalRetailValue.toFixed(2)}</td></tr>
          </tbody>
        </table>
      </div>
      
      {data.slice(0, 25).map((item, index) => (
        <div key={index} style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px dashed #ccc' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{item.name}</div>
          <div style={{ fontSize: '9px', color: '#666' }}>SKU: {item.sku}</div>
          <table style={{ width: '100%', fontSize: '10px' }}>
            <tbody>
              <tr><td>Stock:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: item.stock_status === 'Low Stock' ? '#e74c3c' : '#27ae60' }}>{item.available_quantity} {item.unit_type}</td></tr>
              <tr><td>Status:</td><td style={{ textAlign: 'right', fontSize: '9px' }}>{item.stock_status}</td></tr>
              <tr><td>Cost Value:</td><td style={{ textAlign: 'right' }}>LKR {parseFloat(item.stock_value_at_cost || 0).toFixed(2)}</td></tr>
              <tr><td>Retail Value:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>LKR {parseFloat(item.stock_value_at_retail || 0).toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>
      ))}
      
      <ThermalFooter />
    </div>
  )
}

// Inventory Valuation Thermal
export function InventoryValuationThermal({ data }) {
  if (!data || !data.categories) return null
  
  return (
    <div id="thermal-inventory-valuation" style={thermalStyles.container}>
      <ThermalHeader title="💎 INVENTORY VALUATION" />
      
      {data.categories.map((cat, index) => (
        <div key={index} style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px dashed #ccc' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{cat.category_name}</div>
          <table style={{ width: '100%', fontSize: '10px', marginTop: '3px' }}>
            <tbody>
              <tr><td>Products:</td><td style={{ textAlign: 'right' }}>{cat.total_products}</td></tr>
              <tr><td>Quantity:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(cat.total_quantity || 0).toFixed(2)}</td></tr>
              <tr><td>Cost Value:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>LKR {parseFloat(cat.total_cost_value || 0).toFixed(2)}</td></tr>
              <tr><td>Retail Value:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>LKR {parseFloat(cat.total_retail_value || 0).toFixed(2)}</td></tr>
              <tr><td>Potential Profit:</td><td style={{ textAlign: 'right', color: '#3498db' }}>LKR {parseFloat(cat.potential_profit || 0).toFixed(2)}</td></tr>
              <tr><td>Margin:</td><td style={{ textAlign: 'right' }}>{parseFloat(cat.profit_margin_percentage || 0).toFixed(2)}%</td></tr>
            </tbody>
          </table>
        </div>
      ))}
      
      {data.grand_total && (
        <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '2px solid #000', backgroundColor: '#e8f5e9', padding: '10px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>GRAND TOTAL</h4>
          <table style={thermalStyles.table}>
            <tbody>
              <tr><td>Total Products:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{data.grand_total.total_products}</td></tr>
              <tr><td>Cost Value:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>LKR {parseFloat(data.grand_total.total_cost_value || 0).toFixed(2)}</td></tr>
              <tr><td>Retail Value:</td><td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color: '#27ae60' }}>LKR {parseFloat(data.grand_total.total_retail_value || 0).toFixed(2)}</td></tr>
              <tr><td>Potential Profit:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#3498db' }}>LKR {parseFloat(data.grand_total.potential_profit || 0).toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>
      )}
      
      <ThermalFooter additionalInfo="For financial reporting" />
    </div>
  )
}

// Stock Movement Thermal
export function StockMovementThermal({ data }) {
  if (!data || data.length === 0) return null
  const recentMovements = data.slice(0, 30)
  
  return (
    <div id="thermal-stock-movement" style={thermalStyles.container}>
      <ThermalHeader title="📊 STOCK MOVEMENT" subtitle={`Last ${recentMovements.length} Transactions`} />
      
      {recentMovements.map((item, index) => (
        <div key={index} style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px dashed #ccc' }}>
          <div style={{ fontSize: '10px', color: '#666' }}>{new Date(item.movement_date).toLocaleDateString()}</div>
          <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{item.product_name}</div>
          <table style={{ width: '100%', fontSize: '10px' }}>
            <tbody>
              <tr><td>Out (Sales):</td><td style={{ textAlign: 'right', color: '#e74c3c' }}>{parseFloat(item.quantity_out || 0).toFixed(2)}</td></tr>
              <tr><td>In (Returns):</td><td style={{ textAlign: 'right', color: '#27ae60' }}>{parseFloat(item.quantity_in_returns || 0).toFixed(2)}</td></tr>
              <tr><td>Net Movement:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(item.net_movement || 0).toFixed(2)}</td></tr>
              <tr><td>Current Stock:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(item.current_stock || 0).toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>
      ))}
      
      <ThermalFooter additionalInfo="For audit trail" />
    </div>
  )
}

// Payment Type Report Thermal
export function PaymentTypeReportThermal({ data }) {
  if (!data || data.length === 0) return null
  
  const total = data.reduce((sum, item) => sum + parseFloat(item.total_sales || 0), 0)
  
  return (
    <div id="thermal-payment-type" style={thermalStyles.container}>
      <ThermalHeader title="💳 PAYMENT TYPE REPORT" />
      
      {data.map((item, index) => (
        <div key={index} style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px dashed #ccc' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase' }}>{item.payment_method}</div>
          <table style={{ width: '100%', fontSize: '10px', marginTop: '3px' }}>
            <tbody>
              <tr><td>Transactions:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.total_transactions}</td></tr>
              <tr><td>Total Sales:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>LKR {parseFloat(item.total_sales || 0).toFixed(2)}</td></tr>
              <tr><td>Avg Value:</td><td style={{ textAlign: 'right' }}>LKR {parseFloat(item.avg_transaction_value || 0).toFixed(2)}</td></tr>
              <tr><td>% of Total:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#3498db' }}>{parseFloat(item.percentage_of_total || 0).toFixed(2)}%</td></tr>
            </tbody>
          </table>
        </div>
      ))}
      
      <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '2px solid #000', backgroundColor: '#f0f0f0', padding: '10px' }}>
        <table style={thermalStyles.table}>
          <tbody>
            <tr><td style={{ fontWeight: 'bold' }}>Total Sales:</td><td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>LKR {total.toFixed(2)}</td></tr>
          </tbody>
        </table>
      </div>
      
      <ThermalFooter additionalInfo="For bank reconciliation" />
    </div>
  )
}

// Cash Flow Report Thermal
export function CashFlowReportThermal({ data }) {
  if (!data || data.length === 0) return null
  
  const totals = data.reduce((acc, day) => ({
    cash_inflow: acc.cash_inflow + parseFloat(day.cash_inflow || 0),
    cash_outflow: acc.cash_outflow + parseFloat(day.cash_outflow || 0),
    net_cash_flow: acc.net_cash_flow + parseFloat(day.net_cash_flow || 0),
    cash_received: acc.cash_received + parseFloat(day.cash_received || 0),
    card_received: acc.card_received + parseFloat(day.card_received || 0),
    digital_received: acc.digital_received + parseFloat(day.digital_received || 0),
    total_change_given: acc.total_change_given + parseFloat(day.total_change_given || 0),
    net_cash_in_hand: acc.net_cash_in_hand + parseFloat(day.net_cash_in_hand || 0)
  }), { cash_inflow: 0, cash_outflow: 0, net_cash_flow: 0, cash_received: 0, card_received: 0, digital_received: 0, total_change_given: 0, net_cash_in_hand: 0 })
  
  return (
    <div id="thermal-cash-flow" style={thermalStyles.container}>
      <ThermalHeader title="💵 CASH FLOW REPORT" subtitle={`${data.length} Day${data.length !== 1 ? 's' : ''} Period`} />
      
      <div style={{ marginBottom: '15px' }}>
        <h4 style={thermalStyles.sectionTitle}>CASH FLOW SUMMARY</h4>
        <table style={thermalStyles.table}>
          <tbody>
            <tr><td>Cash Inflow:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>LKR {totals.cash_inflow.toFixed(2)}</td></tr>
            <tr><td>Cash Outflow:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#e74c3c' }}>LKR {totals.cash_outflow.toFixed(2)}</td></tr>
            <tr style={{ borderTop: '1px solid #000' }}><td style={{ fontWeight: 'bold' }}>Net Cash Flow:</td><td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>LKR {totals.net_cash_flow.toFixed(2)}</td></tr>
          </tbody>
        </table>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <h4 style={thermalStyles.sectionTitle}>RECEIPTS BY METHOD</h4>
        <table style={thermalStyles.table}>
          <tbody>
            <tr><td>💵 Cash Received:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>LKR {totals.cash_received.toFixed(2)}</td></tr>
            <tr><td>💳 Card Received:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>LKR {totals.card_received.toFixed(2)}</td></tr>
            <tr><td>📱 Digital Received:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>LKR {totals.digital_received.toFixed(2)}</td></tr>
          </tbody>
        </table>
      </div>
      
      <div style={{ marginBottom: '15px', backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '5px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>CASH POSITION</h4>
        <table style={thermalStyles.table}>
          <tbody>
            <tr><td>Change Given:</td><td style={{ textAlign: 'right', color: '#e74c3c' }}>LKR {totals.total_change_given.toFixed(2)}</td></tr>
            <tr style={{ borderTop: '1px solid #000' }}><td style={{ fontWeight: 'bold' }}>Net Cash in Hand:</td><td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '14px', color: '#27ae60' }}>LKR {totals.net_cash_in_hand.toFixed(2)}</td></tr>
          </tbody>
        </table>
      </div>
      
      <ThermalFooter additionalInfo="For daily reconciliation" />
    </div>
  )
}

// Sales Trend Analysis Thermal
export function SalesTrendAnalysisThermal({ data }) {
  if (!data || data.length === 0) return null
  
  return (
    <div id="thermal-sales-trend" style={thermalStyles.container}>
      <ThermalHeader title="📈 SALES TREND ANALYSIS" subtitle={`${data.length} Period${data.length !== 1 ? 's' : ''}`} />
      
      {data.map((item, index) => (
        <div key={index} style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px dashed #ccc' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{item.period}</div>
          <table style={{ width: '100%', fontSize: '10px', marginTop: '3px' }}>
            <tbody>
              <tr><td>Transactions:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.total_transactions}</td></tr>
              <tr><td>Items Sold:</td><td style={{ textAlign: 'right' }}>{parseFloat(item.total_items_sold || 0).toFixed(2)}</td></tr>
              <tr><td>Total Sales:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>LKR {parseFloat(item.total_sales || 0).toFixed(2)}</td></tr>
              <tr><td>Profit:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#3498db' }}>LKR {parseFloat(item.total_profit || 0).toFixed(2)}</td></tr>
              <tr><td>Margin:</td><td style={{ textAlign: 'right' }}>{parseFloat(item.profit_margin_percentage || 0).toFixed(2)}%</td></tr>
            </tbody>
          </table>
        </div>
      ))}
      
      <ThermalFooter additionalInfo="For forecasting & planning" />
    </div>
  )
}

// Category Contribution Thermal
export function CategoryContributionThermal({ data }) {
  if (!data || data.length === 0) return null
  
  return (
    <div id="thermal-category-contribution" style={thermalStyles.container}>
      <ThermalHeader title="📊 CATEGORY CONTRIBUTION" subtitle="Profit Drivers Analysis" />
      
      {data.map((item, index) => (
        <div key={index} style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px dashed #ccc' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{item.category_name}</div>
          <table style={{ width: '100%', fontSize: '10px', marginTop: '3px' }}>
            <tbody>
              <tr><td>Products:</td><td style={{ textAlign: 'right' }}>{item.unique_products}</td></tr>
              <tr><td>Revenue:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>LKR {parseFloat(item.total_revenue || 0).toFixed(2)}</td></tr>
              <tr><td>Cost:</td><td style={{ textAlign: 'right' }}>LKR {parseFloat(item.total_cost || 0).toFixed(2)}</td></tr>
              <tr><td>Profit:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#3498db' }}>LKR {parseFloat(item.total_profit || 0).toFixed(2)}</td></tr>
              <tr><td>Revenue %:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(item.revenue_contribution_percentage || 0).toFixed(2)}%</td></tr>
              <tr><td>Profit %:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#f39c12' }}>{parseFloat(item.profit_contribution_percentage || 0).toFixed(2)}%</td></tr>
              <tr><td>Margin:</td><td style={{ textAlign: 'right' }}>{parseFloat(item.profit_margin_percentage || 0).toFixed(2)}%</td></tr>
            </tbody>
          </table>
        </div>
      ))}
      
      <ThermalFooter additionalInfo="Focus on top contributors" />
    </div>
  )
}

// Gross Margin Analysis Thermal
export function GrossMarginAnalysisThermal({ data }) {
  if (!data || data.length === 0) return null
  const topItems = data.slice(0, 20)
  
  return (
    <div id="thermal-gross-margin" style={thermalStyles.container}>
      <ThermalHeader title="💹 GROSS MARGIN ANALYSIS" subtitle={`Top ${topItems.length} Items`} />
      
      {topItems.map((item, index) => (
        <div key={index} style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px dashed #ccc' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
            #{index + 1} {item.product_name || item.category_name}
          </div>
          {item.sku && <div style={{ fontSize: '9px', color: '#666' }}>SKU: {item.sku}</div>}
          <table style={{ width: '100%', fontSize: '10px', marginTop: '3px' }}>
            <tbody>
              <tr><td>Qty Sold:</td><td style={{ textAlign: 'right' }}>{parseFloat(item.total_quantity_sold || 0).toFixed(2)}</td></tr>
              <tr><td>Revenue:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>LKR {parseFloat(item.total_revenue || 0).toFixed(2)}</td></tr>
              <tr><td>Cost:</td><td style={{ textAlign: 'right', color: '#e74c3c' }}>LKR {parseFloat(item.total_cost || 0).toFixed(2)}</td></tr>
              <tr><td>Gross Profit:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>LKR {parseFloat(item.gross_profit || 0).toFixed(2)}</td></tr>
              <tr><td>Margin:</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: '#3498db' }}>{parseFloat(item.gross_margin_percentage || 0).toFixed(2)}%</td></tr>
              <tr><td>Markup:</td><td style={{ textAlign: 'right' }}>{parseFloat(item.markup_percentage || 0).toFixed(2)}%</td></tr>
            </tbody>
          </table>
        </div>
      ))}
      
      <ThermalFooter additionalInfo="For pricing strategy" />
    </div>
  )
}

// Thermal Print Function
export async function printThermalReport(reportId) {
  const reportElement = document.getElementById(reportId)
  
  if (!reportElement) {
    console.error('Report element not found:', reportId)
    return { success: false, message: 'Report element not found' }
  }

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)
  
  const iframeDoc = iframe.contentWindow.document
  
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Report</title>
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          body {
            margin: 0;
            padding: 0;
            font-family: monospace;
            width: 80mm;
          }
          .thermal-receipt {
            background: white;
          }
        </style>
      </head>
      <body>
        ${reportElement.innerHTML}
      </body>
    </html>
  `)
  iframeDoc.close()
  
  iframe.onload = () => {
    try {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
      
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    } catch (error) {
      console.error('Print error:', error)
      document.body.removeChild(iframe)
    }
  }

  return { success: true, message: 'Printing initiated' }
}
