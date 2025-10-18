import { exportCsv } from "@/controllers/productController"

export async function GET(request) {
  return exportCsv(request)
}
