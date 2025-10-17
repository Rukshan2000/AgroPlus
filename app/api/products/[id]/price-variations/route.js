import * as priceVariationController from "@/controllers/priceVariationController"

export async function GET(request, { params }) {
  const { id } = params
  return await priceVariationController.listByProduct(request, parseInt(id))
}

export async function POST(request, { params }) {
  const { id } = params
  const { searchParams } = new URL(request.url)
  const bulk = searchParams.get('bulk') === 'true'
  
  if (bulk) {
    return await priceVariationController.bulkCreate(request, parseInt(id))
  }
  
  return await priceVariationController.create(request, parseInt(id))
}
