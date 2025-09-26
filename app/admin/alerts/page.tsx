"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Plus, 
  Send, 
  Eye, 
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Bell,
  Calendar,
  AlertCircle
} from "lucide-react"
import { PARISH_NAMES, Parish, Severity } from "@/lib/types"

interface AlertRecord {
  id: string
  type: "flood" | "weather" | "emergency" | "all_clear"
  severity: Severity
  title: string
  message: string
  parishes: Parish[]
  createdBy?: string
  createdAt: string
  expiresAt?: string
  deliveryStatus: "pending" | "sending" | "completed" | "failed"
  recipientCount: number
  deliveredCount: number
  failedCount: number
}

interface NewAlert {
  type: "flood" | "weather" | "emergency" | "all_clear"
  severity: Severity
  title: string
  message: string
  parishes: Parish[]
  expiresAt?: string
}

const ALERT_TYPE_LABELS = {
  flood: "Flood Alert",
  weather: "Weather Alert", 
  emergency: "Emergency Alert",
  all_clear: "All Clear"
}

export default function AlertManagementPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [newAlert, setNewAlert] = useState<NewAlert>({
    type: "flood",
    severity: Severity.MEDIUM,
    title: "",
    message: "",
    parishes: [],
    expiresAt: ""
  })

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      // Mock data for now - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockAlerts: AlertRecord[] = [
        {
          id: "1",
          type: "flood",
          severity: Severity.HIGH,
          title: "Flash Flood Warning - Spanish Town",
          message: "URGENT: Flash flooding reported in Spanish Town area. Avoid Burke Road and surrounding streets. Seek higher ground immediately. Emergency services are responding. Call 119 for assistance.",
          parishes: [Parish.ST_CATHERINE],
          createdBy: "admin@jamalert.jm",
          createdAt: "2024-01-21T14:45:00Z",
          expiresAt: "2024-01-22T02:00:00Z",
          deliveryStatus: "completed",
          recipientCount: 1247,
          deliveredCount: 1198,
          failedCount: 49
        },
        {
          id: "2",
          type: "weather",
          severity: Severity.MEDIUM,
          title: "Heavy Rain Advisory",
          message: "Heavy rainfall expected across Kingston and St. Andrew parishes for the next 6 hours. Exercise caution when driving and avoid low-lying areas prone to flooding.",
          parishes: [Parish.KINGSTON, Parish.ST_ANDREW],
          createdBy: "admin@jamalert.jm",
          createdAt: "2024-01-21T08:30:00Z",
          expiresAt: "2024-01-21T20:00:00Z",
          deliveryStatus: "completed",
          recipientCount: 2156,
          deliveredCount: 2089,
          failedCount: 67
        },
        {
          id: "3",
          type: "all_clear",
          severity: Severity.LOW,
          title: "All Clear - Power Restored",
          message: "Power has been restored to Half Way Tree area. Traffic lights are now operational. Thank you for your patience.",
          parishes: [Parish.ST_ANDREW],
          createdBy: "admin@jamalert.jm",
          createdAt: "2024-01-21T16:20:00Z",
          deliveryStatus: "sending",
          recipientCount: 892,
          deliveredCount: 654,
          failedCount: 12
        }
      ]
      
      setAlerts(mockAlerts)
    } catch (err) {
      setError("Failed to load alerts")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendAlert = async () => {
    try {
      setIsSending(true)
      setError("")
      
      // Validate form
      if (!newAlert.title.trim() || !newAlert.message.trim() || newAlert.parishes.length === 0) {
        setError("Please fill in all required fields and select at least one parish")
        return
      }
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const alertRecord: AlertRecord = {
        id: Date.now().toString(),
        ...newAlert,
        createdBy: "admin@jamalert.jm",
        createdAt: new Date().toISOString(),
        deliveryStatus: "sending",
        recipientCount: newAlert.parishes.length * 400, // Mock calculation
        deliveredCount: 0,
        failedCount: 0
      }
      
      setAlerts([alertRecord, ...alerts])
      setIsCreateDialogOpen(false)
      setNewAlert({
        type: "flood",
        severity: Severity.MEDIUM,
        title: "",
        message: "",
        parishes: [],
        expiresAt: ""
      })
    } catch (err) {
      setError("Failed to send alert")
    } finally {
      setIsSending(false)
    }
  }

  const handleParishToggle = (parish: Parish, checked: boolean) => {
    if (checked) {
      setNewAlert(prev => ({
        ...prev,
        parishes: [...prev.parishes, parish]
      }))
    } else {
      setNewAlert(prev => ({
        ...prev,
        parishes: prev.parishes.filter(p => p !== parish)
      }))
    }
  }

  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>
      case "sending": return <Badge variant="secondary"><Send className="mr-1 h-3 w-3" />Sending</Badge>
      case "completed": return <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>
      case "failed": return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Failed</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSeverityBadgeVariant = (severity: Severity) => {
    switch (severity) {
      case Severity.HIGH: return "destructive"
      case Severity.MEDIUM: return "secondary"
      case Severity.LOW: return "default"
      default: return "default"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alert Management</h1>
          <p className="text-muted-foreground">
            Send manual alerts and view alert history
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Send Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send New Alert</DialogTitle>
              <DialogDescription>
                Create and send an alert to selected parishes
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Alert Type</Label>
                  <Select 
                    value={newAlert.type} 
                    onValueChange={(value: any) => setNewAlert(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ALERT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select 
                    value={newAlert.severity} 
                    onValueChange={(value: Severity) => setNewAlert(prev => ({ ...prev, severity: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Severity.LOW}>Low</SelectItem>
                      <SelectItem value={Severity.MEDIUM}>Medium</SelectItem>
                      <SelectItem value={Severity.HIGH}>High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Alert Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief, descriptive title for the alert"
                  value={newAlert.title}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Alert Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Clear, actionable message with specific guidance..."
                  value={newAlert.message}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Include specific actions, locations, and emergency contact numbers (119, 110, 911, 116)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Target Parishes *</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                  {Object.entries(PARISH_NAMES).map(([value, label]) => (
                    <div key={value} className="flex items-center space-x-2">
                      <Checkbox
                        id={value}
                        checked={newAlert.parishes.includes(value as Parish)}
                        onCheckedChange={(checked) => handleParishToggle(value as Parish, checked as boolean)}
                      />
                      <Label htmlFor={value} className="text-sm font-normal">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {newAlert.parishes.length} parish{newAlert.parishes.length !== 1 ? 'es' : ''}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires">Expiration (Optional)</Label>
                <Input
                  id="expires"
                  type="datetime-local"
                  value={newAlert.expiresAt}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, expiresAt: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for alerts that don't expire
                </p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendAlert}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Sending Alert...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Alert
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Alert History */}
      <Card>
        <CardHeader>
          <CardTitle>Alert History</CardTitle>
          <CardDescription>
            Recent alerts sent through the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alert</TableHead>
                <TableHead>Parishes</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {ALERT_TYPE_LABELS[alert.type]}
                        </Badge>
                        <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="font-medium">{alert.title}</div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {alert.message}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {alert.parishes.slice(0, 2).map(parish => (
                        <div key={parish} className="text-sm">
                          {PARISH_NAMES[parish]}
                        </div>
                      ))}
                      {alert.parishes.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{alert.parishes.length - 2} more
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getDeliveryStatusBadge(alert.deliveryStatus)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {alert.recipientCount.toLocaleString()} total
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {alert.deliveredCount.toLocaleString()} delivered
                        {alert.failedCount > 0 && (
                          <span className="text-red-600">
                            , {alert.failedCount} failed
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDate(alert.createdAt)}
                      </div>
                      {alert.createdBy && (
                        <div className="text-xs text-muted-foreground">
                          by {alert.createdBy}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {alerts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No alerts have been sent yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}