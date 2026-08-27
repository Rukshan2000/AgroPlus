# Supplier Management System - Database Structure Reference

## Table Definitions

### 1. SUPPLIERS Table

```sql
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY
    
    -- Basic Information
    name VARCHAR(255) NOT NULL UNIQUE
    contact_person VARCHAR(255)
    email VARCHAR(255)
    phone VARCHAR(20)
    
    -- Location
    address TEXT
    city VARCHAR(100)
    postal_code VARCHAR(20)
    country VARCHAR(100)
    
    -- Payment & Business
    payment_terms VARCHAR(100)       -- e.g., "Net 30", "COD"
    payment_method VARCHAR(50)       -- "bank_transfer", "check", "cash"
    bank_account VARCHAR(100)
    bank_name VARCHAR(255)
    
    -- Classification
    supplier_type VARCHAR(50)        -- "wholesale", "manufacturer", "distributor"
    tax_id VARCHAR(50)               -- VAT/GST ID
    
    -- Status & Feedback
    is_active BOOLEAN DEFAULT true
    rating DECIMAL(3, 2)             -- 1.0 to 5.0
    notes TEXT
    
    -- Audit
    created_by INTEGER REFERENCES users(id)
    created_at TIMESTAMP DEFAULT NOW()
    updated_at TIMESTAMP DEFAULT NOW()
)

INDEX: suppliers_name
INDEX: suppliers_is_active
```

---

### 2. PURCHASE_ORDERS Table

```sql
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY
    
    -- Reference
    order_number VARCHAR(50) NOT NULL UNIQUE  -- "PO-2024-001234"
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT
    
    -- Dates
    order_date DATE DEFAULT CURRENT_DATE
    expected_delivery_date DATE
    actual_delivery_date DATE
    
    -- Financial
    total_amount DECIMAL(12, 2)
    
    -- Status Tracking
    status VARCHAR(50) DEFAULT 'pending'
    -- Values: pending, partial, received, cancelled
    
    -- Additional Info
    notes TEXT
    
    -- Audit
    created_by INTEGER REFERENCES users(id)
    created_at TIMESTAMP DEFAULT NOW()
    updated_at TIMESTAMP DEFAULT NOW()
)

INDEX: purchase_orders_supplier (supplier_id)
INDEX: purchase_orders_status
INDEX: purchase_orders_order_number
INDEX: purchase_orders_created_at
```

---

### 3. PURCHASE_ORDER_ITEMS Table

```sql
CREATE TABLE purchase_order_items (
    id SERIAL PRIMARY KEY
    
    -- References
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT
    
    -- Quantity Tracking
    quantity_ordered DECIMAL(10, 2) NOT NULL
    quantity_received DECIMAL(10, 2) DEFAULT 0
    quantity_cancelled DECIMAL(10, 2) DEFAULT 0
    unit_type VARCHAR(50)  -- "kg", "pcs", "boxes", etc.
    
    -- Pricing (stored at order time - immutable)
    unit_cost DECIMAL(10, 2) NOT NULL
    line_total DECIMAL(12, 2)  -- quantity_ordered * unit_cost
    
    -- Denormalized Data (for historical accuracy)
    product_name VARCHAR(255)
    product_sku VARCHAR(100)
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW()
    updated_at TIMESTAMP DEFAULT NOW()
)

INDEX: purchase_order_items_purchase_order (purchase_order_id)
INDEX: purchase_order_items_product (product_id)
```

---

### 4. SUPPLIER_PRICES Table (Optional)

```sql
CREATE TABLE supplier_prices (
    id SERIAL PRIMARY KEY
    
    -- References
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE
    
    -- Pricing Details
    unit_cost DECIMAL(10, 2) NOT NULL
    minimum_order_quantity DECIMAL(10, 2)
    unit_type VARCHAR(50)
    
    -- Status
    is_active BOOLEAN DEFAULT true
    effective_from DATE DEFAULT CURRENT_DATE
    effective_to DATE
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW()
    updated_at TIMESTAMP DEFAULT NOW()
    
    CONSTRAINT unique_supplier_product UNIQUE(supplier_id, product_id)
)

INDEX: supplier_prices_supplier (supplier_id)
INDEX: supplier_prices_product (product_id)
INDEX: supplier_prices_active (is_active)
```

