import { 
  getLoyaltyProgram, 
  updateLoyaltyProgramDetails,
  deactivateProgram
} from "../../../../controllers/loyaltyController.js"

export async function GET(request, context) {
  return await getLoyaltyProgram(request, context)
}

export async function PUT(request, context) {
  return await updateLoyaltyProgramDetails(request, context)
}

export async function DELETE(request, context) {
  return await deactivateProgram(request, context)
}
