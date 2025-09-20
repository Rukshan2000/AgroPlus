// Client-side only PouchDB setup
let PouchDB = null;
let dbManager = null;

// Only initialize in browser environment
if (typeof window !== 'undefined') {
  // Import PouchDB dynamically for client-side only
  const initPouchDB = async () => {
    if (PouchDB) return PouchDB;
    
    try {
      const PouchDBCore = (await import('pouchdb')).default;
      const PouchDBAdapterIdb = (await import('pouchdb-adapter-idb')).default;
      const PouchDBFind = (await import('pouchdb-find')).default;
      
      // Only load plugins if they haven't been loaded before
      if (!PouchDBCore.__PLUGINS_LOADED__) {
        PouchDBCore.plugin(PouchDBAdapterIdb);
        PouchDBCore.plugin(PouchDBFind);
        PouchDBCore.__PLUGINS_LOADED__ = true;
      }
      
      PouchDB = PouchDBCore;
      return PouchDB;
    } catch (error) {
      console.error('Failed to load PouchDB:', error);
      return null;
    }
  };
  
  // Initialize immediately
  initPouchDB();
}

// Database configuration
const DB_CONFIG = {
  products: 'agroplus_products',
  sales: 'agroplus_sales',
  categories: 'agroplus_categories',
  users: 'agroplus_users',
  inventory: 'agroplus_inventory',
  settings: 'agroplus_settings'
};

// CouchDB server configuration (you'll need to update these)
const COUCHDB_URL = process.env.NEXT_PUBLIC_COUCHDB_URL || 'http://localhost:5984';
const COUCHDB_USERNAME = process.env.NEXT_PUBLIC_COUCHDB_USERNAME || 'admin';
const COUCHDB_PASSWORD = process.env.NEXT_PUBLIC_COUCHDB_PASSWORD || 'password';

