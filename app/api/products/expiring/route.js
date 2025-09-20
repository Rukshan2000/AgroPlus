import { expiringProducts } from "@/controllers/productController"

export async function GET(request) {
  return await expiringProducts(request)
}
