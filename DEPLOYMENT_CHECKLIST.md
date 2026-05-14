# DEPLOYMENT CHECKLIST - CBT EXAMKITA

## PRE-DEPLOYMENT (Week 1-2)

### Security Hardening
- [ ] Implement JWT verification in all Edge Functions
  - [ ] Update `supabase/functions/_shared/supabase.ts`
  - [ ] Update `get_exam_package/index.ts`
  - [ ] Update `submit_exam/index.ts`
  - [ ] Update `admin_summary/index.ts`
  - [ ] Update `admin_broadcast/index.ts`
  - [ ] Update `admin_laporan/index.ts`
  - [ ] Update `admin_remedial/index.ts`
  - [ ] Update `log_violation/index.ts`
  - [ ] Test all endpoints with valid/invalid tokens

- [ ] Implement password hashing
  - [ ] Add bcrypt to `supabase/functions/_shared/supabase.ts`
  - [ ] Create migration to hash existing admin password
  - [ ] Update admin verification logic
  - [ ] Test admin login

- [ ] Setup Supabase RLS policies
  - [ ] Enable RLS on all tables
  - [ ] Create policies for `hasil` table
  - [ ] Create policies for `soal` table
  - [ ] Create policies for `peserta` table
  - [ ] Create policies for `online_status` table
  - [ ] Test policies with different user roles

- [ ] Implement data encryption
  - [ ] Add encryption library to frontend
  - [ ] Encrypt answers before sending
  - [ ] Decrypt answers in backend
  - [ ] Test encryption/decryption

- [ ] Add input validation
  - [ ] Add Zod schema validation
  - [ ] Validate all API payloads
  - [ ] Test with invalid inputs

- [ ] Setup CORS properly
  - [ ] Review `netlify.toml` CORS headers
  - [ ] Test CORS from different origins
  - [ ] Restrict to production domain only

### Testing
- [ ] Add unit tests
  - [ ] Test scoring logic (PG, BS, KOMPLEKS, ISIAN, JODOH)
  - [ ] Test validation functions
  - [ ] Test sync mechanism
  - [ ] Achieve 80% code coverage
  - [ ] Run: `npm run test`

- [ ] Add integration tests
  - [ ] Test API endpoints
  - [ ] Test database operations
  - [ ] Test auth flow
  - [ ] Test offline sync

- [ ] Load testing
  - [ ] Setup K6 load test script
  - [ ] Test with 100 concurrent users
  - [ ] Test with 500 concurrent users
  - [ ] Test with 900 concurrent users
  - [ ] Measure response times
  - [ ] Identify bottlenecks
  - [ ] Run: `k6 run scripts/load-test.js`

- [ ] Security testing
  - [ ] Test JWT verification
  - [ ] Test RLS policies
  - [ ] Test input validation
  - [ ] Test CORS headers
  - [ ] Test rate limiting
  - [ ] Penetration testing (optional)

