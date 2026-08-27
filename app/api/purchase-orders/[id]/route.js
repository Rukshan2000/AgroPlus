import { get, update, receive, cancel } from "../../../../controllers/purchaseOrderController"

export const dynamic = "force-dynamic"

export async function GET(request, { params }) {
  return get(request, { params })
}

export async function PUT(request, { params }) {
  return update(request, { params })
}

export async function POST(request, { params }) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'receive') {
    return receive(request, { params })
  } else if (action === 'cancel') {
    return cancel(request, { params })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}
