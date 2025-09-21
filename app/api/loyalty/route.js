import { 
  listLoyaltyPrograms, 
  createNewLoyaltyProgram
} from "../../../controllers/loyaltyController.js"

export async function GET(request) {
  return await listLoyaltyPrograms(request)
}

export async function POST(request) {
  return await createNewLoyaltyProgram(request)
}
