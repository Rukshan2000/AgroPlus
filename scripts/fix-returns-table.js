import { query } from '../lib/db.js';

async function checkAndFixReturnsTable() {
  try {
    console.log('Checking product_returns table structure...\n');

    // Check column types
    const result = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'product_returns'
      ORDER BY ordinal_position
    `);

    console.log('Current columns:');
    console.log('================');
    result.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check if original_quantity is still INTEGER
    const quantityCols = result.rows.filter(col => 
      col.column_name === 'quantity_returned' || col.column_name === 'original_quantity'
    );

    console.log('\n\nQuantity columns:');
    console.log('================');
    quantityCols.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });

    // If original_quantity is INTEGER, fix it
    const needsFix = quantityCols.some(col => col.column_name === 'original_quantity' && col.data_type === 'integer');

    if (needsFix) {
      console.log('\n⚠️  original_quantity is still INTEGER - fixing now...\n');
      
      // Drop constraint
      await query('ALTER TABLE product_returns DROP CONSTRAINT IF EXISTS quantity_check');
      console.log('✅ Dropped quantity_check constraint');

      // Convert original_quantity
      await query('ALTER TABLE product_returns ALTER COLUMN original_quantity TYPE DECIMAL(10, 3)');
      console.log('✅ Converted original_quantity to DECIMAL(10, 3)');

      // Convert quantity_returned if needed
      const qtyReturned = quantityCols.find(col => col.column_name === 'quantity_returned');
      if (qtyReturned?.data_type === 'integer') {
        await query('ALTER TABLE product_returns ALTER COLUMN quantity_returned TYPE DECIMAL(10, 3)');
        console.log('✅ Converted quantity_returned to DECIMAL(10, 3)');
      }

      // Recreate constraint
      await query('ALTER TABLE product_returns ADD CONSTRAINT quantity_check CHECK (quantity_returned <= original_quantity)');
      console.log('✅ Recreated quantity_check constraint');

      console.log('\n✅ All fixes applied successfully!');
    } else {
      console.log('\n✅ Table structure is already correct');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAndFixReturnsTable();
