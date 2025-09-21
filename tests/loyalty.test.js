import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { 
  createCustomer, 
  findCustomerById, 
  addPointsToCustomer,
  searchCustomers 
} from '../models/customerModel.js'
import { 
  createLoyaltyProgram,
  findLoyaltyProgramById 
} from '../models/loyaltyProgramModel.js'
import { getDb } from '../lib/db.js'

describe('Loyalty System', () => {
  let db
  let testProgram
  let testCustomer

  beforeAll(async () => {
    db = getDb()
    
    // Create a test loyalty program
    testProgram = await createLoyaltyProgram({
      name: 'Test Program',
      description: 'A test loyalty program',
      points_per_dollar: 2.0,
      signup_bonus: 100,
      min_redemption_threshold: 50,
      is_active: true
    })
  })

  afterAll(async () => {
    // Clean up test data
    if (testCustomer) {
      await db.query('DELETE FROM loyalty_transactions WHERE customer_id = $1', [testCustomer.id])
      await db.query('DELETE FROM customers WHERE id = $1', [testCustomer.id])
    }
    if (testProgram) {
      await db.query('DELETE FROM loyalty_programs WHERE id = $1', [testProgram.id])
    }
    await db.end()
  })

  it('should create a loyalty program', async () => {
    expect(testProgram).toBeDefined()
    expect(testProgram.name).toBe('Test Program')
    expect(testProgram.points_per_dollar).toBe(2.0)
    expect(testProgram.signup_bonus).toBe(100)
  })

  it('should find loyalty program by id', async () => {
    const found = await findLoyaltyProgramById(testProgram.id)
    expect(found).toBeDefined()
    expect(found.name).toBe('Test Program')
  })

  it('should create a customer with signup bonus', async () => {
    testCustomer = await createCustomer({
      first_name: 'Test',
      last_name: 'Customer',
      email: 'test@example.com',
      phone: '+1234567890',
      loyalty_program_id: testProgram.id
    })

    expect(testCustomer).toBeDefined()
    expect(testCustomer.first_name).toBe('Test')
    expect(testCustomer.last_name).toBe('Customer')
    expect(testCustomer.email).toBe('test@example.com')
    expect(testCustomer.loyalty_program_id).toBe(testProgram.id)
  })

  it('should find customer by id', async () => {
    const found = await findCustomerById(testCustomer.id)
    expect(found).toBeDefined()
    expect(found.first_name).toBe('Test')
    expect(found.program_name).toBe('Test Program')
  })

  it('should search customers', async () => {
    const results = await searchCustomers('Test')
    expect(results).toHaveLength(1)
    expect(results[0].first_name).toBe('Test')
  })

  it('should add points to customer', async () => {
    const result = await addPointsToCustomer(
      testCustomer.id, 
      50, 
      'Test purchase'
    )

    expect(result).toBeDefined()
    expect(result.transaction).toBeDefined()
    expect(result.transaction.points).toBe(50)
    expect(result.transaction.type).toBe('earn')

    // Verify customer balance updated
    const updated = await findCustomerById(testCustomer.id)
    expect(updated.points_balance).toBe(50)
    expect(updated.total_points_earned).toBe(50)
  })
})
