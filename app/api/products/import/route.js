import { importCsv } from "@/controllers/productController"

export async function POST(request) {
  return importCsv(request)
}
