module.exports = {
  apps: [
    {
      name: 'sistema-contrato-roboled',
      script: 'dist/server/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
