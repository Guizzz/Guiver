#!/bin/bash
set -e

PI_HOST="${PI_HOST:-192.168.1.109}"
PI_USER="${PI_USER:-pi}"
PI_PATH="${PI_PATH:-/home/pi/guiver}"

echo "=== Setting up Guiver on Raspberry Pi ==="
echo ""

# 1. Check SSH access
echo "[1/5] Testing SSH connection..."
ssh -o BatchMode=yes "$PI_USER@$PI_HOST" "echo OK" || {
    echo "SSH access failed. Make sure your public key is in $PI_USER@$PI_HOST:~/.ssh/authorized_keys"
    echo "Run: ssh-copy-id $PI_USER@$PI_HOST"
    exit 1
}

# 2. Clone repo if not present
echo "[2/5] Ensuring repo is cloned..."
ssh "$PI_USER@$PI_HOST" "
    if [ ! -d '$PI_PATH' ]; then
        git clone https://github.com/Guizzz/Guiver.git '$PI_PATH'
    fi
"

# 3. Install deps
echo "[3/5] Installing npm dependencies..."
ssh "$PI_USER@$PI_HOST" "cd '$PI_PATH' && npm install"

# 4. Create .env from example
echo "[4/5] Setting up .env..."
ssh "$PI_USER@$PI_HOST" "
    if [ ! -f '$PI_PATH/.env' ]; then
        cp '$PI_PATH/.env.example' '$PI_PATH/.env'
        echo '>>> .env created from .env.example — edit it with your values!'
    fi
"

# 5. Install PM2 and start
echo "[5/5] Starting with PM2..."
ssh "$PI_USER@$PI_HOST" "
    npm install -g pm2 2>/dev/null
    cd '$PI_PATH'
    pm2 start npm --name guiver -- start 2>/dev/null || pm2 restart guiver --update-env
    pm2 save
"

echo ""
echo "=== Setup complete! ==="
echo "Check status: pm2 status"
echo "View logs:    pm2 logs guiver"
