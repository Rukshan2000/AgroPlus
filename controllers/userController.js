import { getSession, requireRoleOrThrow } from "../lib/auth"
import { listUsers, updateUserRole } from "../models/userModel"
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
  try {
    requireRoleOrThrow(session, ["admin"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }
  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
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
