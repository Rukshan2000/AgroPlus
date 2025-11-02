-- Fix sales quantity to support decimal values (e.g., 1.98 kg, 2.5 liters)
-- This is necessary for products sold by weight or volume

ALTER TABLE sales 
ALTER COLUMN quantity TYPE DECIMAL(10, 3);

-- Add comment for clarity
COMMENT ON COLUMN sales.quantity IS 'Quantity sold - supports decimal values for weight/volume-based products (e.g., 1.98 kg, 2.5 liters)';

-- Also ensure products table supports decimal quantities
ALTER TABLE products 
ALTER COLUMN sold_quantity TYPE DECIMAL(10, 3),
ALTER COLUMN available_quantity TYPE DECIMAL(10, 3);

-- Update defaults to 0.000 for clarity
ALTER TABLE products 
ALTER COLUMN sold_quantity SET DEFAULT 0.000,
ALTER COLUMN available_quantity SET DEFAULT 0.000;

-- Add comments for clarity
COMMENT ON COLUMN products.sold_quantity IS 'Total quantity sold - supports decimal values for weight/volume-based products';
COMMENT ON COLUMN products.available_quantity IS 'Available quantity in stock - supports decimal values for weight/volume-based products';
