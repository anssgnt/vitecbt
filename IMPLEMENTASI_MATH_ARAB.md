# IMPLEMENTASI DETAIL - MATEMATIKA & BAHASA ARAB

**Status**: Ready to Implement
**Effort**: 2-3 minggu
**Priority**: HIGH

---

## PART 1: IMPLEMENTASI MATEMATIKA

### Step 1: Setup KaTeX di Frontend

**File**: `index.html`, `exam.html`, `soal-editor.html`

```html
<!-- Add ke <head> -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/contrib/auto-render.min.js"
        onload="renderMathInElement(document.body, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}]});"></script>
```

### Step 2: Create Math Editor Component

**File**: `src/math-editor.js`

```javascript
class MathEditor {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.setupUI();
  }

  setupUI() {
    this.container.innerHTML = `
      <div class="math-editor-wrapper">
        <div class="math-toolbar">
          <button data-insert="x^2" title="Power">x²</button>
          <button data-insert="\\frac{a}{b}" title="Fraction">a/b</button>
          <button data-insert="\\sqrt{x}" title="Square Root">v</button>
          <button data-insert="\\sin(x)" title="Sine">sin</button>
          <button data-insert="\\cos(x)" title="Cosine">cos</button>
          <button data-insert="\\int" title="Integral">?</button>
          <button data-insert="\\sum" title="Sum">S</button>
          <button data-insert="\\pi" title="Pi">p</button>
          <button data-insert="\\alpha" title="Alpha">a</button>
          <button data-insert="\\beta" title="Beta">ß</button>
        </div>
        <textarea class="math-input" placeholder="Masukkan rumus LaTeX..."></textarea>
        <div class="math-preview">Preview akan muncul di sini</div>
      </div>
    `;
    
    this.input = this.container.querySelector('.math-input');
    this.preview = this.container.querySelector('.math-preview');
    
    // Toolbar buttons
    this.container.querySelectorAll('.math-toolbar button').forEach(btn => {
      btn.addEventListener('click', () => this.insertSymbol(btn.dataset.insert));
    });
    
    // Live preview
    this.input.addEventListener('input', () => this.updatePreview());
  }

  insertSymbol(symbol) {
    const start = this.input.selectionStart;
    const end = this.input.selectionEnd;
    const text = this.input.value;
    
    this.input.value = text.substring(0, start) + symbol + text.substring(end);
    this.input.selectionStart = this.input.selectionEnd = start + symbol.length;
    this.input.focus();
    this.updatePreview();
  }

  updatePreview() {
    const latex = this.input.value;
    this.preview.textContent = '$' + latex + '$';
    
    try {
      renderMathInElement(this.preview, {
        delimiters: [{left: '$', right: '$', display: false}]
      });
    } catch (e) {
      this.preview.textContent = 'Error: ' + e.message;
    }
  }

  getValue() {
    return this.input.value;
  }

  setValue(value) {
    this.input.value = value;
    this.updatePreview();
  }
}
```

### Step 3: Math Validation Backend

**File**: `supabase/functions/submit_exam/math-validator.ts`

```typescript
import { evaluate } from "https://deno.land/x/mathjs@11.11.0/mod.ts";

export interface MathValidationResult {
  correct: boolean;
  answer: string;
  normalized: string;
  error?: string;
}

export function normalizeMathExpression(expr: string): string {
  // Remove spaces
  let normalized = expr.replace(/\s+/g, '');
  
  // Convert common variations
  normalized = normalized.replace(/x\^2/g, 'x^2');
  normalized = normalized.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
  normalized = normalized.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)');
  
  return normalized.toLowerCase();
}

export function validateMathAnswer(
  answer: string,
  key: string,
  tolerance: number = 0.0001
): MathValidationResult {
  try {
    // Try direct string comparison first
    const answerNorm = normalizeMathExpression(answer);
    const keyNorm = normalizeMathExpression(key);
    
    if (answerNorm === keyNorm) {
      return { correct: true, answer, normalized: answerNorm };
    }
    
    // Try numerical evaluation
    const answerVal = evaluate(answer);
    const keyVal = evaluate(key);
    
    // Handle arrays/matrices
    if (Array.isArray(answerVal) && Array.isArray(keyVal)) {
      const correct = JSON.stringify(answerVal) === JSON.stringify(keyVal);
      return { correct, answer, normalized: answerNorm };
    }
    
    // Handle numbers with tolerance
    if (typeof answerVal === 'number' && typeof keyVal === 'number') {
      const correct = Math.abs(answerVal - keyVal) < tolerance;
      return { correct, answer, normalized: answerNorm };
    }
    
    return { correct: false, answer, normalized: answerNorm };
  } catch (error) {
    return {
      correct: false,
      answer,
      normalized: '',
      error: error.message
    };
  }
}
```

