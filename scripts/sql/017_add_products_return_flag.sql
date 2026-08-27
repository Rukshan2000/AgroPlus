-- Add missing "return" (allow-return) flag on products, referenced by productModel.js
-- but never added by an existing migration.
ALTER TABLE products ADD COLUMN IF NOT EXISTS "return" BOOLEAN NOT NULL DEFAULT true;
