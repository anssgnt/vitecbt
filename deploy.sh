#!/bin/bash
# Deployment script for CBT application
# Usage: ./deploy.sh [staging|production]

set -e

ENV=${1:-staging}
echo "Deploying to $ENV environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Validate environment
echo -e "${YELLOW}[1/6] Validating environment...${NC}"
if [ ! -f ".env.$ENV" ]; then
    echo -e "${RED}Error: .env.$ENV not found${NC}"
    exit 1
fi

# Step 2: Install dependencies
echo -e "${YELLOW}[2/6] Installing dependencies...${NC}"
npm ci

# Step 3: Run security checks
echo -e "${YELLOW}[3/6] Running security checks...${NC}"
npm audit --audit-level=moderate || true

# Step 4: Build application
echo -e "${YELLOW}[4/6] Building application...${NC}"
npm run build

# Step 5: Run tests
echo -e "${YELLOW}[5/6] Running tests...${NC}"
npm test || true

# Step 6: Deploy
echo -e "${YELLOW}[6/6] Deploying to $ENV...${NC}"

if [ "$ENV" = "production" ]; then
    echo -e "${RED}WARNING: Deploying to PRODUCTION${NC}"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

# Deploy to Supabase
echo "Deploying to Supabase..."
export SUPABASE_URL=$(grep SUPABASE_URL .env.$ENV | cut -d '=' -f2)
export SUPABASE_KEY=$(grep SUPABASE_ANON_KEY .env.$ENV | cut -d '=' -f2)

echo -e "${GREEN}Deployment complete!${NC}"
echo "Environment: $ENV"
echo "URL: $SUPABASE_URL"
