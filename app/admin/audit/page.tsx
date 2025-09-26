"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Search, 
  Filter, 
  Eye, 
  Calendar,
  User,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  AlertCircle
} from "lucide-react"

interface AuditLogEntry {
  id: string
  timestamp: string
  userId: string
  userEmail: string
  action: string
  resource: string
  resourceId?: string
  details: string
  ipAddress: string
  userAgent: string
  status: "success" | "failure" | "warning"
  metadata?: Record<string, any>
}

const ACTION_CATEGORIES = {
  auth: "Authentication",
  user: "User Management", 
  alert: "Alert Management",
  incident: "Incident Management",
  system: "System Configuration"
}

const ACTION_ICONS = {
  auth: Shield,
  user: User,
  alert: AlertTriangle,
  incident: Activity,
  system: Settings
}

export default function AuditLogPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  useEffect(() => {
    filterLogs()
  }, [auditLogs, searchTerm, actionFilter, statusFilter, dateFilter])

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      // Mock data for now - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockLogs: AuditLogEntry[] = [
        {
          id: "1",
          timestamp: "2024-01-21T16:45:00Z",
          userId: "admin-1",
          userEmail: "admin@jamalert.jm",
          action: "alert.send",
          resource: "alert",
          resourceId: "alert-123",
          details: "Sent flood alert to St. Catherine parish",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          status: "success",
          metadata: {
            alertType: "flood",
            severity: "high",
            parishes: ["st_catherine"],
            recipientCount: 1247
          }
        },
        {
          id: "2",
          timestamp: "2024-01-21T15:30:00Z",
          userId: "admin-1",
          userEmail: "admin@jamalert.jm",
          action: "incident.approve",
          resource: "incident",
          resourceId: "incident-456",
          details: "Approved incident report for flooding in Spanish Town",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          status: "success",
          metadata: {
            incidentType: "flood",
            parish: "st_catherine",
            severity: "high"
          }
        },
        {
          id: "3",
          timestamp: "2024-01-21T14:15:00Z",
          userId: "admin-1",
          userEmail: "admin@jamalert.jm",
          action: "auth.login",
          resource: "session",
          details: "Admin user logged in successfully",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          status: "success"
        },
        {
          id: "4",
          timestamp: "2024-01-21T13:45:00Z",
          userId: "admin-2",
          userEmail: "moderator@jamalert.jm",
          action: "user.deactivate",
          resource: "user",
          resourceId: "user-789",
          details: "Deactivated user account for policy violation",
          ipAddress: "10.0.0.50",
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          status: "success",
          metadata: {
            reason: "policy_violation",
            userEmail: "violator@example.com"
          }
        },
        {
          id: "5",
          timestamp: "2024-01-21T12:20:00Z",
          userId: "admin-1",
          userEmail: "admin@jamalert.jm",
          action: "system.config_update",
          resource: "system",
          details: "Updated weather alert thresholds for Kingston parish",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          status: "success",
          metadata: {
            parish: "kingston",
            oldThreshold: 50,
            newThreshold: 45
          }
        },
        {
          id: "6",
          timestamp: "2024-01-21T11:30:00Z",
          userId: "unknown",
          userEmail: "hacker@malicious.com",
          action: "auth.login",
          resource: "session",
          details: "Failed login attempt with invalid credentials",
          ipAddress: "203.0.113.42",
          userAgent: "curl/7.68.0",
          status: "failure",
          metadata: {
            reason: "invalid_credentials",
            attempts: 5
          }
        }
      ]
      
      setAuditLogs(mockLogs)
    } catch (err) {
      setError("Failed to load audit logs")
    } finally {
      setIsLoading(false)
    }
  }

  const filterLogs = () => {
    let filtered = auditLogs

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress.includes(searchTerm)
      )
    }

    // Action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter(log => log.action.startsWith(actionFilter))
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(log => log.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
      }
      
      if (dateFilter !== "all") {
        filtered = filtered.filter(log => new Date(log.timestamp) >= filterDate)
      }
    }

    setFilteredLogs(filtered)
  }

  const getActionCategory = (action: string): string => {
    const category = action.split('.')[0]
    return ACTION_CATEGORIES[category as keyof typeof ACTION_CATEGORIES] || "Other"
  }

  const getActionIcon = (action: string) => {
    const category = action.split('.')[0]
    const IconComponent = ACTION_ICONS[category as keyof typeof ACTION_ICONS] || Activity
    return <IconComponent className="h-4 w-4" />
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success": 
        return <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Success</Badge>
      case "failure": 
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Failure</Badge>
      case "warning": 
        return <Badge variant="secondary"><AlertTriangle className="mr-1 h-3 w-3" />Warning</Badge>
      default: 
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  }

  const formatUserAgent = (userAgent: string) => {
    if (userAgent.includes("Chrome")) return "Chrome"
    if (userAgent.includes("Firefox")) return "Firefox"
    if (userAgent.includes("Safari")) return "Safari"
    if (userAgent.includes("curl")) return "curl"
    return "Unknown"
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track all administrative actions and system events
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Search and filter audit log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="search">Search Logs</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="User, action, IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Action Category</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {Object.entries(ACTION_CATEGORIES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failure</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time Period</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setActionFilter("all")
                  setStatusFilter("all")
                  setDateFilter("all")
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Entries ({filteredLogs.length})</CardTitle>
          <CardDescription>
            Chronological log of all administrative actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-1 h-3 w-3" />
                      {formatDate(log.timestamp)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{log.userEmail}</div>
                      <div className="text-xs text-muted-foreground">
                        ID: {log.userId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getActionIcon(log.action)}
                      <div>
                        <div className="text-sm font-medium">{log.action}</div>
                        <div className="text-xs text-muted-foreground">
                          {getActionCategory(log.action)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm line-clamp-2">{log.details}</p>
                      {log.resourceId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Resource: {log.resourceId}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(log.status)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-mono">{log.ipAddress}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatUserAgent(log.userAgent)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Audit Log Details</DialogTitle>
                          <DialogDescription>
                            Complete information for this audit log entry
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedLog && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Timestamp</Label>
                                <div className="mt-1 text-sm">{formatDate(selectedLog.timestamp)}</div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">User</Label>
                                <div className="mt-1 text-sm">
                                  <div>{selectedLog.userEmail}</div>
                                  <div className="text-muted-foreground">ID: {selectedLog.userId}</div>
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Action</Label>
                                <div className="mt-1 text-sm">
                                  <div className="flex items-center space-x-2">
                                    {getActionIcon(selectedLog.action)}
                                    <span>{selectedLog.action}</span>
                                  </div>
                                  <div className="text-muted-foreground">{getActionCategory(selectedLog.action)}</div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">Details</Label>
                              <div className="mt-1 text-sm bg-gray-50 p-3 rounded">
                                {selectedLog.details}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">IP Address</Label>
                                <div className="mt-1 text-sm font-mono">{selectedLog.ipAddress}</div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">User Agent</Label>
                                <div className="mt-1 text-sm">{formatUserAgent(selectedLog.userAgent)}</div>
                              </div>
                            </div>

                            {selectedLog.resourceId && (
                              <div>
                                <Label className="text-sm font-medium">Resource</Label>
                                <div className="mt-1 text-sm">
                                  <div>Type: {selectedLog.resource}</div>
                                  <div>ID: {selectedLog.resourceId}</div>
                                </div>
                              </div>
                            )}

                            {selectedLog.metadata && (
                              <div>
                                <Label className="text-sm font-medium">Additional Data</Label>
                                <div className="mt-1 text-sm bg-gray-50 p-3 rounded font-mono">
                                  <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No audit log entries found matching the current filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}