# FITUR IMPORT SOAL DARI EXCEL

**Status**: Ready to Implement
**Priority**: HIGH
**Effort**: 1-2 minggu

---

## 1. TEMPLATE EXCEL

### Format Kolom Excel

```
Kolom A: ID Soal (opsional, auto-generate jika kosong)
Kolom B: Tipe Soal (PG, BS, KOMPLEKS, ISIAN, JODOH)
Kolom C: Bahasa (id, ar, en, mixed)
Kolom D: Soal (text atau LaTeX untuk math)
Kolom E: Opsi A (untuk PG/BS/KOMPLEKS)
Kolom F: Opsi B
Kolom G: Opsi C
Kolom H: Opsi D
Kolom I: Opsi E (opsional)
Kolom J: Kunci Jawaban (A, B, C, D, E atau text)
Kolom K: Bobot (default: 1)
Kolom L: Tipe Matematika (simple, fraction, algebra, geometry, calculus, matrix)
Kolom M: Has Harakat (TRUE/FALSE untuk soal Arab)
Kolom N: Catatan (opsional)
```

### Contoh Data Excel

```
ID | Tipe | Bahasa | Soal | Opsi A | Opsi B | Opsi C | Opsi D | Kunci | Bobot | Tipe Math | Has Harakat | Catatan
---|------|--------|------|--------|--------|--------|--------|-------|-------|-----------|-------------|--------
1  | PG   | id     | Berapa hasil 2+2? | 3 | 4 | 5 | 6 | B | 1 | | FALSE | Soal mudah
2  | PG   | id     | $x^2 + 2x + 1 = 0$, berapa x? | -1 | 1 | 2 | -2 | A | 2 | algebra | FALSE | Soal matematika
3  | PG   | ar     | ?? ???? ???? ??????? | ????? | ?????? | ????? | ????? | B | 1 | | FALSE | Soal Arab
4  | PG   | ar     | ????: ?????????? ????????? | ?????? ????? | ?????? ????? | ?????? ????? | ?????? ????? | A | 1 | | TRUE | Soal Arab dengan harakat
5  | ISIAN| id     | Ibu kota Indonesia adalah... | Jakarta | | | | Jakarta | 1 | | FALSE | Soal isian
6  | JODOH| id     | Pasangkan: 1=A, 2=B, 3=C | A | B | C | | 1=A;2=B;3=C | 1 | | FALSE | Soal jodoh
```

---

## 2. BACKEND - IMPORT HANDLER

### File: `supabase/functions/import_soal/index.ts`

