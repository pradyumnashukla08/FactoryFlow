// PM2 Ecosystem Configuration
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 start ecosystem.config.js --env production
//   pm2 logs factoryflow-api
//   pm2 monit

module.exports = {
  apps: [
    {
      name: "factoryflow-api",
      script: "server/index.js",
      instances: "max", // Use all available CPU cores
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "development",
        PORT: 5001,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5001,
      },
      // Logging
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
