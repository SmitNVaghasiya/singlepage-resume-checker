const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const baseURL =
  "https://singlepage-resume-checker-backend-gp0vkejx4.vercel.app/api";

// Helper to print results
function printResult({ method, url, status, data, error }) {
  console.log(`\n[${method}] ${url}`);
  if (status) console.log(`Status: ${status}`);
  if (data) console.log("Response:", JSON.stringify(data, null, 2));
  if (error) console.log("Error:", error);
}

async function testResumeAnalyze() {
  try {
    const form = new FormData();
    form.append("resume", fs.createReadStream("./Krushit_Resume (2).pdf"));
    form.append(
      "jobDescription",
      "Sample job description for testing resume analysis endpoint."
    );
    const res = await axios.post(baseURL + "/resume/analyze", form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    printResult({
      method: "POST",
      url: "/resume/analyze",
      status: res.status,
      data: res.data,
    });
  } catch (err) {
    if (err.response) {
      printResult({
        method: "POST",
        url: "/resume/analyze",
        status: err.response.status,
        data: err.response.data,
        error: err.message,
      });
    } else {
      printResult({
        method: "POST",
        url: "/resume/analyze",
        error: err.message,
      });
    }
  }
}

// Endpoints to test (excluding /resume/analyze, which is handled separately)
const endpoints = [
  { method: "get", url: "/resume/analysis/dummyid/status" },
  { method: "get", url: "/resume/status/dummyid" },
  { method: "get", url: "/resume/history" }, // Auth required
  { method: "get", url: "/analyses/" },
  { method: "get", url: "/analyses/stats" },
  { method: "get", url: "/analyses/top" },
  { method: "get", url: "/analyses/health" },
  { method: "post", url: "/analyses/dummyid/export", data: { dummy: "data" } }, // Auth required
  { method: "get", url: "/analyses/dummyid" },
  { method: "delete", url: "/analyses/dummyid" },
  {
    method: "post",
    url: "/auth/send-otp",
    data: { email: "test@example.com" },
  },
  {
    method: "post",
    url: "/auth/register",
    data: {
      username: "testuser",
      email: "test@example.com",
      password: "Test1234!",
    },
  },
  {
    method: "post",
    url: "/auth/login",
    data: { email: "test@example.com", password: "Test1234!" },
  },
  { method: "get", url: "/auth/me" }, // Auth required
  {
    method: "post",
    url: "/admin/login",
    data: { username: "admin", password: "admin" },
  },
  { method: "get", url: "/admin/users" }, // Admin+permission required
  { method: "put", url: "/admin/users/bulk", data: { users: [] } }, // Admin+permission required
  { method: "get", url: "/admin/stats/dashboard" }, // Admin+permission required
  { method: "get", url: "/admin/health" }, // Admin+permission required
  {
    method: "post",
    url: "/contact/",
    data: {
      name: "Test User",
      email: "test@example.com",
      subject: "Test",
      message: "This is a test message.",
    },
  },
  { method: "get", url: "/health/" },
  { method: "get", url: "/health/detailed" },
];

async function testEndpoints() {
  for (const ep of endpoints) {
    try {
      const config = { method: ep.method, url: baseURL + ep.url };
      if (ep.data) config.data = ep.data;
      const res = await axios(config);
      printResult({
        method: ep.method.toUpperCase(),
        url: ep.url,
        status: res.status,
        data: res.data,
      });
    } catch (err) {
      if (err.response) {
        printResult({
          method: ep.method.toUpperCase(),
          url: ep.url,
          status: err.response.status,
          data: err.response.data,
          error: err.message,
        });
      } else {
        printResult({
          method: ep.method.toUpperCase(),
          url: ep.url,
          error: err.message,
        });
      }
    }
  }
}

(async () => {
  await testResumeAnalyze();
  await testEndpoints();
})();
