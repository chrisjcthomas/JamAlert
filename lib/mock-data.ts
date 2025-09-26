export interface Alert {
  id: string
  title: string
  message: string
  severity: "low" | "medium" | "high" | "critical"
  parish: string
  timestamp: string
  status: "active" | "resolved" | "expired"
  location?: {
    lat: number
    lng: number
  }
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
  parish: string
  preferredContact: "email" | "sms" | "both"
  registeredAt: string
}

export interface IncidentReport {
  id: string
  location: {
    lat: number
    lng: number
  }
  description: string
  severity: "low" | "medium" | "high" | "critical"
  reportedBy: string
  timestamp: string
  status: "pending" | "verified" | "resolved"
  photo?: string
}

export const mockAlerts: Alert[] = [
  {
    id: "1",
    title: "Flash Flood Warning",
    message: "Heavy rainfall expected in Kingston and St. Andrew. Avoid low-lying areas.",
    severity: "high",
    parish: "Kingston",
    timestamp: "2024-01-15T14:30:00Z",
    status: "active",
    location: { lat: 18.0179, lng: -76.8099 },
  },
  {
    id: "2",
    title: "Road Closure",
    message: "Spanish Town Road closed due to fallen tree. Use alternate routes.",
    severity: "medium",
    parish: "St. Catherine",
    timestamp: "2024-01-15T12:15:00Z",
    status: "active",
    location: { lat: 17.9909, lng: -76.8644 },
  },
  {
    id: "3",
    title: "Power Outage Resolved",
    message: "Electricity restored to Portmore area. Thank you for your patience.",
    severity: "low",
    parish: "St. Catherine",
    timestamp: "2024-01-15T10:00:00Z",
    status: "resolved",
    location: { lat: 17.9554, lng: -76.8801 },
  },
]

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Marcus Johnson",
    email: "marcus.j@email.com",
    phone: "+1876-555-0123",
    parish: "Kingston",
    preferredContact: "both",
    registeredAt: "2024-01-10T09:00:00Z",
  },
  {
    id: "2",
    name: "Keisha Brown",
    email: "keisha.brown@email.com",
    phone: "+1876-555-0456",
    parish: "St. Andrew",
    preferredContact: "email",
    registeredAt: "2024-01-12T14:30:00Z",
  },
]

export const mockIncidents: IncidentReport[] = [
  {
    id: "1",
    location: { lat: 18.0179, lng: -76.8099 },
    description: "Large pothole causing traffic delays on Hope Road",
    severity: "medium",
    reportedBy: "Anonymous",
    timestamp: "2024-01-15T13:45:00Z",
    status: "pending",
  },
  {
    id: "2",
    location: { lat: 17.9909, lng: -76.8644 },
    description: "Flooding on main road after heavy rain",
    severity: "high",
    reportedBy: "Community Member",
    timestamp: "2024-01-15T11:20:00Z",
    status: "verified",
  },
]

export const jamaicaParishes = [
  "Kingston",
  "St. Andrew",
  "St. Catherine",
  "Clarendon",
  "Manchester",
  "St. Elizabeth",
  "Westmoreland",
  "Hanover",
  "St. James",
  "Trelawny",
  "St. Ann",
  "St. Mary",
  "Portland",
  "St. Thomas",
]
