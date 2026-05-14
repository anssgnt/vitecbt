# FITUR MATEMATIKA & BAHASA ARAB - ROADMAP IMPLEMENTASI

**Tanggal**: 14 Mei 2026
**Status**: Planning
**Priority**: HIGH
**Effort**: 2-3 minggu

---

## 1. SUPPORT MATEMATIKA DENGAN KARAKTER UNIK

### 1.1 Kebutuhan Teknis

#### A. Rendering Matematika

**Opsi 1: MathJax (Recommended)**
```html
<!-- Add to index.html, exam.html, soal-editor.html -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>

<script>
  MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']]
    },
    svg: { fontCache: 'global' }
  };
</script>
```

**Opsi 2: KaTeX (Faster, Lighter)**
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/contrib/auto-render.min.js"
        onload="renderMathInElement(document.body);"></script>
```

**Rekomendasi**: KaTeX (lebih cepat, lebih ringan untuk mobile)

#### B. Input Matematika

**Opsi 1: MathQuill (WYSIWYG Editor)**
```html
<link href="https://cdnjs.cloudflare.com/ajax/libs/mathquill/0.10.1/mathquill.min.css" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/mathquill/0.10.1/mathquill.min.js"></script>
```

**Opsi 2: Desmos Math Input**
```html
<script src="https://www.desmos.com/api/v1.8/calculator.js"></script>
```

**Opsi 3: Plain LaTeX Input**
```html
<textarea id="math-input" placeholder="Masukkan rumus: $x^2 + y^2 = z^2$"></textarea>
```

**Rekomendasi**: Kombinasi LaTeX input + KaTeX preview (paling fleksibel)

#### C. Validasi Jawaban Matematika

**Backend**: Gunakan `math-expression-evaluator` atau `mathjs`

```typescript
// supabase/functions/submit_exam/index.ts
import { evaluate } from "https://deno.land/x/mathjs@11.11.0/mod.ts";

function isCorrectMath(answer: string, key: string): boolean {
  try {
    // Normalize expressions
    const answerNorm = answer.replace(/\\s+/g, '').toLowerCase();
    const keyNorm = key.replace(/\\s+/g, '').toLowerCase();
    
    // Try direct comparison
    if (answerNorm === keyNorm) return true;
    
    // Try numerical evaluation
    const answerVal = evaluate(answer);
    const keyVal = evaluate(key);
    
    // Compare with tolerance for floating point
    return Math.abs(answerVal - keyVal) < 0.0001;
  } catch (error) {
    return false;
  }
}
```

### 1.2 Implementasi Frontend

#### A. Soal Editor - Input Matematika

```html
<!-- soal-editor.html -->
<div class="math-editor">
  <label>Soal Matematika</label>
  <div class="math-input-group">
    <textarea id="math-question" placeholder="Masukkan soal: $\\frac{x}{2} = 5$"></textarea>
    <div id="math-preview" class="math-preview"></div>
  </div>
  
  <label>Jawaban Benar (LaTeX)</label>
  <input type="text" id="math-answer" placeholder="Contoh: x = 10">
  <div id="answer-preview" class="math-preview"></div>
  
  <label>Tipe Soal Matematika</label>
  <select id="math-type">
    <option value="simple">Persamaan Sederhana</option>
    <option value="fraction">Pecahan</option>
    <option value="algebra">Aljabar</option>
    <option value="geometry">Geometri</option>
    <option value="calculus">Kalkulus</option>
    <option value="matrix">Matriks</option>
  </select>
</div>

<script>
  // Auto-render math preview
  const mathInput = document.getElementById('math-question');
  const mathPreview = document.getElementById('math-preview');
  
  mathInput.addEventListener('input', () => {
    mathPreview.textContent = mathInput.value;
    renderMathInElement(mathPreview);
  });
</script>
```

#### B. Exam Page - Display & Input Jawaban

```html
<!-- exam.html -->
<div id="q-text" class="modern-question-text"></div>

<!-- Untuk soal matematika -->
<div id="math-answer-input" class="math-answer-area" style="display:none;">
  <label>Jawaban Anda:</label>
  <input type="text" id="math-answer-field" placeholder="Masukkan jawaban: x = 10">
  <div id="math-answer-preview" class="math-preview"></div>
  <small>Gunakan LaTeX: x^2, \\frac{a}{b}, \\sqrt{x}, dll</small>
</div>

<script>
  // Auto-preview math answer
  const answerField = document.getElementById('math-answer-field');
  const answerPreview = document.getElementById('math-answer-preview');
  
  answerField.addEventListener('input', () => {
    answerPreview.textContent = '$' + answerField.value + '$';
    renderMathInElement(answerPreview);
  });
