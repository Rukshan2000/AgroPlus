-- Fix categories.created_by column type to match users.id
-- This migration fixes the type mismatch between categories.created_by (TEXT) and users.id (INTEGER)

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_created_by_fkey;

-- Convert the created_by column from TEXT to INTEGER
-- First we need to handle any existing data
UPDATE categories SET created_by = NULL WHERE created_by IS NOT NULL AND NOT (created_by ~ '^[0-9]+$');

-- Now change the column type
ALTER TABLE categories ALTER COLUMN created_by TYPE INTEGER USING created_by::INTEGER;

-- Re-add the foreign key constraint
ALTER TABLE categories ADD CONSTRAINT categories_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
