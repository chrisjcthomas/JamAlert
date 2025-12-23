import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

// Define protected routes
const protectedRoutes = ["/dashboard", "/admin"]
const adminRoutes = ["/admin"]

export async function middleware(request: NextRequest) {
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

    try {
      // Validate the token and check for admin role if needed
      if (isAdminRoute) {
        // Mock token handling for development/testing
        if (process.env.NODE_ENV !== 'production' && authToken === "mock-admin-token") {
           // Allow pass for mock admin token in non-production environments
        } else if (authToken.startsWith("mock-")) {
          // Other mock tokens are not admin (or we are in production where mocks are disabled)
          return NextResponse.redirect(new URL("/unauthorized", request.url))
        } else {
           // Verify real JWT
           const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_dev_secret")
           const { payload } = await jwtVerify(authToken, secret)

           if (payload.role !== "admin") {
             return NextResponse.redirect(new URL("/unauthorized", request.url))
           }
        }
      }
    } catch (error) {
      console.error("Token verification failed:", error)
      // Invalid token
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  const response = NextResponse.next()

  // Add Security Headers
  response.headers.set("X-DNS-Prefetch-Control", "on")
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
  response.headers.set("X-Frame-Options", "SAMEORIGIN")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  return response
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
