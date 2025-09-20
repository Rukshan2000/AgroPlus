import { getSession, requireRoleOrThrow } from "../lib/auth"
import { 
  getAllWorkSessions, 
  getWorkSessionsByUser,
  createOrUpdatePayrollInfo,
  getAllPayrollInfo,
  getPayrollInfo,
  calculateMonthlyPayroll,
  getAllPayrollSummaries,
  getPayrollSummary,
  approvePayroll,
  getHRDashboardStats,
  getCurrentWorkSession
} from "../models/hrModel"
import { validateCsrf } from "../lib/csrf"
import { NextResponse } from "next/server"
import { z } from "zod"

const payrollInfoSchema = z.object({
  hourly_rate: z.number().min(0, "Hourly rate must be positive"),
  position: z.string().min(1, "Position is required").max(100),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
})

// Work Sessions
export async function listWorkSessions(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  let workSessions
  if (userId) {
    workSessions = await getWorkSessionsByUser(parseInt(userId), startDate, endDate)
  } else {
    workSessions = await getAllWorkSessions(startDate, endDate)
  }

  return NextResponse.json({ workSessions })
}

export async function getMyWorkSessions(request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  const workSessions = await getWorkSessionsByUser(session.user.id, startDate, endDate)
  const currentSession = await getCurrentWorkSession(session.user.id)

  return NextResponse.json({ 
    workSessions,
    currentSession
  })
}

// Payroll Information
export async function listPayrollInfo() {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const payrollInfo = await getAllPayrollInfo()
  return NextResponse.json({ payrollInfo })
}

export async function updatePayrollInfo(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  const userId = parseInt(params.id)
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = payrollInfoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ 
      error: "Invalid input", 
      details: parsed.error.flatten() 
    }, { status: 400 })
  }

  try {
    const payrollInfo = await createOrUpdatePayrollInfo(userId, parsed.data)
    return NextResponse.json({ payrollInfo })
  } catch (error) {
    return NextResponse.json({ 
      error: error.message || "Failed to update payroll information" 
    }, { status: 500 })
  }
}

export async function getPayrollInfoById(userId) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const payrollInfo = await getPayrollInfo(userId)
  if (!payrollInfo) {
    return NextResponse.json({ error: "Payroll information not found" }, { status: 404 })
  }

  return NextResponse.json({ payrollInfo })
}

// Payroll Summaries
export async function listPayrollSummaries(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')) : null
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')) : null

  const payrollSummaries = await getAllPayrollSummaries(month, year)
  return NextResponse.json({ payrollSummaries })
}

export async function calculatePayroll(request) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { user_id, month, year } = body

  if (!user_id || !month || !year) {
    return NextResponse.json({ 
      error: "user_id, month, and year are required" 
    }, { status: 400 })
  }

  try {
    const payrollSummary = await calculateMonthlyPayroll(user_id, month, year)
    return NextResponse.json({ payrollSummary })
  } catch (error) {
    return NextResponse.json({ 
      error: error.message || "Failed to calculate payroll" 
    }, { status: 500 })
  }
}

export async function approvePayrollSummary(request, { params }) {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  if (!(await validateCsrf(request.headers))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  const summaryId = parseInt(params.id)
  if (!Number.isInteger(summaryId)) {
    return NextResponse.json({ error: "Invalid summary ID" }, { status: 400 })
  }

  try {
    const approvedSummary = await approvePayroll(summaryId, session.user.id)
    if (!approvedSummary) {
      return NextResponse.json({ error: "Payroll summary not found" }, { status: 404 })
    }

    return NextResponse.json({ payrollSummary: approvedSummary })
  } catch (error) {
    return NextResponse.json({ 
      error: error.message || "Failed to approve payroll" 
    }, { status: 500 })
  }
}

export async function getMyPayrollSummary(request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')) : new Date().getMonth() + 1
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')) : new Date().getFullYear()

  const payrollSummary = await getPayrollSummary(session.user.id, month, year)
  const payrollInfo = await getPayrollInfo(session.user.id)

  return NextResponse.json({ 
    payrollSummary,
    payrollInfo
  })
}

// Dashboard
export async function getHRDashboard() {
  const session = await getSession()
  try {
    requireRoleOrThrow(session, ["admin", "manager"])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const stats = await getHRDashboardStats()
  return NextResponse.json({ stats })
}
