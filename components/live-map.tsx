"use client"

import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Mock incident data
const mockIncidents = [
  {
    id: 1,
    lat: 18.0179,
    lng: -76.8099,
    type: "flood",
    severity: "high",
    description: "Flash flooding on Spanish Town Road",
    time: "2 hours ago",
  },
  {
    id: 2,
    lat: 18.1096,
    lng: -77.2975,
    type: "accident",
    severity: "medium",
    description: "Traffic accident on A1 Highway",
    time: "45 minutes ago",
  },
  {
    id: 3,
    lat: 17.9909,
    lng: -76.7958,
    type: "power",
    severity: "low",
    description: "Power outage in New Kingston",
    time: "1 hour ago",
  },
  {
    id: 4,
    lat: 18.4671,
    lng: -77.9218,
    type: "weather",
    severity: "medium",
    description: "Strong winds in Montego Bay",
    time: "30 minutes ago",
  },
]

export function LiveMap() {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // This would normally initialize Leaflet.js
    // For now, we'll show a placeholder with mock data
    console.log("Map would initialize here with Leaflet.js")
  }, [])

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
      default:
        return "📍"
    }
  }

  return (
    <div className="space-y-6">
      {/* Map Placeholder */}
      <Card className="h-96 bg-card border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-card via-muted/20 to-card flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <div className="text-lg font-semibold mb-2 text-foreground">Interactive Map</div>
            <div className="text-sm text-muted-foreground">
              Leaflet.js integration will display live incident pins here
            </div>
          </div>
        </div>

        {/* Mock pins overlay */}
        <div className="absolute top-4 left-4 space-y-2">
          {mockIncidents.slice(0, 2).map((incident) => (
            <div
              key={incident.id}
              className="flex items-center gap-2 bg-card/95 backdrop-blur-sm rounded-lg p-2 border border-border shadow-lg"
            >
              <span className="text-lg">{getTypeIcon(incident.type)}</span>
              <Badge className={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
            </div>
          ))}
        </div>

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="w-4 h-4 bg-primary rounded-full animate-ping"></div>
            <div className="absolute top-0 left-0 w-4 h-4 bg-primary rounded-full"></div>
          </div>
        </div>
        <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="w-3 h-3 bg-warning rounded-full animate-ping animation-delay-1000"></div>
            <div className="absolute top-0 left-0 w-3 h-3 bg-warning rounded-full"></div>
          </div>
        </div>
        <div className="absolute bottom-1/3 right-1/3 transform translate-x-1/2 translate-y-1/2">
          <div className="relative">
            <div className="w-3 h-3 bg-destructive rounded-full animate-ping animation-delay-2000"></div>
            <div className="absolute top-0 left-0 w-3 h-3 bg-destructive rounded-full"></div>
          </div>
        </div>
      </Card>

      {/* Recent Incidents */}
      <div className="grid sm:grid-cols-2 gap-4">
        {mockIncidents.map((incident) => (
          <Card key={incident.id} className="bg-card border-border hover:border-primary/50 transition-colors">
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon(incident.type)}</span>
                  <Badge className={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{incident.time}</span>
              </div>
              <p className="text-sm text-foreground">{incident.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
