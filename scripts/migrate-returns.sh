#!/bin/bash

# Quick migration script for returns feature
# This script runs the SQL directly using psql

# Check if NEXT_PUBLIC_SUPABASE_URL is set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ ERROR: NEXT_PUBLIC_SUPABASE_URL environment variable is not set"
    echo ""
    echo "Please set NEXT_PUBLIC_SUPABASE_URL first:"
    echo "  export NEXT_PUBLIC_SUPABASE_URL='postgresql://user:password@host:port/database'"
    echo ""
    echo "Or run with:"
    echo "  NEXT_PUBLIC_SUPABASE_URL='your_connection_string' ./scripts/migrate-returns.sh"
    exit 1
fi

echo "🚀 Starting returns table migration..."
echo ""

# Run the SQL file
psql "$NEXT_PUBLIC_SUPABASE_URL" -f scripts/sql/create-returns-table.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Verifying table structure..."
    psql "$NEXT_PUBLIC_SUPABASE_URL" -c "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name = 'product_returns' ORDER BY ordinal_position;"
else
    echo ""
    echo "❌ Migration failed!"
    exit 1
fi
