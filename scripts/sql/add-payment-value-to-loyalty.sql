-- Migration: Add payment_value column to loyalty_transactions table
-- This column stores the LKR value when points are used for payment

ALTER TABLE loyalty_transactions ADD COLUMN IF NOT EXISTS payment_value DECIMAL(10,2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN loyalty_transactions.payment_value IS 'The monetary value (LKR) of the points transaction when used for payment';

-- Create index for better query performance on payment transactions
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_payment_value ON loyalty_transactions(payment_value) WHERE payment_value > 0;
