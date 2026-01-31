-- ============================================================================
-- SUPPLIER MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ============================================================================

-- ============================================================================
-- 1. SUPPLIERS TABLE
-- ============================================================================
-- Core supplier information including contact details and payment terms
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Payment and business terms
    payment_terms VARCHAR(100),  -- e.g., "Net 30", "COD", "Prepaid"
    payment_method VARCHAR(50),   -- e.g., "bank_transfer", "check", "cash"
    bank_account VARCHAR(100),
    bank_name VARCHAR(255),
    
    -- Supplier classification
    supplier_type VARCHAR(50),    -- e.g., "wholesale", "manufacturer", "distributor"
    tax_id VARCHAR(50),           -- VAT ID, GST ID, etc.
    
    -- Status and tracking
    is_active BOOLEAN DEFAULT true,
    rating DECIMAL(3, 2),         -- 1.0 to 5.0
    notes TEXT,
    
    -- Audit fields
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_is_active ON suppliers(is_active);

-- ============================================================================
-- 2. PURCHASE ORDERS TABLE
-- ============================================================================
-- Track all purchase orders from suppliers
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,  -- e.g., "PO-2024-001"
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    
    -- Order details
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Financial details
    total_amount DECIMAL(12, 2),
    notes TEXT,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending',  -- pending, partial, received, cancelled
    
    -- Audit fields
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_order_number ON purchase_orders(order_number);
CREATE INDEX idx_purchase_orders_created_at ON purchase_orders(created_at);

-- ============================================================================
-- 3. PURCHASE ORDER ITEMS TABLE
-- ============================================================================
-- Individual line items for each purchase order
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    
    -- Quantity tracking
    quantity_ordered DECIMAL(10, 2) NOT NULL,
    quantity_received DECIMAL(10, 2) DEFAULT 0,
    quantity_cancelled DECIMAL(10, 2) DEFAULT 0,
    unit_type VARCHAR(50),  -- Stored from product at order time
    
    -- Pricing
    unit_cost DECIMAL(10, 2) NOT NULL,  -- Cost per unit from supplier
    line_total DECIMAL(12, 2),  -- quantity_ordered * unit_cost
    
    -- Product info stored at time of order (denormalized for history)
    product_name VARCHAR(255),
    product_sku VARCHAR(100),
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_purchase_order_items_purchase_order ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_product ON purchase_order_items(product_id);

-- ============================================================================
-- 4. SUPPLIER PRICES TABLE (Optional - for price history)
-- ============================================================================
-- Track price history for each supplier-product combination
CREATE TABLE IF NOT EXISTS supplier_prices (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Pricing
    unit_cost DECIMAL(10, 2) NOT NULL,
    minimum_order_quantity DECIMAL(10, 2),
    unit_type VARCHAR(50),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(supplier_id, product_id)
);

CREATE INDEX idx_supplier_prices_supplier ON supplier_prices(supplier_id);
CREATE INDEX idx_supplier_prices_product ON supplier_prices(product_id);
CREATE INDEX idx_supplier_prices_active ON supplier_prices(is_active);

-- ============================================================================
-- 5. SUPPLIER PAYMENT HISTORY TABLE
-- ============================================================================
-- Track payments made to suppliers
CREATE TABLE IF NOT EXISTS supplier_payments (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE SET NULL,
    
    -- Payment details
    payment_date DATE NOT NULL,
    payment_amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),  -- Check #, Bank ref, etc.
    notes TEXT,
    
    -- Audit fields
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_supplier_payments_supplier ON supplier_payments(supplier_id);
CREATE INDEX idx_supplier_payments_purchase_order ON supplier_payments(purchase_order_id);
CREATE INDEX idx_supplier_payments_payment_date ON supplier_payments(payment_date);

-- ============================================================================
-- OPTIONAL: Extend restock_history to track supplier source
-- ============================================================================
-- If restock_history table exists, consider adding supplier_id column:
-- ALTER TABLE restock_history ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL;
-- ALTER TABLE restock_history ADD COLUMN purchase_order_item_id INTEGER REFERENCES purchase_order_items(id) ON DELETE SET NULL;

-- ============================================================================
-- MIGRATION SCRIPT FOR CREATING THE TABLES
-- ============================================================================
-- Run all CREATE TABLE statements above to set up the supplier management system.
