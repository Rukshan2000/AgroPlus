# Outlet-Specific Quantity Display in POS

## Changes Made

### 1. Updated API Endpoint
**File**: `app/api/products/distributed/route.js`

The endpoint now:
- Aggregates total distributed quantity per product to each outlet
- Overrides the `available_quantity` field with outlet-specific quantity
- Returns both:
  - `available_quantity` - Outlet-specific distributed qty
  - `total_available_quantity` - Total warehouse qty (for reference)
  - `outlet_distributed_quantity` - Explicit outlet qty

**Example Response**:
```json
{
  "id": 1,
  "name": "Product A",
  "sku": "SKU001",
  "price": 100,
  "available_quantity": 50,           // OUTLET STOCK
  "total_available_quantity": 1000,   // WAREHOUSE TOTAL
  "outlet_distributed_quantity": 50   // EXPLICIT OUTLET QTY
}
```

### 2. POS UI Updates
**File**: `app/(app)/pos/page.jsx`

#### Product Preview Label
- Changed from: "Stock: X"
- Changed to: "Outlet Stock: X"

#### Product Grid Display
- Shows outlet-specific quantities in stock badges
- Color coding based on outlet stock level:
  - Green: > 10 units
  - Yellow: 1-10 units
  - Red: 0 units

#### New Info Banner
- Displays at top of product grid
- Shows current outlet name
- Reminds users they're viewing outlet-specific stock
- Green styling for clarity

**Banner Text**: 
"Outlet Stock: Showing quantities distributed to [Outlet Name]"

### 3. Stock Validation
All stock checks now validate against outlet-specific quantities:
- Adding to cart
- Cart quantity updates
- Stock status display
- Insufficient stock warnings

## How It Works

```
User Login
    ↓
Select Outlet (stored in localStorage)
    ↓
POS Page Loads → Gets outlet ID
    ↓
loadProducts(outletId)
    ↓
GET /api/products/distributed?outlet_id=1
    ↓
Query product_distribute table:
- Find all distributions for outlet
- Sum quantities by product_id
- Fetch product details
- Override available_quantity
    ↓
POS displays products with outlet stock only
```

## Display Examples

### Before
```
Stock: 1000 units (Total warehouse stock)
```

### After
```
Outlet Stock: 50 units (Distributed to this outlet)
```

## Features

✅ Shows only outlet-distributed quantities
✅ Prevents overselling beyond what's distributed
✅ Clear visual indication of outlet stock
✅ Info banner reminds users of outlet context
✅ Color-coded stock levels
✅ Maintains total quantity reference
✅ Works with all POS features

## Stock Validation Examples

| Scenario | Total Qty | Distributed | Result |
|----------|-----------|-------------|--------|
| Plenty available | 1000 | 50 | Show 50, can add up to 50 |
| Low at outlet | 1000 | 5 | Show 5, yellow badge, limit to 5 |
| Out at outlet | 1000 | 0 | Show 0, red badge, cannot add |
| No distribution | 1000 | Not distributed | Hidden from POS |

## User Experience

1. **Product Card**: Shows "50" units (outlet stock)
2. **Search/Preview**: Shows "Outlet Stock: 50"
3. **Info Banner**: Reminds "Showing quantities for [Outlet]"
4. **Stock Check**: Validates against 50 units, not 1000
5. **Error Messages**: "Only 50 units available at this outlet"

## Configuration

No additional setup needed. The system automatically:
- Detects outlet from localStorage
- Fetches distributed quantities
- Applies outlet-specific validation
