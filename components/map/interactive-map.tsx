"use client"

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import { MapIncident, IncidentType, Severity } from '../../lib/api/incidents'
import { Parish } from '../../lib/types'

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface InteractiveMapProps {
  incidents: MapIncident[]
  loading?: boolean
  height?: string
}

// Jamaica parish boundaries (simplified coordinates)
const PARISH_BOUNDARIES = {
  [Parish.KINGSTON]: {
    center: [17.9970, -76.7936] as [number, number],
    bounds: [[17.9, -76.85], [18.05, -76.73]] as [[number, number], [number, number]]
  },
  [Parish.ST_ANDREW]: {
    center: [18.0179, -76.8099] as [number, number],
    bounds: [[17.95, -76.9], [18.1, -76.7]] as [[number, number], [number, number]]
  },
  [Parish.ST_THOMAS]: {
    center: [17.9186, -76.3621] as [number, number],
    bounds: [[17.85, -76.45], [18.0, -76.25]] as [[number, number], [number, number]]
  },
  [Parish.PORTLAND]: {
    center: [18.1818, -76.4621] as [number, number],
    bounds: [[18.1, -76.6], [18.25, -76.3]] as [[number, number], [number, number]]
  },
  [Parish.ST_MARY]: {
    center: [18.3679, -76.9621] as [number, number],
    bounds: [[18.25, -77.1], [18.45, -76.8]] as [[number, number], [number, number]]
  },
  [Parish.ST_ANN]: {
    center: [18.4186, -77.1954] as [number, number],
    bounds: [[18.3, -77.35], [18.55, -77.0]] as [[number, number], [number, number]]
  },
  [Parish.TRELAWNY]: {
    center: [18.3454, -77.5621] as [number, number],
    bounds: [[18.25, -77.7], [18.45, -77.4]] as [[number, number], [number, number]]
  },
  [Parish.ST_JAMES]: {
    center: [18.4954, -77.9287] as [number, number],
    bounds: [[18.4, -78.05], [18.6, -77.8]] as [[number, number], [number, number]]
  },
  [Parish.HANOVER]: {
    center: [18.4287, -78.1287] as [number, number],
    bounds: [[18.35, -78.25], [18.5, -78.0]] as [[number, number], [number, number]]
  },
  [Parish.WESTMORELAND]: {
    center: [18.3121, -78.1454] as [number, number],
    bounds: [[18.2, -78.35], [18.4, -77.95]] as [[number, number], [number, number]]
  },
  [Parish.ST_ELIZABETH]: {
    center: [18.0954, -77.7621] as [number, number],
    bounds: [[17.9, -78.0], [18.3, -77.5]] as [[number, number], [number, number]]
  },
  [Parish.MANCHESTER]: {
    center: [18.0454, -77.4954] as [number, number],
    bounds: [[17.9, -77.7], [18.2, -77.3]] as [[number, number], [number, number]]
  },
  [Parish.CLARENDON]: {
    center: [17.9621, -77.2454] as [number, number],
    bounds: [[17.8, -77.5], [18.1, -77.0]] as [[number, number], [number, number]]
  },
  [Parish.ST_CATHERINE]: {
    center: [17.9954, -76.9621] as [number, number],
    bounds: [[17.85, -77.15], [18.15, -76.75]] as [[number, number], [number, number]]
  }
}

// Color schemes for different incident types and severities
const INCIDENT_COLORS = {
  [IncidentType.FLOOD]: '#3B82F6', // Blue
  [IncidentType.WEATHER]: '#8B5CF6', // Purple
  [IncidentType.FIRE]: '#EF4444', // Red
  [IncidentType.ACCIDENT]: '#F59E0B', // Amber
  [IncidentType.POWER]: '#6B7280', // Gray
  [IncidentType.INFRASTRUCTURE]: '#10B981', // Emerald
  [IncidentType.MEDICAL]: '#EC4899', // Pink
  [IncidentType.CRIME]: '#DC2626', // Red-600
  [IncidentType.OTHER]: '#6B7280', // Gray
}

const SEVERITY_OPACITY = {
  [Severity.HIGH]: 1.0,
  [Severity.MEDIUM]: 0.7,
  [Severity.LOW]: 0.5,
}

const SEVERITY_SIZE = {
  [Severity.HIGH]: 12,
  [Severity.MEDIUM]: 10,
  [Severity.LOW]: 8,
}

// Risk level colors for parish overlays
const RISK_COLORS = {
  low: '#10B981',    // Green
  medium: '#F59E0B', // Amber
  high: '#EF4444',   // Red
  critical: '#DC2626' // Dark Red
}

