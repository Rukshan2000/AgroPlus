#!/usr/bin/env node

/**
 * Create test sales data for testing the returns feature
 * Run with: node scripts/create-test-sales.js
 */

import { query } from '../lib/db.js';

async function createTestSales() {
  try {
    console.log('Creating test sales data...\n');

    // Get some products
    const productsResult = await query(`
      SELECT id, name, sku, selling_price, buying_price, available_quantity 
      FROM products 
      WHERE available_quantity > 0 
      LIMIT 5
    `);

    if (productsResult.rows.length === 0) {
      console.log('❌ No products found in database.');
      console.log('Please add some products first before creating test sales.\n');
      process.exit(1);
    }

    // Get a user (or use first admin/manager)
    const userResult = await query(`
      SELECT id, name 
      FROM users 
      WHERE role IN ('admin', 'manager', 'user') 
      LIMIT 1
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ No users found in database.');
      console.log('Please create a user first.\n');
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`Using user: ${user.name} (ID: ${user.id})\n`);

    // Create 10 test sales
    let salesCreated = 0;
    for (let i = 0; i < Math.min(10, productsResult.rows.length * 2); i++) {
      const product = productsResult.rows[i % productsResult.rows.length];
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
      const discountPercent = Math.random() > 0.7 ? Math.floor(Math.random() * 20) : 0; // 30% chance of discount
      
      const originalPrice = parseFloat(product.selling_price);
      const discountAmount = (originalPrice * discountPercent) / 100;
      const unitPrice = originalPrice - discountAmount;
      const totalAmount = unitPrice * quantity;
      
      // Use buying price from product
      const buyingPrice = parseFloat(product.buying_price || originalPrice * 0.7);
      const profitPerUnit = unitPrice - buyingPrice;
      const totalProfit = profitPerUnit * quantity;
      const profitMargin = originalPrice > 0 ? ((profitPerUnit / originalPrice) * 100) : 0;

      await query(`
        INSERT INTO sales (
          product_id, product_name, quantity, unit_price, original_price, 
          discount_percentage, discount_amount, total_amount, created_by,
          buying_price_at_sale, profit_per_unit, total_profit, profit_margin_percentage
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        product.id,
        product.name,
        quantity,
        unitPrice,
        originalPrice,
        discountPercent,
        discountAmount,
        totalAmount,
        user.id,
        buyingPrice,
        profitPerUnit,
        totalProfit,
        profitMargin
      ]);

      salesCreated++;
      console.log(`✅ Created sale: ${product.name} × ${quantity} = LKR ${totalAmount.toFixed(2)}`);
    }

    console.log(`\n✅ Successfully created ${salesCreated} test sales!`);
    console.log('\nYou can now test the returns feature in POS.\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating test sales:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createTestSales();
