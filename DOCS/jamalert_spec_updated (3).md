# JamAlert: Community Resilience Alert System
## 🏆 Hackathon-Winning Project Specification

### 🎯 The Story: Defining the Problem

**The Five Whys - Flood Alert Crisis in Jamaica:**

1. **Who is impacted?** 
   - Rural farmers like Grace who lose entire crops and livestock to flash floods
   - Urban commuters like Andre who face life-threatening road conditions during heavy rains
   - School principals like Mr. David responsible for 300+ children's safety
   - Elderly residents in flood-prone communities with limited mobility or tech access
   - Emergency responders who lack real-time ground intelligence

2. **What is the issue?**
   - Jamaica's current flood alert system is fragmented across multiple agencies (ODPEM, Met Service, media)
   - Alerts are too broad (parish-wide) when flooding is hyper-local (specific roads, gullies, communities)
   - No real-time feedback loop - authorities don't know actual ground conditions
   - Critical information doesn't reach vulnerable populations (rural areas, elderly, non-smartphone users)
   - Motorists receive no proactive warnings about dangerous road conditions until it's too late

3. **When does the problem manifest?**
   - During flash flood events (minutes to develop, requiring immediate action)
   - Heavy rainfall periods when urban drainage systems overflow
   - Hurricane and tropical storm seasons (June-November annually)
   - Rush hour commutes when roads are most congested and escape routes limited
   - School dismissal times when children are walking home through flood-prone areas

4. **Where in the community does the problem occur?**
   - Urban areas: Kingston, Spanish Town, Portmore - critical transportation corridors
   - Rural farming communities along river valleys (Yallahs, Rio Cobre, Black River)
   - School zones and residential areas in flood-prone parishes
   - Major highways and underpasses that become impassable during floods
   - Low-income communities with inadequate drainage infrastructure

5. **Why is it necessary to address the problem?**
   - **Life Safety**: Flash floods kill people who receive warnings too late or in wrong format
   - **Economic Impact**: Lost crops, damaged vehicles, missed work days, business disruptions
   - **Educational Disruption**: School closures, students trapped, unsafe walking routes
   - **Emergency Response Efficiency**: First responders need real-time ground truth to deploy resources effectively
   - **Community Resilience**: Climate change is intensifying flood frequency and severity - communities need better preparation tools

**Problem Statement**: Jamaica's flood alert system fails to provide timely, actionable, hyper-local warnings to the people most at risk, resulting in preventable deaths, economic losses, and community vulnerability during increasingly frequent flood events.

**Solution**: JamAlert — a **real-time, zero-cost, community-powered alert system** that delivers hyper-local flood warnings with actionable guidance, crowdsourced ground intelligence, and multi-channel accessibility to save lives and protect livelihoods.

**Impact**: Reach thousands in seconds, prevent vehicle entrapments, enable proactive evacuations, and create a replicable model for Caribbean disaster preparedness.

**Why Now**: Climate change is intensifying floods → immediate need for better alert systems.

**Why Us**: Student-built on free Azure tier → **scalable, accessible, replicable** across developing regions.

**Are you able to measure the impact of your solution if it is successfully implemented?**

Yes, JamAlert is designed with comprehensive impact measurement capabilities built into its core architecture:

**Immediate Impact Metrics (Real-time tracking)**:
- Alert delivery rates and response times (tracked in alerts table)
- User registration growth by parish (demographics analysis)
- Crowdsourced incident reports vs official weather data correlation
- Alert validation feedback ratios (accurate/false alarm/resolved)
- Geographic coverage and penetration rates across vulnerable communities

**Life Safety Indicators**:
- Reduction in flood-related vehicle entrapments (partnership with emergency services data)
- Decreased emergency response times through better situational awareness
- Community preparedness surveys measuring behavioral changes
- School dismissal decision timing improvements (tracked via institutional partnerships)

**Economic Impact Assessment**:
- Agricultural loss reduction (collaboration with farming associations)
- Transportation disruption minimization (traffic flow analysis)
- Emergency service cost savings through proactive alerts
- Business continuity improvements during flood events

**Community Engagement Metrics**:
- Community champion effectiveness (adoption rates in their areas)
- Multi-generational usage patterns (elderly and youth engagement)
- Language preference usage (English/Patois/Spanish adoption)
- Accessibility feature utilization rates

**System Performance Indicators**:
- Network resilience during peak usage (Azure Application Insights)
- Multi-channel failover effectiveness
- Alert accuracy improvement over time through AI learning
- Cross-parish collaboration and data sharing effectiveness

**Long-term Resilience Outcomes**:
- Climate adaptation behavior changes in vulnerable communities
- Regional flood preparedness policy influence
- Caribbean-wide replication success rates
- Open source contribution and global deployment metrics

The MySQL database architecture, Application Insights integration, and planned partnerships with ODPEM, schools, and NGOs create multiple data sources for comprehensive impact evaluation. Success will be measured not just in technical metrics, but in lives saved, economic losses prevented, and community resilience enhanced.

---

## 👥 User Personas

To guide our development and focus on real-world needs, we are building JamAlert for people like:

**Grace, the St. Thomas Farmer**: Grace is a 45-year-old farmer with 10 acres near the Yallahs River. Her livelihood depends on her crops. A single flash flood can wipe out a year's income. She isn't very tech-savvy but always has her basic smartphone with her.

*Needs*: A simple, immediate alert (in English or Patois) that gives her a 30-60 minute window to move equipment and secure what she can. She needs a system that is free and requires no complex setup.

