"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Settings, LogOut, MessageSquare, Star, Archive } from "lucide-react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/auth/protected-route"

// Mock feedback data
const mockFeedback = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@email.com",
    subject: "Great App!",
    message: "This is a fantastic tool for community safety. Very easy to use and provides timely alerts. Keep up the great work!",
    timestamp: "2024-07-22T10:30:00Z",
    status: "read",
  },
  {
    id: 2,
    name: "Sarah Davis",
    email: "sarah.davis@email.com",
    subject: "Map Feature Suggestion",
    message: "It would be helpful if the map could show a history of alerts for a specific area over the last 24 hours.",
    timestamp: "2024-07-21T15:45:00Z",
    status: "new",
  },
  {
    id: 3,
    name: "Robert Brown",
    email: "robert.brown@email.com",
    subject: "Registration Issue",
    message: "I had some trouble registering with my phone number. The confirmation code took a long time to arrive.",
    timestamp: "2024-07-21T09:12:00Z",
    status: "archived",
  },
  {
    id: 4,
    name: "Anonymous",
    email: "",
    subject: "Thank You",
    message: "The flood alert yesterday was a lifesaver. Thank you for this service.",
    timestamp: "2024-07-20T18:00:00Z",
    status: "read",
  },
];

function AdminFeedbackContent() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "read":
        return "bg-success/10 text-success border-success/20"
      case "archived":
        return "bg-muted/10 text-muted-foreground border-muted/20"
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-foreground">JamAlert Admin</span>
            </div>
            <nav className="hidden md:flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link href="/admin/users" className="text-muted-foreground hover:text-foreground transition-colors">
                Users
              </Link>
              <Link href="/admin/alerts" className="text-muted-foreground hover:text-foreground transition-colors">
                Alerts
              </Link>
              <Link href="/admin/feedback" className="text-primary font-medium">
                Feedback
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-border hover:border-primary bg-transparent">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Link href="/admin/login">
              <Button variant="outline" size="sm" className="border-border hover:border-primary bg-transparent">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">User Feedback</h1>
            <p className="text-muted-foreground">Review and manage feedback submitted by users</p>
          </div>
        </div>

        {/* Feedback Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Inbox</CardTitle>
            <CardDescription className="text-muted-foreground">
              Showing all user-submitted messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-foreground">User</TableHead>
                  <TableHead className="text-foreground">Subject</TableHead>
                  <TableHead className="text-foreground">Message</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-foreground">Received</TableHead>
                  <TableHead className="text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockFeedback.map((item) => (
                  <TableRow key={item.id} className="border-border">
                    <TableCell className="font-medium">
                      <div className="text-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.email}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.subject}</TableCell>
                    <TableCell className="text-muted-foreground max-w-sm truncate">{item.message}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(item.timestamp).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border hover:border-primary bg-transparent"
                        >
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminFeedbackPage() {
  return (
    <ProtectedRoute requireAdmin={true} redirectTo="/admin/login">
      <AdminFeedbackContent />
    </ProtectedRoute>
  )
}
