import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ForbiddenPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
      <h1 className="text-3xl font-bold">403 - Forbidden</h1>
      <p className="text-muted-foreground max-w-md">
        You do not have permission to access this resource. If you believe this is an error, contact your administrator.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    </div>
  )
}
