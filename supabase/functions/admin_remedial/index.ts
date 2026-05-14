import { corsHeaders, json } from "../_shared/cors.ts";
import { serviceClient, verifyAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { adminPass, examId, userId } = await req.json().catch(() => ({}));
    if (!examId || !userId) return json({ success: false, message: "examId dan userId wajib diisi" }, 400);

    const supabase = serviceClient();
    if (!(await verifyAdmin(supabase, adminPass || ""))) return json({ success: false, message: "Admin tidak valid" }, 401);

    const exam = String(examId);
    const user = String(userId);
    const resultId = `${exam}_${user}`;

    const cleanup = await Promise.all([
      supabase.from("hasil").delete().eq("id", resultId),
      supabase.from("hasil").delete().eq("exam_id", exam).eq("user_id", user),
      supabase.from("online_status").delete().eq("exam_id", exam).eq("user_id", user),
      supabase.from("status_sync").delete().eq("exam_id", exam).eq("user_id", user),
      supabase.from("sync_answers").delete().eq("exam_id", exam).eq("user_id", user),
      supabase.from("reset_flags").delete().eq("exam_id", exam).eq("user_id", user),
    ]);

    const firstError = cleanup.find((res) => res.error)?.error;
    if (firstError) throw firstError;

    const { error: resetError } = await supabase.from("reset_flags").insert({
      exam_id: exam,
      user_id: user,
      time: Date.now(),
    });
    if (resetError) throw resetError;

    return json({ success: true, examId: exam, userId: user });
  } catch (error) {
    return json({ success: false, message: error.message || "Gagal membuka remedial" }, 500);
  }
});
