const { execSync } = require('child_process')
const { resolve } = require('path')

const HOST = process.env.PI_HOST || '192.168.1.109'
const USER = process.env.PI_USER || 'guizz'
const PATH = process.env.PI_PATH || '/home/guizz/progetti/Guiver'

console.log(`Deploying to ${USER}@${HOST}:${PATH}`)

const cmd = [
  `cd '${PATH}'`,
  'git fetch origin',
  'git reset --hard origin/main',
  'npm install',
  'sudo systemctl restart guiver',
].join(' && ')

execSync(`ssh "${USER}@${HOST}" "${cmd}"`, { stdio: 'inherit' })

console.log('Deploy complete!')
