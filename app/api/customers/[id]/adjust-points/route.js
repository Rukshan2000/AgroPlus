import { adjustPoints } from "../../../../../controllers/customerController.js"

export async function POST(request, context) {
  return await adjustPoints(request, context)
}
