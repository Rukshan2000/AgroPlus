import { query } from '../lib/db'

// Work Session Management
export async function createWorkSession(userId) {
  const result = await query(
    `INSERT INTO work_sessions (user_id, login_time) 
     VALUES ($1, NOW()) 
     RETURNING *`,
    [userId]
  )
  return result.rows[0]
}

export async function endWorkSession(userId, notes = null) {
  const result = await query(
    `UPDATE work_sessions 
     SET logout_time = NOW(), notes = $2, updated_at = NOW()
     WHERE user_id = $1 AND is_active = TRUE
     RETURNING *`,
    [userId, notes]
  )
  return result.rows[0]
}

export async function getCurrentWorkSession(userId) {
  const result = await query(
    `SELECT * FROM work_sessions 
     WHERE user_id = $1 AND is_active = TRUE 
     ORDER BY login_time DESC 
     LIMIT 1`,
    [userId]
  )
  return result.rows[0]
}

export async function getWorkSessionsByUser(userId, startDate = null, endDate = null) {
  let queryText = `
    SELECT 
      ws.*,
      EXTRACT(EPOCH FROM session_duration)/3600 as hours_worked
    FROM work_sessions ws
    WHERE ws.user_id = $1
  `
  const params = [userId]
  
  if (startDate) {
    queryText += ` AND ws.login_time >= $${params.length + 1}`
    params.push(startDate)
  }
  
  if (endDate) {
    queryText += ` AND ws.login_time <= $${params.length + 1}`
    params.push(endDate)
  }
  
  queryText += ` ORDER BY ws.login_time DESC`
  
  const result = await query(queryText, params)
  return result.rows
}

export async function getAllWorkSessions(startDate = null, endDate = null) {
  let queryText = `
    SELECT 
      ws.*,
      u.name as user_name,
      u.email as user_email,
      pi.position,
      pi.hourly_rate,
      EXTRACT(EPOCH FROM session_duration)/3600 as hours_worked
    FROM work_sessions ws
    JOIN users u ON ws.user_id = u.id
    LEFT JOIN payroll_info pi ON ws.user_id = pi.user_id
    WHERE u.role = 'cashier'
  `
  const params = []
  
  if (startDate) {
    queryText += ` AND ws.login_time >= $${params.length + 1}`
    params.push(startDate)
  }
  
  if (endDate) {
    queryText += ` AND ws.login_time <= $${params.length + 1}`
    params.push(endDate)
  }
  
  queryText += ` ORDER BY ws.login_time DESC`
  
  const result = await query(queryText, params)
  return result.rows
}

// Payroll Information Management
export async function createOrUpdatePayrollInfo(userId, payrollData) {
  const { hourly_rate, position, hire_date } = payrollData
  
  const result = await query(
    `INSERT INTO payroll_info (user_id, hourly_rate, position, hire_date)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) 
     DO UPDATE SET 
       hourly_rate = EXCLUDED.hourly_rate,
       position = EXCLUDED.position,
       hire_date = EXCLUDED.hire_date,
       updated_at = NOW()
     RETURNING *`,
    [userId, hourly_rate, position, hire_date]
  )
  
  return result.rows[0]
}

// Alias for createOrUpdatePayrollInfo to match authController usage
export const createPayrollInfo = createOrUpdatePayrollInfo

export async function getPayrollInfo(userId) {
  const result = await query(
    `SELECT pi.*, u.name, u.email 
     FROM payroll_info pi
     JOIN users u ON pi.user_id = u.id
     WHERE pi.user_id = $1`,
    [userId]
  )
  return result.rows[0]
}

export async function getAllPayrollInfo() {
  const result = await query(
    `SELECT pi.*, u.name, u.email, u.role
     FROM payroll_info pi
     JOIN users u ON pi.user_id = u.id
     WHERE u.role = 'cashier' AND pi.is_active = TRUE
     ORDER BY u.name`
  )
  return result.rows
}

