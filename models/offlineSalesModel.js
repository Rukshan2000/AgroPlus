import { getLocalDb, generateId, addTimestamps, resolveConflicts } from '@/lib/pouchdb';

class OfflineSalesModel {
  constructor() {
    this.db = getLocalDb('sales');
  }

  async createSale(saleData) {
    try {
      const sale = {
        ...saleData,
        _id: generateId('sale'),
        type: 'sale',
        sync_status: 'pending' // Track sync status
      };

      addTimestamps(sale);
      
      // Calculate profit if buying prices are available
      if (sale.items && Array.isArray(sale.items)) {
        let totalCost = 0;
        let totalRevenue = 0;
        
        sale.items.forEach(item => {
          const itemRevenue = (item.price || 0) * (item.quantity || 0);
          const itemCost = (item.buying_price || 0) * (item.quantity || 0);
          
          totalRevenue += itemRevenue;
          totalCost += itemCost;
        });
        
        sale.total_cost = totalCost;
        sale.total_revenue = totalRevenue;
        sale.profit = totalRevenue - totalCost;
        sale.profit_margin = totalRevenue > 0 ? ((sale.profit / totalRevenue) * 100) : 0;
      }

      const result = await this.db.put(sale);
      
      return {
        success: true,
        sale: {
          ...sale,
          id: sale._id,
          _rev: result.rev
        }
      };
    } catch (error) {
      console.error('Error creating sale:', error);
      return { success: false, error: error.message };
    }
  }

  async findAll(options = {}) {
    try {
      const { 
        limit = 100, 
        skip = 0, 
        startDate, 
        endDate, 
        cashier_id,
        payment_method 
      } = options;
      
      let selector = { type: 'sale' };
      
      if (startDate || endDate) {
        selector.created_at = {};
        if (startDate) selector.created_at.$gte = startDate;
        if (endDate) selector.created_at.$lte = endDate;
      }
      
      if (cashier_id) {
        selector.cashier_id = cashier_id;
      }
      
      if (payment_method) {
        selector.payment_method = payment_method;
      }

      const result = await this.db.find({
        selector,
        limit,
        skip,
        sort: [{ created_at: 'desc' }]
      });

      const sales = result.docs.map(doc => ({
        ...doc,
        id: doc._id
      }));

      return { success: true, sales };
    } catch (error) {
      console.error('Error finding sales:', error);
      return { success: false, error: error.message };
    }
  }

  async findById(id) {
    try {
      const sale = await this.db.get(id);
      return {
        success: true,
        sale: {
          ...sale,
          id: sale._id
        }
      };
    } catch (error) {
      if (error.name === 'not_found') {
        return { success: false, error: 'Sale not found' };
      }
      console.error('Error finding sale:', error);
      return { success: false, error: error.message };
    }
  }

  async updateSale(id, updateData) {
    try {
      const existingSale = await this.db.get(id);
      
      const updatedSale = {
        ...existingSale,
        ...updateData,
        _id: id,
        _rev: existingSale._rev,
        sync_status: 'pending' // Mark as needing sync
      };

      addTimestamps(updatedSale, true);

      const result = await this.db.put(updatedSale);
      
      return {
        success: true,
        sale: {
          ...updatedSale,
          id: updatedSale._id,
          _rev: result.rev
        }
      };
    } catch (error) {
      if (error.name === 'conflict') {
        await resolveConflicts('sales', id, 'latest');
        return this.updateSale(id, updateData);
      }
      
      console.error('Error updating sale:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteSale(id) {
    try {
      const sale = await this.db.get(id);
      const result = await this.db.remove(sale);
      
      return { success: true, result };
    } catch (error) {
      console.error('Error deleting sale:', error);
      return { success: false, error: error.message };
    }
  }

  // Analytics methods for offline operation
  async getDailySales(date = new Date()) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const result = await this.db.find({
        selector: {
          type: 'sale',
          created_at: {
            $gte: startOfDay.toISOString(),
            $lte: endOfDay.toISOString()
          }
        }
      });

      const sales = result.docs;
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

      return {
        success: true,
        analytics: {
          date: date.toISOString().split('T')[0],
          total_sales: totalSales,
          total_revenue: totalRevenue,
          total_profit: totalProfit,
          average_sale: totalSales > 0 ? totalRevenue / totalSales : 0,
          sales
        }
      };
    } catch (error) {
      console.error('Error getting daily sales:', error);
      return { success: false, error: error.message };
    }
  }

