-- Add loyalty card number field to customers table
-- This migration adds a unique card number for each customer's loyalty card

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS loyalty_card_number VARCHAR(20) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_card_number ON customers(loyalty_card_number);

-- Function to generate loyalty card numbers
CREATE OR REPLACE FUNCTION generate_loyalty_card_number(customer_id INTEGER)
RETURNS VARCHAR(20) AS $$
DECLARE
    card_number VARCHAR(20);
    padded_id VARCHAR(8);
BEGIN
    -- Pad the customer ID to 8 digits
    padded_id := LPAD(customer_id::TEXT, 8, '0');
    
    -- Format: LC-XXXX-XXXX
    card_number := 'LC-' || SUBSTRING(padded_id, 1, 4) || '-' || SUBSTRING(padded_id, 5, 4);
    
    RETURN card_number;
END;
$$ LANGUAGE plpgsql;

-- Update existing customers with loyalty card numbers
UPDATE customers 
SET loyalty_card_number = generate_loyalty_card_number(id)
WHERE loyalty_card_number IS NULL;

-- Create a trigger to automatically generate card numbers for new customers
CREATE OR REPLACE FUNCTION assign_loyalty_card_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.loyalty_card_number IS NULL THEN
        NEW.loyalty_card_number := generate_loyalty_card_number(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS trigger_assign_loyalty_card_number ON customers;
CREATE TRIGGER trigger_assign_loyalty_card_number
    BEFORE INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION assign_loyalty_card_number();

-- Note: For PostgreSQL versions < 11, after insert trigger is needed
-- Create an after insert trigger to update the card number
CREATE OR REPLACE FUNCTION update_loyalty_card_number_after_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.loyalty_card_number IS NULL THEN
        UPDATE customers 
        SET loyalty_card_number = generate_loyalty_card_number(NEW.id)
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_loyalty_card_number_after_insert ON customers;
CREATE TRIGGER trigger_update_loyalty_card_number_after_insert
    AFTER INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_loyalty_card_number_after_insert();
