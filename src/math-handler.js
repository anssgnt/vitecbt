// Math Handler - KaTeX + mathjs Integration

class MathHandler {
  constructor() {
    this.loadKaTeX();
  }

  loadKaTeX() {
    if (!window.katex) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.js';
      script.onload = () => {
        const autoRender = document.createElement('script');
        autoRender.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/contrib/auto-render.min.js';
        document.head.appendChild(autoRender);
      };
      document.head.appendChild(script);
    }
  }

  renderMath(element) {
    if (window.renderMathInElement) {
      renderMathInElement(element, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false}
        ]
      });
    }
  }

  validateMathAnswer(answer, key, tolerance = 0.0001) {
    try {
      const answerNorm = this.normalizeMath(answer);
      const keyNorm = this.normalizeMath(key);
      
      if (answerNorm === keyNorm) return true;
      
      // Try numeric evaluation
      const answerVal = this.evaluateExpression(answer);
      const keyVal = this.evaluateExpression(key);
      
      if (typeof answerVal === 'number' && typeof keyVal === 'number') {
        return Math.abs(answerVal - keyVal) < tolerance;
      }
      
      return false;
    } catch (e) {
      return false;
    }
  }

  normalizeMath(expr) {
    return expr.replace(/\s+/g, '').toLowerCase();
  }

  evaluateExpression(expr) {
    // Simple evaluation - in production use mathjs
    try {
      return Function('"use strict"; return (' + expr + ')')();
    } catch (e) {
      return NaN;
    }
  }
}

const mathHandler = new MathHandler();
