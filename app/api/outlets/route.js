import { list, create, read, update, remove, getActive } from "@/controllers/outletController"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'active') {
    return getActive(request)
  }

  if (action === 'read') {
    return read(request)
  }

  return list(request)
}

export async function POST(request) {
  return create(request)
}

export async function PUT(request) {
  return update(request)
}

export async function DELETE(request) {
  return remove(request)
}
