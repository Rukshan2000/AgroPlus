# Outlet Product Update/Validation Logic

## Overview
This document maps the complete flow of outlet product distribution/update logic, including validation, API endpoints, and UI components.

---

## 1. API ENDPOINTS

### Main Product Distribution Endpoint
**File:** [app/api/product-distribute/route.js](app/api/product-distribute/route.js)

Routes all requests to the controller functions:
- `GET` → `list()` - List all distributions
- `POST` → `create()` - Create new distribution
- `PUT` → `update()` - Update existing distribution
- `DELETE` → `remove()` - Delete distribution

#### Query Actions for GET:
- `?action=read` → `read()`
- `?action=byProduct` → `getByProduct()`
- `?action=byOutlet` → `getByOutlet()`
- `?action=stats` → `getStats()`
- `?action=totalByProduct` → `getTotalByProduct()`
- `?action=totalByOutlet` → `getTotalByOutlet()`

### Deduct Distribution Quantity Endpoint
**File:** [app/api/product-distribute/deduct/route.js](app/api/product-distribute/deduct/route.js)

- `POST` - Deduct quantity from a product distribution
- `GET` - Get available quantity for a product at an outlet

**Parameters:**
```json
{
  "product_id": number,
  "outlet_id": number,
  "quantity": number
}
```

---

## 2. VALIDATION SCHEMA (Zod)

**File:** [controllers/productDistributeController.js](controllers/productDistributeController.js) (Lines 21-27)

### Distribution Schema
```javascript
const distributionSchema = z.object({
  product_id: z.number().positive("Product is required"),
  outlet_id: z.number().positive("Outlet is required"),
  quantity_distributed: z.number().min(0, "Quantity must be 0 or greater"),
  notes: z.string().optional().or(z.literal(''))
})

const updateDistributionSchema = distributionSchema.partial()
```

### Validation Rules
| Field | Type | Rules | Error Message |
|-------|------|-------|---------------|
| `product_id` | number | Must be positive (> 0) | "Product is required" |
| `outlet_id` | number | Must be positive (> 0) | "Outlet is required" |
| `quantity_distributed` | number | Must be >= 0 | "Quantity must be 0 or greater" |
| `notes` | string | Optional | N/A |

### Error Handling
When validation fails, Zod errors are caught and returned as:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "number",
      "path": ["product_id"],
      "message": "Product is required"
    }
  ]
}
```

---

## 3. CONTROLLER FUNCTIONS

**File:** [controllers/productDistributeController.js](controllers/productDistributeController.js)

### `create(request)` - POST /api/product-distribute
1. **Authentication Check** - Requires admin or manager role
2. **CSRF Validation** - Validates CSRF token from headers
3. **Parse & Validate** - Uses `distributionSchema.parse(data)`
4. **Product Verification** - Checks if product exists using `findProductById()`
5. **Outlet Verification** - Checks if outlet exists using `findOutletById()`
6. **Create Distribution** - Calls `createDistribution()` model
7. **Error Handling** - Catches `z.ZodError` and returns validation errors

### `update(request)` - PUT /api/product-distribute?id={id}
1. **Authentication Check** - Requires admin or manager role
2. **CSRF Validation** - Validates CSRF token from headers
3. **ID Extraction** - Gets distribution ID from query params
4. **Parse & Validate** - Uses `updateDistributionSchema.parse(data)` (partial schema allows partial updates)
5. **Update Distribution** - Calls `updateDistribution(id, validated)`
6. **Error Handling** - Catches `z.ZodError` and returns validation errors

### `remove(request)` - DELETE /api/product-distribute?id={id}
1. **Authentication Check** - Requires admin or manager role
2. **CSRF Validation** - Validates CSRF token from headers
3. **ID Extraction** - Gets distribution ID from query params
4. **Delete Distribution** - Calls `deleteDistribution(id)`
5. **Error Handling** - Returns 404 if not found

---

## 4. MODAL COMPONENTS

### A. Single Product Distribution Modal
**File:** [components/distribute-product-modal.jsx](components/distribute-product-modal.jsx)

**Features:**
- Create new distribution OR edit existing distribution
- Form validation (Lines 75-79)
- Stock availability check (Lines 88-93)
- POST for create, PUT for update

**Key Code:**
```javascript
// Client-side validation (Lines 75-79)
if (editingDistribution) {
  if (!formData.quantity_distributed) {
    setError("Please enter quantity to distribute")
    return
  }
} else {
  if (!formData.product_id || !formData.outlet_id || !formData.quantity_distributed) {
    setError("Please fill in all required fields")
    return
  }
}

// Stock check (Lines 88-93)
if (selectedProduct && quantity > selectedProduct.available_quantity) {
  setError(`Insufficient stock. Available: ${selectedProduct.available_quantity}...`)
  return
}

// API Request (Lines 94-104)
const method = editingDistribution ? "PUT" : "POST"
const url = editingDistribution 
  ? `/api/product-distribute?id=${editingDistribution.id}`
  : "/api/product-distribute"

