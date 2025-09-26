import { PrismaClient, Parish, AdminRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create default admin user with environment variables or defaults
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@jamalert.gov.jm';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123!';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';
  
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  
  const adminUser = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      name: adminName,
      role: AdminRole.ADMIN,
      isActive: true,
    },
  });

  console.log('Created admin user:', adminUser.email);
  
  // Create additional admin user for development
  if (process.env.NODE_ENV === 'development') {
    const devAdminPassword = await bcrypt.hash('dev123!', 12);
    
    const devAdmin = await prisma.adminUser.upsert({
      where: { email: 'dev@jamalert.local' },
      update: {},
      create: {
        email: 'dev@jamalert.local',
        passwordHash: devAdminPassword,
        name: 'Development Admin',
        role: AdminRole.MODERATOR,
        isActive: true,
      },
    });

    console.log('Created development admin user:', devAdmin.email);
  }

  // Create sample users for testing (optional - only in development)
  if (process.env.NODE_ENV === 'development') {
    const sampleUsers = [
      {
        firstName: 'Grace',
        lastName: 'Campbell',
        email: 'grace.campbell@example.com',
        phone: '+1876-555-0101',
        parish: Parish.ST_CATHERINE,
        address: 'Spanish Town, St. Catherine',
        smsAlerts: true,
        emailAlerts: true,
        emergencyOnly: false,
      },
      {
        firstName: 'Andre',
        lastName: 'Williams',
        email: 'andre.williams@example.com',
        phone: '+1876-555-0102',
        parish: Parish.KINGSTON,
        address: 'Downtown Kingston',
        smsAlerts: false,
        emailAlerts: true,
        emergencyOnly: true,
      },
      {
        firstName: 'Maria',
        lastName: 'Johnson',
        email: 'maria.johnson@example.com',
        phone: '+1876-555-0103',
        parish: Parish.ST_ANDREW,
        address: 'Half Way Tree, St. Andrew',
        smsAlerts: true,
        emailAlerts: true,
        emergencyOnly: false,
      },
    ];

    for (const userData of sampleUsers) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: userData,
      });
      console.log('Created sample user:', user.email);
    }

    // Create sample incident reports for map testing
    const sampleIncidents = [
      {
        incidentType: 'FLOOD' as const,
        severity: 'HIGH' as const,
        parish: Parish.ST_CATHERINE,
        community: 'Spanish Town',
        address: 'Spanish Town Road',
        description: 'Heavy rainfall causing flooding on Spanish Town Road. Water level approximately 2 feet deep, affecting vehicle traffic.',
        incidentDate: new Date(),
        incidentTime: '14:30',
        reporterName: 'Grace Campbell',
        reporterPhone: '+1876-555-0101',
        isAnonymous: false,
        receiveUpdates: true,
        latitude: 17.9910,
        longitude: -76.9570,
        status: 'APPROVED' as const,
        verificationStatus: 'COMMUNITY_CONFIRMED' as const,
      },
      {
        incidentType: 'ACCIDENT' as const,
        severity: 'MEDIUM' as const,
        parish: Parish.KINGSTON,
        community: 'Downtown',
        address: 'King Street & Harbour Street',
        description: 'Two-vehicle collision at intersection. Minor injuries reported, traffic being diverted.',
        incidentDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        incidentTime: '12:15',
        reporterName: null,
        reporterPhone: null,
        isAnonymous: true,
        receiveUpdates: false,
        latitude: 17.9686,
        longitude: -76.7936,
        status: 'APPROVED' as const,
        verificationStatus: 'UNVERIFIED' as const,
      },
      {
        incidentType: 'WEATHER' as const,
        severity: 'MEDIUM' as const,
        parish: Parish.ST_ANDREW,
        community: 'Half Way Tree',
        address: 'Constant Spring Road',
        description: 'Strong winds causing tree branches to fall. Power lines affected in some areas.',
        incidentDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        incidentTime: '10:45',
        reporterName: 'Maria Johnson',
        reporterPhone: '+1876-555-0103',
        isAnonymous: false,
        receiveUpdates: true,
        latitude: 18.0179,
        longitude: -76.8099,
        status: 'APPROVED' as const,
        verificationStatus: 'COMMUNITY_CONFIRMED' as const,
      },
      {
        incidentType: 'FIRE' as const,
        severity: 'HIGH' as const,
        parish: Parish.ST_JAMES,
        community: 'Montego Bay',
        address: 'Hip Strip Area',
        description: 'Small fire at commercial building. Fire department on scene, area being evacuated as precaution.',
        incidentDate: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        incidentTime: '15:00',
        reporterName: null,
        reporterPhone: null,
        isAnonymous: true,
        receiveUpdates: false,
        latitude: 18.4954,
        longitude: -77.9287,
        status: 'APPROVED' as const,
        verificationStatus: 'ODPEM_VERIFIED' as const,
      },
      {
        incidentType: 'POWER' as const,
        severity: 'LOW' as const,
        parish: Parish.CLARENDON,
        community: 'May Pen',
        address: 'Main Street',
        description: 'Power outage affecting several blocks. JPS crews have been notified and are responding.',
        incidentDate: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        incidentTime: '08:20',
        reporterName: 'Community Reporter',
        reporterPhone: '+1876-555-0104',
        isAnonymous: false,
        receiveUpdates: true,
        latitude: 17.9621,
        longitude: -77.2454,
        status: 'APPROVED' as const,
        verificationStatus: 'COMMUNITY_CONFIRMED' as const,
      },
      {
        incidentType: 'INFRASTRUCTURE' as const,
        severity: 'MEDIUM' as const,
        parish: Parish.PORTLAND,
        community: 'Port Antonio',
        address: 'A4 Highway',
        description: 'Large pothole causing traffic delays. Road surface damaged after recent heavy rains.',
        incidentDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        incidentTime: '06:00',
        reporterName: null,
        reporterPhone: null,
        isAnonymous: true,
        receiveUpdates: false,
        latitude: 18.1818,
        longitude: -76.4621,
        status: 'APPROVED' as const,
        verificationStatus: 'UNVERIFIED' as const,
      },
    ];

    for (const incidentData of sampleIncidents) {
      const incident = await prisma.incidentReport.create({
        data: incidentData,
      });
      console.log('Created sample incident:', incident.id, '-', incident.incidentType, 'in', incident.parish);
    }
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });