# JamAlert: Community Resilience Alert System - Design Document

## Overview

JamAlert is a Next.js-based web application with Azure Functions backend that provides real-time emergency alerts and incident reporting for Jamaica. The system uses a serverless architecture optimized for the Azure Student Starter free tier while maintaining enterprise-grade reliability and scalability.

The design leverages your existing frontend implementation (Next.js with Tailwind CSS) and extends it with a robust backend infrastructure for alert processing, user management, and real-time notifications.

## Architecture

### High-Level System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js Web   │    │  Azure Functions │    │  MySQL In-App  │
│   Frontend      │◄──►│   (Node.js/TS)   │◄──►│   Database      │
│                 │    │                  │    │                 │
│ • Public Pages  │    │ • Weather Check  │    │ • Users/Alerts  │
│ • Registration  │    │ • Alert Dispatch │    │ • Sessions/Cache│
│ • Admin Portal  │    │ • Admin APIs     │    │ • Audit Logs    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │
         │                        ▼
┌─────────────────┐    ┌──────────────────┐
│   Leaflet.js    │    │  Notifications   │
│   OpenStreetMap │    │                  │
│                 │    │ • SMTP Email     │
│ • Parish Bounds │    │ • Notification   │
│ • Risk Overlays │    │   Hubs (Push)    │
└─────────────────┘    └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  External APIs   │
                       │                  │
                       │ • Jamaica Met    │
                       │ • Weather APIs   │
                       └──────────────────┘
