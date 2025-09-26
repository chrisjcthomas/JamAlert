"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Lock, User, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface LoginFormProps {
  redirectTo?: string
  showDemoCredentials?: boolean
}

export function LoginForm({ redirectTo = "/dashboard", showDemoCredentials = false }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const success = await signIn(email, password)
      if (success) {
        router.push(redirectTo)
      } else {
        setError("Invalid email or password")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert className="border-destructive/50 text-destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showDemoCredentials && (
        <Alert className="border-primary/50 bg-primary/5">
          <AlertDescription className="text-sm">
            <strong>Demo Credentials:</strong>
            <br />
            Admin: admin@jamalert.jm / admin123
            <br />
            User: user@example.com / user123
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground">
          Email Address
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="remember"
          className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <Label htmlFor="remember" className="text-sm text-muted-foreground">
          Remember me
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        size="lg"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Signing In...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  )
}