class DatabaseManager {
  constructor() {
    this.localDbs = {};
    this.remoteDbs = {};
    this.syncHandlers = {};
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.initialized = false;
    
    // Only initialize in browser
    if (typeof window !== 'undefined') {
      this.initializeDatabases();
      
      // Setup online/offline event listeners
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.startSync();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.stopSync();
      });
    }
  }

  async initializeDatabases() {
    if (!PouchDB) {
      console.warn('PouchDB not available, waiting...');
      setTimeout(() => this.initializeDatabases(), 1000);
      return;
    }
    
    Object.keys(DB_CONFIG).forEach(dbName => {
      // Local databases using IndexedDB
      this.localDbs[dbName] = new PouchDB(DB_CONFIG[dbName], {
        adapter: 'idb'
      });

      // Create indexes for efficient querying
      this.createIndexes(dbName);
    });
    
    this.initialized = true;
    console.log('✅ PouchDB databases initialized');
  }

  async createIndexes(dbName) {
    const db = this.localDbs[dbName];
    
    try {
      switch (dbName) {
        case 'products':
          await db.createIndex({ index: { fields: ['name'] } });
          await db.createIndex({ index: { fields: ['category_id'] } });
          await db.createIndex({ index: { fields: ['sku'] } });
          await db.createIndex({ index: { fields: ['created_at'] } });
          break;
          
        case 'sales':
          await db.createIndex({ index: { fields: ['created_at'] } });
          await db.createIndex({ index: { fields: ['cashier_id'] } });
          await db.createIndex({ index: { fields: ['total_amount'] } });
          await db.createIndex({ index: { fields: ['payment_method'] } });
          break;
          
        case 'categories':
          await db.createIndex({ index: { fields: ['name'] } });
          await db.createIndex({ index: { fields: ['created_at'] } });
          break;
          
        case 'users':
          await db.createIndex({ index: { fields: ['email'] } });
          await db.createIndex({ index: { fields: ['role'] } });
          await db.createIndex({ index: { fields: ['created_at'] } });
          break;
          
        case 'inventory':
          await db.createIndex({ index: { fields: ['product_id'] } });
          await db.createIndex({ index: { fields: ['quantity'] } });
          await db.createIndex({ index: { fields: ['updated_at'] } });
          break;
      }
    } catch (error) {
      console.warn(`Index creation warning for ${dbName}:`, error.message);
    }
  }

  // Get local database instance
  getLocalDb(dbName) {
    return this.localDbs[dbName];
  }

  // Get remote database instance
  getRemoteDb(dbName) {
    return this.remoteDbs[dbName];
  }

  // Start continuous sync for a specific database
  startSyncForDb(dbName) {
    // TODO: Temporarily disabled until replication plugin is fixed
    console.log(`Sync temporarily disabled for ${dbName}`);
    return;
    
    if (!this.isOnline || this.syncHandlers[dbName]) return;

    const localDb = this.localDbs[dbName];
    const remoteDb = this.remoteDbs[dbName];

    console.log(`Starting sync for ${dbName}`);

    this.syncHandlers[dbName] = localDb.sync(remoteDb, {
      live: true,
      retry: true,
      heartbeat: 10000,
      timeout: 30000
    })
    .on('change', (info) => {
      console.log(`Sync change for ${dbName}:`, info);
      // Emit custom event for UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('db-sync-change', {
          detail: { dbName, info }
        }));
      }
    })
    .on('paused', (err) => {
      console.log(`Sync paused for ${dbName}:`, err || 'offline');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('db-sync-paused', {
          detail: { dbName, error: err }
        }));
      }
    })
    .on('active', () => {
      console.log(`Sync resumed for ${dbName}`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('db-sync-active', {
          detail: { dbName }
        }));
      }
    })
    .on('denied', (err) => {
      console.error(`Sync denied for ${dbName}:`, err);
    })
    .on('complete', (info) => {
      console.log(`Sync complete for ${dbName}:`, info);
    })
    .on('error', (err) => {
      console.error(`Sync error for ${dbName}:`, err);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('db-sync-error', {
          detail: { dbName, error: err }
        }));
      }
    });
  }

  // Start sync for all databases
  startSync() {
    if (!this.isOnline) return;
    
    Object.keys(DB_CONFIG).forEach(dbName => {
      this.startSyncForDb(dbName);
    });
  }

  // Stop sync for a specific database
  stopSyncForDb(dbName) {
    if (this.syncHandlers[dbName]) {
      this.syncHandlers[dbName].cancel();
      delete this.syncHandlers[dbName];
      console.log(`Stopped sync for ${dbName}`);
    }
  }

  // Stop sync for all databases
  stopSync() {
    Object.keys(this.syncHandlers).forEach(dbName => {
      this.stopSyncForDb(dbName);
    });
  }

  // Manual sync for a specific database (one-time)
  async manualSync(dbName) {
    const localDb = this.localDbs[dbName];
    const remoteDb = this.remoteDbs[dbName];

    try {
      const result = await localDb.sync(remoteDb);
      console.log(`Manual sync completed for ${dbName}:`, result);
      return result;
    } catch (error) {
      console.error(`Manual sync failed for ${dbName}:`, error);
      throw error;
    }
  }

  // Get sync status
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      activeSyncs: Object.keys(this.syncHandlers),
      databases: Object.keys(DB_CONFIG)
    };
  }

  // Conflict resolution helper
  async resolveConflicts(dbName, docId, resolutionStrategy = 'latest') {
    const db = this.localDbs[dbName];
    
    try {
      const doc = await db.get(docId, { conflicts: true });
      
      if (!doc._conflicts) {
        return doc; // No conflicts
      }

      console.log(`Resolving conflicts for ${dbName}/${docId}`, doc._conflicts);

      let winningDoc = doc;

      // Get all conflicted revisions
      const conflictedDocs = await Promise.all(
        doc._conflicts.map(rev => db.get(docId, { rev }))
      );

      switch (resolutionStrategy) {
        case 'latest':
          // Keep the document with the latest timestamp
          const allDocs = [doc, ...conflictedDocs];
          winningDoc = allDocs.reduce((latest, current) => {
            const latestTime = new Date(latest.updated_at || latest.created_at || 0);
            const currentTime = new Date(current.updated_at || current.created_at || 0);
            return currentTime > latestTime ? current : latest;
          });
          break;

        case 'merge':
          // Custom merge logic (you can customize this per document type)
          winningDoc = this.mergeDocuments(doc, conflictedDocs);
          break;

        case 'manual':
          // Return all versions for manual resolution
          return {
            winner: doc,
            conflicts: conflictedDocs,
            needsManualResolution: true
          };
      }

      // Delete conflicted revisions
      const deletions = doc._conflicts.map(rev => ({
        _id: docId,
        _rev: rev,
        _deleted: true
      }));

      await db.bulkDocs(deletions);

      // Update the winning document
      const updatedDoc = {
        ...winningDoc,
        _id: docId,
        _rev: doc._rev,
        conflict_resolved_at: new Date().toISOString()
      };

      const result = await db.put(updatedDoc);
      console.log(`Conflict resolved for ${dbName}/${docId}`);
      
      return result;
    } catch (error) {
      console.error(`Error resolving conflicts for ${dbName}/${docId}:`, error);
      throw error;
    }
  }

  // Custom merge logic for documents
  mergeDocuments(winner, conflicts) {
    // Basic merge strategy - you can customize this
    const merged = { ...winner };
    
    conflicts.forEach(conflict => {
      // Merge numeric fields by taking the sum
      Object.keys(conflict).forEach(key => {
        if (typeof conflict[key] === 'number' && typeof merged[key] === 'number') {
          if (key === 'quantity' || key === 'stock_quantity') {
            // For inventory, take the latest update
            const winnerTime = new Date(merged.updated_at || merged.created_at || 0);
            const conflictTime = new Date(conflict.updated_at || conflict.created_at || 0);
            if (conflictTime > winnerTime) {
              merged[key] = conflict[key];
            }
          }
        }
      });
    });

    return merged;
  }

  // Cleanup old documents (optional - for performance)
  async cleanup(dbName, olderThanDays = 30) {
    const db = this.localDbs[dbName];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    try {
      const result = await db.find({
        selector: {
          created_at: { $lt: cutoffDate.toISOString() }
        }
      });

      const docsToDelete = result.docs.map(doc => ({
        ...doc,
        _deleted: true
      }));

      if (docsToDelete.length > 0) {
        await db.bulkDocs(docsToDelete);
        console.log(`Cleaned up ${docsToDelete.length} old documents from ${dbName}`);
      }
    } catch (error) {
      console.error(`Cleanup error for ${dbName}:`, error);
    }
  }
}

