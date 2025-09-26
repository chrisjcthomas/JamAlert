import type { Alert } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Clock } from "lucide-react"

interface AlertStatusProps {
  alerts: Alert[]
}

export function AlertStatus({ alerts }: AlertStatusProps) {
  const activeAlerts = alerts.filter((alert) => alert.status === "active")
  const recentAlerts = alerts
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3)

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Alert Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Active Alerts</span>
          <Badge variant={activeAlerts.length > 0 ? "destructive" : "outline"}>{activeAlerts.length}</Badge>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Recent Alerts</h4>
          {recentAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent alerts</p>
          ) : (
            recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">{alert.parish}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getSeverityVariant(alert.severity)} className="text-xs">
                      {alert.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
