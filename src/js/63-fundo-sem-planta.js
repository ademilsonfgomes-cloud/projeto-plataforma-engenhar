// V129 — PAVIMENTO SEM PLANTA DE FUNDO: ao reabrir um projeto salvo, o programa zera o fundo e recarrega a planta
// (DXF/PDF) de cada pavimento. Um pavimento SEM planta de fundo (ex.: o Exemplo didático, ou paredes lançadas à mão)
// ficava sem fundo nenhum e a planta não desenhava nada (tela preta), inclusive no modo Laje do pavimento de cima.
// Agora, se o pavimento tem paredes e não tem fundo, é criado um fundo branco do tamanho das paredes.
(function () {
  'use strict';
  const N = Number;
  function fundoBranco() {
    if (typeof image !== 'undefined' && image) return false;
    const pg = N(document.getElementById('page')?.value) || 1, ws = state.walls.filter(w => w.line && N(w.page || 1) === pg);
    if (!ws.length) return false;
    const xs = ws.flatMap(w => w.line.map(q => q.x)), ys = ws.flatMap(w => w.line.map(q => q.y));
    const c = document.createElement('canvas'); c.width = Math.max(200, Math.ceil(Math.max(...xs) + 100)); c.height = Math.max(200, Math.ceil(Math.max(...ys) + 100));
    const x = c.getContext('2d'); x.fillStyle = 'white'; x.fillRect(0, 0, c.width, c.height);
    image = c; return true;
  }
  try { const dp = drawPlan; drawPlan = function (...a) { try { fundoBranco(); } catch (e) { console.error('V129', e); } return dp.apply(this, a); }; } catch (e) { console.error('V129', e); }
  window.fundo129 = fundoBranco;
})();
