# Product CSV Import/Export Feature with Price Variations

## Overview
This feature allows users to bulk import and export products using CSV files, including support for price variations. It also includes bulk delete functionality for managing multiple products at once.

## Features Implemented

### 1. CSV Export
- Export all products to CSV format
- Includes all product fields (name, description, SKU, category, prices, stock, etc.)
- **Price variations are included in separate, easy-to-understand columns** (variant_1_name, variant_1_price, etc.)
- Supports up to 5 price variations per product
- One-click download with automatic filename generation

### 2. CSV Import
- Bulk upload products from CSV file
- Validates all fields before import
- **Simple column format for price variations** - no JSON required!
- Provides detailed error reporting for failed imports
- Checks for duplicate SKUs
- Automatically creates price variations during import

### 3. CSV Template Download
- Pre-formatted template with example data
- **Includes examples with multiple price variations**
- Shows proper format for all fields in an easy-to-understand format

### 4. Bulk Delete
- Select multiple products using checkboxes
- Delete selected products in one action
- Select all products with one click
- Visual counter showing number of selected products
- Confirmation dialog before deletion
- Detailed success/failure reporting

## How to Use

### Exporting Products

1. Navigate to the Products page
2. Click the **"Export CSV"** button
3. A CSV file will be downloaded with all products and their price variations
4. The file includes:
   - All product details
   - Price variations in separate columns (easy to read and edit)

### Importing Products

1. Click **"CSV Template"** to download a sample file
2. Fill in your product data following the template format
3. For products with price variations:
   - Fill in columns like `variant_1_name`, `variant_1_price`, `variant_1_buying_price`, etc.
   - You can add up to 5 variations per product
   - Mark one variant as default by putting "yes" in `variant_X_is_default` column
   - Leave columns empty for products without variations
4. Click **"Import CSV"** and select your file
5. Review the import results

### Bulk Delete Products

1. Navigate to the Products page
2. Check the boxes next to products you want to delete
3. Or click the checkbox in the header to select all products
4. Click the **"Delete (X)"** button that appears
5. Confirm the deletion
6. Selected products will be removed

## CSV Format

### Required Columns
- `name` - Product name (required)
- `selling_price` or `price` - Selling price (required)

### Optional Columns
- `description` - Product description
- `sku` - Stock Keeping Unit (must be unique)
- `category` - Product category
- `buying_price` - Cost price
- `stock_quantity` - Initial stock quantity
- `unit_type` - Unit of measurement (kg, g, l, ml, items, pcs, bags, bottles, packets)
- `unit_value` - Unit value (e.g., 1.0, 0.5, 2.0)
- `minimum_quantity` - Minimum stock alert level
- `alert_before_days` - Days before expiry to alert
- `expiry_date` - Product expiry date
- `manufacture_date` - Manufacturing date
- `is_active` - Active status (true/false)
- `image_url` - Product image URL

### Price Variation Columns (Repeat for variants 1-5)

For each variation (up to 5), you can fill in these columns:

- `variant_1_name` - Name of the first variation (e.g., "Small (500g)")
- `variant_1_price` - Selling price for this variation
- `variant_1_buying_price` - Cost price for this variation
- `variant_1_stock` - Stock quantity for this variation
- `variant_1_sku_suffix` - SKU suffix (e.g., "SM", "500G")
- `variant_1_is_default` - Mark as default? (yes/no or true/false)

Repeat the same pattern for `variant_2_*`, `variant_3_*`, `variant_4_*`, and `variant_5_*`

### Example CSV Row (with variations)

```
name,sku,price,variant_1_name,variant_1_price,variant_1_buying_price,variant_1_is_default,variant_2_name,variant_2_price
Rice - Basmati,RICE-001,150,Small (500g),75,50,yes,Medium (1kg),150
```

### Example CSV Row (without variations)

```
name,sku,price,variant_1_name,variant_1_price
Coconut Oil,OIL-001,250,,,
```

## Technical Implementation

### Files Modified

1. **models/productModel.js**
   - Added `bulkCreateProducts()` - Handles bulk product creation with variations
   - Added `bulkDeleteProducts()` - Handles bulk product deletion
   - Updated `getAllProductsForExport()` - Fetches products with price variations
   - Imports `bulkCreatePriceVariations` from priceVariationModel

2. **controllers/productController.js**
   - Added `importCsv()` - Handles CSV import with flat column parsing
   - Added `exportCsv()` - Exports products with variations in separate columns
   - Added `bulkDelete()` - Handles bulk deletion with validation
   - Parses flat variation columns (variant_1_name, etc.) during import

3. **app/api/products/import/route.js**
   - POST endpoint for CSV import

4. **app/api/products/export/route.js**
   - GET endpoint for CSV export

5. **app/api/products/bulk-delete/route.js** (New)
   - POST endpoint for bulk deletion

