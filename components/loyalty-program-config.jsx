"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useCsrf } from '@/hooks/use-csrf'
import { Save, Loader2, Star, Users, TrendingUp, Gift } from 'lucide-react'

export function LoyaltyProgramConfig() {
  const [programs, setPrograms] = useState([])
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [stats, setStats] = useState(null)
  const { toast } = useToast()
  const { csrfToken, getHeaders } = useCsrf()

  useEffect(() => {
    fetchPrograms()
  }, [])

  useEffect(() => {
    if (selectedProgram) {
      fetchProgramStats()
    }
  }, [selectedProgram])

  const fetchPrograms = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/loyalty')
      const data = await response.json()
      if (response.ok) {
        setPrograms(data.programs || [])
        if (data.programs?.length > 0 && !selectedProgram) {
          setSelectedProgram(data.programs[0])
        }
      }
    } catch (error) {
      console.error('Error fetching loyalty programs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProgramStats = async () => {
    if (!selectedProgram?.id) return
    
    try {
      const response = await fetch(`/api/loyalty/${selectedProgram.id}/stats`)
      const data = await response.json()
      if (response.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching program stats:', error)
    }
  }

  const handleSave = async () => {
    if (!selectedProgram || !csrfToken) return
    
    setIsSaving(true)
    try {
      const url = selectedProgram.id ? `/api/loyalty/${selectedProgram.id}` : '/api/loyalty'
      const method = selectedProgram.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(selectedProgram),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Loyalty program saved successfully',
        })
        if (!selectedProgram.id) {
          setSelectedProgram(data)
        }
        fetchPrograms()
        fetchProgramStats()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save program',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving program:', error)
      toast({
        title: 'Error',
        description: 'Failed to save program',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleFieldChange = (field, value) => {
    setSelectedProgram(prev => ({ ...prev, [field]: value }))
  }

  const createNewProgram = () => {
    setSelectedProgram({
      name: '',
      description: '',
      points_per_dollar: 1,
      signup_bonus: 0,
      min_redemption_threshold: 100,
      is_active: true
    })
    setStats(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loyalty Program Configuration</h1>
          <p className="text-muted-foreground">
            Configure your customer loyalty program settings and rewards
          </p>
        </div>
        <Button onClick={createNewProgram}>
          <Star className="mr-2 h-4 w-4" /> New Program
        </Button>
      </div>

      {/* Program Selection */}
      {programs.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Program</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {programs.map((program) => (
                <Button
                  key={program.id}
                  variant={selectedProgram?.id === program.id ? 'default' : 'outline'}
                  onClick={() => setSelectedProgram(program)}
                  className="justify-start"
                >
                  {program.name} {program.is_active ? '' : '(Inactive)'}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_customers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Outstanding</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parseInt(stats.total_points_outstanding).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Earned (30 days)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parseInt(stats.points_earned_last_30_days || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Redeemed (30 days)</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parseInt(stats.points_redeemed_last_30_days || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Program Configuration */}
      {selectedProgram && (
        <Card>
          <CardHeader>
            <CardTitle>Program Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Program Name</Label>
                <Input
                  id="name"
                  value={selectedProgram.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Enter program name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="points_per_dollar">Points per LKR</Label>
                <Input
                  id="points_per_dollar"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={selectedProgram.points_per_dollar}
                  onChange={(e) => handleFieldChange('points_per_dollar', parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">How many points customers earn for every LKR spent</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={selectedProgram.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Describe your loyalty program"
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="signup_bonus">Signup Bonus Points</Label>
                <Input
                  id="signup_bonus"
                  type="number"
                  min="0"
                  value={selectedProgram.signup_bonus}
                  onChange={(e) => handleFieldChange('signup_bonus', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="min_redemption_threshold">Minimum Redemption Threshold</Label>
                <Input
                  id="min_redemption_threshold"
                  type="number"
                  min="1"
                  value={selectedProgram.min_redemption_threshold}
                  onChange={(e) => handleFieldChange('min_redemption_threshold', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={selectedProgram.is_active}
                onCheckedChange={(checked) => handleFieldChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Program Active</Label>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Program Preview */}
      {selectedProgram && (
        <Card>
          <CardHeader>
            <CardTitle>Program Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Name:</strong> {selectedProgram.name || 'Unnamed Program'}</p>
            <p><strong>Earning Rate:</strong> {selectedProgram.points_per_dollar} points per LKR spent</p>
            <p><strong>Signup Bonus:</strong> {selectedProgram.signup_bonus} points</p>
            <p><strong>Minimum Redemption:</strong> {selectedProgram.min_redemption_threshold} points</p>
            <p><strong>Status:</strong> {selectedProgram.is_active ? 'Active' : 'Inactive'}</p>
            {selectedProgram.description && (
              <p><strong>Description:</strong> {selectedProgram.description}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
