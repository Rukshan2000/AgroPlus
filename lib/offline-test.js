import { getLocalDb, generateId, addTimestamps } from '@/lib/pouchdb';

// Simple offline test functions
export const testOfflineStorage = async () => {
  try {
    console.log('🧪 Testing offline storage...');
    
    // Wait for PouchDB to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const productsDb = getLocalDb('products');
    if (!productsDb) {
      console.error('❌ Products database not available');
      return false;
    }
    
    // Test creating a product
    const testProduct = {
      _id: generateId('test_product'),
      type: 'product',
      name: 'Test Coffee',
      price: 2.50,
      stock_quantity: 100
    };
    
    addTimestamps(testProduct);
    
    const result = await productsDb.put(testProduct);
    console.log('✅ Product created:', result);
    
    // Test retrieving the product
    const retrieved = await productsDb.get(testProduct._id);
    console.log('✅ Product retrieved:', retrieved);
    
    // Test querying products
    const allProducts = await productsDb.allDocs({
      include_docs: true,
      startkey: 'product_',
      endkey: 'product_\ufff0'
    });
    console.log('✅ All products:', allProducts.rows.length);
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

export const testOfflineSales = async () => {
  try {
    console.log('🧪 Testing offline sales...');
    
    const salesDb = getLocalDb('sales');
    if (!salesDb) {
      console.error('❌ Sales database not available');
      return false;
    }
    
    // Test creating a sale
    const testSale = {
      _id: generateId('test_sale'),
      type: 'sale',
      items: [
        {
          product_id: 'test_product_001',
          name: 'Test Coffee',
          quantity: 2,
          price: 2.50,
          total: 5.00
        }
      ],
      total_amount: 5.00,
      cashier_id: 'test_cashier',
      sync_status: 'pending'
    };
    
    addTimestamps(testSale);
    
    const result = await salesDb.put(testSale);
    console.log('✅ Sale created:', result);
    
    // Test retrieving sales
    const allSales = await salesDb.allDocs({
      include_docs: true,
      startkey: 'sale_',
      endkey: 'sale_\ufff0'
    });
    console.log('✅ All sales:', allSales.rows.length);
    
    return true;
  } catch (error) {
    console.error('❌ Sales test failed:', error);
    return false;
  }
};

export const clearTestData = async () => {
  try {
    console.log('🧹 Clearing test data...');
    
    const productsDb = getLocalDb('products');
    const salesDb = getLocalDb('sales');
    
    if (productsDb) {
      const products = await productsDb.allDocs({
        startkey: 'test_product_',
        endkey: 'test_product_\ufff0'
      });
      
      for (const row of products.rows) {
        await productsDb.remove(row.id, row.value.rev);
      }
    }
    
    if (salesDb) {
      const sales = await salesDb.allDocs({
        startkey: 'test_sale_',
        endkey: 'test_sale_\ufff0'
      });
      
      for (const row of sales.rows) {
        await salesDb.remove(row.id, row.value.rev);
      }
    }
    
    console.log('✅ Test data cleared');
    return true;
  } catch (error) {
    console.error('❌ Clear test data failed:', error);
    return false;
  }
};
