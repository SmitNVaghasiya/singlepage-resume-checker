#!/usr/bin/env node

/**
 * Connection Test Script for AI Resume Analyzer
 * Tests connectivity between Frontend, Backend, and Python Server
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const fetch = require("node-fetch");

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
    const response = await axios.get(`${SERVICES.backend}/api/health`, {
      timeout: 5000,
    });

    if (response.data.pythonApi) {
      log("✅ Backend can connect to Python API", "green");
      log(`   Python API Status: ${response.data.pythonApi.status}`, "yellow");
      return true;
    } else {
      log("❌ Backend cannot connect to Python API", "red");
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
      log(`   Response: ${JSON.stringify(response.data, null, 2)}`, "yellow");
      return true;
    } else {
      log("❌ File upload test failed", "red");
      return false;
    }
  } catch (error) {
    log("❌ File upload test failed", "red");
    log(`   Error: ${error.message}`, "yellow");
    return false;
  }
}

async function checkEnvironmentFiles() {
  log("\n📋 Checking Environment Configuration...", "blue");

  const envFiles = [
    { path: "backend/.env", required: false },
    { path: "python_server/.env", required: true },
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
          allGood = false;
        } else {
          log(`⚠️  ${envFile.path}: Not found (optional)`, "yellow");
        }
      }
    } catch (error) {
      log(`❌ ${envFile.path}: Error reading file`, "red");
      allGood = false;
    }
  }

  return allGood;
}

async function testTempFileUpload() {
  console.log("Testing temporary file upload functionality...\n");

  try {
    // Create a test file
    const testContent = "This is a test job description file content.";
    const testBuffer = Buffer.from(testContent, "utf-8");

    // Test 1: Upload resume file
    console.log("1. Testing resume file upload...");
    const resumeFormData = new FormData();
    resumeFormData.append("resume", testBuffer, {
      filename: "test-resume.pdf",
      contentType: "application/pdf",
    });

    const resumeResponse = await fetch(
      `${SERVICES.backend}/resume/upload-temp`,
      {
        method: "POST",
        body: resumeFormData,
      }
    );

    if (!resumeResponse.ok) {
      const errorText = await resumeResponse.text();
      console.error("Resume upload failed:", resumeResponse.status, errorText);
      return;
    }

    const resumeResult = await resumeResponse.json();
    console.log("Resume upload successful:", {
      message: resumeResult.message,
      tempId: resumeResult.tempFiles?.resume?.tempId,
      requiresAuth: resumeResult.requiresAuth,
    });

    // Test 2: Upload job description file
    console.log("\n2. Testing job description file upload...");
    const jobFormData = new FormData();
    jobFormData.append("jobDescription", testBuffer, {
      filename: "test-job.pdf",
      contentType: "application/pdf",
    });

    const jobResponse = await fetch(`${SERVICES.backend}/resume/upload-temp`, {
      method: "POST",
      body: jobFormData,
    });

    if (!jobResponse.ok) {
      const errorText = await jobResponse.text();
      console.error(
        "Job description upload failed:",
        jobResponse.status,
        errorText
      );
      return;
    }

    const jobResult = await jobResponse.json();
    console.log("Job description upload successful:", {
      message: jobResult.message,
      tempId: jobResult.tempFiles?.jobDescription?.tempId,
      requiresAuth: jobResult.requiresAuth,
    });

    // Test 3: Upload both files together
    console.log("\n3. Testing both files upload together...");
    const bothFormData = new FormData();
    bothFormData.append("resume", testBuffer, {
      filename: "test-resume-both.pdf",
      contentType: "application/pdf",
    });
    bothFormData.append("jobDescription", testBuffer, {
      filename: "test-job-both.pdf",
      contentType: "application/pdf",
    });

    const bothResponse = await fetch(`${SERVICES.backend}/resume/upload-temp`, {
      method: "POST",
      body: bothFormData,
    });

    if (!bothResponse.ok) {
      const errorText = await bothResponse.text();
      console.error(
        "Both files upload failed:",
        bothResponse.status,
        errorText
      );
      return;
    }

    const bothResult = await bothResponse.json();
    console.log("Both files upload successful:", {
      message: bothResult.message,
      resumeTempId: bothResult.tempFiles?.resume?.tempId,
      jobTempId: bothResult.tempFiles?.jobDescription?.tempId,
      requiresAuth: bothResult.requiresAuth,
    });

    console.log("\n✅ All temporary file upload tests passed!");
    console.log("\nNote: To test file retrieval, you would need to:");
    console.log("1. Get a valid auth token");
    console.log("2. Use the temp IDs in an analysis request");
    console.log("3. Check the backend logs for retrieval success/failure");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

async function main() {
  console.log("🔍 Testing service connections...\n");

  const allGood = await checkEnvironmentFiles();

  if (allGood) {
    console.log("\n✅ Environment configuration is OK.");
  } else {
    console.log(
      "\n❌ Environment configuration issues detected. Please fix before continuing."
    );
  }

  // Test individual services
  // Check environment files first
  const envOk = await checkEnvironmentFiles();

  if (!envOk) {
    log(
      "\n⚠️  Environment configuration issues detected. Please fix before continuing.",
      "yellow"
    );
  }

  // Test individual services
  log("\n🔍 Testing Individual Services...", "blue");

  const results = {};

  // Test Python Server
  const pythonResult = await testService(SERVICES.python, "Python Server");
  results.python = pythonResult;
  logService("Python Server", pythonResult.status, pythonResult.details);

  // Test Backend
  const backendResult = await testService(
    SERVICES.backend,
    "Backend",
    "/api/health"
  );
  results.backend = backendResult;
  logService("Backend", backendResult.status, backendResult.details);

  // Test Frontend (basic connectivity)
  try {
    const frontendResponse = await axios.get(SERVICES.frontend, {
      timeout: 5000,
    });
    results.frontend = { status: true, details: "Homepage accessible" };
    logService("Frontend", true, "Homepage accessible");
  } catch (error) {
    results.frontend = { status: false, details: error.message };
    logService("Frontend", false, error.message);
  }

  // Test inter-service connections
  if (results.backend.status && results.python.status) {
    const backendToPython = await testBackendToPython();
    results.backendToPython = backendToPython;
  }

  // Test file upload if Python is running
  if (results.python.status) {
    const fileUploadTest = await testFileUpload();
    results.fileUpload = fileUploadTest;
  }

  // Summary
  logHeader("Test Summary");

  const allServicesRunning =
    results.python?.status &&
    results.backend?.status &&
    results.frontend?.status;
  const allConnectionsWorking = results.backendToPython && results.fileUpload;

  if (allServicesRunning) {
    log("✅ All services are running!", "green");
  } else {
    log("❌ Some services are not running", "red");
  }

  if (allConnectionsWorking) {
    log("✅ All connections are working!", "green");
  } else {
    log("❌ Some connections are not working", "red");
  }

  // Recommendations
  logHeader("Recommendations");

  if (!results.python?.status) {
    log("🔧 Python Server Issues:", "yellow");
    log(
      "   1. Check if Python server is started: cd python_server && python main.py",
      "yellow"
    );
    log("   2. Verify GROQ_API_KEY in python_server/.env", "yellow");
    log("   3. Check if port 8000 is available", "yellow");
  }

  if (!results.backend?.status) {
    log("🔧 Backend Issues:", "yellow");
    log(
      "   1. Check if backend is started: cd backend && npm run dev",
      "yellow"
    );
    log("   2. Verify MongoDB is running (optional)", "yellow");
    log("   3. Check if port 5000 is available", "yellow");
  }

  if (!results.frontend?.status) {
    log("🔧 Frontend Issues:", "yellow");
    log(
      "   1. Check if frontend is started: cd frontend && npm run dev",
      "yellow"
    );
    log("   2. Check if port 5173 is available", "yellow");
  }

  if (
    results.python?.status &&
    results.backend?.status &&
    !results.backendToPython
  ) {
    log("🔧 Backend-Python Connection Issues:", "yellow");
    log("   1. Check PYTHON_API_URL in backend/.env", "yellow");
    log("   2. Verify Python server is accessible from backend", "yellow");
  }

  log("\n🎯 Next Steps:", "blue");
  if (allServicesRunning && allConnectionsWorking) {
    log(
      "✅ All systems operational! You can now use the application.",
      "green"
    );
    log("   Visit: http://localhost:5173", "blue");
  } else {
    log(
      "🔧 Please fix the issues above before using the application.",
      "yellow"
    );
  }

  console.log("\n");
}

// Handle FormData for Node.js
class FormData {
  constructor() {
    this.boundary =
      "----WebKitFormBoundary" + Math.random().toString(16).substr(2);
    this.data = [];
  }

  append(name, value, options = {}) {
    this.data.push({ name, value, options });
  }

  getHeaders() {
    return {
      "Content-Type": `multipart/form-data; boundary=${this.boundary}`,
    };
  }
}

// Run the test
if (require.main === module) {
  main().catch((error) => {
    log(`\n❌ Test failed with error: ${error.message}`, "red");
    process.exit(1);
  });
}

module.exports = { testService, testBackendToPython, testFileUpload };
