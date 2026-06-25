const user = process.env.USER || 'guizz'
const remotePath = process.env.REMOTE_PATH || '/home/guizz/progetti/Guiver'

module.exports = {
  apps: [{
    name: 'guiver',
    script: 'npm',
    args: 'start',
    cwd: remotePath,
    user: user,
    env: {
      NODE_ENV: 'production',
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '200M',
  }]
}
