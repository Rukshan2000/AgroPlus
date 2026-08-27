# Outlet Sales Tracking Implementation

## Overview
Added outlet tracking to the sales table to identify which outlet each sale was made from. This enables accurate reporting, analytics, and inventory management per outlet.

## Database Changes

### Migration File
**File**: `scripts/sql/add-outlet-id-to-sales.sql`

**Changes Made**:
- Added `outlet_id` column to the `sales` table with foreign key reference to `outlets(id)`
- Created index `idx_sales_outlet_id` on the new `outlet_id` column for query performance
- Created composite index `idx_sales_outlet_date` on `(outlet_id, sale_date)` for efficient filtering by outlet and date range
- Column allows NULL values (sales before outlet tracking was added)

**SQL**:
```sql
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS outlet_id INTEGER REFERENCES outlets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_outlet_id ON sales(outlet_id);
CREATE INDEX IF NOT EXISTS idx_sales_outlet_date ON sales(outlet_id, sale_date);
```

**Status**: ✅ Applied to database

## Backend Changes

### 1. Sales Model
**File**: `models/salesModel.js`

**Updated `createSale` function**:
- Added `outlet_id` parameter with default value `null`
- Updated INSERT statement to include `outlet_id` in the column list
- Updated VALUES clause to accept outlet_id parameter ($17)

**Function Signature**:
```javascript
export async function createSale({
  product_id,
  product_name,
  quantity,
  unit_price,
  original_price,
  discount_percentage = 0,
  discount_amount = 0,
  total_amount,
  payment_method = 'cash',
  amount_paid,
  change_given = 0,
  created_by,
  outlet_id = null  // NEW
})
```

### 2. Sales API Route
**File**: `app/api/sales/route.js`

**Updated POST endpoint**:
- Extracts `outlet_id` from request body with default value `null`
- Passes `outlet_id` to `createSale` function when creating each sale record

**Changes**:
```javascript
const { 
  items, 
  subtotal, 
  total, 
  bill_discount_percentage = 0, 
  bill_discount_amount = 0,
  payment_method = 'cash', 
  amount_paid, 
  change_given = 0,
  outlet_id = null  // NEW
} = body

// When calling createSale:
const sale = await createSale({
  // ... other parameters ...
  created_by: session.user.id,
  outlet_id  // NEW
})
```

## Frontend Changes

### POS System Integration
**File**: `app/(app)/pos/page.jsx`

**Updated `processSale` function**:
- Retrieves `selectedOutlet` from localStorage before building sale data
- Includes `outlet_id` in the request payload sent to `/api/sales` API endpoint
- Converts outlet_id to integer for database storage

**Changes**:
```javascript
const handleCompleteTransaction = async (payment) => {
  setIsLoading(true)
  try {
    const outletId = localStorage.getItem('selectedOutlet')  // NEW
    const saleData = {
      items: cart.map(item => ({ /* ... */ })),
      subtotal,
      bill_discount_percentage: billDiscountPercent,
      bill_discount_amount: billDiscountAmount,
      total,
      payment_method: payment.method,
      amount_paid: payment.amount_paid,
      change_given: payment.change,
      cashier_id: session?.user?.id,
      cashier_name: session?.user?.name,
      outlet_id: outletId ? parseInt(outletId) : null  // NEW
    }

    const response = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    })
    // ... rest of the code ...
  }
}
```

## Data Flow

```
POS Page (outlet selected in localStorage)
  ↓
Extract outlet_id from localStorage
  ↓
Build saleData with outlet_id
  ↓
POST to /api/sales endpoint
  ↓
Sales API receives outlet_id
  ↓
createSale function receives outlet_id
  ↓
INSERT into sales table with outlet_id
  ↓
Database stores outlet tracking for the sale
```

## Usage Examples

### Scenario 1: Sale Made at Outlet #3
1. User logs in and selects Outlet #3 (stored in localStorage)
2. User adds products to cart in POS
3. User completes payment
4. The sale is recorded with `outlet_id = 3` in the database
5. Sale tracking shows: "Sold at Outlet #3"

### Scenario 2: Sales Reporting by Outlet
Once outlet_id is tracked, future queries can:
- Get all sales from a specific outlet: `WHERE outlet_id = 3`
- Compare sales between outlets
- Calculate outlet-specific revenue
- Track outlet performance metrics

### Scenario 3: Backward Compatibility
- Existing sales in the database have `outlet_id = NULL`
- New sales will have proper `outlet_id` values
- Reporting tools can filter out NULL values or treat them separately

## Next Steps (Optional Enhancements)

1. **Sales Reporting Page**: Create a dashboard to view sales by outlet
2. **Outlet Revenue Analysis**: Compare revenue across different outlets
3. **Outlet-Specific Reports**: Generate reports filtered by outlet
4. **Data Migration**: Update existing sales with outlet_id if needed
5. **API Filtering**: Add query parameter to GET /api/sales to filter by outlet_id

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] POS system captures outlet_id from localStorage
- [ ] New sales are recorded with correct outlet_id in database
- [ ] NULL values handled properly for historical sales
- [ ] API endpoint accepts and processes outlet_id
- [ ] No errors when outlet_id is null
- [ ] Sales reports can filter by outlet_id

## Summary

The outlet sales tracking feature is now fully integrated:
- ✅ Database schema updated with `outlet_id` column and indexes
- ✅ Sales model and API updated to handle `outlet_id`
- ✅ POS system configured to send `outlet_id` with sales
- ✅ Backward compatible with existing sales (NULL values allowed)
- ✅ Ready for outlet-based sales analytics and reporting
