import { list, create, read, update, remove, getByProduct, getByOutlet, getStats, getTotalByProduct, getTotalByOutlet } from "@/controllers/productDistributeController"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  switch (action) {
    case "read":
      return read(request)
    case "byProduct":
      return getByProduct(request)
    case "byOutlet":
      return getByOutlet(request)
    case "stats":
      return getStats(request)
    case "totalByProduct":
      return getTotalByProduct(request)
    case "totalByOutlet":
      return getTotalByOutlet(request)
    default:
      return list(request)
  }
}

export async function POST(request) {
  return create(request)
}

export async function PUT(request) {
  return update(request)
}

export async function DELETE(request) {
  return remove(request)
}
