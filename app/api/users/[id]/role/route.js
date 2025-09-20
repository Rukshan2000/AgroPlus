import { changeRole } from "../../../../controllers/userController"

export const dynamic = "force-dynamic"

export async function PATCH(request, context) {
  return changeRole(request, context)
}
