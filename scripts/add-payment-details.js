import 'dotenv/config'
import { query } from '../lib/db.js'

/**
 * Migration: Add payment details to sales table
 * Adds columns for payment method, amount paid, and change
 */
async function addPaymentDetailsToSales() {
  console.log('Starting migration: Add payment details to sales table...')

  try {
    console.log('Checking for existing columns...')
    
    // Check if columns already exist
    const checkColumns = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sales' 
      AND column_name IN ('payment_method', 'amount_paid', 'change_given')
    `)

    console.log(`Found ${checkColumns.rows.length} existing columns`)

    if (checkColumns.rows.length > 0) {
      console.log('Payment columns already exist:')
      checkColumns.rows.forEach(row => console.log(`  - ${row.column_name}`))
      console.log('Skipping migration')
      return
    }

    console.log('Adding payment columns...')
    
    // Add payment columns to sales table
    await query(`
      ALTER TABLE sales
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash',
      ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS change_given DECIMAL(10, 2) DEFAULT 0
    `)

    console.log('✓ Added payment_method column (cash/card)')
    console.log('✓ Added amount_paid column')
    console.log('✓ Added change_given column')

    console.log('Adding payment method constraint...')
    
    // Add check constraint to ensure valid payment methods
    try {
      await query(`
        ALTER TABLE sales
        ADD CONSTRAINT check_payment_method 
        CHECK (payment_method IN ('cash', 'card'))
      `)
      console.log('✓ Added payment method constraint')
    } catch (constraintError) {
      if (constraintError.message.includes('already exists')) {
        console.log('✓ Payment method constraint already exists')
      } else {
        throw constraintError
      }
    }

    console.log('Updating existing sales records...')
    
    // Update existing sales to have default payment data
    const updateResult = await query(`
      UPDATE sales
      SET 
        payment_method = 'cash',
        amount_paid = total_amount,
        change_given = 0
      WHERE payment_method IS NULL
    `)

    console.log(`✓ Updated ${updateResult.rowCount} existing sales with default payment data`)

    console.log('Creating indexes...')
    
    // Create index for faster payment method queries
    await query(`
      CREATE INDEX IF NOT EXISTS idx_sales_payment_method 
      ON sales(payment_method)
    `)

    console.log('✓ Created index on payment_method')

    // Create index for payment analytics
    await query(`
      CREATE INDEX IF NOT EXISTS idx_sales_created_payment 
      ON sales(created_at, payment_method)
    `)

    console.log('✓ Created composite index for payment analytics')

    console.log('\n✅ Migration completed successfully!')
    console.log('\nSales table now includes:')
    console.log('  - payment_method: cash or card')
    console.log('  - amount_paid: actual amount customer paid')
    console.log('  - change_given: change returned to customer')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('Full error:', error)
    throw error
  }
}

// Run migration if called directly
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Check if script is being run directly
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]

if (isMainModule) {
  console.log('Running migration...')
  addPaymentDetailsToSales()
    .then(() => {
      console.log('\n✅ All migrations completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error)
      process.exit(1)
    })
}

export default addPaymentDetailsToSales
