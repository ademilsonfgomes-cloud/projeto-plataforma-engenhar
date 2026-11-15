// V118 — 08. TRENA: mede a distância entre dois pontos da planta, com captura (snap) nos pontos da máscara DXF,
// pontas e cantos das paredes, e no eixo/faces das paredes. Medida em cm (escala da planta), com Δx e Δy.
// Clique no 1º ponto, clique no 2º: a medida fica na tela. Pode medir várias. Esc ou botão direito: sai e limpa.
// Shift: sem captura (ponto livre).
(function () {
  'use strict';
  const N = Number, $id = id => document.getElementById(id);
  const cv = $id('plan'), wrap = $id('planWrap'); if (!cv || !wrap) return;
  const pg = () => N($id('page')?.value) || 1;
  const kPg = () => { if (typeof pxCm === 'number' && pxCm > 0) return pxCm; const w = state.walls.find(w => w.line && N(w.page || 1) === pg() && N(w.planScale) > 0); return w ? N(w.planScale) : 1; };
  const fmt = v => (Math.round(v * 10) / 10).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  let ativo = false, A = null, cursor = null, medidas = [], snapAtual = null, ferrAntes = '';
  const extras = [];                                       // outras ferramentas (ex.: lápis de referência) podem somar pontos
  const sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); sv.id = 'trena118'; sv.setAttribute('aria-hidden', 'true'); wrap.append(sv);
  const escala = () => { const r = cv.getBoundingClientRect(); return r.width && cv.width ? r.width / cv.width : 1; };
  const ponto = e => { const r = cv.getBoundingClientRect(), sc = escala(), O = cv.planOrigin25 || { x: 0, y: 0 }; return { x: (e.clientX - r.left) / sc + O.x, y: (e.clientY - r.top) / sc + O.y }; };

  // ---------------------------------------------------------------- captura
  function vertices() {
    const out = [], p = pg(), k = kPg();
    try { for (const q of (typeof fixedPoints !== 'undefined' && fixedPoints) || []) out.push({ x: q.x, y: q.y, t: 'DXF' }); } catch {}
    for (const w of state.walls) {
      if (!w.line || N(w.page || 1) !== p) continue;
      const [a, b] = w.line, L = Math.hypot(b.x - a.x, b.y - a.y); if (!L) continue;
      const ux = (b.x - a.x) / L, uy = (b.y - a.y) / L, h = (N(w.width) || 14) * k / 2;
      out.push({ ...a, t: 'ponta' }, { ...b, t: 'ponta' });
      for (const E of [a, b]) for (const s of [-1, 1]) out.push({ x: E.x - uy * h * s, y: E.y + ux * h * s, t: 'canto' });
      for (const o of w.openings || []) for (const t of [N(o.start), N(o.start) + N(o.width)]) for (const s of [-1, 1]) out.push({ x: a.x + ux * t * k - uy * h * s, y: a.y + uy * t * k + ux * h * s, t: 'vão' });
    }
    for (const f of extras) { try { out.push(...f(p)); } catch {} }
    return out;
  }
  function linhas() {
    const out = [], p = pg(), k = kPg();
    for (const w of state.walls) {
      if (!w.line || N(w.page || 1) !== p) continue;
      const [a, b] = w.line, L = Math.hypot(b.x - a.x, b.y - a.y); if (!L) continue;
      const ux = (b.x - a.x) / L, uy = (b.y - a.y) / L, h = (N(w.width) || 14) * k / 2;
      out.push({ a, ux, uy, L, t: 'eixo' });
      for (const s of [-1, 1]) out.push({ a: { x: a.x - uy * h * s, y: a.y + ux * h * s }, ux, uy, L, t: 'face' });
    }
    return out;
  }
  function capturar(P, livre) {
    if (livre) return { ...P, t: '' };
    const tol = 10 / escala();
    let b = null, bd = tol;
    // cantos das faces valem um pouco menos que pontas e pontos do DXF (ficam a poucos pixels um do outro)
    for (const q of vertices()) { const d = Math.hypot(q.x - P.x, q.y - P.y) + (q.t === 'canto' || q.t === 'vão' ? 4 / escala() : 0); if (d < bd) { bd = d; b = q; } }
    if (b) return { x: b.x, y: b.y, t: b.t };
    let e = null, ed = tol * .8;
    for (const l of linhas()) {
      const t = Math.max(0, Math.min(l.L, (P.x - l.a.x) * l.ux + (P.y - l.a.y) * l.uy)), X = { x: l.a.x + l.ux * t, y: l.a.y + l.uy * t }, d = Math.hypot(X.x - P.x, X.y - P.y);
      if (d < ed) { ed = d; e = { ...X, t: l.t }; }
    }
    return e || { ...P, t: '' };
  }

  // ---------------------------------------------------------------- desenho
  function texto(x, y, t, fs, cor, ang = 0) {
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${fs.toFixed(2)}" font-family="Segoe UI,Arial" font-weight="700" fill="${cor}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${ang.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" stroke="rgba(0,0,0,.55)" stroke-width="${(fs * .22).toFixed(2)}" paint-order="stroke">${t}</text>`;
  }
  function cota(P, Q, cor, sc, k, viva) {
    const dx = Q.x - P.x, dy = Q.y - P.y, L = Math.hypot(dx, dy); if (L < 1e-6) return '';
    const O = cv.planOrigin25 || { x: 0, y: 0 }, X = p => (p.x - O.x), Y = p => (p.y - O.y);
    let ang = Math.atan2(dy, dx) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
    const nx = -dy / L, ny = dx / L, fs = 12 / sc, t = 5 / sc, mx = (P.x + Q.x) / 2 + nx * 9 / sc, my = (P.y + Q.y) / 2 + ny * 9 / sc;
    const cm = L / k, ddx = Math.abs(dx) / k, ddy = Math.abs(dy) / k;
    let h = `<line x1="${X(P)}" y1="${Y(P)}" x2="${X(Q)}" y2="${Y(Q)}" stroke="${cor}" stroke-width="${1.6 / sc}"${viva ? ` stroke-dasharray="${6 / sc} ${4 / sc}"` : ''}/>`;
    for (const E of [P, Q]) h += `<line x1="${X(E) - nx * t}" y1="${Y(E) - ny * t}" x2="${X(E) + nx * t}" y2="${Y(E) + ny * t}" stroke="${cor}" stroke-width="${1.6 / sc}"/>`;
    h += texto(mx - O.x, my - O.y, fmt(cm) + ' cm', fs, cor, ang);
    if (ddx > .5 && ddy > .5) h += texto(mx - O.x, my - O.y + 14 / sc, 'Δx ' + fmt(ddx) + ' · Δy ' + fmt(ddy), fs * .72, cor, 0);
    return h;
  }
  function marca(s, sc, cor) {
    if (!s) return '';
    const O = cv.planOrigin25 || { x: 0, y: 0 }, x = s.x - O.x, y = s.y - O.y, r = 6 / sc;
    const forma = s.t === 'ponta' || s.t === 'canto' || s.t === 'DXF' || s.t === 'vão' ? `<rect x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}" fill="none" stroke="${cor}" stroke-width="${1.6 / sc}"/>` : s.t ? `<path d="M${x - r},${y + r}L${x},${y - r}L${x + r},${y + r}Z" fill="none" stroke="${cor}" stroke-width="${1.6 / sc}"/>` : `<path d="M${x - r},${y}H${x + r}M${x},${y - r}V${y + r}" stroke="${cor}" stroke-width="${1.2 / sc}"/>`;
    return forma + (s.t ? texto(x + 2.2 * r, y - 2.2 * r, s.t, 9 / sc, cor) : '');
  }
  function desenhar() {
    if (!ativo && !medidas.length) { sv.innerHTML = ''; sv.style.display = 'none'; return; }
    sv.style.display = ''; sv.style.left = cv.offsetLeft + 'px'; sv.style.top = cv.offsetTop + 'px'; sv.style.width = cv.style.width || cv.getBoundingClientRect().width + 'px'; sv.style.height = cv.style.height || cv.getBoundingClientRect().height + 'px';
    sv.setAttribute('viewBox', '0 0 ' + cv.width + ' ' + cv.height);
    const sc = escala(), k = kPg(), cor = '#ffcc00', viva = '#5fe0ff';
    let h = medidas.filter(m => m.page === pg()).map(m => cota(m.A, m.B, cor, sc, k)).join('');
    if (ativo && A && cursor) h += cota(A, cursor, viva, sc, k, true);
    if (ativo) h += marca(snapAtual, sc, viva);
    sv.innerHTML = h;
  }
  try { const dp = drawPlan; drawPlan = function (...a) { const r = dp.apply(this, a); try { desenhar(); } catch {} return r; }; } catch {}

  // ---------------------------------------------------------------- ferramenta
  function ligar() {
    if (ativo) { desligar(); return; }
    try { window.cancelTool56?.(); } catch {}
    ativo = true; A = null; cursor = null; medidas = [];
    const st = $id('sT85'); if (st) { ferrAntes = st.textContent; st.textContent = 'Trena'; }
    wrap.classList.add('trena118');
    try { msg('📏 Trena: clique no 1º ponto e depois no 2º. Captura nos pontos do DXF, pontas, cantos, vãos e faces das paredes (Shift = ponto livre). Esc ou botão direito: sair.'); } catch {}
    desenhar(); marcarBotao();
  }
  function desligar() {
    ativo = false; A = null; cursor = null; snapAtual = null; medidas = [];
    const st = $id('sT85'); if (st && st.textContent === 'Trena') st.textContent = ferrAntes || 'Selecionar';
    wrap.classList.remove('trena118'); desenhar(); marcarBotao();
  }
  function marcarBotao() { document.querySelectorAll('[data-key="x:Trena"]').forEach(b => b.classList.toggle('on', ativo)); }
  const noDesenho = e => wrap.contains(e.target) && !e.target.closest('#geo116,.hud88,button,input,select');
  document.addEventListener('pointerdown', e => {
    if (!ativo || !noDesenho(e)) return;
    if (e.button === 2) { e.preventDefault(); e.stopImmediatePropagation(); desligar(); return; }
    if (e.button !== 0) return;                                  // rodinha/botão do meio: zoom e arrastar continuam
    e.preventDefault(); e.stopImmediatePropagation();
    const P = capturar(ponto(e), e.shiftKey);
    if (!A) { A = P; cursor = P; }
    else {
      const k = kPg(), m = { A, B: P, page: pg() }, cm = Math.hypot(P.x - A.x, P.y - A.y) / k;
      if (cm > 0.05) { medidas.push(m); try { msg('📏 ' + fmt(cm) + ' cm  (Δx ' + fmt(Math.abs(P.x - A.x) / k) + ' · Δy ' + fmt(Math.abs(P.y - A.y) / k) + ' cm). Clique para outra medida; Esc para sair.'); } catch {} }
      A = null;
    }
    desenhar();
  }, true);
  document.addEventListener('pointermove', e => {
    if (!ativo) return;
    if (!noDesenho(e)) return;
    snapAtual = capturar(ponto(e), e.shiftKey); cursor = snapAtual;
    desenhar();
  }, true);
  document.addEventListener('pointerup', e => { if (ativo && noDesenho(e) && e.button === 0) e.stopImmediatePropagation(); }, true);
  document.addEventListener('click', e => { if (ativo && noDesenho(e)) e.stopImmediatePropagation(); }, true);
  document.addEventListener('contextmenu', e => { if (ativo && noDesenho(e)) e.preventDefault(); }, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && ativo) { if (A) { A = null; desenhar(); } else desligar(); e.stopImmediatePropagation(); }
  }, true);
  window.trena118 = { ligar, desligar, ativo: () => ativo, medidas: () => medidas.slice(), pontos: f => extras.push(f), capturar: (P, l) => capturar(P, l) };

  const css = document.createElement('style');
  css.textContent = '#trena118{position:absolute;pointer-events:none;z-index:7;overflow:visible}#planWrap.trena118,#planWrap.trena118 canvas{cursor:crosshair!important}';
  document.head.append(css);
})();
