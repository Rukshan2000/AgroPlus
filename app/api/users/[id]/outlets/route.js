import { updateOutlets } from "@/controllers/userController"

export async function PUT(request, { params }) {
  return updateOutlets(request, { params })
}
