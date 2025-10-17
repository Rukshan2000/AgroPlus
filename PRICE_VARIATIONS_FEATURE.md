# Product Price Variations Feature

## Overview
This feature allows products to have multiple price variations (e.g., Urea 50kg Bag can have different prices like 10 LKR and 20 LKR per kg, or different pack sizes).

## Database Changes

### New Table: `product_price_variations`
Created via migration: `scripts/sql/016_add_price_variations.sql`

**Columns:**
- `id` - Primary key
- `product_id` - Foreign key to products table
- `variant_name` - Name of the variation (e.g., "10 LKR per kg", "Small Pack")
- `price` - Price for this variation
- `buying_price` - Optional buying price for this variation
- `is_default` - Whether this is the default price variation
- `is_active` - Whether this variation is currently available
- `stock_quantity` - Optional separate stock tracking per variation
- `sku_suffix` - Optional suffix to add to main product SKU
- `description` - Additional details about the variation
- `sort_order` - Custom ordering of variations
- `created_at`, `updated_at`, `created_by` - Audit fields

**Indexes:**
- `idx_product_price_variations_product_id` - For efficient product lookups
- `idx_product_price_variations_is_active` - For active variations
- `idx_product_price_variations_is_default` - For default variations
- `idx_one_default_per_product` - Ensures only one default per product

## Backend Changes

### 1. Model Layer (`models/priceVariationModel.js`)
New model with the following functions:

- `findPriceVariationsByProductId(productId)` - Get all variations for a product
- `findPriceVariationById(id)` - Get a specific variation
- `createPriceVariation({...})` - Create a new variation
- `updatePriceVariation(id, updates)` - Update a variation
- `deletePriceVariation(id)` - Delete a variation
- `getDefaultPriceVariation(productId)` - Get the default variation
- `getActivePriceVariations(productId)` - Get all active variations
- `bulkCreatePriceVariations(productId, variations, createdBy)` - Bulk create variations
- `updatePriceVariationStock(id, quantityChange)` - Update stock for a variation

### 2. Controller Layer (`controllers/priceVariationController.js`)
New controller with the following endpoints:

- `listByProduct(request, productId)` - List all variations for a product
- `getById(request, variationId)` - Get a specific variation
- `create(request, productId)` - Create a new variation
- `bulkCreate(request, productId)` - Bulk create variations
- `update(request, variationId)` - Update a variation
- `remove(request, variationId)` - Delete a variation
- `getDefault(request, productId)` - Get default variation
- `getActive(request, productId)` - Get active variations

**Validation:**
Uses Zod schema for validation with fields:
- variant_name (required, 1-255 chars)
- price (required, >= 0)
- buying_price (optional, >= 0)
- is_default (boolean)
- is_active (boolean)
- stock_quantity (optional, >= 0)
- sku_suffix (optional, max 50 chars)
- description (optional)
- sort_order (optional, >= 0)

### 3. API Routes
Created the following API endpoints:

**`/api/products/[id]/price-variations`**
- `GET` - List all variations for a product
- `POST` - Create a new variation
- `POST?bulk=true` - Bulk create variations

**`/api/products/[id]/price-variations/[variationId]`**
- `GET` - Get a specific variation
- `PUT` - Update a variation
- `DELETE` - Delete a variation

**`/api/products/[id]/price-variations/default`**
- `GET` - Get the default variation for a product

**`/api/products/[id]/price-variations/active`**
- `GET` - Get all active variations for a product

**Authentication & Authorization:**
- List/View: All authenticated users (admin, manager, user, cashier)
- Create/Update/Delete: Only admin and manager roles
- CSRF protection enabled for all write operations

## Frontend Changes

### 1. Product Management UI (`components/add-product-modal.jsx`)

**New Features:**
- Price Variations section added to the product form
- Display existing variations with:
  - Variant name
  - Price and buying price
  - Default badge
  - Remove button
  - Set Default button
- Add new variation form with:
  - Variant name input
  - Price input
  - Buying price input (optional)
  - Set as default checkbox
  - Add button

**Functionality:**
- Fetches existing variations when editing a product
- Allows adding multiple variations before saving
- Can set one variation as default
- When saving product, deletes old variations and creates new ones
- Validates variation data before submission

### 2. POS System Updates

**New Component: `components/pos/price-variation-modal.jsx`**
- Modal dialog for selecting price variations
- Shows all active variations for a product
- Displays:
  - Variant name
  - Price (large and prominent)
  - Description (if available)
  - Stock quantity (if tracked separately)
  - Default badge
  - Visual selection indicator
- Pre-selects default variation if available
- Allows selecting and confirming variation choice

**POS Page Updates (`app/(app)/pos/page.jsx`):**
- Added state for price variation modal
- Modified `addToCart()` to check for price variations first
- If variations exist, shows modal for selection
- New `addProductToCart()` function handles adding with or without variation
- Cart items now track:
  - `variationId` - ID of selected variation
  - `variationName` - Name of selected variation
