const { execSync } = require('child_process')
const { resolve } = require('path')

const HOST = process.env.PI_HOST || '192.168.1.109'
const USER = process.env.PI_USER || 'guizz'
const PATH = process.env.PI_PATH || '/home/guizz/progetti/Guiver'

function ssh(cmd, opts = {}) {
  execSync(`ssh "${USER}@${HOST}" "${cmd}"`, { stdio: 'inherit', ...opts })
}

function scp(local, remote) {
  execSync(`scp "${local}" "${USER}@${HOST}:${remote}"`, { stdio: 'inherit' })
}

console.log('=== Setting up Guiver on Raspberry Pi ===\n')

console.log('[1/5] Testing SSH connection...')
try {
  execSync(`ssh -o BatchMode=yes "${USER}@${HOST}" "echo OK"`, { stdio: 'pipe' })
} catch {
  console.error('SSH access failed. Run: ssh-copy-id ' + USER + '@' + HOST)
  process.exit(1)
}

console.log('[2/5] Ensuring repo is cloned...')
ssh(`if [ ! -d '${PATH}' ]; then git clone https://github.com/Guizzz/Guiver.git '${PATH}'; fi`)
ssh(`cd '${PATH}' && git fetch origin && git reset --hard origin/main`)

console.log('[3/5] Installing npm dependencies...')
ssh(`cd '${PATH}' && npm install`)

console.log('[4/5] Setting up .env...')
ssh(`if [ ! -f '${PATH}/.env' ]; then cp '${PATH}/.env.example' '${PATH}/.env'; fi`)

console.log('[5/5] Installing systemd service...')
scp('guiver.service', '/tmp/guiver.service')
ssh([
  'sudo mv /tmp/guiver.service /lib/systemd/system/guiver.service',
  'sudo systemctl daemon-reload',
  'sudo systemctl enable guiver',
  'sudo systemctl restart guiver',
].join(' && '))

console.log('\n=== Setup complete! ===')
console.log('Check status: ssh ' + USER + '@' + HOST + ' "sudo systemctl status guiver"')
console.log('View logs:    ssh ' + USER + '@' + HOST + ' "sudo journalctl -u guiver -f"')
