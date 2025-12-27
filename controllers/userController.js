import { getSession, requireRoleOrThrow } from "../lib/auth"
import { listUsers, updateUserRole, updateUserOutlets } from "../models/userModel"
import { updateRoleSchema } from "../lib/validators"
import { validateCsrf } from "../lib/csrf"
import { NextResponse } from "next/server"

export async function list() {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }
  const users = await listUsers()
  return NextResponse.json({ users })
}

export async function changeRole(request, { params }) {
  const session = await getSession()
  
  // Check if user is logged in
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized - Please login" }, { status: 401 })
  }
  
  // Check if user is admin
  try {
    requireRoleOrThrow(session, ["admin"])
  } catch (e) {
    return NextResponse.json({ 
      error: `Forbidden - ${e.message}. Only admin users can change roles.`,
      currentRole: session.user.role 
    }, { status: e.status || 403 })
  }
  
  // Validate CSRF token
  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token - Please refresh the page" }, { status: 403 })
  }
  
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid user id" }, { status: 400 })
  const body = await request.json().catch(() => ({}))
  const parsed = updateRoleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }
  const updated = await updateUserRole(id, parsed.data.role)
  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
  return NextResponse.json({ user: updated })
}

export async function updateOutlets(request, { params }) {
  const session = await getSession()
  
  // Check if user is logged in
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized - Please login" }, { status: 401 })
  }
  
  // Check if user is admin or manager
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ 
      error: `Forbidden - ${e.message}. Only admin/manager users can assign outlets.`,
      currentRole: session.user.role 
    }, { status: e.status || 403 })
  }
  
  // Validate CSRF token
  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token - Please refresh the page" }, { status: 403 })
  }
  
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid user id" }, { status: 400 })
  
  const body = await request.json().catch(() => ({}))
  
  // Validate outlets array
  if (!Array.isArray(body.outlets)) {
    return NextResponse.json({ error: "Outlets must be an array" }, { status: 400 })
  }
  
  // Validate all outlet IDs are numbers
  if (!body.outlets.every(id => Number.isInteger(id))) {
    return NextResponse.json({ error: "All outlet IDs must be valid integers" }, { status: 400 })
  }
  
  const updated = await updateUserOutlets(id, body.outlets)
  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
  return NextResponse.json({ user: updated })
}