export default function InteractiveMap({ incidents, loading, height = "400px" }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.MarkerClusterGroup | null>(null)
  const parishLayersRef = useRef<L.LayerGroup | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Create map instance
    const map = L.map(mapRef.current, {
      center: [18.1096, -77.2975], // Center of Jamaica
      zoom: 9,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true,
    })

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)

    // Create marker cluster group
    const markers = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        let className = 'marker-cluster-'
        
        if (count < 10) {
          className += 'small'
        } else if (count < 100) {
          className += 'medium'
        } else {
          className += 'large'
        }

        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster ${className}`,
          iconSize: L.point(40, 40)
        })
      }
    })

    // Create parish boundaries layer group
    const parishLayers = L.layerGroup()

    // Add parish boundary overlays
    Object.entries(PARISH_BOUNDARIES).forEach(([parish, data]) => {
      const rectangle = L.rectangle(data.bounds, {
        color: RISK_COLORS.low,
        weight: 2,
        opacity: 0.6,
        fillOpacity: 0.1,
        fillColor: RISK_COLORS.low
      })

      rectangle.bindTooltip(parish.replace('_', ' '), {
        permanent: false,
        direction: 'center',
        className: 'parish-tooltip'
      })

      parishLayers.addLayer(rectangle)
    })

    map.addLayer(markers)
    map.addLayer(parishLayers)

    mapInstanceRef.current = map
    markersRef.current = markers
    parishLayersRef.current = parishLayers
    setMapReady(true)

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markersRef.current = null
        parishLayersRef.current = null
        setMapReady(false)
      }
    }
  }, [])

  // Update markers when incidents change
  useEffect(() => {
    if (!mapReady || !markersRef.current) return

    // Clear existing markers
    markersRef.current.clearLayers()

    // Add new markers
    incidents.forEach(incident => {
      if (!incident.latitude || !incident.longitude) return

      const color = INCIDENT_COLORS[incident.incidentType] || INCIDENT_COLORS[IncidentType.OTHER]
      const opacity = SEVERITY_OPACITY[incident.severity]
      const size = SEVERITY_SIZE[incident.severity]

      // Create custom icon
      const icon = L.divIcon({
        className: 'custom-incident-marker',
        html: `
          <div style="
            background-color: ${color};
            opacity: ${opacity};
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: ${size * 0.6}px;
            font-weight: bold;
          ">
            ${getIncidentIcon(incident.incidentType)}
          </div>
        `,
        iconSize: [size + 4, size + 4],
        iconAnchor: [size / 2 + 2, size / 2 + 2]
      })

      // Create marker
      const marker = L.marker([incident.latitude, incident.longitude], { icon })

      // Create popup content
      const popupContent = `
        <div class="incident-popup" style="min-width: 200px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="
              background-color: ${color};
              width: 16px;
              height: 16px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 10px;
            ">
              ${getIncidentIcon(incident.incidentType)}
            </div>
            <strong>${formatIncidentType(incident.incidentType)}</strong>
            <span class="severity-badge severity-${incident.severity}" style="
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
              ${getSeverityStyles(incident.severity)}
            ">
              ${incident.severity}
            </span>
          </div>
          
          <div style="margin-bottom: 8px;">
            <strong>Location:</strong> ${incident.parish.replace('_', ' ')}
          </div>
          
          <div style="margin-bottom: 8px;">
            <strong>Description:</strong>
            <div style="margin-top: 4px; padding: 8px; background-color: #f8f9fa; border-radius: 4px; font-size: 13px;">
              ${incident.description}
            </div>
          </div>
          
          <div style="font-size: 12px; color: #6b7280;">
            <strong>Reported:</strong> ${new Date(incident.createdAt).toLocaleString()}
          </div>
        </div>
      `

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      })

      markersRef.current!.addLayer(marker)
    })
  }, [incidents, mapReady])

  // Helper functions
  function getIncidentIcon(type: IncidentType): string {
    const icons = {
      [IncidentType.FLOOD]: '🌊',
      [IncidentType.WEATHER]: '⛈️',
      [IncidentType.FIRE]: '🔥',
      [IncidentType.ACCIDENT]: '🚗',
      [IncidentType.POWER]: '⚡',
      [IncidentType.INFRASTRUCTURE]: '🏗️',
      [IncidentType.MEDICAL]: '🏥',
      [IncidentType.CRIME]: '🚨',
      [IncidentType.OTHER]: '❗',
    }
    return icons[type] || '❗'
  }

  function formatIncidentType(type: IncidentType): string {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
  }

  function getSeverityStyles(severity: Severity): string {
    const styles = {
      [Severity.HIGH]: 'background-color: #dc2626; color: white;',
      [Severity.MEDIUM]: 'background-color: #f59e0b; color: white;',
      [Severity.LOW]: 'background-color: #10b981; color: white;',
    }
    return styles[severity]
  }

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {loading && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Updating...
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
        <h4 className="font-semibold text-sm mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>High Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 opacity-70"></div>
            <span>Medium Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 opacity-50"></div>
            <span>Low Severity</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-gray-600">Click markers for details</div>
          </div>
        </div>
      </div>

      {/* Custom styles */}
      <style jsx global>{`
        .custom-incident-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 12px;
          line-height: 1.4;
        }
        
        .parish-tooltip {
          background: rgba(0, 0, 0, 0.8);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
        }
        
        .marker-cluster {
          background-clip: padding-box;
          border-radius: 20px;
        }
        
        .marker-cluster div {
          width: 30px;
          height: 30px;
          margin-left: 5px;
          margin-top: 5px;
          text-align: center;
          border-radius: 15px;
          font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
        }
        
        .marker-cluster-small {
          background-color: rgba(181, 226, 140, 0.6);
        }
        
        .marker-cluster-small div {
          background-color: rgba(110, 204, 57, 0.6);
        }
        
        .marker-cluster-medium {
          background-color: rgba(241, 211, 87, 0.6);
        }
        
        .marker-cluster-medium div {
          background-color: rgba(240, 194, 12, 0.6);
        }
        
        .marker-cluster-large {
          background-color: rgba(253, 156, 115, 0.6);
        }
        
        .marker-cluster-large div {
          background-color: rgba(241, 128, 23, 0.6);
        }
        
        .marker-cluster div span {
          line-height: 30px;
          color: #fff;
          font-weight: bold;
        }
      `}</style>
    </div>
  )
}