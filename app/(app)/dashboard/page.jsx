import { getSession } from "../../../lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await getSession()
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <div>Hello {session?.user?.name || "there"}!</div>
            <div className="text-muted-foreground text-sm">Role: {session?.user?.role || "guest"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-5 text-sm">
              <li>/profile</li>
              <li>/settings</li>
              <li>/users (admin/manager)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
