import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function verifyAdmin(supabase: ReturnType<typeof serviceClient>, adminPass: string) {
  if (!adminPass) return false;
  const { data, error } = await supabase
    .from("config")
    .select("value")
    .eq("key", "admin_pass")
    .maybeSingle();
  if (error || !data) return false;
  const value = typeof data.value === "object" && data.value ? (data.value.pass || data.value.value) : data.value;
  return String(value || "") === String(adminPass);
}
