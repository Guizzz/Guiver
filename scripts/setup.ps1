param(
    [string]$PI_HOST = "192.168.1.109",
    [string]$PI_USER = "guizz",
    [string]$PI_PATH = "/home/guizz/progetti/Guiver"
)

Write-Host "=== Setting up Guiver on Raspberry Pi ==="

Write-Host "[1/5] Testing SSH connection..."
ssh -o BatchMode=yes "${PI_USER}@${PI_HOST}" "echo OK" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "SSH access failed. Run: ssh-copy-id ${PI_USER}@${PI_HOST}"
    exit 1
}

Write-Host "[2/5] Ensuring repo is cloned..."
ssh "${PI_USER}@${PI_HOST}" "if [ ! -d '${PI_PATH}' ]; then git clone https://github.com/Guizzz/Guiver.git '${PI_PATH}'; fi"

Write-Host "[3/5] Installing npm dependencies..."
ssh "${PI_USER}@${PI_HOST}" "cd '${PI_PATH}' && npm install"

Write-Host "[4/5] Setting up .env..."
ssh "${PI_USER}@${PI_HOST}" "if [ ! -f '${PI_PATH}/.env' ]; then cp '${PI_PATH}/.env.example' '${PI_PATH}/.env'; echo '.env created from .env.example'; fi"

Write-Host "[5/5] Installing systemd service..."
scp guiver.service "${PI_USER}@${PI_HOST}:/tmp/guiver.service"
ssh "${PI_USER}@${PI_HOST}" "sudo mv /tmp/guiver.service /lib/systemd/system/guiver.service && sudo systemctl daemon-reload && sudo systemctl enable guiver && sudo systemctl restart guiver"

Write-Host ""
Write-Host "=== Setup complete! ==="
Write-Host "Check status: ssh ${PI_USER}@${PI_HOST} 'sudo systemctl status guiver'"
