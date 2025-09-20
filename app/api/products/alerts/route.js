import { alerts } from "@/controllers/productController"

export async function GET(request) {
  return await alerts(request)
}
