import { corsHeaders, json } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";

interface SoalRow {
  id?: string;
  tipe: string;
  bahasa: string;
  soal: string;
  opsi: string[];
  kunci: string;
  bobot?: number;
  tipe_matematika?: string;
  has_harakat?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  try {
    const { bankId, data, adminPass } = await req.json();
    
    if (!bankId || !data || !adminPass) {
      return json({ success: false, message: "bankId, data, adminPass wajib diisi" }, 400);
    }
    
    const supabase = serviceClient();
    
    // Validate data
    const errors: Array<{ row: number; error: string }> = [];
    const validSoal: SoalRow[] = [];
    
    data.forEach((soal: SoalRow, index: number) => {
      const rowErrors = [];
      
      if (!soal.soal?.trim()) rowErrors.push("Soal tidak boleh kosong");
      if (!soal.kunci?.trim()) rowErrors.push("Kunci jawaban tidak boleh kosong");
      if (!['PG', 'BS', 'KOMPLEKS', 'ISIAN', 'JODOH'].includes(soal.tipe)) {
        rowErrors.push("Tipe soal tidak valid");
      }
      if (!['id', 'ar', 'en', 'mixed'].includes(soal.bahasa)) {
        rowErrors.push("Bahasa tidak valid");
      }
      if (['PG', 'BS', 'KOMPLEKS'].includes(soal.tipe) && (!soal.opsi || soal.opsi.length < 4)) {
        rowErrors.push("PG/BS/KOMPLEKS harus memiliki minimal 4 opsi");
      }
      
      if (rowErrors.length > 0) {
        errors.push({ row: index + 2, error: rowErrors.join("; ") });
      } else {
        validSoal.push(soal);
      }
    });
    
    // Insert valid soal
    let imported = 0;
    for (const soal of validSoal) {
      const { error: insertError } = await supabase.from("soal").insert({
        id: soal.id || `soal-${Date.now()}-${Math.random()}`,
        bank_id: bankId,
        tipe: soal.tipe,
        bahasa: soal.bahasa,
        soal: soal.soal,
        opsi: soal.opsi,
        bobot: soal.bobot || 1,
        tipe_matematika: soal.tipe_matematika,
        has_harakat: soal.has_harakat || false,
      });
      
      if (!insertError) imported++;
    }
    
    return json({
      success: errors.length === 0,
      total: data.length,
      imported,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    return json({ success: false, message: error.message }, 500);
  }
});
