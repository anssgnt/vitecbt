// Excel Importer - Import Soal dari Excel

class ExcelImporter {
  constructor() {
    this.loadXLSX();
  }

  loadXLSX() {
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.min.js';
      document.head.appendChild(script);
    }
  }

  async importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 0 });
          resolve(this.parseData(data));
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  parseData(data) {
    return data.map((row, index) => ({
      id: row['ID Soal'] || `soal-${Date.now()}-${index}`,
      tipe: (row['Tipe Soal'] || 'PG').toUpperCase(),
      bahasa: (row['Bahasa'] || 'id').toLowerCase(),
      soal: row['Soal'] || '',
      opsi: [
        row['Opsi A'],
        row['Opsi B'],
        row['Opsi C'],
        row['Opsi D'],
        row['Opsi E']
      ].filter(Boolean),
      kunci: row['Kunci Jawaban'] || '',
      bobot: Number(row['Bobot']) || 1,
      tipe_matematika: row['Tipe Matematika'],
      has_harakat: row['Has Harakat'] === 'TRUE' || row['Has Harakat'] === true,
      catatan: row['Catatan']
    }));
  }

  validateSoal(soal) {
    const errors = [];
    
    if (!soal.soal?.trim()) errors.push('Soal tidak boleh kosong');
    if (!soal.kunci?.trim()) errors.push('Kunci jawaban tidak boleh kosong');
    if (!['PG', 'BS', 'KOMPLEKS', 'ISIAN', 'JODOH'].includes(soal.tipe)) {
      errors.push('Tipe soal tidak valid');
    }
    if (!['id', 'ar', 'en', 'mixed'].includes(soal.bahasa)) {
      errors.push('Bahasa tidak valid');
    }
    if (['PG', 'BS', 'KOMPLEKS'].includes(soal.tipe) && soal.opsi.length < 4) {
      errors.push('PG/BS/KOMPLEKS harus memiliki minimal 4 opsi');
    }
    
    return errors;
  }

  async submitToServer(bankId, soalList, adminPass) {
    const response = await fetch('/api/import_soal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankId,
        data: soalList,
        adminPass
      })
    });
    return response.json();
  }

  downloadTemplate() {
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
      ['', 'ISIAN', 'id', 'Ibu kota Indonesia adalah...', '', '', '', '', '', 'Jakarta', '1', '', 'FALSE', 'Soal isian']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Soal');
    XLSX.writeFile(wb, 'template-soal.xlsx');
  }
}

const excelImporter = new ExcelImporter();
