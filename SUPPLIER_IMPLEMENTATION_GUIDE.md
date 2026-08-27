# Supplier Management System Implementation Guide

## Overview

This document outlines the complete supplier management system implementation for AgroPlus, including database setup, API integration, and UI components.

## 📋 Implementation Summary

The supplier management system has been fully implemented with the following components:

### 1. **Database Schema** (`SUPPLIER_SETUP.sql`)

#### Tables Created:

**`suppliers`** - Main supplier information table
- Core fields: name, contact_person, email, phone
- Address fields: address, city, postal_code, country
- Payment details: payment_terms, payment_method, bank_account, bank_name
- Business info: supplier_type, tax_id, rating, notes
- Status tracking: is_active, created_by, created_at, updated_at
- Unique constraint on supplier name

**`purchase_orders`** - Purchase order header
- Fields: order_number (unique), supplier_id, order_date, expected_delivery_date, actual_delivery_date
- Status tracking: status (pending, partial, received, cancelled)
- Financial: total_amount, notes
- Audit: created_by, created_at, updated_at

**`purchase_order_items`** - Line items for each purchase order
- References: purchase_order_id, product_id
- Quantity tracking: quantity_ordered, quantity_received, quantity_cancelled
- Pricing: unit_cost, line_total
- Denormalized data: product_name, product_sku, unit_type (for historical records)

**`supplier_prices`** - Optional price history tracking
- Tracks supplier-product pricing relationships
- Fields: unit_cost, minimum_order_quantity, effective_from/to dates
- Unique constraint on (supplier_id, product_id) pair

**`supplier_payments`** - Payment history to suppliers
- References: supplier_id, purchase_order_id
- Fields: payment_date, payment_amount, payment_method, reference_number
- For accounting and payment tracking

### 2. **Backend Models**

#### `models/supplierModel.js`
Functions implemented:
- `findSupplierById(id)` - Get single supplier
- `findSupplierByName(name)` - Check for duplicates
- `findSupplierByEmail(email)` - Email uniqueness check
- `listSuppliers({ page, limit, search, is_active, supplier_type })` - List with filtering
- `createSupplier({...})` - Create new supplier
- `updateSupplier(id, updates)` - Update supplier
- `deleteSupplier(id)` - Delete with validation (checks for active POs)
- `getSupplierStats(supplierId)` - Get order/spending statistics
- `getSupplierProducts(supplierId)` - Get products from supplier

#### `models/purchaseOrderModel.js`
Functions implemented:
- `findPurchaseOrderById(id)` - Get single PO
- `findPurchaseOrderByNumber(orderNumber)` - Check for duplicate order numbers
- `listPurchaseOrders({...})` - List with date range, status, supplier filters
- `createPurchaseOrder({...})` - Create with items (transaction)
- `updatePurchaseOrder(id, updates)` - Update dates/notes
- `receivePurchaseOrder(purchaseOrderId, itemUpdates)` - Process receipt with inventory update
- `cancelPurchaseOrder(id)` - Cancel with status validation
- `getPurchaseOrderWithItems(id)` - Get full details including items
- `getPurchaseOrderStats(supplierId)` - Get purchase statistics

### 3. **Controllers**

#### `controllers/supplierController.js`
Endpoints:
- `list()` - GET /api/suppliers - List all suppliers with pagination
- `create()` - POST /api/suppliers - Create new supplier
- `get()` - GET /api/suppliers/:id - Get supplier details with stats
- `update()` - PUT /api/suppliers/:id - Update supplier
- `deleteSupplierHandler()` - DELETE /api/suppliers/:id - Delete supplier

Features:
- Role-based access control (admin, manager for create/update/delete; all for list)
- CSRF protection on all POST/PUT/DELETE
- Zod validation for all inputs
- Conflict checking for duplicate names/emails
- Returns detailed supplier stats and products

#### `controllers/purchaseOrderController.js`
Endpoints:
- `list()` - GET /api/purchase-orders - List with filters
- `create()` - POST /api/purchase-orders - Create new PO
- `get()` - GET /api/purchase-orders/:id - Get PO with all items
- `update()` - PUT /api/purchase-orders/:id - Update PO
- `receive()` - POST /api/purchase-orders/:id?action=receive - Mark items as received
- `cancel()` - POST /api/purchase-orders/:id?action=cancel - Cancel order

Features:
- Transaction support for receive operations
- Automatic inventory updates on receipt
- Status transition validation
- Prevents operations on cancelled/received orders
- Updates product buying_price on receipt

### 4. **API Routes**

