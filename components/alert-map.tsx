"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { Loader2, Filter, RefreshCw, MapPin, AlertTriangle, Info } from "lucide-react"
import { Button } from "./ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Badge } from "./ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { fetchMapData, MapIncident, IncidentType, Severity } from "../lib/api/incidents"
import { Parish } from "../lib/types"

// Dynamically import the map component to avoid SSR issues
const DynamicMap = dynamic(() => import('./map/interactive-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
})

interface AlertMapProps {
  height?: string
  showFilters?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function AlertMap({ 
  height = "400px", 
  showFilters = true, 
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: AlertMapProps) {
  const [mounted, setMounted] = useState(false)
  const [incidents, setIncidents] = useState<MapIncident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedParish, setSelectedParish] = useState<Parish | 'all'>('all')
  const [selectedIncidentType, setSelectedIncidentType] = useState<IncidentType | 'all'>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all')
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | 'all'>('24h')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Parish options for filtering
  const parishOptions = [
    { value: 'all', label: 'All Parishes' },
    { value: Parish.KINGSTON, label: 'Kingston' },
    { value: Parish.ST_ANDREW, label: 'St. Andrew' },
    { value: Parish.ST_THOMAS, label: 'St. Thomas' },
    { value: Parish.PORTLAND, label: 'Portland' },
    { value: Parish.ST_MARY, label: 'St. Mary' },
    { value: Parish.ST_ANN, label: 'St. Ann' },
    { value: Parish.TRELAWNY, label: 'Trelawny' },
    { value: Parish.ST_JAMES, label: 'St. James' },
    { value: Parish.HANOVER, label: 'Hanover' },
    { value: Parish.WESTMORELAND, label: 'Westmoreland' },
    { value: Parish.ST_ELIZABETH, label: 'St. Elizabeth' },
    { value: Parish.MANCHESTER, label: 'Manchester' },
    { value: Parish.CLARENDON, label: 'Clarendon' },
    { value: Parish.ST_CATHERINE, label: 'St. Catherine' },
  ]

  // Incident type options
  const incidentTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: IncidentType.FLOOD, label: 'Flood' },
    { value: IncidentType.WEATHER, label: 'Weather' },
    { value: IncidentType.ACCIDENT, label: 'Accident' },
    { value: IncidentType.FIRE, label: 'Fire' },
    { value: IncidentType.POWER, label: 'Power Outage' },
    { value: IncidentType.INFRASTRUCTURE, label: 'Infrastructure' },
    { value: IncidentType.MEDICAL, label: 'Medical' },
    { value: IncidentType.CRIME, label: 'Crime' },
    { value: IncidentType.OTHER, label: 'Other' },
  ]

  // Severity options
  const severityOptions = [
    { value: 'all', label: 'All Severities' },
    { value: Severity.HIGH, label: 'High' },
    { value: Severity.MEDIUM, label: 'Medium' },
    { value: Severity.LOW, label: 'Low' },
  ]

  // Time range options
  const timeRangeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '6h', label: 'Last 6 Hours' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: 'all', label: 'All Time' },
  ]

  // Filter incidents based on selected filters
  const filteredIncidents = useMemo(() => {
    let filtered = incidents

    // Filter by parish
    if (selectedParish !== 'all') {
      filtered = filtered.filter(incident => incident.parish === selectedParish)
    }

    // Filter by incident type
    if (selectedIncidentType !== 'all') {
      filtered = filtered.filter(incident => incident.incidentType === selectedIncidentType)
    }

    // Filter by severity
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(incident => incident.severity === selectedSeverity)
    }

    // Filter by time range
    if (timeRange !== 'all') {
      const now = new Date()
      const cutoff = new Date()
      
      switch (timeRange) {
        case '1h':
          cutoff.setHours(now.getHours() - 1)
          break
        case '6h':
          cutoff.setHours(now.getHours() - 6)
          break
        case '24h':
          cutoff.setDate(now.getDate() - 1)
          break
        case '7d':
          cutoff.setDate(now.getDate() - 7)
          break
      }
      
      filtered = filtered.filter(incident => new Date(incident.createdAt) >= cutoff)
    }

    return filtered
  }, [incidents, selectedParish, selectedIncidentType, selectedSeverity, timeRange])

  // Load map data
  const loadMapData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await fetchMapData()
      setIncidents(data.incidents)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Failed to load map data:', err)
      setError('Failed to load incident data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Manual refresh
  const handleRefresh = useCallback(() => {
    loadMapData()
  }, [loadMapData])

  // Reset filters
  const resetFilters = useCallback(() => {
    setSelectedParish('all')
    setSelectedIncidentType('all')
    setSelectedSeverity('all')
    setTimeRange('24h')
  }, [])

  // Initial load and auto-refresh setup
  useEffect(() => {
    setMounted(true)
    loadMapData()

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(loadMapData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [loadMapData, autoRefresh, refreshInterval])

  // Get incident statistics
  const stats = useMemo(() => {
    const total = filteredIncidents.length
    const high = filteredIncidents.filter(i => i.severity === Severity.HIGH).length
    const medium = filteredIncidents.filter(i => i.severity === Severity.MEDIUM).length
    const low = filteredIncidents.filter(i => i.severity === Severity.LOW).length
    
    return { total, high, medium, low }
  }, [filteredIncidents])

  if (!mounted) {
    return (
      <div className="rounded-lg overflow-hidden border border-border bg-muted/30 relative" style={{ height }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Map Filters & Statistics
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statistics */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {stats.total} Total
              </Badge>
              {stats.high > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {stats.high} High
                </Badge>
              )}
              {stats.medium > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-orange-100 text-orange-800 border-orange-200">
                  <Info className="h-3 w-3" />
                  {stats.medium} Medium
                </Badge>
              )}
              {stats.low > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {stats.low} Low
                </Badge>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Parish</label>
                <Select value={selectedParish} onValueChange={(value) => setSelectedParish(value as Parish | 'all')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {parishOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Incident Type</label>
                <Select value={selectedIncidentType} onValueChange={(value) => setSelectedIncidentType(value as IncidentType | 'all')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {incidentTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Severity</label>
                <Select value={selectedSeverity} onValueChange={(value) => setSelectedSeverity(value as Severity | 'all')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {severityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Time Range</label>
                <Select value={timeRange} onValueChange={(value) => setTimeRange(value as typeof timeRange)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRangeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Last refresh info */}
            <div className="text-xs text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
              {autoRefresh && ` • Auto-refresh every ${refreshInterval / 1000}s`}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map Container */}
      <div className="rounded-lg overflow-hidden border border-border bg-background relative" style={{ height }}>
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRefresh} size="sm">
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <DynamicMap 
            incidents={filteredIncidents}
            loading={loading}
            height={height}
          />
        )}
      </div>
    </div>
  )
}
