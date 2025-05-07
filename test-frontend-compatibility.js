// This script helps test and debug the frontend subscription compatibility issue
const API_URL = 'https://stellarbeat-staging.withobsrvr.com/api/v1/subscription';

// Example data from frontend (object format that's failing)
const frontendData = {
  emailAddress: "tmosleyiii@gmail.com",
  eventSourceIds: [
    {
      type: "network",
      id: "public"
    },
    {
      type: "node",
      id: "GACM6GIRMLXBBZIYJXBDTAEYZ2GJP3JJP5G5K4WDPBS6QFHPJNK6S2FB"
    }
  ]
};

// Modified data using string format (that works)
const modifiedData = {
  emailAddress: "tmosleyiii@gmail.com",
  eventSourceIds: [
    "network:public",
    "node:GACM6GIRMLXBBZIYJXBDTAEYZ2GJP3JJP5G5K4WDPBS6QFHPJNK6S2FB"
  ]
};

// Function to convert from object format to string format
function convertEventSourceIds(eventSourceIds) {
  return eventSourceIds.map(item => `${item.type}:${item.id}`);
}

// Create a converted version of the frontend data
const convertedData = {
  ...frontendData,
  eventSourceIds: convertEventSourceIds(frontendData.eventSourceIds)
};

async function testSubscriptionApi(data, label) {
  console.log(`Testing ${label} format...`);
  console.log('Payload:', JSON.stringify(data, null, 2));
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const responseData = await response.json().catch(() => null);
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(responseData, null, 2));
    console.log('-------------------------------------------');
    return response.ok;
  } catch (error) {
    console.error('Error:', error.message);
    console.log('-------------------------------------------');
    return false;
  }
}

// Run tests
async function runTests() {
  console.log("SUBSCRIPTION API COMPATIBILITY TEST");
  console.log("===================================");
  
  // Test original frontend format (should fail)
  await testSubscriptionApi(frontendData, "frontend object");
  
  // Test fixed string format (should work)
  await testSubscriptionApi(modifiedData, "string");
  
  // Test converted format (should work)
  await testSubscriptionApi(convertedData, "converted");
}

runTests().catch(console.error);