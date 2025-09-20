import { restock } from "@/controllers/productController"

export async function POST(request, { params }) {
  return await restock(request, { params })
}