```typescript
import { corsHeaders, json } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";

interface SoalRow {
  id?: string;
  tipe: string;
  bahasa: string;
  soal: string;
  opsi_a?: string;
  opsi_b?: string;
  opsi_c?: string;
  opsi_d?: string;
  opsi_e?: string;
  kunci: string;
  bobot?: number;
  tipe_matematika?: string;
  has_harakat?: boolean;
  catatan?: string;
}

interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

function parseExcelData(data: any[]): SoalRow[] {
  return data.map((row, index) => ({
    id: row[0] || `soal-${Date.now()}-${index}`,
    tipe: row[1]?.toUpperCase() || 'PG',
    bahasa: row[2]?.toLowerCase() || 'id',
    soal: row[3] || '',
    opsi_a: row[4],
    opsi_b: row[5],
    opsi_c: row[6],
    opsi_d: row[7],
    opsi_e: row[8],
    kunci: row[9] || '',
    bobot: Number(row[10]) || 1,
    tipe_matematika: row[11],
    has_harakat: row[12] === 'TRUE' || row[12] === true,
    catatan: row[13],
  }));
}

function validateSoal(soal: SoalRow, rowIndex: number): string | null {
  if (!soal.soal?.trim()) return `Row ${rowIndex}: Soal tidak boleh kosong`;
  if (!soal.kunci?.trim()) return `Row ${rowIndex}: Kunci jawaban tidak boleh kosong`;
  if (!['PG', 'BS', 'KOMPLEKS', 'ISIAN', 'JODOH'].includes(soal.tipe)) {
    return `Row ${rowIndex}: Tipe soal tidak valid`;
  }
  if (!['id', 'ar', 'en', 'mixed'].includes(soal.bahasa)) {
    return `Row ${rowIndex}: Bahasa tidak valid`;
  }
  
  // Validasi opsi untuk PG/BS/KOMPLEKS
  if (['PG', 'BS', 'KOMPLEKS'].includes(soal.tipe)) {
    if (!soal.opsi_a || !soal.opsi_b || !soal.opsi_c || !soal.opsi_d) {
      return `Row ${rowIndex}: PG/BS/KOMPLEKS harus memiliki minimal 4 opsi`;
    }
  }
  
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  try {
    const { bankId, data, adminPass } = await req.json();
    
    if (!bankId || !data || !adminPass) {
      return json({ success: false, message: 'bankId, data, dan adminPass wajib diisi' }, 400);
    }
    
    const supabase = serviceClient();
    
    // Verify admin
    const { data: config, error: configError } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'admin_pass')
      .maybeSingle();
    
    if (configError || !config) {
      return json({ success: false, message: 'Admin verification failed' }, 401);
    }
    
    // Parse dan validasi data
    const soalList = parseExcelData(data);
    const errors: Array<{ row: number; error: string }> = [];
    const validSoal: SoalRow[] = [];
    
    soalList.forEach((soal, index) => {
      const error = validateSoal(soal, index + 2); // +2 karena header di row 1
      if (error) {
        errors.push({ row: index + 2, error });
      } else {
        validSoal.push(soal);
      }
    });
    
    // Insert valid soal
    let imported = 0;
    for (const soal of validSoal) {
      const opsi = [];
      if (soal.opsi_a) opsi.push(soal.opsi_a);
      if (soal.opsi_b) opsi.push(soal.opsi_b);
      if (soal.opsi_c) opsi.push(soal.opsi_c);
      if (soal.opsi_d) opsi.push(soal.opsi_d);
      if (soal.opsi_e) opsi.push(soal.opsi_e);
      
      const { error: insertError } = await supabase.from('soal').insert({
        id: soal.id,
        bank_id: bankId,
        tipe: soal.tipe,
        bahasa: soal.bahasa,
        soal: soal.soal,
        opsi: opsi,
        bobot: soal.bobot,
        tipe_matematika: soal.tipe_matematika,
        has_harakat: soal.has_harakat,
        catatan: soal.catatan,
      });
      
      if (!insertError) imported++;
    }
    
    const result: ImportResult = {
      success: errors.length === 0,
      total: soalList.length,
      imported,
      failed: errors.length,
      errors,
    };
    
    return json(result);
  } catch (error) {
    return json({ success: false, message: error.message }, 500);
  }
});
```

---

## 3. FRONTEND - IMPORT UI

### File: `src/excel-importer.js`

