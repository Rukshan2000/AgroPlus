import { getLoyaltyProgramStatistics } from "../../../../../controllers/loyaltyController.js"

export async function GET(request, context) {
  return await getLoyaltyProgramStatistics(request, context)
}