---

### 5. SUPPLIER_PAYMENTS Table (Optional)

```sql
CREATE TABLE supplier_payments (
    id SERIAL PRIMARY KEY
    
    -- References
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE
    purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE SET NULL
    
    -- Payment Details
    payment_date DATE NOT NULL
    payment_amount DECIMAL(12, 2) NOT NULL
    payment_method VARCHAR(50)
    reference_number VARCHAR(100)  -- Check #, Bank ref, Invoice #
    notes TEXT
    
    -- Audit
    created_by INTEGER REFERENCES users(id)
    created_at TIMESTAMP DEFAULT NOW()
)

INDEX: supplier_payments_supplier (supplier_id)
INDEX: supplier_payments_purchase_order (purchase_order_id)
INDEX: supplier_payments_payment_date (payment_date)
```

---

## Entity Relationships Diagram

```
┌─────────────────────┐
│   SUPPLIERS         │
│─────────────────────│
│ id (PK)            │
│ name (UNIQUE)      │
│ email (UNIQUE)     │
│ contact_person     │
│ payment_terms      │
│ supplier_type      │
│ is_active          │
│ rating             │
│ ...                │
└─────────────────────┘
         │
         │ 1:M
         │
         ▼
┌─────────────────────┐          ┌──────────────────────┐
│ PURCHASE_ORDERS     │          │ SUPPLIER_PAYMENTS    │
│─────────────────────│          │──────────────────────│
│ id (PK)            │◄──────────│ id (PK)             │
│ order_number (UQ)  │ 1:M       │ supplier_id (FK)    │
│ supplier_id (FK)   │           │ purchase_order_id   │
│ order_date         │           │ payment_date        │
│ status             │           │ payment_amount      │
│ total_amount       │           │ ...                 │
│ ...                │           └──────────────────────┘
└─────────────────────┘
         │
         │ 1:M
         │
         ▼
┌──────────────────────────┐
│ PURCHASE_ORDER_ITEMS     │
│──────────────────────────│
│ id (PK)                 │
│ purchase_order_id (FK)  │
│ product_id (FK)         │
│ quantity_ordered        │
│ quantity_received       │
│ unit_cost               │
│ line_total              │
│ product_name (denorm)   │
│ product_sku (denorm)    │
│ ...                     │
└──────────────────────────┘
         │
         │ M:1
         │
         ▼
    ┌─────────────┐
    │  PRODUCTS   │
    │─────────────│
    │ id (PK)     │
    │ name        │
    │ sku         │
    │ buying_price│ ◄── Updated on receipt
    │ stock_qty   │ ◄── Updated on receipt
    │ ...         │
    └─────────────┘


    ┌──────────────────────┐
    │ SUPPLIER_PRICES      │
    │──────────────────────│
    │ id (PK)             │
    │ supplier_id (FK)    │
    │ product_id (FK)     │
    │ unit_cost           │
    │ min_order_qty       │
    │ is_active           │
    │ ...                 │
    └──────────────────────┘
```

---

## Query Examples

### Get Supplier with Stats
```sql
SELECT 
    s.*,
    COUNT(DISTINCT po.id) as total_orders,
    SUM(po.total_amount) as total_spent,
    COUNT(DISTINCT CASE WHEN po.status = 'pending' THEN po.id END) as pending_orders
FROM suppliers s
LEFT JOIN purchase_orders po ON s.id = po.supplier_id
WHERE s.id = $1
GROUP BY s.id
```

### Get Purchase Order Details
```sql
SELECT 
    po.*,
    s.name as supplier_name,
    COUNT(poi.id) as item_count,
    SUM(poi.quantity_received) as total_quantity_received
FROM purchase_orders po
JOIN suppliers s ON po.supplier_id = s.id
LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
WHERE po.id = $1
GROUP BY po.id, s.name
```

### Get Purchase Order Items
```sql
SELECT 
    poi.*,
    p.name as full_product_name
FROM purchase_order_items poi
LEFT JOIN products p ON poi.product_id = p.id
WHERE poi.purchase_order_id = $1
ORDER BY poi.created_at
```

### Get Supplier Products
```sql
SELECT 
    sp.*,
    p.name,
    p.sku
FROM supplier_prices sp
JOIN products p ON sp.product_id = p.id
WHERE sp.supplier_id = $1 AND sp.is_active = true
ORDER BY p.name
```

