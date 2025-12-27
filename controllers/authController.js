import { comparePassword, hashPassword } from "../lib/hash"
import { getSession, createSession, destroySession } from "../lib/auth"
import { loginSchema, registerSchema } from "../lib/validators"
import { findUserByEmail, createUser } from "../models/userModel"
import { createWorkSession, endWorkSession, getCurrentWorkSession, createPayrollInfo } from "../models/hrModel"
import { getOrCreateCsrfToken, validateCsrf } from "../lib/csrf"
import { NextResponse } from "next/server"

export async function csrf() {
  const token = await getOrCreateCsrfToken()
  return NextResponse.json({ csrfToken: token })
}

export async function getMe() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 })
  }
  return NextResponse.json({ user: session.user }, { status: 200 })
}

export async function register(request) {
  const body = await request.json().catch(() => ({}))
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
  }
  const { email, password, name, role = "user", hourlyRate, position } = parsed.data
  const existing = await findUserByEmail(email)
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 })
  }
  const password_hash = await hashPassword(password)
  
  // Create user with specified role
  const user = await createUser({ email, password_hash, name, role })
  
  // Create payroll info if hourly rate is provided (for cashiers/employees)
  if (hourlyRate && (role === 'cashier' || role === 'user')) {
    try {
      await createPayrollInfo({
        user_id: user.id,
        hourly_rate: parseFloat(hourlyRate),
        position: position || 'Employee',
        hire_date: new Date().toISOString().split('T')[0]
      })
    } catch (error) {
      console.error('Error creating payroll info:', error)
      // Don't fail registration if payroll creation fails
    }
  }
  
  await createSession(user.id)
  // Ensure CSRF token is set for client
  await getOrCreateCsrfToken()
  return NextResponse.json(
    { user: { id: user.id, email: user.email, name: user.name, role: user.role, outlets: user.outlets || [] } },
    { status: 201 },
  )
}

export async function login(request) {
  const body = await request.json().catch(() => ({}))
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }
  const { email, password } = parsed.data
  const user = await findUserByEmail(email)
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }
  const ok = await comparePassword(password, user.password_hash)
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }
  await createSession(user.id)
  await getOrCreateCsrfToken()
  
  // Create work session for cashier users
  if (user.role === 'cashier') {
    try {
      // End any existing active session first (in case of unexpected logout)
      const existingSession = await getCurrentWorkSession(user.id)
      if (existingSession) {
        await endWorkSession(user.id, 'Auto-ended on new login')
      }
      
      // Create new work session
      await createWorkSession(user.id)
    } catch (error) {
      console.error('Error creating work session:', error)
      // Don't fail login if work session creation fails
    }
  }
  
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, outlets: user.outlets || [] } })
}

export async function logout(request) {
  // require CSRF for logout to prevent CSRF logouts
  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }
  
  // Get current session to check if user is cashier
  const session = await getSession()
  if (session && session.user.role === 'cashier') {
    try {
      // End work session for cashier
      await endWorkSession(session.user.id, 'Normal logout')
    } catch (error) {
      console.error('Error ending work session:', error)
      // Don't fail logout if work session end fails
    }
  }
  
  await destroySession()
  return NextResponse.json({ ok: true })
}
