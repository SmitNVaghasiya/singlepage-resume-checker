  const mongoose = require("mongoose");
const { SystemConfigService } = require("../src/services/systemConfigService");
const { config } = require("../src/config/config");
const { logger } = require("../src/utils/logger");

async function initializeSystemConfigs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUrl);
    logger.info("Connected to MongoDB");

    // Get the first admin user to use as the modifier
    const Admin = require("../src/models/Admin");
    const admin = await Admin.findOne().exec();

    if (!admin) {
      logger.error("No admin user found. Please create an admin user first.");
      process.exit(1);
    }

    logger.info(
      `Initializing system configurations with admin: ${admin.username}`
    );

    // Initialize default configurations
    await SystemConfigService.initializeDefaultConfigs(admin._id.toString());

    logger.info("System configurations initialized successfully");

    // Display the configurations
    const configs = await SystemConfigService.getAllConfigs();
    logger.info("Current system configurations:");
    configs.forEach((config) => {
      logger.info(`- ${config.key}: ${config.value} (${config.category})`);
    });
  } catch (error) {
    logger.error("Failed to initialize system configurations:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
  }
}

// Run the initialization
if (require.main === module) {
  initializeSystemConfigs();
}

module.exports = { initializeSystemConfigs };
