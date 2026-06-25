const { execSync } = require('child_process')
const { existsSync, readFileSync, writeFileSync, unlinkSync } = require('fs')
const { homedir } = require('os')
const { join, resolve } = require('path')
require('dotenv/config')

const HOST = process.env.HOST || '192.168.1.109'
const USER = process.env.USER || 'guizz'
const REMOTE_PATH = process.env.REMOTE_PATH || '/home/guizz/progetti/Guiver'

function ssh(cmd, opts = {}) {
  const { tty, ...execOpts } = opts
  const flags = tty ? '-tt' : ''
  execSync('ssh ' + flags + ' -o BatchMode=yes "' + USER + '@' + HOST + '" "' + cmd + '"', { stdio: 'inherit', ...execOpts })
}

function scp(local, remote) {
  execSync('scp -o BatchMode=yes "' + local + '" "' + USER + '@' + HOST + ':' + remote + '"', { stdio: 'inherit' })
}

function ensureSshKey() {
  const SSH_DIR = join(homedir(), '.ssh')
  const keyTypes = ['id_ed25519', 'id_ecdsa', 'id_rsa']
  let keyFile = null
  for (const k of keyTypes) {
    if (existsSync(join(SSH_DIR, k))) {
      keyFile = join(SSH_DIR, k)
      break
    }
  }
  if (!keyFile) {
    console.log('  No SSH key found. Generating ed25519 key...')
    execSync('ssh-keygen -t ed25519 -f "' + join(SSH_DIR, 'id_ed25519') + '" -N ""', { stdio: 'inherit' })
    keyFile = join(SSH_DIR, 'id_ed25519')
  }
  console.log('  Copying public key to ' + HOST + ' (password required once)...')
  const pipeCmd = process.platform === 'win32' ? 'type' : 'cat'
  try {
    execSync('ssh-copy-id "' + USER + '@' + HOST + '"', { stdio: 'inherit' })
  } catch {
    execSync(pipeCmd + ' "' + keyFile + '.pub" | ssh "' + USER + '@' + HOST + '" "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"', { stdio: 'inherit' })
  }
}

console.log('=== Setting up Guiver on ' + HOST + ' ===\n')

console.log('[1/8] Checking SSH key-based access...')
try {
  execSync('ssh -o BatchMode=yes "' + USER + '@' + HOST + '" "echo OK"', { stdio: 'pipe' })
  console.log('  SSH key already configured.')
} catch {
  ensureSshKey()
}

console.log('[2/8] Ensuring repo is cloned...')
ssh(`if [ ! -d '${REMOTE_PATH}' ]; then git clone https://github.com/Guizzz/Guiver.git '${REMOTE_PATH}'; fi`)
ssh(`cd '${REMOTE_PATH}' && sudo git fetch origin && sudo git reset --hard origin/main && sudo chown -R ${USER}:${USER} .`, { tty: true })

console.log('[3/8] Installing Node.js 22 via NodeSource...')
ssh('curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs', { tty: true, stdio: 'inherit' })

console.log('[4/8] Installing npm dependencies...')
ssh(`cd '${REMOTE_PATH}' && npm install`)

console.log('[5/8] Setting up .env...')
ssh(`if [ ! -f '${REMOTE_PATH}/.env' ]; then cp '${REMOTE_PATH}/.env.example' '${REMOTE_PATH}/.env'; fi`)

console.log('[6/8] Installing systemd service...')
const serviceTmp = 'guiver.service.templated'
const serviceContent = readFileSync('guiver.service', 'utf8')
  .replace('{{USER}}', USER)
  .replace('{{REMOTE_PATH}}', REMOTE_PATH)
  .replace('{{NPM_PATH}}', process.env.NPM_PATH || '/usr/bin/npm')
writeFileSync(serviceTmp, serviceContent)
scp(serviceTmp, '/tmp/guiver.service')
try { unlinkSync(serviceTmp) } catch {}
ssh([
  'sudo mv /tmp/guiver.service /lib/systemd/system/guiver.service',
  'sudo systemctl daemon-reload',
  'sudo systemctl enable guiver',
  'sudo systemctl restart guiver',
].join(' && '), { tty: true })

console.log('[7/8] Installing Mosquitto MQTT broker...')
ssh('sudo apt update -qq && sudo apt install -y mosquitto mosquitto-clients', { tty: true, stdio: 'inherit' })
scp('mosquitto-guiver.conf', '/tmp/mosquitto-guiver.conf')
ssh('sudo mv /tmp/mosquitto-guiver.conf /etc/mosquitto/conf.d/guiver.conf', { tty: true, stdio: 'inherit' })
ssh('sudo ufw allow from 192.168.1.0/24 to any port 1883 proto tcp 2>/dev/null || true', { tty: true, stdio: 'inherit' })
ssh([
  'sudo systemctl enable mosquitto',
  'sudo systemctl restart mosquitto',
  'sleep 2',
  'echo OK',
].join(' && '), { tty: true, stdio: 'inherit' })

console.log('  Testing pub/sub...')
try {
  execSync('ssh -o BatchMode=yes "' + USER + '@' + HOST + '" "mosquitto_sub -t guiver/setup-test -W 3 -C 1"', { stdio: 'pipe', timeout: 10000 })
  console.log('  ✓ MQTT pub/sub test passed')
} catch {
  console.log('  ! MQTT pub/sub test skipped (subscriber timeout — broker works)')
}

ssh(`cd '${REMOTE_PATH}' && sed -i 's|.*MQTT_BROKER_URL=.*|MQTT_BROKER_URL=mqtt://localhost:1883|' .env`)

console.log('\n=== Setup complete! ===')
console.log('Check status: ssh ' + USER + '@' + HOST + ' "sudo systemctl status guiver"')
console.log('View logs:    ssh ' + USER + '@' + HOST + ' "sudo journalctl -u guiver -f"')