**Mr. David, the Clarendon School Principal**: David is the principal of a primary school with 300 students, many of whom walk home. He is responsible for their safety. National alerts are too broad, but he knows certain local gullies can flood quickly, cutting off routes home.

*Needs*: A hyper-local alert specific to his school's district so he can make an early decision to close school and ensure children get home safely before roads become impassable.

**Andre, the Kingston Commuter**: Andre is a 30-year-old IT specialist who drives from Portmore to his office in New Kingston daily. His route includes several known flood-prone hotspots. During heavy rainfall, he worries about getting stuck or, worse, caught in a flash flood. He needs immediate, street-specific alerts and safe alternate routes to navigate the city safely.

*Needs*: Real-time warnings about dangerous road conditions, proactive rerouting suggestions, and emergency assistance if trapped. Requires GPS-based location awareness and actionable guidance during active commutes.

---

## 🗺️ Competitive Landscape

While Jamaica has national-level alert systems, JamAlert fills a critical gap in hyper-local, accessible warnings.

**National Systems (ODPEM, Met Service)**: These agencies issue essential, broad-based warnings for entire parishes or the whole island. JamAlert complements, not competes, by taking this broad data and applying it to specific, local flood-prone areas.

**Social Media & Word-of-Mouth**: These are fast but often unreliable, prone to misinformation, and do not reach everyone. JamAlert provides a single, trusted, and verified source of information.

**Our Unique Value Proposition**: JamAlert is the only system designed to be hyper-local, automated, data-driven (with configurable thresholds), and completely free for any user to access, removing all barriers to safety.

---

## ⚠️ Risk Assessment & Mitigation

We have identified potential risks to the project's success and have planned mitigation strategies:

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|---------|-------------------|
| **Technical: Weather API Unreliability** | Medium | High | Use cached weather data (up to 2 hours old) during an outage and notify the admin. Maintain a secondary API source as a fallback for future phases. |
| **Adoption: Low Community Sign-ups** | Medium | High | **Multi-channel approach**: Partner with trusted community organizations like the Red Cross and parish councils. Deploy **community champions** with training workshops and small incentives. **Low-tech outreach**: Radio campaigns, posters in community centers, church announcements. **USSD fallback** for feature phone users (Phase 2). |
| **Resource: Exceeding Free Tier Limits** | Low | Medium | Implement active monitoring of Azure service usage (Function executions, database storage). Build alerts for when usage approaches 80% of the free limit. **Data pruning**: Archive alert_history monthly, compress old data. **Storage management**: Implement automatic cleanup of cached data older than 7 days. |
| **Operational: Alert Fatigue** | Medium | Medium | **Feedback analysis workflow**: Tag feedback as "false alarm", "missed flood", "timing issue". Feed data into threshold refinement. **User-configurable thresholds** in Phase 3. **Community validation**: Champions help identify false positives at local level. |
| **Technical: Notification Hubs Failure** | Low | High | **Fallback sequence**: Email → Push → retry_queue → Manual admin notification. **Channel redundancy**: Store user communication preferences with backup channels. **Admin emergency override**: Manual notification dispatch if all automated channels fail. |

---

## 🤝 The Team

JamAlert is being developed by a passionate team of student developers committed to using technology for social good.

**[Your Name/Team Member 1] - Project Lead & Backend Developer**: Responsible for the Azure architecture, database design, and core alerting logic.

**[Team Member 2] - Frontend & UX Developer**: Responsible for creating the Next.js frontend, admin dashboard, and ensuring an intuitive user experience.

**[Team Member 3] - DevOps & Integration Specialist**: Responsible for setting up CI/CD pipelines with GitHub Actions and managing API integrations.

**Why Us**: We are the right team because we combine technical proficiency in modern cloud technologies with a deep understanding of the local problem we are trying to solve. Our focus on a lean, free-tier architecture proves our ability to deliver impactful solutions efficiently.

---

## 🔮 Future Roadmap (Post-Hackathon Vision)

### 🌊 Phase 2: Enhanced Integration
* **Crowdsourced Intelligence**: Real-time, geolocated flood reporting with photo/video verification integrated into live map visualization
  - **Trust & Verification System**: Reports marked with verification badges ("Community Report", "Verified by ODPEM", "Multiple Sources")
  - **Auto-escalation Protocol**: 2+ user reports for same location automatically triggers admin notification and priority review
* **Proactive Safety Features**: "Driver Mode" with GPS-based location monitoring and proactive audio/visual warnings when approaching reported flood zones
  - **Smart Rerouting**: Integration with traffic APIs (Google Maps, Waze) for intelligent alternate route suggestions
  - **Calm Communication**: All alerts use non-panic language with specific actionable guidance
* **Emergency Support**: One-tap Emergency Contacts (ODPEM, Fire, Police) and nearest emergency shelter locator with GPS directions
* **Advanced Feedback Loop**: Structured alert validation system where users provide feedback on alert accuracy, feeding into AI models for threshold refinement
* **Power & Connectivity Resilience**: Partnership with radio stations for backup alert broadcasts during power outages, solar-powered community radio integration
* **Recovery & Aftermath Support**: 
  - Safe route reopening notifications ("Washington Blvd now passable - flooding cleared")
  - Links to recovery assistance (NGO aid, shelter information, government programs)
  - Post-flood community status updates
* **SMS Integration**: Add Twilio/WhatsApp for broader reach beyond smartphone users
* **Multi-language Support**: Patois/Spanish for diverse communities
* **Offline Resilience**: USSD fallback for low-connectivity areas, offline-first mobile app that stores last known status

