# Sales API Decimal Quantity Fix

## Problem
The sales API was returning a 500 error with the message:
```
invalid input syntax for type integer: "1.98"
```

This error occurred when trying to process a sale with a decimal quantity (e.g., 1.98 kg, 2.5 liters).

## Root Cause
The `sales` table had the `quantity` column defined as `INTEGER`, which only accepts whole numbers. This prevented the system from handling products sold by weight or volume that require decimal quantities.

## Solution
Created and applied migration `017_fix_sales_quantity_decimal.sql` that:

1. **Changed `sales.quantity` from INTEGER to DECIMAL(10,3)**
   - Now supports quantities like 1.98, 2.5, 0.125, etc.
   - Allows up to 3 decimal places (e.g., 1.125 kg)

2. **Changed `products.sold_quantity` from INTEGER to DECIMAL(10,3)**
   - Ensures accurate tracking of total sold quantities for weight/volume-based products

3. **Changed `products.available_quantity` from INTEGER to DECIMAL(10,3)**
   - Ensures accurate stock tracking for weight/volume-based products

## Migration Applied
```sql
ALTER TABLE sales 
ALTER COLUMN quantity TYPE DECIMAL(10, 3);

ALTER TABLE products 
ALTER COLUMN sold_quantity TYPE DECIMAL(10, 3),
ALTER COLUMN available_quantity TYPE DECIMAL(10, 3);
```

## Verification
After applying the migration:
- `sales.quantity` is now `numeric(10,3)`
- `products.sold_quantity` is now `numeric(10,3)` with default `0.000`
- `products.available_quantity` is now `numeric(10,3)` with default `0.000`

## Impact
- ✅ Sales API now accepts decimal quantities
- ✅ Products can be sold by weight (kg, g) or volume (L, ml)
- ✅ Stock tracking accurately reflects fractional quantities
- ✅ Backward compatible - whole numbers still work (1, 2, 3, etc.)

## Testing
Try creating a sale with decimal quantities:
```json
{
  "items": [
    {
      "product_id": 1,
      "product_name": "Rice",
      "quantity": 1.98,
      "unit_price": 5.00,
      "total_amount": 9.90
    }
  ],
  "subtotal": 9.90,
  "total": 9.90,
  "payment_method": "cash",
  "amount_paid": 10.00,
  "change_given": 0.10
}
```

## Files Modified
1. Created: `scripts/sql/017_fix_sales_quantity_decimal.sql`
2. Database schema updated for `sales` and `products` tables

## Date Fixed
November 2, 2025
