import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import * as reportsController from '@/controllers/reportsController'

// Middleware to check if user has access to reports (admin or manager only)
async function checkReportAccess(req) {
  const session = await getSession()
  
  if (!session) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  const allowedRoles = ['admin', 'manager']
  if (!allowedRoles.includes(session.user.role)) {
    return { 
      authorized: false, 
      response: NextResponse.json({ 
        error: 'Forbidden - Admin or Manager access required' 
      }, { status: 403 })
    }
  }
  
  return { authorized: true, session }
}

// Helper to convert NextRequest to Express-like format
function createExpressLikeObjects(request) {
  const url = new URL(request.url)
  const query = Object.fromEntries(url.searchParams)
  
  const req = {
    query,
    body: null,
    method: request.method,
    url: request.url
  }
  
  let responseData = null
  let responseStatus = 200
  
  const res = {
    status: (code) => {
      responseStatus = code
      return res
    },
    json: (data) => {
      responseData = data
      return res
    }
  }
  
  return { req, res, getResponse: () => NextResponse.json(responseData, { status: responseStatus }) }
}

// ==================== SALES REPORTS ====================

export async function GET(request) {
  const accessCheck = await checkReportAccess(request)
  if (!accessCheck.authorized) return accessCheck.response
  
  const url = new URL(request.url)
  const reportType = url.searchParams.get('type')
  
  const { req, res, getResponse } = createExpressLikeObjects(request)
  
  try {
    switch (reportType) {
      case 'daily_sales_summary':
        await reportsController.getDailySalesSummary(req, res)
        break
      case 'sales_by_product':
        await reportsController.getSalesByProduct(req, res)
        break
      case 'sales_by_category':
        await reportsController.getSalesByCategory(req, res)
        break
      case 'sales_by_hour':
        await reportsController.getSalesByHour(req, res)
        break
      case 'discounts_and_returns':
        await reportsController.getDiscountsAndReturns(req, res)
        break
      case 'stock_on_hand':
        await reportsController.getStockOnHand(req, res)
        break
      case 'low_stock':
        await reportsController.getLowStockReport(req, res)
        break
      case 'inventory_valuation':
        await reportsController.getInventoryValuation(req, res)
        break
      case 'stock_movement':
        await reportsController.getStockMovement(req, res)
        break
      case 'profit_and_loss':
        await reportsController.getProfitAndLoss(req, res)
        break
      case 'payment_type':
        await reportsController.getPaymentTypeReport(req, res)
        break
      case 'cash_flow':
        await reportsController.getCashFlowReport(req, res)
        break
      case 'sales_trend':
        await reportsController.getSalesTrendAnalysis(req, res)
        break
      case 'category_contribution':
        await reportsController.getCategoryContribution(req, res)
        break
      case 'gross_margin':
        await reportsController.getGrossMarginAnalysis(req, res)
        break
      default:
        return NextResponse.json({ 
          error: 'Invalid report type',
          available_types: [
            'daily_sales_summary', 'sales_by_product', 'sales_by_category', 
            'sales_by_hour', 'discounts_and_returns', 'stock_on_hand', 
            'low_stock', 'inventory_valuation', 'stock_movement', 
            'profit_and_loss', 'payment_type', 'cash_flow', 
            'sales_trend', 'category_contribution', 'gross_margin'
          ]
        }, { status: 400 })
    }
    
    return getResponse()
  } catch (error) {
    console.error('Report API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, { status: 500 })
  }
}
