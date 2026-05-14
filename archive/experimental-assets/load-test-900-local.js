const STUDENTS = Number(process.argv[2] || 900);
const SYNC_SPREAD_MS = Number(process.argv[3] || 120000);
const SUBMIT_SPREAD_MS = Number(process.argv[4] || 600000);
const QUESTIONS = Number(process.argv[5] || 50);

function rand(max) {
  return Math.floor(Math.random() * max);
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[index];
}

function bucketize(delays, bucketMs) {
  const buckets = new Map();
  for (const delay of delays) {
    const bucket = Math.floor(delay / bucketMs);
    buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
  }
  return [...buckets.values()];
}

function makeAnswerPayload(studentNo) {
  const answers = {};
  for (let q = 1; q <= QUESTIONS; q++) {
    answers[String(q)] = {
      answer: ['A', 'B', 'C', 'D'][rand(4)],
      correct: null,
      t: Date.now() + studentNo + q
    };
  }
  return {
    id: `EXAM-LOADTEST_SIM-${studentNo}`,
    exam_id: 'EXAM-LOADTEST',
    user_id: `SIM-${studentNo}`,
    nama: `Siswa Simulasi ${studentNo}`,
    kelas: 'LOAD',
    skor: 0,
    detail: answers,
    waktu: 'Load Test',
    violations: 0,
    timestamp: Date.now()
  };
}

const syncDelays = Array.from({ length: STUDENTS }, () => rand(SYNC_SPREAD_MS));
const submitDelays = Array.from({ length: STUDENTS }, () => rand(SUBMIT_SPREAD_MS));
const syncPerSecond = bucketize(syncDelays, 1000);
const submitPerSecond = bucketize(submitDelays, 1000);
const samplePayloadBytes = Buffer.byteLength(JSON.stringify(makeAnswerPayload(1)));
const totalSubmitBytes = samplePayloadBytes * STUDENTS;

const result = {
  students: STUDENTS,
  questions: QUESTIONS,
  hMinusOneSync: {
    spreadSeconds: Math.round(SYNC_SPREAD_MS / 1000),
    peakRequestsPerSecond: Math.max(...syncPerSecond),
    p50DelayMs: percentile(syncDelays, 50),
    p95DelayMs: percentile(syncDelays, 95),
    p99DelayMs: percentile(syncDelays, 99)
  },
  examDaySubmit: {
    spreadSeconds: Math.round(SUBMIT_SPREAD_MS / 1000),
    peakRequestsPerSecond: Math.max(...submitPerSecond),
    p50DelayMs: percentile(submitDelays, 50),
    p95DelayMs: percentile(submitDelays, 95),
    p99DelayMs: percentile(submitDelays, 99),
    samplePayloadBytes,
    estimatedTotalSubmitBytes: totalSubmitBytes
  },
  recommendation: 'Keep submit spread at 5-10 minutes; avoid student realtime; run live test only on a disposable Supabase project.'
};

console.log(JSON.stringify(result, null, 2));
