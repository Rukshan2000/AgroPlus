"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  async function persistTheme(nextTheme) {
    try {
      const csrf = await fetch("/api/auth/csrf")
        .then((r) => r.json())
        .then((d) => d.csrfToken)
      await fetch("/api/user/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ theme: nextTheme }),
      })
    } catch (e) {
      // ignore persistence errors
    }
  }

  if (!mounted) return null

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    persistTheme(next)
  }

  return (
    <Button variant="outline" size="icon" onClick={toggle} aria-label="Toggle theme">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