### 🤖 Phase 3: AI-Powered Intelligence  
* **Predictive Modeling**: ML algorithms predict flooding hotspots by correlating weather patterns with historical crowdsourced reports and sensor data
* **Community Data Fusion**: Verify and fuse crowdsourced reports with official data to increase alert accuracy and reduce false positives
* **IoT Sensor Network Integration**: Ingest real-time water level data from physical sensors deployed in critical flood-prone areas (gullies, underpasses)
* **Risk Scoring**: Dynamic parish risk levels based on real-time data fusion from multiple sources
* **Auto-scaling**: Geographic expansion across Caribbean islands
* **Advanced Driver Assistance**: Proactive rerouting suggestions during active flood events with real-time traffic integration

### 🤝 Phase 4: Institutional Partnerships
* **Government Integration**: Connect with Office of Disaster Preparedness
* **NGO Network**: Partner with Red Cross, community organizations
* **Regional Expansion**: Scale JamAlert across Caribbean nations
* **UN SDG Alignment**: Climate resilience and disaster risk reduction goals

### 📈 Phase 5: Path to Sustainability and Commercialization

While the core mission of JamAlert is to provide a zero-cost, accessible alert system for the public, long-term sustainability and the development of advanced features requires a commercial strategy. This model ensures that public alerts remain free, funded by premium services for government and commercial clients.

#### 1. Government Partnerships (Primary Revenue Channel)
* **Subscription model**: $50–200/month per parish council or disaster agency
* **Provides**: Real-time dashboards, analytics reports, direct system integration, and priority support
* **Scale potential**: 14 parishes in Jamaica → $8,400–$33,600/year recurring → replicable regionally (Caribbean has 30+ island nations)
* **Value proposition**: Cheaper and faster than building government-owned platforms, immediate deployment capability

#### 2. Enterprise Tier (Insurance, Logistics, Agriculture)
* **Insurance companies**: API access for risk scores, event probability data, and validated incident reporting
  - **Benefit**: Lower claim fraud, improved actuarial insights, better premium pricing models
* **Logistics & fleet operators**: APIs for flood rerouting and real-time route closure notifications
  - **Benefit**: Driver protection, reduced downtime costs, optimized delivery scheduling
* **Agricultural exporters**: Field-level predictive alerts and crop risk assessments
  - **Benefit**: Prevent crop loss, safeguard export commitments, insurance claim validation
* **Pricing**: $500–2000/month depending on data granularity, API calls, and user seats

#### 3. Freemium Individual Model
* **Core life-saving alerts**: Free forever for all users
* **Premium add-ons**: Custom thresholds for farmland, small businesses, or high-value properties ($5–15/month)
* **Scale opportunity**: Thousands of small subscriptions create sustainable long-term revenue base

#### 4. CSR/NGO Sponsorships
* **Corporate sponsorship**: "This parish's alerts sponsored by [Bank/Telecom]" with discrete branding
* **NGO partnerships**: Organizations cover fees for vulnerable communities in exchange for usage metrics and impact data
* **Benefit**: Covers operational costs while maintaining free end-user access

#### 5. Data Licensing & Analytics
* **Climate research**: Sell anonymized flood pattern data to universities, think tanks, and climate researchers
* **Policy development**: Provide insights for urban planning and infrastructure investment decisions
* **Opportunity**: Establish JamAlert as the Caribbean's premier climate resilience data hub

### 🌐 Phase 6: Open Source & Global Replication

* **Open Source Commitment**: Release JamAlert codebase under MIT license post-hackathon for global replicability
* **Caribbean Network**: Create federation of JamAlert instances across Caribbean islands
* **Community Champions Network**: Scale volunteer program regionally with shared training resources
* **Gamified Adoption**: "Parish Safety Leaderboard" showing community registration rates to incentivize local leaders
* **Global Template**: Document deployment process for other developing regions facing similar climate risks

### ⚡ Phase 7: Enterprise Scaling & Resilience

* **Azure Tier Migration Path**: Clear upgrade strategy when exceeding free tier limits
  - **Redis Cache**: Replace MySQL caching with Azure Redis for improved performance
  - **Azure SQL Database**: Migrate from MySQL In-App for better scaling and backup capabilities
  - **Service Bus**: Replace retry_queue table with Azure Service Bus for reliable message queuing
  - **Communication Services**: Add native SMS/voice capabilities through Azure
  - **CDN Integration**: Global content delivery for faster map loading
  - **Auto-scaling**: Function Apps scale automatically with demand spikes during major weather events
* **Enterprise Features**: Advanced analytics, multi-tenant architecture, API monetization capabilities
* **Disaster Recovery**: Cross-region backup and failover capabilities for mission-critical deployments

---

## 📈 Judge-Friendly Impact Metrics

### 💪 Technical Achievements
* **5,000+ users supported** on $0 budget (Azure Student Starter)
* **<30 second alert delivery** to all registered users  
* **99.9% uptime** with graceful failure handling
* **15-minute weather polling** for near real-time updates
* **Zero ongoing costs** - entirely free-tier infrastructure

### 🌍 Social Impact Potential
* **Lives saved** through faster flood warnings
* **Community empowerment** via accessible alert registration  
* **Replicable model** for other developing regions
* **Democratic technology** - no barriers to access
* **Climate resilience** in vulnerable communities

### 🏆 Innovation Factors
* **Free-tier maximization** - proves enterprise features possible on student budget
* **Real-world problem solving** - addresses genuine community need
* **Scalable architecture** - designed for growth from day one  
* **Open source potential** - could be replicated globally
* **Student-driven impact** - young people solving community problems

---

## 📊 System Architecture Diagrams

### High-Level Architecture
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

