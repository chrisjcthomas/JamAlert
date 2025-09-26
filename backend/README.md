# JamAlert Backend

Azure Functions-based backend for the JamAlert Community Resilience Alert System.

## Overview

This backend provides:
- User registration and management
- Real-time alert distribution
- Incident reporting system
- Administrative dashboard APIs
- Weather monitoring and automated alerts
- Multi-channel notifications (Email, SMS, Push)

## Technology Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Azure Functions v4
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT tokens
- **Notifications**: SMTP Email + Azure Notification Hubs
- **Testing**: Jest with TypeScript

## Prerequisites

- Node.js 18 or higher
- Azure Functions Core Tools v4
- MySQL database (local or Azure MySQL In-App)
- Azure account (for deployment)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp local.settings.json.example local.settings.json
```

Update `local.settings.json` with your configuration:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "DATABASE_URL": "mysql://username:password@localhost:3306/jamalert",
    "JWT_SECRET": "your-secure-jwt-secret-key-at-least-32-characters",
    "SMTP_HOST": "smtp.gmail.com",
    "SMTP_PORT": "587",
    "SMTP_USER": "your-email@gmail.com",
    "SMTP_PASS": "your-app-password",
    "WEATHER_API_KEY": "your-openweather-api-key"
  }
}
```

### 3. Database Setup

Generate Prisma client:
```bash
pnpm run db:generate
```

Push database schema (for development):
```bash
pnpm run db:push
```

Or run migrations (for production):
```bash
pnpm run db:migrate
```

Seed the database with initial data:
```bash
npx prisma db seed
```

### 4. Start Development Server

```bash
pnpm run start
```

The Functions runtime will start on `http://localhost:7071`

## Available Scripts

- `pnpm run build` - Compile TypeScript to JavaScript
- `pnpm run watch` - Watch for changes and recompile
- `pnpm run start` - Start Azure Functions runtime
- `pnpm run test` - Run Jest tests
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run db:generate` - Generate Prisma client
- `pnpm run db:push` - Push schema changes to database
- `pnpm run db:migrate` - Run database migrations
- `pnpm run db:studio` - Open Prisma Studio

## Project Structure

```
backend/
├── src/
│   ├── functions/          # Azure Functions
│   ├── lib/               # Shared utilities
│   │   ├── database.ts    # Database connection & utilities
│   │   └── config.ts      # Environment configuration
│   ├── services/          # Business logic services
│   ├── types/             # TypeScript type definitions
│   └── test/              # Test utilities and setup
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Database seeding script
├── host.json             # Azure Functions host configuration
├── local.settings.json   # Local environment variables
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Database Schema

The system uses the following main entities:

- **Users**: Registered citizens receiving alerts
- **Alerts**: Emergency notifications sent to users
- **IncidentReports**: Community-reported incidents
- **AdminUsers**: System administrators
- **AlertDeliveryLog**: Tracking notification delivery

See `prisma/schema.prisma` for the complete schema definition.

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Admin login

### Alerts
- `POST /api/alerts/send` - Dispatch alert (admin)
- `GET /api/alerts/history` - Alert history
- `GET /api/alerts/status/{id}` - Alert delivery status

### Incidents
- `POST /api/incidents/report` - Report incident
- `GET /api/incidents/list` - List incidents (admin)
- `GET /api/incidents/map-data` - Map visualization data

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/health` - System health check

## Testing

Run the test suite:
```bash
npm run test
```

Run tests in watch mode during development:
```bash
npm run test:watch
```

## Deployment

### Azure Deployment

1. **Create Azure Resources**:
   - Azure Function App
   - Azure MySQL In-App Database
   - Azure Notification Hub (optional)

2. **Configure Application Settings**:
   Set the following in your Function App configuration:
   ```
   DATABASE_URL=mysql://username:password@hostname:3306/database
   JWT_SECRET=your-production-jwt-secret
   SMTP_HOST=your-smtp-host
   SMTP_USER=your-smtp-user
   SMTP_PASS=your-smtp-password
   WEATHER_API_KEY=your-weather-api-key
   ```

3. **Deploy Functions**:
   ```bash
   func azure functionapp publish <your-function-app-name>
   ```

4. **Run Database Migrations**:
   ```bash
   npx prisma migrate deploy
   ```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MySQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret (32+ chars) | Yes |
| `SMTP_HOST` | Email server hostname | Yes |
| `SMTP_PORT` | Email server port | Yes |
| `SMTP_USER` | Email authentication username | Yes |
| `SMTP_PASS` | Email authentication password | Yes |
| `WEATHER_API_KEY` | OpenWeather API key | Yes |
| `AZURE_NOTIFICATION_HUB_CONNECTION` | Push notification connection | No |

## Security Considerations

- All API endpoints use HTTPS in production
- JWT tokens expire after 30 minutes
- Passwords are hashed using bcrypt
- Input validation using Zod schemas
- Rate limiting on public endpoints
- SQL injection prevention via Prisma

## Monitoring

The application includes:
- Application Insights integration
- Health check endpoints
- Error logging and alerting
- Performance metrics collection

## Support

For issues and questions:
1. Check the troubleshooting section below
2. Review the logs in Azure Application Insights
3. Contact the development team

## Troubleshooting

### Common Issues

**Database Connection Errors**:
- Verify `DATABASE_URL` is correct
- Check database server is running
- Ensure firewall allows connections

**Function Deployment Fails**:
- Verify Azure CLI is authenticated
- Check Function App exists and is running
- Review deployment logs

**Email Notifications Not Sending**:
- Verify SMTP credentials
- Check email provider settings
- Review Application Insights logs

### Health Checks

Check system health:
```bash
curl https://your-function-app.azurewebsites.net/api/admin/health
```

### Logs

View logs in Azure:
1. Go to your Function App in Azure Portal
2. Navigate to "Functions" > "Monitor"
3. Select specific function executions
4. Review logs and metrics