import { corsHeaders, json } from "../_shared/cors.ts";
import { serviceClient, verifyAdmin } from "../_shared/supabase.ts";

function fmt(ts: number | null | undefined) {
  const d = ts ? new Date(ts) : new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { adminPass, examId = "" } = await req.json().catch(() => ({ adminPass: "" }));
    const supabase = serviceClient();
    if (!(await verifyAdmin(supabase, adminPass || ""))) return json({ success: false, message: "Admin tidak valid" }, 401);

    const hasilQuery = supabase.from("hasil").select("*").order("timestamp", { ascending: false }).limit(10000);
    const violationQuery = supabase.from("pelanggaran").select("*").order("timestamp", { ascending: false }).limit(200);
    if (examId) {
      hasilQuery.eq("exam_id", examId);
      violationQuery.eq("exam_id", examId);
    }
    const [hasilRes, violationRes, jadwalRes] = await Promise.all([
      hasilQuery,
      violationQuery,
      supabase.from("jadwal_ujian").select("id,nama"),
    ]);
    for (const res of [hasilRes, violationRes, jadwalRes]) if (res.error) throw res.error;

    const exams: Record<string, string> = {};
    for (const row of jadwalRes.data || []) exams[row.id] = row.nama || row.id;

    const hasil = (hasilRes.data || []).map((row) => ({
      waktu: fmt(row.timestamp),
      nama: row.nama || "-",
      kelas: row.kelas || "-",
      ujian: exams[row.exam_id] || row.exam_id || "-",
      skor: row.skor ?? 0,
      detail: row.detail,
      userId: row.user_id,
      examId: row.exam_id,
    }));

    const pelanggaran = (violationRes.data || []).map((row) => ({
      waktu: fmt(row.timestamp),
      nama: row.nama || "Unknown",
      kelas: row.kelas || "",
      ujian: exams[row.exam_id] || row.exam_id || "",
      tipe: row.tipe || "Pelanggaran",
      userId: row.user_id,
      examId: row.exam_id,
    }));

    return json({ success: true, hasil, pelanggaran });
  } catch (error) {
    return json({ success: false, message: error.message || "Gagal memuat laporan" }, 500);
  }
});