// Create singleton instance (only in browser)
if (typeof window !== 'undefined' && !dbManager) {
  dbManager = new DatabaseManager();
}

// Export the manager and convenience functions
// Export functions with null checks for SSR compatibility
export default dbManager;

export const getLocalDb = (dbName) => {
  if (!dbManager || !dbManager.initialized) return null;
  return dbManager.getLocalDb(dbName);
};

export const getRemoteDb = (dbName) => {
  if (!dbManager) return null;
  return dbManager.getRemoteDb(dbName);
};

export const startSync = () => {
  if (!dbManager) return;
  return dbManager.startSync();
};

export const stopSync = () => {
  if (!dbManager) return;
  return dbManager.stopSync();
};

export const manualSync = (dbName) => {
  if (!dbManager) return Promise.resolve();
  return dbManager.manualSync(dbName);
};

export const getSyncStatus = () => {
  if (!dbManager) return { isOnline: false, activeSyncs: [], databases: [] };
  return dbManager.getSyncStatus();
};

export const resolveConflicts = (dbName, docId, strategy) => {
  if (!dbManager) return Promise.resolve();
  return dbManager.resolveConflicts(dbName, docId, strategy);
};

// Utility function to generate document IDs
export const generateId = (prefix = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
};

// Utility function to add timestamps
export const addTimestamps = (doc, isUpdate = false) => {
  const now = new Date().toISOString();
  
  if (!isUpdate) {
    doc.created_at = now;
  }
  
  doc.updated_at = now;
  return doc;
};