### Data Flow: Alert Triggering
```
1. ⏰ Scheduled Function (15min) → Weather API Check
2. 🌧️  Threshold Exceeded → Create Alert Record in MySQL
3. 📋 Query Affected Parish Users → Batch Notification Jobs
4. 📧 Dispatch: Email (Primary) + Push Notifications (Secondary)
5. 📊 Log Results → Update delivery_status in Database
6. 🔄 Retry Failed → Via retry_queue table
```

### Admin Workflow
```
1. 👤 Admin Login → Custom JWT Authentication (bcrypt + MySQL)
2. 📊 Dashboard → View Stats, Recent Alerts, User Counts
3. ⚙️  Threshold Config → Set Parish-specific Alert Levels  
4. 🚨 Manual Override → Emergency Alert Dispatch
5. 📋 User Management → View/Deactivate Registrations
6. 📈 Audit Trail → All Actions Logged in MySQL
```

---

## Recommended Technology Stack

For **JamAlert under the Azure Student Starter plan**, you want a stack that's:
* **Cheap/free** (fits the quota)
* **Quick to build** (hackathon-friendly)
* **Expandable** (if you keep working on it after)

### 🌐 Frontend
* **Framework:** **Next.js (React)** → Server-side rendering (SSR) for SEO + fast page loads, simple deployment to Azure App Service.
* **UI Library:** Tailwind CSS + shadcn/ui → Clean UI, fast prototyping.
* **Map:** Leaflet.js with OpenStreetMap tiles (free, no quota headaches).

### ⚙️ Backend
* **Compute:** **Azure Functions (Node.js or Python)** → Lightweight, free tier, serverless (perfect for scheduled weather checks + API endpoints).
* **Language choice:**
   * **Node.js/TypeScript** if you want fast hackathon velocity (tons of SDKs, easier Notification Hubs + email integration).
   * **Python** if you're more comfortable or want simpler weather API handling.
* **API Framework:**
   * Stick to **Functions HTTP triggers** (no need for full Express or FastAPI unless you outgrow Functions).

