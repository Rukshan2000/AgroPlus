import { getSession } from "../../lib/auth"
import { redirect } from "next/navigation"
import AuthForm from "../../components/auth-form"
import LoginHero from "../../components/login-hero"

export default async function LoginPage() {
  const session = await getSession()
  if (session) {
    // Redirect cashier users to POS, others to dashboard
    if (session.user.role === 'cashier') {
      redirect("/pos")
    } else {
      redirect("/dashboard")
    }
  }
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image (Client Component) */}
      <LoginHero />

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-black">
        <div className="w-full max-w-md">
          <AuthForm mode="login" />
        </div>
      </div>
    </div>
  )
}
