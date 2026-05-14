# 🚀 GITHUB + SUPABASE INTEGRATION GUIDE

**Date:** 2026-05-14  
**Status:** Ready for Implementation

---

## 📋 QUICK START (5 minutes)

### Step 1: Rotate Supabase API Keys (URGENT)
```bash
# 1. Go to https://app.supabase.com
# 2. Select project: dmydinmosdxazypdwbed
# 3. Settings > API > Regenerate anon key
# 4. Copy new key
```

### Step 2: Setup Environment Variables
```bash
# Copy template
cp .env.example .env.local

# Edit .env.local with new values
# - VITE_SUPABASE_ANON_KEY (new key from step 1)
# - VITE_SUPABASE_SERVICE_KEY
# - VITE_JWT_SECRET
# - VITE_ADMIN_PASSWORD_HASH
```

### Step 3: Add GitHub Secrets
```bash
# Go to: https://github.com/anssgnt/vitecbt/settings/secrets/actions
# Add these secrets:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY (new key)
# - SUPABASE_SERVICE_KEY
# - SUPABASE_URL_STAGING
# - SUPABASE_ANON_KEY_STAGING
# - SUPABASE_SERVICE_KEY_STAGING
```

### Step 4: Push Security Fixes
```bash
cd C:\laragon\www\examkita
git add SECURITY_*.md GITHUB_SUPABASE_SETUP.md .env.example deploy.sh
git commit -m "security: add comprehensive security audit and deployment setup"
git push origin main
```

---

## 🔐 SECURITY FIXES IMPLEMENTATION

### Phase 1: Critical Fixes (This Week)

#### 1.1 Move API to Backend
```javascript
// BEFORE (INSECURE)
const response = await fetch(
  `${SUPABASE_CONFIG.url}/rest/v1/soal`,
  { headers: { apikey: SUPABASE_CONFIG.anonKey } }
);

// AFTER (SECURE)
const response = await fetch(
  `/api/soal`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

#### 1.2 Implement JWT Authentication
```javascript
// Create backend endpoint
POST /api/auth/login
{
  "username": "admin",
  "password": "hashed_password"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "...",
  "expiresIn": 1800
}
```

#### 1.3 Add Input Validation
```javascript
// Validate all user inputs
const validateQuestion = (question) => {
  if (!question.soal || question.soal.trim().length === 0) {
    throw new Error("Question text is required");
  }
  if (question.soal.length > 5000) {
    throw new Error("Question text too long");
  }
  // Sanitize HTML
  return sanitizeHTML(question.soal);
};
```

#### 1.4 Enforce HTTPS
```javascript
// Add to server config
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}
```

### Phase 2: High Priority Fixes (Next 2 Weeks)

#### 2.1 Implement CSP Headers
```javascript
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src ''self''; script-src ''self'' https://cdn.jsdelivr.net; style-src ''self'' https://fonts.googleapis.com"
  );
  next();
});
```

#### 2.2 Add CSRF Protection
```javascript
const csrf = require("csurf");
const csrfProtection = csrf({ cookie: false });

app.post("/api/exam/submit", csrfProtection, (req, res) => {
  // Handle submission
});
```

#### 2.3 Implement Rate Limiting
```javascript
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later"
});

app.use("/api/", limiter);
```

---

## 📊 GITHUB WORKFLOW

### Branch Strategy
```
main (production)
  ↑
  ├─ Pull Request (reviewed)
  ↑
develop (staging)
  ↑
  ├─ Feature branches
  ├─ security/critical-fixes
  ├─ security/high-priority
  └─ security/medium-priority
```

### Creating a Feature Branch
```bash
# Create branch
git checkout -b security/critical-fixes

# Make changes
# ... edit files ...

# Commit
git add .
git commit -m "security: implement JWT authentication"

# Push
git push origin security/critical-fixes

# Create Pull Request on GitHub
# https://github.com/anssgnt/vitecbt/pulls
```

### Pull Request Checklist
- [ ] Security fixes implemented
- [ ] Tests passing
- [ ] No exposed secrets
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Ready for merge

---

## 🚀 DEPLOYMENT PROCESS

### Staging Deployment
```bash
# Automatic on push to develop branch
# GitHub Actions will:
# 1. Run security scan
# 2. Build application
# 3. Run tests
# 4. Deploy to staging
# 5. Notify Slack
```

### Production Deployment
```bash
# Manual approval required
# 1. Create PR from develop to main
# 2. Get 2 approvals
# 3. Merge to main
# 4. GitHub Actions will:
#    - Run security scan
#    - Build application
#    - Run tests
#    - Deploy to production
#    - Notify Slack
```

---

## 🔍 MONITORING & ALERTS

### GitHub Branch Protection
```
Settings > Branches > Add rule
- Branch name pattern: main
- Require pull request reviews: 2
- Require status checks to pass
- Require branches to be up to date
- Dismiss stale reviews
```

### Slack Notifications
```
Add to GitHub Secrets:
- SLACK_WEBHOOK: https://hooks.slack.com/services/YOUR/WEBHOOK/URL

Notifications will be sent for:
- Deployment started
- Deployment completed
- Security scan failures
- Build failures
```

---

## 📝 SUPABASE SETUP

### Enable Row-Level Security (RLS)
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

CREATE POLICY "Teachers can view class results"
  ON hasil FOR SELECT
  USING (auth.jwt() ->> ''role'' = ''teacher'' AND kelas = auth.jwt() ->> ''kelas'');
```

### Create Service Role
```sql
-- Create service role for backend
CREATE ROLE service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
```

---

## ✅ VERIFICATION CHECKLIST

### Before Deployment
- [ ] All security fixes implemented
- [ ] Tests passing (npm test)
- [ ] No exposed secrets (npm audit)
- [ ] Security scan passed
- [ ] Code reviewed (2 approvals)
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] GitHub Secrets added
- [ ] Supabase RLS enabled
- [ ] Backup created

### After Deployment
- [ ] Application running
- [ ] API endpoints responding
- [ ] Authentication working
- [ ] Database queries working
- [ ] Logs showing no errors
- [ ] Monitoring alerts active
- [ ] Slack notifications working
- [ ] Performance acceptable

---

## 🆘 TROUBLESHOOTING

### GitHub Push Rejected
```bash
# Pull latest changes
git pull origin main

# Resolve conflicts
# ... edit files ...

# Commit and push
git add .
git commit -m "merge: resolve conflicts"
git push origin main
```

### Supabase Connection Failed
```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Test connection
curl -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  "$VITE_SUPABASE_URL/rest/v1/soal?limit=1"
```

### Deployment Failed
```bash
# Check GitHub Actions logs
# https://github.com/anssgnt/vitecbt/actions

# View recent deployments
git log --oneline -10

# Rollback if needed
git revert <commit-hash>
git push origin main
```

---

## 📞 SUPPORT

- GitHub Issues: https://github.com/anssgnt/vitecbt/issues
- Supabase Docs: https://supabase.com/docs
- Security Questions: security@example.com

---

**Last Updated:** 2026-05-14  
**Status:** Ready for Implementation
