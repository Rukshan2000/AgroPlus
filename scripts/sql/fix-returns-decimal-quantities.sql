-- Fix product_returns table to support decimal quantities
-- This allows returning fractional quantities for weight/volume-based products

-- First, drop the constraint that prevents decimal values
ALTER TABLE product_returns
DROP CONSTRAINT IF EXISTS quantity_check;

-- Change quantity_returned to DECIMAL(10, 3)
ALTER TABLE product_returns
ALTER COLUMN quantity_returned TYPE DECIMAL(10, 3);

-- Change original_quantity to DECIMAL(10, 3)
ALTER TABLE product_returns
ALTER COLUMN original_quantity TYPE DECIMAL(10, 3);

-- Recreate the constraint with new decimal types
ALTER TABLE product_returns
ADD CONSTRAINT quantity_check CHECK (quantity_returned <= original_quantity);

-- Update column comments for clarity
COMMENT ON COLUMN product_returns.quantity_returned IS 'Quantity returned - supports decimal values for weight/volume-based products (e.g., 1.98 kg, 2.5 liters)';
COMMENT ON COLUMN product_returns.original_quantity IS 'Original quantity sold - supports decimal values for weight/volume-based products';

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_returns' 
AND column_name IN ('quantity_returned', 'original_quantity')
ORDER BY ordinal_position;
