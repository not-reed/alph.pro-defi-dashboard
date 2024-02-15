module.exports = {
  apps: [
    {
      name: "AlphPro",
      script: "./src/index.js",
      // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
      instances: 1,
      autorestart: true,
      watch: true,
      max_memory_restart: "10G",
      kill_timeout: 1600,
    },
  ],
};
