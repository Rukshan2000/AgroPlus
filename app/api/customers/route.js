import { 
  listCustomers, 
  createNewCustomer, 
  getCustomer, 
  updateCustomerDetails,
  getCustomerTransactionHistory,
  adjustPoints,
  searchCustomersEndpoint
} from "../../../controllers/customerController.js"

export async function GET(request, context) {
  // Check if it's a search request
  const { searchParams } = new URL(request.url)
  if (searchParams.has('q') || searchParams.has('search')) {
    return await searchCustomersEndpoint(request)
  }
  
  return await listCustomers(request)
}

export async function POST(request) {
  return await createNewCustomer(request)
}
