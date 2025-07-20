const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes Configuration
const apiRoutes = [
  {
    path: "/api/apis",
    method: "GET",
    description: "Get list of all available APIs",
    example: "/api/apis",
  },
  {
    path: "/api/users",
    method: "GET",
    description: "Get list of users",
    example: "/api/users",
  },
  {
    path: "/api/users/:id",
    method: "GET",
    description: "Get user by ID",
    example: "/api/users/1",
  },
  {
    path: "/api/health",
    method: "GET",
    description: "Health check endpoint",
    example: "/api/health",
  },
  {
    path: "/api/status",
    method: "GET",
    description: "Server status information",
    example: "/api/status",
  },
  {
    path: "/api/echo",
    method: "POST",
    description: "Echo back the request body",
    example: "/api/echo (POST with JSON body)",
  },
];

// 1. API to list all available APIs
app.get("/api/apis", (req, res) => {
  res.json({
    success: true,
    message: "Available APIs",
    count: apiRoutes.length,
    apis: apiRoutes,
    serverInfo: {
      name: "Test Node Server",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
    },
  });
});

// 2. Get list of users
app.get("/api/users", (req, res) => {
  const users = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "user" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "admin" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "user" },
    { id: 4, name: "Alice Brown", email: "alice@example.com", role: "user" },
  ];

  res.json({
    success: true,
    message: "Users retrieved successfully",
    count: users.length,
    users: users,
  });
});

// 3. Get user by ID
app.get("/api/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const users = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "user" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "admin" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "user" },
    { id: 4, name: "Alice Brown", email: "alice@example.com", role: "user" },
  ];

  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      error: `No user found with ID ${userId}`,
    });
  }

  res.json({
    success: true,
    message: "User retrieved successfully",
    user: user,
  });
});

// 4. Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
});

// 5. Server status information
app.get("/api/status", (req, res) => {
  const status = {
    success: true,
    server: {
      name: "Test Node Server",
      version: "1.0.0",
      status: "running",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      port: PORT,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      pid: process.pid,
    },
  };

  res.json(status);
});

// 6. Echo endpoint (POST)
app.post("/api/echo", (req, res) => {
  res.json({
    success: true,
    message: "Request echoed back successfully",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    query: req.query,
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Test Node Server",
    version: "1.0.0",
    endpoints: {
      apis: "/api/apis",
      health: "/api/health",
      status: "/api/status",
    },
    documentation: "Use /api/apis to see all available endpoints",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    error: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: "/api/apis",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/api/apis`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Server Status: http://localhost:${PORT}/api/status`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;