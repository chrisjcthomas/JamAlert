import { apiClient, ApiError } from "./api-client"

// Authentication utilities and types
export interface User {
  id: string
  email: string
  name: string
  role: "user" | "admin"
  parish?: string
  phone?: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface LoginResponse {
  token: string
  user: User
}

// Real authentication functions that connect to the backend
export async function signIn(email: string, password: string): Promise<{ user: User; token: string } | null> {
  try {
    const response = await apiClient.post<LoginResponse>("/auth/login", {
      email,
      password
    })

    // Store in localStorage
    localStorage.setItem("auth-token", response.token)
    localStorage.setItem("auth-user", JSON.stringify(response.user))

    return response
  } catch (error) {
    // In demo mode, the API client should handle mock responses.
    // We should not have hardcoded credentials here as a fallback.
    return null
  }
}

export async function signUp(userData: {
  email: string
  password: string
  name: string
  parish?: string
  phone?: string
}): Promise<{ user: User; token: string } | null> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const user: User = {
    id: Date.now().toString(),
    email: userData.email,
    name: userData.name,
    role: "user",
    parish: userData.parish,
    phone: userData.phone,
    createdAt: new Date().toISOString(),
  }

  const token = `mock-token-${user.id}`

  localStorage.setItem("auth-token", token)
  localStorage.setItem("auth-user", JSON.stringify(user))

  return { user, token }
}

export function signOut(): void {
  localStorage.removeItem("auth-token")
  localStorage.removeItem("auth-user")
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userStr = localStorage.getItem("auth-user")
  if (!userStr) return null

  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth-token")
}

export function isAuthenticated(): boolean {
  return !!getAuthToken() && !!getCurrentUser()
}

export function isAdmin(): boolean {
  const user = getCurrentUser()
  return user?.role === "admin"
}
