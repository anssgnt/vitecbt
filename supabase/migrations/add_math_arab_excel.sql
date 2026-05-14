-- Add columns untuk Matematika
ALTER TABLE soal ADD COLUMN IF NOT EXISTS tipe_matematika VARCHAR(50);
ALTER TABLE soal ADD COLUMN IF NOT EXISTS format_jawaban VARCHAR(20) DEFAULT 'text';
ALTER TABLE soal ADD COLUMN IF NOT EXISTS tolerance NUMERIC DEFAULT 0.0001;

-- Add columns untuk Bahasa Arab
ALTER TABLE soal ADD COLUMN IF NOT EXISTS bahasa VARCHAR(10) DEFAULT 'id';
ALTER TABLE soal ADD COLUMN IF NOT EXISTS has_harakat BOOLEAN DEFAULT false;
ALTER TABLE soal ADD COLUMN IF NOT EXISTS text_direction VARCHAR(10) DEFAULT 'ltr';

-- Add columns untuk Excel Import tracking
ALTER TABLE soal ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP;
ALTER TABLE soal ADD COLUMN IF NOT EXISTS import_batch_id VARCHAR(50);
ALTER TABLE soal ADD COLUMN IF NOT EXISTS import_source VARCHAR(50) DEFAULT 'manual';

-- Add columns untuk hasil (scoring)
ALTER TABLE hasil ADD COLUMN IF NOT EXISTS math_details JSONB;
ALTER TABLE hasil ADD COLUMN IF NOT EXISTS arabic_details JSONB;

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
  imported_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_soal_bahasa ON soal(bahasa);
CREATE INDEX IF NOT EXISTS idx_soal_tipe_matematika ON soal(tipe_matematika);
CREATE INDEX IF NOT EXISTS idx_soal_import_batch ON soal(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_import_log_bank ON import_log(bank_id);
CREATE INDEX IF NOT EXISTS idx_import_log_batch ON import_log(batch_id);
