-- Add quantity tracking columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sold_quantity INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS available_quantity INTEGER NOT NULL DEFAULT 0;

-- Update available_quantity to match stock_quantity for existing products
UPDATE products 
SET available_quantity = stock_quantity 
WHERE available_quantity = 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_available_quantity ON products(available_quantity);
