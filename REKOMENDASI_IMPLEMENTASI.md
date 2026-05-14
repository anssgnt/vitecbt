# REKOMENDASI IMPLEMENTASI & ROADMAP

## 1. SECURITY HARDENING (URGENT - Week 1-2)

### A. Implement JWT Verification

**File**: `supabase/functions/_shared/supabase.ts`

```typescript
import { jwtVerify } from "https://deno.land/x/jose@v5.4.1/index.ts";

const SECRET = new TextEncoder().encode(Deno.env.get("JWT_SECRET") || "");

export async function verifyJWT(token: string) {
  try {
    const verified = await jwtVerify(token, SECRET);
    return verified.payload;
  } catch (error) {
    throw new Error("Invalid JWT token");
  }
}
```

**Update semua Edge Functions**:
- `get_exam_package/index.ts`
- `submit_exam/index.ts`
- `admin_summary/index.ts`
- `admin_broadcast/index.ts`
- `admin_laporan/index.ts`
- `admin_remedial/index.ts`
- `log_violation/index.ts`

### B. Hash Admin Password

**File**: `supabase/functions/_shared/supabase.ts`

```typescript
import { compare, hash } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

export async function hashPassword(password: string) {
  return await hash(password);
}

export async function verifyPassword(password: string, hash: string) {
  return await compare(password, hash);
}

export async function verifyAdmin(supabase, adminPass: string) {
  const { data, error } = await supabase
    .from("config")
    .select("value")
    .eq("key", "admin_pass_hash")
    .maybeSingle();
  
  if (error || !data) return false;
  const hash = data.value?.hash || data.value;
  return await verifyPassword(adminPass, hash);
}
```

### C. Implement Supabase RLS Policies

**SQL Migration**:

```sql
-- Enable RLS
ALTER TABLE hasil ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_ujian ENABLE ROW LEVEL SECURITY;
ALTER TABLE soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE peserta ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_status ENABLE ROW LEVEL SECURITY;

-- Policies untuk hasil (hanya bisa lihat hasil sendiri)
CREATE POLICY "Users can view own results"
  ON hasil FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Admin can view all results"
  ON hasil FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Policies untuk soal (public read, admin write)
CREATE POLICY "Anyone can read questions"
  ON soal FOR SELECT
  USING (true);

CREATE POLICY "Only admin can write questions"
  ON soal FOR INSERT
  USING (auth.jwt() ->> 'role' = 'admin');
```

### D. Encrypt Sensitive Data

**Frontend**: Encrypt answers before sending

```javascript
import { encrypt, decrypt } from "./crypto-utils.js";

const encryptedAnswers = await encrypt(answers, encryptionKey);
await submitExam({
  ...payload,
  answers: encryptedAnswers,
  encrypted: true
});
```

**Backend**: Decrypt and store

```typescript
const decrypted = payload.encrypted 
  ? await decrypt(payload.answers, decryptionKey)
  : payload.answers;
```

---

## 2. PERFORMANCE OPTIMIZATION (Week 2-3)

### A. Implement Redis Caching

**Setup Upstash Redis** (free tier: 10,000 commands/day)

```typescript
import { Redis } from "https://deno.land/x/upstash_redis@v1.25.0/mod.ts";

const redis = new Redis({
  url: Deno.env.get("UPSTASH_REDIS_REST_URL"),
  token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN"),
});

// Cache exam package
const cacheKey = `exam:${examId}:v${version}`;
let examData = await redis.get(cacheKey);

if (!examData) {
  examData = await fetchExamData(examId);
  await redis.setex(cacheKey, 3600, JSON.stringify(examData));
}
```

### B. Compress Media

**Setup Cloudinary** (free tier: 25GB storage)

```javascript
// Upload soal images ke Cloudinary
const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'examkita');
  
  const response = await fetch(
    'https://api.cloudinary.com/v1_1/YOUR_CLOUD/image/upload',
    { method: 'POST', body: formData }
  );
  
  return response.json();
};
```

### C. Batch Realtime Updates

```typescript
// Instead of sending individual updates
// Batch updates every 5 seconds

const updateQueue = [];
let batchTimer = null;

function queueUpdate(update) {
  updateQueue.push(update);
  
  if (!batchTimer) {
    batchTimer = setTimeout(async () => {
      await supabase
        .from('online_status')
        .upsert(updateQueue);
      updateQueue = [];
      batchTimer = null;
    }, 5000);
  }
}
```

---

## 3. TESTING & CI/CD (Week 3-4)

### A. Setup GitHub Actions

**File**: `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### B. Add Unit Tests

**File**: `src/__tests__/submit-exam.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import { isCorrect } from '../exam-core.js';

