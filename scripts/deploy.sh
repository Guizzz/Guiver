#!/bin/bash
set -e

PI_HOST="${PI_HOST:-192.168.1.109}"
PI_USER="${PI_USER:-pi}"
PI_PATH="${PI_PATH:-/home/pi/guiver}"

echo "Deploying to $PI_USER@$PI_HOST:$PI_PATH"

ssh "$PI_USER@$PI_HOST" "
    cd '$PI_PATH' &&
    git pull &&
    npm install &&
    pm2 restart guiver --update-env
"

echo "Deploy complete!"
