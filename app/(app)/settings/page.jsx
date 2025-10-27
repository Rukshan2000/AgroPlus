import { redirect } from "next/navigation"
import { getSession } from "../../../lib/auth"
import ThemeToggle from "../../../components/theme-toggle"
import { PrinterSettings } from "../../../components/printer-settings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Toggle light/dark and persist preference.</div>
            <ThemeToggle />
          </CardContent>
        </Card>
      </div>

      <PrinterSettings />
    </div>
  )
}
