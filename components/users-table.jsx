"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Pencil } from "lucide-react"
import AddUserModal from "./add-user-modal"
import EditUserOutletsModal from "./edit-user-outlets-modal"

export default function UsersTable({ initialUsers = [] }) {
  const [users, setUsers] = useState(initialUsers)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isOutletModalOpen, setIsOutletModalOpen] = useState(false)

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

  const handleEditOutlets = (user) => {
    setSelectedUser(user)
    setIsOutletModalOpen(true)
  }

  const handleOutletsUpdated = (updatedUser) => {
    setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
    setIsOutletModalOpen(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Users</CardTitle>
            <AddUserModal onUserAdded={handleUserAdded} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 overflow-x-auto">
            <div className="grid grid-cols-5 text-xs font-medium text-muted-foreground">
              <div>Email</div>
              <div>Name</div>
              <div>Role</div>
              <div>Outlets</div>
              <div>Actions</div>
            </div>
            {users.map((u) => (
              <div key={u.id} className="grid grid-cols-5 items-center py-2 border-b last:border-b-0 gap-2">
                <div className="truncate text-sm">{u.email}</div>
                <div className="text-sm">{u.name || "-"}</div>
                <div>
                  <Badge variant="outline">{u.role}</Badge>
                </div>
                <div className="text-sm">
                  {u.outlets && u.outlets.length > 0 ? (
                    <Badge variant="secondary">{u.outlets.length} outlet(s)</Badge>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditOutlets(u)}
                    title="Edit outlets"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Select defaultValue={u.role} onValueChange={(value) => updateRole(u.id, value)}>
                    <SelectTrigger className="w-[90px] h-8">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">admin</SelectItem>
                      <SelectItem value="manager">manager</SelectItem>
                      <SelectItem value="user">user</SelectItem>
                      <SelectItem value="cashier">cashier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <EditUserOutletsModal
          isOpen={isOutletModalOpen}
          onClose={() => setIsOutletModalOpen(false)}
          user={selectedUser}
          onSuccess={handleOutletsUpdated}
        />
      )}
    </>
  )
}
