// V150 — PRANCHAS SEMPRE DO PROJETO ABERTO: ao abrir outro projeto (ou o exemplo, ou começar um novo), a tela de pranchas
// continuava mostrando as folhas do projeto anterior — e, como a exportação usa as folhas da tela (V143), o PDF/DXF saía com
// os desenhos do projeto anterior (ex.: o projeto modelo). Agora, ao trocar de projeto, as folhas antigas são descartadas
// (a organização salva DENTRO de cada projeto continua valendo quando você monta as pranchas dele).
(function () {
  'use strict';
  function limpar() {
    try { plotSheets26 = []; plotItems26 = []; plotSignature26 = ''; } catch {}
    try { selectedPlot33 = null; } catch {}
    try { const pv = document.getElementById('plotPreview26'); if (pv) pv.innerHTML = ''; } catch {}
    try { const st = document.getElementById('plotStatus26'); if (st) st.textContent = 'Projeto aberto: clique em Montar para gerar as pranchas deste projeto.'; } catch {}
    try { const a = document.getElementById('readyPDF34'); if (a) a.remove(); } catch {}
  }
  window.limparPranchas150 = limpar;
  try {
    const inp = document.getElementById('restore');
    if (inp && inp.onchange) { const o = inp.onchange; inp.onchange = async function (...a) { limpar(); const r = await o.apply(this, a); limpar(); return r; }; }
  } catch (e) { console.error('V150', e); }
  for (const id of ['example', 'newProject']) {
    try { const b = document.getElementById(id); if (b && b.onclick) { const o = b.onclick; b.onclick = function (...a) { const antes = state.walls; const r = o.apply(this, a); const fim = () => { if (state.walls !== antes) limpar(); }; if (r && typeof r.then === 'function') r.then(fim); else fim(); return r; }; } } catch (e) { console.error('V150', e); }
  }
})();
