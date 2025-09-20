import { getSession } from '../../../lib/auth'
import { 
  getSalesStats, 
  getDailySalesStats, 
  getTopSellingProducts,
  getCategorySalesStats,
  getCashierPerformance,
  getHourlySalesPattern,
  getMonthlyTrends,
  getLowStockAlerts,
  getProfitAnalysis,
  getTopProfitableProducts,
  getMostProfitableCategories,
  getProfitTrends
} from '../../../models/salesModel'
import { getProductsWithAlerts } from '../../../models/productModel'
import { query } from '../../../lib/db'

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching dashboard data for user:', session.user.email)

    // Get overall stats first
    let salesStats
    try {
      salesStats = await getSalesStats()
      console.log('Sales stats:', salesStats)
    } catch (error) {
      console.error('Error fetching sales stats:', error)
      salesStats = { total_sales: 0, total_revenue: 0, total_items_sold: 0, average_sale_amount: 0 }
    }
    
    // Get daily sales for the last 30 days
    let dailySales = []
    try {
      dailySales = await getDailySalesStats(30)
      console.log('Daily sales count:', dailySales.length)
    } catch (error) {
      console.error('Error fetching daily sales:', error)
    }
    
    // Get top selling products
    let topProducts = []
    try {
      topProducts = await getTopSellingProducts(10)
      console.log('Top products count:', topProducts.length)
    } catch (error) {
      console.error('Error fetching top products:', error)
    }
    
    // Get category performance
    let categoryStats = []
    try {
      categoryStats = await getCategorySalesStats()
      console.log('Category stats count:', categoryStats.length)
    } catch (error) {
      console.error('Error fetching category stats:', error)
    }
    
    // Get cashier performance (only for admin/manager)
    let cashierPerformance = []
    if (session.user.role === 'admin' || session.user.role === 'manager') {
      try {
        cashierPerformance = await getCashierPerformance()
        console.log('Cashier performance count:', cashierPerformance.length)
      } catch (error) {
        console.error('Error fetching cashier performance:', error)
      }
    }
    
    // Get hourly sales pattern
    let hourlySales = []
    try {
      hourlySales = await getHourlySalesPattern()
      console.log('Hourly sales count:', hourlySales.length)
    } catch (error) {
      console.error('Error fetching hourly sales:', error)
    }
    
    // Get monthly trends
    let monthlyTrends = []
    try {
      monthlyTrends = await getMonthlyTrends()
      console.log('Monthly trends count:', monthlyTrends.length)
    } catch (error) {
      console.error('Error fetching monthly trends:', error)
    }
    
    // Get low stock alerts
    let lowStockAlerts = []
    try {
      lowStockAlerts = await getLowStockAlerts()
      console.log('Low stock alerts count:', lowStockAlerts.length)
    } catch (error) {
      console.error('Error fetching low stock alerts:', error)
    }
    
    // Get expiry alerts
    let expiryAlerts = []
    try {
      expiryAlerts = await getProductsWithAlerts()
      console.log('Expiry alerts count:', expiryAlerts.length)
    } catch (error) {
      console.error('Error fetching expiry alerts:', error)
    }
    
    // Get product stats
    let productStats = { total_products: 0, active_products: 0, low_stock_products: 0, out_of_stock_products: 0 }
    try {
      const productStatsResult = await query(`
        SELECT 
          COUNT(*) as total_products,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
          COUNT(CASE WHEN available_quantity <= 5 THEN 1 END) as low_stock_products,
          COUNT(CASE WHEN available_quantity = 0 THEN 1 END) as out_of_stock_products
        FROM products
      `)
      productStats = productStatsResult.rows[0]
      console.log('Product stats:', productStats)
    } catch (error) {
      console.error('Error fetching product stats:', error)
    }
    
    // Get user stats (only for admin/manager)
    let userStats = { total_users: 0, cashiers: 0, managers: 0, admins: 0 }
    if (session.user.role === 'admin' || session.user.role === 'manager') {
      try {
        const userStatsResult = await query(`
          SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN role = 'cashier' THEN 1 END) as cashiers,
            COUNT(CASE WHEN role = 'manager' THEN 1 END) as managers,
            COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
          FROM users
        `)
        userStats = userStatsResult.rows[0]
        console.log('User stats:', userStats)
      } catch (error) {
        console.error('Error fetching user stats:', error)
      }
    }
    
    // Get recent sales activity
    let recentActivity = []
    try {
      const recentActivityResult = await query(`
        SELECT 
          s.id,
          s.product_name,
          s.quantity,
          s.total_amount,
          s.sale_date,
          u.name as cashier_name,
          p.sku
        FROM sales s
        LEFT JOIN users u ON s.created_by = u.id
        LEFT JOIN products p ON s.product_id = p.id
        ORDER BY s.sale_date DESC
        LIMIT 10
      `)
      recentActivity = recentActivityResult.rows
      console.log('Recent activity count:', recentActivity.length)
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }

    // Get profit analysis data
    let profitAnalysis = []
    try {
      profitAnalysis = await getProfitAnalysis(30)
      console.log('Profit analysis count:', profitAnalysis.length)
    } catch (error) {
      console.error('Error fetching profit analysis:', error)
    }

    // Get top profitable products
    let topProfitableProducts = []
    try {
      topProfitableProducts = await getTopProfitableProducts(10)
      console.log('Top profitable products count:', topProfitableProducts.length)
    } catch (error) {
      console.error('Error fetching top profitable products:', error)
    }

    // Get most profitable categories
    let profitableCategories = []
    try {
      profitableCategories = await getMostProfitableCategories()
      console.log('Profitable categories count:', profitableCategories.length)
    } catch (error) {
      console.error('Error fetching profitable categories:', error)
    }

    // Get profit trends
    let profitTrends = []
    try {
      profitTrends = await getProfitTrends(12)
      console.log('Profit trends count:', profitTrends.length)
    } catch (error) {
      console.error('Error fetching profit trends:', error)
    }

    return Response.json({
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
      recentActivity,
      profitAnalysis,
      topProfitableProducts,
      profitableCategories,
      profitTrends
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return Response.json({ message: 'Internal server error', error: error.message }, { status: 500 })
  }
}
