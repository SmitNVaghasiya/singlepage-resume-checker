const fs = require("fs");
const path = require("path");

// Create api directory if it doesn't exist
const apiDir = path.join(__dirname, "dist", "api");
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

// Copy vercel.js to api directory
const sourceFile = path.join(__dirname, "dist", "vercel.js");
const destFile = path.join(apiDir, "vercel.js");

if (fs.existsSync(sourceFile)) {
  fs.copyFileSync(sourceFile, destFile);
  console.log("✅ Copied vercel.js to dist/api/vercel.js");
} else {
  console.error("❌ Source file dist/vercel.js not found");
  process.exit(1);
}
