import { updatePayrollInfo, getPayrollInfoById } from '../../../../../controllers/hrController'

export const dynamic = "force-dynamic"

export async function GET(request, context) {
  const userId = parseInt(context.params.id)
  return getPayrollInfoById(userId)
}

export async function PUT(request, context) {
  return updatePayrollInfo(request, context)
}
