const { execSync } = require('child_process')
const { resolve } = require('path')

require('dotenv/config')

const HOST = process.env.HOST || '192.168.1.109'
const USER = process.env.USER || 'guizz'
const REMOTE_PATH = process.env.REMOTE_PATH || '/home/guizz/progetti/Guiver'

console.log(`Deploying to ${USER}@${HOST}:${REMOTE_PATH}`)

const cmd = [
  `cd '${REMOTE_PATH}'`,
  'git fetch origin',
  'git reset --hard origin/main',
  'npm install',
  'sudo systemctl restart guiver',
].join(' && ')

execSync(`ssh -tt "${USER}@${HOST}" "${cmd}"`, { stdio: 'inherit' })

console.log('Deploy complete!')