```
/api/suppliers/
  GET      - List suppliers
  POST     - Create supplier
  
/api/suppliers/[id]/
  GET      - Get supplier with stats
  PUT      - Update supplier
  DELETE   - Delete supplier

/api/purchase-orders/
  GET      - List purchase orders
  POST     - Create purchase order
  
/api/purchase-orders/[id]/
  GET      - Get PO with items
  PUT      - Update PO (dates/notes)
  POST     - Action endpoints:
    ?action=receive  - Receive items (updates inventory)
    ?action=cancel   - Cancel order
```

### 5. **UI Components**

#### Supplier Management

**`suppliers-table.jsx`** - Main suppliers list view
- Search by name, email, phone, city
- Filter by status (active/inactive)
- Filter by supplier type (wholesale, manufacturer, distributor)
- Actions: View details, Edit, Delete
- Shows total orders count

**`add-supplier-modal.jsx`** - Create/Edit supplier form
- Tabs: Basic Info | Location | Payment
- Fields for all supplier details
- Dropdown for supplier type and payment method
- Validation with error messages

**`delete-supplier-modal.jsx`** - Delete confirmation
- Safety checks preventing deletion of suppliers with active POs
- Warning messages about data loss

**`supplier-details-modal.jsx`** - View supplier information
- Tabs: Information | Statistics | Products
- Displays all supplier data organized by category
- Shows purchase order statistics (total orders, pending, partial, spent, avg order)
- Lists products available from supplier with pricing

#### Purchase Order Management

**`purchase-orders-table.jsx`** - Main purchase orders list
- Search by order number or supplier
- Filter by status (pending, partial, received, cancelled)
- Filter by supplier
- Displays order date, amount, item count, expected delivery
- Actions: View details, Cancel (if not received)

**`add-purchase-order-modal.jsx`** - Create purchase order
- Auto-generated order number (PO-YYYY-XXXXXX)
- Supplier selection dropdown
- Multiple line items with:
  - Product selection
  - Quantity ordered
  - Unit cost
  - Auto-calculated line totals
- Order total calculation
- Add/remove item buttons
- Expected delivery date

**`delete-purchase-order-modal.jsx`** - Cancel PO confirmation
- Prevents cancellation of received orders
- Warnings about inventory not being updated

**`purchase-order-details-modal.jsx`** - View PO details
- Tabs: Details | Items
- Full supplier contact information
- Item-by-item breakdown
- Ability to receive items with quantity inputs
- Automatic inventory update on receipt
- Status-based functionality (disable for cancelled/received)

### 6. **Key Features**

#### Supplier Management
✅ Create suppliers with full contact and payment details
✅ Update supplier information
✅ Deactivate suppliers (soft delete via is_active flag)
✅ Delete only suppliers without active purchase orders
✅ View supplier statistics (orders, spending, ratings)
✅ Track products supplied by each supplier
✅ Search and filter suppliers

#### Purchase Order Management
✅ Create purchase orders with multiple line items
✅ Track order status (pending → partial → received)
✅ Auto-generate order numbers
✅ Receive items with automatic inventory updates
✅ Update product buying_price from PO
✅ Cancel orders (pending/partial only)
✅ View full order history and details
✅ Date range filtering

#### Data Integrity
✅ Transaction support for complex operations
✅ Denormalization of product names/SKUs in POs (for historical accuracy)
✅ Unique constraints on order numbers and supplier names
✅ Foreign key constraints with cascade deletes
✅ Audit trail (created_by, created_at, updated_at)

#### Security
✅ Role-based access control (admin/manager only for write)
✅ CSRF token validation
✅ Zod schema validation
✅ Parameterized queries (SQL injection prevention)

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

```sql
-- Copy contents of SUPPLIER_SETUP.sql and run in PostgreSQL
-- Or execute:
psql -U postgres -d agropluss < SUPPLIER_SETUP.sql
```

### Step 2: Models Already Created

The following model files are ready to use:
- `/models/supplierModel.js`
- `/models/purchaseOrderModel.js`

### Step 3: Controllers Already Created

The following controller files are ready to use:
- `/controllers/supplierController.js`
- `/controllers/purchaseOrderController.js`

### Step 4: API Routes Already Created

The following API routes are ready:
- `/app/api/suppliers/route.js`
- `/app/api/suppliers/[id]/route.js`
- `/app/api/purchase-orders/route.js`
- `/app/api/purchase-orders/[id]/route.js`

### Step 5: UI Components Already Created

