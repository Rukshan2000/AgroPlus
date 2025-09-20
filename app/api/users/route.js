import { list } from "../../../controllers/userController"

export const dynamic = "force-dynamic"

export async function GET() {
  return list()
}
