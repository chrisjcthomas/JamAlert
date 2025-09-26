import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        {/* Back to Home */}
        <div className="mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Login Card */}
        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-foreground">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground">Sign in to access your JamAlert account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <LoginForm redirectTo="/dashboard" showDemoCredentials={true} />

            <div className="text-center">
              <a href="#" className="text-sm text-primary hover:text-primary/80 transition-colors">
                Forgot your password?
              </a>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary hover:text-primary/80 transition-colors">
                  Register for alerts
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
