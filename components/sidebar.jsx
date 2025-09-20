"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Settings, Users, UserCircle2, LogOut, LayoutDashboard, Package, Tag } from "lucide-react"

import {
  Sidebar as UiSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebarWrapper({ children, session }) {
  return (
    <SidebarProvider>
      <UiSidebar collapsible="icon">
        <SidebarHeader>
          <div className="px-2 py-1 text-sm font-semibold">RBAC Demo</div>
        </SidebarHeader>
        <SidebarContent>
          <NavMenu role={session?.user?.role} />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/profile">
                  <UserCircle2 />
                  <span>Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <form action="/api/auth/logout" method="post" className="w-full">
                <input type="hidden" name="_csrf" value="" />
              </form>
              <SidebarMenuButton asChild>
                <button
                  type="button"
                  onClick={async () => {
                    // include CSRF header for logout
                    const csrf = await fetch("/api/auth/csrf")
                      .then((r) => r.json())
                      .then((d) => d.csrfToken)
                    await fetch("/api/auth/logout", { method: "POST", headers: { "x-csrf-token": csrf } })
                    window.location.href = "/login"
                  }}
                >
                  <LogOut />
                  <span>Logout</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </UiSidebar>
      <main className="flex-1 min-h-screen bg-muted/30">
        <div className="flex items-center gap-2 p-2 border-b bg-background">
          <SidebarTrigger />
          <div className="text-sm text-muted-foreground">Toggle Sidebar</div>
        </div>
        <div className="p-4">{children}</div>
      </main>
    </SidebarProvider>
  )
}

function NavMenu({ role }) {
  const pathname = usePathname()
  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "user"] },
    { href: "/products", label: "Products", icon: Package, roles: ["admin", "manager", "user"] },
    { href: "/categories", label: "Categories", icon: Tag, roles: ["admin", "manager", "user"] },
    { href: "/users", label: "Users", icon: Users, roles: ["admin", "manager"] },
    { href: "/settings", label: "Settings", icon: Settings, roles: ["admin", "manager", "user"] },
    { href: "/", label: "Home", icon: Home, roles: ["admin", "manager", "user"] },
  ]
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items
            .filter((i) => !role || i.roles.includes(role))
            .map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href}>
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
