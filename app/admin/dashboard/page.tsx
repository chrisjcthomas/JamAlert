"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Users, 
  AlertTriangle, 
  Bell, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalIncidents: number
  pendingIncidents: number
  totalAlerts: number
  alertsToday: number
  systemHealth: {
    status: "healthy" | "warning" | "error"
    uptime: string
    lastCheck: string
  }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      // Mock data for now - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockStats: DashboardStats = {
        totalUsers: 1247,
        activeUsers: 892,
        totalIncidents: 156,
        pendingIncidents: 8,
        totalAlerts: 89,
        alertsToday: 3,
        systemHealth: {
          status: "healthy",
          uptime: "99.9%",
          lastCheck: new Date().toISOString()
        }
      }
      
      setStats(mockStats)
    } catch (err) {
      setError("Failed to load dashboard statistics")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!stats) return null

  const getHealthBadgeVariant = (status: string) => {
    switch (status) {
      case "healthy": return "default"
      case "warning": return "secondary"
      case "error": return "destructive"
      default: return "default"
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="h-4 w-4" />
      case "warning": return <AlertTriangle className="h-4 w-4" />
      case "error": return <XCircle className="h-4 w-4" />
      default: return <CheckCircle className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of JamAlert system status and statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incident Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIncidents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingIncidents} pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts Sent</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.alertsToday} sent today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={getHealthBadgeVariant(stats.systemHealth.status)}>
                {getHealthIcon(stats.systemHealth.status)}
                <span className="ml-1 capitalize">{stats.systemHealth.status}</span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.systemHealth.uptime} uptime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
            <CardDescription>
              Latest incident reports requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  id: "1",
                  type: "Flood",
                  location: "Spanish Town, St. Catherine",
                  severity: "High",
                  time: "2 hours ago"
                },
                {
                  id: "2",
                  type: "Power Outage",
                  location: "Half Way Tree, St. Andrew",
                  severity: "Medium",
                  time: "4 hours ago"
                },
                {
                  id: "3",
                  type: "Road Closure",
                  location: "Mandeville, Manchester",
                  severity: "Low",
                  time: "6 hours ago"
                }
              ].map((incident) => (
                <div key={incident.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{incident.type}</p>
                    <p className="text-xs text-muted-foreground">{incident.location}</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        incident.severity === "High" ? "destructive" :
                        incident.severity === "Medium" ? "secondary" : "default"
                      }
                    >
                      {incident.severity}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{incident.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system components and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Weather API", status: "healthy", lastCheck: "1 min ago" },
                { name: "Email Service", status: "healthy", lastCheck: "2 min ago" },
                { name: "Database", status: "healthy", lastCheck: "30 sec ago" },
                { name: "Push Notifications", status: "warning", lastCheck: "5 min ago" }
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {service.lastCheck}
                    </p>
                  </div>
                  <Badge variant={getHealthBadgeVariant(service.status)}>
                    {getHealthIcon(service.status)}
                    <span className="ml-1 capitalize">{service.status}</span>
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}