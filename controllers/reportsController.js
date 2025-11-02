import * as reportsModel from '../models/reportsModel'

// ==================== SALES REPORTS ====================

export async function getDailySalesSummary(req, res) {
  try {
    const { date, start_date, end_date } = req.query
    const report = await reportsModel.getDailySalesSummary({ date, start_date, end_date })
    
    return res.status(200).json({
      success: true,
      report,
      metadata: {
        type: 'daily_sales_summary',
        generated_at: new Date().toISOString(),
        filters: { date, start_date, end_date }
      }
    })
  } catch (error) {
    console.error('Error generating daily sales summary:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate daily sales summary',
      error: error.message
    })
  }
}

export async function getSalesByProduct(req, res) {
  try {
    const { start_date, end_date, limit = 50, order = 'DESC' } = req.query
    const report = await reportsModel.getSalesByProduct({ 
      start_date, 
      end_date, 
      limit: parseInt(limit), 
      order 
    })
    
    return res.status(200).json({
      success: true,
      report,
      metadata: {
        type: 'sales_by_product',
        generated_at: new Date().toISOString(),
        filters: { start_date, end_date, limit, order }
      }
    })
  } catch (error) {
    console.error('Error generating sales by product report:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate sales by product report',
      error: error.message
    })
  }
}

export async function getSalesByCategory(req, res) {
  try {
    const { start_date, end_date } = req.query
    const report = await reportsModel.getSalesByCategory({ start_date, end_date })
    
    return res.status(200).json({
      success: true,
      report,
      metadata: {
        type: 'sales_by_category',
        generated_at: new Date().toISOString(),
        filters: { start_date, end_date }
      }
    })
  } catch (error) {
    console.error('Error generating sales by category report:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate sales by category report',
      error: error.message
    })
  }
}

export async function getSalesByHour(req, res) {
  try {
    const { date, start_date, end_date } = req.query
    const report = await reportsModel.getSalesByHour({ date, start_date, end_date })
    
    return res.status(200).json({
      success: true,
      report,
      metadata: {
        type: 'sales_by_hour',
        generated_at: new Date().toISOString(),
        filters: { date, start_date, end_date }
      }
    })
  } catch (error) {
    console.error('Error generating sales by hour report:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate sales by hour report',
      error: error.message
    })
  }
}

export async function getDiscountsAndReturns(req, res) {
  try {
    const { start_date, end_date } = req.query
    const report = await reportsModel.getDiscountsAndReturns({ start_date, end_date })
    
    return res.status(200).json({
      success: true,
      report,
      metadata: {
        type: 'discounts_and_returns',
        generated_at: new Date().toISOString(),
        filters: { start_date, end_date }
      }
    })
  } catch (error) {
    console.error('Error generating discounts and returns report:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate discounts and returns report',
      error: error.message
    })
  }
}

// ==================== INVENTORY REPORTS ====================

export async function getStockOnHand(req, res) {
  try {
    const { category, low_stock_only } = req.query
    const report = await reportsModel.getStockOnHand({ 
      category: category ? parseInt(category) : null,
      low_stock_only: low_stock_only === 'true'
    })
    
    return res.status(200).json({
      success: true,
      report,
      metadata: {
        type: 'stock_on_hand',
        generated_at: new Date().toISOString(),
        filters: { category, low_stock_only }
      }
    })
  } catch (error) {
    console.error('Error generating stock on hand report:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate stock on hand report',
      error: error.message
    })
  }
}

export async function getLowStockReport(req, res) {
  try {
    const report = await reportsModel.getLowStockReport()
    
    return res.status(200).json({
      success: true,
      report,
      metadata: {
        type: 'low_stock_report',
        generated_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error generating low stock report:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate low stock report',
      error: error.message
    })
  }
}

export async function getInventoryValuation(req, res) {
  try {
    const { category } = req.query
    const report = await reportsModel.getInventoryValuation({ 
      category: category ? parseInt(category) : null
    })
    
    return res.status(200).json({
      success: true,
      report,
      metadata: {
        type: 'inventory_valuation',
        generated_at: new Date().toISOString(),
        filters: { category }
      }
    })
  } catch (error) {
    console.error('Error generating inventory valuation report:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate inventory valuation report',
      error: error.message
    })
  }
}

