-- Add profit calculation fields to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS buying_price_at_sale DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS profit_per_unit DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_profit DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS profit_margin_percentage DECIMAL(5, 2) DEFAULT 0.00;

-- Add indexes for profit-related queries
CREATE INDEX IF NOT EXISTS idx_sales_total_profit ON sales(total_profit);
CREATE INDEX IF NOT EXISTS idx_sales_profit_margin ON sales(profit_margin_percentage);

-- Add comments for clarity
COMMENT ON COLUMN sales.buying_price_at_sale IS 'The buying price of the product at the time of sale';
COMMENT ON COLUMN sales.profit_per_unit IS 'Profit per unit sold (selling price - buying price)';
COMMENT ON COLUMN sales.total_profit IS 'Total profit for this sale (profit_per_unit * quantity)';
COMMENT ON COLUMN sales.profit_margin_percentage IS 'Profit margin percentage ((selling_price - buying_price) / selling_price * 100)';
