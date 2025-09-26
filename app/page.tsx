"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MainNav } from "@/components/navigation/main-nav"
import { AlertCard } from "@/components/ui/alert-card"
import { AlertMap } from "@/components/alert-map"
import { Shield, MapPin, Bell, Users, AlertTriangle, ArrowRight, Phone } from "lucide-react"
import Link from "next/link"

// Mock recent alerts data
const recentAlerts = [
  {
    id: 1,
    type: "flood",
    severity: "high",
    title: "Flash Flood Warning",
    description: "Heavy rainfall causing flooding in Spanish Town Road area",
    location: "St. Catherine",
    time: "2 hours ago",
    status: "active",
  },
  {
    id: 2,
    type: "weather",
    severity: "medium",
    title: "Strong Wind Advisory",
    description: "Gusty winds expected in coastal areas",
    location: "St. James",
    time: "5 hours ago",
    status: "resolved",
  },
  {
    id: 3,
    type: "accident",
    severity: "medium",
    title: "Traffic Incident",
    description: "Multi-vehicle accident on A1 Highway",
    location: "St. Catherine",
    time: "1 day ago",
    status: "resolved",
  },
]

// Mock statistics
const stats = {
  activeAlerts: 1,
  totalUsers: 1247,
  reportsToday: 23,
  responseTime: "< 15 min",
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground text-balance">
              Stay Safe with Jamaica&apos;s Community Alert System
            </h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              Real-time emergency notifications, incident reporting, and community-driven safety updates to keep you
              informed and protected across all 14 parishes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Bell className="h-5 w-5 mr-2" />
                  Register for Alerts
                </Button>
              </Link>
              <a 
                href="#map"
                onClick={(e) => {
                  e.preventDefault()
                  const mapElement = document.getElementById('map')
                  if (mapElement) {
                    mapElement.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
              >
                <Button variant="outline" size="lg" className="border-border hover:border-primary bg-transparent">
                  <MapPin className="h-5 w-5 mr-2" />
                  View Live Map
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="bg-card border-border text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-destructive mb-2">{stats.activeAlerts}</div>
                <div className="text-sm text-muted-foreground">Active Alerts</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">{stats.totalUsers.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Registered Users</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-warning mb-2">{stats.reportsToday}</div>
                <div className="text-sm text-muted-foreground">Reports Today</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-success mb-2">{stats.responseTime}</div>
                <div className="text-sm text-muted-foreground">Response Time</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Alerts Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Recent Alerts</h2>
            <p className="text-muted-foreground">
              Stay updated with the latest emergency notifications and community reports
            </p>
          </div>
          <div className="max-w-4xl mx-auto space-y-4">
            {recentAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/my-alerts">
              <Button variant="outline" className="border-border hover:border-primary bg-transparent">
                View All Alerts
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Map Section */}
      <section id="map" className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Live Incident Map</h2>
            <p className="text-muted-foreground">
              Interactive map showing real-time incidents and alerts across Jamaica
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <AlertMap height="500px" showFilters={false} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">How JamAlert Works</h2>
            <p className="text-muted-foreground">
              Simple, effective community safety through technology and collaboration
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-card border-border text-center hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <div className="p-4 rounded-lg bg-primary/10 w-fit mx-auto mb-6">
                  <Bell className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Get Alerts</h3>
                <p className="text-muted-foreground">
                  Receive instant SMS and email notifications about emergencies and incidents in your parish.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border text-center hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <div className="p-4 rounded-lg bg-warning/10 w-fit mx-auto mb-6">
                  <AlertTriangle className="h-8 w-8 text-warning" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Report Incidents</h3>
                <p className="text-muted-foreground">
                  Help your community by reporting incidents, emergencies, and safety concerns in real-time.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border text-center hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <div className="p-4 rounded-lg bg-success/10 w-fit mx-auto mb-6">
                  <Users className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Stay Connected</h3>
                <p className="text-muted-foreground">
                  Join a network of informed citizens working together to keep Jamaica safe and resilient.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Emergency Numbers Section */}
      <section className="py-16 px-4 bg-destructive/5">
        <div className="container mx-auto">
          <Card className="bg-card border-destructive/20 max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-destructive">
                <Phone className="h-6 w-6" />
                Emergency Numbers
              </CardTitle>
              <CardDescription>For immediate life-threatening emergencies, call these numbers first:</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-background border-border text-center">
                  <CardContent className="p-4">
                    <div className="text-2xl mb-2">🚔</div>
                    <div className="font-semibold text-foreground">Police</div>
                    <div className="text-lg font-bold text-destructive">119</div>
                  </CardContent>
                </Card>
                <Card className="bg-background border-border text-center">
                  <CardContent className="p-4">
                    <div className="text-2xl mb-2">🚒</div>
                    <div className="font-semibold text-foreground">Fire Department</div>
                    <div className="text-lg font-bold text-destructive">110</div>
                  </CardContent>
                </Card>
                <Card className="bg-background border-border text-center">
                  <CardContent className="p-4">
                    <div className="text-2xl mb-2">🚑</div>
                    <div className="font-semibold text-foreground">Ambulance</div>
                    <div className="text-lg font-bold text-destructive">911</div>
                  </CardContent>
                </Card>
                <Card className="bg-background border-border text-center">
                  <CardContent className="p-4">
                    <div className="text-2xl mb-2">🆘</div>
                    <div className="font-semibold text-foreground">Disaster Emergency</div>
                    <div className="text-lg font-bold text-destructive">116</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Stay Informed?</h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of Jamaicans who trust JamAlert to keep them safe and informed about emergencies in their
              communities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Register Now
                </Button>
              </Link>
              <Link href="/help">
                <Button variant="outline" size="lg" className="border-border hover:border-primary bg-transparent">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold text-foreground">JamAlert</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Jamaica&apos;s community-driven emergency alert system, keeping citizens informed and safe.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link href="/register" className="block text-muted-foreground hover:text-primary transition-colors">
                  Register for Alerts
                </Link>
                <Link href="/report" className="block text-muted-foreground hover:text-primary transition-colors">
                  Report Incident
                </Link>
                <Link href="/help" className="block text-muted-foreground hover:text-primary transition-colors">
                  Help & Support
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Emergency</h4>
              <div className="space-y-2 text-sm">
                <div className="text-muted-foreground">Police: 119</div>
                <div className="text-muted-foreground">Fire: 110</div>
                <div className="text-muted-foreground">Ambulance: 911</div>
                <div className="text-muted-foreground">Disaster: 116</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Contact</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>support@jamalert.jm</div>
                <div>+1 (876) 555-ALERT</div>
                <div>Kingston, Jamaica</div>
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 JamAlert. All rights reserved. Built for community safety and resilience.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}