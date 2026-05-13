import { corsHeaders, json } from "../_shared/cors.ts";
import { serviceClient, verifyAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { adminPass, examId, includePeserta = true } = await req.json().catch(() => ({ adminPass: "" }));
    const supabase = serviceClient();
    if (!(await verifyAdmin(supabase, adminPass))) return json({ success: false, message: "Admin tidak valid" }, 401);

    const cutoff = Date.now() - 10 * 60 * 1000;
    const activeExamQuery = supabase.from("jadwal_ujian").select("*").eq("aktif", true);
    const onlineQuery = supabase.from("online_status").select("*").gt("last_seen", cutoff);
    const hasilQuery = supabase.from("hasil").select("exam_id,user_id,skor,timestamp").order("timestamp", { ascending: false }).limit(10000);
    const syncQuery = supabase.from("status_sync").select("*");
    if (examId) {
      activeExamQuery.eq("id", examId);
      onlineQuery.eq("exam_id", examId);
      hasilQuery.eq("exam_id", examId);
      syncQuery.eq("exam_id", examId);
    }
    const [pesertaRes, jadwalRes, onlineRes, hasilRes, syncRes] = await Promise.all([
      includePeserta ? supabase.from("peserta").select("id,nama,kelas") : Promise.resolve({ data: [], error: null }),
      activeExamQuery,
      onlineQuery,
      hasilQuery,
      syncQuery,
    ]);
    for (const res of [pesertaRes, jadwalRes, onlineRes, hasilRes, syncRes]) if (res.error) throw res.error;

    const completions: Record<string, string[]> = {};
    for (const row of hasilRes.data || []) {
      const examId = row.exam_id;
      if (!completions[examId]) completions[examId] = [];
      completions[examId].push(row.user_id);
    }
    const onlines: Record<string, Record<string, unknown>> = {};
    for (const row of onlineRes.data || []) {
      if (!onlines[row.exam_id]) onlines[row.exam_id] = {};
      onlines[row.exam_id][row.user_id] = { last_seen: row.last_seen, progress: row.progress, total: row.total, status: row.status };
    }
    const syncStatus: Record<string, Record<string, unknown>> = {};
    for (const row of syncRes.data || []) {
      if (!syncStatus[row.exam_id]) syncStatus[row.exam_id] = {};
      syncStatus[row.exam_id][row.user_id] = row;
    }

    const activeExams = jadwalRes.data || [];
    const peserta = (pesertaRes.data || []).map((p) => ({ id: p.id, nama: p.nama, kelas: p.kelas }));
    const onlineCount = Object.values(onlines).reduce((sum, users) => sum + Object.keys(users).length, 0);
    const completionCount = Object.values(completions).reduce((sum, users) => sum + users.length, 0);

    return json({
      success: true,
      generatedAt: Date.now(),
      dashboardStats: {
        activeExamCount: activeExams.length,
        pesertaCount: peserta.length,
        onlineCount,
        completionCount,
      },
      activeExams,
      peserta,
      completions,
      onlines,
      syncStatus,
    });
  } catch (error) {
    return json({ success: false, message: error.message || "Gagal memuat admin summary" }, 500);
  }
});
