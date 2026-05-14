// Arabic Handler - RTL + Harakat Support

class ArabicHandler {
  constructor() {
    this.loadArabicFonts();
    this.setupHarakatKeyboard();
  }

  loadArabicFonts() {
    const fonts = [
      'https://fonts.googleapis.com/css2?family=Scheherazade+New&display=swap',
      'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Amiri:ital@0;1&display=swap'
    ];
    
    fonts.forEach(fontUrl => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontUrl;
      document.head.appendChild(link);
    });
  }

  setupHarakatKeyboard() {
    this.harakatMap = {
      '1': '\u064E', // Fatha
      '2': '\u064F', // Damma
      '3': '\u0650', // Kasra
      '4': '\u0652', // Sukun
      '5': '\u0651', // Shadda
      '6': '\u064B', // Tanwin Fatha
      '7': '\u064C', // Tanwin Damma
      '8': '\u064D'  // Tanwin Kasra
    };
  }

  insertHarakat(textarea, harakat) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    textarea.value = text.substring(0, start) + harakat + text.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + 1;
    textarea.focus();
  }

  normalizeArabic(text) {
    let normalized = text;
    // Remove harakat
    normalized = normalized.replace(/[\u064B-\u0652]/g, '');
    // Normalize alef
    normalized = normalized.replace(/[\u0622\u0623\u0625]/g, '\u0627');
    // Normalize ya
    normalized = normalized.replace(/\u0649/g, '\u064A');
    // Remove spaces
    normalized = normalized.trim().replace(/\s+/g, ' ');
    return normalized;
  }

  validateArabicAnswer(answer, key, ignoreHarakat = true) {
    let answerNorm = answer;
    let keyNorm = key;
    
    if (ignoreHarakat) {
      answerNorm = this.normalizeArabic(answer);
      keyNorm = this.normalizeArabic(key);
    } else {
      answerNorm = answer.trim();
      keyNorm = key.trim();
    }
    
    return answerNorm === keyNorm;
  }

  setRTL(element) {
    element.dir = 'rtl';
    element.classList.add('arabic-text');
  }

  setLTR(element) {
    element.dir = 'ltr';
    element.classList.remove('arabic-text');
  }
}

const arabicHandler = new ArabicHandler();
