# 📱 Offline Behavior: CouchDB & PouchDB Integration Explained

## Overview

Your AgroPlus POS system uses a **PouchDB (browser) + CouchDB (server)** architecture for enterprise-grade offline-first functionality. Here's what happens when your device goes offline:

---

## 🔌 When Device Goes Offline

### **Immediate Response (Detection)**

```javascript
// Browser detects connection loss
window.addEventListener('offline', () => {
  this.isOnline = false;
  this.stopSync();  // Stops attempting to sync with CouchDB
});
```

The system automatically detects when internet connectivity is lost through browser's native `offline` event.

---

## 💾 Data Storage During Offline

### **Local Storage Layer**

When offline, ALL data operations use **IndexedDB** (a browser-based database):

```
┌─────────────────────────────────────┐
│     User Actions (No Internet)      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PouchDB (Client-Side Database)     │
│  - agroplus_products                │
│  - agroplus_sales                   │
│  - agroplus_categories              │
│  - agroplus_users                   │
│  - agroplus_inventory               │
│  - agroplus_settings                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  IndexedDB (Browser Local Storage)  │
│  - Persistent across sessions       │
│  - No internet needed               │
│  - Survives browser restart         │
└─────────────────────────────────────┘
```

### **Databases & What They Store**

| Database | Purpose | Offline Behavior |
|----------|---------|------------------|
| `agroplus_products` | Product catalog | Fully functional locally |
| `agroplus_sales` | Transaction records | Saves locally, queued for sync |
| `agroplus_categories` | Product categories | Available offline |
| `agroplus_users` | User management | User data cached |
| `agroplus_inventory` | Stock levels | Updated locally |
| `agroplus_settings` | App configuration | Used from local cache |

---

## 🛒 Example: Making a Sale Offline

### **Step-by-Step Process**

```javascript
// When user creates a sale while offline:

1. User selects products and confirms sale
   ↓
2. Sales transaction is created with unique ID
   const sale = {
     _id: generateId('sale_123'),
     type: 'sale',
     items: [...],
     total_amount: 500,
     payment_method: 'cash',
     created_at: timestamp
   }
   ↓
3. Data saved to LOCAL PouchDB (NOT CouchDB yet)
   await offlineSalesModel.create(saleData)
   ↓
4. Success response returned to user
   - Sale appears in POS system immediately ✅
   - No network call needed
   - Data persists even if browser closes
   ↓
5. Sale marked as "PENDING SYNC"
   - Waiting for internet connection
   - Queued for upload to CouchDB
```

### **What the User Sees**

```
OFFLINE MODE ACTIVE 🔴
┌─────────────────────┐
│ ✅ Sale Created     │
│ Amount: ₹500        │
│ Status: Pending     │
│         Sync        │
│ No internet needed! │
└─────────────────────┘
```

---

## 🔄 When Connection Returns (Back Online)

### **Auto-Detection & Sync**

```javascript
// Browser detects connection restored
window.addEventListener('online', () => {
  this.isOnline = true;
  this.startSync();  // Initiates synchronization
});
```

### **Synchronization Process**

```
┌─────────────────────────────────────────┐
│  Internet Connection Restored! 🟢       │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  1. UPLOAD PHASE                        │
│  Local → CouchDB Server                 │
│  - All pending sales transactions       │
│  - Product updates/edits                │
│  - Category changes                     │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  2. DOWNLOAD PHASE                      │
│  CouchDB Server → Local                 │
│  - New products from other branches     │
│  - Updated prices/categories            │
│  - Sales from other devices             │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  3. CONFLICT RESOLUTION                 │
│  If same doc modified both sides:       │
│  - Automatic merge when possible        │
│  - Alert user if manual intervention    │
│    needed                               │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  4. SYNC COMPLETE ✅                    │
│  Databases are now in sync              │
│  All pending changes uploaded           │
└─────────────────────────────────────────┘
```

### **Sync Code Example**

