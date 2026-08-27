import { get, update, deleteSupplierHandler } from "../../../../controllers/supplierController"

export const dynamic = "force-dynamic"

export async function GET(request, { params }) {
  return get(request, { params })
}

export async function PUT(request, { params }) {
  return update(request, { params })
}

export async function DELETE(request, { params }) {
  return deleteSupplierHandler(request, { params })
}
