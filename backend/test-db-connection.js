const mongoose = require("mongoose");
require("dotenv").config();

async function testConnection() {
  console.log("Testing MongoDB connection...");
  console.log(
    "MongoDB URL:",
    process.env.MONGODB_URL
      ? process.env.MONGODB_URL.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")
      : "Not set"
  );

  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: true,
      retryWrites: true,
      w: "majority",
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000,
      localThresholdMS: 15,
    });

    console.log("✅ MongoDB connection successful!");
    console.log("Connection state:", mongoose.connection.readyState);
    console.log("Database name:", mongoose.connection.name);

    // Test a simple operation
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "Available collections:",
      collections.map((c) => c.name)
    );

    await mongoose.disconnect();
    console.log("✅ Connection test completed successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

testConnection();