</script>
```

### 1.3 Database Schema

```sql
-- Add to soal table
ALTER TABLE soal ADD COLUMN tipe_matematika VARCHAR(50);
-- Contoh: 'simple', 'fraction', 'algebra', 'geometry', 'calculus', 'matrix'

ALTER TABLE soal ADD COLUMN format_jawaban VARCHAR(20) DEFAULT 'text';
-- Contoh: 'text', 'latex', 'numeric'

ALTER TABLE soal ADD COLUMN tolerance NUMERIC DEFAULT 0.0001;
-- Untuk perbandingan numeric

-- Add to hasil table
ALTER TABLE hasil ADD COLUMN math_details JSONB;
-- Menyimpan detail jawaban matematika
-- Contoh: {"1": {"answer": "x = 10", "normalized": "x=10", "correct": true}}
```

### 1.4 CSS untuk Matematika

```css
/* style-math.min.css */
.math-preview {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 8px 0;
  min-height: 40px;
  font-size: 16px;
}

.math-input-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.math-answer-area {
  padding: 16px;
  background: #f0f7ff;
  border-left: 4px solid #6366f1;
  border-radius: 8px;
  margin: 16px 0;
}

.math-answer-area input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

.math-answer-area input:focus {
  border-color: #6366f1;
  outline: none;
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

## 2. SUPPORT BAHASA ARAB LENGKAP DENGAN HARAKAT

### 2.1 Kebutuhan Teknis

#### A. Unicode & Font Support

```html
<!-- Add to head -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- Arabic fonts -->
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Amiri:ital@0;1&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Scheherazade+New&display=swap" rel="stylesheet">

<style>
  .arabic-text {
    font-family: 'Scheherazade New', 'Amiri', 'Cairo', serif;
    font-size: 18px;
    line-height: 1.8;
    direction: rtl;
    text-align: right;
  }
  
  .arabic-harakat {
    font-family: 'Scheherazade New', serif;
    font-size: 20px; /* Lebih besar untuk harakat terlihat jelas */
  }
</style>
```

#### B. Harakat Characters (Unicode)

```javascript
// Harakat Unicode ranges
const HARAKAT = {
  FATHA: '\u064E',      // ?
  DAMMA: '\u064F',      // ?
  KASRA: '\u0650',      // ?
  SUKUN: '\u0652',      // ?
  SHADDA: '\u0651',     // ?
  TANWIN_FATHA: '\u064B', // ?
  TANWIN_DAMMA: '\u064C', // ?
  TANWIN_KASRA: '\u064D', // ?
  MADDAH: '\u0653',     // ?
  HAMZA_ABOVE: '\u0654', // ?
  HAMZA_BELOW: '\u0655', // ?
  SUPERSCRIPT_ALEF: '\u0656', // ?
  WAVY_HAMZA_ABOVE: '\u0657', // ?
  WAVY_HAMZA_BELOW: '\u0658', // ?
  NOON_GHUNNA: '\u08E7', // ?
};

// Contoh: "?????????? ??????????"
const EXAMPLE_WITH_HARAKAT = '?????????? ??????????';
```

#### C. Input Harakat

**Opsi 1: Virtual Keyboard**
```html
<div class="harakat-keyboard">
  <button data-harakat="\u064E" title="Fatha">?</button>
  <button data-harakat="\u064F" title="Damma">?</button>
  <button data-harakat="\u0650" title="Kasra">?</button>
  <button data-harakat="\u0652" title="Sukun">?</button>
  <button data-harakat="\u0651" title="Shadda">?</button>
</div>

<textarea id="arabic-input" class="arabic-text" dir="rtl" placeholder="???? ???..."></textarea>

<script>
  document.querySelectorAll('.harakat-keyboard button').forEach(btn => {
    btn.addEventListener('click', () => {
      const textarea = document.getElementById('arabic-input');
      const harakat = btn.dataset.harakat;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      
      textarea.value = text.substring(0, start) + harakat + text.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 1;
      textarea.focus();
    });
  });
</script>
```

**Opsi 2: Keyboard Shortcut**
```javascript
// Ctrl+1 = Fatha, Ctrl+2 = Damma, dll
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey) {
    const harakatMap = {
      '1': '\u064E', // Fatha
      '2': '\u064F', // Damma
      '3': '\u0650', // Kasra
      '4': '\u0652', // Sukun
      '5': '\u0651', // Shadda
    };
    
    if (harakatMap[e.key]) {
      e.preventDefault();
      const textarea = document.activeElement;
      if (textarea.tagName === 'TEXTAREA') {
        const start = textarea.selectionStart;
        const text = textarea.value;
        textarea.value = text.substring(0, start) + harakatMap[e.key] + text.substring(start);
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }
    }
  }
});
```

**Opsi 3: IME (Input Method Editor)**
- Gunakan browser native Arabic IME
- Support untuk Windows, Mac, Linux
- User bisa input harakat langsung dari keyboard

### 2.2 Implementasi Frontend

#### A. Soal Editor - Input Arab dengan Harakat

```html
<!-- soal-editor.html -->
<div class="arabic-editor">
  <label>Soal (Bahasa Arab)</label>
  <div class="harakat-keyboard">
    <button data-harakat="\u064E" title="Fatha (?)">?</button>
    <button data-harakat="\u064F" title="Damma (?)">?</button>
    <button data-harakat="\u0650" title="Kasra (?)">?</button>
    <button data-harakat="\u0652" title="Sukun (?)">?</button>
    <button data-harakat="\u0651" title="Shadda (?)">?</button>
    <button data-harakat="\u064B" title="Tanwin Fatha (?)">?</button>
    <button data-harakat="\u064C" title="Tanwin Damma (?)">?</button>
    <button data-harakat="\u064D" title="Tanwin Kasra (?)">?</button>
  </div>
  
  <textarea id="arabic-question" class="arabic-text" dir="rtl" placeholder="???? ?????? ???..."></textarea>
  
  <label>Jawaban Benar (Bahasa Arab)</label>
  <textarea id="arabic-answer" class="arabic-text" dir="rtl" placeholder="???? ??????? ??????? ???..."></textarea>
  
  <label>Opsi Jawaban (Bahasa Arab)</label>
  <div id="arabic-options">
    <textarea class="arabic-option" dir="rtl" placeholder="?????? ?"></textarea>
    <textarea class="arabic-option" dir="rtl" placeholder="?????? ?"></textarea>
    <textarea class="arabic-option" dir="rtl" placeholder="?????? ?"></textarea>
    <textarea class="arabic-option" dir="rtl" placeholder="?????? ?"></textarea>
  </div>
</div>
```

#### B. Exam Page - Display Arab dengan Harakat

```html
<!-- exam.html -->
<div id="q-text" class="modern-question-text arabic-text" dir="rtl"></div>

<!-- Untuk soal Arab -->
<div id="q-options" class="modern-answer-area"></div>

<script>
  // Render Arabic text dengan proper styling
  function renderArabicQuestion(question) {
    const qText = document.getElementById('q-text');
    qText.textContent = question;
    qText.classList.add('arabic-text');
    qText.dir = 'rtl';
  }
  
  // Render Arabic options
  function renderArabicOptions(options) {
    const qOptions = document.getElementById('q-options');
    qOptions.innerHTML = '';
    
    options.forEach((option, index) => {
      const label = String.fromCharCode(1575 + index); // ? ? ? ?
      const btn = document.createElement('button');
      btn.className = 'modern-answer-btn arabic-text';
      btn.dir = 'rtl';
      btn.innerHTML = `<span>${label}</span> ${option}`;
      btn.addEventListener('click', () => selectAnswer(index));
      qOptions.appendChild(btn);
    });
  }
</script>
```

### 2.3 Database Schema

```sql
-- Add to soal table
ALTER TABLE soal ADD COLUMN bahasa VARCHAR(10) DEFAULT 'id';
-- Contoh: 'id', 'ar', 'en', 'mixed'

ALTER TABLE soal ADD COLUMN has_harakat BOOLEAN DEFAULT false;
-- Untuk soal Arab dengan harakat

ALTER TABLE soal ADD COLUMN text_direction VARCHAR(10) DEFAULT 'ltr';
-- Contoh: 'ltr' (left-to-right), 'rtl' (right-to-left)

-- Contoh data:
INSERT INTO soal (id, bank_id, tipe, soal, opsi, kunci, bahasa, has_harakat, text_direction)
VALUES (
  'q-arab-1',
  'bank-1',
  'PG',
  '?????????? ?????????? ?????????? ??????? ?????????????',
  '["???????????? ??????????", "?????????? ??????????", "?????????? ???????"]',
  'A',
  'ar',
  true,
  'rtl'
);
```

### 2.4 CSS untuk Arab

```css
/* style-arabic.min.css */
.arabic-text {
  font-family: 'Scheherazade New', 'Amiri', 'Cairo', serif;
  font-size: 18px;
  line-height: 1.8;
  direction: rtl;
  text-align: right;
  letter-spacing: 0.5px;
}

.arabic-text.with-harakat {
  font-size: 20px; /* Lebih besar untuk harakat terlihat */
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

.arabic-option {
  width: 100%;
  padding: 12px;
  margin: 8px 0;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-family: 'Scheherazade New', serif;
  font-size: 16px;
  direction: rtl;
  text-align: right;
}

.arabic-option:focus {
  border-color: #6366f1;
  outline: none;
}

.modern-answer-btn.arabic-text {
  padding: 16px;
  margin: 12px 0;
  text-align: right;
  direction: rtl;
}
```

### 2.5 Validasi Jawaban Arab

```typescript
// supabase/functions/submit_exam/index.ts

function normalizeArabic(text: string): string {
  // Remove harakat
  let normalized = text.replace(/[\u064B-\u0652]/g, '');
  
  // Normalize alef variations
  normalized = normalized.replace(/[\u0622\u0623\u0625]/g, '\u0627'); // ? ? ? -> ?
  
  // Normalize ya
  normalized = normalized.replace(/\u0649/g, '\u064A'); // ? -> ?
  
  // Remove extra spaces
  normalized = normalized.trim().replace(/\s+/g, ' ');
  
  return normalized;
}

function isCorrectArabic(answer: string, key: string): boolean {
  const answerNorm = normalizeArabic(answer);
  const keyNorm = normalizeArabic(key);
  
  return answerNorm === keyNorm;
}
```

---

## 3. IMPLEMENTASI TIMELINE

### Week 1: Setup & Infrastructure
- [ ] Add KaTeX library untuk matematika
- [ ] Add Arabic fonts (Cairo, Amiri, Scheherazade)
- [ ] Setup database schema untuk math & Arabic
- [ ] Create CSS files untuk math & Arabic

### Week 2: Frontend Implementation
- [ ] Implement math input di soal editor
- [ ] Implement math display di exam page
- [ ] Implement Arabic input dengan harakat keyboard
- [ ] Implement Arabic display dengan proper styling
- [ ] Add RTL support untuk layout

### Week 3: Backend & Validation
- [ ] Implement math validation di Edge Functions
- [ ] Implement Arabic normalization & validation
- [ ] Add math & Arabic support ke submit_exam function
- [ ] Add math & Arabic support ke scoring logic
- [ ] Testing dengan berbagai soal

---

## 4. DEPENDENCIES

### Frontend
```json
{
  "dependencies": {
    "katex": "^0.16.0",
    "mathjs": "^11.11.0"
  }
}
```

### Backend (Deno)
```typescript
// supabase/functions/submit_exam/deps.ts
export { evaluate } from "https://deno.land/x/mathjs@11.11.0/mod.ts";
```

### Fonts (CDN)
- Cairo: https://fonts.googleapis.com/css2?family=Cairo
- Amiri: https://fonts.googleapis.com/css2?family=Amiri
- Scheherazade: https://fonts.googleapis.com/css2?family=Scheherazade+New

---

## 5. TESTING CHECKLIST

### Matematika
- [ ] Simple equations: x + 2 = 5
- [ ] Fractions: 1/2 + 1/3
- [ ] Powers: x^2 + y^2
- [ ] Roots: sqrt(16)
- [ ] Trigonometry: sin(x), cos(x)
- [ ] Matrices: [[1,2],[3,4]]
- [ ] Calculus: integral, derivative
- [ ] Numeric tolerance: 3.14159 vs 3.14

### Bahasa Arab
- [ ] Basic Arabic text
- [ ] Arabic with all harakat types
- [ ] Mixed Arabic & English
- [ ] RTL layout
- [ ] Arabic keyboard input
- [ ] Harakat keyboard buttons
- [ ] Normalization (alef, ya, etc)
- [ ] Display quality on mobile

---

## 6. BROWSER COMPATIBILITY

| Browser | Math | Arabic | Harakat |
|---------|------|--------|----------|
| Chrome | ? | ? | ? |
| Firefox | ? | ? | ? |
| Safari | ? | ? | ? |
| Edge | ? | ? | ? |
| Mobile Safari | ? | ? | ?? (smaller) |
| Chrome Mobile | ? | ? | ? |

---

## 7. PERFORMANCE CONSIDERATIONS

### KaTeX Performance
- Lazy load KaTeX hanya untuk halaman dengan soal matematika
- Cache rendered math expressions
- Use SVG output (lebih cepat dari HTML)

### Arabic Font Performance
- Use system fonts jika tersedia
- Fallback ke Google Fonts
- Preload fonts untuk faster rendering

### Optimization
```html
<!-- Preload fonts -->
<link rel="preload" as="font" href="https://fonts.gstatic.com/s/scheherazadenew/..." crossorigin>

<!-- Lazy load KaTeX -->
<script>
  if (document.querySelector('[data-math]')) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.js';
    document.head.appendChild(script);
  }
</script>
```

---

## 8. NEXT STEPS

1. **Approve** fitur matematika & Arab
2. **Prioritize** mana yang dikerjakan duluan
3. **Allocate** developer untuk 2-3 minggu
4. **Setup** development environment
5. **Start** implementasi Week 1

---

**Estimasi Total Effort**: 2-3 minggu
**Kompleksitas**: Medium
**Impact**: High (membuka pasar baru)
