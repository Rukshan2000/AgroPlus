-- Outlets table and related user columns, referenced by outletModel.js/userModel.js
-- but never added by a checked-in migration (only existed on the live DB).

CREATE TABLE IF NOT EXISTS outlets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  location VARCHAR(255),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  manager VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outlets_is_active ON outlets(is_active);
CREATE INDEX IF NOT EXISTS idx_outlets_created_by ON outlets(created_by);

ALTER TABLE users ADD COLUMN IF NOT EXISTS outlets JSONB NOT NULL DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS barcode_id TEXT;
