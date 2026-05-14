import { corsHeaders, json } from "../_shared/cors.ts";
import { serviceClient, verifyAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { adminPass, examId, message, kelas = "all", status = "all" } = await req.json().catch(() => ({}));
    if (!examId || !message) return json({ success: false, message: "examId dan message wajib diisi" }, 400);
    const supabase = serviceClient();
    if (!(await verifyAdmin(supabase, adminPass || ""))) return json({ success: false, message: "Admin tidak valid" }, 401);

    const now = Date.now();
    await supabase.from("broadcasts").delete().lt("timestamp", now - 10 * 60 * 1000);
    const { error } = await supabase.from("broadcasts").insert({
      exam_id: String(examId),
      message: String(message),
      kelas: String(kelas || "all"),
      status: String(status || "all"),
      timestamp: now,
    });
    if (error) throw error;
    return json({ success: true, timestamp: now });
  } catch (error) {
    return json({ success: false, message: error.message || "Gagal mengirim broadcast" }, 500);
  }
});
