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
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  MessageSquare
} from "lucide-react"
import { PARISH_NAMES, Parish, IncidentType, Severity, ReportStatus } from "@/lib/types"

interface IncidentReport {
  id: string
  incidentType: IncidentType
  severity: Severity
  parish: Parish
  community?: string
  address?: string
  description: string
  incidentDate: string
  incidentTime?: string
  reporterName?: string
  reporterPhone?: string
  isAnonymous: boolean
  receiveUpdates: boolean
  status: ReportStatus
  verificationStatus: "unverified" | "community_confirmed" | "odpem_verified"
  latitude?: number
  longitude?: number
  createdAt: string
  updatedAt: string
}

const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  [IncidentType.FLOOD]: "Flood",
  [IncidentType.ACCIDENT]: "Accident",
  [IncidentType.FIRE]: "Fire",
  [IncidentType.POWER]: "Power Outage",
  [IncidentType.WEATHER]: "Weather",
  [IncidentType.CRIME]: "Crime",
  [IncidentType.MEDICAL]: "Medical",
  [IncidentType.INFRASTRUCTURE]: "Infrastructure",
  [IncidentType.OTHER]: "Other"
}

export default function IncidentReportsPage() {
  const [incidents, setIncidents] = useState<IncidentReport[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<IncidentReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [parishFilter, setParishFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null)
  const [reviewNote, setReviewNote] = useState("")
  const [isReviewing, setIsReviewing] = useState(false)

  useEffect(() => {
    fetchIncidents()
  }, [])

  useEffect(() => {
    filterIncidents()
  }, [incidents, searchTerm, parishFilter, statusFilter, typeFilter])

  const fetchIncidents = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      // Mock data for now - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockIncidents: IncidentReport[] = [
        {
          id: "1",
          incidentType: IncidentType.FLOOD,
          severity: Severity.HIGH,
          parish: Parish.ST_CATHERINE,
          community: "Spanish Town",
          address: "Burke Road, Spanish Town",
          description: "Heavy flooding on Burke Road blocking traffic. Water level approximately 2 feet deep. Several vehicles stranded.",
          incidentDate: "2024-01-21",
          incidentTime: "14:30",
          reporterName: "John Smith",
          reporterPhone: "+1876-555-0123",
          isAnonymous: false,
          receiveUpdates: true,
          status: ReportStatus.PENDING,
          verificationStatus: "unverified",
          latitude: 17.9927,
          longitude: -76.9568,
          createdAt: "2024-01-21T14:45:00Z",
          updatedAt: "2024-01-21T14:45:00Z"
        },
        {
          id: "2",
          incidentType: IncidentType.POWER,
          severity: Severity.MEDIUM,
          parish: Parish.ST_ANDREW,
          community: "Half Way Tree",
          description: "Power outage affecting the entire Half Way Tree area. Traffic lights not working.",
          incidentDate: "2024-01-21",
          incidentTime: "12:15",
          isAnonymous: true,
          receiveUpdates: false,
          status: ReportStatus.APPROVED,
          verificationStatus: "community_confirmed",
          createdAt: "2024-01-21T12:30:00Z",
          updatedAt: "2024-01-21T13:15:00Z"
        },
        {
          id: "3",
          incidentType: IncidentType.INFRASTRUCTURE,
          severity: Severity.LOW,
          parish: Parish.MANCHESTER,
          community: "Mandeville",
          address: "Main Street, Mandeville",
          description: "Large pothole on Main Street causing traffic delays.",
          incidentDate: "2024-01-20",
          reporterName: "Grace Williams",
          reporterPhone: "+1876-555-0789",
          isAnonymous: false,
          receiveUpdates: true,
          status: ReportStatus.REJECTED,
          verificationStatus: "unverified",
          createdAt: "2024-01-20T16:20:00Z",
          updatedAt: "2024-01-21T09:30:00Z"
        }
      ]
      
      setIncidents(mockIncidents)
    } catch (err) {
      setError("Failed to load incident reports")
    } finally {
      setIsLoading(false)
    }
  }

  const filterIncidents = () => {
    let filtered = incidents

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(incident =>
        incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.community?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.address?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Parish filter
    if (parishFilter !== "all") {
      filtered = filtered.filter(incident => incident.parish === parishFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(incident => incident.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(incident => incident.incidentType === typeFilter)
    }

    setFilteredIncidents(filtered)
  }

  const handleReviewIncident = async (incidentId: string, action: "approve" | "reject") => {
    try {
      setIsReviewing(true)
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newStatus = action === "approve" ? ReportStatus.APPROVED : ReportStatus.REJECTED
      
      setIncidents(incidents.map(incident => 
        incident.id === incidentId 
          ? { ...incident, status: newStatus, updatedAt: new Date().toISOString() }
          : incident
      ))
      
      setSelectedIncident(null)
      setReviewNote("")
    } catch (err) {
      setError(`Failed to ${action} incident`)
    } finally {
      setIsReviewing(false)
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

  const getStatusBadgeVariant = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.PENDING: return "secondary"
      case ReportStatus.APPROVED: return "default"
      case ReportStatus.REJECTED: return "destructive"
      case ReportStatus.RESOLVED: return "outline"
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Incident Reports</h1>
        <p className="text-muted-foreground">
          Review and manage community incident reports
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
            Search and filter incident reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="search">Search Reports</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Description, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Parish</Label>
              <Select value={parishFilter} onValueChange={setParishFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All parishes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Parishes</SelectItem>
                  {Object.entries(PARISH_NAMES).map(([value, label]) => (
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(INCIDENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setParishFilter("all")
                  setStatusFilter("all")
                  setTypeFilter("all")
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reports ({filteredIncidents.length})</CardTitle>
          <CardDescription>
            Community incident reports requiring review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {INCIDENT_TYPE_LABELS[incident.incidentType]}
                        </Badge>
                        <Badge variant={getSeverityBadgeVariant(incident.severity)}>
                          {incident.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {incident.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <MapPin className="mr-1 h-3 w-3" />
                        {PARISH_NAMES[incident.parish]}
                      </div>
                      {incident.community && (
                        <div className="text-sm text-muted-foreground">
                          {incident.community}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {incident.isAnonymous ? (
                        <div className="text-sm text-muted-foreground">
                          Anonymous
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-medium">
                            {incident.reporterName}
                          </div>
                          {incident.reporterPhone && (
                            <div className="text-xs text-muted-foreground">
                              {incident.reporterPhone}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(incident.status)}>
                      {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-1 h-3 w-3" />
                        {incident.incidentDate}
                      </div>
                      {incident.incidentTime && (
                        <div className="text-xs text-muted-foreground">
                          {incident.incidentTime}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedIncident(incident)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Review Incident Report</DialogTitle>
                          <DialogDescription>
                            Review the details and take action on this incident report
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedIncident && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Type & Severity</Label>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline">
                                    {INCIDENT_TYPE_LABELS[selectedIncident.incidentType]}
                                  </Badge>
                                  <Badge variant={getSeverityBadgeVariant(selectedIncident.severity)}>
                                    {selectedIncident.severity.toUpperCase()}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <div className="mt-1">
                                  <Badge variant={getStatusBadgeVariant(selectedIncident.status)}>
                                    {selectedIncident.status.charAt(0).toUpperCase() + selectedIncident.status.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">Location</Label>
                              <div className="mt-1 text-sm">
                                <div>{PARISH_NAMES[selectedIncident.parish]}</div>
                                {selectedIncident.community && (
                                  <div className="text-muted-foreground">{selectedIncident.community}</div>
                                )}
                                {selectedIncident.address && (
                                  <div className="text-muted-foreground">{selectedIncident.address}</div>
                                )}
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">Description</Label>
                              <div className="mt-1 text-sm bg-gray-50 p-3 rounded">
                                {selectedIncident.description}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Reporter</Label>
                                <div className="mt-1 text-sm">
                                  {selectedIncident.isAnonymous ? (
                                    <span className="text-muted-foreground">Anonymous</span>
                                  ) : (
                                    <div>
                                      <div>{selectedIncident.reporterName}</div>
                                      {selectedIncident.reporterPhone && (
                                        <div className="text-muted-foreground">{selectedIncident.reporterPhone}</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Incident Date/Time</Label>
                                <div className="mt-1 text-sm">
                                  <div>{selectedIncident.incidentDate}</div>
                                  {selectedIncident.incidentTime && (
                                    <div className="text-muted-foreground">{selectedIncident.incidentTime}</div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {selectedIncident.status === ReportStatus.PENDING && (
                              <div>
                                <Label htmlFor="reviewNote" className="text-sm font-medium">
                                  Review Note (Optional)
                                </Label>
                                <Textarea
                                  id="reviewNote"
                                  placeholder="Add a note about your decision..."
                                  value={reviewNote}
                                  onChange={(e) => setReviewNote(e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {selectedIncident?.status === ReportStatus.PENDING && (
                          <DialogFooter className="gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handleReviewIncident(selectedIncident.id, "reject")}
                              disabled={isReviewing}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                            <Button
                              onClick={() => handleReviewIncident(selectedIncident.id, "approve")}
                              disabled={isReviewing}
                            >
                              {isReviewing ? (
                                <LoadingSpinner className="mr-2 h-4 w-4" />
                              ) : (
                                <CheckCircle className="mr-2 h-4 w-4" />
                              )}
                              Approve
                            </Button>
                          </DialogFooter>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredIncidents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No incident reports found matching the current filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}