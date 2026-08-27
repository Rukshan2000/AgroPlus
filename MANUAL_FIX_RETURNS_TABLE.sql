-- Direct SQL commands to fix the product_returns table
-- Run these commands directly in your PostgreSQL client

-- Step 1: Check current column types
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_returns' 
AND column_name IN ('quantity_returned', 'original_quantity')
ORDER BY ordinal_position;

-- Step 2: If original_quantity is still INTEGER, convert it
-- First drop the constraint
ALTER TABLE product_returns DROP CONSTRAINT IF EXISTS quantity_check;

-- Convert original_quantity from INTEGER to DECIMAL
ALTER TABLE product_returns 
ALTER COLUMN original_quantity TYPE DECIMAL(10, 3);

-- Convert quantity_returned from INTEGER to DECIMAL if needed
ALTER TABLE product_returns 
ALTER COLUMN quantity_returned TYPE DECIMAL(10, 3);

-- Step 3: Recreate the constraint
ALTER TABLE product_returns
ADD CONSTRAINT quantity_check CHECK (quantity_returned <= original_quantity);

-- Step 4: Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_returns' 
AND column_name IN ('quantity_returned', 'original_quantity')
ORDER BY ordinal_position;
