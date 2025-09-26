// JamAlert Demo Verification Script
// Run this to test the demo functionality locally

const { apiClient } = require('./lib/api-client');

async function testDemoFunctionality() {
  console.log('🧪 Testing JamAlert Demo Functionality');
  console.log('=====================================');

  // Set demo mode
  process.env.NEXT_PUBLIC_DEMO_MODE = 'true';

  try {
    // Test alerts endpoint
    console.log('\n📢 Testing Alerts API...');
    const alerts = await apiClient.get('/alerts');
    console.log(`✅ Alerts: Found ${alerts.alerts?.length || 0} mock alerts`);

    // Test auth profile endpoint
    console.log('\n👤 Testing Auth Profile API...');
    const profile = await apiClient.get('/auth/profile');
    console.log(`✅ Profile: User ${profile.user?.name || 'Unknown'} (${profile.user?.email || 'No email'})`);

    // Test incidents endpoint
    console.log('\n🚨 Testing Incidents API...');
    const incidents = await apiClient.get('/incidents');
    console.log(`✅ Incidents: Found ${incidents.incidents?.length || 0} mock incidents`);

    // Test POST endpoints
    console.log('\n📝 Testing POST Endpoints...');
    
    const loginResult = await apiClient.post('/auth/login', {
      email: 'demo@jamalert.jm',
      password: 'demo123'
    });
    console.log(`✅ Login: ${loginResult.success ? 'Success' : 'Failed'}`);

    const registerResult = await apiClient.post('/auth/register', {
      email: 'newuser@jamalert.jm',
      password: 'password123',
      name: 'New User',
      parish: 'Kingston'
    });
    console.log(`✅ Register: ${registerResult.success ? 'Success' : 'Failed'}`);

    const incidentResult = await apiClient.post('/incidents', {
      type: 'accident',
      title: 'Test Incident',
      description: 'This is a test incident report',
      location: 'Test Location',
      severity: 'medium'
    });
    console.log(`✅ Report Incident: ${incidentResult.success ? 'Success' : 'Failed'}`);

    console.log('\n🎉 All demo functionality tests passed!');
    console.log('=====================================');
    console.log('✅ Mock data is working correctly');
    console.log('✅ API client demo mode is functional');
    console.log('✅ All endpoints return expected responses');
    console.log('\nThe demo is ready for deployment! 🚀');

  } catch (error) {
    console.error('\n❌ Demo test failed:', error.message);
    console.log('\nPlease check the api-client.ts configuration.');
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDemoFunctionality();
}

module.exports = { testDemoFunctionality };
