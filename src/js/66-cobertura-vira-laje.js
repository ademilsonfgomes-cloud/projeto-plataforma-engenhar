// V135 — COBERTURA QUE VIROU LAJE: itens lançados na cobertura de um pavimento (aberturas de escada, beirais, vigas,
// reforços, cargas) ficavam presos à "cobertura" quando depois se criava um pavimento em cima — a cobertura passava a ser
// o piso do novo pavimento e esses itens sumiam de todos os níveis. Agora eles passam sozinhos para a laje do nível de cima.
(function () {
  'use strict';
  const L7 = () => window.loads77;
  function migrar() {
    let n = 0;
    try {
      const S = L7()?.S?.(); if (!S || !Array.isArray(S.items) || !window.lvl92?.entries) return 0;
      const E = lvl92.entries(), topo = E.find(e => e.id.startsWith('c|'))?.wallKey;
      for (const it of S.items) {
        if ((it.tgt || 'piso') !== 'cob') continue;
        const k = L7().itemKey(it); if (!k || k === topo) continue;
        const acima = E.find(e => e.id.startsWith('l|') && e.wallKey === k);
        if (!acima) continue;
        it.tgt = 'piso'; it.slab92 = acima.slabKey; it.migr135 = k; n++;
      }
      if (n) { try { L7().touch(); } catch {} }
    } catch (e) { console.error('V135', e); }
    return n;
  }
  try { const dp = drawPlan; drawPlan = function (...a) { try { migrar(); } catch {} return dp.apply(this, a); }; } catch (e) { console.error('V135', e); }
  window.migrar135 = migrar;
})();
