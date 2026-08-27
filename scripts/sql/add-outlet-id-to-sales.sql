-- Add outlet_id column to sales table to track which outlet the sale was made at
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS outlet_id INTEGER REFERENCES outlets(id) ON DELETE SET NULL;

-- Create index for better query performance on outlet_id
CREATE INDEX IF NOT EXISTS idx_sales_outlet_id ON sales(outlet_id);

-- Create index for querying sales by outlet and date
CREATE INDEX IF NOT EXISTS idx_sales_outlet_date ON sales(outlet_id, sale_date);
