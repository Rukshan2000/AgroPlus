"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Settings, Users, UserCircle2, LogOut, LayoutDashboard, Package, Tag, ShoppingCart, BarChart3, Clock, DollarSign, ChevronDown, ChevronRight, Star, Gift, Undo2, MapPin, Truck, Activity } from "lucide-react"

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
  useSidebar,
} from "@/components/ui/sidebar"

function SidebarHeaderContent() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  
  return (
    <div className="px-2 py-1 text-sm font-semibold">
      {isCollapsed ? "A" : "Agro Plus"}
    </div>
  )
}

export function AppSidebarWrapper({ children, session }) {
  const userRole = session?.user?.role;
  
  // For cashier role, don't show sidebar at all
  if (userRole === 'cashier') {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <UiSidebar collapsible="icon">
        <SidebarHeader>
          <SidebarHeaderContent />
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
  const { state } = useSidebar()
  const [openMenus, setOpenMenus] = useState({})

  const isCollapsed = state === "collapsed"

  const toggleMenu = (menuKey) => {
    if (isCollapsed) return // Don't toggle when collapsed
    setOpenMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }))
  }

  const menuGroups = [
    {
      key: "main",
      label: "Main",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "user"] },
        { href: "/analytics", label: "Analytics", icon: Activity, roles: ["admin", "manager", "user"] },
        // { href: "/", label: "Home", icon: Home, roles: ["admin", "manager", "user"] },
      ]
    },
    {
      key: "sales",
      label: "Sales & POS",
      icon: ShoppingCart,
      collapsible: true,
      items: [
        { href: "/pos", label: "POS System", icon: ShoppingCart, roles: ["admin", "manager", "user", "cashier"] },
        { href: "/sales", label: "Sales History", icon: BarChart3, roles: ["admin", "manager", "user"] },
        { href: "/returns", label: "Returns", icon: Undo2, roles: ["admin", "manager", "user", "cashier"] },
      ]
    },
    {
      key: "inventory",
      label: "Inventory",
      icon: Package,
      collapsible: true,
      items: [
        { href: "/products", label: "Products", icon: Package, roles: ["admin", "manager", "user"] },
        { href: "/categories", label: "Categories", icon: Tag, roles: ["admin", "manager", "user"] },
        { href: "/product-distribute", label: "Product Distribute", icon: Truck, roles: ["admin", "manager"] },
      ]
    },
    {
      key: "loyalty",
      label: "Customer Loyalty",
      icon: Star,
      collapsible: true,
      items: [
        { href: "/customers", label: "Customers", icon: Users, roles: ["admin", "manager", "user"] },
        { href: "/loyalty", label: "Program Settings", icon: Settings, roles: ["admin", "manager"] },
        { href: "/rewards", label: "Rewards", icon: Gift, roles: ["admin", "manager", "user"] },
      ]
    },
    {
      key: "outlets",
      label: "Outlets",
      icon: MapPin,
      collapsible: false,
      items: [
        { href: "/outlets", label: "Outlets", icon: MapPin, roles: ["admin", "manager"] },
      ]
    },
    {
      key: "hr",
      label: "Human Resources",
      icon: Clock,
      collapsible: true,
      items: [
        { href: "/hr", label: "HR Dashboard", icon: Clock, roles: ["admin", "manager"] },
        { href: "/hr/payroll", label: "Payroll", icon: DollarSign, roles: ["admin", "manager"] },
      ]
    },
    {
      key: "admin",
      label: "Administration",
      icon: Settings,
      collapsible: true,
      items: [
        { href: "/users", label: "Users", icon: Users, roles: ["admin", "manager"] },
        { href: "/settings", label: "Settings", icon: Settings, roles: ["admin", "manager", "user"] },
      ]
    }
  ]

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {menuGroups.map((group) => {
            const visibleItems = group.items.filter((item) => !role || item.roles.includes(role))
            
            if (visibleItems.length === 0) return null

            if (group.collapsible) {
              const isOpen = openMenus[group.key]
              const hasActiveItem = visibleItems.some(item => pathname === item.href)
              
              // When collapsed, show items directly without grouping
              if (isCollapsed) {
                return visibleItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              }
              
              return (
                <div key={group.key}>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => toggleMenu(group.key)}
                      className="flex items-center justify-between w-full"
                      isActive={hasActiveItem}
                    >
                      <div className="flex items-center gap-2">
                        <group.icon className="h-4 w-4" />
                        <span>{group.label}</span>
                      </div>
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  {(isOpen || hasActiveItem) && (
                    <div className="ml-4 border-l border-muted-foreground/20 pl-4 space-y-1">
                      {visibleItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild isActive={pathname === item.href} size="sm">
                            <Link href={item.href}>
                              <item.icon className="h-3 w-3" />
                              <span className="text-sm">{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </div>
                  )}
                </div>
              )
            } else {
              // Non-collapsible items
              return visibleItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            }
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
