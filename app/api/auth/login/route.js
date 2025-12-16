import { login } from "../../../../controllers/authController"

export const dynamic = "force-dynamic"
export const maxDuration = 60
export const runtime = 'nodejs'

export async function POST(request) {
  return login(request)
}