### Step 4: Update Exam Page

**File**: `exam.html` - Add math question rendering

```html
<!-- Add ke exam.html body -->
<div id="exam-view" class="view active exam-layout">
  <!-- ... existing code ... -->
  
  <!-- Question content -->
  <div class="exam-content-scrollable">
    <div class="question-wrapper">
      <div id="q-type-badge" class="q-type-badge">PG</div>
      <div id="q-instruction" class="q-instruction-text"></div>
      
      <!-- Text question -->
      <div id="q-text" class="modern-question-text"></div>
      
      <!-- Math question -->
      <div id="q-math" class="math-question" style="display:none;">
        <div class="math-content"></div>
      </div>
      
      <!-- Image -->
      <div id="q-image-container" class="question-image-wrapper" style="display:none;"></div>
      
      <!-- Options or Math Input -->
      <div id="q-options" class="modern-answer-area"></div>
      <div id="q-math-input" class="math-answer-area" style="display:none;">
        <label>Jawaban Anda:</label>
        <input type="text" id="math-answer-field" placeholder="Contoh: x = 10 atau 3.14">
        <div id="math-answer-preview" class="math-preview"></div>
        <small>Gunakan LaTeX: x^2, \\frac{a}{b}, \\sqrt{x}, \\sin(x), dll</small>
      </div>
    </div>
  </div>
</div>

<script>
  // Render math question
  function renderMathQuestion(question) {
    const qMath = document.getElementById('q-math');
    const qText = document.getElementById('q-text');
    const qMathInput = document.getElementById('q-math-input');
    
    qMath.style.display = 'block';
    qText.style.display = 'none';
    qMathInput.style.display = 'block';
    
    qMath.querySelector('.math-content').textContent = '$' + question + '$';
    renderMathInElement(qMath);
  }
  
  // Live preview for math answer
  const mathAnswerField = document.getElementById('math-answer-field');
  const mathAnswerPreview = document.getElementById('math-answer-preview');
  
  mathAnswerField.addEventListener('input', () => {
    mathAnswerPreview.textContent = '$' + mathAnswerField.value + '$';
    try {
      renderMathInElement(mathAnswerPreview);
    } catch (e) {
      // Ignore rendering errors during typing
    }
  });
</script>
```

### Step 5: CSS untuk Matematika

**File**: `style-math.min.css`

```css
.math-editor-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.math-toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.math-toolbar button {
  padding: 8px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.math-toolbar button:hover {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.math-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
}

.math-input:focus {
  border-color: #6366f1;
  outline: none;
}

.math-preview {
  padding: 16px;
  background: #f0f7ff;
  border-radius: 8px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.math-question {
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  margin: 16px 0;
  text-align: center;
}

.math-content {
  font-size: 20px;
  line-height: 1.6;
}

.math-answer-area {
  padding: 16px;
  background: #f0f7ff;
  border-left: 4px solid #6366f1;
  border-radius: 8px;
  margin: 16px 0;
}

.math-answer-area label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #1f2937;
}

.math-answer-area input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  margin-bottom: 12px;
}

.math-answer-area input:focus {
  border-color: #6366f1;
  outline: none;
}

.math-answer-area small {
  display: block;
  color: #6b7280;
  font-size: 12px;
  margin-top: 8px;
}

/* KaTeX styling */
.katex {
  font-size: 1.1em;
}

.katex-display {
  margin: 12px 0;
}
```

---

## PART 2: IMPLEMENTASI BAHASA ARAB

### Step 1: Setup Arabic Fonts

**File**: `index.html`, `exam.html`, `soal-editor.html`

```html
<!-- Add ke <head> -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- Arabic fonts -->
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap">
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Scheherazade+New&display=swap">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Scheherazade+New&display=swap" rel="stylesheet">
```

### Step 2: Create Arabic Input Component

**File**: `src/arabic-editor.js`

