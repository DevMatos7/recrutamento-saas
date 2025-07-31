module.exports = {
  apps: [
    {
      name: 'gentepro-backend',
      script: 'npx',
      args: 'tsx server/index.ts',
      cwd: '/home/gentepro',
      env: {
        NODE_ENV: 'development',
        FRONTEND_URL: 'http://192.168.77.3:3000'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'gentepro-frontend',
      script: 'npm',
      args: 'run dev:frontend',
      cwd: '/home/gentepro',
      env: {
        NODE_ENV: 'development',
        FRONTEND_URL: 'http://192.168.77.3:3000'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
}; 