- Cart distinguishes between same product with different variations
- Toast notifications show variation name when added

**Cart Item Display (`components/pos/CartItem.jsx`):**
- Shows variation name as a badge below product name
- Helps identify which variation was selected

## Usage Examples

### 1. Adding Price Variations to a Product

**Scenario:** Urea 50kg Bag with different price points

1. Go to Products page
2. Edit the "Urea 50kg Bag" product
3. Scroll to "Price Variations" section
4. Add variations:
   - Variant: "10 LKR per kg" | Price: 10.00 | Set as Default
   - Variant: "20 LKR per kg" | Price: 20.00
   - Variant: "Bulk 50kg" | Price: 450.00
5. Click "Update Product"

### 2. Selling Products with Variations in POS

**Scenario:** Selling Urea with price selection

1. Go to POS System
2. Enter product ID or scan barcode for "Urea 50kg Bag"
3. Price Variation Modal appears automatically
4. Select desired variation (e.g., "10 LKR per kg")
5. Click "Select & Continue"
6. Product is added to cart with selected price
7. Cart shows: "Urea 50kg Bag (10 LKR per kg)"

### 3. Products Without Variations

Products without price variations work as before:
- No modal appears in POS
- Uses the default product price
- Normal checkout flow

## API Usage Examples

### Get all variations for a product
```javascript
GET /api/products/123/price-variations

Response:
{
  "variations": [
    {
      "id": 1,
      "product_id": 123,
      "variant_name": "10 LKR per kg",
      "price": 10.00,
      "buying_price": 8.00,
      "is_default": true,
      "is_active": true,
      "stock_quantity": 0,
      "created_at": "2025-10-17T...",
      "created_by_name": "Admin User"
    }
  ]
}
```

### Create a variation
```javascript
POST /api/products/123/price-variations
Headers: { "x-csrf-token": "..." }
Body: {
  "variant_name": "20 LKR per kg",
  "price": 20.00,
  "buying_price": 18.00,
  "is_default": false,
  "is_active": true
}

Response:
{
  "variation": { ... },
  "message": "Price variation created successfully"
}
```

### Bulk create variations
```javascript
POST /api/products/123/price-variations?bulk=true
Headers: { "x-csrf-token": "..." }
Body: {
  "variations": [
    {
      "variant_name": "Small Pack",
      "price": 5.00,
      "is_default": true
    },
    {
      "variant_name": "Large Pack",
      "price": 15.00
    }
  ]
}
```

## Migration Instructions

### Apply the Database Migration

```bash
# PostgreSQL
psql -U postgres -d saas -f scripts/sql/016_add_price_variations.sql

# Or using npm script (if configured)
npm run migrate
```

### Verify Migration

```sql
-- Check if table exists
SELECT * FROM product_price_variations LIMIT 1;

-- Check indexes
\d product_price_variations
```

## Benefits

1. **Flexible Pricing:** Support multiple price points for the same product
2. **Clear Selection:** POS users can easily see and select price options
3. **Better Tracking:** Track which variations are popular
4. **Stock Management:** Optional separate stock tracking per variation
5. **User Experience:** Intuitive UI in both product management and POS
6. **Backward Compatible:** Products without variations work as before

## Future Enhancements

Potential improvements for future versions:

1. **Separate Stock Tracking:** Fully implement stock management per variation
2. **Variation Images:** Add images specific to each variation
3. **Bulk Pricing Rules:** Automatic variation generation based on rules
4. **Sales Reports:** Analytics on which variations sell best
5. **Discount Support:** Apply discounts to specific variations
6. **Quick Selection:** Keyboard shortcuts for common variations in POS
7. **Variation History:** Track price changes over time
8. **Import/Export:** Bulk import variations via CSV

## Technical Notes

- Uses PostgreSQL decimal type for precise price handling
- Implements unique constraint ensuring only one default per product
- All API endpoints are role-based access controlled
- Frontend uses optimistic UI updates for better UX
- Modal auto-selects default variation for faster checkout
- Cart properly distinguishes between same product with different variations

## Testing Checklist

- [ ] Create product with variations
- [ ] Edit product and modify variations
- [ ] Set different variations as default
- [ ] Delete variations
- [ ] Add product with variations to POS cart
- [ ] Select different variations in POS
- [ ] Complete sale with varied products
- [ ] Verify cart shows variation names
- [ ] Test with products without variations
- [ ] Check role-based access (cashier cannot create variations)
- [ ] Verify database constraints (only one default per product)
- [ ] Test bulk creation of variations

## Support

For issues or questions, please refer to:
- Database schema: `scripts/sql/016_add_price_variations.sql`
- Backend model: `models/priceVariationModel.js`
- API controller: `controllers/priceVariationController.js`
- UI components: `components/add-product-modal.jsx`, `components/pos/price-variation-modal.jsx`
