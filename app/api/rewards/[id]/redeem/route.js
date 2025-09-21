import { redeemRewardForCustomer } from "../../../../../controllers/rewardController.js"

export async function POST(request, context) {
  return await redeemRewardForCustomer(request, context)
}