// Payroll Summary Management
export async function calculateMonthlyPayroll(userId, month, year) {
  // Get all work sessions for the month
  const sessions = await query(
    `SELECT 
       ws.*,
       EXTRACT(EPOCH FROM session_duration)/3600 as hours_worked
     FROM work_sessions ws
     WHERE ws.user_id = $1 
       AND EXTRACT(MONTH FROM ws.login_time) = $2
       AND EXTRACT(YEAR FROM ws.login_time) = $3
       AND ws.logout_time IS NOT NULL`,
    [userId, month, year]
  )
  
  const totalHours = sessions.rows.reduce((sum, session) => sum + (parseFloat(session.hours_worked) || 0), 0)
  const regularHours = Math.min(totalHours, 160) // 40 hours * 4 weeks
  const overtimeHours = Math.max(0, totalHours - 160)
  
  // Get payroll info
  const payrollInfo = await getPayrollInfo(userId)
  if (!payrollInfo) {
    throw new Error('Payroll information not found for user')
  }
  
  const regularPay = regularHours * parseFloat(payrollInfo.hourly_rate)
  const overtimePay = overtimeHours * parseFloat(payrollInfo.overtime_rate)
  const totalPay = regularPay + overtimePay
  
  // Insert or update payroll summary
  const result = await query(
    `INSERT INTO payroll_summaries 
     (user_id, month, year, total_hours, regular_hours, overtime_hours, total_pay)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, month, year)
     DO UPDATE SET
       total_hours = EXCLUDED.total_hours,
       regular_hours = EXCLUDED.regular_hours,
       overtime_hours = EXCLUDED.overtime_hours,
       total_pay = EXCLUDED.total_pay,
       calculated_at = NOW(),
       updated_at = NOW()
     RETURNING *`,
    [userId, month, year, totalHours, regularHours, overtimeHours, totalPay]
  )
  
  return result.rows[0]
}

export async function getPayrollSummary(userId, month, year) {
  const result = await query(
    `SELECT ps.*, u.name, u.email, pi.position, pi.hourly_rate
     FROM payroll_summaries ps
     JOIN users u ON ps.user_id = u.id
     LEFT JOIN payroll_info pi ON ps.user_id = pi.user_id
     WHERE ps.user_id = $1 AND ps.month = $2 AND ps.year = $3`,
    [userId, month, year]
  )
  return result.rows[0]
}

export async function getAllPayrollSummaries(month = null, year = null) {
  let queryText = `
    SELECT ps.*, u.name, u.email, pi.position, pi.hourly_rate
    FROM payroll_summaries ps
    JOIN users u ON ps.user_id = u.id
    LEFT JOIN payroll_info pi ON ps.user_id = pi.user_id
    WHERE u.role = 'cashier'
  `
  const params = []
  
  if (month) {
    queryText += ` AND ps.month = $${params.length + 1}`
    params.push(month)
  }
  
  if (year) {
    queryText += ` AND ps.year = $${params.length + 1}`
    params.push(year)
  }
  
  queryText += ` ORDER BY ps.year DESC, ps.month DESC, u.name`
  
  const result = await query(queryText, params)
  return result.rows
}

export async function approvePayroll(summaryId, approvedBy) {
  const result = await query(
    `UPDATE payroll_summaries 
     SET status = 'approved', approved_by = $2, approved_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [summaryId, approvedBy]
  )
  return result.rows[0]
}

// Dashboard Statistics
export async function getHRDashboardStats() {
  // Currently active cashiers
  const activeCashiers = await query(`
    SELECT COUNT(*) as count
    FROM work_sessions ws
    JOIN users u ON ws.user_id = u.id
    WHERE ws.is_active = TRUE AND u.role = 'cashier'
  `)
  
  // Total cashiers (include all cashiers, not just those with payroll info)
  const totalCashiers = await query(`
    SELECT COUNT(*) as count
    FROM users u
    LEFT JOIN payroll_info pi ON u.id = pi.user_id
    WHERE u.role = 'cashier' AND (pi.is_active = TRUE OR pi.is_active IS NULL)
  `)
  
  // Today's total hours
  const todayHours = await query(`
    SELECT COALESCE(SUM(EXTRACT(EPOCH FROM session_duration)/3600), 0) as total_hours
    FROM work_sessions
    WHERE DATE(login_time) = CURRENT_DATE
    AND logout_time IS NOT NULL
  `)
  
  // This month's pending payroll
  const pendingPayroll = await query(`
    SELECT COUNT(*) as count, COALESCE(SUM(total_pay), 0) as total_amount
    FROM payroll_summaries
    WHERE month = EXTRACT(MONTH FROM CURRENT_DATE)
    AND year = EXTRACT(YEAR FROM CURRENT_DATE)
    AND status = 'pending'
  `)
  
  return {
    activeCashiers: parseInt(activeCashiers.rows[0].count),
    totalCashiers: parseInt(totalCashiers.rows[0].count),
    todayHours: parseFloat(todayHours.rows[0].total_hours),
    pendingPayrollCount: parseInt(pendingPayroll.rows[0].count),
    pendingPayrollAmount: parseFloat(pendingPayroll.rows[0].total_amount)
  }
}
