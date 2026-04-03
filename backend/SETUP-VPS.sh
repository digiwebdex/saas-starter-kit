#!/bin/bash
# ══════════════════════════════════════════════════════════════
# Complete VPS Setup for Skyline Travel SaaS
# Run as root on your Hostinger VPS (187.77.144.38)
# ══════════════════════════════════════════════════════════════
set -e

echo "══════════════════════════════════════════════"
echo "  Skyline Travel SaaS — Full VPS Setup"
echo "══════════════════════════════════════════════"

# ── 1. Install PostgreSQL ──
echo "═══ Step 1: Installing PostgreSQL ═══"
if ! command -v psql &> /dev/null; then
  sudo apt-get update
  sudo apt-get install -y postgresql postgresql-contrib
fi
sudo systemctl enable postgresql
sudo systemctl start postgresql

# ── 2. Create database and user ──
echo "═══ Step 2: Setting up database ═══"
DB_PASSWORD=$(openssl rand -hex 16)
echo "Generated DB password: $DB_PASSWORD"

sudo -u postgres psql -c "CREATE USER skyline WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "CREATE DATABASE skyline_db OWNER skyline;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE skyline_db TO skyline;"

# ── 3. Install Node.js 20 ──
echo "═══ Step 3: Installing Node.js ═══"
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# ── 4. Install PM2 ──
echo "═══ Step 4: Installing PM2 ═══"
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
fi

# ── 5. Setup backend ──
echo "═══ Step 5: Setting up backend ═══"
BACKEND_DIR="/var/www/skyline-backend"

if [ ! -d "$BACKEND_DIR" ]; then
  echo "⚠️  Copy the skyline-backend folder to $BACKEND_DIR first!"
  echo "   scp -r skyline-backend/ root@187.77.144.38:/var/www/"
  exit 1
fi

cd "$BACKEND_DIR"

# Generate JWT secret
JWT_SECRET=$(openssl rand -hex 32)

# Create .env
cat > .env << ENVFILE
DATABASE_URL="postgresql://skyline:${DB_PASSWORD}@localhost:5432/skyline_db"
JWT_SECRET="${JWT_SECRET}"
PORT=4000
CORS_ORIGIN="https://travelagencyweb.com"
UPLOAD_DIR="/var/www/skyline-backend/uploads"
ENVFILE

echo "Created .env with generated credentials"

# Install and setup
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js

# Start with PM2
pm2 delete skyline-api 2>/dev/null || true
pm2 start src/index.js --name "skyline-api"
pm2 save
pm2 startup

# ── 6. Build frontend ──
echo "═══ Step 6: Building frontend ═══"
FRONTEND_DIR="/var/www/skyline-frontend"
cd "$FRONTEND_DIR"

cat > .env.production << ENVFILE
VITE_API_URL=https://api.travelagencyweb.com/api
VITE_APP_DOMAIN=travelagencyweb.com
ENVFILE

npm install
npm run build

# ── 7. Nginx ──
echo "═══ Step 7: Configuring Nginx ═══"
sudo cp "$FRONTEND_DIR/nginx.conf" /etc/nginx/sites-available/skyline
sudo ln -sf /etc/nginx/sites-available/skyline /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "══════════════════════════════════════════════"
echo "  ✅ Setup Complete!"
echo "══════════════════════════════════════════════"
echo ""
echo "  Frontend: https://travelagencyweb.com"
echo "  API:      https://api.travelagencyweb.com/api/health"
echo ""
echo "  Super Admin: admin@skyline.dev / admin123"
echo "  Demo User:   user@demo.com / demo123"
echo ""
echo "  DB Password: $DB_PASSWORD"
echo "  JWT Secret:  $JWT_SECRET"
echo ""
echo "  ⚠️  SAVE THESE CREDENTIALS SECURELY!"
echo "══════════════════════════════════════════════"
