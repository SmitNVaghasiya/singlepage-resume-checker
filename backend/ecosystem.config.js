module.exports = {
  apps: [
    {
      name: "resume-checker-backend",
      script: "./dist/index.js",
      instances: "max", // Use all available CPU cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_file: "./logs/pm2-combined.log",
      time: true,
      merge_logs: true,
      max_memory_restart: "1G",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: "30s",
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],

  deploy: {
    production: {
      user: "deploy",
      host: "your-server.com",
      ref: "origin/main",
      repo: "git@github.com:your-username/resume-checker.git",
      path: "/var/www/resume-checker",
      "pre-deploy-local": "",
      "post-deploy":
        "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
  },
};
