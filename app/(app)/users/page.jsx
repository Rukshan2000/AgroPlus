import { redirect } from "next/navigation"
import { getSession } from "../../../lib/auth"
import { hasRole } from "../../../lib/rbac"
import UsersTable from "../../../components/users-table"
import { listUsers } from "../../../models/userModel"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const session = await getSession()
  if (!session || !hasRole(session.user, ["admin", "manager"])) {
    redirect("/forbidden")
  }
  const users = await listUsers()
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold">Users</h1>
      <UsersTable initialUsers={users} />
    </div>
  )
}
