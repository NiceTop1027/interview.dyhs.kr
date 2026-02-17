module.exports = {
  apps: [{
    name: 'dy-interview',
    script: './start-production.sh',
    cwd: '/home/dyserver01/NiceTop/NiceTop_AI1:1',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:25432/nicetop_ai?schema=public&sslmode=disable'
    },
    error_file: '/home/dyserver01/.pm2/logs/nicetop-ai-error.log',
    out_file: '/home/dyserver01/.pm2/logs/nicetop-ai-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    kill_timeout: 5000,
    wait_ready: false,
    listen_timeout: 10000,
  }]
}
