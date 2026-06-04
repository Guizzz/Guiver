module.exports = {
  apps: [{
    name: 'guiver',
    script: 'npm',
    args: 'start',
    cwd: '/home/guizz/progetti/Guiver',
    env: {
      NODE_ENV: 'production',
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '200M',
  }]
}
