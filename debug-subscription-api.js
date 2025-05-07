const API_URL = 'https://stellarbeat-staging.withobsrvr.com/api/v1/subscription';

// Test various formats to identify which works
const testCases = [
  {
    name: "Object format (frontend style)",
    data: {
      emailAddress: "test@example.com",
      eventSourceIds: [
        {
          type: "network",
          id: "public"
        }
      ]
    }
  },
  {
    name: "String format (working style)",
    data: {
      emailAddress: "test@example.com",
      eventSourceIds: [
        "network:public"
      ]
    }
  },
  {
    name: "Modified string format 1",
    data: {
      emailAddress: "test@example.com",
      eventSourceIds: [
        "network:public:extra" // Testing if the parser is just using the first part
      ]
    }
  },
  {
    name: "Modified string format 2",
    data: {
      emailAddress: "test@example.com",
      eventSourceIds: [
        "networkpublic" // Testing if the colon is required
      ]
    }
  },
  {
    name: "Nested array format",
    data: {
      emailAddress: "test@example.com",
      eventSourceIds: [
        ["network", "public"] // Testing if an array format works
      ]
    }
  },
  {
    name: "Hybrid format",
    data: {
      emailAddress: "test@example.com",
      eventSourceIds: [
        "network:public", 
        { type: "node", id: "GACM6GIRMLXBBZIYJXBDTAEYZ2GJP3JJP5G5K4WDPBS6QFHPJNK6S2FB" }
      ]
    }
  }
];

// Function to test a subscription payload
async function testPayload(testCase) {
  console.log(`\n==== Testing: ${testCase.name} ====`);
  console.log('Payload:', JSON.stringify(testCase.data, null, 2));
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCase.data)
    });
    
    const responseData = await response.json().catch(() => ({ error: "Failed to parse JSON response" }));
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(responseData, null, 2));
    return { success: response.ok, status: response.status, data: responseData };
  } catch (error) {
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run all test cases sequentially
async function runAllTests() {
  console.log("🔍 SUBSCRIPTION API FORMAT TESTING");
  console.log("=================================");
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await testPayload(testCase);
    results.push({
      name: testCase.name,
      success: result.success,
      status: result.status
    });
  }
  
  // Print summary
  console.log("\n==== SUMMARY ====");
  console.table(results);
}

// Run the tests
runAllTests().catch(console.error);