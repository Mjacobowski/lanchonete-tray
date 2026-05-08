module.exports = {
  apps: [
    {
      name: "lanchonete",
      cwd: __dirname,
      script: "main.js",
      args: "--web-only",
      interpreter: "node",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        LANCHONETE_WEB_ONLY: "1"
      }
    }
  ]
};
