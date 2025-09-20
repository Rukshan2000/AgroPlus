-- Additional products with different measurement units (no duplicates)
INSERT INTO products (name, description, price, sku, category, stock_quantity, is_active, image_url, created_by, unit_type, unit_value) VALUES
('Organic Plant Food 500g', 'Concentrated organic fertilizer for household plants', 8.50, 'ORG-PLT-500G', 'Organic Fertilizers', 150, true, 'https://example.com/plant-food.jpg', 1, 'g', 500.000),
('Liquid Seaweed Extract 1L', 'Organic liquid fertilizer for foliar application', 15.00, 'LIQ-SEAWEED-1L', 'Organic Fertilizers', 80, true, 'https://example.com/seaweed.jpg', 1, 'l', 1.000),
('Growth Hormone 250ml', 'Plant growth regulator for better yields', 22.00, 'HORMONE-250ML', 'Growth Regulators', 50, true, 'https://example.com/hormone.jpg', 1, 'ml', 250.000),
('Seed Treatment Sachets', 'Individual sachets for seed treatment', 1.50, 'SEED-TREAT-SACHET', 'Seed Treatment', 1000, true, 'https://example.com/seed-treatment.jpg', 1, 'items', 1.000),
('Fertilizer Spreader Tool', 'Manual tool for fertilizer application', 35.00, 'TOOL-SPREADER-001', 'Tools', 25, true, 'https://example.com/spreader.jpg', 1, 'pcs', 1.000),
('Bio-Pesticide 100ml Bottle', 'Organic pest control solution', 12.50, 'BIO-PEST-100ML', 'Pesticides', 200, true, 'https://example.com/bio-pesticide.jpg', 1, 'ml', 100.000),
('Soil pH Test Kit', 'Testing kit for soil pH measurement', 18.00, 'TEST-PH-KIT-001', 'Testing Kits', 75, true, 'https://example.com/ph-test.jpg', 1, 'items', 1.000),
('Compost Accelerator 1kg Packet', 'Accelerates composting process', 9.50, 'COMPOST-ACC-1KG', 'Organic Fertilizers', 120, true, 'https://example.com/compost-acc.jpg', 1, 'packets', 1.000);
