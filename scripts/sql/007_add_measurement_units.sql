-- Add measurement unit fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_type VARCHAR(20) DEFAULT 'kg';
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_value DECIMAL(8, 3) DEFAULT 1.000;

-- Create an enum-like constraint for valid unit types
ALTER TABLE products ADD CONSTRAINT check_unit_type 
CHECK (unit_type IN ('kg', 'g', 'l', 'ml', 'items', 'pcs', 'bags', 'bottles', 'packets'));

-- Add index for unit_type for faster queries
CREATE INDEX IF NOT EXISTS idx_products_unit_type ON products(unit_type);

-- Update existing products to have proper units based on their names
UPDATE products SET 
  unit_type = 'kg',
  unit_value = 50.000
WHERE name LIKE '%50kg%' AND unit_type = 'kg';

UPDATE products SET 
  unit_type = 'kg',
  unit_value = 25.000
WHERE name LIKE '%25kg%' AND unit_type = 'kg';

UPDATE products SET 
  unit_type = 'kg',
  unit_value = 5.000
WHERE name LIKE '%5kg%' AND unit_type = 'kg';

-- Comment explaining the unit system
COMMENT ON COLUMN products.unit_type IS 'Measurement unit type: kg, g, l, ml, items, pcs, bags, bottles, packets';
COMMENT ON COLUMN products.unit_value IS 'Numerical value for the unit (e.g., 50 for 50kg, 1 for single items)';
