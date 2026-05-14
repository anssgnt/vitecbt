import { corsHeaders, json } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const payload = await req.json().catch(() => ({}));
    const examId = String(payload.exam_id || payload.examId || "");
    const userId = String(payload.user_id || payload.userId || "");
    if (!examId || !userId) return json({ success: false, message: "exam_id dan user_id wajib diisi" }, 400);

    const row = {
      exam_id: examId,
      user_id: userId,
      nama: String(payload.nama || payload.name || userId),
      kelas: String(payload.kelas || "-"),
      tipe: String(payload.tipe || payload.type || "PELANGGARAN"),
      timestamp: Number(payload.timestamp || Date.now()),
    };
    const { error } = await serviceClient().from("pelanggaran").insert(row);
    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return json({ success: false, message: error.message || "Gagal mencatat pelanggaran" }, 500);
  }
});
