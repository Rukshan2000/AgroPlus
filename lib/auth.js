import crypto from "crypto"
import { cookies } from "next/headers"
import { query } from "./db"
import { Roles } from "./rbac"

const SESSION_COOKIE = "session"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

function cookieOptions(expiresAt) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  }
}

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + SESSION_TTL_SECONDS * 1000)
  await query(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expires]
  )
  const store = await cookies()
  store.set(SESSION_COOKIE, token, cookieOptions(expires))
  return token
}

export async function destroySession() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) {
    await query('DELETE FROM sessions WHERE token = $1', [token])
    store.set(SESSION_COOKIE, "", { ...cookieOptions(new Date(0)), maxAge: 0 })
  }
}

export async function getSession() {
  try {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (!token) {
      return null
    }
    const result = await query(
      `SELECT u.id, u.email, u.name, u.role, u.theme_preference, s.expires_at as expires
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = $1
       LIMIT 1`,
      [token]
    )
    const user = result.rows[0]
    console.log('User from database:', user) // Debug log
    if (!user) {
      console.log('No user found for token') // Debug log
      return null
    }
    // Expiry check
    if (new Date(user.expires) < new Date()) {
      console.log('Session expired') // Debug log
      await query('DELETE FROM sessions WHERE token = $1', [token])
      const store = await cookies()
      store.set(SESSION_COOKIE, "", { ...cookieOptions(new Date(0)), maxAge: 0 })
      return null
    }
    console.log('Session valid, returning user') // Debug log
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        theme_preference: user.theme_preference,
      },
    }
  } catch (error) {
    console.error('Error in getSession:', error) // Debug log
    return null
  }
}

export function requireAuthOrThrow(session) {
  if (!session) {
    const err = new Error("Unauthorized")
    err.status = 401
    throw err
  }
}

export function requireRoleOrThrow(session, allowed = [Roles.admin]) {
  if (!session) {
    const err = new Error("Unauthorized")
    err.status = 401
    throw err
  }
  if (!allowed.includes(session.user.role)) {
    const err = new Error("Forbidden")
    err.status = 403
    throw err
  }
}