```javascript
// Manual sync for a database
async manualSync(dbName) {
  const localDb = this.localDbs[dbName];
  const remoteDb = this.remoteDbs[dbName];

  try {
    const result = await localDb.sync(remoteDb, {
      live: true,        // Continuous sync
      retry: true,       // Automatic retry on failure
      heartbeat: 10000,  // Check connection every 10s
      timeout: 30000     // 30s timeout
    });
    
    console.log(`Sync completed for ${dbName}:`, result);
    return result;
  } catch (error) {
    console.error(`Sync failed for ${dbName}:`, error);
    throw error;
  }
}
```

---

## ⚡ Key Features During Offline/Online Transitions

### **1. Automatic Online Detection**

```javascript
constructor() {
  // Detect current state
  this.isOnline = navigator.onLine;
  
  // Listen for changes
  window.addEventListener('online', () => {
    this.isOnline = true;
    this.startSync();  // Auto-sync when back online
  });
  
  window.addEventListener('offline', () => {
    this.isOnline = false;
    this.stopSync();   // Stop trying to reach server
  });
}
```

### **2. Smart Sync Handling**

- **Queue Management**: Tracks all changes made offline
- **Batch Operations**: Uploads multiple changes efficiently
- **Retry Logic**: Automatically retries failed syncs
- **Conflict Detection**: Identifies documents modified on both sides

### **3. No Data Loss**

```javascript
// All data saved locally in IndexedDB
// Survives:
✅ Browser close/restart
✅ Network disconnection
✅ Power loss
✅ Device crash
❌ Only lost if user clears browser data
```

---

## 🎯 Real-World Scenarios

### **Scenario 1: Extended Offline Period**

```
DAY 1 (Online) - Sync successful
  ↓
DAY 2-5 (No Internet) - Making 200+ sales
  ├─ All sales stored locally ✅
  ├─ Full POS functionality ✅
  └─ No data loss ✅
  ↓
DAY 6 (Back Online) - Auto-sync triggered
  ├─ 200 sales upload to CouchDB 🔄
  ├─ Updates from server download 🔄
  └─ Sync completes ✅
```

### **Scenario 2: Multi-Device Sync**

```
DEVICE A (Store 1)          DEVICE B (Store 2)
    │                              │
    └──────(Both Online)──────────┘
         Both sync with CouchDB
         Data stays consistent ✅
    
When Device A makes a sale:
    CouchDB Updated → Device B gets update ✅

When Device B edits product price:
    CouchDB Updated → Device A gets update ✅
```

### **Scenario 3: Conflict Scenario**

```
Scenario: Same product edited while offline
                    │
         ┌──────────┴──────────┐
         │                     │
      Device A             Device B
    (Price: ₹100)         (Price: ₹120)
         │                     │
      Offline                Offline
         │                     │
      Both edit              Both edit
      price                  quantity
         │                     │
      Back Online            Back Online
         │                     │
      Both sync to CouchDB
         │
    Smart Resolution:
    ✅ Both changes merged if possible
    ✅ User alerted if conflict exists
    ✅ Manual resolution available if needed
```

---

## 🔧 Technical Architecture

### **Database Layer Structure**

```javascript
// PouchDB configuration
const DB_CONFIG = {
  products: 'agroplus_products',
  sales: 'agroplus_sales',
  categories: 'agroplus_categories',
  users: 'agroplus_users',
  inventory: 'agroplus_inventory',
  settings: 'agroplus_settings'
};

// IndexedDB Adapter
PouchDB.plugin(PouchDBAdapterIdb);

// Query Support
PouchDB.plugin(PouchDBFind);

// Initialize in browser
this.localDbs[dbName] = new PouchDB(DB_CONFIG[dbName], {
  adapter: 'idb'  // IndexedDB storage
});
```

### **Sync Mechanism**

```javascript
// Continuous bi-directional sync
localDb.sync(remoteDb, {
  live: true,      // Keep syncing
  retry: true,     // Auto-retry failures
  heartbeat: 10000 // Check every 10 seconds
})
.on('change', (info) => {
  // Data changed, update UI
})
.on('paused', (err) => {
  // Sync paused (offline or waiting)
})
.on('active', () => {
  // Sync resumed
})
.on('error', (err) => {
  // Sync error occurred
});
```

---

## 📊 Sync Status & Monitoring

