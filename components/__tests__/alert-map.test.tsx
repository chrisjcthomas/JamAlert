import { render, screen, waitFor, act } from '@testing-library/react'
import { AlertMap } from '../alert-map'
import * as incidentsApi from '../../lib/api/incidents'

// Mock the incidents API
jest.mock('../../lib/api/incidents', () => ({
  fetchMapData: jest.fn(),
  IncidentType: {
    FLOOD: 'flood',
    WEATHER: 'weather',
    ACCIDENT: 'accident',
    FIRE: 'fire',
    POWER: 'power',
    INFRASTRUCTURE: 'infrastructure',
    MEDICAL: 'medical',
    CRIME: 'crime',
    OTHER: 'other',
  },
  Severity: {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
  },
}))

// Mock dynamic import for the map component
jest.mock('next/dynamic', () => {
  return function dynamic(importFunc: any, options: any) {
    const Component = () => <div data-testid="mock-map">Mock Interactive Map</div>
    Component.displayName = 'DynamicMap'
    return Component
  }
})

const mockIncidents = [
  {
    id: '1',
    incidentType: 'flood' as const,
    severity: 'high' as const,
    parish: 'ST_CATHERINE' as const,
    latitude: 17.9910,
    longitude: -76.9570,
    description: 'Test flood incident',
    createdAt: new Date(),
    status: 'approved' as const,
  },
  {
    id: '2',
    incidentType: 'accident' as const,
    severity: 'medium' as const,
    parish: 'KINGSTON' as const,
    latitude: 17.9686,
    longitude: -76.7936,
    description: 'Test accident incident',
    createdAt: new Date(),
    status: 'approved' as const,
  },
]

describe('AlertMap', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(incidentsApi.fetchMapData as jest.Mock).mockResolvedValue({
      incidents: mockIncidents,
    })
  })

  it('renders loading state initially', async () => {
    await act(async () => {
      render(<AlertMap />)
    })
    
    // Should show loading spinner initially (check for the specific loading container)
    expect(screen.getByTestId('mock-map')).toBeDefined()
  })

  it('renders map with filters when showFilters is true', async () => {
    await act(async () => {
      render(<AlertMap showFilters={true} />)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Map Filters & Statistics')).toBeDefined()
    })
    
    // Should show filter controls
    expect(screen.getByText('Parish')).toBeDefined()
    expect(screen.getByText('Incident Type')).toBeDefined()
    expect(screen.getByText('Severity')).toBeDefined()
    expect(screen.getByText('Time Range')).toBeDefined()
  })

  it('renders map without filters when showFilters is false', async () => {
    await act(async () => {
      render(<AlertMap showFilters={false} />)
    })
    
    await waitFor(() => {
      expect(screen.getByTestId('mock-map')).toBeDefined()
    })
    
    // Should not show filter controls
    expect(screen.queryByText('Map Filters & Statistics')).toBeNull()
  })

  it('displays statistics correctly', async () => {
    await act(async () => {
      render(<AlertMap showFilters={true} />)
    })
    
    await waitFor(() => {
      expect(screen.getByText(/Total/)).toBeDefined()
    })
  })

  it('handles API errors gracefully', async () => {
    ;(incidentsApi.fetchMapData as jest.Mock).mockRejectedValue(new Error('API Error'))
    
    await act(async () => {
      render(<AlertMap />)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load incident data. Please try again.')).toBeDefined()
    })
  })

  it('calls fetchMapData on mount', async () => {
    await act(async () => {
      render(<AlertMap />)
    })
    
    await waitFor(() => {
      expect(incidentsApi.fetchMapData).toHaveBeenCalledTimes(1)
    })
  })

  it('shows refresh button when showFilters is true', async () => {
    await act(async () => {
      render(<AlertMap showFilters={true} />)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeDefined()
    })
  })

  it('shows clear filters button when showFilters is true', async () => {
    await act(async () => {
      render(<AlertMap showFilters={true} />)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Clear Filters')).toBeDefined()
    })
  })

  it('displays last refresh time when showFilters is true', async () => {
    await act(async () => {
      render(<AlertMap showFilters={true} />)
    })
    
    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeDefined()
    })
  })
})