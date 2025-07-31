module.exports = {
  apps: [
    {
      name: 'explorer',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Trust proxy for IP detection
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        TRUST_PROXY: 'true',
      },
    },
  ],
};
