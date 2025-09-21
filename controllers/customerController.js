import { getSession, requireRoleOrThrow } from "../lib/auth.js"
import { 
  findAllCustomersPaginated, 
  findCustomerById, 
  findCustomerByEmail,
  findCustomerByPhone,
  createCustomer, 
  updateCustomer,
  adjustCustomerPoints,
  getCustomerTransactions,
  searchCustomers
} from "../models/customerModel.js"
import { validateCsrf } from "../lib/csrf.js"
import { NextResponse } from "next/server"

// Get all customers with pagination and search
export async function listCustomers(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "cashier"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page')) || 1
  const limit = parseInt(searchParams.get('limit')) || 20
  const search = searchParams.get('search') || ''

  try {
    const result = await findAllCustomersPaginated({ page, limit, search })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error listing customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

// Create new customer
export async function createNewCustomer(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "cashier"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { first_name, last_name, email, phone, loyalty_program_id } = body

    // Validate required fields
    if (!first_name || !last_name) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 })
    }

    // Check for duplicate email or phone
    if (email) {
      const existingByEmail = await findCustomerByEmail(email)
      if (existingByEmail) {
        return NextResponse.json({ error: 'Customer with this email already exists' }, { status: 400 })
      }
    }

    if (phone) {
      const existingByPhone = await findCustomerByPhone(phone)
      if (existingByPhone) {
        return NextResponse.json({ error: 'Customer with this phone number already exists' }, { status: 400 })
      }
    }

    const customer = await createCustomer({ first_name, last_name, email, phone, loyalty_program_id })
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}

// Get customer details
export async function getCustomer(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "cashier"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const id = parseInt(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
  }

  try {
    const customer = await findCustomerById(id)
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
}

// Update customer
export async function updateCustomerDetails(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  const id = parseInt(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { first_name, last_name, email, phone, loyalty_program_id } = body

    // Check if customer exists
    const existingCustomer = await findCustomerById(id)
    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Check for duplicate email or phone (excluding current customer)
    if (email && email !== existingCustomer.email) {
      const existingByEmail = await findCustomerByEmail(email)
      if (existingByEmail && existingByEmail.id !== id) {
        return NextResponse.json({ error: 'Another customer with this email already exists' }, { status: 400 })
      }
    }

    if (phone && phone !== existingCustomer.phone) {
      const existingByPhone = await findCustomerByPhone(phone)
      if (existingByPhone && existingByPhone.id !== id) {
        return NextResponse.json({ error: 'Another customer with this phone number already exists' }, { status: 400 })
      }
    }

    const customer = await updateCustomer(id, { first_name, last_name, email, phone, loyalty_program_id })
    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

// Get customer transaction history
export async function getCustomerTransactionHistory(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "cashier"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const id = parseInt(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page')) || 1
  const limit = parseInt(searchParams.get('limit')) || 20

  try {
    const result = await getCustomerTransactions(id, { page, limit })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching customer transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch customer transactions' }, { status: 500 })
  }
}

// Adjust customer points (admin/manager only)
export async function adjustPoints(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  const id = parseInt(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { points, reason } = body

    if (typeof points !== 'number' || points === 0) {
      return NextResponse.json({ error: 'Points must be a non-zero number' }, { status: 400 })
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason is required for point adjustments' }, { status: 400 })
    }

    // Check if customer exists
    const customer = await findCustomerById(id)
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const result = await adjustCustomerPoints(id, points, reason.trim(), session.user.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error adjusting customer points:', error)
    if (error.message === 'Insufficient points balance') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to adjust customer points' }, { status: 500 })
  }
}

// Search customers (for POS and quick lookups)
export async function searchCustomersEndpoint(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager", "cashier"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const { searchParams } = new URL(request.url)
  const searchTerm = searchParams.get('q') || searchParams.get('search') || ''

  if (searchTerm.length < 2) {
    return NextResponse.json({ customers: [] })
  }

  try {
    const customers = await searchCustomers(searchTerm)
    return NextResponse.json({ customers })
  } catch (error) {
    console.error('Error searching customers:', error)
    return NextResponse.json({ error: 'Failed to search customers' }, { status: 500 })
  }
}