### Calculate Supplier Performance
```sql
SELECT 
    s.id,
    s.name,
    COUNT(po.id) as order_count,
    AVG(EXTRACT(DAY FROM (po.actual_delivery_date - po.order_date))) as avg_delivery_days,
    SUM(po.total_amount) as total_spent,
    AVG(s.rating) as avg_rating
FROM suppliers s
LEFT JOIN purchase_orders po ON s.id = po.supplier_id AND po.status = 'received'
WHERE s.is_active = true
GROUP BY s.id, s.name
ORDER BY total_spent DESC
```

---

## Data Constraints & Validations

### Uniqueness Constraints
- `suppliers.name` - Must be unique
- `suppliers.email` - Must be unique (when provided)
- `purchase_orders.order_number` - Must be unique
- `supplier_prices` - (supplier_id, product_id) must be unique

### Foreign Key Constraints
- `purchase_orders.supplier_id` → `suppliers.id` (ON DELETE RESTRICT)
- `purchase_order_items.purchase_order_id` → `purchase_orders.id` (ON DELETE CASCADE)
- `purchase_order_items.product_id` → `products.id` (ON DELETE RESTRICT)
- `supplier_prices.supplier_id` → `suppliers.id` (ON DELETE CASCADE)
- `supplier_prices.product_id` → `products.id` (ON DELETE CASCADE)
- `supplier_payments.supplier_id` → `suppliers.id` (ON DELETE CASCADE)
- `supplier_payments.purchase_order_id` → `purchase_orders.id` (ON DELETE SET NULL)

### Check Constraints (Recommended)
```sql
ALTER TABLE suppliers ADD CONSTRAINT check_rating 
    CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

ALTER TABLE purchase_order_items ADD CONSTRAINT check_quantities
    CHECK (quantity_ordered > 0 AND quantity_received >= 0 AND quantity_cancelled >= 0);

ALTER TABLE purchase_orders ADD CONSTRAINT check_status
    CHECK (status IN ('pending', 'partial', 'received', 'cancelled'));
```

---

## Indexes Summary

```
suppliers
├─ UNIQUE: name
├─ UNIQUE: email
├─ INDEX: is_active
└─ INDEX: created_by

purchase_orders
├─ UNIQUE: order_number
├─ INDEX: supplier_id
├─ INDEX: status
├─ INDEX: created_at
└─ INDEX: created_by

purchase_order_items
├─ INDEX: purchase_order_id
├─ INDEX: product_id
└─ INDEX: created_at

supplier_prices
├─ UNIQUE: (supplier_id, product_id)
├─ INDEX: supplier_id
├─ INDEX: product_id
└─ INDEX: is_active

supplier_payments
├─ INDEX: supplier_id
├─ INDEX: purchase_order_id
├─ INDEX: payment_date
└─ INDEX: created_by
```

---

## Transaction Scenarios

### Create Purchase Order (Transaction)
1. BEGIN
2. Verify supplier exists
3. Create purchase_orders row
4. For each item:
   - Verify product exists
   - Create purchase_order_items row
   - Accumulate total_amount
5. UPDATE purchase_orders SET total_amount
6. COMMIT

### Receive Items (Transaction)
1. BEGIN
2. Verify PO exists and not cancelled
3. For each item update:
   - UPDATE purchase_order_items (quantity_received)
   - UPDATE products (stock_quantity, buying_price)
4. Recalculate PO status
5. UPDATE purchase_orders (status, actual_delivery_date)
6. COMMIT

### Delete Supplier (With Validation)
1. Check for pending/partial purchase_orders
2. If found: ROLLBACK with error
3. If none: DELETE FROM suppliers
4. CASCADE deletes supplier_prices, supplier_payments

---

## Performance Considerations

1. **Pagination**: Always use LIMIT/OFFSET for large tables
2. **Indexes**: Frequently queried columns are indexed
3. **Denormalization**: Product info stored in items for historical accuracy
4. **Audit Trail**: created_at/updated_at on all tables for tracking
5. **Soft Deletes**: Use `is_active` flag rather than hard deletes where needed

---

**Note**: To extend with additional fields, follow the same pattern used for existing tables. Always maintain referential integrity and add appropriate indexes for query performance.
