// V155 — NOTA DA PAREDE: texto curto preso à parede (ex.: "BLOCO ACÚSTICO 19 cm — divisa entre casas"), que aparece
//  • no cartão da parede (campo "Nota da parede", editável);
//  • no título da elevação, na tela de Elevações;
//  • na prancha, logo abaixo do título da parede (elevação, corte e fiadas);
//  • nas notas executivas das pranchas, agrupada: "BLOCO ACÚSTICO …: P30, P33, P36…".
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const notaDe = w => String(w?.nota152 || '').trim();
  window.nota152 = { de: notaDe };

  const css = document.createElement('style'); css.id = 'nota152css';
  css.textContent = `.nota152p{display:inline-block;margin-left:8px;font-size:12px;font-weight:700;color:#8a3b00;background:#fff1e0;border:1px solid #f2a516;border-radius:10px;padding:1px 9px;vertical-align:middle}
.nota152s{font:bold 3mm Arial,sans-serif;color:#000;margin:0 0 1.5mm;letter-spacing:.1mm}
#wcard85 .nota152c{display:flex;flex-direction:column;gap:2px;margin-top:6px;font-size:12px}#wcard85 .nota152c input{font:inherit;padding:3px 6px;border:1px solid #b9c6d3;border-radius:5px}`;
  document.head.append(css);

  // cartão da parede
  function cartao() {
    const box = document.getElementById('wcard85'); if (!box) return;
    const i = Number(document.getElementById('wsel85')?.value ?? -1); const w = state.walls?.[i];
    let c = box.querySelector('.nota152c');
    if (!w) { c?.remove(); return; }
    if (!c) { c = document.createElement('label'); c.className = 'nota152c'; c.innerHTML = 'Nota da parede (sai na elevação e na prancha)<input type="text" placeholder="ex.: BLOCO ACÚSTICO 19 cm — divisa entre casas">'; box.append(c); c.querySelector('input').addEventListener('change', e => { const j = Number(document.getElementById('wsel85')?.value ?? -1), W = state.walls?.[j]; if (!W) return; const v = e.target.value.trim(); if (v) W.nota152 = v; else delete W.nota152; titulos(); try { plotSignature26 = ''; } catch {} }); }
    const inp = c.querySelector('input'); if (document.activeElement !== inp) inp.value = notaDe(w);
  }
  new MutationObserver(() => cartao()).observe(document.body, { childList: true, subtree: true, attributes: false });

  // título das elevações (tela)
  function titulos() {
    const out = document.getElementById('output'); if (!out) return;
    for (const art of out.querySelectorAll('article[id^="wall-result-"]')) {
      const i = +art.id.slice(12), h = art.querySelector('h3'), t = notaDe(state.walls[i]); if (!h) continue;
      let p = h.querySelector('.nota152p'); if (!t) { p?.remove(); continue; }
      if (!p) { p = document.createElement('span'); p.className = 'nota152p'; const pill = h.querySelector('.pill'); (pill || h.firstChild)?.after?.(p) || h.append(p); }
      p.textContent = t;
    }
  }
  try { const rr = renderResults; renderResults = function (...a) { const r = rr.apply(this, a); try { titulos(); } catch {} return r; }; } catch {}

  // prancha: nota abaixo do título de cada parede
  try {
    const cp = collectPlot26;
    collectPlot26 = function (...a) {
      const d = cp.apply(this, a);
      try {
        for (const it of d.items || []) {
          const m = String(it.title || '').match(/^Paredes? (\d+)/); if (!m || !it.html || it.nota152) continue;
          const nums = [...String(it.title).matchAll(/(?:^|=|Parede|Paredes)\s*(\d+)/g)].map(x => +x[1]);
          const t = [...new Set(nums.map(n => notaDe(state.walls[n - 1])).filter(Boolean))].join(' · '); if (!t) continue;
          it.html = '<p class="nota152s">' + esc(t.toUpperCase()) + '</p>' + it.html; it.h = (Number(it.h) || 0) + 5; it.nota152 = t;
        }
      } catch (e) { console.error('V155 prancha', e); }
      return d;
    };
  } catch (e) { console.error('V155', e); }

  // notas executivas: uma linha por nota, com as paredes de todos os pavimentos
  window.notasParedes152 = function () {
    const all = window.level68?.all?.() || state.walls, by = new Map();
    for (const w of all) { const t = notaDe(w); if (!t) continue; let lv = ''; try { lv = window.levelTag53 ? String(levelTag53(w.page || 1)).replace(/^\s*·\s*/, '') : ''; } catch {} if (!by.has(t)) by.set(t, new Map()); const g = by.get(t); if (!g.has(lv)) g.set(lv, []); g.get(lv).push(w); }
    const out = [];
    for (const [t, g] of by) {
      const partes = [...g].map(([lv, ws]) => { const nums = ws.map(w => { const L = (window.level68?.all?.() || state.walls).filter(x => x.page === w.page); const i = state.walls.includes(w) ? state.walls.indexOf(w) : L.indexOf(w); return i >= 0 ? 'P' + (i + 1) : null; }).filter(Boolean); return (lv ? lv + ': ' : '') + nums.join(', '); });
      out.push(t.toUpperCase() + ' — ' + partes.join(' · ') + '.');
    }
    return out;
  };
})();