All UI components are ready to import:
- `suppliers-table.jsx`
- `add-supplier-modal.jsx`
- `delete-supplier-modal.jsx`
- `supplier-details-modal.jsx`
- `purchase-orders-table.jsx`
- `add-purchase-order-modal.jsx`
- `delete-purchase-order-modal.jsx`
- `purchase-order-details-modal.jsx`

### Step 6: Add to Main Pages

You can integrate the components into your main dashboard/admin pages:

**For Suppliers Management Page:**
```jsx
import SuppliersTable from '@/components/suppliers-table'

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Supplier Management</h1>
      <SuppliersTable />
    </div>
  )
}
```

**For Purchase Orders Management Page:**
```jsx
import PurchaseOrdersTable from '@/components/purchase-orders-table'

export default function PurchaseOrdersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Purchase Orders</h1>
      <PurchaseOrdersTable />
    </div>
  )
}
```

---

## 📊 Database Relationships

```
Suppliers (1) ──→ (M) Purchase Orders
                        ├──→ (M) Purchase Order Items ──→ (1) Products
                        └──→ (M) Supplier Payments

Suppliers (1) ──→ (M) Supplier Prices
                  ├─ Product (M)
                  └─ Status tracking
```

---

## 🔄 Key Workflows

### Creating a Purchase Order
1. User selects supplier from dropdown
2. System allows product selection
3. User enters quantity and unit cost
4. System calculates line totals
5. On submit, transaction creates PO + items + calculates total
6. Order marked as "pending"

### Receiving Purchase Order Items
1. User opens PO details
2. For each item, enters quantity to receive
3. On submit:
   - Updates `purchase_order_items.quantity_received`
   - Updates `products.stock_quantity` (adds quantity)
   - Updates `products.buying_price` (sets from PO unit cost)
   - Re-evaluates PO status (pending → partial → received)
4. If all items fully received, marks PO as "received"

### Supplier Deletion Safety
1. Check if supplier has any active POs (pending or partial status)
2. If yes, prevent deletion with error message
3. If no, allow deletion (hard delete)

---

## 💡 Future Enhancements

1. **Supplier Performance Analytics**
   - On-time delivery rates
   - Quality ratings over time
   - Price competitiveness tracking

2. **Inventory Optimization**
   - Auto-suggest purchase orders based on stock levels
   - Bulk discounts for minimum order quantities

3. **Advanced Payment Tracking**
   - Payment status on POs (unpaid/partial/paid)
   - Payment reminders and aging analysis
   - Multi-currency support

4. **Integration Features**
   - PDF generation for purchase orders
   - Email notifications for suppliers
   - Automated receipt scanning

5. **Reporting**
   - Supplier performance reports
   - Cost analysis by supplier
   - Historical pricing trends

---

## 🛠 API Examples

### Create Supplier
```bash
curl -X POST http://localhost:3000/api/suppliers \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "name": "Fresh Farms Co.",
    "contact_person": "John Smith",
    "email": "john@freshfarms.com",
    "phone": "+1-555-0100",
    "city": "Springfield",
    "supplier_type": "manufacturer",
    "payment_terms": "Net 30"
  }'
```

### Create Purchase Order
```bash
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "order_number": "PO-2024-001",
    "supplier_id": 1,
    "order_date": "2024-12-24",
    "expected_delivery_date": "2024-12-31",
    "items": [
      {
        "product_id": 5,
        "quantity_ordered": 100,
        "unit_cost": 25.50
      }
    ],
    "notes": "Urgent - for holiday season"
  }'
```

### Receive Items
```bash
curl -X POST http://localhost:3000/api/purchase-orders/1?action=receive \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '[
    {
      "id": 1,
      "quantity_received": 50
    },
    {
      "id": 2,
      "quantity_received": 75
    }
  ]'
```

---

## ✅ Testing Checklist

- [ ] Run SUPPLIER_SETUP.sql migration
- [ ] Create a test supplier
- [ ] Edit supplier information
- [ ] Create a purchase order
- [ ] Receive items (verify inventory updates)
- [ ] Check product buying_price is updated
- [ ] Test supplier deletion (should fail with active POs)
- [ ] Verify pagination and filtering
- [ ] Test search across fields
- [ ] Validate CSRF protection
- [ ] Check role-based access control

---

## 📝 Notes

- All timestamps use UTC with `NOW()` function
- Deleting suppliers with active purchase orders is prevented
- Purchase order items are immutable after creation (for audit trail)
- Receiving is a transaction to ensure consistency
- Product buying_price is always overwritten by most recent PO received
- Supplier names and email addresses must be unique

---

Generated: December 24, 2025
