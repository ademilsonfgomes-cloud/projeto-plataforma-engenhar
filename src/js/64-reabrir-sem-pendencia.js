// V130 — REABRIR O PROJETO SEM "ENTRADAS ALTERADAS": ao abrir um projeto salvo, o programa marcava TODAS as paredes como
// "Entradas alteradas — desenho anterior preservado, pendente de atualização", mesmo sem nada ter mudado, e era preciso
// gerar tudo de novo. Agora, ao abrir e ao trocar de nível, a parede cuja entrada (assinatura da parede + vizinhas +
// versão do motor) é idêntica à gravada na última geração volta ao resultado salvo, sem pendência.
// Parede que mudou de verdade continua pendente.
(function () {
  'use strict';
  function frescas() {
    if (!Array.isArray(state.results) || state.results.length !== state.walls.length) return 0;
    let n = 0;
    state.walls.forEach((w, i) => {
      const m = state.results[i], s = state.savedResults?.[w.uid];
      if (!m || !m.revisionStale || !s || !s.result) return;
      try {
        if (s.bondVersion !== undefined && typeof bondVer53 === 'function' && s.bondVersion !== bondVer53()) return;
        if (s.signature !== sourceSignature(w)) return;
        if (s.neighbours !== undefined && s.neighbours !== neighbourSignature(i)) return;
      } catch (e) { return; }
      const r = clone(s.result); delete r.revisionStale;
      if (r.statusReason && /Entradas alteradas/.test(r.statusReason)) { r.statusReason = ''; r.pending = false; }
      state.results[i] = r; try { window.level68?.setResult(w, r); } catch {} n++;
    });
    if (n) { try { renderResults({ reports: [] }, state.results); } catch (e) { console.error('V130', e); } try { drawPlan(); } catch {} }
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
  window.frescas130 = frescas;
})();
