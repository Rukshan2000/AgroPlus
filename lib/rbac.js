// Basic RBAC map
export const Roles = {
  admin: "admin",
  manager: "manager",
  user: "user",
}

export const Permissions = {
  manage_users: "manage_users",
  view_all: "view_all",
  assign_roles: "assign_roles",
  manage_settings: "manage_settings",
  view_own: "view_own",
  edit_own_profile: "edit_own_profile",
}

const rolePermissions = {
  [Roles.admin]: [
    Permissions.manage_users,
    Permissions.view_all,
    Permissions.assign_roles,
    Permissions.manage_settings,
  ],
  [Roles.manager]: [Permissions.view_all],
  [Roles.user]: [Permissions.view_own, Permissions.edit_own_profile],
}

export function hasRole(user, roles = []) {
  if (!user) return false
  if (roles.length === 0) return true
  return roles.includes(user.role)
}

export function hasPermission(user, perm) {
  if (!user) return false
  return rolePermissions[user.role]?.includes(perm)
}
