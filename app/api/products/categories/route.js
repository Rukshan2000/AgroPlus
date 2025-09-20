import { categories } from "../../../../controllers/productController"

export const dynamic = "force-dynamic"

export async function GET() {
  return categories()
}
