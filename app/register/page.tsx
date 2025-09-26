import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, ArrowLeft, MapPin, Bell, Users } from "lucide-react"
import Link from "next/link"
import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">JamAlert</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 text-foreground">Register for Alerts</h1>
            <p className="text-muted-foreground">
              Stay informed about emergencies and incidents in your area. Get real-time notifications to keep you and
              your family safe.
            </p>
          </div>

          {/* Benefits Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="p-2 rounded-lg bg-primary/10 w-fit mx-auto mb-2">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm font-medium text-foreground">Instant Alerts</div>
                <div className="text-xs text-muted-foreground">SMS & Email</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="p-2 rounded-lg bg-success/10 w-fit mx-auto mb-2">
                  <MapPin className="h-5 w-5 text-success" />
                </div>
                <div className="text-sm font-medium text-foreground">Location-Based</div>
                <div className="text-xs text-muted-foreground">Your Parish</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="p-2 rounded-lg bg-warning/10 w-fit mx-auto mb-2">
                  <Users className="h-5 w-5 text-warning" />
                </div>
                <div className="text-sm font-medium text-foreground">Community</div>
                <div className="text-xs text-muted-foreground">Stay Connected</div>
              </CardContent>
            </Card>
          </div>

          {/* Registration Form */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-foreground">Personal Information</CardTitle>
              <CardDescription className="text-muted-foreground">
                We&apos;ll use this information to send you relevant alerts for your area.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RegisterForm />
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already registered?{" "}
              <Link href="/my-alerts" className="text-primary hover:text-primary/80 transition-colors">
                Manage your alerts
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
