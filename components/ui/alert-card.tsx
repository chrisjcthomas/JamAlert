import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface AlertCardProps {
  alert: {
    id: number
    type: string
    severity: string
    title: string
    description?: string
    location: string
    time: string
    status: string
  }
  className?: string
}

export function AlertCard({ alert, className }: AlertCardProps) {
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
      case "accident":
        return "🚗"
      case "power":
        return "⚡"
      case "weather":
        return "🌪️"
      case "fire":
        return "🔥"
      case "crime":
        return "🚨"
      case "medical":
        return "🏥"
      default:
        return "📍"
    }
  }

  return (
    <Card className={cn("bg-card border-border hover:border-primary/50 transition-colors", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{getTypeIcon(alert.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-foreground">{alert.title}</h3>
                {alert.description && <p className="text-sm text-muted-foreground">{alert.description}</p>}
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
      </CardContent>
    </Card>
  )
}
