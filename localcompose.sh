# Secure local bring-up for API + Postgres using .env for credentials
set -euo pipefail

# Load .env if present (exports variables into the shell)
if [ -f .env ]; then
  set -a
  # shellcheck source=/dev/null
  source .env
  set +a
fi

# Defaults if not provided in .env
POSTGRES_USER="${POSTGRES_USER:-uniconn}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-localpassword}"
POSTGRES_DB="${POSTGRES_DB:-uniconn}"

echo "Building backend Docker image (tag: uniconn-api:local)..."
docker build -t uniconn-api:local ./uniconn-backend/backend

echo "Starting local environment (docker-compose.local.yaml)..."
docker compose -f docker-compose.local.yaml up --build -d

# Wait for Postgres to be healthy
echo "Waiting for Postgres to become healthy..."
for i in {1..20}; do
  if docker compose -f docker-compose.local.yaml exec -T db \
    pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -h db >/dev/null 2>&1; then
    echo "Postgres is ready."
    break
  fi
  sleep 2
done

# Optional: run migrations (schema is already auto-loaded via initdb hook)
# Uncomment if you need to re-apply schema manually
# echo "Running migrations..."
# docker compose -f docker-compose.local.yaml exec -T db \
#   psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -f /docker-entrypoint-initdb.d/schema.sql

echo "Local environment started."
echo "API:      http://localhost:8080"
echo "Postgres: localhost:5432 (user=${POSTGRES_USER}, db=${POSTGRES_DB})"