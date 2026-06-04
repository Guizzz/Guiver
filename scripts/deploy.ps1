param(
    [string]$PI_HOST = "192.168.1.109",
    [string]$PI_USER = "guizz",
    [string]$PI_PATH = "/home/guizz/progetti/Guiver"
)

Write-Host "Deploying to ${PI_USER}@${PI_HOST}:${PI_PATH}"

ssh "${PI_USER}@${PI_HOST}" "cd '${PI_PATH}' && git pull && npm install && sudo systemctl restart guiver"

Write-Host "Deploy complete!"
