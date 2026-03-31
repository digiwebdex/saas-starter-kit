#!/bin/bash
# ══════════════════════════════════════════════════
# VPS Deployment Script for Skyline Travel SaaS
# Run on your Hostinger VPS
# ══════════════════════════════════════════════════

set -e

APP_DIR="/var/www/skyline-frontend"
BACKEND_DIR="/var/www/skyline-backend"

echo "═══ Step 1: Check available ports ═══"
echo "Checking commonly used ports..."
for port in 3000 4000 4173 5000 8080; do
  if ss -tlnp | grep -q ":${port} "; then
    echo "  ❌ Port $port — IN USE ($(ss -tlnp | grep ":${port} " | awk '{print $NF}'))"
  else
    echo "  ✅ Port $port — AVAILABLE"
  fi
done
echo ""
echo "Recommended setup:"
echo "  Frontend (static via Nginx) → port 80/443"
echo "  Backend API (Node.js)       → first available port above (e.g. 4000)"
echo ""

echo "═══ Step 2: Install dependencies ═══"
# Install Node.js 20 if not present
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
  sudo apt-get update
  sudo apt-get install -y nginx
fi

echo "═══ Step 3: Build frontend ═══"
cd "$APP_DIR"
npm install
cp .env.example .env.production
echo "⚠️  Edit .env.production with your actual domain before building!"
echo "   nano $APP_DIR/.env.production"
echo ""
npm run build
echo "Frontend built to $APP_DIR/dist"

echo "═══ Step 4: Start backend with PM2 ═══"
cd "$BACKEND_DIR"
npm install
pm2 start npm --name "skyline-api" -- start
pm2 save
pm2 startup

echo ""
echo "═══ Done! ═══"
echo "Next steps:"
echo "1. Edit .env.production with your domain"
echo "2. Run: cd $APP_DIR && npm run build"
echo "3. Copy nginx config: sudo cp $APP_DIR/nginx.conf /etc/nginx/sites-available/skyline"
echo "4. Enable: sudo ln -s /etc/nginx/sites-available/skyline /etc/nginx/sites-enabled/"
echo "5. Test: sudo nginx -t"
echo "6. Reload: sudo systemctl reload nginx"
echo "7. SSL: sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com -d '*.yourdomain.com'"
