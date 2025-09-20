-- Add buying price and selling price to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS buying_price DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10, 2) DEFAULT 0.00;

-- Update existing products to use current price as selling price
UPDATE products 
SET selling_price = price 
WHERE selling_price = 0.00 OR selling_price IS NULL;

-- Add index for pricing queries
CREATE INDEX IF NOT EXISTS idx_products_selling_price ON products(selling_price);
CREATE INDEX IF NOT EXISTS idx_products_buying_price ON products(buying_price);

-- Add comment for clarity
COMMENT ON COLUMN products.buying_price IS 'The cost price at which the product was purchased';
COMMENT ON COLUMN products.selling_price IS 'The price at which the product is sold to customers';
COMMENT ON COLUMN products.price IS 'Deprecated: Use selling_price instead. Kept for backward compatibility';
