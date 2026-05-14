# GITHUB + SUPABASE INTEGRATION SETUP

## 1. GITHUB SETUP

### Repository Info
- URL: https://github.com/anssgnt/vitecbt.git
- Branch: main
- Status: Connected

### Push Security Fixes
```bash
cd C:\laragon\www\examkita
git add SECURITY_*.md
git commit -m "docs: add comprehensive security audit (20 vulnerabilities found)"
git push origin main
```

## 2. SUPABASE INTEGRATION

### Current Issues
- API keys exposed in client code
- No Row-Level Security (RLS)
- Direct database access from frontend

### Required Actions

#### Step 1: Rotate API Keys (URGENT)
1. Go to: https://app.supabase.com
2. Project: dmydinmosdxazypdwbed
3. Settings > API
4. Regenerate anon key
5. Update environment variables

#### Step 2: Create .env.local
```
VITE_SUPABASE_URL=https://dmydinmosdxazypdwbed.supabase.co
VITE_SUPABASE_ANON_KEY=<NEW_KEY_HERE>
VITE_SUPABASE_SERVICE_KEY=<SERVICE_KEY>
```

#### Step 3: Setup RLS Policies
```sql
-- Enable RLS on all tables
ALTER TABLE soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE kunci ENABLE ROW LEVEL SECURITY;
ALTER TABLE peserta ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal ENABLE ROW LEVEL SECURITY;
ALTER TABLE hasil ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Students can only view their own results"
  ON hasil FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all data"
  ON hasil FOR SELECT
  USING (auth.jwt() ->> ''role'' = ''admin'');
```

## 3. GITHUB ACTIONS WORKFLOW

Create: .github/workflows/security-deploy.yml

```yaml
name: Security Fixes Deploy

on:
  push:
    branches: [main]
    paths:
      - "src/**"
      - "admin*.js"
      - ".env*"

jobs:
  security-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Security Scan
        run: |
          npm install -g snyk
          snyk auth ${{ secrets.SNYK_TOKEN }}
          snyk test
      
      - name: Check for exposed secrets
        run: |
          npm install -g detect-secrets
          detect-secrets scan
      
      - name: Deploy to Supabase
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: |
          npm run build
          npm run deploy:supabase
```

## 4. ENVIRONMENT VARIABLES

Add to GitHub Secrets:
1. SUPABASE_URL
2. SUPABASE_ANON_KEY (NEW - rotated)
3. SUPABASE_SERVICE_KEY
4. ADMIN_PASSWORD_HASH
5. JWT_SECRET

## 5. DEPLOYMENT CHECKLIST

- [ ] Rotate Supabase API keys
- [ ] Create .env.local with new keys
- [ ] Setup RLS policies in Supabase
- [ ] Add GitHub Secrets
- [ ] Create GitHub Actions workflow
- [ ] Test in staging
- [ ] Deploy to production
- [ ] Verify security fixes
- [ ] Monitor for issues

## 6. QUICK START COMMANDS

```bash
# 1. Add security docs to git
git add SECURITY_*.md
git commit -m "docs: security audit report"

# 2. Create feature branch for fixes
git checkout -b security/critical-fixes

# 3. Push to GitHub
git push origin security/critical-fixes

# 4. Create Pull Request
# Go to: https://github.com/anssgnt/vitecbt/pulls
# Create PR from security/critical-fixes to main

# 5. After review and merge
git checkout main
git pull origin main
```

## 7. SUPABASE CLI SETUP

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref dmydinmosdxazypdwbed

# Pull schema
supabase db pull

# Apply migrations
supabase db push
```

## 8. MONITORING & ALERTS

Setup GitHub branch protection:
1. Go to: Settings > Branches
2. Add rule for "main"
3. Require:
   - Pull request reviews (2)
   - Status checks to pass
   - Dismiss stale reviews
   - Require branches to be up to date

## 9. NEXT STEPS

1. Rotate API keys immediately
2. Push security docs to GitHub
3. Create feature branch for fixes
4. Setup GitHub Actions
5. Deploy to staging
6. Test thoroughly
7. Deploy to production
8. Monitor for issues
