import { getById, update, remove } from "../../../../controllers/productController"

export const dynamic = "force-dynamic"

export async function GET(request, { params }) {
  return getById(request, { params })
}

export async function PUT(request, { params }) {
  return update(request, { params })
}

export async function DELETE(request, { params }) {
  return remove(request, { params })
}
