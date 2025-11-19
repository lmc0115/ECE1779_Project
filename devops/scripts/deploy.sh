#!/bin/bash

set -e

echo "Starting UniConn deployment"

PROJECT_ROOT="/home/uniconn/uniconn-deploy/ECE1779_PROJECT"

cd $PROJECT_ROOT

echo "Building backend Docker image..."
docker build -f uniconn-backend/backend/Dockerfile -t uniconn-api:latest uniconn-backend

echo "Ensuring traefik-public network exists..."
docker network create --driver=overlay traefik-public || true

echo "Deploying Traefik stack..."
docker stack deploy -c devops/docker/swarm/traefik-stack.yml traefik

sleep 5

# Load environment variables from .env
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo "Loading environment variables from .env..."
    set -a
    source $PROJECT_ROOT/.env
    set +a
else
    echo ".env file NOT FOUND. Deployment cancelled."
    exit 1
fi

echo "Deploying UniConn API and database..."
docker stack deploy -c devops/docker/swarm/docker-stack.yaml uniconn

echo "Waiting for services to initialize..."
sleep 8

echo "Service status:"
docker service ls

echo ""
echo "Deployment finished."
echo "You can test the API using: http://143.198.39.167/api/health"
echo "Traefik dashboard is available at: http://143.198.39.167:8080"