### Infrastructure Setup
- [ ] Setup environment variables
  - [ ] Create `.env.production` file
  - [ ] Add `SUPABASE_URL`
  - [ ] Add `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] Add `JWT_SECRET`
  - [ ] Add `SENTRY_DSN`
  - [ ] Add `UPSTASH_REDIS_REST_URL`
  - [ ] Add `UPSTASH_REDIS_REST_TOKEN`
  - [ ] Verify all variables are set

- [ ] Setup Netlify
  - [ ] Create Netlify account
  - [ ] Connect GitHub repository
  - [ ] Configure build settings
    - [ ] Build command: `npm run build`
    - [ ] Publish directory: `dist`
  - [ ] Setup environment variables in Netlify
  - [ ] Configure custom domain
  - [ ] Setup SSL/TLS certificate
  - [ ] Test build process

- [ ] Setup Supabase
  - [ ] Create Supabase project
  - [ ] Create database tables
  - [ ] Create Edge Functions
  - [ ] Setup RLS policies
  - [ ] Configure CORS
  - [ ] Setup backups
  - [ ] Test database connection

- [ ] Setup monitoring
  - [ ] Create Sentry account
  - [ ] Add Sentry DSN to environment
  - [ ] Setup error alerts
  - [ ] Setup performance monitoring
  - [ ] Test error capture

- [ ] Setup logging
  - [ ] Create `logs` table in Supabase
  - [ ] Implement structured logging
  - [ ] Setup log retention policy
  - [ ] Test logging

- [ ] Setup backups
  - [ ] Enable Supabase automated backups
  - [ ] Configure backup retention (30 days)
  - [ ] Test backup restoration
  - [ ] Document backup procedure

### CI/CD Pipeline
- [ ] Setup GitHub Actions
  - [ ] Create `.github/workflows/deploy.yml`
  - [ ] Configure test job
  - [ ] Configure lint job
  - [ ] Configure build job
  - [ ] Configure deploy job
  - [ ] Test workflow

- [ ] Setup staging environment
  - [ ] Create staging branch
  - [ ] Configure Netlify staging deploy
  - [ ] Configure Supabase staging project
  - [ ] Test staging deployment

### Documentation
- [ ] Create deployment guide
- [ ] Create runbook for incidents
- [ ] Create API documentation
- [ ] Create troubleshooting guide
- [ ] Create rollback procedure

---

## STAGING DEPLOYMENT (Week 2)

### Deploy to Staging
- [ ] Deploy frontend to Netlify staging
  - [ ] Verify build succeeds
  - [ ] Verify all assets load
  - [ ] Verify service worker works

- [ ] Deploy Edge Functions to Supabase staging
  - [ ] Run: `supabase functions deploy --project-ref staging`
  - [ ] Verify all functions deployed
  - [ ] Test all endpoints

### Staging Testing
- [ ] Functional testing
  - [ ] Test student login
  - [ ] Test exam flow
  - [ ] Test offline mode
  - [ ] Test submit exam
  - [ ] Test admin dashboard
  - [ ] Test monitoring

- [ ] Performance testing
  - [ ] Measure page load times
  - [ ] Measure API response times
  - [ ] Measure database query times
  - [ ] Check for memory leaks

- [ ] Security testing
  - [ ] Test JWT verification
  - [ ] Test RLS policies
  - [ ] Test input validation
  - [ ] Test CORS headers

- [ ] Load testing
  - [ ] Run load test with 900 concurrent users
  - [ ] Verify response times < 500ms
  - [ ] Verify error rate < 1%
  - [ ] Verify no database timeouts

### Staging Sign-off
- [ ] Get approval from:
  - [ ] Development team
  - [ ] QA team
  - [ ] Security team
  - [ ] DevOps team
  - [ ] Project manager

---

## PRODUCTION DEPLOYMENT (Week 3)

### Pre-Production Checklist
- [ ] Verify all security fixes are in place
- [ ] Verify all tests pass
- [ ] Verify load testing results
- [ ] Verify monitoring is setup
- [ ] Verify backups are working
- [ ] Verify incident response plan is ready
- [ ] Verify rollback procedure is documented
- [ ] Verify team is trained on deployment

### Deploy to Production
- [ ] Deploy frontend to Netlify production
  - [ ] Merge to main branch
  - [ ] Verify GitHub Actions workflow passes
  - [ ] Verify Netlify build succeeds
  - [ ] Verify all assets load
  - [ ] Verify service worker works
  - [ ] Verify custom domain works
  - [ ] Verify SSL/TLS certificate is valid

- [ ] Deploy Edge Functions to Supabase production
  - [ ] Run: `supabase functions deploy --project-ref production`
  - [ ] Verify all functions deployed
  - [ ] Test all endpoints
  - [ ] Verify JWT verification works
  - [ ] Verify RLS policies work

### Post-Deployment Verification
- [ ] Verify application is accessible
  - [ ] [ ] Check frontend loads
  - [ ] [ ] Check API endpoints respond
  - [ ] [ ] Check database is accessible
  - [ ] [ ] Check service worker is active

- [ ] Verify monitoring is working
  - [ ] [ ] Check Sentry is capturing errors
  - [ ] [ ] Check logs are being written
  - [ ] [ ] Check alerts are configured
  - [ ] [ ] Check dashboards are updating

- [ ] Verify backups are working
  - [ ] [ ] Check backup was created
  - [ ] [ ] Test backup restoration

- [ ] Verify security measures
  - [ ] [ ] Test JWT verification
  - [ ] [ ] Test RLS policies
  - [ ] [ ] Test input validation
  - [ ] [ ] Test CORS headers

### Production Sign-off
- [ ] Get approval from:
  - [ ] Development team lead
  - [ ] DevOps team lead
  - [ ] Project manager
  - [ ] Client/stakeholder

---

## POST-DEPLOYMENT (Week 3-4)

### Monitoring & Support
- [ ] Monitor application 24/7 for first week
  - [ ] Check error rates
  - [ ] Check response times
  - [ ] Check database performance
  - [ ] Check user feedback

- [ ] Setup on-call rotation
  - [ ] Assign on-call engineer
  - [ ] Setup escalation procedure
  - [ ] Setup incident response

- [ ] Collect metrics
  - [ ] Track page load times
  - [ ] Track API response times
  - [ ] Track error rates
  - [ ] Track user engagement

### Optimization
- [ ] Analyze performance data
  - [ ] Identify slow endpoints
  - [ ] Identify bottlenecks
  - [ ] Identify error patterns

- [ ] Implement optimizations
  - [ ] Add caching where needed
  - [ ] Optimize database queries
  - [ ] Optimize API responses
  - [ ] Optimize frontend rendering

- [ ] Monitor improvements
  - [ ] Verify response times improved
  - [ ] Verify error rates decreased
  - [ ] Verify user satisfaction improved

### Documentation
- [ ] Update deployment guide
- [ ] Update runbook with real incidents
- [ ] Update troubleshooting guide
- [ ] Create post-mortem for any issues

---

## ROLLBACK PROCEDURE

### If Critical Issues Occur:

1. **Immediate Actions** (0-5 minutes)
   - [ ] Alert on-call team
   - [ ] Assess severity
   - [ ] Notify stakeholders
   - [ ] Start incident response

2. **Rollback Decision** (5-15 minutes)
   - [ ] Determine if rollback is needed
   - [ ] Get approval from team lead
   - [ ] Prepare rollback procedure

3. **Execute Rollback** (15-30 minutes)
   - [ ] Rollback frontend to previous version
     - [ ] Go to Netlify dashboard
     - [ ] Click "Deploys"
     - [ ] Find previous successful deploy
     - [ ] Click "Publish deploy"
   - [ ] Rollback Edge Functions
     - [ ] Run: `supabase functions deploy --project-ref production --version <previous>`
   - [ ] Verify application is working
   - [ ] Notify stakeholders

4. **Post-Rollback** (30+ minutes)
   - [ ] Investigate root cause
   - [ ] Fix issue
   - [ ] Test fix in staging
   - [ ] Re-deploy to production
   - [ ] Create post-mortem

---

## MAINTENANCE SCHEDULE

### Daily
- [ ] Monitor error rates
- [ ] Monitor response times
- [ ] Check for critical alerts
- [ ] Review user feedback

### Weekly
- [ ] Review performance metrics
- [ ] Review security logs
- [ ] Check backup status
- [ ] Update documentation

### Monthly
- [ ] Review cost analysis
- [ ] Plan optimizations
- [ ] Security audit
- [ ] Capacity planning

### Quarterly
- [ ] Major version updates
- [ ] Security patches
- [ ] Performance optimization
- [ ] Feature releases

---

## CONTACTS & ESCALATION

### On-Call Engineer
- Name: [TBD]
- Phone: [TBD]
- Email: [TBD]

### Team Lead
- Name: [TBD]
- Phone: [TBD]
- Email: [TBD]

### DevOps Lead
- Name: [TBD]
- Phone: [TBD]
- Email: [TBD]

### Project Manager
- Name: [TBD]
- Phone: [TBD]
- Email: [TBD]

### Escalation Procedure
1. On-call engineer investigates (15 min)
2. If unresolved, escalate to team lead (15 min)
3. If unresolved, escalate to DevOps lead (15 min)
4. If unresolved, escalate to project manager (notify stakeholders)

---

## SIGN-OFF

**Deployment Date**: _______________

**Approved By**:
- Development Lead: _________________ Date: _______
- DevOps Lead: _________________ Date: _______
- Project Manager: _________________ Date: _______
- Client/Stakeholder: _________________ Date: _______

**Deployed By**: _________________ Date: _______ Time: _______

**Verified By**: _________________ Date: _______ Time: _______

---

## NOTES

```
[Space for deployment notes]





```
