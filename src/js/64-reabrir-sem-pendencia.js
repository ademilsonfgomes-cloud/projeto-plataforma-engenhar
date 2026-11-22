// V130 — REABRIR O PROJETO SEM "ENTRADAS ALTERADAS": ao abrir um projeto salvo, o programa marcava TODAS as paredes como
// "Entradas alteradas — desenho anterior preservado, pendente de atualização", mesmo sem nada ter mudado, e era preciso
// gerar tudo de novo. Agora, ao abrir e ao trocar de nível, a parede cuja entrada (assinatura da parede + vizinhas +
// versão do motor) é idêntica à gravada na última geração volta ao resultado salvo, sem pendência.
// Parede que mudou de verdade continua pendente.
(function () {
  'use strict';
  // V149 — números com diferença só de arredondamento (ex.: escala da planta 0,3999882279 × 0,3999882293, recalculada ao
  // abrir o projeto) não contam como mudança da parede
  const arred = t => typeof t === 'string' ? t.replace(/-?\d+\.\d+(?:e-?\d+)?/gi, x => { const v = +x; return Number.isFinite(v) ? String(Math.round(v * 1e5) / 1e5) : x; }) : t;
  function frescas(quieto) {
    if (!Array.isArray(state.results) || state.results.length !== state.walls.length) return 0;
    let n = 0;
    state.walls.forEach((w, i) => {
      const m = state.results[i], s = state.savedResults?.[w.uid];
      if (!m || !m.revisionStale || !s || !s.result) return;
      try {
        if (s.bondVersion !== undefined && typeof bondVer53 === 'function' && s.bondVersion !== bondVer53()) return;
        if (s.signature !== sourceSignature(w) && arred(s.signature) !== arred(sourceSignature(w))) return;
        if (s.neighbours !== undefined && s.neighbours !== neighbourSignature(i) && arred(s.neighbours) !== arred(neighbourSignature(i))) return;
      } catch (e) { return; }
      const r = clone(s.result); delete r.revisionStale;
      if (r.statusReason && /Entradas alteradas/.test(r.statusReason)) { r.statusReason = ''; r.pending = false; }
      state.results[i] = r; try { window.level68?.setResult(w, r); } catch {} n++;
    });
    if (n && !quieto) { try { renderResults({ reports: [] }, state.results); } catch (e) { console.error('V130', e); } try { drawPlan(); } catch {} }
    return n;
  }
  try {
    const L = window.level68;
    if (L && L.switchTo) { const s0 = L.switchTo; L.switchTo = async function (...a) { const r = await s0.apply(this, a); try { frescas(); } catch (e) { console.error('V130', e); } return r; }; }
  } catch (e) { console.error('V130', e); }
  try {
    const inp = document.getElementById('restore');
    if (inp && inp.onchange) { const o = inp.onchange; inp.onchange = async function (...a) { const r = await o.apply(this, a); try { frescas(); } catch (e) { console.error('V130', e); } setTimeout(() => { try { frescas(); } catch {} }, 1500); return r; }; }
  } catch (e) { console.error('V130', e); }
  // V149 — depois de QUALQUER edição: o programa marcava todas as paredes como "Entradas alteradas — pendente" e o
  // contador "Resultado da modulação" (ex.: 42 / 74) não andava enquanto o projetista corrigia parede por parede.
  // Agora só fica pendente a parede que mudou de verdade (ela ou uma vizinha); as outras continuam OK.
  let emInv = false;
  try { const iv = invalidate; invalidate = function (...a) { emInv = true; try { return iv.apply(this, a); } finally { emInv = false; } }; } catch (e) { console.error('V149', e); }
  try { const rr = renderResults; renderResults = function (...a) { if (emInv && a[1] === state.results) { try { frescas(true); } catch (e) { console.error('V149', e); } } return rr.apply(this, a); }; } catch (e) { console.error('V149', e); }
  window.frescas130 = frescas;
})();