  async getMonthlySales(year, month) {
    try {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      const result = await this.db.find({
        selector: {
          type: 'sale',
          created_at: {
            $gte: startOfMonth.toISOString(),
            $lte: endOfMonth.toISOString()
          }
        }
      });

      const sales = result.docs;
      
      // Group by day
      const dailyData = {};
      sales.forEach(sale => {
        const day = new Date(sale.created_at).getDate();
        if (!dailyData[day]) {
          dailyData[day] = {
            sales_count: 0,
            revenue: 0,
            profit: 0
          };
        }
        dailyData[day].sales_count++;
        dailyData[day].revenue += sale.total_amount || 0;
        dailyData[day].profit += sale.profit || 0;
      });

      return {
        success: true,
        analytics: {
          year,
          month,
          total_sales: sales.length,
          total_revenue: sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0),
          total_profit: sales.reduce((sum, sale) => sum + (sale.profit || 0), 0),
          daily_breakdown: dailyData
        }
      };
    } catch (error) {
      console.error('Error getting monthly sales:', error);
      return { success: false, error: error.message };
    }
  }

  async getTopSellingProducts(limit = 10, startDate, endDate) {
    try {
      let selector = { type: 'sale' };
      
      if (startDate || endDate) {
        selector.created_at = {};
        if (startDate) selector.created_at.$gte = startDate;
        if (endDate) selector.created_at.$lte = endDate;
      }

      const result = await this.db.find({ selector });
      
      const productStats = {};
      
      result.docs.forEach(sale => {
        if (sale.items && Array.isArray(sale.items)) {
          sale.items.forEach(item => {
            const productId = item.product_id || item.id;
            if (!productStats[productId]) {
              productStats[productId] = {
                product_id: productId,
                product_name: item.name || item.product_name,
                total_quantity: 0,
                total_revenue: 0,
                total_profit: 0,
                sales_count: 0
              };
            }
            
            productStats[productId].total_quantity += item.quantity || 0;
            productStats[productId].total_revenue += (item.price || 0) * (item.quantity || 0);
            productStats[productId].total_profit += ((item.price || 0) - (item.buying_price || 0)) * (item.quantity || 0);
            productStats[productId].sales_count++;
          });
        }
      });

      const topProducts = Object.values(productStats)
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, limit);

      return {
        success: true,
        products: topProducts
      };
    } catch (error) {
      console.error('Error getting top selling products:', error);
      return { success: false, error: error.message };
    }
  }

  async getProfitAnalysis(startDate, endDate) {
    try {
      let selector = { type: 'sale' };
      
      if (startDate || endDate) {
        selector.created_at = {};
        if (startDate) selector.created_at.$gte = startDate;
        if (endDate) selector.created_at.$lte = endDate;
      }

      const result = await this.db.find({ selector });
      const sales = result.docs;

      const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_revenue || sale.total_amount || 0), 0);
      const totalCost = sales.reduce((sum, sale) => sum + (sale.total_cost || 0), 0);
      const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

      const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

      return {
        success: true,
        analysis: {
          total_revenue: totalRevenue,
          total_cost: totalCost,
          total_profit: totalProfit,
          profit_margin: profitMargin,
          sales_count: sales.length,
          average_profit_per_sale: sales.length > 0 ? totalProfit / sales.length : 0
        }
      };
    } catch (error) {
      console.error('Error getting profit analysis:', error);
      return { success: false, error: error.message };
    }
  }

  async getCashierPerformance(startDate, endDate) {
    try {
      let selector = { type: 'sale' };
      
      if (startDate || endDate) {
        selector.created_at = {};
        if (startDate) selector.created_at.$gte = startDate;
        if (endDate) selector.created_at.$lte = endDate;
      }

      const result = await this.db.find({ selector });
      
      const cashierStats = {};
      
      result.docs.forEach(sale => {
        const cashierId = sale.cashier_id || 'unknown';
        if (!cashierStats[cashierId]) {
          cashierStats[cashierId] = {
            cashier_id: cashierId,
            cashier_name: sale.cashier_name || 'Unknown',
            sales_count: 0,
            total_revenue: 0,
            total_profit: 0
          };
        }
        
        cashierStats[cashierId].sales_count++;
        cashierStats[cashierId].total_revenue += sale.total_amount || 0;
        cashierStats[cashierId].total_profit += sale.profit || 0;
      });

      const performance = Object.values(cashierStats)
        .sort((a, b) => b.total_revenue - a.total_revenue);

      return {
        success: true,
        performance
      };
    } catch (error) {
      console.error('Error getting cashier performance:', error);
      return { success: false, error: error.message };
    }
  }

  // Sync status methods
  async getPendingSales() {
    try {
      const result = await this.db.find({
        selector: {
          type: 'sale',
          sync_status: 'pending'
        }
      });

      return {
        success: true,
        sales: result.docs.map(doc => ({
          ...doc,
          id: doc._id
        }))
      };
    } catch (error) {
      console.error('Error getting pending sales:', error);
      return { success: false, error: error.message };
    }
  }

  async markAsSynced(saleIds) {
    try {
      const updates = await Promise.all(
        saleIds.map(async (id) => {
          const sale = await this.db.get(id);
          return {
            ...sale,
            sync_status: 'synced',
            synced_at: new Date().toISOString()
          };
        })
      );

      const result = await this.db.bulkDocs(updates);
      
      return {
        success: true,
        updated: result.filter(r => r.ok).length,
        errors: result.filter(r => !r.ok)
      };
    } catch (error) {
      console.error('Error marking sales as synced:', error);
      return { success: false, error: error.message };
    }
  }

  async resolveConflict(saleId, strategy = 'latest') {
    try {
      const result = await resolveConflicts('sales', saleId, strategy);
      return { success: true, result };
    } catch (error) {
      console.error('Error resolving conflict:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new OfflineSalesModel();
