'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Users, DollarSign, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export default function HRDashboard() {
  const [stats, setStats] = useState(null)
  const [workSessions, setWorkSessions] = useState([])
  const [payrollSummaries, setPayrollSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadHRData()
  }, [])

  const loadHRData = async () => {
    try {
      setLoading(true)
      
      // Load dashboard stats
      const statsResponse = await fetch('/api/hr/dashboard')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }

      // Load recent work sessions
      const sessionsResponse = await fetch('/api/hr/work-sessions?limit=10')
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        setWorkSessions(sessionsData.workSessions)
      }

      // Load current month payroll summaries
      const currentDate = new Date()
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()
      
      const payrollResponse = await fetch(`/api/hr/payroll-summaries?month=${month}&year=${year}`)
      if (payrollResponse.ok) {
        const payrollData = await payrollResponse.json()
        setPayrollSummaries(payrollData.payrollSummaries)
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load HR data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculatePayrollForAll = async () => {
    try {
      const currentDate = new Date()
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()

      for (const summary of payrollSummaries) {
        await fetch('/api/hr/payroll-summaries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': await getCsrfToken()
          },
          body: JSON.stringify({
            user_id: summary.user_id,
            month,
            year
          })
        })
      }

      toast({
        title: "Success",
        description: "Payroll calculated for all cashiers",
      })
      
      loadHRData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to calculate payroll",
        variant: "destructive"
      })
    }
  }

  const approvePayroll = async (summaryId) => {
    try {
      const response = await fetch(`/api/hr/payroll-summaries/${summaryId}/approve`, {
        method: 'PATCH',
        headers: {
          'x-csrf-token': await getCsrfToken()
        }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Payroll approved successfully",
        })
        loadHRData()
      } else {
        throw new Error('Failed to approve payroll')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve payroll",
        variant: "destructive"
      })
    }
  }

  const getCsrfToken = async () => {
    const response = await fetch('/api/auth/csrf')
    const data = await response.json()
    return data.csrfToken
  }

  const formatDuration = (hours) => {
    if (!hours) return '0h 0m'
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">HR Dashboard</h1>
        <Button onClick={calculatePayrollForAll}>
          Calculate Current Month Payroll
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cashiers</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCashiers}</div>
              <p className="text-xs text-muted-foreground">
                of {stats.totalCashiers} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Hours</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.todayHours)}</div>
              <p className="text-xs text-muted-foreground">
                Total worked today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payroll</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayrollCount}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.pendingPayrollAmount)} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cashiers</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCashiers}</div>
              <p className="text-xs text-muted-foreground">
                Employees managed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Work Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Work Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{session.user_name}</div>
                    <div className="text-sm text-gray-500">
                      {formatDateTime(session.login_time)}
                      {session.logout_time && ` - ${formatDateTime(session.logout_time)}`}
                    </div>
                  </div>
                  <div className="text-right">
                    {session.is_active ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Active
                      </Badge>
                    ) : (
                      <div>
                        <div className="font-medium">{formatDuration(session.hours_worked)}</div>
                        <Badge variant="outline">Completed</Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {workSessions.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No work sessions found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Month Payroll */}
        <Card>
          <CardHeader>
            <CardTitle>Current Month Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payrollSummaries.map((summary) => (
                <div key={summary.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{summary.name}</div>
                    <div className="text-sm text-gray-500">
                      {formatDuration(summary.total_hours)} • {summary.position}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-medium">{formatCurrency(summary.total_pay)}</div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={summary.status === 'approved' ? 'default' : 'secondary'}
                        className={summary.status === 'approved' ? 'bg-green-100 text-green-700' : ''}
                      >
                        {summary.status}
                      </Badge>
                      {summary.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => approvePayroll(summary.id)}
                          className="h-6 px-2 text-xs"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {payrollSummaries.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No payroll data for current month
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
