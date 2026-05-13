import { corsHeaders, json } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";

function versionOf(schedule: Record<string, unknown>) {
  return String(schedule.versi_soal || schedule.version || schedule.updated_at || schedule.mulai || "1");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { examId, token, skipTokenCheck } = await req.json();
    if (!examId) return json({ success: false, message: "examId wajib diisi" }, 400);

    const supabase = serviceClient();
    const { data: schedule, error: scheduleError } = await supabase
      .from("jadwal_ujian")
      .select("*")
      .eq("id", examId)
      .maybeSingle();
    if (scheduleError) throw scheduleError;
    if (!schedule) return json({ success: false, message: "Ujian tidak ditemukan" }, 404);
    if (!skipTokenCheck && schedule.token && String(token || "").trim().toUpperCase() !== String(schedule.token).trim().toUpperCase()) {
      return json({ success: false, message: "Token salah!" }, 403);
    }

    const { data: questions, error: questionError } = await supabase
      .from("soal")
      .select("*")
      .eq("bank_id", schedule.nama_soal)
      .order("id", { ascending: true });
    if (questionError) throw questionError;

    const version = versionOf(schedule);
    return json({
      success: true,
      static: true,
      generatedAt: Date.now(),
      cacheKey: `CBT_STATIC_PACKAGE_${examId}_v${version}`,
      config: {
        id_ujian: examId,
        nama_ujian: schedule.nama,
        durasi: schedule.durasi,
        end_ms: schedule.selesai,
        min_selesai: schedule.min_selesai || 0,
        shuffle_soal: schedule.shuffle_soal,
        shuffle_opsi: schedule.shuffle_opsi,
        versi_soal: version,
        kkm: schedule.kkm || 75,
      },
      questions: (questions || []).map((q, index) => ({
        ...q,
        id: String(q.id),
        _index: index,
        opsi: Array.isArray(q.opsi) ? q.opsi : [],
        bobot: Number(q.bobot || 1),
      })),
    });
  } catch (error) {
    return json({ success: false, message: error.message || "Gagal membuat paket ujian" }, 500);
  }
});
