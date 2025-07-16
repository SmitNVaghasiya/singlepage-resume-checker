#!/usr/bin/env node

/**
 * Connection Test Script for AI Resume Analyzer
 * Tests connectivity between Frontend, Backend, and Python Server
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

const SERVICES = {
  frontend: "http://localhost:5173",
  backend: "http://localhost:5000",
  python: "http://localhost:8000",
};

const COLORS = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logHeader(message) {
  console.log("\n" + "=".repeat(60));
  log(message, "bold");
  console.log("=".repeat(60));
}

function logService(name, status, details = "") {
  const icon = status ? "✅" : "❌";
  const color = status ? "green" : "red";
  log(`${icon} ${name}: ${status ? "RUNNING" : "FAILED"}`, color);
  if (details) {
    log(`   ${details}`, "yellow");
  }
}

async function testService(url, name, healthEndpoint = "/health") {
  try {
    const startTime = Date.now();
    const response = await axios.get(`${url}${healthEndpoint}`, {
      timeout: 5000,
    });
    const responseTime = Date.now() - startTime;

    if (response.status === 200) {
      return {
        status: true,
        details: `Response time: ${responseTime}ms`,
        data: response.data,
      };
    } else {
      return {
        status: false,
        details: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    let details = "Connection failed";

    if (error.code === "ECONNREFUSED") {
      details = "Service not running or port not available";
    } else if (error.code === "ENOTFOUND") {
      details = "Host not found";
    } else if (error.code === "ETIMEDOUT") {
      details = "Request timed out";
    } else if (error.response) {
      details = `HTTP ${error.response.status}: ${error.response.statusText}`;
    } else if (error.message) {
      details = error.message;
    }

    return {
      status: false,
      details,
    };
  }
}

async function testBackendToPython() {
  try {
    log("\n🔗 Testing Backend → Python API Connection...", "blue");

    // Test if backend can reach Python API
    const response = await axios.get(
      `${SERVICES.backend}/api/health/detailed`,
      {
        timeout: 5000,
      }
    );

    if (response.data.pythonApi && response.data.pythonApi.healthy) {
      log("✅ Backend can connect to Python API", "green");
      log(
        `   Python API Status: ${
          response.data.pythonApi.healthy ? "Healthy" : "Unhealthy"
        }`,
        "yellow"
      );
      if (response.data.pythonApi.responseTime) {
        log(
          `   Response Time: ${response.data.pythonApi.responseTime}ms`,
          "yellow"
        );
      }
      return true;
    } else {
      log("❌ Backend cannot connect to Python API", "red");
      if (response.data.pythonApi && response.data.pythonApi.error) {
        log(`   Error: ${response.data.pythonApi.error}`, "yellow");
      }
      return false;
    }
  } catch (error) {
    log("❌ Backend health check failed", "red");
    log(`   Error: ${error.message}`, "yellow");
    return false;
  }
}

async function testFileUpload() {
  try {
    log("\n📁 Testing File Upload Capability...", "blue");

    // Create a test file
    const testContent = "This is a test resume content for testing purposes.";
    const testFile = Buffer.from(testContent);

    const formData = new FormData();
    formData.append("resume_file", testFile, {
      filename: "test-resume.txt",
      contentType: "text/plain",
    });
    formData.append(
      "job_description_text",
      "Test job description for software engineer position."
    );

    const response = await axios.post(
      `${SERVICES.python}/analyze-resume`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000,
      }
    );

    if (response.status === 200) {
      log("✅ File upload and analysis test successful", "green");
      log(`   Score: ${response.data.score_out_of_100 || "N/A"}`, "yellow");
      log(
        `   Eligibility: ${response.data.resume_eligibility || "N/A"}`,
        "yellow"
      );
      return true;
    } else {
      log("❌ File upload test failed", "red");
      return false;
    }
  } catch (error) {
    log("❌ File upload test failed", "red");
    log(`   Error: ${error.message}`, "yellow");
    if (error.response && error.response.data) {
      log(
        `   Response: ${JSON.stringify(error.response.data, null, 2)}`,
        "yellow"
      );
    }
    return false;
  }
}

async function checkEnvironmentFiles() {
  log("\n📋 Checking Environment Configuration...", "blue");

  const envFiles = [
    { path: "backend/.env", required: false, template: "backend/env.example" },
    {
      path: "python_server/.env",
      required: true,
      template: "python_server/env.example",
    },
    { path: "frontend/.env", required: false },
  ];

  let allGood = true;

  for (const envFile of envFiles) {
    try {
      if (fs.existsSync(envFile.path)) {
        const content = fs.readFileSync(envFile.path, "utf8");
        if (envFile.required && !content.includes("GROQ_API_KEY=")) {
          log(`❌ ${envFile.path}: Missing GROQ_API_KEY`, "red");
          allGood = false;
        } else {
          log(`✅ ${envFile.path}: Found`, "green");
        }
      } else {
        if (envFile.required) {
          log(`❌ ${envFile.path}: Missing (required)`, "red");
          if (envFile.template && fs.existsSync(envFile.template)) {
            log(
              `   💡 Copy ${envFile.template} to ${envFile.path} and configure`,
              "yellow"
            );
          }
          allGood = false;
        } else {
          log(`⚠️  ${envFile.path}: Not found (optional)`, "yellow");
          if (envFile.template && fs.existsSync(envFile.template)) {
            log(
              `   💡 Copy ${envFile.template} to ${envFile.path} for custom configuration`,
              "yellow"
            );
          }
        }
      }
    } catch (error) {
      log(`❌ ${envFile.path}: Error reading file`, "red");
      allGood = false;
    }
  }

  return allGood;
}

async function testDatabaseConnection() {
  try {
    log("\n🗄️  Testing Database Connection...", "blue");

    const response = await axios.get(
      `${SERVICES.backend}/api/health/detailed`,
      {
        timeout: 5000,
      }
    );

    if (
      response.data.database &&
      response.data.database.status === "connected"
    ) {
      log("✅ Database connection successful", "green");
      log(`   Status: ${response.data.database.status}`, "yellow");
      if (response.data.database.details) {
        log(`   Host: ${response.data.database.details.host}`, "yellow");
        log(`   Database: ${response.data.database.details.name}`, "yellow");
      }
      return true;
    } else {
      log("❌ Database connection failed", "red");
      if (response.data.database && response.data.database.details) {
        log(`   Error: ${response.data.database.details.error}`, "yellow");
      }
      return false;
    }
  } catch (error) {
    log("❌ Database connection test failed", "red");
    log(`   Error: ${error.message}`, "yellow");
    return false;
  }
}

async function testAuthenticationFlow() {
  try {
    log("\n🔐 Testing Authentication Flow...", "blue");

    // Test registration endpoint
    const registerResponse = await axios.post(
      `${SERVICES.backend}/api/auth/send-otp`,
      {
        email: "test@example.com",
      },
      {
        timeout: 5000,
      }
    );

    if (registerResponse.status === 200) {
      log("✅ Authentication endpoints accessible", "green");
      return true;
    } else {
      log("❌ Authentication endpoints not accessible", "red");
      return false;
    }
  } catch (error) {
    if (error.response && error.response.status === 400) {
      // This is expected for invalid email
      log("✅ Authentication endpoints accessible", "green");
      return true;
    } else {
      log("❌ Authentication endpoints not accessible", "red");
      log(`   Error: ${error.message}`, "yellow");
      return false;
    }
  }
}

async function main() {
  logHeader("🔍 AI Resume Analyzer - Connection Test");
  log(
    "Testing connectivity between Frontend, Backend, and Python Server",
    "blue"
  );

  // Test individual services
  logHeader("📡 Testing Individual Services");

  const frontendTest = await testService(SERVICES.frontend, "Frontend", "");
  logService("Frontend", frontendTest.status, frontendTest.details);

  const backendTest = await testService(
    SERVICES.backend,
    "Backend",
    "/api/health"
  );
  logService("Backend", backendTest.status, backendTest.details);

  const pythonTest = await testService(
    SERVICES.python,
    "Python API",
    "/health"
  );
  logService("Python API", pythonTest.status, pythonTest.details);

  // Test environment configuration
  const envConfig = await checkEnvironmentFiles();

  // Test database connection
  const dbTest = await testDatabaseConnection();

  // Test backend to Python communication
  const backendPythonTest = await testBackendToPython();

  // Test authentication flow
  const authTest = await testAuthenticationFlow();

  // Test file upload (only if Python API is running)
  let uploadTest = { status: false, details: "Python API not running" };
  if (pythonTest.status) {
    uploadTest = await testFileUpload();
  }

  // Summary
  logHeader("📊 Test Summary");

  const tests = [
    { name: "Frontend", result: frontendTest.status },
    { name: "Backend", result: backendTest.status },
    { name: "Python API", result: pythonTest.status },
    { name: "Environment Config", result: envConfig },
    { name: "Database", result: dbTest },
    { name: "Backend → Python", result: backendPythonTest },
    { name: "Authentication", result: authTest },
    { name: "File Upload", result: uploadTest.status },
  ];

  const passed = tests.filter((t) => t.result).length;
  const total = tests.length;

  tests.forEach((test) => {
    logService(test.name, test.result);
  });

  logHeader("🎯 Overall Status");
  if (passed === total) {
    log(`✅ All tests passed! (${passed}/${total})`, "green");
    log("🚀 Your AI Resume Analyzer is ready to use!", "green");
  } else {
    log(`❌ ${total - passed} test(s) failed (${passed}/${total})`, "red");
    log(
      "🔧 Please fix the issues above before using the application",
      "yellow"
    );
  }

  // Recommendations
  if (!envConfig) {
    logHeader("🔧 Setup Recommendations");
    log("1. Create .env files from the provided templates", "yellow");
    log("2. Configure your GROQ_API_KEY in python_server/.env", "yellow");
    log("3. Set up MongoDB if you want to store analysis results", "yellow");
  }

  if (!pythonTest.status) {
    logHeader("🐍 Python Server Setup");
    log("1. Navigate to python_server directory", "yellow");
    log("2. Create virtual environment: python -m venv venv", "yellow");
    log("3. Activate virtual environment", "yellow");
    log("4. Install dependencies: pip install -r requirements.txt", "yellow");
    log("5. Create .env file with your GROQ_API_KEY", "yellow");
    log("6. Start server: python main.py", "yellow");
  }

  if (!backendTest.status) {
    logHeader("⚙️  Backend Setup");
    log("1. Navigate to backend directory", "yellow");
    log("2. Install dependencies: npm install", "yellow");
    log("3. Create .env file from env.example", "yellow");
    log("4. Start server: npm run dev", "yellow");
  }

  if (!frontendTest.status) {
    logHeader("🎨 Frontend Setup");
    log("1. Navigate to frontend directory", "yellow");
    log("2. Install dependencies: npm install", "yellow");
    log("3. Start server: npm run dev", "yellow");
  }
}

// Handle command line arguments
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Usage: node test-connections.js [options]

Options:
  --help, -h     Show this help message
  --quick        Run only basic connectivity tests
  --verbose      Show detailed error information

Examples:
  node test-connections.js
  node test-connections.js --quick
  node test-connections.js --verbose
`);
  process.exit(0);
}

// Run the tests
main().catch((error) => {
  log(`❌ Test script failed: ${error.message}`, "red");
  process.exit(1);
});
