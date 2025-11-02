import ProductsTable from "../../../components/products-table"
import { cookies } from "next/headers"

async function fetchProducts() {
  try {
    const cookieStore = await cookies()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    // Fetch first page with default limit, client will handle pagination
    const res = await fetch(`${baseUrl}/api/products?page=1&limit=10`, {
      cache: 'no-store',
      headers: {
        Cookie: cookieStore.toString()
      }
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (error) {
    console.error('Error fetching products:', error)
  }
  return { products: [], total: 0, page: 1, limit: 10, totalPages: 0 }
}

async function fetchCategories() {
  try {
    const cookieStore = await cookies()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/products/categories`, {
      cache: 'no-store',
      headers: {
        Cookie: cookieStore.toString()
      }
    })
    if (res.ok) {
      const data = await res.json()
      return data.categories
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
  return []
}

export default async function ProductsPage() {
  const [productsData, categories] = await Promise.all([
    fetchProducts(),
    fetchCategories()
  ])

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="text-muted-foreground">
          Manage your product catalog
        </p>
      </div>
      
      <ProductsTable 
        initialProducts={productsData.products} 
        initialCategories={categories}
      />
    </div>
  )
}
