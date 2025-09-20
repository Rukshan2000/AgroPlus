-- Agriculture Fertilizer Categories
INSERT INTO categories (name, description, color, is_active, created_by) VALUES
('Nitrogen Fertilizers', 'Fertilizers rich in nitrogen like Urea, Ammonium Nitrate', '#3B82F6', true, '1'),
('Phosphate Fertilizers', 'Fertilizers containing phosphorus such as DAP, SSP', '#8B5CF6', true, '1'),
('Potash Fertilizers', 'Fertilizers with potassium like MOP, SOP', '#10B981', true, '1'),
('Complex Fertilizers', 'Blended fertilizers containing NPK combinations', '#F59E0B', true, '1'),
('Organic Fertilizers', 'Compost, manure, bio-fertilizers, natural soil enhancers', '#EF4444', true, '1'),
('Micronutrient Fertilizers', 'Zinc, Boron, Iron, Manganese, Copper fertilizers', '#6B7280', true, '1'),
('Specialty Fertilizers', 'Water-soluble, slow-release, liquid fertilizers', '#EC4899', true, '1'),
('Soil Conditioners', 'Gypsum, lime, and other soil improvement products', '#84CC16', true, '1')
ON CONFLICT (name) DO NOTHING;
