import { restockHistory } from "@/controllers/productController"

export async function GET(request, { params }) {
  return await restockHistory(request, { params })
}