describe('Exam Scoring', () => {
  it('should score PG correctly', () => {
    expect(isCorrect('PG', 'A', 'A')).toBe(true);
    expect(isCorrect('PG', 'B', 'A')).toBe(false);
  });

  it('should score KOMPLEKS correctly', () => {
    expect(isCorrect('KOMPLEKS', ['A', 'B'], 'A,B')).toBe(true);
    expect(isCorrect('KOMPLEKS', ['A'], 'A,B')).toBe(false);
  });

  it('should score ISIAN case-insensitive', () => {
    expect(isCorrect('ISIAN', 'Jakarta', 'jakarta')).toBe(true);
  });
});
```

### C. Load Testing

**File**: `scripts/load-test.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 900 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  const response = http.post(
    'https://your-domain.com/api/get_exam_package',
    JSON.stringify({ examId: 'exam-1', token: 'token-123' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

---

## 4. MONITORING & LOGGING (Week 4)

### A. Setup Sentry

**Frontend**:

```javascript
import * as Sentry from "https://cdn.jsdelivr.net/npm/@sentry/browser@7/+esm";

Sentry.init({
  dsn: "https://YOUR_KEY@sentry.io/PROJECT_ID",
  environment: "production",
  tracesSampleRate: 0.1,
});

window.addEventListener('error', (event) => {
  Sentry.captureException(event.error);
});
```

**Backend**:

```typescript
import * as Sentry from "https://deno.land/x/sentry@8.0.0/mod.ts";

Sentry.init({
  dsn: Deno.env.get("SENTRY_DSN"),
  environment: "production",
});

try {
  // ... code ...
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

### B. Setup Logging

**Backend**: Structured logging

```typescript
interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  context: Record<string, unknown>;
}

function log(level: string, message: string, context = {}) {
  const entry: LogEntry = {
    timestamp: Date.now(),
    level: level as any,
    message,
    context,
  };
  
  console.log(JSON.stringify(entry));
  
  // Send to Supabase logs table
  await supabase.from('logs').insert(entry);
}
```

---

## 5. DATABASE IMPROVEMENTS (Week 5)

### A. Add Constraints

```sql
-- Foreign keys
ALTER TABLE hasil
ADD CONSTRAINT fk_hasil_jadwal
FOREIGN KEY (exam_id) REFERENCES jadwal_ujian(id);

ALTER TABLE soal
ADD CONSTRAINT fk_soal_bank
FOREIGN KEY (bank_id) REFERENCES bank_soal(id);

-- Unique constraints
ALTER TABLE hasil
ADD CONSTRAINT unique_exam_user
UNIQUE (exam_id, user_id);

-- Check constraints
ALTER TABLE hasil
ADD CONSTRAINT check_score
CHECK (skor >= 0 AND skor <= 100);
```

### B. Add Audit Trail

```sql
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_by TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_table ON audit_log(table_name, record_id);
```

### C. Add Soft Delete

```sql
ALTER TABLE peserta ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE jadwal_ujian ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE soal ADD COLUMN deleted_at TIMESTAMP;

-- Update queries to filter deleted records
SELECT * FROM peserta WHERE deleted_at IS NULL;
```

---

## 6. FRONTEND MODERNIZATION (Month 2)

### A. Migrate to Vue 3

**Setup**:

```bash
npm create vite@latest examkita-vue -- --template vue
cd examkita-vue
npm install
```

**Example Component**:

```vue
<template>
  <div class="exam-container">
    <ExamHeader :title="exam.nama" :timer="timer" />
    <QuestionView :question="currentQuestion" v-model="answers" />
    <ExamFooter @next="nextQuestion" @submit="submitExam" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useExamStore } from '@/stores/exam';

const store = useExamStore();
const answers = ref({});

const currentQuestion = computed(() => 
  store.questions[store.currentIndex]
);

const nextQuestion = () => {
  store.currentIndex++;
};

const submitExam = async () => {
  await store.submitExam(answers.value);
};
</script>
```

### B. Add Input Validation

```javascript
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const ExamPayloadSchema = z.object({
  examId: z.string().min(1),
  userId: z.string().min(1),
  answers: z.record(z.any()),
  usedTime: z.number().positive(),
  violations: z.number().nonnegative(),
});

const payload = ExamPayloadSchema.parse(req.body);
```

---

## 7. DEPLOYMENT STRATEGY

### Phase 1: Staging (Week 1)
- Deploy to Netlify staging branch
- Test with 100 concurrent users
- Verify all security measures

### Phase 2: Beta (Week 2)
- Deploy to production with feature flag
- Enable for 10% of users
- Monitor metrics

### Phase 3: Full Rollout (Week 3)
- Enable for all users
- Monitor 24/7
- Have rollback plan ready

---

## 8. COST OPTIMIZATION

### Current (Gratis):
- Netlify Free: 125K functions/month
- Supabase Free: 2GB bandwidth/month
- **Problem**: Will exceed limits

### Optimized (Gratis):
- Compress images aggressively
- Cache soal di browser (IndexedDB)
- Batch API calls
- Use Supabase caching
- **Result**: Can handle 900 siswa

### Recommended (Pro):
- Netlify Pro: $19/month
- Supabase Pro: $25/month
- Upstash Redis: $0 (free tier)
- Cloudinary: $0 (free tier)
- **Total**: $44/month

---

## TIMELINE

```
Week 1-2: Security Hardening
  - JWT verification
  - Password hashing
  - RLS policies
  - Data encryption

Week 2-3: Performance
  - Redis caching
  - Media compression
  - Batch updates

Week 3-4: Testing & CI/CD
  - GitHub Actions
  - Unit tests
  - Load testing

Week 4: Monitoring
  - Sentry setup
  - Logging
  - Alerts

Week 5: Database
  - Constraints
  - Audit trail
  - Soft delete

Month 2: Frontend
  - Vue 3 migration
  - Input validation
  - Error handling

Month 3: Production
  - Staging deployment
  - Beta testing
  - Full rollout
```

---

## RESOURCES

- Supabase Docs: https://supabase.com/docs
- Netlify Docs: https://docs.netlify.com
- Deno Docs: https://deno.land/manual
- Vue 3 Docs: https://vuejs.org
- Sentry Docs: https://docs.sentry.io
- K6 Load Testing: https://k6.io/docs