```javascript
class ArabicEditor {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.setupUI();
  }

  setupUI() {
    this.container.innerHTML = `
      <div class="arabic-editor-wrapper">
        <div class="harakat-keyboard">
          <button data-harakat="\u064E" title="Fatha (?)">?</button>
          <button data-harakat="\u064F" title="Damma (?)">?</button>
          <button data-harakat="\u0650" title="Kasra (?)">?</button>
          <button data-harakat="\u0652" title="Sukun (?)">?</button>
          <button data-harakat="\u0651" title="Shadda (?)">?</button>
          <button data-harakat="\u064B" title="Tanwin Fatha (?)">?</button>
          <button data-harakat="\u064C" title="Tanwin Damma (?)">?</button>
          <button data-harakat="\u064D" title="Tanwin Kasra (?)">?</button>
          <button data-harakat="\u0653" title="Maddah (?)">?</button>
        </div>
        <textarea class="arabic-input" dir="rtl" placeholder="???? ???? ?????? ???..."></textarea>
      </div>
    `;
    
    this.input = this.container.querySelector('.arabic-input');
    
    // Harakat buttons
    this.container.querySelectorAll('.harakat-keyboard button').forEach(btn => {
      btn.addEventListener('click', () => this.insertHarakat(btn.dataset.harakat));
    });
    
    // Keyboard shortcuts
    this.input.addEventListener('keydown', (e) => this.handleKeyboardShortcut(e));
  }

  insertHarakat(harakat) {
    const start = this.input.selectionStart;
    const end = this.input.selectionEnd;
    const text = this.input.value;
    
    this.input.value = text.substring(0, start) + harakat + text.substring(end);
    this.input.selectionStart = this.input.selectionEnd = start + 1;
    this.input.focus();
  }

  handleKeyboardShortcut(e) {
    if (e.ctrlKey || e.altKey) {
      const harakatMap = {
        '1': '\u064E', // Fatha
        '2': '\u064F', // Damma
        '3': '\u0650', // Kasra
        '4': '\u0652', // Sukun
        '5': '\u0651', // Shadda
        '6': '\u064B', // Tanwin Fatha
        '7': '\u064C', // Tanwin Damma
        '8': '\u064D', // Tanwin Kasra
      };
      
      if (harakatMap[e.key]) {
        e.preventDefault();
        this.insertHarakat(harakatMap[e.key]);
      }
    }
  }

  getValue() {
    return this.input.value;
  }

  setValue(value) {
    this.input.value = value;
  }
}
```

### Step 3: Arabic Normalization Backend

**File**: `supabase/functions/submit_exam/arabic-validator.ts`

```typescript
export interface ArabicValidationResult {
  correct: boolean;
  answer: string;
  normalized: string;
}

export function normalizeArabic(text: string): string {
  let normalized = text;
  
  // Remove all harakat
  normalized = normalized.replace(/[\u064B-\u0652]/g, '');
  
  // Normalize alef variations to alef
  normalized = normalized.replace(/[\u0622\u0623\u0625]/g, '\u0627'); // ? ? ? -> ?
  
  // Normalize ya to ya
  normalized = normalized.replace(/\u0649/g, '\u064A'); // ? -> ?
  
  // Normalize waw with hamza
  normalized = normalized.replace(/\u0624/g, '\u0648'); // ? -> ?
  
  // Remove extra spaces
  normalized = normalized.trim().replace(/\s+/g, ' ');
  
  return normalized;
}

export function validateArabicAnswer(
  answer: string,
  key: string,
  ignoreHarakat: boolean = true
): ArabicValidationResult {
  let answerNorm = answer;
  let keyNorm = key;
  
  if (ignoreHarakat) {
    answerNorm = normalizeArabic(answer);
    keyNorm = normalizeArabic(key);
  } else {
    answerNorm = answer.trim();
    keyNorm = key.trim();
  }
  
  const correct = answerNorm === keyNorm;
  
  return {
    correct,
    answer,
    normalized: answerNorm
  };
}
```

### Step 4: Update Exam Page for Arabic

**File**: `exam.html` - Add Arabic support

```html
<!-- Add to exam.html -->
<div id="exam-view" class="view active exam-layout">
  <!-- Header with RTL support -->
  <div class="modern-exam-header" id="exam-header">
    <div class="header-left">
      <button id="btnGrid" class="header-menu-btn">Grid</button>
      <div class="header-info">
        <div id="exam-title" class="exam-main-title">Ujian</div>
        <div id="exam-user-info" class="exam-status-sub">-</div>
      </div>
    </div>
    <div class="modern-timer">
      <div id="exam-timer" class="timer-value">00:00:00</div>
    </div>
  </div>

  <!-- Question content with RTL support -->
  <div class="exam-content-scrollable">
    <div class="question-wrapper" id="question-wrapper">
      <div id="q-type-badge" class="q-type-badge">PG</div>
      <div id="q-instruction" class="q-instruction-text"></div>
      <div id="q-text" class="modern-question-text"></div>
      <div id="q-image-container" class="question-image-wrapper" style="display:none;"></div>
      <div id="q-options" class="modern-answer-area"></div>
    </div>
  </div>
</div>

<script>
  // Detect language and set RTL
  function setLanguageDirection(language) {
    const header = document.getElementById('exam-header');
    const wrapper = document.getElementById('question-wrapper');
    const qText = document.getElementById('q-text');
    
    if (language === 'ar') {
      header.dir = 'rtl';
      wrapper.dir = 'rtl';
      qText.dir = 'rtl';
      qText.classList.add('arabic-text');
      document.body.dir = 'rtl';
    } else {
      header.dir = 'ltr';
      wrapper.dir = 'ltr';
      qText.dir = 'ltr';
      qText.classList.remove('arabic-text');
      document.body.dir = 'ltr';
    }
  }
  
  // Render Arabic question
  function renderArabicQuestion(question, language) {
    setLanguageDirection(language);
    const qText = document.getElementById('q-text');
    qText.textContent = question;
    qText.classList.add('arabic-text');
  }
</script>
```

