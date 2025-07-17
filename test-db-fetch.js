const mongoose = require("mongoose");
require("dotenv").config({ path: "./backend/.env" });

async function testDatabaseFetch() {
  try {
    console.log("🔍 Testing Database Fetch...");

    // Connect to MongoDB
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URL ||
      "mongodb://localhost:27017/resume_analyzer";
    console.log(
      `Connecting to MongoDB: ${mongoUri.replace(
        /\/\/[^:]+:[^@]+@/,
        "//***:***@"
      )}`
    );

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Get the analyses collection
    const db = mongoose.connection.db;
    const analysesCollection = db.collection("analyses");

    // Find all analyses
    const analyses = await analysesCollection.find({}).limit(5).toArray();
    console.log(`\n📊 Found ${analyses.length} analyses in database:`);

    analyses.forEach((analysis, index) => {
      console.log(`\n--- Analysis ${index + 1} ---`);
      console.log(`ID: ${analysis._id}`);
      console.log(`Analysis ID: ${analysis.analysis_id}`);
      console.log(`Resume: ${analysis.resume_filename}`);
      console.log(`Status: ${analysis.status}`);
      console.log(`Created: ${analysis.created_at}`);

      if (analysis.analysis_result) {
        console.log(
          `Score: ${analysis.analysis_result.score_out_of_100 || "N/A"}`
        );
        console.log(
          `Job Title: ${
            analysis.analysis_result.resume_analysis_report
              ?.candidate_information?.position_applied || "N/A"
          }`
        );
      }
    });

    // Test fetching a specific analysis
    if (analyses.length > 0) {
      const testAnalysisId = analyses[0].analysis_id;
      console.log(`\n🔍 Testing fetch for analysis ID: ${testAnalysisId}`);

      const specificAnalysis = await analysesCollection.findOne({
        analysis_id: testAnalysisId,
      });
      if (specificAnalysis) {
        console.log("✅ Successfully fetched specific analysis");
        console.log(`Resume: ${specificAnalysis.resume_filename}`);
        console.log(`Status: ${specificAnalysis.status}`);
      } else {
        console.log("❌ Failed to fetch specific analysis");
      }
    }

    await mongoose.disconnect();
    console.log("\n✅ Database test completed successfully");
  } catch (error) {
    console.error("❌ Database test failed:", error.message);
    process.exit(1);
  }
}

testDatabaseFetch();
