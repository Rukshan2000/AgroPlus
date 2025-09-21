import { 
  getReward, 
  updateRewardDetails
} from "../../../../controllers/rewardController.js"

export async function GET(request, context) {
  return await getReward(request, context)
}

export async function PUT(request, context) {
  return await updateRewardDetails(request, context)
}