### Step 5: CSS untuk Arabic

**File**: `style-arabic.min.css`

```css
.arabic-text {
  font-family: 'Scheherazade New', 'Cairo', serif;
  font-size: 18px;
  line-height: 1.8;
  direction: rtl;
  text-align: right;
  letter-spacing: 0.5px;
}

.arabic-text.with-harakat {
  font-size: 20px;
  line-height: 2;
}

.harakat-keyboard {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.harakat-keyboard button {
  padding: 8px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  font-family: 'Scheherazade New', serif;
  transition: all 0.2s;
}

.harakat-keyboard button:hover {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.arabic-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-family: 'Scheherazade New', serif;
  font-size: 16px;
  direction: rtl;
  text-align: right;
  resize: vertical;
  min-height: 100px;
}

.arabic-input:focus {
  border-color: #6366f1;
  outline: none;
}

.arabic-editor-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* RTL Layout adjustments */
[dir="rtl"] .modern-exam-header {
  flex-direction: row-reverse;
}

[dir="rtl"] .header-left {
  flex-direction: row-reverse;
}

[dir="rtl"] .modern-answer-btn {
  text-align: right;
  direction: rtl;
}

[dir="rtl"] .modern-footer {
  flex-direction: row-reverse;
}
```

---

## PART 3: DATABASE UPDATES

**File**: `supabase/migrations/add_math_arabic_support.sql`

```sql
-- Add columns to soal table
ALTER TABLE soal ADD COLUMN IF NOT EXISTS tipe_matematika VARCHAR(50);
ALTER TABLE soal ADD COLUMN IF NOT EXISTS format_jawaban VARCHAR(20) DEFAULT 'text';
ALTER TABLE soal ADD COLUMN IF NOT EXISTS tolerance NUMERIC DEFAULT 0.0001;
ALTER TABLE soal ADD COLUMN IF NOT EXISTS bahasa VARCHAR(10) DEFAULT 'id';
ALTER TABLE soal ADD COLUMN IF NOT EXISTS has_harakat BOOLEAN DEFAULT false;
ALTER TABLE soal ADD COLUMN IF NOT EXISTS text_direction VARCHAR(10) DEFAULT 'ltr';

-- Add columns to hasil table
ALTER TABLE hasil ADD COLUMN IF NOT EXISTS math_details JSONB;
ALTER TABLE hasil ADD COLUMN IF NOT EXISTS arabic_details JSONB;

-- Create index for language
CREATE INDEX IF NOT EXISTS idx_soal_bahasa ON soal(bahasa);
CREATE INDEX IF NOT EXISTS idx_soal_tipe_matematika ON soal(tipe_matematika);
```

---

## PART 4: TESTING EXAMPLES

### Math Test Cases

```javascript
const mathTestCases = [
  {
    question: 'Berapa hasil dari $2x + 3 = 11$?',
    answer: 'x = 4',
    key: 'x = 4',
    expected: true
  },
  {
    question: 'Hitung $\\frac{1}{2} + \\frac{1}{3}$',
    answer: '5/6',
    key: '5/6',
    expected: true
  },
  {
    question: 'Berapa $\\sqrt{16}$?',
    answer: '4',
    key: '4',
    expected: true
  },
  {
    question: 'Hitung $\\sin(90°)$',
    answer: '1',
    key: '1',
    expected: true
  }
];
```

### Arabic Test Cases

```javascript
const arabicTestCases = [
  {
    question: '?? ???? ???? "??????"?',
    answer: '??????',
    key: '??????',
    expected: true
  },
  {
    question: '????: ?????????? ??????????',
    answer: '?????? ?????',
    key: '?????????? ??????????',
    ignoreHarakat: true,
    expected: true
  },
  {
    question: '?? ?? ????? ????',
    answer: '???????',
    key: '???????',
    expected: true
  }
];
```

---

## NEXT STEPS

1. Review dan approve implementasi plan
2. Setup development environment
3. Implement Week 1: Setup & Infrastructure
4. Implement Week 2: Frontend Components
5. Implement Week 3: Backend & Validation
6. Testing & QA
7. Deploy to production

**Estimated Timeline**: 2-3 minggu
**Team Size**: 2-3 developers
**Complexity**: Medium
