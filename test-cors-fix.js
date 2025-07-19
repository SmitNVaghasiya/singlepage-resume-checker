const axios = require("axios");

async function testCORSFix() {
  const backendUrl =
    "https://singlepage-resume-checker-backend-psxxoaojd.vercel.app";
  const frontendOrigin = "https://singlepage-resume-checker.vercel.app";

  console.log("Testing CORS configuration after fixes...");
  console.log(`Backend URL: ${backendUrl}`);
  console.log(`Frontend Origin: ${frontendOrigin}`);
  console.log("---");

  const testEndpoints = [
    "/api/health",
    "/api/auth/login",
    "/api/resume/history",
  ];

  for (const endpoint of testEndpoints) {
    try {
      console.log(`\nTesting endpoint: ${endpoint}`);

      // Test OPTIONS request (preflight)
      console.log("1. Testing OPTIONS preflight request...");
      const optionsResponse = await axios.options(`${backendUrl}${endpoint}`, {
        headers: {
          Origin: frontendOrigin,
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "Content-Type, Authorization",
        },
        timeout: 10000,
      });

      console.log("✅ OPTIONS request successful");
      console.log("Status:", optionsResponse.status);
      console.log("CORS Headers:", {
        "Access-Control-Allow-Origin":
          optionsResponse.headers["access-control-allow-origin"],
        "Access-Control-Allow-Methods":
          optionsResponse.headers["access-control-allow-methods"],
        "Access-Control-Allow-Headers":
          optionsResponse.headers["access-control-allow-headers"],
        "Access-Control-Allow-Credentials":
          optionsResponse.headers["access-control-allow-credentials"],
      });

      // Test actual GET request
      console.log("\n2. Testing GET request...");
      const getResponse = await axios.get(`${backendUrl}${endpoint}`, {
        headers: {
          Origin: frontendOrigin,
        },
        timeout: 10000,
      });

      console.log("✅ GET request successful");
      console.log("Status:", getResponse.status);
      console.log("Response data:", getResponse.data);
    } catch (error) {
      console.error(`❌ Test failed for ${endpoint}:`, error.message);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
        console.error("Response data:", error.response.data);
      }
    }
  }
}

// Run the test
testCORSFix();
