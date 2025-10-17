'use client'

import React, { useState, useEffect } from 'react'
import { Edit, Save, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function PayrollManagement() {
  const [payrollInfo, setPayrollInfo] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadPayrollInfo()
  }, [])

  const loadPayrollInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/hr/payroll-info')
      if (response.ok) {
        const data = await response.json()
        setPayrollInfo(data.payrollInfo)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load payroll information",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (info) => {
    setEditingId(info.user_id)
    setEditForm({
      hourly_rate: info.hourly_rate,
      position: info.position,
      hire_date: info.hire_date ? new Date(info.hire_date).toISOString().split('T')[0] : ''
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = async () => {
    try {
      const response = await fetch(`/api/hr/payroll-info/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': await getCsrfToken()
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Payroll information updated successfully",
        })
        setEditingId(null)
        setEditForm({})
        loadPayrollInfo()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update payroll information')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const getCsrfToken = async () => {
    const response = await fetch('/api/auth/csrf')
    const data = await response.json()
    return data.csrfToken
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Payroll Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Employee Payroll Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payrollInfo.map((info) => (
              <div key={info.user_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-3 flex-1">
                    <div>
                      <h3 className="font-semibold text-lg">{info.name}</h3>
                      <p className="text-sm text-gray-600">{info.email}</p>
                    </div>

                    {editingId === info.user_id ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="hourly_rate">Hourly Rate</Label>
                          <Input
                            id="hourly_rate"
                            type="number"
                            step="0.01"
                            value={editForm.hourly_rate}
                            onChange={(e) => setEditForm({
                              ...editForm,
                              hourly_rate: parseFloat(e.target.value)
                            })}
                            placeholder="15.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="position">Position</Label>
                          <Input
                            id="position"
                            value={editForm.position}
                            onChange={(e) => setEditForm({
                              ...editForm,
                              position: e.target.value
                            })}
                            placeholder="Cashier"
                          />
                        </div>
                        <div>
                          <Label htmlFor="hire_date">Hire Date</Label>
                          <Input
                            id="hire_date"
                            type="date"
                            value={editForm.hire_date}
                            onChange={(e) => setEditForm({
                              ...editForm,
                              hire_date: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Hourly Rate:</span>
                          <div className="font-medium">{formatCurrency(info.hourly_rate)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Position:</span>
                          <div className="font-medium">{info.position}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Hire Date:</span>
                          <div className="font-medium">{formatDate(info.hire_date)}</div>
                        </div>
                      </div>
                    )}

                    <div className="text-sm text-gray-500">
                      <span>Overtime Rate: {formatCurrency(info.overtime_rate)}</span>
                    </div>
                  </div>

                  <div className="ml-4">
                    {editingId === info.user_id ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => startEdit(info)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {payrollInfo.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No payroll information found. Cashiers will be automatically added when they first log in.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
