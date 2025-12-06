#!/bin/bash
# =============================================================================
# UniConn Full Redeployment Script (IP-based, No Domain Required)
# Run this after migration or for any full redeployment
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}  UniConn Full Redeployment Script${NC}"
echo -e "${CYAN}  (IP-based - No Domain Required)${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""

# =============================================================================
# Configuration
# =============================================================================
PROJECT_DIR="/home/uniconn/uniconn-deploy/ECE1779_PROJECT"
REGISTRY="143.198.39.167:5000"
IMAGE_NAME="uniconn-api"
VOLUME_PATH="/mnt/volume_uniconn_01"

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

# =============================================================================
# Pre-flight checks
# =============================================================================
echo -e "${YELLOW}Step 1: Pre-flight checks...${NC}"

# Check if running as root or with docker permissions
if ! docker info &>/dev/null; then
    echo -e "${RED}ERROR: Cannot connect to Docker. Run as root or add user to docker group.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is accessible${NC}"

# Check if swarm is initialized
if ! docker info | grep -q "Swarm: active"; then
    echo -e "${RED}ERROR: Docker Swarm is not active. Initialize with: docker swarm init${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Swarm is active${NC}"

# Check if volume is mounted
if ! mountpoint -q "$VOLUME_PATH" 2>/dev/null; then
    echo -e "${RED}ERROR: Volume not mounted at $VOLUME_PATH${NC}"
    echo "Run the migration script first or mount the volume manually."
    exit 1
fi
echo -e "${GREEN}✓ Volume is mounted${NC}"

# Check project directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}ERROR: Project directory not found: $PROJECT_DIR${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Project directory exists${NC}"

# Check if secrets exist
SECRETS_COUNT=$(docker secret ls | grep -c "uniconn_" || echo "0")
if [ "$SECRETS_COUNT" -lt 5 ]; then
    echo -e "${RED}ERROR: Docker secrets not found!${NC}"
    echo "Run create-secrets.sh first:"
    echo "  cd $PROJECT_DIR/devops/scripts/swarmdeploy"
    echo "  ./create-secrets.sh"
    exit 1
fi
echo -e "${GREEN}✓ Docker secrets exist ($SECRETS_COUNT found)${NC}"

# =============================================================================
# Step 2: Fix volume permissions
# =============================================================================
echo ""
echo -e "${YELLOW}Step 2: Fixing volume permissions...${NC}"
chown -R 999:999 "$VOLUME_PATH/postgresql/data" 2>/dev/null || true
chmod 700 "$VOLUME_PATH/postgresql/data" 2>/dev/null || true
echo -e "${GREEN}✓ Permissions fixed${NC}"

# =============================================================================
# Step 3: Build and push Docker image
# =============================================================================
echo ""
echo -e "${YELLOW}Step 3: Building Docker image...${NC}"
cd "$PROJECT_DIR"
docker build -t "${REGISTRY}/${IMAGE_NAME}:latest" ./uniconn-backend/backend

echo ""
echo -e "${YELLOW}Step 4: Pushing image to registry...${NC}"
docker push "${REGISTRY}/${IMAGE_NAME}:latest"
echo -e "${GREEN}✓ Image pushed to registry${NC}"

# =============================================================================
# Step 5: Stop existing stacks
# =============================================================================
echo ""
echo -e "${YELLOW}Step 5: Stopping existing stacks...${NC}"

docker stack rm monitoring 2>/dev/null || true
docker stack rm uniconn 2>/dev/null || true
echo "Waiting for stacks to stop..."
sleep 10

# Wait until services are fully removed
while docker service ls 2>/dev/null | grep -q "uniconn_\|monitoring_"; do
    echo "  Still stopping services..."
    sleep 5
done

docker stack rm traefik 2>/dev/null || true
echo "Waiting for traefik stack to stop..."
sleep 5

echo -e "${GREEN}✓ Stacks stopped${NC}"

# =============================================================================
# Step 6: Create network if not exists
# =============================================================================
echo ""
echo -e "${YELLOW}Step 6: Ensuring networks exist...${NC}"

docker network create --driver overlay traefik-public 2>/dev/null || true
echo -e "${GREEN}✓ Networks ready${NC}"

# =============================================================================
# Step 7: Deploy Traefik (HTTP mode for IP-based access)
# =============================================================================
echo ""
echo -e "${YELLOW}Step 7: Deploying Traefik (HTTP mode)...${NC}"
cd "$PROJECT_DIR/devops/docker/swarm"

docker stack deploy -c traefik.yaml traefik

echo "Waiting for Traefik to start..."
sleep 10

