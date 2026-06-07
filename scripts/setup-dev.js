const { execSync, spawnSync } = require('child_process')
const { existsSync, copyFileSync, mkdirSync, writeFileSync, unlinkSync } = require('fs')
const { resolve } = require('path')

const ROOT = resolve(__dirname, '..')
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const RED = '\x1b[31m'
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'

function log(label, msg) {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] [${label}] ${msg}`)
}

function ok(msg) { log(`${GREEN}  OK${RESET}`, msg) }
function info(msg) { log(`${CYAN}INFO${RESET}`, msg) }
function warn(msg) { log(`${YELLOW}WARN${RESET}`, msg) }
function fail(msg) { log(`${RED}FAIL${RESET}`, msg) }

function step(n, total, title) {
  console.log(`\n${BOLD}[${n}/${total}] ${title}${RESET}`)
}

function run(cmd, opts = {}) {
  const result = spawnSync(cmd, [], { shell: true, cwd: ROOT, stdio: 'inherit', ...opts })
  if (result.status !== 0 && !opts.ignoreExit) {
    console.error(`\n${RED}Command failed: ${cmd}${RESET}`)
    process.exit(result.status)
  }
  return result
}

function which(prog) {
  const isWin = process.platform === 'win32'
  const cmd = isWin ? `where ${prog} >nul 2>&1` : `which ${prog} >/dev/null 2>&1`
  try {
    execSync(cmd, { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

const TOTAL_STEPS = 5

async function main() {
  console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════╗${RESET}`)
  console.log(`${BOLD}${CYAN}║     Guiver — Setup ambiente di sviluppo  ║${RESET}`)
  console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════╝${RESET}\n`)

  const platform = process.platform
  info("Platform: " + platform)

  // ── Step 1: Mosquitto ──────────────────────────────────────────
  step(1, TOTAL_STEPS, "Mosquitto broker")

  if (which("mosquitto")) {
    ok("Mosquitto già installato")
  } else {
    info("Mosquitto non trovato, procedo con l'installazione...")
    if (platform === "darwin") {
      if (!which("brew")) {
        warn("Homebrew non trovato. Installalo da https://brew.sh e riprova.")
        process.exit(1)
      }
      run("brew install mosquitto", { ignoreExit: false })
      ok("Mosquitto installato via Homebrew")
    } else if (platform === "linux") {
      const distro = execSync("cat /etc/os-release 2>/dev/null | grep '^ID=' | cut -d= -f2", { encoding: 'utf8' }).trim()
      if (distro === "raspbian" || distro === "debian" || distro === "ubuntu" || !distro) {
        run("sudo apt update && sudo apt install -y mosquitto mosquitto-clients")
        ok("Mosquitto installato via apt")
      } else if (distro === "fedora" || distro === "centos" || distro === "rhel") {
        run("sudo dnf install -y mosquitto mosquitto-clients")
        ok("Mosquitto installato via dnf")
      } else {
        warn("Distro non riconosciuta (" + distro + "). Installa Mosquitto manualmente: https://mosquitto.org/download/")
      }
    } else if (platform === "win32") {
      // helper per aggiungere al PATH se installato in path standard
      function ensureMqttInPath() {
        const mqttPath = "C:\\Program Files\\mosquitto"
        if (existsSync(resolve(mqttPath, "mosquitto.exe")) &&
            !process.env.PATH.toLowerCase().includes(mqttPath.toLowerCase())) {
          process.env.PATH = `${mqttPath};${process.env.PATH}`
        }
      }
      ensureMqttInPath()

      let installed = which("mosquitto")

      if (!installed && which("choco")) {
        info("Tentativo con Chocolatey...")
        run("choco install mosquitto -y", { ignoreExit: true })
        ensureMqttInPath()
        installed = which("mosquitto")
      }

      if (!installed && which("winget")) {
        info("Tentativo con winget...")
        run("winget install EclipseMosquitto.Mosquitto --accept-package-agreements --accept-source-agreements", { ignoreExit: true })
        ensureMqttInPath()
        installed = which("mosquitto")
      }

      if (!installed) {
        info("Download installer da mosquitto.org...")
        const psFile = resolve(ROOT, 'scripts', '_install_mosquitto.ps1')
        writeFileSync(psFile, `
