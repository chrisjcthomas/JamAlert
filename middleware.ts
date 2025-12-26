import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

// Define protected routes
const protectedRoutes = ["/dashboard", "/admin"]
const adminRoutes = ["/admin"]

// Get JWT Secret - matching backend/src/lib/config.ts default or env
// Note: In Edge Runtime, process.env might need specific configuration, but typically works for env vars.
// We fallback to the test secret if not provided, to ensure functionality in this environment.
const JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only-32-chars"

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
      // Check for mock tokens in development/demo mode
      if (process.env.NODE_ENV !== "production" && authToken.startsWith("mock-")) {
        // If it's a mock token in non-production, we validate loosely based on token name
        // This preserves the "demo mode" functionality

        if (isAdminRoute) {
           // Only allow admin mock token for admin routes
           if (authToken !== "mock-admin-token") {
             // Redirect user mock token trying to access admin
             return NextResponse.redirect(new URL("/unauthorized", request.url))
           }
        }
        // Valid mock token for the context, proceed
      } else {
        // Production or real token: Verify signature using jose (Edge compatible)
        const secret = new TextEncoder().encode(JWT_SECRET)
        const { payload } = await jwtVerify(authToken, secret)

        // For admin routes, check if user has admin role in the verified payload
        if (isAdminRoute) {
          // Check role or type from the verified token
          // backend/src/lib/auth.ts generates tokens with 'role' and/or 'type'
          if (payload.role !== "admin" && payload.type !== "admin") {
            return NextResponse.redirect(new URL("/unauthorized", request.url))
          }
        }
      }
    } catch (error) {
      console.error("Token verification failed:", error)
      // Token is invalid or expired
      const loginUrl = isAdminRoute ? "/admin/login" : "/login"
      return NextResponse.redirect(new URL(loginUrl, request.url))
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
