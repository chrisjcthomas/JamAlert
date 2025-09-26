"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { type AuthState, signIn as authSignIn, signOut as authSignOut, getCurrentUser } from "@/lib/auth"

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  const refreshUser = () => {
    const user = getCurrentUser()
    setAuthState({
      user,
      isLoading: false,
      isAuthenticated: !!user,
    })
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, isLoading: true }))

    try {
      const result = await authSignIn(email, password)
      if (result) {
        setAuthState({
          user: result.user,
          isLoading: false,
          isAuthenticated: true,
        })
        return true
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
        return false
      }
    } catch (error) {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
      return false
    }
  }

  const signOut = () => {
    authSignOut()
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    })
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
