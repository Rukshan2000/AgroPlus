import * as priceVariationController from "@/controllers/priceVariationController"

export async function GET(request, { params }) {
  const { variationId } = params
  return await priceVariationController.getById(request, parseInt(variationId))
}

export async function PUT(request, { params }) {
  const { variationId } = params
  return await priceVariationController.update(request, parseInt(variationId))
}

export async function DELETE(request, { params }) {
  const { variationId } = params
  return await priceVariationController.remove(request, parseInt(variationId))
}
