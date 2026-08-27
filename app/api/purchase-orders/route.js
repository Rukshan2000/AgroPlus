import { list, create } from "../../../controllers/purchaseOrderController"

export const dynamic = "force-dynamic"

export async function GET(request) {
  return list(request)
}

export async function POST(request) {
  return create(request)
}
