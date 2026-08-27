-- Fix categories.created_by column type to match users.id
-- This migration fixes the type mismatch between categories.created_by (TEXT) and users.id (INTEGER)
-- No-op if the column is already INTEGER (e.g. created fresh via the corrected 005_categories.sql)

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'categories' AND column_name = 'created_by') = 'text' THEN

    ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_created_by_fkey;

    UPDATE categories SET created_by = NULL WHERE created_by IS NOT NULL AND NOT (created_by ~ '^[0-9]+$');

    ALTER TABLE categories ALTER COLUMN created_by TYPE INTEGER USING created_by::INTEGER;

    ALTER TABLE categories ADD CONSTRAINT categories_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;
