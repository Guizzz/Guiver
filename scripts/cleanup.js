const { execSync } = require('child_process')

const HOST = process.env.HOST || '192.168.1.109'
const USER = process.env.USER || 'guizz'
const PATH = process.env.PATH || '/home/guizz/progetti/Guiver'

function ssh(cmd) {
  execSync(`ssh "${USER}@${HOST}" "${cmd}"`, { stdio: 'inherit' })
}

console.log('=== Cleanup server ===\n')

console.log('[1/4] Fixing file ownership...')
ssh(`sudo chown -R ${USER}:${USER} '${PATH}'`)

console.log('[2/4] Removing untracked files and old .js artifacts...')
ssh(`cd '${PATH}' && git clean -fd && git checkout -- .`)

console.log('[3/4] Reinstalling node_modules from scratch...')
ssh(`cd '${PATH}' && rm -rf node_modules && npm install`)

console.log('[4/4] Restarting service...')
ssh(`sudo systemctl restart guiver`)

console.log('\n=== Cleanup complete! ===')