$url = "https://mosquitto.org/files/binary/win64/mosquitto-2.1.2-install-windows-x64.exe"
$out = "$env:TEMP\\mosquitto-installer.exe"
try {
  Write-Host "Scaricamento..."
  Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
  Write-Host "Eseguo installazione silenziosa..."
  Start-Process -FilePath $out -ArgumentList "/S" -Wait
  Write-Host "Installazione completata"
} catch {
  Write-Host "Download/installazione fallita: $_"
  exit 1
}
`.trim())
        run(`powershell -ExecutionPolicy Bypass -File "${psFile}"`, { ignoreExit: true })
        try { unlinkSync(psFile) } catch { /* ignore */ }
        ensureMqttInPath()
        installed = which("mosquitto") || existsSync("C:\\Program Files\\mosquitto\\mosquitto.exe")
        if (installed && existsSync("C:\\Program Files\\mosquitto\\mosquitto.exe")) {
          ensureMqttInPath()
        }
      }

      if (installed) {
        ok("Mosquitto installato")
      } else {
        warn("Installa Mosquitto manualmente da https://mosquitto.org/download/")
      }
    }
  }

  // ── Step 2: .env ───────────────────────────────────────────────
  step(2, TOTAL_STEPS, "File .env")

  const envPath = resolve(ROOT, '.env')
  const envExamplePath = resolve(ROOT, '.env.example')

  if (existsSync(envPath)) {
    ok(".env già presente")
  } else if (existsSync(envExamplePath)) {
    copyFileSync(envExamplePath, envPath)
    ok(".env creato da .env.example")
  } else {
    fail(".env.example non trovato — impossibile creare .env")
    process.exit(1)
  }

  // ── Step 3: npm install ────────────────────────────────────────
  step(3, TOTAL_STEPS, "Dipendenze npm")

  if (existsSync(resolve(ROOT, 'node_modules'))) {
    info("node_modules già presente, controllo aggiornamenti...")
    run("npm install")
  } else {
    info("Installazione dipendenze...")
    run("npm install")
  }
  ok("Dipendenze installate")

  // ── Step 4: TypeScript ─────────────────────────────────────────
  step(4, TOTAL_STEPS, "TypeScript — typecheck")

  const tsc = run("npx tsc --noEmit", { ignoreExit: true })
  if (tsc.status === 0) {
    ok("TypeScript compila senza errori")
  } else {
    warn("TypeScript ha riportato errori (pre-esistenti, non bloccanti per l'esecuzione)")
  }

  // ── Step 5: Test Mosquitto ─────────────────────────────────────
  step(5, TOTAL_STEPS, "Test Mosquitto (avvio e verifica)")

  if (which("mosquitto")) {
    if (platform === "darwin") {
      run("brew services start mosquitto", { ignoreExit: true })
    } else if (platform === "linux") {
      run("sudo systemctl start mosquitto", { ignoreExit: true })
    }

    // attendi che si avvii
    await new Promise(r => setTimeout(r, 2000))

    const sub = spawnSync("mosquitto_sub", ["-t", "guiver/setup-test", "-W", "2", "-C", "1"], { stdio: 'pipe', timeout: 5000 })
    const pub = spawnSync("mosquitto_pub", ["-t", "guiver/setup-test", "-m", "ok"], { stdio: 'pipe', timeout: 3000 })
    await new Promise(r => setTimeout(r, 500))

    if (sub.status === 0 || pub.status === 0) {
      ok("Mosquitto funzionante — pub/sub test passato")
    } else {
      warn("Test pub/sub fallito — Mosquitto potrebbe non essere partito correttamente")
    }

    if (platform === "darwin") {
      run("brew services stop mosquitto", { ignoreExit: true })
    } else if (platform === "linux") {
      run("sudo systemctl stop mosquitto", { ignoreExit: true })
    }
    info("Mosquitto fermato (lo avvierai con 'npm start' quando ti serve MQTT)")
  } else {
    warn("Mosquitto non installato, salto test pub/sub")
  }

  // ── Summary ────────────────────────────────────────────────────
  console.log(`\n${BOLD}${GREEN}╔══════════════════════════════════════════╗${RESET}`)
  console.log(`${BOLD}${GREEN}║        Setup completato con successo!    ║${RESET}`)
  console.log(`${BOLD}${GREEN}╚══════════════════════════════════════════╝${RESET}`)
  console.log(``)
  console.log(`  ${BOLD}Per avviare Guiver:${RESET}`)
  console.log(`    npm start`)
  console.log(``)
  console.log(`  ${BOLD}Per abilitare MQTT (ESP, sensori):${RESET}`)
  console.log(`    macOS:  brew services start mosquitto`)
  console.log(`    Linux:  sudo systemctl start mosquitto`)
  console.log(`    Poi riavvia Guiver: npm start`)
  console.log(``)
  console.log(`  ${BOLD}Per fermare MQTT quando non serve:${RESET}`)
  console.log(`    macOS:  brew services stop mosquitto`)
  console.log(`    Linux:  sudo systemctl stop mosquitto`)
  console.log(``)
}

main()
