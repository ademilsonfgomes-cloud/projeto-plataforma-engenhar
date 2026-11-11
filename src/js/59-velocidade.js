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
  // (Adiar a remontagem dos resultados na troca de nível foi testado e retirado: a cadeia da remontagem também
  //  ajusta a própria modulação — ex.: complemento da altura livre — e não pode ser pulada.)
  //
  // Troca de nível (Laje ⇄ Paredes de cima, ou outro pavimento): ao voltar para um nível cujo resultado não mudou,
  // a tela de resultados já montada é recolocada em vez de remontada. A chave inclui paredes, resultados, estado do
  // projeto e todos os campos da tela: se qualquer coisa mudar, remonta normalmente. Junto com os desenhos ficam os
  // resultados como a cadeia da remontagem os deixou (ajustes como o complemento da altura livre), para a modulação
  // ficar idêntica à de uma remontagem completa.
  const cache = new Map(), MAX = 4;
  // campos da tela que mudam o desenho, por nome (ordem estável). Fora: sem nome, seleção/nível atual (nível e
  // paredes já entram pela chave por outros dados) e campos criados pela própria montagem.
  const FORA = /^(wsel85|lvl85|lvl92|lvlSel68|mk100ref|autoLock76|org107f[nz]|page)$/;
  const campos = () => { const out = {}; for (const el of document.querySelectorAll('input,select,textarea')) { const id = el.id || el.name; if (!id || FORA.test(id) || el.type === 'file' || el.closest('#output,#plotSheets26,#geo116,#exp109,#genReport57')) continue; out[id] = el.type === 'checkbox' || el.type === 'radio' ? el.checked : el.value; } return Object.keys(out).sort().map(k => [k, out[k]]); };
  // dados que a própria remontagem recalcula (saída, não entrada): ficam fora da chave e são guardados/restaurados
  const DERIV = ['steel', 'junctionReports'];
  const projeto = () => { const o = {}; for (const [k, v] of Object.entries(state)) if (k !== 'results' && k !== 'savedResults' && k !== 'enc109' && !DERIV.includes(k)) o[k] = v; return o; };
  function chave(res) {
    if (window.__v119semCache || !Array.isArray(res) || res.length !== state.walls.length || !res.length) return null;
    let cargas = null; try { cargas = window.loads77?.S?.(); } catch {}
    // os avisos de cada parede são acumulados a cada remontagem (repetem): não entram na chave
    const semAvisos = res.map(m => { if (!m || typeof m !== 'object') return m; const { warnings, ...r } = m; return r; });
    const partes = [semAvisos, projeto(), cargas, campos(), document.body.dataset.v85 || ''];
    if (window.__v119dbg) (window.__v119k ??= []).push(partes.map(p => JSON.stringify(p)));
    return JSON.stringify(partes);
  }
  let acertos = 0;
  try {
    const rr = renderResults;
    renderResults = function (...a) {
      const out = $('output'), res = a[1];
      let k = null; try { k = chave(res); } catch { k = null; }
      const c = k && cache.get(k);
      if (c && out) {
        out.replaceChildren(...c.nodes);
        const pos = JSON.parse(c.pos); for (let i = 0; i < res.length; i++) res[i] = pos[i];
        const der = JSON.parse(c.der); for (const n of DERIV) { if (n in der) state[n] = der[n]; else delete state[n]; }
        cache.delete(k); cache.set(k, c); acertos++;
        try { window.report57?.(); } catch {}
        return;
      }
      const r = semAtalho(() => rr.apply(this, a));
      if (k && out) {
        try {
          const der = {}; for (const n of DERIV) if (n in state) der[n] = state[n];
          const e = { nodes: [...out.childNodes], pos: JSON.stringify(res), der: JSON.stringify(der) };
          cache.set(k, e);
          let k2 = null; try { k2 = chave(res); } catch {}      // chave com os resultados já ajustados pela cadeia
          if (k2 && k2 !== k) cache.set(k2, e);
          while (cache.size > MAX) cache.delete(cache.keys().next().value);
        } catch {}
      }
      return r;
    };
  } catch (e) { console.error('V119', e); }
  window.vel119.cache = { tamanho: () => cache.size, acertos: () => acertos, limpar: () => cache.clear() };

  // Área da união de polígonos (volume de graute/argamassa): antes comparava todas as arestas de todas as paredes
  // entre si. Agora separa os polígonos em grupos que se tocam e soma — mesmo resultado, muito mais rápido.
  try {
    const au = areaUnion34;
    areaUnion34 = function (polys) {
      if (!Array.isArray(polys) || polys.length < 6 || window.__v119semGrupo) return au(polys);
      const bb = polys.map(p => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const q of p) { if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x; if (q.y < y0) y0 = q.y; if (q.y > y1) y1 = q.y; } return [x0, y0, x1, y1]; });
      const pai = polys.map((_, i) => i), raiz = i => { while (pai[i] !== i) { pai[i] = pai[pai[i]]; i = pai[i]; } return i; };
      const ordem = polys.map((_, i) => i).sort((i, j) => bb[i][0] - bb[j][0]);
      for (let a = 0; a < ordem.length; a++) {
        const i = ordem[a];
        for (let b = a + 1; b < ordem.length; b++) {
          const j = ordem[b]; if (bb[j][0] > bb[i][2] + 1e-6) break;
          if (bb[j][1] <= bb[i][3] + 1e-6 && bb[j][3] >= bb[i][1] - 1e-6) { const ri = raiz(i), rj = raiz(j); if (ri !== rj) pai[ri] = rj; }
        }
      }
      const grupos = new Map(); polys.forEach((p, i) => { const r = raiz(i); if (!grupos.has(r)) grupos.set(r, []); grupos.get(r).push(p); });
      let area = 0; for (const g of grupos.values()) area += au(g);
      return area;
    };
  } catch (e) { console.error('V119 áreas', e); }
})();
