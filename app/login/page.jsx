import { getSession } from "../../lib/auth"
import { redirect } from "next/navigation"
import AuthForm from "../../components/auth-form"

export default async function LoginPage() {
  const session = await getSession()
  if (session) redirect("/dashboard")
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <AuthForm mode="login" />
    </div>
  )
}
