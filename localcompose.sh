#Remember to switch to the project root

echo "Building backend Docker image..."
docker build -t uniconn-api:latest ./uniconn-backend/backend

echo "Starting local environment using docker-compose..."
docker compose up --build -d

echo "Local environment started."
echo "API is available at http://localhost:8080"

echo "Database Migration"
docker exec -i ece1779_project-db-1 psql -U uniconn_user -d uniconn < uniconn-backend/db/schema.sql

echo "The current status"
docker ps