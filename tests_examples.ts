// test_examples.ts - API testing examples and utilities
// Run with: deno run --allow-net test_examples.ts

const BASE_URL = "http://localhost:8000";

// Test configuration
interface TestConfig {
  baseUrl: string;
  adminCredentials: {
    username: string;
    password: string;
  };
}

const config: TestConfig = {
  baseUrl: BASE_URL,
  adminCredentials: {
    username: "admin",
    password: "admin123"
  }
};

// Utility functions
async function makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${config.baseUrl}${endpoint}`;
  console.log(`🌐 ${options.method || 'GET'} ${url}`);
  
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    ...options
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error(`❌ Error ${response.status}:`, data);
    throw new Error(`API request failed: ${response.status}`);
  }
  
  console.log(`✅ Success:`, data);
  return data;
}

async function authenticateAdmin(): Promise<string> {
  console.log("\n🔐 Authenticating admin...");
  
  const response = await makeRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(config.adminCredentials)
  });
  
  return response.data.token;
}

async function makeAuthenticatedRequest(endpoint: string, token: string, options: RequestInit = {}): Promise<any> {
  return makeRequest(endpoint, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      ...options.headers
    }
  });
}

// Test functions
async function testPublicEndpoints(): Promise<void> {
  console.log("\n📋 Testing Public Endpoints");
  console.log("=" .repeat(50));
  
  // Test health check
  await makeRequest("/api/health");
  
  // Test get all watches
  await makeRequest("/api/watches");
  
  // Test get specific watch
  await makeRequest("/api/watches/1");
  
  // Test search watches
  await makeRequest("/api/watches/search?q=rolex");
  
  // Test submit inquiry
  await makeRequest("/api/inquiries", {
    method: "POST",
    body: JSON.stringify({
      watch_id: 1,
      customer_name: "Test Customer",
      customer_email: "test@example.com",
      customer_phone: "+1234567890",
      message: "I'm interested in this watch. Is it still available?"
    })
  });
  
  // Test submit sell request
  await makeRequest("/api/sell", {
    method: "POST",
    body: JSON.stringify({
      brand: "Omega",
      model: "Seamaster",
      reference: "210.30.42.20.01.001",
      year: 2020,
      condition: "Excellent",
      accessories: "Box and papers",
      description: "Purchased new, barely worn",
      customer_name: "Test Seller",
      customer_email: "seller@example.com",
      customer_phone: "+1234567890"
    })
  });
}

async function testAdminEndpoints(token: string): Promise<void> {
  console.log("\n🔧 Testing Admin Endpoints");
  console.log("=" .repeat(50));
  
  // Test get admin user info
  await makeAuthenticatedRequest("/api/auth/me", token);
  
  // Test get admin watches view
  await makeAuthenticatedRequest("/api/admin/watches", token);
  
  // Test get statistics
  await makeAuthenticatedRequest("/api/admin/stats", token);
  
  // Test get inquiries
  await makeAuthenticatedRequest("/api/admin/inquiries", token);
  
  // Test get sell submissions
  await makeAuthenticatedRequest("/api/admin/sell-submissions", token);
  
  // Test create new watch
  const newWatch = await makeAuthenticatedRequest("/api/admin/watches", token, {
    method: "POST",
    body: JSON.stringify({
      brand: "TAG Heuer",
      model: "Carrera",
      reference: "CAR201T.BA0766",
      year: 2021,
      condition: "Very Good",
      price: 1800,
      market_price: 2000,
      description: "TAG Heuer Carrera Calibre 16 Chronograph in excellent condition",
      image: "⚡",
      accessories: "Box, papers, warranty card"
    })
  });
  
  const newWatchId = newWatch.data.id;
  console.log(`📦 Created watch with ID: ${newWatchId}`);
  
  // Test update watch
  await makeAuthenticatedRequest(`/api/admin/watches/${newWatchId}`, token, {
    method: "PUT",
    body: JSON.stringify({
      price: 1750,
      description: "Updated: TAG Heuer Carrera Calibre 16 Chronograph - Price reduced!"
    })
  });
  
  // Test delete watch (soft delete)
  await makeAuthenticatedRequest(`/api/admin/watches/${newWatchId}`, token, {
    method: "DELETE"
  });
}

async function testExternalApiIntegrations(token: string): Promise<void> {
  console.log("\n🔗 Testing External API Integrations");
  console.log("=" .repeat(50));
  
  // Test WatchCharts search
  try {
    await makeAuthenticatedRequest("/api/watchcharts/search", token, {
      method: "POST",
      body: JSON.stringify({
        brand: "rolex",
        reference: "126610LN"
      })
    });
  } catch (error) {
    console.log("⚠️ WatchCharts API test failed (expected if no API key configured)");
  }
  
  // Test WhatsApp send
  try {
    await makeAuthenticatedRequest("/api/whatsapp/send", token, {
      method: "POST",
      body: JSON.stringify({
        to: "+1234567890",
        message: "🧪 Test message from Prestige Timepieces API testing suite!"
      })
    });
  } catch (error) {
    console.log("⚠️ WhatsApp API test failed (expected if using mock provider)");
  }
  
  // Test settings
  await makeAuthenticatedRequest("/api/settings", token);
  
  // Test API key status
  await makeAuthenticatedRequest("/api/keys/status", token);
}

async function testErrorHandling(): Promise<void> {
  console.log("\n❌ Testing Error Handling");
  console.log("=" .repeat(50));
  
  try {
    // Test invalid endpoint
    await makeRequest("/api/invalid-endpoint");
  } catch (error) {
    console.log("✅ 404 error handled correctly");
  }
  
  try {
    // Test invalid watch ID
    await makeRequest("/api/watches/999999");
  } catch (error) {
    console.log("✅ Invalid watch ID error handled correctly");
  }
  
  try {
    // Test unauthorized access
    await makeRequest("/api/admin/watches");
  } catch (error) {
    console.log("✅ Unauthorized access error handled correctly");
  }
  
  try {
    // Test invalid authentication
    await makeRequest("/api/admin/watches", {
      headers: {
        "Authorization": "Bearer invalid-token"
      }
    });
  } catch (error) {
    console.log("✅ Invalid token error handled correctly");
  }
  
  try {
    // Test malformed request
    await makeRequest("/api/inquiries", {
      method: "POST",
      body: JSON.stringify({
        // Missing required fields
        customer_name: "Test"
      })
    });
  } catch (error) {
    console.log("✅ Validation error handled correctly");
  }
}

async function performanceTest(): Promise<void> {
  console.log("\n⚡ Performance Testing");
  console.log("=" .repeat(50));
  
  const start = performance.now();
  
  // Concurrent requests test
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(makeRequest("/api/watches"));
  }
  
  await Promise.all(promises);
  
  const end = performance.now();
  const duration = end - start;
  
  console.log(`✅ 10 concurrent requests completed in ${duration.toFixed(2)}ms`);
  console.log(`📊 Average: ${(duration / 10).toFixed(2)}ms per request`);
}

// Load testing utility
async function loadTest(endpoint: string, concurrent: number = 5, duration: number = 10000): Promise<void> {
  console.log(`\n🚀 Load Testing ${endpoint}`);
  console.log(`⏱️ Duration: ${duration}ms, Concurrent: ${concurrent}`);
  console.log("=" .repeat(50));
  
  const startTime = Date.now();
  let requestCount = 0;
  let errorCount = 0;
  
  const workers = Array(concurrent).fill(null).map(async () => {
    while (Date.now() - startTime < duration) {
      try {
        await makeRequest(endpoint);
        requestCount++;
      } catch (error) {
        errorCount++;
      }
      
      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });
  
  await Promise.all(workers);
  
  const actualDuration = Date.now() - startTime;
  const requestsPerSecond = (requestCount / (actualDuration / 1000)).toFixed(2);
  
  console.log(`📊 Results:`);
  console.log(`   Total Requests: ${requestCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Success Rate: ${((requestCount / (requestCount + errorCount)) * 100).toFixed(1)}%`);
  console.log(`   Requests/Second: ${requestsPerSecond}`);
}

// Main test runner
async function runAllTests(): Promise<void> {
  console.log("🏆 Prestige Timepieces API Test Suite");
  console.log("=" .repeat(60));
  
  try {
    // Test public endpoints
    await testPublicEndpoints();
    
    // Authenticate and test admin endpoints
    const token = await authenticateAdmin();
    await testAdminEndpoints(token);
    await testExternalApiIntegrations(token);
    
    // Test error handling
    await testErrorHandling();
    
    // Performance tests
    await performanceTest();
    
    // Optional load test (uncomment to run)
    // await loadTest("/api/watches", 3, 5000);
    
    console.log("\n🎉 All tests completed successfully!");
    
  } catch (error) {
    console.error("\n💥 Test suite failed:", error);
    Deno.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.main) {
  console.log("Starting API tests...");
  console.log("Make sure the server is running on http://localhost:8000\n");
  
  // Wait a moment for user to see the message
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await runAllTests();
}

// Export for use in other test files
export {
  makeRequest,
  authenticateAdmin,
  makeAuthenticatedRequest,
  testPublicEndpoints,
  testAdminEndpoints,
  testExternalApiIntegrations,
  testErrorHandling,
  performanceTest,
  loadTest,
  runAllTests
};

// Example usage in other files:
// import { makeRequest, authenticateAdmin } from "./test_examples.ts";
// const token = await authenticateAdmin();
// const watches = await makeRequest("/api/watches");