import { units } from "../../../../controllers/productController"

export async function GET(request) {
  return units(request)
}