### **Check Sync Status**

```javascript
// In browser console
const status = dbManager.getSyncStatus();
console.log(status);

// Output:
{
  isOnline: true,
  activeSyncs: ['products', 'sales', 'categories'],
  databases: ['products', 'sales', 'categories', 'users', 'inventory', 'settings']
}
```

### **UI Indicators**

```
ONLINE STATUS:
🟢 Online & Syncing
🟡 Online but waiting
🔴 Offline (Local mode)
⚠️ Conflict detected
```

---

## 🛡️ Data Safety Guarantees

### **What's Protected**

| Aspect | Protection |
|--------|-----------|
| **During offline** | All changes saved locally ✅ |
| **On reconnect** | All queued changes synced ✅ |
| **Concurrent edits** | Conflict detection & resolution ✅ |
| **Power loss** | IndexedDB persists data ✅ |
| **Browser restart** | Data survives ✅ |
| **Device sync** | Real-time updates ✅ |

---

## 🚀 Performance Optimization

### **Indexing for Speed**

```javascript
// Automatic indexes created for:

// Products
- name (quick search)
- category_id (filter by category)
- sku (barcode lookup)
- created_at (sort by date)

// Sales
- created_at (timeline)
- cashier_id (user reports)
- total_amount (accounting)
- payment_method (payment tracking)

// Result: Fast queries even with 10,000+ records offline
```

### **Batch Operations**

```javascript
// Instead of:
for (const item of items) {
  await db.put(item);  // ❌ Slow, 100 calls
}

// Use:
await db.bulkDocs(items);  // ✅ Fast, 1 call
```

---

## ❌ What Doesn't Work Offline

| Feature | Offline Status |
|---------|---|
| Real-time features (other users' live actions) | ❌ Queued, syncs when online |
| Reports from other branches | ❌ Only local data visible |
| Customer cloud backups | ❌ Resumes when online |
| Email/SMS notifications | ❌ Queued for sending |

---

## 🔐 Security Notes

```javascript
// CouchDB credentials (from environment)
const COUCHDB_URL = 'http://localhost:5984';
const COUCHDB_USERNAME = 'admin';
const COUCHDB_PASSWORD = 'secure_password';

// Local data is NOT encrypted in IndexedDB
// ⚠️ Risk: Device theft/compromise
// ✅ Mitigation: Use HTTPS in production, enable device encryption
```

---

## 📈 Storage Limits

```javascript
// IndexedDB storage limits vary by browser:
- Chrome/Firefox: ~50MB per site (quota system)
- Safari: ~50MB per site
- Edge: ~50MB per site

// AgroPlus typical usage:
- 1,000 products: ~1MB
- 10,000 sales: ~5MB
- Other data: ~1MB
// Total: ~7MB (plenty of space)
```

---

## 🎯 Testing Offline Functionality

### **Manual Test Steps**

```javascript
// 1. Start with online connection
// 2. Go to /offline-test page
// 3. Run all tests (verify local storage works)
// 4. Disable WiFi/airplane mode
// 5. Create a sale in POS system
// 6. Verify it saves locally ✅
// 7. Reconnect internet
// 8. Verify auto-sync triggers 🔄
// 9. Check CouchDB admin panel ✅
```

### **Debug Commands (Browser Console)**

```javascript
// Check sync status
await dbManager.getSyncStatus();

// Manually trigger sync
await dbManager.manualSync('products');
await dbManager.manualSync('sales');

// View local data
const db = dbManager.getLocalDb('sales');
const allSales = await db.allDocs({include_docs: true});
console.log(allSales);

// Check if online
console.log(navigator.onLine);
```

---

## 🎉 Summary

### **When Offline:**
✅ Full read/write capability  
✅ All data saved locally  
✅ No internet needed  
✅ Complete POS functionality  
✅ No data loss  

### **When Reconnecting:**
✅ Automatic detection  
✅ Background sync starts  
✅ All pending changes uploaded  
✅ Server updates downloaded  
✅ Conflicts resolved  

### **Result:**
🎯 **Bulletproof offline-first system** - Make sales anywhere, sync when connected!
