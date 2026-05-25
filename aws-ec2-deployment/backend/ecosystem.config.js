module.exports = {
  apps: [
    {
      name: 'user-service',
      cwd: '/opt/rxpulse/user-service',
      script: './src/app.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '250M',
      max_restarts: 10,
      restart_delay: 5000,
      min_uptime: '10s',
      out_file: '/var/log/rxpulse/user-service-out.log',
      error_file: '/var/log/rxpulse/user-service-error.log',
      combine_logs: true,
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'catalog-service',
      cwd: '/opt/rxpulse/catalog-service',
      script: './src/app.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '250M',
      max_restarts: 10,
      restart_delay: 5000,
      min_uptime: '10s',
      out_file: '/var/log/rxpulse/catalog-service-out.log',
      error_file: '/var/log/rxpulse/catalog-service-error.log',
      combine_logs: true,
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    },
    {
      name: 'inventory-service',
      cwd: '/opt/rxpulse/inventory-service',
      script: './src/app.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '250M',
      max_restarts: 10,
      restart_delay: 5000,
      min_uptime: '10s',
      out_file: '/var/log/rxpulse/inventory-service-out.log',
      error_file: '/var/log/rxpulse/inventory-service-error.log',
      combine_logs: true,
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      }
    }
  ]
};
