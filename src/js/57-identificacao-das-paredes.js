// V118 — 05/06. IDENTIFICAÇÃO DAS PAREDES NA PLANTA
//  05. Texto "Parede N" um pouco menor. Parede horizontal: acima ou abaixo, perto da ponta esquerda.
//      Parede vertical: junto da ponta de baixo, de um lado ou do outro. Sem sobrepor; se precisar afastar,
//      sai com seta apontando a parede.
//  06. Arrastar o texto com o Selecionar (na planta principal): a posição fica gravada no projeto e não
//      mexe na parede nem na modulação. Dois cliques no texto: volta para a posição automática.
(function () {
  'use strict';
  const N = Number, $id = id => document.getElementById(id);
  window.lbl118 = { fator: 1.35 };                       // antes 1,8 × o texto da planta
  const FS = 8.4 * 1.35;                                  // tamanho do texto na planta (unidades do desenho)
  const larg = t => t.length * FS * 0.6 + 4, alt = FS + 3;
  const SETA = 6;                                         // a partir desta folga além da face, vai com seta

  function geoW(w) {
    let [a, b] = w.line; if (a.x > b.x || Math.abs(a.x - b.x) < .01 && a.y > b.y) [a, b] = [b, a];
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy); if (!L) return null;
    const k = N(w.planScale) || L / N(w.length), half = N(w.width) * k / 2, hz = Math.abs(dx) >= Math.abs(dy);
    return { a, b, dx, dy, L, half, hz, u: { x: dx / L, y: dy / L } };
  }
  // ponto da parede mais perto de (x,y) e a distância até a face
  function maisPerto(g, x, y) {
    const t = Math.max(0, Math.min(g.L, (x - g.a.x) * g.u.x + (y - g.a.y) * g.u.y)), p = { x: g.a.x + g.u.x * t, y: g.a.y + g.u.y * t };
    const d = Math.hypot(x - p.x, y - p.y); return { p, d, face: d - g.half };
  }
  function seta(g, l) {
    const box = pointsRect25(l.box), cx = box.x + box.w / 2, cy = box.y + box.h / 2, m = maisPerto(g, cx, cy);
    // distância da caixa do texto até a face da parede
    const fx = Math.max(box.x - m.p.x, 0, m.p.x - (box.x + box.w)), fy = Math.max(box.y - m.p.y, 0, m.p.y - (box.y + box.h));
    if (Math.hypot(fx, fy) - g.half <= SETA) return null;
    const vx = cx - m.p.x, vy = cy - m.p.y, vl = Math.hypot(vx, vy) || 1;
    // começa na borda da caixa do texto e termina na face da parede
    const sx = Math.abs(vx) / (box.w / 2 + 1e-9) > Math.abs(vy) / (box.h / 2 + 1e-9) ? (box.w / 2) / Math.abs(vx) : (box.h / 2) / Math.abs(vy);
    return { x1: cx - vx * sx, y1: cy - vy * sx, x2: m.p.x + vx / vl * g.half, y2: m.p.y + vy / vl * g.half };
  }
  function rotulos(walls, page) {
    const barreiras = wallRects25(walls, page), usados = [], out = [];
    const lista = [];
    for (const [i, w] of walls.entries()) { if (!w.line || N(w.page || 1) !== N(page)) continue; const g = geoW(w); if (g) lista.push({ i, w, g }); }
    // primeiro as posições manuais (ocupam o lugar delas), depois as automáticas
    lista.sort((x, y) => (y.w.labelPosition28 ? 1 : 0) - (x.w.labelPosition28 ? 1 : 0));
    for (const { i, w, g } of lista) {
      const texto = 'Parede ' + (i + 1), W0 = larg(texto), H0 = alt;
      const ang = readableAngle(Math.atan2(g.dy, g.dx) * 180 / Math.PI), r = ang * Math.PI / 180;
      const W = Math.abs(Math.cos(r)) * W0 + Math.abs(Math.sin(r)) * H0, H = Math.abs(Math.sin(r)) * W0 + Math.abs(Math.cos(r)) * H0;
      const faz = (x, y) => ({ wall: i + 1, x, y, angle: ang, box: rectPoints25(rect25(x, y, W, H)) });
      let l = null;
      if (w.labelPosition28) l = faz(N(w.labelPosition28.x), N(w.labelPosition28.y));
      else {
        // ao longo da parede: horizontal a partir da ponta esquerda; vertical a partir da ponta de baixo
        const comp = g.hz ? W : H, ini = g.hz ? g.a : (g.a.y > g.b.y ? g.a : g.b), sent = g.hz ? 1 : (ini === g.a ? 1 : -1);
        const passo = Math.max(4, comp / 3), posicoes = [];
        for (let s = comp / 2 + 2 * g.half + 2; s <= g.L - comp / 2; s += passo) posicoes.push(s);
        if (!posicoes.length) posicoes.push(g.L / 2);
        const em = (s, lado, folga) => {
          const t = ini === g.a ? s : g.L - s, px = g.a.x + g.u.x * t, py = g.a.y + g.u.y * t;
          const off = g.half + (g.hz ? H : W) / 2 + folga;
          return g.hz ? faz(px, py + lado * off) : faz(px + lado * off, py);
        };
        busca: for (const folga of [1.5, 4, 8, 14, 22, 34, 50, 75]) for (const s of posicoes) for (const lado of [-1, 1]) {
          const q = em(s, lado, folga), bx = pointsRect25(q.box);
          if (barreiras.some(z => overlap25(bx, z, 1)) || usados.some(z => overlap25(bx, z, 2))) continue;
          l = q; break busca;
        }
        l ??= em(posicoes[0], -1, 1.5);
        void sent;
      }
      const sl = seta(g, l); if (sl) l.seta118 = sl;
      usados.push(pointsRect25(l.box)); out.push(l);
    }
    return out;
  }
  let cacheK = '', cacheV = null;
  const copia = ls => ls.map(l => ({ ...l, box: l.box.map(p => ({ ...p })) }));
  try { PlanEngine.labels = function (walls, page) { try {
    const k = page + '|' + walls.map((w, i) => w.line && N(w.page || 1) === N(page) ? i + ':' + w.line.map(p => p.x + ',' + p.y).join(';') + ':' + w.width + ':' + w.length + ':' + w.planScale + ':' + (w.labelPosition28 ? w.labelPosition28.x + ',' + w.labelPosition28.y : '') : '').join('/');
    if (k !== cacheK) { cacheV = rotulos(walls, page); cacheK = k; }
    return copia(cacheV); } catch (e) { console.error('V118 rótulos', e); return []; } }; } catch (e) { console.error('V118', e); }
  // a posição do texto não é mudança da parede: não pode invalidar a modulação
  try { const ss = sourceSignature; sourceSignature = function (w) { if (!w || !w.labelPosition28) return ss(w); const { labelPosition28, ...rest } = w; return ss(rest); }; } catch (e) { console.error('V118 assinatura', e); }

  // ---------------------------------------------------------------- setas: planta principal (camada de vetor) e pranchas
  const ponta = (s, tam) => { const vx = s.x2 - s.x1, vy = s.y2 - s.y1, L = Math.hypot(vx, vy) || 1, ux = vx / L, uy = vy / L; return `${s.x2},${s.y2} ${s.x2 - ux * tam - uy * tam * .45},${s.y2 - uy * tam + ux * tam * .45} ${s.x2 - ux * tam + uy * tam * .45},${s.y2 - uy * tam - ux * tam * .45}`; };
  const setaSVG = (s, cor, lw, tam, dx = 0, dy = 0) => { const q = { x1: s.x1 - dx, y1: s.y1 - dy, x2: s.x2 - dx, y2: s.y2 - dy }; return `<line x1="${q.x1.toFixed(1)}" y1="${q.y1.toFixed(1)}" x2="${q.x2.toFixed(1)}" y2="${q.y2.toFixed(1)}" stroke="${cor}" stroke-width="${lw}"/><polygon points="${ponta(q, tam)}" fill="${cor}"/>`; };
  const cv = $id('plan'), wrap = $id('planWrap'), sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  sv.id = 'lbl118'; sv.setAttribute('aria-hidden', 'true'); if (wrap) wrap.append(sv);
  function setasPlanta() {
    if (!cv || typeof image === 'undefined' || !image) { sv.innerHTML = ''; return; }
    sv.style.left = cv.offsetLeft + 'px'; sv.style.top = cv.offsetTop + 'px'; sv.style.width = cv.style.width || cv.getBoundingClientRect().width + 'px'; sv.style.height = cv.style.height || cv.getBoundingClientRect().height + 'px';
    sv.setAttribute('viewBox', '0 0 ' + cv.width + ' ' + cv.height);
    const O = cv.planOrigin25 || { x: 0, y: 0 }, escuro = !!window.bg88?.THEMES?.[window.bg88?.get?.().theme]?.dark, cor = escuro ? '#d6e4f2' : '#16456b';
    let h = '';
    try { for (const l of PlanEngine.labels(state.walls, N($id('page')?.value) || 1)) if (l.seta118) h += setaSVG(l.seta118, cor, 0.9, 4, O.x, O.y); } catch {}
    sv.innerHTML = h;
  }
  try { const dp = drawPlan; drawPlan = function (...a) { const r = dp.apply(this, a); try { setasPlanta(); } catch (e) { console.error('V118 setas', e); } return r; }; } catch {}
  try {
    const gs = generalSVG;
    generalSVG = function (g, ...rest) {
      const r = gs.call(this, g, ...rest);
      try {
        if (typeof r === 'string' && g?.labels?.some(l => l.seta118)) {
          const add = g.labels.filter(l => l.seta118).map(l => setaSVG(l.seta118, '#174a78', 0.8, 3.5)).join('');
          const k = r.lastIndexOf('</svg>'); if (k > 0) return r.slice(0, k) + '<g class="setas118">' + add + '</g>' + r.slice(k);
        }
      } catch (e) { console.error('V118 setas prancha', e); }
      return r;
    };
  } catch {}

  // ---------------------------------------------------------------- 06. arrastar o texto na planta principal
  let arr = null, raf = 0;
  const ponto = e => { const r = cv.getBoundingClientRect(), sc = r.width && cv.width ? r.width / cv.width : 1, O = cv.planOrigin25 || { x: 0, y: 0 }; return { x: (e.clientX - r.left) / sc + O.x, y: (e.clientY - r.top) / sc + O.y }; };
  const selecionando = () => { if (window.trena118?.ativo?.()) return false; const t = $id('sT85')?.textContent || ''; return !t || /selecionar/i.test(t); };
  function acha(e) {
    if (!cv || !wrap?.contains(e.target) || typeof image === 'undefined' || !image) return null;
    const p = ponto(e), pg = N($id('page')?.value) || 1;
    let ls = []; try { ls = PlanEngine.labels(state.walls, pg); } catch { return null; }
    for (const l of ls) { const b = pointsRect25(l.box); if (p.x >= b.x - 2 && p.x <= b.x + b.w + 2 && p.y >= b.y - 2 && p.y <= b.y + b.h + 2) return { l, p }; }
    return null;
  }
  document.addEventListener('pointerdown', e => {
    if (e.button !== 0 || !selecionando()) return;
    const h = acha(e); if (!h) return;
    const w = state.walls[h.l.wall - 1]; if (!w) return;
    arr = { w, i: h.l.wall - 1, ini: h.p, orig: { x: h.l.x, y: h.l.y }, antes: w.labelPosition28 ? { ...w.labelPosition28 } : null, moveu: false };
    e.stopImmediatePropagation(); e.preventDefault();
    try { cv.setPointerCapture?.(e.pointerId); } catch {}
  }, true);
  document.addEventListener('pointermove', e => {
    if (!arr) return;
    const p = ponto(e), dx = p.x - arr.ini.x, dy = p.y - arr.ini.y;
    if (!arr.moveu && Math.hypot(dx, dy) < 1.5) return;
    arr.moveu = true; arr.w.labelPosition28 = { x: arr.orig.x + dx, y: arr.orig.y + dy };
    e.stopImmediatePropagation();
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; try { drawPlan(); } catch {} });
  }, true);
  document.addEventListener('pointerup', e => {
    if (!arr) return; const a = arr; arr = null; e.stopImmediatePropagation();
    if (!a.moveu) return;
    try { window.plotSignature26 = ''; } catch {}
    try { typeof plotSignature26 !== 'undefined' && (plotSignature26 = ''); } catch {}
    try { drawPlan(); } catch {}
    try { msg('Texto da Parede ' + (a.i + 1) + ' reposicionado (fica salvo no projeto). Dois cliques no texto voltam para a posição automática.'); } catch {}
  }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && arr) { if (arr.antes) arr.w.labelPosition28 = arr.antes; else delete arr.w.labelPosition28; arr = null; try { drawPlan(); } catch {} } }, true);
  document.addEventListener('dblclick', e => {
    if (!selecionando()) return;
    const h = acha(e); if (!h) return;
    const w = state.walls[h.l.wall - 1]; if (!w?.labelPosition28) return;
    delete w.labelPosition28; e.stopImmediatePropagation(); e.preventDefault();
    try { drawPlan(); msg('Texto da Parede ' + h.l.wall + ' de volta à posição automática.'); } catch {}
  }, true);
  // cursor de mover sobre o texto
  document.addEventListener('pointermove', e => {
    if (arr || !cv || !wrap?.contains(e.target)) return;
    const h = selecionando() ? acha(e) : null; wrap.classList.toggle('lblHover118', !!h);
  });

  const css = document.createElement('style');
  css.textContent = '#lbl118{position:absolute;pointer-events:none;z-index:4;overflow:visible}#planWrap.lblHover118,#planWrap.lblHover118 canvas{cursor:move!important}';
  document.head.append(css);
})();
