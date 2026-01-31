import { getSession, requireRoleOrThrow } from "../lib/auth"
import { 
  listOutlets, 
  createOutlet, 
  findOutletById, 
  updateOutlet, 
  deleteOutlet,
  findOutletByName,
  getActiveOutlets
} from "../models/outletModel"
import { validateCsrf } from "../lib/csrf"
import { NextResponse } from "next/server"
import { z } from "zod"

const outletSchema = z.object({
  name: z.string().min(1, "Outlet name is required").max(255),
  location: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  manager: z.string().optional(),
  is_active: z.boolean().default(true)
})

const updateOutletSchema = outletSchema.partial()

export async function list(request) {
  const session = await getSession()
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')
    const limit = searchParams.get('limit') 
    const search = searchParams.get('search')
    const is_active = searchParams.get('is_active')
    
    const result = await listOutlets({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search,
      is_active: is_active !== null ? is_active === 'true' : undefined
    })
    return Response.json(result)
  } catch (error) {
    console.error('Error in outlets list:', error)
    return Response.json({ error: 'Failed to fetch outlets' }, { status: 500 })
  }
}

export async function create(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
  }

  try {
    const data = await request.json()
    const validated = outletSchema.parse(data)

    // Check if outlet name already exists
    const existing = await findOutletByName(validated.name)
    if (existing) {
      return NextResponse.json(
        { error: 'An outlet with this name already exists' },
        { status: 400 }
      )
    }

    const outlet = await createOutlet({
      ...validated,
      created_by: session.user.email
    })

    return NextResponse.json(outlet, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating outlet:', error)
    return NextResponse.json({ error: 'Failed to create outlet' }, { status: 500 })
  }
}

export async function read(request) {
  const session = await getSession()
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return Response.json({ error: 'Outlet ID is required' }, { status: 400 })
    }

    const outlet = await findOutletById(parseInt(id))
    if (!outlet) {
      return Response.json({ error: 'Outlet not found' }, { status: 404 })
    }

    return Response.json(outlet)
  } catch (error) {
    console.error('Error reading outlet:', error)
    return Response.json({ error: 'Failed to read outlet' }, { status: 500 })
  }
}

export async function update(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
  }

  try {
    const data = await request.json()
    const { id, ...updates } = data

    if (!id) {
      return NextResponse.json({ error: 'Outlet ID is required' }, { status: 400 })
    }

    const outlet = await findOutletById(parseInt(id))
    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })
    }

    const validated = updateOutletSchema.parse(updates)
    const updated = await updateOutlet(parseInt(id), validated)

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating outlet:', error)
    return NextResponse.json({ error: 'Failed to update outlet' }, { status: 500 })
  }
}

export async function remove(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
  }

  try {
    const data = await request.json()
    const { id } = data

    if (!id) {
      return NextResponse.json({ error: 'Outlet ID is required' }, { status: 400 })
    }

    const outlet = await findOutletById(parseInt(id))
    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })
    }

    await deleteOutlet(parseInt(id))
    return NextResponse.json({ message: 'Outlet deleted successfully' })
  } catch (error) {
    console.error('Error deleting outlet:', error)
    return NextResponse.json({ error: 'Failed to delete outlet' }, { status: 500 })
  }
}

export async function getActive(request) {
  // Note: This endpoint is public and doesn't require authentication
  // as it may be needed for outlet selection in various parts of the app
  try {
    const outlets = await getActiveOutlets()
    return Response.json({ outlets })
  } catch (error) {
    console.error('Error fetching active outlets:', error)
    return Response.json({ error: 'Failed to fetch outlets' }, { status: 500 })
  }
}
