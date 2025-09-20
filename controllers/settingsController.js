import { getSession, requireAuthOrThrow } from "../lib/auth"
import { themeSchema } from "../lib/validators"
import { updateUserTheme } from "../models/userModel"
import { validateCsrf } from "../lib/csrf"
import { NextResponse } from "next/server"

export async function updateTheme(request) {
  const session = await getSession()
  try {
    requireAuthOrThrow(session)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 401 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = themeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid theme" }, { status: 400 })
  }

  const updated = await updateUserTheme(session.user.id, parsed.data.theme)
  return NextResponse.json({ user: updated })
}