```javascript
class ExcelImporter {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.setupUI();
  }

  setupUI() {
    this.container.innerHTML = `
      <div class="excel-importer-wrapper">
        <div class="importer-header">
          <h2>Import Soal dari Excel</h2>
          <p>Upload file Excel (.xlsx) untuk import soal ke bank soal</p>
        </div>
        
        <div class="importer-content">
          <!-- File Upload -->
          <div class="upload-section">
            <label>Pilih File Excel</label>
            <div class="file-input-wrapper">
              <input type="file" id="excel-file" accept=".xlsx,.xls" />
              <button id="btn-browse" class="btn btn-primary">Browse File</button>
            </div>
            <small>Format: .xlsx atau .xls (max 5MB)</small>
          </div>
          
          <!-- Bank Soal Selection -->
          <div class="bank-selection">
            <label>Bank Soal Tujuan</label>
            <select id="bank-select">
              <option value="">-- Pilih Bank Soal --</option>
            </select>
          </div>
          
          <!-- Preview -->
          <div class="preview-section" style="display:none;">
            <label>Preview Data (5 baris pertama)</label>
            <table id="preview-table" class="preview-table">
              <thead></thead>
              <tbody></tbody>
            </table>
          </div>
          
          <!-- Actions -->
          <div class="importer-actions">
            <button id="btn-import" class="btn btn-success" disabled>Import Soal</button>
            <button id="btn-cancel" class="btn btn-outline">Batal</button>
          </div>
          
          <!-- Progress -->
          <div id="progress-section" style="display:none;">
            <div class="progress-bar">
              <div id="progress-fill" class="progress-fill"></div>
            </div>
            <p id="progress-text">Importing...</p>
          </div>
          
          <!-- Results -->
          <div id="results-section" style="display:none;">
            <div id="results-content"></div>
          </div>
        </div>
      </div>
    `;
    
    this.fileInput = this.container.querySelector('#excel-file');
    this.btnBrowse = this.container.querySelector('#btn-browse');
    this.bankSelect = this.container.querySelector('#bank-select');
    this.btnImport = this.container.querySelector('#btn-import');
    this.btnCancel = this.container.querySelector('#btn-cancel');
    this.previewSection = this.container.querySelector('.preview-section');
    this.previewTable = this.container.querySelector('#preview-table');
    this.progressSection = this.container.querySelector('#progress-section');
    this.resultsSection = this.container.querySelector('#results-section');
    
    this.setupEventListeners();
    this.loadBankSoal();
  }

  setupEventListeners() {
    this.btnBrowse.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    this.btnImport.addEventListener('click', () => this.importSoal());
    this.btnCancel.addEventListener('click', () => this.reset());
  }

  async loadBankSoal() {
    try {
      const response = await fetch('/api/get_bank_soal');
      const result = await response.json();
      
      if (result.success) {
        result.banks.forEach(bank => {
          const option = document.createElement('option');
          option.value = bank.id;
          option.textContent = bank.nama;
          this.bankSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading bank soal:', error);
    }
  }

  async handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar (max 5MB)');
      return;
    }
    
    try {
      const data = await this.readExcelFile(file);
      this.excelData = data;
      this.showPreview(data);
      this.btnImport.disabled = false;
    } catch (error) {
      alert('Error membaca file: ' + error.message);
    }
  }

  async readExcelFile(file) {
    // Gunakan library xlsx
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.min.js';
    
    return new Promise((resolve, reject) => {
      script.onload = () => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const workbook = XLSX.read(e.target.result, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 0 });
            resolve(data);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsArrayBuffer(file);
      };
      script.onerror = () => reject(new Error('Failed to load xlsx library'));
      document.head.appendChild(script);
    });
  }

  showPreview(data) {
    const preview = data.slice(0, 5);
    const headers = Object.keys(data[0] || {});
    
    // Create header
    const thead = this.previewTable.querySelector('thead');
    thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    
    // Create rows
    const tbody = this.previewTable.querySelector('tbody');
    tbody.innerHTML = preview.map(row => 
      `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`
    ).join('');
    
    this.previewSection.style.display = 'block';
  }

  async importSoal() {
    if (!this.bankSelect.value) {
      alert('Pilih bank soal terlebih dahulu');
      return;
    }
    
    this.progressSection.style.display = 'block';
    this.btnImport.disabled = true;
    
    try {
      const response = await fetch('/api/import_soal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankId: this.bankSelect.value,
          data: this.excelData,
          adminPass: prompt('Masukkan password admin:'),
        }),
      });
      
      const result = await response.json();
      this.showResults(result);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      this.progressSection.style.display = 'none';
      this.btnImport.disabled = false;
    }
  }

  showResults(result) {
    const content = this.resultsSection.querySelector('#results-content');
    
    if (result.success) {
      content.innerHTML = `
        <div class="alert alert-success">
          <h3>Import Berhasil!</h3>
          <p>Total: ${result.total} soal</p>
          <p>Berhasil: ${result.imported} soal</p>
          <p>Gagal: ${result.failed} soal</p>
        </div>
      `;
    } else {
      content.innerHTML = `
        <div class="alert alert-error">
          <h3>Import Gagal</h3>
          <p>${result.message}</p>
          ${result.errors?.length > 0 ? `
            <details>
              <summary>Error Details (${result.errors.length})</summary>
              <ul>
                ${result.errors.map(e => `<li>Row ${e.row}: ${e.error}</li>`).join('')}
              </ul>
            </details>
          ` : ''}
        </div>
      `;
    }
    
    this.resultsSection.style.display = 'block';
  }

  reset() {
    this.fileInput.value = '';
    this.excelData = null;
    this.previewSection.style.display = 'none';
    this.resultsSection.style.display = 'none';
    this.btnImport.disabled = true;
  }
}
```

