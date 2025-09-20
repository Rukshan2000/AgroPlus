import { getSession } from "../../lib/auth"
import { AppSidebarWrapper } from "../../components/sidebar"
import ThemeToggle from "../../components/theme-toggle"
import { ThemeProvider } from "../../components/theme-provider"

export default async function AppLayout({ children }) {
  const session = await getSession()

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="min-h-screen flex">
        <AppSidebarWrapper session={session}>
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
          {children}
        </AppSidebarWrapper>
      </div>
    </ThemeProvider>
  )
}
