const https = require("https");
const http = require("http");

const testHealthEndpoint = async (url) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;

    const req = client.get(url, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers,
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers,
            parseError: error.message,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
};

const main = async () => {
  const healthUrl =
    "https://singlepage-resume-checker-backend-psxxoaojd.vercel.app/api/health";

  console.log("Testing health endpoint...");
  console.log(`URL: ${healthUrl}`);
  console.log("---");

  try {
    const result = await testHealthEndpoint(healthUrl);

    console.log(`Status Code: ${result.status}`);
    console.log("Response Headers:");
    Object.entries(result.headers).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log("\nResponse Body:");
    console.log(JSON.stringify(result.data, null, 2));

    if (result.status === 200) {
      console.log("\n✅ Health endpoint is working correctly!");
    } else {
      console.log("\n❌ Health endpoint returned non-200 status");
    }
  } catch (error) {
    console.error("❌ Error testing health endpoint:", error.message);
  }
};

main();
