import { 
  listRewards, 
  createNewReward
} from "../../../controllers/rewardController.js"

export async function GET(request) {
  return await listRewards(request)
}

export async function POST(request) {
  return await createNewReward(request)
}
