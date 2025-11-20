#!/bin/bash
set -e

echo "=============================="
echo "   Starting UniConn deployment"
echo "=============================="

PROJECT_ROOT="/home/uniconn/uniconn-deploy/ECE1779_PROJECT"
cd $PROJECT_ROOT

# 1. Load environment as early as possible
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo "Loading environment variables..."
    set -a
    source $PROJECT_ROOT/.env
    set +a
else
    echo "ERROR: .env NOT FOUND — stopping."
    exit 1
fi

# 2. Build the backend
echo "Building backend image..."
docker build -f uniconn-backend/backend/Dockerfile \
    -t uniconn-api:latest \
    uniconn-backend

echo "Tagging image..."
docker tag uniconn-api:latest 143.198.39.167:5000/uniconn-api:latest

echo "Pushing to registry..."
docker push 143.198.39.167:5000/uniconn-api:latest

# 3. Create network
echo "Ensuring traefik-public network..."
docker network create --driver=overlay traefik-public || true

# 4. Deploy traefik
echo "Deploying traefik..."
docker stack deploy -c devops/docker/swarm/traefik-stack.yml traefik

sleep 5

# 5. Deploy UniConn
echo "Deploying uniconn backend + DB..."
docker stack deploy -c devops/docker/swarm/docker-stack.yaml uniconn

sleep 8
docker service ls

echo "Done!"
