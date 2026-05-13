# ExamKita CBT

Aplikasi CBT offline-first untuk Netlify + Supabase.

## Deploy Netlify

- Branch: `main`
- Build command: `npm run build`
- Publish directory: `dist`

## Supabase Edge Functions

Deploy function dengan JWT verification dimatikan:

```powershell
supabase functions deploy get_exam_package --no-verify-jwt
supabase functions deploy submit_exam --no-verify-jwt
supabase functions deploy admin_summary --no-verify-jwt
```

## Validasi Cepat

```powershell
node --check sw.js
node --check cbt-static-runtime.min.js
node --check cbt-performance-hardening.min.js
```

## Alur Produksi

1. H-1 siswa login dan sinkron semua soal.
2. Hari-H siswa buka aplikasi, pilih ujian, masukkan token, lalu mulai.
3. Submit final dikirim lewat Supabase Edge Function.
4. Jika koneksi gagal, submit disimpan lokal dan dikirim ulang otomatis.
