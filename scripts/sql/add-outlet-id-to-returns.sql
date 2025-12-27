-- Add outlet_id column to product_returns table to track returns by outlet
ALTER TABLE product_returns 
ADD COLUMN IF NOT EXISTS outlet_id INTEGER REFERENCES outlets(id) ON DELETE SET NULL;

-- Create index for better query performance on outlet_id
CREATE INDEX IF NOT EXISTS idx_returns_outlet_id ON product_returns(outlet_id);

-- Create composite index for filtering by outlet and date
CREATE INDEX IF NOT EXISTS idx_returns_outlet_date ON product_returns(outlet_id, return_date);
