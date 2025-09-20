import { activeNames } from "../../../../controllers/categoryController"

export const dynamic = "force-dynamic"

export async function GET() {
  return activeNames()
}
