"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

export default function AuthForm({ mode = "login" }) {
  const isLogin = mode === "login"
  const [csrf, setCsrf] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({ 
    email: "", 
    password: "", 
    name: "", 
    role: "user",
    hourlyRate: "",
    position: ""
  })
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((d) => setCsrf(d.csrfToken))
      .catch(() => {})
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify(form),
      })
      
      let data
      try {
        data = await res.json()
      } catch (error) {
        setError("Server error - please try again")
        setIsLoading(false)
        return
      }
      
      if (!res.ok) {
        setError(data.error || "Something went wrong")
        setIsLoading(false)
        return
      }
      
      // Redirect based on user role
      if (data.user && data.user.role === 'cashier') {
        router.replace("/pos")
      } else {
        router.replace("/dashboard")
      }
    } catch (error) {
      setError("Network error - please try again")
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-xl border-0">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-3xl font-bold text-center">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
        <CardDescription className="text-center text-base">
          {isLogin ? "Enter your credentials to access your account" : "Create an account to get started."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <form onSubmit={onSubmit} className="grid gap-4">
          {!isLogin && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(form.role === 'cashier' || form.role === 'user') && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.hourlyRate}
                      onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                      placeholder="15.00"
                      required={form.role === 'cashier'}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                      placeholder="Cashier, Sales Associate, etc."
                      required={form.role === 'cashier'}
                    />
                  </div>
                </>
              )}
            </>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              disabled={isLoading}
              className="h-11"
              placeholder="your@email.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
              disabled={isLoading}
              className="h-11"
              placeholder="Enter your password"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold mt-2" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isLogin ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              isLogin ? "Sign In" : "Create Account"
            )}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            {isLogin ? (
              <span>
                {/* New here?{" "} */}
                {/* <Link className="underline" href="/register">
                  Register
                </Link> */}
              </span>
            ) : (
              <span>
                Already have an account?{" "}
                <Link className="underline" href="/login">
                  Login
                </Link>
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
