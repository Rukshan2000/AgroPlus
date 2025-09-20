// Basic RBAC map
export const Roles = {
  admin: "admin",
  manager: "manager",
  user: "user",
  cashier: "cashier",
}

export const Permissions = {
  manage_users: "manage_users",
  view_all: "view_all",
  assign_roles: "assign_roles",
  manage_settings: "manage_settings",
  view_own: "view_own",
  edit_own_profile: "edit_own_profile",
  use_pos: "use_pos",
}

const rolePermissions = {
  [Roles.admin]: [
    Permissions.manage_users,
    Permissions.view_all,
    Permissions.assign_roles,
    Permissions.manage_settings,
    Permissions.use_pos,
  ],
  [Roles.manager]: [Permissions.view_all, Permissions.use_pos],
  [Roles.user]: [Permissions.view_own, Permissions.edit_own_profile, Permissions.use_pos],
  [Roles.cashier]: [Permissions.use_pos], // Cashier can only use POS
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
