const axios = require("axios");

// Test CORS configuration
async function testCORS() {
  const backendUrl = "https://singlepage-resume-checker-backend.vercel.app";
  const frontendOrigin = "https://singlepage-resume-checker.vercel.app/";

  console.log("Testing CORS configuration...");
  console.log(`Backend URL: ${backendUrl}`);
  console.log(`Frontend Origin: ${frontendOrigin}`);
  console.log("---");

  try {
    // Test OPTIONS request (preflight)
    console.log("1. Testing OPTIONS preflight request...");
    const optionsResponse = await axios.options(`${backendUrl}/api/health`, {
      headers: {
        Origin: frontendOrigin,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
      },
    });

    console.log("✅ OPTIONS request successful");
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
    const getResponse = await axios.get(`${backendUrl}/api/health`, {
      headers: {
        Origin: frontendOrigin,
      },
    });

    console.log("✅ GET request successful");
    console.log("Response:", getResponse.data);
  } catch (error) {
    console.error("❌ CORS test failed:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
      console.error("Response data:", error.response.data);
    }
  }
}

// Run the test
testCORS();
