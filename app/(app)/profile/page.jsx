import { redirect } from "next/navigation"
import { getSession } from "../../../lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const { user } = session
  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="font-medium">Name:</span> {user.name || "-"}
          </div>
          <div>
            <span className="font-medium">Email:</span> {user.email}
          </div>
          <div>
            <span className="font-medium">Role:</span> {user.role}
          </div>
          <div>
            <span className="font-medium">Theme:</span> {user.theme_preference || "system"}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
