const axios = require("axios");

async function testBackendURL() {
  const urls = [
    "https://singlepage-resume-checker-backend-psxxoaojd.vercel.app",
    "https://singlepage-resume-checker-backend-psxxoaojd.vercel.app/api/health",
    "https://singlepage-resume-checker-backend-psxxoaojd.vercel.app/api",
    "https://singlepage-resume-checker-backend-psxxoaojd.vercel.app/",
    "https://singlepage-resume-checker-backend.vercel.app",
    "https://singlepage-resume-checker-backend.vercel.app/api/health",
  ];

  console.log("Testing backend URLs...\n");

  for (const url of urls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await axios.get(url, { timeout: 10000 });
      console.log(`✅ Status: ${response.status}`);
      console.log(`Response:`, response.data);
      console.log("---");
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Data:`, error.response.data);
      }
      console.log("---");
    }
  }
}

testBackendURL();
