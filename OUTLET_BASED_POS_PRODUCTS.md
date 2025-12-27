# Outlet-Based Product Distribution for POS System

## Overview
Users now see only products that have been distributed to their assigned outlet when using the POS system. The outlet ID is automatically saved in localStorage when they log in.

## Changes Made

### 1. **Outlet Selection on Login** (Already Existing)
- File: `components/outlet-selection-modal.jsx`
- When users with multiple outlets log in, they select their working outlet
- Outlet ID and name are automatically saved to localStorage:
  - `selectedOutlet` - Outlet ID (number)
  - `selectedOutletName` - Outlet name (string)

### 2. **New API Endpoint**
- File: `app/api/products/distributed/route.js` (NEW)
- **Endpoint**: `GET /api/products/distributed`
- **Parameters**:
  - `outlet_id` (required) - The outlet ID
  - `limit` (optional) - Number of products to return (default: 1000)
  - `is_active` (optional) - Filter by active status (default: true)
- **Returns**: Array of products that have been distributed to the specified outlet
- **Authorization**: Requires login (all roles: admin, manager, user, cashier)

### 3. **Updated POS System**
- File: `app/(app)/pos/page.jsx`
- **State Changes**:
  - Added `selectedOutlet` state to track the current outlet
- **Modified Functions**:
  - `loadProducts(outletId)` - Now accepts outlet ID parameter
    - Fetches distributed products if outlet ID is provided
    - Falls back to all products if no outlet is specified
    - Has error handling with fallback mechanism
  - `handleReturnSuccess()` - Now uses outlet ID when reloading products
- **Header Update**:
  - Added outlet name badge in the POS header
  - Shows current outlet with green styling
  - Example: `Point of Sale System Outlet Main Branch`

### 4. **Startup Flow**
When POS page loads:
1. Reads `selectedOutlet` from localStorage
2. Passes it to `loadProducts(outletId)`
3. Fetches only products distributed to that outlet
4. If no outlet is selected, falls back to all active products
5. Displays outlet name in the header

## Database Query Flow

```
User Login → Selects Outlet → Stored in localStorage
                                 ↓
POS Page Load → Reads localStorage → Gets outlet ID
                                 ↓
loadProducts(outletId) → API Call to /api/products/distributed
                                 ↓
Query product_distribute table for distributions to outlet
                                 ↓
Fetch full product details for matched products
                                 ↓
Display products in POS grid
```

## API Response Example

```javascript
GET /api/products/distributed?outlet_id=1&limit=100&is_active=true

Response:
{
  "products": [
    {
      "id": 1,
      "name": "Product A",
      "sku": "SKU001",
      "price": 100,
      "available_quantity": 50,
      "is_active": true,
      ...
    },
    ...
  ],
  "total": 45
}
```

## Features

✅ Users see only products distributed to their outlet
✅ Automatic outlet selection on login
✅ Outlet name displayed in POS header
✅ Fallback to all products if API fails
✅ Seamless product reload after returns
✅ Works with product variations and discounts
✅ All existing POS features unchanged

## Error Handling

- If distributed products endpoint fails, falls back to all active products
- Clear error messages in toast notifications
- Graceful handling of missing outlet ID
- Console logging for debugging

## Notes

- Empty product list if no distributions exist for outlet
- Products must be added to product_distribute table via "Product Distribute" menu
- Works with all user roles
- Outlet badge is green to indicate active outlet selection
