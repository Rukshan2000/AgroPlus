import { bulkDelete } from "@/controllers/productController"

export async function POST(request) {
  return bulkDelete(request)
}
