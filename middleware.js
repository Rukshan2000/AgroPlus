import { NextResponse } from 'next/server'

export async function middleware(request) {
  const pathname = request.nextUrl.pathname
  
  // Allow public routes (website pages that don't require authentication)
  if (pathname.startsWith('/login') || 
      pathname.startsWith('/register') || 
      pathname.startsWith('/api') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/assets') ||
      pathname === '/' ||
      pathname === '/shop' ||
      pathname === '/contact' ||
      pathname === '/simple-shop' ||
      pathname === '/test-shop') {
    return NextResponse.next()
  }

  // Check if user has session cookie
  const sessionCookie = request.cookies.get('session')
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // For cashier role restriction, we'll handle this on the client side
  // to avoid infinite loops and edge runtime limitations
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