const response = await fetch(url, {
  method,
  headers: {
    "Content-Type": "application/json",
    "x-csrf-token": csrfToken,
  },
  body: JSON.stringify({
    product_id: parseInt(formData.product_id),
    outlet_id: parseInt(formData.outlet_id),
    quantity_distributed: parseFloat(formData.quantity_distributed),
    notes: formData.notes || null,
  }),
})
```

**Form Fields:**
- Product (Select dropdown) - Disabled during edit
- Outlet (Select dropdown) - Disabled during edit
- Quantity Distributed (Number input)
- Notes (Textarea) - Optional

### B. Bulk Distribution Modal
**File:** [components/bulk-distribute-modal.jsx](components/bulk-distribute-modal.jsx)

**Features:**
- Select multiple products at once
- Distribute all selected products to a single outlet
- Bulk error tracking and reporting
- Logs validation errors from API

**Key Code (Lines 108-130):**
```javascript
for (const productId of selectedProductIds) {
  const product = products.find(p => p.id === productId)
  if (!product) continue

  try {
    const res = await fetch("/api/product-distribute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({
        product_id: parseInt(productId),
        outlet_id: parseInt(formData.outlet_id),
        quantity_distributed: parseFloat(product.stock_quantity),
        notes: formData.notes.trim() || "",
      }),
    })

    // Logs validation details if validation fails
    if (!res.ok) {
      const errorData = await res.json()
      if (errorData.details && Array.isArray(errorData.details)) {
        console.error(`Validation details for ${product.name}:`, errorData.details)
      }
    }
  } catch (err) {
    console.error(`Error distributing ${product.name}:`, err)
  }

  await new Promise(resolve => setTimeout(resolve, 100))
}
```

---

## 5. TABLE COMPONENT

**File:** [components/product-distribution-table.jsx](components/product-distribution-table.jsx)

**Features:**
- Display all distributions in paginated table
- Edit functionality - Opens `DistributeProductModal` with distribution data
- Delete functionality - Sends DELETE request with CSRF token
- Filter by outlet
- Search by product name/SKU/outlet name
- Pagination controls

**Key Methods:**
- `fetchDistributions()` - GET /api/product-distribute?page={page}&limit={limit}&outlet_id={id}
- `handleEditClick()` - Opens modal with `editingDistribution` data
- `handleDeleteConfirm()` - DELETE /api/product-distribute?id={id}

---

## 6. DATA FLOW

### Creating a Distribution
```
User fills form → DistributeProductModal.handleSubmit()
  ↓
Client validation (all fields present, stock check)
  ↓
Fetch POST /api/product-distribute with JSON body
  ↓
productDistributeController.create()
  ↓
Zod validation (product_id, outlet_id must be positive numbers)
  ↓
Check: Product exists? (findProductById)
  ↓
Check: Outlet exists? (findOutletById)
  ↓
createDistribution() → Database insert
  ↓
Return 201 with distribution data
  ↓
Modal closes, table refreshes
```

### Updating a Distribution
```
User edits in modal → DistributeProductModal.handleSubmit()
  ↓
Client validation (only quantity can change for edits)
  ↓
Fetch PUT /api/product-distribute?id={id} with JSON body
  ↓
productDistributeController.update()
  ↓
Zod validation (partial schema - allows partial updates)
  ↓
updateDistribution(id, validated) → Database update
  ↓
Return 200 with updated distribution data
  ↓
Modal closes, table refreshes
```

### Deleting a Distribution
```
User clicks delete → Confirm dialog
  ↓
Fetch DELETE /api/product-distribute?id={id}
  ↓
productDistributeController.remove()
  ↓
deleteDistribution(id) → Database delete
  ↓
Return 200 with success
  ↓
Table refreshes
```

---

## 7. KNOWN ISSUES & VALIDATION ERRORS

### Error: "expected number, received null" for product_id/outlet_id

**Cause:** The JSON body being sent contains `null` values instead of numbers, OR the form is not properly converting string values to numbers.

**Locations to check:**
1. **distribute-product-modal.jsx (Lines 100-104)** - Ensure `parseInt()` is being called on form values before sending
2. **bulk-distribute-modal.jsx (Lines 113-118)** - Verify `parseInt()` and `parseFloat()` are converting strings properly
3. **API Response** - If getting validation errors, check the API response details array for exact field causing issue

### Common Scenarios:
1. **Form select returns empty string** - Client validation should catch, but if bypassed, API will reject with "Product is required"
2. **String values not converted to numbers** - `parseInt()` returns NaN if string is empty or non-numeric
3. **Null values in JSON** - If form state has `null` values, Zod will reject them as it expects a number

### Error Response Example:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "null",
      "path": ["product_id"],
      "message": "Product is required"
    }
  ]
}
```

---

## 8. KEY FILES REFERENCE

| File | Purpose |
|------|---------|
| [controllers/productDistributeController.js](controllers/productDistributeController.js) | Core controller with Zod validation |
| [app/api/product-distribute/route.js](app/api/product-distribute/route.js) | Main API router |
| [app/api/product-distribute/deduct/route.js](app/api/product-distribute/deduct/route.js) | Quantity deduction endpoint |
| [components/distribute-product-modal.jsx](components/distribute-product-modal.jsx) | Single product distribution form |
| [components/bulk-distribute-modal.jsx](components/bulk-distribute-modal.jsx) | Bulk distribution form |
| [components/product-distribution-table.jsx](components/product-distribution-table.jsx) | Distribution listing/management |
| [models/productDistributeModel.js](models/productDistributeModel.js) | Database model functions |

---

## 9. AUTHENTICATION & AUTHORIZATION

**All endpoints require:**
- Logged-in user (session check)
- Specific roles:
  - `list()` - admin, manager, user
  - `create()` - admin, manager only
  - `update()` - admin, manager only
  - `remove()` - admin, manager only
  - `getByProduct()` - admin, manager, user
  - `getByOutlet()` - admin, manager, user

**CSRF Protection:** All write operations (POST, PUT, DELETE) require valid CSRF token in `x-csrf-token` header

---

## 10. NOTES

- **Edit restrictions:** When editing, product_id and outlet_id cannot be changed (disabled in form)
- **Partial updates:** Update schema uses `.partial()` to allow updating only quantity
- **Quantity deduction:** Separate endpoint `/api/product-distribute/deduct` handles reducing available quantities during sales
- **Notes field:** Optional free-text notes field for tracking distribution comments
