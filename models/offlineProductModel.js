import { getLocalDb, generateId, addTimestamps, resolveConflicts } from '@/lib/pouchdb';

class OfflineProductModel {
  constructor() {
    this.db = null;
    this.initialized = false;
    
    // Initialize in browser only
    if (typeof window !== 'undefined') {
      this.initializeDb();
    }
  }

  initializeDb() {
    const db = getLocalDb('products');
    if (db) {
      this.db = db;
      this.initialized = true;
    } else {
      // Retry initialization
      setTimeout(() => this.initializeDb(), 1000);
    }
  }

  async ensureInitialized() {
    if (!this.initialized && typeof window !== 'undefined') {
      await new Promise(resolve => {
        const check = () => {
          if (this.initialized) {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    }
  }

  async create(productData) {
    await this.ensureInitialized();
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }
    
    try {
      const product = {
        ...productData,
        _id: generateId('product'),
        type: 'product'
      };

      addTimestamps(product);
      
      const result = await this.db.put(product);
      return {
        success: true,
        product: {
          ...product,
          id: product._id,
          _rev: result.rev
        }
      };
    } catch (error) {
      console.error('Error creating product:', error);
      return { success: false, error: error.message };
    }
  }

  async findAll(options = {}) {
    await this.ensureInitialized();
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }
    
    try {
      const { limit = 100, skip = 0, category_id, search } = options;
      
      let selector = { type: 'product' };
      
      if (category_id) {
        selector.category_id = category_id;
      }
      
      if (search) {
        // PouchDB doesn't support full-text search out of the box
        // We'll filter by name containing the search term
        selector.name = { $regex: new RegExp(search, 'i') };
      }

      const result = await this.db.find({
        selector,
        limit,
        skip,
        sort: [{ created_at: 'desc' }]
      });

      const products = result.docs.map(doc => ({
        ...doc,
        id: doc._id
      }));

      return { success: true, products };
    } catch (error) {
      console.error('Error finding products:', error);
      return { success: false, error: error.message };
    }
  }

  async findById(id) {
    try {
      const product = await this.db.get(id);
      return {
        success: true,
        product: {
          ...product,
          id: product._id
        }
      };
    } catch (error) {
      if (error.name === 'not_found') {
        return { success: false, error: 'Product not found' };
      }
      console.error('Error finding product:', error);
      return { success: false, error: error.message };
    }
  }

  async findBySku(sku) {
    try {
      const result = await this.db.find({
        selector: {
          type: 'product',
          sku: sku
        },
        limit: 1
      });

      if (result.docs.length === 0) {
        return { success: false, error: 'Product not found' };
      }

      const product = result.docs[0];
      return {
        success: true,
        product: {
          ...product,
          id: product._id
        }
      };
    } catch (error) {
      console.error('Error finding product by SKU:', error);
      return { success: false, error: error.message };
    }
  }

  async update(id, updateData) {
    try {
      const existingProduct = await this.db.get(id);
      
      const updatedProduct = {
        ...existingProduct,
        ...updateData,
        _id: id,
        _rev: existingProduct._rev
      };

      addTimestamps(updatedProduct, true);

      const result = await this.db.put(updatedProduct);
      
      return {
        success: true,
        product: {
          ...updatedProduct,
          id: updatedProduct._id,
          _rev: result.rev
        }
      };
    } catch (error) {
      if (error.name === 'conflict') {
        // Handle conflict by resolving and retrying
        await resolveConflicts('products', id, 'latest');
        return this.update(id, updateData); // Retry
      }
      
      console.error('Error updating product:', error);
      return { success: false, error: error.message };
    }
  }

  async delete(id) {
    try {
      const product = await this.db.get(id);
      const result = await this.db.remove(product);
      
      return { success: true, result };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, error: error.message };
    }
  }

  async updateStock(id, newQuantity, operation = 'set') {
    try {
      const existingProduct = await this.db.get(id);
      
      let updatedQuantity;
      switch (operation) {
        case 'add':
          updatedQuantity = (existingProduct.stock_quantity || 0) + newQuantity;
          break;
        case 'subtract':
          updatedQuantity = (existingProduct.stock_quantity || 0) - newQuantity;
          break;
        case 'set':
        default:
          updatedQuantity = newQuantity;
          break;
      }

      const updatedProduct = {
        ...existingProduct,
        stock_quantity: Math.max(0, updatedQuantity), // Prevent negative stock
        _rev: existingProduct._rev
      };

      addTimestamps(updatedProduct, true);

      const result = await this.db.put(updatedProduct);
      
      return {
        success: true,
        product: {
          ...updatedProduct,
          id: updatedProduct._id,
          _rev: result.rev
        }
      };
    } catch (error) {
      if (error.name === 'conflict') {
        await resolveConflicts('products', id, 'latest');
        return this.updateStock(id, newQuantity, operation);
      }
      
      console.error('Error updating stock:', error);
      return { success: false, error: error.message };
    }
  }

  async getLowStockProducts(threshold = 10) {
    try {
      const result = await this.db.find({
        selector: {
          type: 'product',
          stock_quantity: { $lte: threshold }
        },
        sort: [{ stock_quantity: 'asc' }]
      });

      const products = result.docs.map(doc => ({
        ...doc,
        id: doc._id
      }));

      return { success: true, products };
    } catch (error) {
      console.error('Error getting low stock products:', error);
      return { success: false, error: error.message };
    }
  }

  async getProductsByCategory(categoryId) {
    try {
      const result = await this.db.find({
        selector: {
          type: 'product',
          category_id: categoryId
        },
        sort: [{ name: 'asc' }]
      });

      const products = result.docs.map(doc => ({
        ...doc,
        id: doc._id
      }));

      return { success: true, products };
    } catch (error) {
      console.error('Error getting products by category:', error);
      return { success: false, error: error.message };
    }
  }

  // Bulk operations for better performance
  async bulkCreate(productsData) {
    try {
      const products = productsData.map(productData => {
        const product = {
          ...productData,
          _id: generateId('product'),
          type: 'product'
        };
        addTimestamps(product);
        return product;
      });

      const result = await this.db.bulkDocs(products);
      
      const successfulProducts = result
        .filter(r => r.ok)
        .map((r, index) => ({
          ...products[index],
          id: products[index]._id,
          _rev: r.rev
        }));

      return {
        success: true,
        products: successfulProducts,
        errors: result.filter(r => !r.ok)
      };
    } catch (error) {
      console.error('Error bulk creating products:', error);
      return { success: false, error: error.message };
    }
  }

  async bulkUpdateStock(stockUpdates) {
    try {
      // stockUpdates format: [{ productId, quantity, operation }]
      const updatePromises = stockUpdates.map(update => 
        this.updateStock(update.productId, update.quantity, update.operation)
      );

      const results = await Promise.allSettled(updatePromises);
      
      const successful = results
        .filter(r => r.status === 'fulfilled' && r.value.success)
        .map(r => r.value);

      const failed = results
        .filter(r => r.status === 'rejected' || !r.value.success)
        .map((r, index) => ({
          productId: stockUpdates[index].productId,
          error: r.status === 'rejected' ? r.reason : r.value.error
        }));

      return {
        success: true,
        successful: successful.length,
        failed: failed.length,
        errors: failed
      };
    } catch (error) {
      console.error('Error bulk updating stock:', error);
      return { success: false, error: error.message };
    }
  }

  // Sync-specific methods
  async getChanges(since = 0) {
    try {
      const result = await this.db.changes({
        since,
        include_docs: true,
        filter: doc => doc.type === 'product'
      });

      return {
        success: true,
        changes: result.results,
        last_seq: result.last_seq
      };
    } catch (error) {
      console.error('Error getting changes:', error);
      return { success: false, error: error.message };
    }
  }

  async resolveConflict(productId, strategy = 'latest') {
    try {
      const result = await resolveConflicts('products', productId, strategy);
      return { success: true, result };
    } catch (error) {
      console.error('Error resolving conflict:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new OfflineProductModel();
