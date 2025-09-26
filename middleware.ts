import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define protected routes
const protectedRoutes = ["/dashboard", "/admin"]
const adminRoutes = ["/admin"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute) {
    // Get auth token from cookies or headers
    const authToken =
      request.cookies.get("auth-token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

    // If no token, redirect to appropriate login page
    if (!authToken) {
      const loginUrl = isAdminRoute ? "/admin/login" : "/login"
      return NextResponse.redirect(new URL(loginUrl, request.url))
    }

    // For admin routes, check if user has admin role
    if (isAdminRoute) {
      const userStr = request.cookies.get("auth-user")?.value
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          if (user.role !== "admin") {
            return NextResponse.redirect(new URL("/unauthorized", request.url))
          }
        } catch {
          return NextResponse.redirect(new URL("/admin/login", request.url))
        }
      }
    }
  }

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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
