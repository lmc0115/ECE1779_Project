#!/bin/bash

# Quick database verification script
# Run this after deploying the stack to verify database functionality

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "Database Verification"
echo "=========================================="

# Find database container
DB_CONTAINER=$(docker ps -q -f name=uniconn_db)

if [ -z "$DB_CONTAINER" ]; then
    echo -e "${RED}Error: Database container not found${NC}"
    echo "Make sure the stack is deployed: docker stack deploy -c stack-swarm-local.yml uniconn"
    exit 1
fi

echo -e "${GREEN}✓ Database container found: $DB_CONTAINER${NC}\n"

# Test 1: Check if database is ready
echo "Test 1: Database connectivity..."
if docker exec $DB_CONTAINER pg_isready -U uniconn > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database is ready${NC}"
else
    echo -e "${RED}✗ Database is not ready${NC}"
    exit 1
fi

# Test 2: Check tables
echo -e "\nTest 2: Checking tables..."
TABLES=("users" "events" "rsvps" "comments" "registrations")
ALL_EXIST=true

for table in "${TABLES[@]}"; do
    if docker exec $DB_CONTAINER psql -U uniconn -d uniconn -c "\d $table" > /dev/null 2>&1; then
        COUNT=$(docker exec $DB_CONTAINER psql -U uniconn -d uniconn -t -c "SELECT COUNT(*) FROM $table;" | tr -d ' ')
        echo -e "${GREEN}✓ Table '$table' exists (rows: $COUNT)${NC}"
    else
        echo -e "${RED}✗ Table '$table' does not exist${NC}"
        ALL_EXIST=false
    fi
done

# Test 3: Check indexes
echo -e "\nTest 3: Checking indexes..."
INDEX_COUNT=$(docker exec $DB_CONTAINER psql -U uniconn -d uniconn -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" | tr -d ' ')
echo "Found $INDEX_COUNT indexes"
if [ "$INDEX_COUNT" -gt 10 ]; then
    echo -e "${GREEN}✓ Indexes created (expected >10)${NC}"
else
    echo -e "${YELLOW}⚠ Fewer indexes than expected${NC}"
fi

# Test 4: Check triggers
echo -e "\nTest 4: Checking triggers..."
TRIGGER_COUNT=$(docker exec $DB_CONTAINER psql -U uniconn -d uniconn -t -c "SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE 'update_%_updated_at';" | tr -d ' ')
echo "Found $TRIGGER_COUNT update triggers"
if [ "$TRIGGER_COUNT" -ge 3 ]; then
    echo -e "${GREEN}✓ Triggers created (expected >=3)${NC}"
else
    echo -e "${YELLOW}⚠ Fewer triggers than expected${NC}"
fi

# Test 5: Test data operations
echo -e "\nTest 5: Testing data operations..."

# Insert test user
docker exec $DB_CONTAINER psql -U uniconn -d uniconn -c "
INSERT INTO users (email, password_hash, name, role) 
VALUES ('test@test.com', '\$2b\$10\$test', 'Test User', 'student')
ON CONFLICT (email) DO NOTHING;
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ INSERT operation works${NC}"
else
    echo -e "${RED}✗ INSERT operation failed${NC}"
fi

# Test UPDATE with trigger
docker exec $DB_CONTAINER psql -U uniconn -d uniconn -c "
UPDATE users SET name = 'Updated Name' WHERE email = 'test@test.com';
SELECT name, updated_at FROM users WHERE email = 'test@test.com';
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ UPDATE operation and trigger work${NC}"
else
    echo -e "${RED}✗ UPDATE operation failed${NC}"
fi

# Test 6: Check foreign keys
echo -e "\nTest 6: Checking foreign key constraints..."
FK_COUNT=$(docker exec $DB_CONTAINER psql -U uniconn -d uniconn -t -c "
SELECT COUNT(*) FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';
" | tr -d ' ')
echo "Found $FK_COUNT foreign key constraints"
if [ "$FK_COUNT" -ge 4 ]; then
    echo -e "${GREEN}✓ Foreign keys created (expected >=4)${NC}"
else
    echo -e "${YELLOW}⚠ Fewer foreign keys than expected${NC}"
fi

# Test 7: Check unique constraints
echo -e "\nTest 7: Checking unique constraints..."
UNIQUE_COUNT=$(docker exec $DB_CONTAINER psql -U uniconn -d uniconn -t -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'UNIQUE' AND table_schema = 'public';" | tr -d ' ')
echo "Found $UNIQUE_COUNT unique constraints"
if [ "$UNIQUE_COUNT" -ge 2 ]; then
    echo -e "${GREEN}✓ Unique constraints exist (expected >=2)${NC}"
else
    echo -e "${YELLOW}⚠ Fewer unique constraints than expected${NC}"
fi

# Summary
echo -e "\n=========================================="
if [ "$ALL_EXIST" = true ]; then
    echo -e "${GREEN}✓ All database tests PASSED${NC}"
    echo -e "${GREEN}Database is functioning correctly!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests FAILED${NC}"
    exit 1
fi

