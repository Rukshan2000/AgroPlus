#!/bin/bash

# Verification script for Product Distribution Deduction Setup
# Run this after deploying the changes

echo "==========================================="
echo "Product Distribution Deduction Verification"
echo "==========================================="
echo ""

# Check database migration
echo "1. Checking database column..."
psql -U ${DB_USER:-postgres} -d ${DB_NAME:-saas_app} -c "
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name='product_distribute' 
ORDER BY ordinal_position;" 2>/dev/null || echo "⚠️  Unable to connect to database"

echo ""
echo "2. Checking for test distribution records..."
psql -U ${DB_USER:-postgres} -d ${DB_NAME:-saas_app} -c "
SELECT id, product_id, outlet_id, quantity_distributed, available_quantity 
FROM product_distribute 
LIMIT 5;" 2>/dev/null || echo "⚠️  Unable to query distribution records"

echo ""
echo "3. Checking for deduct API endpoint..."
if grep -q "deductDistributionQuantity" app/api/product-distribute/deduct/route.js 2>/dev/null; then
    echo "✅ API endpoint found: app/api/product-distribute/deduct/route.js"
else
    echo "❌ API endpoint not found"
fi

echo ""
echo "4. Checking sales route integration..."
if grep -q "deductDistributionQuantity" app/api/sales/route.js 2>/dev/null; then
    echo "✅ Sales integration found"
else
    echo "❌ Sales integration missing"
fi

echo ""
echo "5. Checking model function..."
if grep -q "export async function deductDistributionQuantity" models/productDistributeModel.js 2>/dev/null; then
    echo "✅ Model function found"
else
    echo "❌ Model function missing"
fi

echo ""
echo "==========================================="
echo "Setup Complete!"
echo "==========================================="
echo ""
echo "Test the deduction endpoint:"
echo "curl -X GET 'http://localhost:3000/api/product-distribute/deduct?product_id=1&outlet_id=1'"
echo ""
echo "Manually deduct quantity:"
echo "curl -X POST http://localhost:3000/api/product-distribute/deduct \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"product_id\": 1, \"outlet_id\": 1, \"quantity\": 5}'"