6. **components/products-table.jsx**
   - Added CSV import/export UI buttons
   - Added bulk selection checkboxes
   - Added "Select All" functionality
   - Added bulk delete button with counter
   - Added file upload handler with Papa Parse
   - Template download with easy-to-understand format
   - Toast notifications for success/error feedback

### Dependencies
- `papaparse` - CSV parsing and generation library

## API Endpoints

### Export Products
```
GET /api/products/export
```
**Response:**
```json
{
  "products": [
    {
      "name": "Product Name",
      "sku": "PROD-001",
      "variant_1_name": "Small",
      "variant_1_price": "75",
      "variant_2_name": "Large",
      "variant_2_price": "150",
      ...
    }
  ]
}
```

### Import Products
```
POST /api/products/import
Headers:
  Content-Type: application/json
  X-CSRF-Token: <token>

Body:
{
  "products": [
    {
      "name": "Product Name",
      "price": 150,
      "variant_1_name": "Small",
      "variant_1_price": "75",
      ...
    }
  ]
}
```

**Response:**
```json
{
  "message": "Successfully imported X products",
  "successCount": 5,
  "failedCount": 0,
  "failed": [],
  "success": [...]
}
```

### Bulk Delete Products
```
POST /api/products/bulk-delete
Headers:
  Content-Type: application/json
  X-CSRF-Token: <token>

Body:
{
  "product_ids": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
{
  "message": "Successfully deleted X products",
  "deletedCount": 5,
  "failedCount": 0,
  "deleted": [1, 2, 3, 4, 5],
  "failed": []
}
```

## Error Handling

### Import Validation
- Validates all required fields
- Checks for duplicate SKUs
- Validates price variation column format
- Provides row-by-row error details
- Shows validation errors in console

### Export
- Handles missing price variations gracefully
- Converts all data to proper CSV format
- Downloads file with timestamp

### Bulk Delete
- Validates product IDs
- Handles deletion errors individually
- Reports success and failures separately
- Prevents accidental deletion with confirmation

## Security
- CSRF token validation on import and bulk delete
- Role-based access control (Admin/Manager for import & delete, Admin/Manager/User for export)
- SQL injection prevention through parameterized queries
- Input sanitization and validation

## User Permissions

### Import (POST /api/products/import)
- Admin ✅
- Manager ✅
- User ❌
- Cashier ❌

### Export (GET /api/products/export)
- Admin ✅
- Manager ✅
- User ✅
- Cashier ❌

### Bulk Delete (POST /api/products/bulk-delete)
- Admin ✅
- Manager ✅
- User ❌
- Cashier ❌

## Example Workflow

### Import Products with Variations
1. **Download the template** to see the correct format
2. **Fill in basic product info** (name, SKU, category, etc.)
3. **Add variations** by filling in variant_1_name, variant_1_price, variant_2_name, etc.
4. **Mark one as default** by putting "yes" in the variant_X_is_default column
5. **Import the CSV**
6. **Review results** - success and failed imports are reported

### Export and Edit
1. **Export existing products** to get current data
2. **Edit in spreadsheet software** (Excel, Google Sheets, LibreOffice)
3. **Modify prices or variations** as needed
4. **Import back** to update

### Bulk Delete
1. **Filter products** if needed (by category, status, search)
2. **Select products** using checkboxes or "Select All"
3. **Click Delete button** showing count of selected items
4. **Confirm deletion**
5. **Products removed** from the system

## Tips for Success

1. ✅ Always download and review the template first
2. ✅ Use a spreadsheet program (Excel, Google Sheets) to edit the CSV
3. ✅ Leave variation columns empty for products without variations
4. ✅ Mark only ONE variation as default (is_default = "yes")
5. ✅ Test with a small batch first
6. ✅ Check the browser console for detailed error messages
7. ✅ Keep SKUs unique across all products
8. ✅ Use meaningful variation names (e.g., "Small (500g)", "Large (1kg)")
9. ✅ Confirm bulk delete actions carefully - they cannot be undone
10. ✅ Use filters before bulk delete to ensure you're deleting the right products

## Advantages of New Format

### Previous Format (JSON)
❌ Required technical knowledge
❌ Difficult to edit in Excel/Sheets
❌ Easy to make syntax errors
❌ Not user-friendly

### New Format (Flat Columns)
✅ No technical knowledge required
✅ Easy to edit in any spreadsheet software
✅ Clear column headers
✅ Simple yes/no values
✅ Professional and user-friendly

## Future Enhancements (Potential)

- Support for importing product images via URLs
- Batch update (update existing products instead of only creating new ones)
- Excel (.xlsx) format support
- Background processing for large imports
- Import history and rollback functionality
- CSV validation before upload
- Bulk edit functionality (modify multiple products at once)
- Export with filters (only selected categories, etc.)
