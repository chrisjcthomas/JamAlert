"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Bell, MapPin, Clock, Settings, LogOut, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { ProtectedRoute } from "@/components/auth/protected-route"

// Mock user alerts data
const userAlerts = [
  {
    id: 1,
    type: "flood",
    severity: "high",
    title: "Flash Flood Warning",
    description: "Heavy rainfall causing flooding in your area",
    location: "St. Catherine",
    time: "2 hours ago",
    status: "active",
  },
  {
    id: 2,
    type: "power",
    severity: "low",
    title: "Planned Power Outage",
    description: "Scheduled maintenance in your area",
    location: "St. Catherine",
    time: "1 day ago",
    status: "resolved",
  },
]

function DashboardContent() {
  const { user, signOut } = useAuth()

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-destructive text-destructive-foreground"
      case "medium":
        return "bg-warning text-warning-foreground"
      case "low":
        return "bg-success text-success-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "resolved":
        return "bg-success/10 text-success border-success/20"
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "flood":
        return "🌊"
      case "power":
        return "⚡"
      default:
        return "📍"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">JamAlert</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {user?.name}
            </div>
            <Button variant="outline" size="sm" className="border-border hover:border-primary bg-transparent">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-border hover:border-primary bg-transparent"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">Stay informed about incidents and alerts in {user?.parish}.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Bell className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">1</div>
                  <div className="text-sm text-muted-foreground">Active Alerts</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <MapPin className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{user?.parish}</div>
                  <div className="text-sm text-muted-foreground">Your Location</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">2</div>
                  <div className="text-sm text-muted-foreground">Total Alerts</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <CardTitle className="text-foreground">Your Recent Alerts</CardTitle>
            <CardDescription className="text-muted-foreground">
              Emergency alerts and notifications for your area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="text-2xl">{getTypeIcon(alert.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                        <Badge variant="outline" className={getStatusColor(alert.status)}>
                          {alert.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {alert.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {alert.time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-lg bg-warning/10 w-fit mx-auto mb-4">
                <Bell className="h-6 w-6 text-warning" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Report Incident</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Help your community by reporting incidents in your area
              </p>
              <Link href="/report">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Report Now</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-lg bg-success/10 w-fit mx-auto mb-4">
                <MapPin className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">View Live Map</h3>
              <p className="text-sm text-muted-foreground mb-4">
                See real-time incidents and alerts on the interactive map
              </p>
              <Link href="/#map">
                <Button variant="outline" className="border-border hover:border-primary bg-transparent">
                  View Map
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
