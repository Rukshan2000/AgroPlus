import crypto from "crypto"
import { cookies } from "next/headers"

// CSRF double-submit token
const CSRF_COOKIE = "csrf_token"

export async function getOrCreateCsrfToken() {
  const store = await cookies()
  let token = store.get(CSRF_COOKIE)?.value
  if (!token) {
    token = crypto.randomBytes(24).toString("hex")
    // Not HttpOnly so client can read and send back; Lax for safety
    store.set(CSRF_COOKIE, token, {
      httpOnly: false,
      sameSite: "lax",
      secure: false, // Allow HTTP for server access
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    })
  }
  return token
}

export async function validateCsrf(requestHeaders) {
  const store = await cookies()
  const cookieToken = store.get(CSRF_COOKIE)?.value
  const headerToken = requestHeaders.get("x-csrf-token") || requestHeaders.get("X-CSRF-Token")
  return cookieToken && headerToken && cookieToken === headerToken
}