### 📦 Database
* **Azure MySQL In-App (Free)**
   * Tables: users, alerts, sessions, feedback, admin actions, cache.
   * Use it also as a **cache layer** (since Redis isn't included).
   * ORM: Prisma (if Node.js/TS) or SQLAlchemy (if Python).

### 📡 Notifications
* **Email:** SMTP relay via Azure App Service (free daily quota).
* **Push Notifications:** Azure Notification Hubs (included in Starter).
* **Fallback:** Log failed attempts into retry_queue table.

### 🔐 Authentication
* **Custom JWT auth** (bcrypt hashed passwords in MySQL, signed with secret in App Service config).
* Middleware in Functions checks JWT → protects `/admin/*` routes.

### 📊 Monitoring
* **Azure Application Insights** → Logs, metrics, error tracing.
* Add email alert rules for function failures.

### 🚀 DevOps
* **CI/CD:** GitHub Actions → build Next.js frontend, deploy to App Service, run migrations, deploy Functions.
* **Infra-as-code:** Bicep or Terraform, but keep minimal for hackathon.

### ⚡️ TL;DR Recommended Stack:
* **Frontend:** Next.js + Tailwind + Leaflet (map)
* **Backend:** Azure Functions (Node.js/TypeScript) + Prisma ORM
* **Database:** MySQL In-App
* **Notifications:** SMTP + Notification Hubs
* **Auth:** Custom JWT auth (bcrypt + MySQL)
* **Monitoring:** Application Insights

---

## 🎯 MVP vs Stretch Features Strategy

### 🏁 MVP (Hackathon Demo Must-Have)
**Goal**: Working demo in 24-48 hours that judges can interact with

**Core Features**:
1. **Hyper-local Alert Simulation**: Admin dashboard with "Manual Override" button to trigger parish-specific alerts with custom message templates
   - Demo Message: "URGENT FLASH FLOOD WARNING: Kingston & St. Andrew. Reports of impassable roads on Washington Blvd. Avoid the area. Do not attempt to drive through floodwaters as vehicles may be washed away."
2. **Crowdsourced Incident Reporting**: Public web form at `/report` where users can report flooding incidents with location, description, and severity
3. **Live Impact Map Visualization**: Interactive Leaflet.js map on landing page displaying pins for every crowdsourced flood report with pop-up descriptions
4. **User Registration & Confirmation**: Form saves to MySQL, sends confirmation email + push notification
5. **Actionable Emergency Information**: Static section with emergency contact numbers (ODPEM, Fire, Police) and motorist safety checklist ("Turn Around, Don't Drown," "Abandon vehicle if water rises")
6. **Basic Admin Authentication**: JWT auth with simple dashboard showing user count and recent alerts

**Success Metrics**: 
- Judge can register, report incident, and receive alert on their phone/email
- Admin can trigger alerts and see crowdsourced reports on map
- System handles 10-50 test users without breaking
- Live map visualization works with pre-seeded incident data

### 🚀 Stretch Features (If Time Allows)
**Goal**: Polish and "wow factor" features that show professional-grade thinking

**Advanced Features**:
1. **Automated Weather Integration**: Functions poll Jamaica Met Service API with flood type differentiation
2. **Enhanced Feedback System**: Users can validate alerts ("Accurate," "False Alarm," "Situation Resolved")
3. **Multi-channel Resilience**: Retry queues, graceful error handling, staggered sending to prevent network congestion
4. **Advanced Admin Panel**: User management, threshold configuration, audit trails, system health monitoring
5. **Accessibility Features**: Text-to-speech alerts, high-contrast mode, large font options
6. **All Clear Notifications**: "Flood threat has passed for [Parish]. Safe to resume normal activities"

**Polish Features**:
- Loading states and error messages
- Mobile-responsive design  
- Email templates with branding
- Performance optimizations
- Multi-language toggle (English/Patois/Spanish)

### 🎪 Demo Strategy for Maximum Impact

#### Pre-Demo Setup:
1. **Seed Data**: Pre-register 5-10 test users (judges' emails if possible)
2. **Fake Weather Scenario**: Script simulates "Heavy Rain Alert - Kingston Parish"
3. **Live Notification**: Admin triggers alert during demo → everyone gets notification
4. **Visual Impact**: Map highlights affected parish in red

#### Demo Flow (5-7 minutes):
1. **Hook** (30s): "Flooding kills because alerts come late"
2. **User Journey** (90s): Grace registers, Andre reports flooding → instant email confirmation displayed live
3. **Crisis Simulation** (60s): Admin manual override triggers live alerts → judges receive notification on their phones
4. **Visual Impact** (90s): Parish map glows red, crowdsourced pins update in real time, delivery stats dashboard
5. **Admin Power** (60s): Show threshold tuning capabilities and manual override functionality
6. **Future Vision** (30s): "From $0 student infrastructure to regional SaaS scaling across Caribbean"

**Judge Engagement Moment**: Judges experience the same alert a Jamaican commuter would receive during actual flooding - creating powerful empathy connection to the solution's real-world impact.

#### Demo Risk Mitigation:
- **Pre-seed demo data**: 5-10 test registrations with judge emails ready
- **Manual trigger override**: Admin button bypasses weather API for reliable demo
- **Fallback assets**: Pre-recorded video of working notifications, static dashboard screenshots
- **Simplified admin view**: Single striking visualization (parish map + alert status) instead of complex dashboard
- **Offline demo mode**: Core functionality works without live API dependencies

#### Judge Engagement Strategy:
- **Live experience moment**: "We'll trigger an alert live, and you'll feel what our users experience during a real flood"
- **Pre-register judges**: Get emails during setup, show their data in admin panel  
- **Manual alert dispatch**: Controlled demo trigger ensures notifications arrive on time
- **Trust demonstration**: Show transparent audit logs, Met Service data verification
- **Post-free-tier transition**: Demonstrate clear path to paid tier when demand exceeds free limits
- **Accessibility showcase**: Mention text-to-speech planning, radio integration for offline users
- **"You just experienced what could save lives in rural Jamaica"** - personal connection to impact

#### Tailoring the Pitch for Different Audiences

**Hackathon Judges**
* **Priority**: Show working MVP with impressive live demonstration
* **Value proposition**: Proves student team can build enterprise-grade resilient infrastructure for $0 budget
* **What to highlight**: Speed of development, system reliability, tangible user experience, technical innovation
* **Key message**: "Real impact, zero cost, scalable solution"

**Investors**
* **Priority**: Demonstrate monetization potential and Total Addressable Market (TAM)
* **Value proposition**: SaaS recurring revenue model with sticky data advantages and network effects
* **What to highlight**: Government contracts ($8K-33K annually per parish), enterprise API pricing ($500-2K monthly), regional expansion opportunity (30+ Caribbean nations)
* **Key message**: "Proven demand, clear revenue streams, massive scale potential"

**Community Partners (NGOs, Schools, Parish Councils)**
* **Priority**: Emphasize accessibility, trust, and community empowerment
* **Value proposition**: Multi-language support, offline capabilities, transparency, local champion programs
* **What to highlight**: Community adoption strategies, verification badge system, champion training programs, accessibility features
* **Key message**: "Built for communities, by communities, with communities"

**Government Agencies (ODPEM, Met Service)**
* **Priority**: Show institutional integration capabilities and data validation
* **Value proposition**: Enhances existing alert systems with hyper-local intelligence and community feedback
* **What to highlight**: Official data integration, verification workflows, audit trails, compliance features
* **Key message**: "Complements and amplifies government capabilities, doesn't compete"

---

## Routing & Pages
Define routes and their behaviors:

### 👥 Public Users (Grace, Mr. David, etc.)
Everyday citizens registering for and receiving alerts.
**Permissions**: register, manage their own account, receive alerts, give feedback.

| Route | Purpose | Notes |
|-------|---------|-------|
| `/` | Public Landing Page: status, map, parishes, flood risk overview | Public + cached data |
| `/info` | About JamAlert, how to register | Integrated into `/` or separate |
| `/register` | Sign up for alerts (parish + channels + contact info) | Confirmation email + push |
| `/profile` | Manage parish, contact info, alert preferences | Language, thresholds (future) |
| `/my-alerts` | View personal alert history | Builds trust, accountability |
| `/feedback` | Submit issues or suggestions | Stores in DB for admin review |
| `/help` | FAQ + guidance | "How alerts work", "Troubleshooting" |

### 🛠️ Admin Users (Development team, community operators)
**Permissions**: manage alerts, users, system health, audit logs.

| Route | Purpose | Notes |
|-------|---------|-------|
| `/admin/login` | Custom JWT authentication entry point | Session stored in MySQL |
| `/admin/dashboard` | Overall stats, recent alerts, user counts, performance metrics | Main admin entry |
| `/admin/users` | Manage registered users (view, deactivate) | Audit trail on all actions |
| `/admin/alerts` | Create / schedule / reissue alerts | Supports manual override |
| `/admin/settings` | Parish thresholds, notification settings, etc. | Stored in database |
| `/admin/feedback` | Dedicated page for user feedback review | Filter by parish, date |
| `/admin/logs` | Audit logs of all admin actions | Transparency & compliance |
| `/admin/health` | System health + Azure free-tier usage monitoring | API error counts, retry queues |
| `/admin/map` *(future)* | Visual parish boundary/threshold management | Interactive overlay editor |

### 🏛️ Future Institutional Roles (Phase 4+)
Intended for **parish councils, schools, NGOs, and government agencies** as system scales.

| Role | Routes | Permissions |
|------|--------|-------------|
| **School Admin** | `/school/dashboard` | Manage alerts for specific school/community, student safety coordination |
| **Parish Official** | `/parish/dashboard` | Regional view of users + alerts for one parish, manage thresholds locally |
| **NGO Partner** | `/ngo/dashboard` | Adoption tracking, outreach stats, feedback loop |
| **Gov Agency** | `/gov/analytics` | Advanced analytics, cross-parish risk scoring, ODPEM/Met Service integration |

* Guard admin paths via **custom JWT authentication** implemented in Azure Functions; public paths accessible always.
* **Session Management**: 30-minute timeout stored in MySQL, simple role flag (admin vs user).
* **Future-Ready Features**: Language toggle (English/Patois/Spanish), community champions portal (`/champions`).

### 📊 Roles & Permissions Matrix

Clear authority distribution across all user types:

| Action / Capability | Public User | Admin | School Admin *(future)* | Parish Official *(future)* | NGO Partner *(future)* | Gov Agency *(future)* | Community Champion *(future)* |
|---------------------|-------------|--------|-------------------------|----------------------------|------------------------|---------------------|-------------------------------|
| **Register for alerts** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (can assist others) |
| **Manage own profile** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (help with onboarding) |
| **View personal alert history** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Submit feedback** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (submit community issues) |
| **View parish map + status** | ✅ | ✅ | ✅ (own school area) | ✅ (own parish only) | ✅ (adoption view) | ✅ (all parishes) | ✅ |
| **Trigger manual alerts** | ❌ | ✅ | ✅ (restricted scope) | ✅ (restricted to parish) | ❌ | ✅ (national level) | ❌ |
| **Manage thresholds** | ❌ | ✅ | ❌ | ✅ (parish only) | ❌ | ✅ (global settings) | ❌ |
| **Manage users** | ❌ | ✅ | ❌ | ✅ (parish only) | ❌ | ✅ | ✅ (register/deactivate in field) |
| **View system health / capacity** | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **View feedback dashboard** | ❌ | ✅ | ❌ | ✅ (parish only) | ✅ (community adoption) | ✅ | ✅ (see local feedback) |
| **Access audit logs** | ❌ | ✅ | ❌ | ✅ (restricted) | ❌ | ✅ (all) | ❌ |
| **Analytics / adoption stats** | ❌ | ✅ | ❌ | ✅ (parish) | ✅ (NGO programs) | ✅ (nationwide) | ✅ (local) |

### 🏛️ Roles Hierarchy & Authority Structure

```
                    ┌─────────────────────┐
                    │      ADMINS         │ ← Full system control, audit logs,
                    │   (System Owners)   │   global thresholds, technical ops
                    └─────────────────────┘
                              │
                              │ (oversees all operations)
                              ▼
          ┌─────────────────────┐                    ┌─────────────────────┐
          │   GOV AGENCIES      │◄──────────────────►│    NGO PARTNERS     │
          │  (National Scope)   │                    │ (Community Focus)   │ 
          └─────────────────────┘                    └─────────────────────┘
                    │                                            │
                    │ (regional oversight)                       │ (adoption tracking)
                    ▼                                            ▼
          ┌─────────────────────┐                    ┌─────────────────────┐
          │  PARISH OFFICIALS   │◄──────────────────►│   SCHOOL ADMINS     │
          │   (Parish Scope)    │                    │   (School Scope)    │
          └─────────────────────┘                    └─────────────────────┘
                    │                                            │
                    │ (local coordination)                       │ (student safety)
                    ▼                                            ▼
          ┌─────────────────────┐                    ┌─────────────────────┐
          │ COMMUNITY CHAMPIONS │◄──────────────────►│   PUBLIC USERS      │
          │ (Local Facilitators)│                    │ (General Citizens)  │
          └─────────────────────┘                    └─────────────────────┘
```

**Authority Flow**: Top-down oversight, bottom-up feedback
**Data Access**: Scoped by role - parish officials see parish data only, admins see everything
**Alert Authority**: Admins (global), Gov Agencies (national), Parish Officials (local), School Admins (campus)
**Community Engagement**: Champions bridge technology gap, assist Public Users with registration and support

### 🔍 Enhanced User Features

**User Profile Enhancements** (`/profile`):
* **Language toggle**: English, Patois, Spanish
* **Notification preferences**: Channel priority order (email vs push)
* **Accessibility options**: Text-to-speech alerts, high-contrast mode, large font settings
* **Alert thresholds**: Custom sensitivity levels (Phase 3)
* **Contact management**: Update phone, email, parish selection

**Transparency & Trust Building**:
* **Public transparency page** (`/transparency`): Recent alerts sent, delivery success rates, system uptime, **alert resolution status**
* **Verification & Trust System**:
  - **Source credibility tags**: All reports and alerts clearly marked with verification status
  - "Community Report" (single user submission)
  - "Community Confirmed" (2+ independent reports)
  - "Verified by ODPEM" (official government confirmation)
  - "Met Service Data" (automated weather station input)
  - **False report filtering**: Admin review process for flagging and removing inaccurate submissions, user reporting system for suspicious content
* **Alert Tone Guidelines**: Codified messaging standards to prevent panic and alert fatigue
  - **Calm & Clear**: "Washington Blvd impassable due to flooding. Use Spanish Town Road alternate route."
  - **Actionable Guidance**: Specific instructions rather than generic warnings ("Move to higher ground" vs "Severe danger")
  - **Consistent Terminology**: Standardized severity levels and response instructions across all channels
* **Community champions** (`/champions`): Local volunteers track adoption, assist with registration, receive **training workshops** and small incentives, **trained for elderly/accessibility support**
* **Alert accountability**: All users can view their personal alert history with **threat resolution updates**
* **Feedback analysis workflow**: Systematic tagging and analysis of user feedback to improve alert accuracy
* **Low-tech outreach**: Radio campaigns, community center posters, church announcements for broader reach
* **Accessibility planning**: Phase 2 USSD support for feature phones, **text-to-speech considerations for visually impaired users**
* **Network resilience**: Offline-first mobile app option (Phase 3) that stores last known status and refreshes when network returns

## Workflow Details

### Registration flow (public user):
1. User visits `/register`, fills form (name, parish, preferred contact channels, maybe threshold preferences).
2. Backend (Azure Function) validates input, stores record in MySQL.
3. Send a confirmation (email first, **Notification Hubs push notification** as backup) so user knows registration is successful.
4. **Error Handling**: If email fails → retry 3 times, log for manual follow-up. No SMS available in Students Starter.

### Alert triggering / Notifications:
* **Data Sources**:
  - Primary: Jamaica Meteorological Service API for weather data
  - Secondary: Office of Disaster Preparedness alerts feed  
  - Backup: Manual admin override for emergency situations
* Scheduled Azure Function checks weather conditions every 15 minutes
* **Flood Type Differentiation**: System categorizes alerts based on threat type:
  - **Flash Flood** (⚡): "Move immediately, secure yourself and loved ones" - urgent, high-priority push
  - **Riverine Flood** (🌊): "Flooding risk in X hours, prepare equipment and livestock now" - early warning
  - **All Clear** (✅): "Flood threat has passed for [Parish]. Safe to resume normal activities"
* When threshold crossed, create alert records with **flood category flag** and **severity level**
* For each subscribed user in affected parish, send alert via **staggered parish-level batches** to prevent network congestion
* **Error Handling**: 
  - If weather API down → use cached data (up to 30 minutes for critical alerts) + notify admin via email
  - If email service fails → escalate to **Notification Hubs push notifications** for all users
  - **Network congestion mitigation**: Staggered sending, multi-channel fallback sequence
  - If all channels fail → log incident and queue for manual processing

### Feedback flow:
* **Dual-Channel Feedback System**:
  1. **Incident Reporting** (`/report`): Public form to report new floods with location, severity, and photos. Submissions stored for admin review and map visualization with real-time pin updates.
  2. **Alert Validation**: After receiving an alert, users can provide structured feedback via email reply or app interface ("Accurate - I see the flood," "False Alarm," "Situation Resolved"). Data tagged in database for threshold refinement.
* **Admin Review Process**: Dedicated `/admin/feedback` page with filtering by parish, date, and feedback type
* **Real-time Map Integration**: Verified incident reports automatically appear as markers on public map
* **Trust Building**: Feedback analysis workflow provides transparency on alert accuracy and system improvements

### Admin management:
* Admins log in via **custom JWT authentication** (email/password stored in MySQL, hashed with bcrypt). Sessions tracked in MySQL with expiration timestamps.
* Can adjust settings per parish (e.g. what thresholds trigger alert), manage users, see latest alert logs, see map overlay of parishes with risk levels.
* **Audit Trail**: All admin actions logged with user ID, timestamp, and changes made.

## Data & Caching Strategy

### Caching Layer:
* **Public map/status data**: Cache for 10 minutes using **MySQL database** (no Redis in Students Starter)
* **Weather API responses**: Cache for 5 minutes in MySQL to minimize API calls
* **Parish boundary data**: Cache for 24 hours in MySQL (static data)

### Database Design Enhancements:
* **Users table**: Add audit fields (created_at, updated_at, last_login), accessibility_settings (text_to_speech, high_contrast, font_size), driver_mode_enabled (boolean), gps_tracking_consent (boolean)
* **Alerts table**: Include delivery_status, retry_count, error_logs, **flood_type** (flash/riverine/all_clear), **severity_level**, message_template_id, affected_roads (JSON array), message_tone ('calm', 'urgent', 'informational')
* **Incident_reports table**: Store crowdsourced flood reports with location (lat/lng), description, severity_level, photo_url, **verification_status** ('unverified', 'community_confirmed', 'odpem_verified'), **report_count** (for auto-escalation), reported_by_user_id, created_at, **escalated_at** (timestamp when 2+ reports trigger admin notification)
* **Alert_feedback table**: User responses to alerts (alert_id, user_id, feedback_type ('accurate', 'false_alarm', 'resolved'), comments, created_at)
* **Route_advisories table**: Store road status updates (road_name, parish, status ('passable', 'impassable', 'caution'), last_updated, verified_by_admin)
* **Recovery_resources table**: Post-flood assistance information (resource_type, provider_name, contact_info, parish, availability_status)
* **Radio_broadcasts table**: Track emergency radio partnerships (station_name, frequency, coverage_area, contact_info, backup_power_available)
* **Admin_actions table**: Log all administrative changes
* **Alert_history table**: Archive of all sent alerts for compliance, **with resolution timestamps and status updates**
* **Sessions table**: Store JWT sessions with expiration for admin auth
* **Retry_queue table**: Queue failed operations when database is temporarily unavailable
* **Cache_data table**: Store frequently accessed data (weather, parish boundaries) with TTL
* **Alert_templates table**: Store different message templates for flash flood vs riverine flood vs all-clear alerts vs motorist-specific warnings, **with tone guidelines** (calm vs urgent phrasing)
* **Emergency_shelters table**: Store shelter locations with name, address, lat/lng, capacity, contact_info for emergency locator feature

### File Storage & Configuration:
* **Parish boundary data**: Store as BLOB in MySQL or bundle with application
* **Static assets**: Serve from App Service wwwroot folder
* **Secrets Management**: Store all secrets in **App Service Configuration** (JWT signing keys, SMTP credentials, API keys)
* **Configuration**: Environment-specific settings in App Settings (no Azure Key Vault available)

## Deployment & Infrastructure
* Use **Resource Group(s)** to group related resources: one for frontend, one for backend, one for database. Tag resources for cost monitoring.
* Use **CI/CD**: build pipelines that deploy front-end and back-end automatically (Github Actions or Azure DevOps).
* Ensure proper configuration of Application Insights for all components (errors, latency).
* Logging & monitoring: set up alerts if functions fail, or if error rate above threshold.

## Scalability & Capacity Planning

### Target Capacity (Free Tier Limits):
* **Users**: Support up to 5,000 registered users (Target: 10,000 registrations in first year)
* **Concurrent Alerts**: Handle 100 simultaneous alert dispatches
* **API Calls**: Process 1,000 weather API calls per hour
* **Database**: 250MB MySQL storage limit
* **Function Executions**: 1M executions per month

### Critical Scaling Considerations:
* **"Victim of Success" Planning**: Proactive upgrade to paid tier before hitting 80% capacity during major weather events
* **Weather Data Quality Dependency**: System effectiveness tied to external API accuracy - false positives/negatives could erode community trust
* **Cache Duration Risk**: 2-hour weather cache may be too long for rapidly developing flash floods - consider reducing to 30 minutes for critical alerts
* **Data Integrity**: All weather data verified against Jamaica Met Service official sources, transparent audit logs public

### Resource Monitoring:
* Track MySQL storage usage (target <200MB)
* Monitor Function execution count (target <800K/month)
* Alert when approaching 80% of any free tier limit
* Auto-scale considerations: queue alerts during peak loads

## Cost / Capacity Planning under Starter Limits
* Identify free tier limits (e.g. number of MySQL in-app units, function invocations, storage quotas). Ensure usage stays under these.
* Plan for growth: have metrics/reporting for resource usage so you know when you hit limits.
* If usage > free tiers, decide fallback: degrade features (disable SMS, reduce check frequency), or upgrade plan.

## What Is Not Possible / Needs External or Upgrading Plan

**Services NOT Available in Students Starter:**
* **Azure AD B2C** - Must use custom authentication
* **Azure Redis Cache** - Must use MySQL for caching
* **Azure Communication Services (SMS)** - No SMS capability without external provider
* **SignalR Service** - Limited to Notification Hubs for push notifications
* **Azure SQL Database** - Only MySQL in-app available
* **Azure Storage Account** - Limited file storage options
* **Custom domains with SSL** - Must use *.azurewebsites.net domains
* **CDN or Traffic Manager** - No global distribution services
* **Azure Key Vault** - Must store secrets in App Settings
* **Azure Monitor beyond Application Insights** - Limited monitoring capabilities

**Available Services in Students Starter:**
* **Azure App Services** - Web app hosting
* **Azure Functions** - Serverless compute  
* **Notification Hubs** - Mobile push notifications
* **MySQL in-app** - Database with CMS support
* **Application Insights** - Performance and diagnostics telemetry
* **Azure DevOps** - CI/CD pipelines and collaboration tools

**External Dependencies Required:**
* **Weather Data**: Jamaica Meteorological Service API or other free weather APIs
* **Email Service**: Must use SMTP through App Services (limited daily quota)
* **SMS Alerts**: Would require external provider like Twilio (additional cost)
* **Maps**: Free mapping service like OpenStreetMap or Leaflet

## Error Handling & Resilience

### System Failure Scenarios:
* **Weather API Unavailable**: Use cached data (max 2 hours old), notify admin via email, display "Data may be delayed" message
* **Database Connection Lost**: Use **MySQL retry tables** to queue operations for 5 minutes, then fail gracefully with user notification
* **Email Service Down**: Automatically switch to **Notification Hubs push notifications** for all registered users
* **Function Timeout**: Split large alert batches into smaller chunks, implement Azure Function retry policies
* **Authentication Service Issues**: Provide read-only admin dashboard, disable write operations

### Monitoring & Alerting:
* Application Insights dashboards for all error types
* **Email alerts to admin** if error rate >5% over 15 minutes (no SMS available in Students Starter)
* **Email alerts to admin** if system completely down

## Acceptance Criteria
For AI / dev agent, tasks must meet:

1. **Public landing page** with map and flood status (map must render, data source must be wired with caching).
2. **Registration form** saving users in DB with error handling and confirmation.
3. **Alerting mechanism** that triggers based on parish thresholds; sends email + **Notification Hubs push notifications** as available channels.
4. **Admin login & dashboard**: secure via **custom JWT authentication**, can view/change thresholds, view users, with audit logging in MySQL.
5. **Monitoring**: Application Insights fully hooked, error logs shown, simple dashboard of errors and capacity metrics.
6. **Cost usage report**: Usage metrics on App Service, Functions, DB usage so you can see free tier margin.
7. **Error resilience**: System handles API failures gracefully, retries failed operations, and provides fallback data sources.
8. **Performance**: Public pages load in <3 seconds, admin operations complete in <5 seconds, alert dispatch completes in <30 seconds for 100 users.