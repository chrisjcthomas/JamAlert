"use client"

import { AlertMap } from "@/components/alert-map"
import { MainNav } from "@/components/navigation/main-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Info } from "lucide-react"

export default function MapPage() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Live Incident Map</h1>
              <p className="text-muted-foreground">
                Real-time incident tracking and alerts across all 14 parishes of Jamaica
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-blue-900 font-medium mb-1">How to use the map:</p>
                  <ul className="text-blue-800 space-y-1">
                    <li>• Click on incident markers to view detailed information</li>
                    <li>• Use filters to narrow down incidents by parish, type, severity, or time range</li>
                    <li>• The map automatically updates every 30 seconds with new incidents</li>
                    <li>• Markers are clustered when multiple incidents are close together</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <AlertMap 
          height="700px" 
          showFilters={true} 
          autoRefresh={true}
          refreshInterval={30000}
        />
      </div>
    </div>
  )
}