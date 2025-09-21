import { getSession, requireRoleOrThrow } from "../lib/auth.js"
import { 
  findAllLoyaltyPrograms,
  findActiveLoyaltyPrograms,
  findLoyaltyProgramById,
  createLoyaltyProgram,
  updateLoyaltyProgram,
  getLoyaltyProgramStats,
  deactivateLoyaltyProgram
} from "../models/loyaltyProgramModel.js"
import { validateCsrf } from "../lib/csrf.js"
import { NextResponse } from "next/server"

// Get all loyalty programs
export async function listLoyaltyPrograms(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get('active') === 'true'

  try {
    const programs = activeOnly ? 
      await findActiveLoyaltyPrograms() : 
      await findAllLoyaltyPrograms()
    return NextResponse.json({ programs })
  } catch (error) {
    console.error('Error listing loyalty programs:', error)
    return NextResponse.json({ error: 'Failed to fetch loyalty programs' }, { status: 500 })
  }
}

// Create new loyalty program
export async function createNewLoyaltyProgram(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { 
      name, 
      description, 
      points_per_dollar, 
      signup_bonus, 
      min_redemption_threshold,
      is_active 
    } = body

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Program name is required' }, { status: 400 })
    }

    if (points_per_dollar !== undefined && (points_per_dollar < 0 || points_per_dollar > 100)) {
      return NextResponse.json({ error: 'Points per dollar must be between 0 and 100' }, { status: 400 })
    }

    if (signup_bonus !== undefined && signup_bonus < 0) {
      return NextResponse.json({ error: 'Signup bonus cannot be negative' }, { status: 400 })
    }

    if (min_redemption_threshold !== undefined && min_redemption_threshold < 1) {
      return NextResponse.json({ error: 'Minimum redemption threshold must be at least 1' }, { status: 400 })
    }

    const program = await createLoyaltyProgram({
      name: name.trim(),
      description: description?.trim(),
      points_per_dollar,
      signup_bonus,
      min_redemption_threshold,
      is_active
    })

    return NextResponse.json(program, { status: 201 })
  } catch (error) {
    console.error('Error creating loyalty program:', error)
    return NextResponse.json({ error: 'Failed to create loyalty program' }, { status: 500 })
  }
}

// Get loyalty program details
export async function getLoyaltyProgram(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const id = parseInt(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid program ID" }, { status: 400 })
  }

  try {
    const program = await findLoyaltyProgramById(id)
    if (!program) {
      return NextResponse.json({ error: 'Loyalty program not found' }, { status: 404 })
    }
    return NextResponse.json(program)
  } catch (error) {
    console.error('Error fetching loyalty program:', error)
    return NextResponse.json({ error: 'Failed to fetch loyalty program' }, { status: 500 })
  }
}

// Update loyalty program
export async function updateLoyaltyProgramDetails(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  const id = parseInt(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid program ID" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { 
      name, 
      description, 
      points_per_dollar, 
      signup_bonus, 
      min_redemption_threshold,
      is_active 
    } = body

    // Check if program exists
    const existingProgram = await findLoyaltyProgramById(id)
    if (!existingProgram) {
      return NextResponse.json({ error: 'Loyalty program not found' }, { status: 404 })
    }

    // Validate fields
    if (name !== undefined && name.trim().length === 0) {
      return NextResponse.json({ error: 'Program name cannot be empty' }, { status: 400 })
    }

    if (points_per_dollar !== undefined && (points_per_dollar < 0 || points_per_dollar > 100)) {
      return NextResponse.json({ error: 'Points per dollar must be between 0 and 100' }, { status: 400 })
    }

    if (signup_bonus !== undefined && signup_bonus < 0) {
      return NextResponse.json({ error: 'Signup bonus cannot be negative' }, { status: 400 })
    }

    if (min_redemption_threshold !== undefined && min_redemption_threshold < 1) {
      return NextResponse.json({ error: 'Minimum redemption threshold must be at least 1' }, { status: 400 })
    }

    const program = await updateLoyaltyProgram(id, {
      name: name?.trim(),
      description: description?.trim(),
      points_per_dollar,
      signup_bonus,
      min_redemption_threshold,
      is_active
    })

    return NextResponse.json(program)
  } catch (error) {
    console.error('Error updating loyalty program:', error)
    return NextResponse.json({ error: 'Failed to update loyalty program' }, { status: 500 })
  }
}

// Get loyalty program statistics
export async function getLoyaltyProgramStatistics(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const id = parseInt(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid program ID" }, { status: 400 })
  }

  try {
    const stats = await getLoyaltyProgramStats(id)
    if (!stats) {
      return NextResponse.json({ error: 'Loyalty program not found' }, { status: 404 })
    }
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching loyalty program stats:', error)
    return NextResponse.json({ error: 'Failed to fetch loyalty program statistics' }, { status: 500 })
  }
}

// Deactivate loyalty program
export async function deactivateProgram(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  const id = parseInt(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid program ID" }, { status: 400 })
  }

  try {
    const program = await deactivateLoyaltyProgram(id)
    if (!program) {
      return NextResponse.json({ error: 'Loyalty program not found' }, { status: 404 })
    }
    return NextResponse.json(program)
  } catch (error) {
    console.error('Error deactivating loyalty program:', error)
    return NextResponse.json({ error: 'Failed to deactivate loyalty program' }, { status: 500 })
  }
}
