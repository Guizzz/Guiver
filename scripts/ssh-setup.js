const { execSync } = require('child_process')
const { existsSync, readFileSync } = require('fs')
const { homedir } = require('os')
const { join } = require('path')

require('dotenv/config')

const HOST = process.env.HOST || '192.168.1.109'
const USER = process.env.USER || 'guizz'
const SSH_DIR = join(homedir(), '.ssh')

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'inherit', ...opts })
}

function runCapture(cmd) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8' }).trim()
}

console.log('=== SSH Setup: PC -> server ===\n')

// 1. Find existing key
const keyTypes = ['id_ed25519', 'id_ecdsa', 'id_rsa']
let keyFile = null
for (const k of keyTypes) {
  if (existsSync(join(SSH_DIR, k))) {
    keyFile = join(SSH_DIR, k)
    break
  }
}

// 2. Generate if missing
if (!keyFile) {
  console.log('[1/2] No SSH key found. Generating ed25519 key...')
  run(`ssh-keygen -t ed25519 -f "${join(SSH_DIR, "id_ed25519")}" -N ""`)
  keyFile = join(SSH_DIR, 'id_ed25519')
  console.log('Key generated!\n')
} else {
  console.log(`[1/2] Using existing key: ${keyFile}`)
}

// 3. Copy public key to Pi
console.log(`\n[2/2] Copying public key to ${HOST}...`)
console.log(`You will be asked for the password of ${USER}@${HOST} (one time only)\n`)

const pipeCmd = process.platform === 'win32' ? 'type' : 'cat'
try {
  run(`ssh-copy-id "${USER}@${HOST}"`)
} catch {
  const pubKeyFile = keyFile + '.pub'
  run(`${pipeCmd} "${pubKeyFile}" | ssh "${USER}@${HOST}" "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"`)
}

// 4. Verify
console.log('\nVerifying passwordless access...')
try {
  run(`ssh -o BatchMode=yes "${USER}@${HOST}" "echo OK"`, { stdio: 'pipe' })
  console.log('\n✓ SSH key setup complete! You can now run: npm run setup')
} catch {
  console.error('\n✗ Something went wrong. Try manually:')
  console.error(`  type "${keyFile}.pub" | ssh ${USER}@${HOST} "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"`)
}
