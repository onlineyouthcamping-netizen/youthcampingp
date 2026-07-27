module.exports = {
  apps: [{
    name: 'youthcamping-api',
    script: 'src/server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    restart_delay: 5000,
    max_restarts: 5,
    min_uptime: '10s',
    env: { 
      NODE_ENV: 'production',
      PORT: 3001 
    },
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