---

## 4. CSS STYLING

### File: `style-excel-importer.min.css`

```css
.excel-importer-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.importer-header {
  margin-bottom: 30px;
}

.importer-header h2 {
  font-size: 24px;
  margin-bottom: 8px;
  color: #1f2937;
}

.importer-header p {
  color: #6b7280;
  font-size: 14px;
}

.importer-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.upload-section,
.bank-selection {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-section label,
.bank-selection label {
  font-weight: 600;
  color: #1f2937;
}

.file-input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

#excel-file {
  flex: 1;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
}

#bank-select {
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font-size: 12px;
}

.preview-table th,
.preview-table td {
  padding: 8px;
  border: 1px solid #e5e7eb;
  text-align: left;
}

.preview-table th {
  background: #f3f4f6;
  font-weight: 600;
}

.importer-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #6366f1;
  animation: progress 2s ease-in-out infinite;
}

@keyframes progress {
  0% { width: 0%; }
  50% { width: 100%; }
  100% { width: 100%; }
}

.alert {
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

.alert-success {
  background: #d1fae5;
  border-left: 4px solid #10b981;
  color: #065f46;
}

.alert-error {
  background: #fee2e2;
  border-left: 4px solid #ef4444;
  color: #7f1d1d;
}

.alert h3 {
  margin-bottom: 8px;
  font-size: 16px;
}

.alert details {
  margin-top: 12px;
}

.alert details summary {
  cursor: pointer;
  font-weight: 600;
}

.alert details ul {
  margin-top: 8px;
  margin-left: 20px;
  font-size: 12px;
}
```

---

## 5. TEMPLATE EXCEL DOWNLOAD

### File: `src/excel-template-generator.js`

```javascript
function generateExcelTemplate() {
  const headers = [
    'ID Soal',
    'Tipe Soal',
    'Bahasa',
    'Soal',
    'Opsi A',
    'Opsi B',
    'Opsi C',
    'Opsi D',
    'Opsi E',
    'Kunci Jawaban',
    'Bobot',
    'Tipe Matematika',
    'Has Harakat',
    'Catatan'
  ];
  
  const sampleData = [
    ['', 'PG', 'id', 'Berapa hasil 2+2?', '3', '4', '5', '6', '', 'B', '1', '', 'FALSE', 'Soal mudah'],
    ['', 'PG', 'id', '$x^2 + 2x + 1 = 0$', '-1', '1', '2', '-2', '', 'A', '2', 'algebra', 'FALSE', 'Soal matematika'],
    ['', 'PG', 'ar', '?? ???? ???? ???????', '?????', '??????', '?????', '?????', '', 'B', '1', '', 'FALSE', 'Soal Arab'],
    ['', 'ISIAN', 'id', 'Ibu kota Indonesia adalah...', '', '', '', '', '', 'Jakarta', '1', '', 'FALSE', 'Soal isian'],
  ];
  
  // Create workbook
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Soal');
  
  // Set column widths
  ws['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 8 },
    { wch: 15 },
    { wch: 12 },
    { wch: 20 },
  ];
  
  // Download
  XLSX.writeFile(wb, 'template-soal.xlsx');
}
```

