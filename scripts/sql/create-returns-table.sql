-- Create product_returns table
CREATE TABLE IF NOT EXISTS product_returns (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  quantity_returned INTEGER NOT NULL CHECK (quantity_returned > 0),
  original_quantity INTEGER NOT NULL CHECK (original_quantity > 0),
  return_reason TEXT,
  refund_amount DECIMAL(10, 2) NOT NULL CHECK (refund_amount >= 0),
  restocked BOOLEAN DEFAULT true,
  return_date TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT quantity_check CHECK (quantity_returned <= original_quantity)
);

-- Add return_status column to sales table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales' AND column_name = 'return_status'
  ) THEN
    ALTER TABLE sales 
    ADD COLUMN return_status VARCHAR(20) DEFAULT 'none' 
    CHECK (return_status IN ('none', 'partial', 'full'));
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_returns_sale_id ON product_returns(sale_id);
CREATE INDEX IF NOT EXISTS idx_returns_product_id ON product_returns(product_id);
CREATE INDEX IF NOT EXISTS idx_returns_return_date ON product_returns(return_date);
CREATE INDEX IF NOT EXISTS idx_returns_processed_by ON product_returns(processed_by);
CREATE INDEX IF NOT EXISTS idx_sales_return_status ON sales(return_status);

-- Add comments
COMMENT ON TABLE product_returns IS 'Stores information about returned products';
COMMENT ON COLUMN product_returns.sale_id IS 'Reference to the original sale';
COMMENT ON COLUMN product_returns.product_id IS 'Reference to the product being returned';
COMMENT ON COLUMN product_returns.quantity_returned IS 'Number of items returned';
COMMENT ON COLUMN product_returns.original_quantity IS 'Original quantity sold';
COMMENT ON COLUMN product_returns.refund_amount IS 'Amount refunded to customer';
COMMENT ON COLUMN product_returns.restocked IS 'Whether the items were added back to inventory';
COMMENT ON COLUMN product_returns.processed_by IS 'User who processed the return';
COMMENT ON COLUMN sales.return_status IS 'Return status: none, partial, or full';

-- Grant permissions (adjust as needed for your user)
-- GRANT SELECT, INSERT, UPDATE ON product_returns TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE product_returns_id_seq TO your_app_user;
