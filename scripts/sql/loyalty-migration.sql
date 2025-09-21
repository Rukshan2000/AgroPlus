-- Loyalty System Database Migration Script
-- Run this script to create all loyalty-related tables

-- Create Loyalty Programs Table
CREATE TABLE IF NOT EXISTS loyalty_programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_per_dollar DECIMAL(10,2) DEFAULT 1.00,
    signup_bonus INTEGER DEFAULT 0,
    min_redemption_threshold INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    loyalty_program_id INTEGER REFERENCES loyalty_programs(id),
    points_balance INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    total_points_redeemed INTEGER DEFAULT 0,
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Loyalty Transactions Table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) NOT NULL,
    sale_id INTEGER REFERENCES sales(id),
    points INTEGER NOT NULL,
    type VARCHAR(20) CHECK (type IN ('earn', 'redeem', 'adjustment', 'expiration')),
    description TEXT,
    expiration_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Rewards Table
CREATE TABLE IF NOT EXISTS rewards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL,
    is_discount BOOLEAN DEFAULT false,
    discount_percentage DECIMAL(5,2),
    discount_amount DECIMAL(10,2),
    min_purchase_amount DECIMAL(10,2) DEFAULT 0,
    stock_quantity INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Redemptions Table
CREATE TABLE IF NOT EXISTS redemptions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) NOT NULL,
    reward_id INTEGER REFERENCES rewards(id) NOT NULL,
    points_used INTEGER NOT NULL,
    sale_id INTEGER REFERENCES sales(id),
    status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('issued', 'used', 'expired', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_program ON customers(loyalty_program_id);
CREATE INDEX IF NOT EXISTS idx_customers_points_balance ON customers(points_balance);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_sale ON loyalty_transactions(sale_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(type);
CREATE INDEX IF NOT EXISTS idx_redemptions_customer ON redemptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);

-- Add column to sales table to track customer (if it doesn't exist)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to relevant tables
CREATE TRIGGER update_loyalty_programs_updated_at BEFORE UPDATE ON loyalty_programs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_redemptions_updated_at BEFORE UPDATE ON redemptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert a default loyalty program
INSERT INTO loyalty_programs (name, description, points_per_dollar, signup_bonus, min_redemption_threshold, is_active)
VALUES ('Default Loyalty Program', 'Standard customer loyalty program', 1.00, 100, 100, true)
ON CONFLICT DO NOTHING;
