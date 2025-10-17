import * as priceVariationController from "@/controllers/priceVariationController"

export async function GET(request, { params }) {
  const { id } = params
  return await priceVariationController.getDefault(request, parseInt(id))
}
