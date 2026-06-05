#!/bin/bash

# Exit on error
set -e

# Load env variables from packages/api/.env if it exists
if [ -f "packages/api/.env" ]; then
  # Read variables, ignoring comments and exporting them
  export $(grep -v '^#' packages/api/.env | xargs)
fi

# Extract DB_PORT from DATABASE_URL
# URL format: postgresql://username:password@host:port/database
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]\+\)\/.*/\1/p')
if [ -z "$DB_PORT" ]; then
  DB_PORT="5432"
fi
export DB_PORT

# Define ports to check dynamically from env if loaded, otherwise fallback
API_PORT="${PORT:-3001}"
CLIENT_PORT="5173"
if [ ! -z "$APP_URL" ]; then
  EXTRACTED_CLIENT_PORT=$(echo "$APP_URL" | sed -n 's/.*:\([0-9]\+\).*/\1/p')
  if [ ! -z "$EXTRACTED_CLIENT_PORT" ]; then
    CLIENT_PORT="$EXTRACTED_CLIENT_PORT"
  fi
fi

# Helper function to check if a port is in use (robust for non-root users when docker-proxy binds ports)
is_port_in_use() {
  local port=$1
  if command -v ss >/dev/null 2>&1; then
    [ ! -z "$(ss -tlnH sport = :$port 2>/dev/null)" ]
  else
    lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 || fuser $port/tcp >/dev/null 2>&1
  fi
}

echo "🔍 Memeriksa konflik port..."

# 1. Periksa port database
if is_port_in_use "$DB_PORT"; then
  # Cek apakah container fintr-db yang sedang berjalan di port ini
  is_fintr_db=$(docker ps --filter "name=fintr-db" --filter "publish=$DB_PORT" --format "{{.Names}}" || true)
  if [ -z "$is_fintr_db" ]; then
    echo "❌ KONFLIK PORT DATABASE: Port $DB_PORT sudah digunakan oleh proses lain atau container docker lain."
    echo "👉 Solusi: Ubah port di file 'packages/api/.env' pada bagian DATABASE_URL."
    echo "   Contoh: ganti 'localhost:5432' menjadi 'localhost:5433' (atau port bebas lainnya)."
    echo ""
    exit 1
  else
    echo "✅ Port $DB_PORT digunakan oleh container fintr-db Anda."
  fi
else
  echo "✅ Port $DB_PORT tersedia."
fi

# 2. Periksa port API dan Client
for port in "$API_PORT" "$CLIENT_PORT"; do
  if is_port_in_use "$port"; then
    # Cek apakah digunakan oleh Docker container
    docker_container=$(docker ps --filter "publish=$port" --format "{{.Names}}" || true)
    if [ ! -z "$docker_container" ]; then
      echo "❌ KONFLIK PORT: Port $port digunakan oleh Docker container: '$docker_container'."
      echo "   Silakan hentikan container tersebut atau ubah konfigurasi port aplikasi."
      exit 1
    fi

    # Jika itu proses lokal (non-docker), kita coba bersihkan jika itu sisa server sebelumnya
    pids=$(lsof -t -i :$port 2>/dev/null || fuser $port/tcp 2>/dev/null || true)
    if [ ! -z "$pids" ]; then
      echo "🧹 Menemukan proses lokal berjalan di port $port (PID: $pids). Membersihkan..."
      kill -9 $pids 2>/dev/null || true
    fi
  fi
done

echo "🐳 Memulai container PostgreSQL..."
# Menjalankan postgres container. docker compose up -d bersifat idempoten.
docker compose up -d postgres

# Menunggu Postgres siap menerima koneksi
echo "⏳ Menunggu PostgreSQL siap..."
until docker exec fintr-db pg_isready -U fintr >/dev/null 2>&1; do
  sleep 1
done
echo "✅ PostgreSQL siap digunakan."

# Menjalankan migrasi database
echo "⚙️ Menjalankan migrasi database..."
bun run db:migrate

# Seed data awal (opsional/jika belum di-seed)
echo "🌱 Menjalankan seeder..."
bun run db:seed || true

echo ""
echo "🚀 Memulai server development..."
echo "  - API berjalan pada http://localhost:$API_PORT"
echo "  - Client berjalan pada http://localhost:$CLIENT_PORT"
echo "  - Tekan [Ctrl+C] untuk menghentikan semua server secara bersih."
echo ""

# Menangkap sinyal Ctrl+C (SIGINT) dan mematikan semua background process secara bersih
trap 'echo -e "\n👋 Mematikan semua server..."; kill $(jobs -p) 2>/dev/null || true; exit 0' SIGINT SIGTERM

# Menjalankan API dan Client secara paralel di background
bun run dev:api &
bun run dev:client &

# Menunggu agar script terus berjalan sampai diterminasi
wait