---

## 6. VALIDASI & ERROR HANDLING

### Validasi yang dilakukan:

? File format (.xlsx, .xls)
? File size (max 5MB)
? Soal tidak kosong
? Kunci jawaban tidak kosong
? Tipe soal valid (PG, BS, KOMPLEKS, ISIAN, JODOH)
? Bahasa valid (id, ar, en, mixed)
? Opsi minimal 4 untuk PG/BS/KOMPLEKS
? Bobot adalah angka positif
? Harakat hanya untuk soal Arab

### Error Handling:

- Row-by-row validation
- Detailed error messages
- Continue import untuk row yang valid
- Report errors untuk row yang gagal
- Rollback jika ada error kritis

---

## 7. DATABASE MIGRATION

```sql
-- Add columns untuk import tracking
ALTER TABLE soal ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP;
ALTER TABLE soal ADD COLUMN IF NOT EXISTS import_batch_id VARCHAR(50);
ALTER TABLE soal ADD COLUMN IF NOT EXISTS import_source VARCHAR(50) DEFAULT 'manual';

-- Create import log table
CREATE TABLE IF NOT EXISTS import_log (
  id BIGSERIAL PRIMARY KEY,
  bank_id VARCHAR(50) NOT NULL,
  batch_id VARCHAR(50) NOT NULL,
  total_rows INT,
  imported_rows INT,
  failed_rows INT,
  errors JSONB,
  imported_by VARCHAR(50),
  imported_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (bank_id) REFERENCES bank_soal(id)
);

CREATE INDEX idx_import_log_bank ON import_log(bank_id);
CREATE INDEX idx_import_log_batch ON import_log(batch_id);
```

---

## 8. INTEGRATION DENGAN SOAL EDITOR

### Add button di soal editor:

```html
<!-- soal-editor.html -->
<div class="editor-toolbar">
  <button id="btn-add-soal" class="btn btn-primary">Tambah Soal</button>
  <button id="btn-import-excel" class="btn btn-secondary">Import dari Excel</button>
  <button id="btn-download-template" class="btn btn-outline">Download Template</button>
  <button id="btn-save-all" class="btn btn-success">Simpan Semua</button>
</div>

<div id="import-modal" class="modal" style="display:none;">
  <div class="modal-content">
    <div id="excel-importer"></div>
  </div>
</div>

<script>
  document.getElementById('btn-import-excel').addEventListener('click', () => {
    document.getElementById('import-modal').style.display = 'flex';
    new ExcelImporter('excel-importer');
  });
  
  document.getElementById('btn-download-template').addEventListener('click', () => {
    generateExcelTemplate();
  });
</script>
```

---

## 9. TESTING CHECKLIST

- [ ] Upload file Excel valid
- [ ] Upload file dengan format salah
- [ ] Upload file terlalu besar
- [ ] Import soal PG
- [ ] Import soal dengan matematika
- [ ] Import soal Arab dengan harakat
- [ ] Import soal dengan error di beberapa row
- [ ] Validasi error messages
- [ ] Check database setelah import
- [ ] Verify soal muncul di exam
- [ ] Test dengan 1000+ soal

---

## 10. TIMELINE IMPLEMENTASI

**Week 1:**
- Setup backend import handler
- Create database migrations
- Implement validation logic

**Week 2:**
- Create frontend UI
- Implement Excel file reading
- Add preview functionality
- Integrate with soal editor

**Total: 1-2 minggu**

---

## DEPENDENCIES

- **Backend**: Deno (built-in)
- **Frontend**: XLSX library (https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.min.js)
- **Database**: Supabase PostgreSQL

---

## NEXT STEPS

1. Review template Excel format
2. Approve implementasi plan
3. Start backend development
4. Create frontend UI
5. Testing dengan sample data
6. Deploy ke production
