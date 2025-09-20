"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AuthForm({ mode = "login" }) {
  const isLogin = mode === "login"
  const [csrf, setCsrf] = useState("")
  const [form, setForm] = useState({ email: "", password: "", name: "" })
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
      return
    }
    
    if (!res.ok) {
      setError(data.error || "Something went wrong")
      return
    }
    router.replace("/dashboard")
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isLogin ? "Login" : "Register"}</CardTitle>
        <CardDescription>
          {isLogin ? "Welcome back! Please log in." : "Create an account to get started."}
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
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full">
            {isLogin ? "Login" : "Create account"}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            {isLogin ? (
              <span>
                New here?{" "}
                <Link className="underline" href="/register">
                  Register
                </Link>
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
