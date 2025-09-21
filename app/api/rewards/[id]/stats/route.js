import { getRewardStatistics } from "../../../../../controllers/rewardController.js"

export async function GET(request, context) {
  return await getRewardStatistics(request, context)
}