export async function getStockMovement(req, res) {
  try {
    const { product_id, start_date, end_date } = req.query
    const report = await reportsModel.getStockMovement({ 
      product_id: product_id ? parseInt(product_id) : null,
      start_date, 
      end_date 
    })
    
    return res.status(200).json({
      success: true,
      report,
      metadata: {
        type: 'stock_movement',
        generated_at: new Date().toISOString(),
        filters: { product_id, start_date, end_date }
      }
    })
  } catch (error) {
    console.error('Error generating stock movement report:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate stock movement report',
      error: error.message
    })
  }
}

// ==================== FINANCIAL REPORTS ====================

export async function getProfitAndLoss(req, res) {
  try {
    const { start_date, end_date } = req.query
    const report = await reportsModel.getProfitAndLoss({ start_date, end_date })
    
    return res.status(200).json({
      success: true,
      report,
      metadata: {
        type: 'profit_and_loss',
        generated_at: new Date().toISOString(),
        filters: { start_date, end_date }
      }
    })
  } catch (error) {
    console.error('Error generating P&L report:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate P&L report',
      error: error.message
    })
  }
}

export async function getPaymentTypeReport(req, res) {
  try {
    const { start_date, end_date } = req.query
    const report = await reportsModel.getPaymentTypeReport({ start_date, end_date })
    
    return res.status(200).json({
      success: true,
      report,
      metadata: {
        type: 'payment_type_report',
        generated_at: new Date().toISOString(),
        filters: { start_date, end_date }
      }
    })
  } catch (error) {
    console.error('Error generating payment type report:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate payment type report',
      error: error.message
    })
  }
}

export async function getCashFlowReport(req, res) {
  try {
    const { start_date, end_date } = req.query
    const report = await reportsModel.getCashFlowReport({ start_date, end_date })
    
    return res.status(200).json({
      success: true,
      report,
      metadata: {
        type: 'cash_flow_report',
        generated_at: new Date().toISOString(),
        filters: { start_date, end_date }
      }
    })
  } catch (error) {
    console.error('Error generating cash flow report:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate cash flow report',
      error: error.message
    })
  }
}

// ==================== ANALYTICS / INSIGHTS REPORTS ====================

export async function getSalesTrendAnalysis(req, res) {
  try {
    const { period = 'daily', start_date, end_date } = req.query
    const report = await reportsModel.getSalesTrendAnalysis({ period, start_date, end_date })
    
    return res.status(200).json({
      success: true,
      report,
      metadata: {
        type: 'sales_trend_analysis',
        generated_at: new Date().toISOString(),
        filters: { period, start_date, end_date }
      }
    })
  } catch (error) {
    console.error('Error generating sales trend analysis:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate sales trend analysis',
      error: error.message
    })
  }
}

export async function getCategoryContribution(req, res) {
  try {
    const { start_date, end_date } = req.query
    const report = await reportsModel.getCategoryContribution({ start_date, end_date })
    
    return res.status(200).json({
      success: true,
      report,
      metadata: {
        type: 'category_contribution',
        generated_at: new Date().toISOString(),
        filters: { start_date, end_date }
      }
    })
  } catch (error) {
    console.error('Error generating category contribution report:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate category contribution report',
      error: error.message
    })
  }
}

export async function getGrossMarginAnalysis(req, res) {
  try {
    const { group_by = 'product', start_date, end_date, limit = 50 } = req.query
    const report = await reportsModel.getGrossMarginAnalysis({ 
      group_by, 
      start_date, 
      end_date,
      limit: parseInt(limit)
    })
    
    return res.status(200).json({
      success: true,
      report,
      metadata: {
        type: 'gross_margin_analysis',
        generated_at: new Date().toISOString(),
        filters: { group_by, start_date, end_date, limit }
      }
    })
  } catch (error) {
    console.error('Error generating gross margin analysis:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate gross margin analysis',
      error: error.message
    })
  }
}
