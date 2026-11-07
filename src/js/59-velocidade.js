// V119 — VELOCIDADE AO TROCAR DE TELA
// As telas que não estão à vista (Planta, Fiadas/Elevações/Quantitativos, Pranchas…) ficavam fora da tela, mas
// continuavam "vivas": a cada troca o navegador recalculava o layout de tudo — no projeto de 69 paredes são
// ~50 mil elementos (elevações, fiadas e tabelas). Agora:
//  • tela que não está à vista: o navegador não calcula nem pinta o conteúdo (content-visibility: hidden);
//    o conteúdo continua lá e volta na hora, sem refazer nada;
//  • nas Elevações, cada parede só é calculada quando aparece ao rolar (content-visibility: auto).
(function () {
  'use strict';
  const css = document.createElement('style');
  css.id = 'vel119';
  css.textContent = `
body.ui85 .v85:not(.on85){content-visibility:hidden}
#output article.wallResult{content-visibility:auto;contain-intrinsic-size:auto 1100px}
@media print{body.ui85 .v85:not(.on85),#output article.wallResult{content-visibility:visible}}`;
  document.head.append(css);
  // para medir/imprimir/exportar algo de uma tela escondida, o código pode ligar tudo por um instante
  let profundo = 0;
  const semAtalho = fn => { profundo++; css.disabled = true; try { return fn(); } finally { if (--profundo === 0) css.disabled = false; } };
  window.vel119 = { semAtalho };
  // a montagem dos resultados mede os desenhos (getBBox) para recortar as vistas: precisa de tudo renderizado
  try { const rr = renderResults; renderResults = function (...a) { return semAtalho(() => rr.apply(this, a)); }; } catch (e) { console.error('V119', e); }
})();
