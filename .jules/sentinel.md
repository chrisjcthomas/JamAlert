# Sentinel Journal

This journal records critical security learnings and vulnerabilities discovered during security reviews.

## 2024-05-23 - Critical Auth Bypass in Middleware
**Vulnerability:** The Next.js middleware blindly trusted the `auth-user` cookie to verify admin roles, allowing any user to impersonate an admin by modifying this cookie.
**Learning:** Client-side cookies (even if HttpOnly) are user input. Never trust `auth-user` or similar cookies for authorization decisions without verifying a signed token (JWT) or session ID on the server/edge.
**Prevention:** Always verify the JWT signature in the middleware or fetch the user session from a secure store using the session token. Do not rely on unverified cookie data for access control.
