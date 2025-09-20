-- Add expiry tracking columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS manufacture_date DATE,
ADD COLUMN IF NOT EXISTS alert_before_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS minimum_quantity INTEGER DEFAULT 5;

-- Create indexes for expiry queries
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON products(expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_minimum_quantity ON products(minimum_quantity);

-- Add comments for clarity
COMMENT ON COLUMN products.expiry_date IS 'The expiration date of the product';
COMMENT ON COLUMN products.manufacture_date IS 'The manufacturing/production date of the product';
COMMENT ON COLUMN products.alert_before_days IS 'Number of days before expiry to show alert (default: 7)';
COMMENT ON COLUMN products.minimum_quantity IS 'Minimum stock level to trigger low stock alert (default: 5)';

-- Create a table to track restock history
CREATE TABLE IF NOT EXISTS restock_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_added INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  expiry_date DATE,
  manufacture_date DATE,
  notes TEXT,
  restocked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  restocked_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Create indexes for restock history
CREATE INDEX IF NOT EXISTS idx_restock_history_product_id ON restock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_restock_history_restocked_at ON restock_history(restocked_at);
CREATE INDEX IF NOT EXISTS idx_restock_history_restocked_by ON restock_history(restocked_by);

-- Add comments for restock history
COMMENT ON TABLE restock_history IS 'Track all restocking operations for auditing and inventory management';
COMMENT ON COLUMN restock_history.quantity_added IS 'Amount of stock added in this restock operation';
COMMENT ON COLUMN restock_history.previous_stock IS 'Stock quantity before restocking';
COMMENT ON COLUMN restock_history.new_stock IS 'Stock quantity after restocking';
