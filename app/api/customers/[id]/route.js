import { 
  getCustomer, 
  updateCustomerDetails
} from "../../../../controllers/customerController.js"

export async function GET(request, context) {
  return await getCustomer(request, context)
}

export async function PUT(request, context) {
  return await updateCustomerDetails(request, context)
}