# Check Traefik is running
if docker service ls | grep -q "traefik_traefik"; then
    echo -e "${GREEN}✓ Traefik deployed${NC}"
else
    echo -e "${RED}WARNING: Traefik may not have started correctly${NC}"
fi

# =============================================================================
# Step 8: Deploy UniConn application (with secrets)
# =============================================================================
echo ""
echo -e "${YELLOW}Step 8: Deploying UniConn application...${NC}"

docker stack deploy -c uniconn.yaml uniconn

echo "Waiting for services to start..."
sleep 20

echo -e "${GREEN}✓ UniConn deployed${NC}"

# =============================================================================
# Step 9: Deploy Monitoring (Prometheus + Grafana)
# =============================================================================
echo ""
echo -e "${YELLOW}Step 9: Deploying Monitoring stack...${NC}"

docker stack deploy -c monitoring/monitoring-stack.yaml monitoring

echo "Waiting for monitoring to start..."
sleep 10

if docker service ls | grep -q "monitoring_prometheus"; then
    echo -e "${GREEN}✓ Monitoring deployed${NC}"
else
    echo -e "${YELLOW}⚠ Monitoring may still be starting${NC}"
fi

# =============================================================================
# Step 10: Verification
# =============================================================================
echo ""
echo -e "${YELLOW}Step 10: Verifying deployment...${NC}"
echo ""

# Show services
echo -e "${CYAN}Current services:${NC}"
docker service ls

echo ""

# Check each service
echo -e "${CYAN}Service status:${NC}"

# Traefik
if docker service ls | grep -q "traefik_traefik.*1/1"; then
    echo -e "  Traefik:     ${GREEN}✓ Running${NC}"
else
    echo -e "  Traefik:     ${YELLOW}⏳ Starting...${NC}"
fi

# Database
if docker service ls | grep -q "uniconn_db.*1/1"; then
    echo -e "  Database:    ${GREEN}✓ Running${NC}"
else
    echo -e "  Database:    ${YELLOW}⏳ Starting...${NC}"
fi

# API
API_STATUS=$(docker service ls | grep "uniconn_api" | awk '{print $4}')
echo -e "  API:         ${CYAN}${API_STATUS}${NC}"

# Monitoring
if docker service ls | grep -q "monitoring_prometheus.*1/1"; then
    echo -e "  Prometheus:  ${GREEN}✓ Running${NC}"
else
    echo -e "  Prometheus:  ${YELLOW}⏳ Starting...${NC}"
fi

if docker service ls | grep -q "monitoring_grafana.*1/1"; then
    echo -e "  Grafana:     ${GREEN}✓ Running${NC}"
else
    echo -e "  Grafana:     ${YELLOW}⏳ Starting...${NC}"
fi

# =============================================================================
# Step 11: Health check
# =============================================================================
echo ""
echo -e "${YELLOW}Step 11: Running health checks...${NC}"

# Wait a bit more for services to fully start
sleep 10

# Try health endpoint
echo -n "  API Health: "
for i in {1..10}; do
    HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null || echo "000")
    if [ "$HEALTH" = "200" ]; then
        echo -e "${GREEN}✓ Healthy (HTTP 200)${NC}"
        break
    else
        if [ $i -eq 10 ]; then
            echo -e "${YELLOW}⏳ Not ready yet (HTTP $HEALTH) - may still be starting${NC}"
        else
            sleep 5
        fi
    fi
done

# =============================================================================
# Summary
# =============================================================================
echo ""
echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}  Deployment Complete!${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""
echo -e "Access your app at:"
echo -e "  App:        ${GREEN}http://${SERVER_IP}${NC}"
echo -e "  API:        ${GREEN}http://${SERVER_IP}/api${NC}"
echo -e "  Health:     ${GREEN}http://${SERVER_IP}/api/health${NC}"
echo ""
echo -e "Dashboards:"
echo -e "  Traefik:    ${GREEN}http://${SERVER_IP}:8080${NC}"
echo -e "  Prometheus: ${GREEN}http://${SERVER_IP}:9090${NC}"
echo -e "  Grafana:    ${GREEN}http://${SERVER_IP}:3000${NC} (admin/admin)"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  docker service ls                        # List all services"
echo "  docker service logs uniconn_api -f       # API logs"
echo "  docker service logs uniconn_db -f        # Database logs"
echo "  docker service logs traefik_traefik -f   # Traefik logs"
echo "  docker service logs monitoring_prometheus -f  # Prometheus logs"
echo ""
echo -e "${YELLOW}If services are not ready, wait a minute and check:${NC}"
echo "  curl http://${SERVER_IP}/api/health"
echo ""

