-- Product Distribution Table Migration
-- Tracks product quantity distributed from main warehouse to different outlets

CREATE TABLE IF NOT EXISTS product_distribute (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    outlet_id INTEGER NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    quantity_distributed DECIMAL(10, 2) NOT NULL DEFAULT 0,
    distributed_by VARCHAR(255),
    distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_distribute_product_id ON product_distribute(product_id);
CREATE INDEX IF NOT EXISTS idx_product_distribute_outlet_id ON product_distribute(outlet_id);
CREATE INDEX IF NOT EXISTS idx_product_distribute_distribution_date ON product_distribute(distribution_date);
CREATE INDEX IF NOT EXISTS idx_product_distribute_active ON product_distribute(is_active);

-- Create a view for product distribution summary
CREATE OR REPLACE VIEW product_distribute_summary AS
SELECT 
    pd.id,
    p.id as product_id,
    p.name as product_name,
    p.sku,
    o.id as outlet_id,
    o.name as outlet_name,
    pd.quantity_distributed,
    pd.distributed_by,
    pd.distribution_date,
    pd.notes,
    pd.is_active,
    pd.created_at,
    pd.updated_at
FROM product_distribute pd
JOIN products p ON pd.product_id = p.id
JOIN outlets o ON pd.outlet_id = o.id
ORDER BY pd.distribution_date DESC;
