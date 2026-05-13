import { corsHeaders, json } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";

function parseAnswer(value: unknown) {
  return value && typeof value === "object" && "answer" in value ? (value as Record<string, unknown>).answer : value;
}

function isCorrect(type: string, answer: unknown, key: unknown) {
  if (answer == null || answer === "-") return false;
  const expected = String(key || "").trim();
  if (type === "PG" || type === "BS") return String(answer).trim().toUpperCase() === expected.toUpperCase();
  if (type === "KOMPLEKS" && Array.isArray(answer)) {
    const a = answer.map((x) => String(x).trim().toUpperCase()).sort();
    const k = expected.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean).sort();
    return JSON.stringify(a) === JSON.stringify(k);
  }
  if (type === "ISIAN") return String(answer).trim().toLowerCase() === expected.toLowerCase();
  if (type === "JODOH" && answer && typeof answer === "object") {
    const map: Record<string, string> = {};
    expected.split(";").forEach((part) => {
      const [left, right] = part.split("=");
      if (left && right) map[left.trim()] = right.trim();
    });
    return Object.keys(map).length > 0 && Object.keys(map).every((left) => String((answer as Record<string, unknown>)[left]) === map[left]);
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const payload = await req.json();
    const examId = payload.examId || payload.id_ujian;
    const user = payload.user || {};
    if (!examId || !user.id) return json({ success: false, message: "examId dan user.id wajib diisi" }, 400);

    const supabase = serviceClient();
    const resultId = `${examId}_${user.id}`;
    const { data: existing, error: existingError } = await supabase
      .from("hasil")
      .select("skor")
      .eq("id", resultId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) return json({ success: true, alreadySubmitted: true, score: existing.skor });

    const { data: schedule, error: scheduleError } = await supabase
      .from("jadwal_ujian")
      .select("*")
      .eq("id", examId)
      .maybeSingle();
    if (scheduleError) throw scheduleError;
    if (!schedule) return json({ success: false, message: "Ujian tidak ditemukan" }, 404);

    const [{ data: keys, error: keyError }, { data: questions, error: questionError }] = await Promise.all([
      supabase.from("kunci").select("*").eq("bank_id", schedule.nama_soal),
      supabase.from("soal").select("id, tipe, bobot").eq("bank_id", schedule.nama_soal),
    ]);
    if (keyError) throw keyError;
    if (questionError) throw questionError;

    const answers = payload.answers || {};
    const questionMap = new Map((questions || []).map((q) => [String(q.id), q]));
    let total = 0;
    let earned = 0;
    const detail: Record<string, unknown> = {};
    for (const row of keys || []) {
      const id = String(row.id);
      const q = questionMap.get(id) || { tipe: "PG", bobot: 1 };
      const weight = Number(q.bobot || 1);
      const answer = parseAnswer(answers[id]);
      const correct = isCorrect(String(q.tipe || "PG"), answer, row.kunci);
      total += weight;
      if (correct) earned += weight;
      detail[id] = { answer: answer == null ? "-" : answer, correct };
    }
    const score = Number.isFinite(Number(payload.score)) ? Number(payload.score) : total > 0 ? Math.round((earned / total) * 100) : 0;
    const row = {
      id: resultId,
      exam_id: examId,
      user_id: String(user.id),
      nama: user.name || user.nama || String(user.id),
      kelas: user.kelas || "-",
      skor: score,
      detail: JSON.stringify(detail),
      waktu: payload.usedTime || "",
      violations: Number(payload.violations || 0),
      timestamp: Date.now(),
    };
    const { error: upsertError } = await supabase.from("hasil").upsert(row, { onConflict: "id" });
    if (upsertError) throw upsertError;
    await supabase.from("online_status").delete().eq("exam_id", examId).eq("user_id", user.id);
    return json({ success: true, score, detail });
  } catch (error) {
    return json({ success: false, message: error.message || "Submit gagal" }, 500);
  }
});
