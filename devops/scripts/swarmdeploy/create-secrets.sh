#!/bin/bash
# =============================================================================
# Create Docker Secrets for UniConn
# Run this ONCE before deploying
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}  Create Docker Secrets for UniConn${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""

# Check if swarm is active
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
    echo -e "${RED}ERROR: Docker Swarm is not active${NC}"
    exit 1
fi

# Function to create or update a secret
create_secret() {
    local name=$1
    local value=$2
    
    # Remove existing secret if exists
    docker secret rm "$name" 2>/dev/null || true
    
    # Create new secret
    echo -n "$value" | docker secret create "$name" -
    echo -e "  ${GREEN}✓${NC} $name"
}

echo -e "${YELLOW}Enter your configuration values:${NC}"
echo ""

# Database name
read -p "POSTGRES_DB [uniconn]: " POSTGRES_DB
POSTGRES_DB=${POSTGRES_DB:-uniconn}

# Database user
read -p "POSTGRES_USER [uniconn]: " POSTGRES_USER
POSTGRES_USER=${POSTGRES_USER:-uniconn}

# Database password (hidden)
read -sp "POSTGRES_PASSWORD: " POSTGRES_PASSWORD
echo ""

# JWT Secret (hidden)
read -sp "JWT_SECRET: " JWT_SECRET
echo ""

# SendGrid API Key (optional, hidden)
read -sp "SENDGRID_API_KEY (press Enter to skip): " SENDGRID_API_KEY
echo ""

echo ""
echo -e "${YELLOW}Creating secrets...${NC}"

create_secret "uniconn_postgres_db" "$POSTGRES_DB"
create_secret "uniconn_postgres_user" "$POSTGRES_USER"
create_secret "uniconn_postgres_password" "$POSTGRES_PASSWORD"
create_secret "uniconn_jwt_secret" "$JWT_SECRET"

if [ -n "$SENDGRID_API_KEY" ]; then
    create_secret "uniconn_sendgrid_api_key" "$SENDGRID_API_KEY"
else
    # Create empty secret to avoid deployment errors
    create_secret "uniconn_sendgrid_api_key" ""
fi

echo ""
echo -e "${GREEN}✓ All secrets created successfully!${NC}"
echo ""
echo "Secrets created:"
docker secret ls | grep uniconn
echo ""
echo -e "${YELLOW}Next: Run ./redeploy.sh to deploy${NC}"
echo ""

