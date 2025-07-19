const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Admin schema (simplified for script)
const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9_]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Admin = mongoose.model("Admin", adminSchema);

async function createAdmin() {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGODB_URL;
    if (!mongoUrl) {
      console.error("MONGODB_URL environment variable is required");
      process.exit(1);
    }

    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      console.log("Admin already exists:", existingAdmin.username);
      process.exit(0);
    }

    // Create admin
    const adminData = {
      username: "admin",
      email: "admin@resumechecker.com",
      password: "Admin@123",
      fullName: "System Administrator",
      isActive: true,
    };

    // Hash password
    const salt = await bcrypt.genSalt(12);
    adminData.password = await bcrypt.hash(adminData.password, salt);

    const admin = new Admin(adminData);
    await admin.save();

    console.log("Admin created successfully!");
    console.log("Username:", adminData.username);
    console.log("Email:", adminData.email);
    console.log("Password:", "Admin@123");
    console.log("\n⚠️  IMPORTANT: Change the password after first login!");
  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

createAdmin();
