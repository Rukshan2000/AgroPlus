import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CategoriesTable from '@/components/categories-table'

export default async function CategoriesPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground">
          Manage your product categories and organization.
        </p>
      </div>
      <CategoriesTable />
    </div>
  )
}
