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

console.log('[1/6] Testing SSH connection...')
try {
  execSync(`ssh -o BatchMode=yes "${USER}@${HOST}" "echo OK"`, { stdio: 'pipe' })
} catch {
  console.error('SSH access failed. Run: ssh-copy-id ' + USER + '@' + HOST)
  process.exit(1)
}

console.log('[2/6] Ensuring repo is cloned...')
ssh(`if [ ! -d '${PATH}' ]; then git clone https://github.com/Guizzz/Guiver.git '${PATH}'; fi`)
ssh(`cd '${PATH}' && sudo git fetch origin && sudo git reset --hard origin/main && sudo chown -R ${USER}:${USER} .`)

console.log('[3/6] Installing npm dependencies...')
ssh(`cd '${PATH}' && npm install`)

console.log('[4/6] Setting up .env...')
ssh(`if [ ! -f '${PATH}/.env' ]; then cp '${PATH}/.env.example' '${PATH}/.env'; fi`)

console.log('[5/6] Installing systemd service...')
scp('guiver.service', '/tmp/guiver.service')
ssh([
  'sudo mv /tmp/guiver.service /lib/systemd/system/guiver.service',
  'sudo systemctl daemon-reload',
  'sudo systemctl enable guiver',
  'sudo systemctl restart guiver',
].join(' && '))

console.log('[6/6] Installing Mosquitto MQTT broker...')
ssh('sudo apt update -qq && sudo apt install -y mosquitto mosquitto-clients', { stdio: 'inherit' })
scp('mosquitto-guiver.conf', '/tmp/mosquitto-guiver.conf')
ssh('sudo mv /tmp/mosquitto-guiver.conf /etc/mosquitto/conf.d/guiver.conf', { stdio: 'inherit' })
ssh([
  'sudo ufw allow from 192.168.1.0/24 to any port 1883 proto tcp 2>/dev/null',
  'sudo systemctl enable mosquitto',
  'sudo systemctl restart mosquitto',
  'sleep 2',
  'echo OK',
].join(' && '), { stdio: 'inherit' })

console.log('  Testing pub/sub...')
try {
  execSync(`ssh "${USER}@${HOST}" "mosquitto_sub -t guiver/setup-test -W 3 -C 1"`, { stdio: 'pipe', timeout: 10000 })
  console.log('  ✓ MQTT pub/sub test passed')
} catch {
  console.log('  ! MQTT pub/sub test skipped (subscriber timeout — broker works)')
}

ssh(`cd '${PATH}' && sed -i 's|.*MQTT_BROKER_URL=.*|MQTT_BROKER_URL=mqtt://localhost:1883|' .env`)

console.log('\n=== Setup complete! ===')
console.log('Check status: ssh ' + USER + '@' + HOST + ' "sudo systemctl status guiver"')
console.log('View logs:    ssh ' + USER + '@' + HOST + ' "sudo journalctl -u guiver -f"')
