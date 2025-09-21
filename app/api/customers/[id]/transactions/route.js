import { getCustomerTransactionHistory } from "../../../../../controllers/customerController.js"

export async function GET(request, context) {
  return await getCustomerTransactionHistory(request, context)
}
