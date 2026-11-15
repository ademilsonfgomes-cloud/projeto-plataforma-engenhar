// V124 — VELOCIDADE AO MONTAR AS PRANCHAS
// Para montar as folhas o programa mede cada desenho (coloca um rascunho fora da tela, mede e tira). Cada "Montar"
// media de novo todos os quadros, mesmo os que não mudaram, e o "Caber na folha" media tudo a cada escala tentada.
// Agora o resultado de cada medição fica guardado pela impressão digital do CONTEÚDO medido (+ largura + versão dos
// estilos da página): o mesmo desenho, com a mesma largura e os mesmos estilos, dá exatamente a mesma medida.
// Só quadros novos ou alterados são medidos de novo. window.__v124off = true desliga (para comparar).
(function () {
  'use strict';
  // impressão digital de texto: dois hashes de 32 bits + comprimento (colisão desprezível)
  function dig(s) {
    s = String(s); let a = 0x811c9dc5, b = 5381;
    for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = Math.imul(a ^ c, 16777619); b = (Math.imul(b, 33) + c) | 0; }
    return (a >>> 0).toString(36) + '.' + (b >>> 0).toString(36) + '.' + s.length.toString(36);
  }
  // versão dos estilos (tamanhos de texto, folha, etc.): muda se qualquer <style> mudar
  let cssV = '', cssT = 0;
  function versaoCSS() {
    const agora = performance.now(); if (cssV && agora - cssT < 400) return cssV;
    let t = ''; for (const s of document.querySelectorAll('style')) t += s.textContent.length + ':' + (s.disabled ? 0 : 1) + ';';
    cssV = dig(t + '|' + (document.getElementById('plotStyle26')?.textContent || '')); cssT = agora; return cssV;
  }
  const memo = new Map(), MAX = 6000;
  const guarda = (k, v) => { if (memo.size > MAX) memo.clear(); memo.set(k, v); };
  let acertos = 0, faltas = 0;
  const desligado = () => !!window.__v124off;

  try {
    const m0 = measureHTML26;
    measureHTML26 = function (html, width) {
      if (desligado()) return m0.apply(this, arguments);
      const k = 'm|' + versaoCSS() + '|' + width + '|' + dig(html);
      if (memo.has(k)) { acertos++; return memo.get(k); }
      faltas++; const h = m0.apply(this, arguments); guarda(k, h); return h;
    };
  } catch (e) { console.error('V124 measure', e); }

  try {
    const c0 = compactPanel30;
    compactPanel30 = function (svg) {
      if (desligado() || !svg) return c0.apply(this, arguments);
      const k = 'c|' + versaoCSS() + '|' + dig(svg.outerHTML), r = memo.get(k);
      if (r) { acertos++; for (const [n, v] of r) { if (v == null) svg.removeAttribute(n); else svg.setAttribute(n, v); } return svg; }
      faltas++; const out = c0.apply(this, arguments);
      guarda(k, ['viewBox', 'height', 'width', 'style'].map(n => [n, svg.getAttribute(n)])); return out;
    };
  } catch (e) { console.error('V124 compact', e); }

  try {
    const p0 = panel36;
    panel36 = function (html, dx = 0) {
      if (desligado()) return p0.apply(this, arguments);
      const k = 'p|' + versaoCSS() + '|' + dx + '|' + dig(html), r = memo.get(k);
      if (r) {
        acertos++; const div = document.createElement('div'); div.innerHTML = html; const svg = div.querySelector('svg'); translateSVG35(svg, dx, 0);
        return { svg, box: { x: r[0], y: r[1], width: r[2], height: r[3] } };
      }
      faltas++; const out = p0.apply(this, arguments); const b = out.box; guarda(k, [b.x, b.y, b.width, b.height]); return out;
    };
  } catch (e) { console.error('V124 panel', e); }

  // guias de alinhamento das elevações: o resultado depende do desenho, da largura, das aberturas, das armaduras e da escala
  try {
    const g0 = alignPlotGuides36;
    alignPlotGuides36 = function (it, w, m, scale) {
      if (desligado() || !it || !w || !m) return g0.apply(this, arguments);
      let pts = []; try { pts = (state.steel?.[state.walls.indexOf(w)]?.points || []).map(p => p.t); } catch {}
      const k = 'g|' + versaoCSS() + '|' + dig(it.html) + '|' + it.w + '|' + scale + '|' + w.width + '|' + JSON.stringify((w.openings || []).map(o => [o.start, o.width])) + '|' + [m.H, m.L, m.drawFrom || 0].join(',') + '|' + pts.join(',') + '|' + (typeof wallPad22 === 'function' ? wallPad22(w) : '');
      const r = memo.get(k); if (r !== undefined) { acertos++; it.html = r; return; }
      faltas++; const out = g0.apply(this, arguments); guarda(k, it.html); return out;
    };
  } catch (e) { console.error('V124 guias', e); }
  window.medir124 = { stats: () => ({ acertos, faltas, guardados: memo.size }), limpar: () => memo.clear(), dig, versao: versaoCSS };
})();
