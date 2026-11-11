// V126 — 09. LÁPIS DE REFERÊNCIA (camada auxiliar da máscara DXF)
// Linhas, linhas tracejadas e pontos auxiliares desenhados por cima da planta, numa camada própria:
//  • ficam salvos no projeto (junto dos dados da laje/cargas) e por planta/pavimento;
//  • valem como pontos de captura (snap) na Trena, na Nova parede e nas ferramentas da laje (vigas, aberturas…):
//    pontas e meio de cada linha, e os pontos;
//  • servem para completar detalhes que faltaram no DXF (eixo de viga, beiral, alinhamento);
//  • NÃO saem nas pranchas nem no DXF exportado; a máscara original não é alterada.
// Ferramenta: Linha (cliques encadeados; Esc termina) · Tracejada · Ponto · Borracha · Limpar o pavimento.
(function () {
  'use strict';
  const N = Number, $id = id => document.getElementById(id);
  const cv = $id('plan'), wrap = $id('planWrap'); if (!cv || !wrap) return;
  const pg = () => N($id('page')?.value) || 1;
  const lista = () => { let S = null; try { S = window.loads77?.S?.(); } catch {} const o = S || state; if (!Array.isArray(o.ref126)) o.ref126 = []; return o.ref126; };
  const novoId = () => 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  let ativo = false, modo = 'linha', A = null, cursor = null, desfazer = [];
  const sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); sv.id = 'ref126'; sv.setAttribute('aria-hidden', 'true'); wrap.append(sv);
  const escala = () => { const r = cv.getBoundingClientRect(); return r.width && cv.width ? r.width / cv.width : 1; };
  const ponto = e => { const r = cv.getBoundingClientRect(), sc = escala(), O = cv.planOrigin25 || { x: 0, y: 0 }; return { x: (e.clientX - r.left) / sc + O.x, y: (e.clientY - r.top) / sc + O.y }; };

  // pontos de captura do lápis (página atual ou a pedida)
  function pontos(p = pg()) {
    const out = [];
    for (const r of lista()) {
      if (N(r.page) !== N(p)) continue;
      if (r.t === 'p') out.push({ x: r.a.x, y: r.a.y, t: 'ref' });
      else { out.push({ x: r.a.x, y: r.a.y, t: 'ref' }, { x: r.b.x, y: r.b.y, t: 'ref' }, { x: (r.a.x + r.b.x) / 2, y: (r.a.y + r.b.y) / 2, t: 'ref·meio' }); }
    }
    return out;
  }
  window.ref126 = { pontos, lista, ligar: () => ligar(), ativo: () => ativo };
  try { window.trena118?.pontos(p => pontos(p)); } catch {}

  function capturar(P, livre) {
    let Q = null;
    try { Q = window.trena118?.capturar?.(P, livre); } catch {}
    if (!Q) Q = { ...P, t: '' };
    // linha quase horizontal/vertical (até 3°) vira reta, se não capturou um ponto
    if (A && !livre && !Q.t) { const dx = Q.x - A.x, dy = Q.y - A.y, ang = Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI; if (ang < 3) Q = { x: Q.x, y: A.y, t: '' }; else if (ang > 87) Q = { x: A.x, y: Q.y, t: '' }; }
    return Q;
  }

  // ---------------------------------------------------------------- desenho (sempre visível na planta; não vai para as pranchas)
  function desenhar() {
    const R = lista().filter(r => N(r.page) === pg());
    if (!R.length && !ativo) { sv.innerHTML = ''; sv.style.display = 'none'; return; }
    sv.style.display = ''; sv.style.left = cv.offsetLeft + 'px'; sv.style.top = cv.offsetTop + 'px'; sv.style.width = cv.style.width || cv.getBoundingClientRect().width + 'px'; sv.style.height = cv.style.height || cv.getBoundingClientRect().height + 'px';
    sv.setAttribute('viewBox', '0 0 ' + cv.width + ' ' + cv.height);
    const O = cv.planOrigin25 || { x: 0, y: 0 }, sc = escala(), cor = '#e040fb', lw = 1.6 / sc, X = q => (q.x - O.x).toFixed(1), Y = q => (q.y - O.y).toFixed(1);
    let h = '';
    for (const r of R) {
      if (r.t === 'p') { const s = 5 / sc; h += `<g stroke="${cor}" stroke-width="${lw}"><circle cx="${X(r.a)}" cy="${Y(r.a)}" r="${s}" fill="none"/><path d="M${X(r.a) - s * 1.6},${Y(r.a)}h${s * 3.2}M${X(r.a)},${Y(r.a) - s * 1.6}v${s * 3.2}"/></g>`; }
      else h += `<line x1="${X(r.a)}" y1="${Y(r.a)}" x2="${X(r.b)}" y2="${Y(r.b)}" stroke="${cor}" stroke-width="${lw}"${r.tr ? ` stroke-dasharray="${8 / sc} ${5 / sc}"` : ''}/>`;
    }
    if (ativo && A && cursor && (modo === 'linha' || modo === 'trac')) h += `<line x1="${X(A)}" y1="${Y(A)}" x2="${X(cursor)}" y2="${Y(cursor)}" stroke="${cor}" stroke-width="${lw}" stroke-dasharray="${modo === 'trac' ? 8 / sc + ' ' + 5 / sc : 3 / sc + ' ' + 3 / sc}" opacity=".75"/>`;
    if (ativo && cursor) { const s = 6 / sc; h += cursor.t ? `<rect x="${X(cursor) - s}" y="${Y(cursor) - s}" width="${2 * s}" height="${2 * s}" fill="none" stroke="#5fe0ff" stroke-width="${1.5 / sc}"/>` : `<path d="M${X(cursor) - s},${Y(cursor)}h${2 * s}M${X(cursor)},${Y(cursor) - s}v${2 * s}" stroke="#5fe0ff" stroke-width="${1.2 / sc}"/>`; }
    sv.innerHTML = h;
  }
  try { const dp = drawPlan; drawPlan = function (...a) { const r = dp.apply(this, a); try { desenhar(); } catch (e) { console.error('V126', e); } return r; }; } catch {}

  // ---------------------------------------------------------------- barra da ferramenta
  const bar = document.createElement('div'); bar.id = 'ref126bar'; bar.className = 'noPrint'; bar.hidden = true;
  bar.innerHTML = '<b>✏ Lápis de referência</b>' + [['linha', '╱ Linha'], ['trac', '┄ Tracejada'], ['ponto', '⊕ Ponto'], ['apagar', '⌫ Borracha']].map(([k, t]) => `<button type="button" data-m="${k}">${t}</button>`).join('') + '<button type="button" data-a="limpar" title="Apagar todas as referências deste pavimento">Limpar pavimento</button><button type="button" data-a="sair" title="Sair (Esc)">✕</button><span id="ref126msg"></span>';
  document.body.append(bar);
  const dica = { linha: 'Clique no início e nos pontos seguintes (encaixa no DXF, paredes e referências; Shift = ponto livre). Esc termina a linha.', trac: 'Linha tracejada: mesmo jeito da linha. Esc termina.', ponto: 'Clique para marcar um ponto auxiliar.', apagar: 'Clique numa linha ou ponto de referência para apagar.' };
  function marcar() { bar.querySelectorAll('[data-m]').forEach(b => b.classList.toggle('on', b.dataset.m === modo)); const m = $id('ref126msg'); if (m) m.textContent = dica[modo] + ' Ctrl+Z desfaz.'; }
  bar.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.m) { modo = b.dataset.m; A = null; marcar(); desenhar(); return; }
    if (b.dataset.a === 'sair') desligar();
    if (b.dataset.a === 'limpar') { const L = lista(), n = L.filter(r => N(r.page) === pg()).length; if (!n) return; if (!confirm('Apagar as ' + n + ' referência(s) deste pavimento?')) return; desfazer.push(JSON.stringify(L)); L.splice(0, L.length, ...L.filter(r => N(r.page) !== pg())); salvo(); }
  };
  function salvo() { try { window.loads77?.touch?.(); } catch {} desenhar(); }
  function ligar() {
    if (ativo) { desligar(); return; }
    try { window.trena118?.desligar?.(); window.cancelTool56?.(); } catch {}
    ativo = true; A = null; cursor = null; bar.hidden = false; wrap.classList.add('ref126on'); marcar(); desenhar();
    document.querySelectorAll('[data-key="x:Lápis"]').forEach(b => b.classList.add('on'));
  }
  function desligar() { ativo = false; A = null; cursor = null; bar.hidden = true; wrap.classList.remove('ref126on'); desenhar(); document.querySelectorAll('[data-key="x:Lápis"]').forEach(b => b.classList.remove('on')); }

  // ---------------------------------------------------------------- cliques
  const noDesenho = e => wrap.contains(e.target) && !e.target.closest('button,input,select,#geo116');
  function maisPerto(P) {
    const tol = 8 / escala(); let best = null, bd = tol;
    for (const r of lista()) {
      if (N(r.page) !== pg()) continue;
      let d;
      if (r.t === 'p') d = Math.hypot(P.x - r.a.x, P.y - r.a.y);
      else { const dx = r.b.x - r.a.x, dy = r.b.y - r.a.y, l = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((P.x - r.a.x) * dx + (P.y - r.a.y) * dy) / l)); d = Math.hypot(P.x - r.a.x - t * dx, P.y - r.a.y - t * dy); }
      if (d < bd) { bd = d; best = r; }
    }
    return best;
  }
  document.addEventListener('pointerdown', e => {
    if (!ativo || !noDesenho(e)) return;
    if (e.button === 2) { e.preventDefault(); e.stopImmediatePropagation(); if (A) { A = null; desenhar(); } else desligar(); return; }
    if (e.button !== 0) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const L = lista(), P = capturar(ponto(e), e.shiftKey);
    if (modo === 'apagar') { const r = maisPerto(ponto(e)); if (r) { desfazer.push(JSON.stringify(L)); L.splice(L.indexOf(r), 1); salvo(); } return; }
    if (modo === 'ponto') { desfazer.push(JSON.stringify(L)); L.push({ id: novoId(), page: pg(), t: 'p', a: { x: P.x, y: P.y } }); salvo(); return; }
    if (!A) { A = P; desenhar(); return; }
    if (Math.hypot(P.x - A.x, P.y - A.y) * escala() < 2) return;
    desfazer.push(JSON.stringify(L)); L.push({ id: novoId(), page: pg(), t: 'l', tr: modo === 'trac', a: { x: A.x, y: A.y }, b: { x: P.x, y: P.y } }); A = P; salvo();
  }, true);
  document.addEventListener('pointermove', e => { if (!ativo || !noDesenho(e)) return; cursor = modo === 'apagar' ? { ...ponto(e), t: '' } : capturar(ponto(e), e.shiftKey); desenhar(); }, true);
  for (const tp of ['pointerup', 'click']) document.addEventListener(tp, e => { if (ativo && noDesenho(e)) e.stopImmediatePropagation(); }, true);
  document.addEventListener('contextmenu', e => { if (ativo && noDesenho(e)) e.preventDefault(); }, true);
  document.addEventListener('keydown', e => {
    if (!ativo || e.target?.closest?.('input,textarea,select')) return;
    if (e.key === 'Escape') { e.stopImmediatePropagation(); if (A) { A = null; desenhar(); } else desligar(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && desfazer.length) { e.preventDefault(); e.stopImmediatePropagation(); const L = lista(); L.splice(0, L.length, ...JSON.parse(desfazer.pop())); A = null; salvo(); }
  }, true);

  const css = document.createElement('style');
  css.textContent = `#ref126{position:absolute;pointer-events:none;z-index:6;overflow:visible}#planWrap.ref126on,#planWrap.ref126on canvas{cursor:crosshair!important}
#ref126bar{position:fixed;left:50%;top:100px;transform:translateX(-50%);z-index:80;display:flex;gap:5px;align-items:center;flex-wrap:wrap;max-width:calc(100vw - 160px);background:#fff;border:1px solid #d9a6e6;border-radius:9px;padding:5px 9px;box-shadow:0 8px 22px #0003;font:12.5px "Segoe UI",Arial,sans-serif;color:#3a1747}
#ref126bar[hidden]{display:none}#ref126bar b{color:#9c27b0;margin-right:4px}#ref126bar button{margin:0!important;padding:4px 9px!important;height:auto!important;min-height:0!important;border-radius:6px!important;border:1px solid #e1bee7!important;background:#fff!important;color:#3a1747!important;box-shadow:none!important;font:12px "Segoe UI",Arial,sans-serif!important;cursor:pointer}
#ref126bar button.on{background:#9c27b0!important;border-color:#9c27b0!important;color:#fff!important}#ref126msg{color:#6a4a75;font-size:11.5px;max-width:420px}`;
  document.head.append(css);
})();
