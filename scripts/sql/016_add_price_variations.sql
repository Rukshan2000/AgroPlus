-- Add product price variations table
-- This allows products to have multiple price points (e.g., Urea 50kg Bag can have 10 LKR and 20 LKR variations)

CREATE TABLE IF NOT EXISTS product_price_variations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name VARCHAR(255) NOT NULL, -- e.g., "10 LKR per kg", "20 LKR per kg", "Small Pack", "Large Pack"
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- The price for this variation
  buying_price DECIMAL(10, 2) DEFAULT 0.00, -- Optional: buying price for this variation
  is_default BOOLEAN DEFAULT false, -- Whether this is the default price variation
  is_active BOOLEAN DEFAULT true, -- Whether this variation is currently available
  stock_quantity INTEGER DEFAULT 0, -- Optional: track separate stock for each variation
  sku_suffix VARCHAR(50), -- Optional: add to main product SKU (e.g., main SKU "UREA-001", suffix "-10KG")
  description TEXT, -- Optional: additional details about this variation
  sort_order INTEGER DEFAULT 0, -- For custom ordering of variations
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_price_variations_product_id ON product_price_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_price_variations_is_active ON product_price_variations(is_active);
CREATE INDEX IF NOT EXISTS idx_product_price_variations_is_default ON product_price_variations(is_default);

-- Add a constraint to ensure only one default variation per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_default_per_product 
  ON product_price_variations(product_id) 
  WHERE is_default = true;

-- Add comments for documentation
COMMENT ON TABLE product_price_variations IS 'Stores different price variations for products (e.g., different pack sizes, bulk pricing)';
COMMENT ON COLUMN product_price_variations.variant_name IS 'Name of the price variation (e.g., "10 LKR per kg", "50kg Bag")';
COMMENT ON COLUMN product_price_variations.is_default IS 'If true, this is the default price shown for the product';
COMMENT ON COLUMN product_price_variations.stock_quantity IS 'Optional separate stock tracking for this variation';
COMMENT ON COLUMN product_price_variations.sku_suffix IS 'Optional suffix to add to main product SKU for this variation';
