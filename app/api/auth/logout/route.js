import { logout } from "../../../../controllers/authController"

export const dynamic = "force-dynamic"

export async function POST(request) {
  return logout(request)
}
