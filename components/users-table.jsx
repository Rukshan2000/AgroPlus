"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import AddUserModal from "./add-user-modal"

export default function UsersTable({ initialUsers = [] }) {
  const [users, setUsers] = useState(initialUsers)

  async function updateRole(userId, role) {
    const csrf = await fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((d) => d.csrfToken)
    const res = await fetch(`/api/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      const data = await res.json()
      setUsers(users.map((u) => (u.id === userId ? data.user : u)))
    } else {
      const err = await res.json().catch(() => ({}))
      alert(err.error || "Failed to update role")
    }
  }

  const handleUserAdded = (newUser) => {
    setUsers([...users, newUser])
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Users</CardTitle>
          <AddUserModal onUserAdded={handleUserAdded} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground">
            <div>Email</div>
            <div>Name</div>
            <div>Role</div>
            <div>Actions</div>
          </div>
          {users.map((u) => (
            <div key={u.id} className="grid grid-cols-4 items-center py-2 border-b last:border-b-0">
              <div className="truncate">{u.email}</div>
              <div>{u.name || "-"}</div>
              <div>
                <Badge variant="outline">{u.role}</Badge>
              </div>
              <div className="flex gap-2">
                <Select defaultValue={u.role} onValueChange={(value) => updateRole(u.id, value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">admin</SelectItem>
                    <SelectItem value="manager">manager</SelectItem>
                    <SelectItem value="user">user</SelectItem>
                    <SelectItem value="cashier">cashier</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="secondary" onClick={() => updateRole(u.id, u.role)}>
                  Apply
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
