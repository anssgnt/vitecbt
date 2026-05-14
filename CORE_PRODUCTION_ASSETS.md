# Core Production Assets

Dokumen ini adalah daftar asset aktif untuk deploy production. File eksperimen/test dipindahkan ke `archive/experimental-assets/` dan tidak ikut deploy karena `scripts/copy-static-assets.js` hanya menyalin file di root, bukan folder.

## Global

- `manifest.json`
- `icon-512.png`
- `cbt-lite-icons.min.css`
- `style-core.min.css`
- `style-modals.min.css`
- `supabase-adapter.min.js`
- `firebase-mock.min.js`
- `supabase-patch.min.js`
- `script.min.js`
- `cbt-static-runtime.min.js`
- `cbt-performance-hardening.min.js`
- `sw.js`

## Index

- Page: `index.html`
- CSS: `style-login-lite.min.css`, `style-login.min.css`, `style-dashboard.min.css`, `style-menu-icons.css`, `style-sync.min.css`, `style-index-modals.min.css`
- JS: `rate-limiter.min.js`, `sync-optimizer.min.js`, `bandwidth-optimizer.min.js`, `css-lazy-loader.min.js`, `image-optimizer.min.js`, `admin-auth.min.js`, `mobile-core.min.js`, `cbt-schedule-table.min.js`, `cbt-empty-state.min.js`

## Exam

- Page: `exam.html`
- CSS: `style-exam-lite.min.css`, `style-exam-footer.min.css`, `style-exam.min.css`
- JS: `cbt-admin-signals.min.js`, `exam-core.min.js`
- Catatan: halaman ujian harus tetap ringan. Tidak memakai lazy render, batch optimizer, advanced integration, atau sync optimizer tambahan saat ujian.

## Admin

- Page: `admin.html`
- CSS: `style.min.css`, `style-admin.min.css`
- JS: `rate-limiter.min.js`, `css-lazy-loader.min.js`, `image-optimizer.min.js`, `script-lazy-loader.min.js`, `admin-performance-monitor.min.js`, `cache-sync-manager.min.js`, `admin-shared.min.js`, `cbt-admin-signals.min.js`, `admin-core.min.js`, `admin-ops-enhancements.min.js`, `admin-siswa-delete.min.js`

## Result

- Page: `result.html`
- CSS: `style-exam-lite.min.css`, `style-result.min.css`
- JS: `result-core.min.js`

## Editor

- Page: `soal-editor.html`
- CSS: `style-editor.min.css`
- JS: `firebase-mock.min.js`, `supabase-adapter.min.js`, `supabase-patch.min.js`, `script.min.js`
- External: Google Fonts, Firebase compat CDN

## Archived / Not Deployed

- `archive/experimental-assets/data-compression.min.js`
- `archive/experimental-assets/db-pool.min.js`
- `archive/experimental-assets/differential-sync.min.js`
- `archive/experimental-assets/error-tracker.min.js`
- `archive/experimental-assets/exam-advanced-integration.min.js`
- `archive/experimental-assets/instant-login.min.js`
- `archive/experimental-assets/lazy-loading-core.min.js`
- `archive/experimental-assets/lazy-render-questions.min.js`
- `archive/experimental-assets/load-test-900.html`
- `archive/experimental-assets/load-test-900-local.js`
- `archive/experimental-assets/modules-init.min.js`
- `archive/experimental-assets/optimized-answer-sync.min.js`
- `archive/experimental-assets/parallel-batch-optimizer.min.js`
- `archive/experimental-assets/performance-monitor.min.js`
- `archive/experimental-assets/predictive-cache.min.js`
- `archive/experimental-assets/realtime-sync.min.js`
- `archive/experimental-assets/redis-cache.min.js`
- `archive/experimental-assets/style-schedule-minimal.min.css`
- `archive/experimental-assets/sw-image-cache.min.js`