```

### Technology Stack

**Frontend (Already Implemented):**
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS + shadcn/ui components
- Leaflet.js for interactive maps
- Client-side state management with React hooks

**Backend (To Be Implemented):**
- Azure Functions (Node.js/TypeScript)
- MySQL In-App database
- Prisma ORM for database operations
- Custom JWT authentication
- Azure Notification Hubs for push notifications

**External Services:**
- Jamaica Meteorological Service API
- SMTP email service (Azure App Service)
- OpenStreetMap for mapping data

## Components and Interfaces

### Frontend Components (Existing)

**1. Public Pages**
- `app/page.tsx` - Landing page with hero, stats, recent alerts, map preview
- `app/register/page.tsx` - User registration page
- `app/report/page.tsx` - Incident reporting page
- `components/alert-map.tsx` - Interactive map component (placeholder)

**2. Forms and UI**
- `components/auth/register-form.tsx` - Registration form with validation
- `components/forms/report-form.tsx` - Incident reporting form
- `components/ui/*` - Reusable UI components (buttons, cards, inputs)

**3. Navigation**
- `components/navigation/main-nav.tsx` - Main navigation component
- Responsive design with mobile-first approach

### Backend APIs (To Be Implemented)

**1. User Management APIs**
```typescript
// /api/auth/register
POST /api/auth/register
Body: { firstName, lastName, email, phone, parish, preferences }
Response: { success: boolean, userId: string, message: string }

// /api/auth/login (Admin)
POST /api/auth/login
Body: { email: string, password: string }
Response: { token: string, user: AdminUser }

// /api/users/profile
GET /api/users/profile
Headers: { Authorization: Bearer <token> }
Response: UserProfile

PUT /api/users/profile
Body: Updated user data
Response: { success: boolean }
```

**2. Alert Management APIs**
```typescript
// /api/alerts/send
POST /api/alerts/send
Body: { parishes: string[], message: string, severity: string, type: string }
Response: { alertId: string, recipientCount: number }

// /api/alerts/history
GET /api/alerts/history?parish=<parish>&limit=<limit>
Response: Alert[]

// /api/alerts/status/<alertId>
GET /api/alerts/status/<alertId>
Response: { deliveryStats, failedRecipients }
```

**3. Incident Reporting APIs**
```typescript
// /api/incidents/report
POST /api/incidents/report
Body: IncidentReport
Response: { reportId: string, status: 'pending' | 'approved' }

// /api/incidents/list
GET /api/incidents/list?parish=<parish>&status=<status>
Response: IncidentReport[]

// /api/incidents/map-data
GET /api/incidents/map-data
Response: { incidents: MapIncident[], alerts: MapAlert[] }
```

**4. Admin APIs**
```typescript
// /api/admin/dashboard
GET /api/admin/dashboard
Response: { userCount, activeAlerts, reportsToday, systemHealth }

// /api/admin/users
GET /api/admin/users?parish=<parish>&page=<page>
Response: { users: User[], pagination }

// /api/admin/thresholds
GET /api/admin/thresholds
PUT /api/admin/thresholds
Body: { parish: string, floodThreshold: number, windThreshold: number }
```

### Azure Functions (Serverless Backend)

**1. Scheduled Functions**
```typescript
// WeatherCheckFunction - Runs every 15 minutes
export async function weatherCheck(context: InvocationContext): Promise<void> {
  // 1. Fetch weather data from Jamaica Met Service
  // 2. Check against parish thresholds
  // 3. Trigger alerts if thresholds exceeded
  // 4. Cache weather data in MySQL
}

// CleanupFunction - Runs daily
export async function cleanup(context: InvocationContext): Promise<void> {
  // 1. Archive old alerts (>30 days)
  // 2. Clean up expired sessions
  // 3. Compress cached data
}
```

**2. HTTP Trigger Functions**
```typescript
// UserRegistration
export async function registerUser(request: HttpRequest, context: InvocationContext) {
  // 1. Validate input data
  // 2. Hash sensitive information
  // 3. Store in MySQL
  // 4. Send confirmation email
  // 5. Return success response
}

// AlertDispatch
export async function dispatchAlert(request: HttpRequest, context: InvocationContext) {
  // 1. Authenticate admin user
  // 2. Validate alert data
  // 3. Query affected users
  // 4. Send notifications (email + push)
  // 5. Log delivery results
}
```

## Data Models

### Database Schema (MySQL)

**1. Users Table**
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  parish ENUM('kingston', 'st_andrew', 'st_thomas', 'portland', 'st_mary', 'st_ann', 'trelawny', 'st_james', 'hanover', 'westmoreland', 'st_elizabeth', 'manchester', 'clarendon', 'st_catherine') NOT NULL,
  address TEXT,
  sms_alerts BOOLEAN DEFAULT FALSE,
  email_alerts BOOLEAN DEFAULT TRUE,
  emergency_only BOOLEAN DEFAULT FALSE,
  accessibility_settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

**2. Alerts Table**
```sql
CREATE TABLE alerts (
  id VARCHAR(36) PRIMARY KEY,
  type ENUM('flood', 'weather', 'emergency', 'all_clear') NOT NULL,
  severity ENUM('low', 'medium', 'high') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  parishes JSON NOT NULL, -- Array of affected parishes
  created_by VARCHAR(36), -- Admin user ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  delivery_status ENUM('pending', 'sending', 'completed', 'failed') DEFAULT 'pending',
  recipient_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  failed_count INT DEFAULT 0
);
```

**3. Incident Reports Table**
```sql
CREATE TABLE incident_reports (
  id VARCHAR(36) PRIMARY KEY,
  incident_type ENUM('flood', 'accident', 'fire', 'power', 'weather', 'crime', 'medical', 'infrastructure', 'other') NOT NULL,
  severity ENUM('low', 'medium', 'high') NOT NULL,
  parish ENUM('kingston', 'st_andrew', 'st_thomas', 'portland', 'st_mary', 'st_ann', 'trelawny', 'st_james', 'hanover', 'westmoreland', 'st_elizabeth', 'manchester', 'clarendon', 'st_catherine') NOT NULL,
  community VARCHAR(255),
  address TEXT,
  description TEXT NOT NULL,
  incident_date DATE NOT NULL,
  incident_time TIME,
  reporter_name VARCHAR(255),
  reporter_phone VARCHAR(20),
  is_anonymous BOOLEAN DEFAULT FALSE,
  receive_updates BOOLEAN DEFAULT FALSE,
  status ENUM('pending', 'approved', 'rejected', 'resolved') DEFAULT 'pending',
  verification_status ENUM('unverified', 'community_confirmed', 'odpem_verified') DEFAULT 'unverified',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**4. Admin Users Table**
```sql
CREATE TABLE admin_users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'moderator') DEFAULT 'admin',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

**5. Alert Delivery Log Table**
```sql
CREATE TABLE alert_delivery_log (
  id VARCHAR(36) PRIMARY KEY,
  alert_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  delivery_method ENUM('email', 'sms', 'push') NOT NULL,
  status ENUM('pending', 'sent', 'delivered', 'failed', 'bounced') NOT NULL,
  error_message TEXT,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  FOREIGN KEY (alert_id) REFERENCES alerts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### TypeScript Interfaces

```typescript
// User Models
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  parish: Parish;
  address?: string;
  smsAlerts: boolean;
  emailAlerts: boolean;
  emergencyOnly: boolean;
  accessibilitySettings?: AccessibilitySettings;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

interface AccessibilitySettings {
  highContrast: boolean;
  largeFont: boolean;
  textToSpeech: boolean;
}

// Alert Models
interface Alert {
  id: string;
  type: 'flood' | 'weather' | 'emergency' | 'all_clear';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  parishes: Parish[];
  createdBy?: string;
  createdAt: Date;
  expiresAt?: Date;
  deliveryStatus: 'pending' | 'sending' | 'completed' | 'failed';
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
}

// Incident Models
interface IncidentReport {
  id: string;
  incidentType: IncidentType;
  severity: 'low' | 'medium' | 'high';
  parish: Parish;
  community?: string;
  address?: string;
  description: string;
  incidentDate: Date;
  incidentTime?: string;
  reporterName?: string;
  reporterPhone?: string;
  isAnonymous: boolean;
  receiveUpdates: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'resolved';
  verificationStatus: 'unverified' | 'community_confirmed' | 'odpem_verified';
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

type Parish = 'kingston' | 'st_andrew' | 'st_thomas' | 'portland' | 'st_mary' | 'st_ann' | 'trelawny' | 'st_james' | 'hanover' | 'westmoreland' | 'st_elizabeth' | 'manchester' | 'clarendon' | 'st_catherine';

type IncidentType = 'flood' | 'accident' | 'fire' | 'power' | 'weather' | 'crime' | 'medical' | 'infrastructure' | 'other';
```

## Error Handling

### Frontend Error Handling

**1. Form Validation**
- Client-side validation with immediate feedback
- Server-side validation with detailed error messages
- Graceful degradation for network issues

**2. API Error Handling**
```typescript
// Error handling pattern used in existing forms
const handleApiError = (error: any) => {
  if (error.response?.status === 400) {
    setError(error.response.data.message || 'Invalid input data');
  } else if (error.response?.status === 500) {
    setError('Server error. Please try again later.');
  } else {
    setError('Network error. Please check your connection.');
  }
};
```

### Backend Error Handling

**1. Function-Level Error Handling**
```typescript
export async function httpTrigger(request: HttpRequest, context: InvocationContext) {
  try {
    // Function logic
    return { jsonBody: { success: true, data } };
  } catch (error) {
    context.log.error('Function error:', error);
    
    if (error instanceof ValidationError) {
      return { status: 400, jsonBody: { error: error.message } };
    } else if (error instanceof AuthenticationError) {
      return { status: 401, jsonBody: { error: 'Unauthorized' } };
    } else {
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  }
}
```

**2. Database Error Handling**
- Connection retry logic with exponential backoff
- Graceful degradation when database is unavailable
- Data integrity validation before operations

**3. External API Error Handling**
- Weather API fallback to cached data (up to 2 hours)
- Email service fallback to push notifications
- Retry mechanisms for transient failures

## Testing Strategy

### Frontend Testing (Existing Components)

**1. Component Testing**
```typescript
// Example test for RegisterForm
describe('RegisterForm', () => {
  it('should validate required fields', () => {
    render(<RegisterForm />);
    fireEvent.click(screen.getByText('Register for Alerts'));
    expect(screen.getByText('First name is required')).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const mockSubmit = jest.fn();
    render(<RegisterForm onSubmit={mockSubmit} />);
    
    // Fill form fields
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
    // ... fill other fields
    
    fireEvent.click(screen.getByText('Register for Alerts'));
    await waitFor(() => expect(mockSubmit).toHaveBeenCalled());
  });
});
```

**2. Integration Testing**
- End-to-end user flows (registration → alert receipt)
- Cross-browser compatibility testing
- Mobile responsiveness testing

### Backend Testing (To Be Implemented)

**1. Unit Testing**
```typescript
// Example test for alert dispatch function
describe('AlertDispatch', () => {
  it('should send alerts to users in affected parishes', async () => {
    const mockUsers = [
      { id: '1', parish: 'kingston', email: 'user1@test.com' },
      { id: '2', parish: 'st_andrew', email: 'user2@test.com' }
    ];
    
    jest.spyOn(userService, 'getUsersByParishes').mockResolvedValue(mockUsers);
    jest.spyOn(notificationService, 'sendEmail').mockResolvedValue(true);
    
    const result = await dispatchAlert({
      parishes: ['kingston', 'st_andrew'],
      message: 'Test alert',
      severity: 'medium'
    });
    
    expect(result.recipientCount).toBe(2);
    expect(notificationService.sendEmail).toHaveBeenCalledTimes(2);
  });
});
```

**2. API Testing**
- Request/response validation
- Authentication and authorization testing
- Rate limiting and security testing

**3. Performance Testing**
- Load testing for alert dispatch (5,000+ users)
- Database query optimization
- Function cold start optimization

## Security Considerations

### Authentication and Authorization

**1. User Authentication**
- JWT tokens with 30-minute expiration
- Secure password hashing with bcrypt
- Session management in MySQL

**2. Admin Authentication**
```typescript
// JWT middleware for admin routes
export async function authenticateAdmin(request: HttpRequest): Promise<AdminUser | null> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await getAdminById(payload.userId);
    return admin?.isActive ? admin : null;
  } catch {
    return null;
  }
}
```

### Data Protection

**1. Input Validation**
- Sanitize all user inputs
- Validate data types and formats
- Prevent SQL injection with parameterized queries

**2. Data Encryption**
- HTTPS for all communications
- Encrypt sensitive data at rest
- Secure API key management

### Privacy Protection

**1. Anonymous Reporting**
- No storage of identifying information for anonymous reports
- IP address anonymization
- Optional data retention policies

**2. User Data Management**
- Clear data usage policies
- User consent for data processing
- Account deletion capabilities

## Performance Optimization

### Frontend Optimization (Existing)

**1. Code Splitting**
- Next.js automatic code splitting
- Lazy loading for non-critical components
- Optimized bundle sizes

**2. Caching Strategy**
```typescript
// Static data caching
const parishes = useMemo(() => [
  'Kingston', 'St. Andrew', // ... parish list
], []);

// API response caching
const { data: alerts } = useSWR('/api/alerts/recent', fetcher, {
  refreshInterval: 30000, // 30 seconds
  revalidateOnFocus: false
});
```

### Backend Optimization (To Be Implemented)

**1. Database Optimization**
- Indexed queries for common operations
- Connection pooling
- Query result caching

**2. Function Optimization**
```typescript
// Batch processing for alert dispatch
export async function batchDispatchAlerts(users: User[], alert: Alert) {
  const batchSize = 100;
  const batches = chunk(users, batchSize);
  
  for (const batch of batches) {
    await Promise.all(batch.map(user => sendAlert(user, alert)));
    await delay(1000); // Rate limiting
  }
}
```

### Monitoring and Analytics

**1. Application Insights Integration**
- Function execution monitoring
- Error tracking and alerting
- Performance metrics collection

**2. Custom Metrics**
```typescript
// Track alert delivery success rates
context.log.metric('AlertDeliveryRate', deliveredCount / totalRecipients);

// Monitor API response times
const startTime = Date.now();
// ... API operation
context.log.metric('APIResponseTime', Date.now() - startTime);
```

This design document provides a comprehensive blueprint for implementing the backend functionality while leveraging your existing frontend components. The architecture is optimized for the Azure Student Starter free tier while maintaining scalability and reliability for production use.