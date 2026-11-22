// V151 — PRANCHAS NO PADRÃO ENGENHAR (o mesmo do Engenhar Metálicas e do Engenhar Muros)
// Usa o módulo comum ENG_PLOT (arquivo 71a, cópia de comum/engenhar_plotagem.js — não editar a cópia):
//  • folha: moldura (20 mm à esquerda para encadernar, 10 mm nos demais lados), faixa técnica à direita com ÍNDICE DE
//    PRANCHAS (1ª folha), QUADRO DE REVISÕES e NOTAS EXECUTIVAS, e o carimbo Engenhar na base da faixa
//    (contratante, CPF/CNPJ, endereço, bairro, lote, quadra, cidade, UF, responsável técnico, CREA, revisão, conteúdo, folha nº/total);
//  • arrumação automática POR TEMA: plantas de 1ª e 2ª fiada de cada pavimento → elevações de cada pavimento → lajes,
//    vigas e reforços → mapa de cargas → quantitativos; cada tema começa em folha nova e os quadros se encaixam sem vazios;
//  • botões como na metálica: Ver pranchas · Mover desenhos · Otimizar pranchas · Voltar à arrumação automática · PDF · DXF.
// Os desenhos, as escalas por tipo, o PDF, o DXF e o arraste continuam os mesmos do programa.
(function () {
  'use strict';
  if (typeof ENG_PLOT === 'undefined' || typeof buildPlot26 !== 'function') return;
  const E = ENG_PLOT, N = v => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
  const escH = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const L7 = () => window.loads77;
  const store = () => { let s = null; try { s = L7()?.S?.(); } catch {} s = s || (state.eng151s ??= {}); s.eng151 ??= {}; return s.eng151; };
  const on = () => !window.__v151off;
  const fmtOri = () => { let s = {}; try { s = plotSettings26(); } catch {} return [s.format || 'A1', s.orientation || 'landscape']; };
  const geo = () => { const [f, o] = fmtOri(); return E.sheet(f, o); };
  const GAP = 6;

  // ---------------------------------------------------------------- notas executivas (editáveis no painel do carimbo)
  const NOTAS0 = [
    'Medidas em centímetros e níveis em metros, salvo indicação. Não medir no desenho: valem as cotas.',
    'Ler em conjunto com os projetos de arquitetura, fundações e instalações. Divergências devem ser informadas ao projetista antes da execução.',
    'Normas: ABNT NBR 16868-1, -2 e -3 (alvenaria estrutural), NBR 6136 (blocos de concreto), NBR 6118 (concreto) e NBR 7480 (aço).',
    'Blocos estruturais com fbk indicado por pavimento; seguir a paginação das plantas de 1ª e 2ª fiada e das elevações, sem cortes não indicados.',
    'Juntas horizontais e verticais de 1 cm, cheias. Marcar a 1ª fiada a partir dos eixos, conferindo esquadro, prumo e nível.',
    'Graute com fgk indicado, agregado até 9,5 mm, lançado no mínimo 24 h após o assentamento; janela de inspeção na 1ª fiada.',
    'Armaduras em aço CA-50/CA-60 nas posições das elevações (N); esperas da fundação/laje na posição exata dos furos grauteados.',
    'Canaletas U/J nas cintas de respaldo, vergas e contravergas, armadas e grauteadas conforme as elevações.',
    'Lajes, vigas e reforços conforme as plantas de laje; escoramento e retirada de escoras conforme o fabricante.',
    'É proibido rasgar a alvenaria estrutural para embutir tubulações horizontais ou abrir vãos não previstos.',
    'Qualquer alteração deve ser autorizada pelo responsável técnico antes da execução.'
  ];
  const notas = () => { const t = store().notas; if (typeof t === 'string' && t.trim()) return t.split(/\n+/).map(s => s.replace(/^\s*\d+[.)-]?\s*/, '').trim()).filter(Boolean); return NOTAS0; };

  // ---------------------------------------------------------------- temas
  const nivelDe = (t, q) => {
    const ms = [...String(t || '').matchAll(/·\s*([^·]*?\(([+\-−]?\d+[.,]\d+)\s*m\))/g)], m = ms.at(-1);
    if (m) return { nome: m[1].trim(), v: N(m[2].replace('−', '-').replace(',', '.')) };
    try { const n = numParede(t); const w = n && state.walls[n - 1]; if (w && window.levelTag53) { const tg = levelTag53(w.page || 1), m2 = String(tg).match(/([^·]*?\(([+\-−]?\d+[.,]\d+)\s*m\))/); if (m2) return { nome: m2[1].trim(), v: N(m2[2].replace('−', '-').replace(',', '.')) }; } } catch {}
    return { nome: '', v: 0 };
  };
  function temaDe(q) {
    const t = q.title || '';
    if (q.load77 || /^Mapa de cargas/.test(t)) return { k: 'CAR', o: 4, nome: 'MAPA DE CARGAS', cod: 'CAR' };
    if (q.slab95 || q.slab82 || q.arm106 || q.el97 || (!/fiada · planta|^Paredes? \d/.test(t) && /lajes?\b|^Vigas|^Reforços|^Armaduras das lajes|^Detalhe/i.test(t))) return { k: 'LAJ', o: 3, nome: 'LAJES, VIGAS E REFORÇOS', cod: 'LAJ' };
    if (/fiada · planta/.test(t)) { const n = nivelDe(t); return { k: 'PLA|' + n.v, o: 1, v: n.v, nome: 'PLANTAS DE 1ª E 2ª FIADAS' + (n.nome ? ' · ' + n.nome.toUpperCase().replace(/ M\)$/, ' m)') : ''), cod: 'PAG' }; }
    if (/^Parede(s)? \d+/.test(t)) { const n = nivelDe(t); return { k: 'ELE|' + n.v, o: 2, v: n.v, nome: 'ELEVAÇÕES' + (n.nome ? ' · ' + n.nome.toUpperCase().replace(/ M\)$/, ' m)') : ''), cod: 'ELE' }; }
    return { k: 'QUA', o: 5, nome: 'QUANTITATIVOS E RESISTÊNCIAS', cod: 'QUA' };
  }
  const numParede = t => { const m = String(t).match(/^Paredes? (\d+)/); return m ? +m[1] : 0; };

  // ---------------------------------------------------------------- encaixe (retângulos livres; de cima para baixo, da esquerda para a direita)
  // V152 — sem vazios: além da área de desenho, a faixa da direita ABAIXO das notas (e do índice, na 1ª folha) também
  // recebe desenhos, como na metálica
  const nulo = { line() {}, rect() {}, text() {}, image() {} };
  function faixaLivre(i, n) {
    try {
      const S = geo(), x = S.strip.x, w = S.strip.w, fim = S.stamp.y - 4; let y = S.strip.y;
      if (i === 0 && n > 0) { y += E.index(nulo, x, y, w, Array.from({ length: n }, () => ({ title: 'X', scale: '1:50' }))) + 4; const revs = store().revs || []; if (revs.length) y += E.revTable(nulo, x, y, w, revs) + 4; }
      if (fim - y > 30) y += E.notes(nulo, x, y, w, fim - y, notas()) + 6;
      const h = fim - y; return h >= 30 ? { x: x + 2, y, w: w - 4, h } : null;
    } catch { return null; }
  }
  function novaFolha(A, i, n) { const F = { items: [], livres: [{ x: A.x, y: A.y, w: A.x1 - A.x + GAP, h: A.y1 - A.y + GAP }] }; const r = faixaLivre(i, n); if (r) F.livres.push({ x: r.x, y: r.y, w: r.w + GAP, h: r.h + GAP }); return F; }
  function lugar(F, w, h) { let best = null; for (const r of F.livres) { if (w + GAP <= r.w + 1e-6 && h + GAP <= r.h + 1e-6) { const sc = r.y * 10000 + r.x; if (!best || sc < best.sc) best = { x: r.x, y: r.y, sc }; } } return best; }
  function ocupa(F, x, y, w, h) {
    const W = w + GAP, H = h + GAP, nov = [];
    for (const r of F.livres) {
      if (x >= r.x + r.w || x + W <= r.x || y >= r.y + r.h || y + H <= r.y) { nov.push(r); continue; }
      if (x > r.x) nov.push({ x: r.x, y: r.y, w: x - r.x, h: r.h });
      if (x + W < r.x + r.w) nov.push({ x: x + W, y: r.y, w: r.x + r.w - x - W, h: r.h });
      if (y > r.y) nov.push({ x: r.x, y: r.y, w: r.w, h: y - r.y });
      if (y + H < r.y + r.h) nov.push({ x: r.x, y: y + H, w: r.w, h: r.y + r.h - y - H });
    }
    F.livres = nov.filter((a, i) => a.w > 1 && a.h > 1 && !nov.some((b, j) => j !== i && b.x <= a.x + 1e-6 && b.y <= a.y + 1e-6 && b.x + b.w >= a.x + a.w - 1e-6 && b.y + b.h >= a.y + a.h - 1e-6 && (j < i || b.w * b.h > a.w * a.h + 1e-6)));
  }
  function poe(F, q) {
    const vs = [q]; if (q.alt59 && q.alt59.w && q.alt59.h) vs.push({ ...q, ...q.alt59, alt59: undefined });
    let best = null; for (const v of vs) { const p = lugar(F, v.w, v.h); if (p && (!best || p.sc < best.p.sc - 1e-6 || (Math.abs(p.sc - best.p.sc) < 1e-6 && v.w * v.h < best.v.w * best.v.h))) best = { v, p }; }
    if (!best) return false;
    ocupa(F, best.p.x, best.p.y, best.v.w, best.v.h); F.items.push({ ...best.v, x: best.p.x, y: best.p.y }); return true;
  }
  function grupos(items) {
    const m = new Map();
    for (const q of items) { const t = temaDe(q); if (!m.has(t.k)) m.set(t.k, { t, its: [] }); m.get(t.k).its.push(q); }
    const G = [...m.values()].sort((a, b) => a.t.o - b.t.o || (a.t.v || 0) - (b.t.v || 0));
    for (const g of G) {
      if (g.t.o === 2) g.its.sort((a, b) => numParede(a.title) - numParede(b.title));
      if (g.t.o === 1) g.its.sort((a, b) => (/^Segunda/.test(a.title) ? 1 : 0) - (/^Segunda/.test(b.title) ? 1 : 0));
    }
    return G;
  }
  // encaixa na ordem dada: cada quadro vai no primeiro espaço livre que couber, olhando as folhas já abertas (preenche os
  // buracos das folhas anteriores antes de abrir folha nova)
  function fluxo(lista, n) {
    const A = geo().area, out = [];
    for (const q of lista) {
      let ok = false; for (const F of out) if (poe(F, q)) { ok = true; break; }
      if (!ok) { const F = novaFolha(A, out.length, n); out.push(F); if (!poe(F, q)) F.items.push({ ...q, x: A.x, y: A.y }); }
    }
    return out;
  }
  const area = F => F.items.reduce((s, q) => s + q.w * q.h, 0);
  function empacotar(items, otimizar) {
    const G = grupos(items);
    const ordens = [G.flatMap(g => g.its)];                                                 // ordem dos temas e da numeração
    ordens.push(G.flatMap(g => g.its.slice().sort((a, b) => b.h - a.h || b.w - a.w)));          // por tema, maiores primeiro
    if (otimizar) { ordens.push(items.slice().sort((a, b) => b.w * b.h - a.w * a.h)); ordens.push(items.slice().sort((a, b) => b.h - a.h || b.w - a.w)); }
    let best = null;
    for (const [k, L] of ordens.entries()) {
      let n = Math.max(1, Math.ceil(items.reduce((s, q) => s + q.w * q.h, 0) / 2e5)), F = null;
      for (let it = 0; it < 4; it++) { F = fluxo(L, n); if (F.length === n) break; n = F.length; }
      const sc = F.length * 1000 + k;                                                       // menos folhas; empate: ordem natural
      if (!best || sc < best.sc) best = { F, sc };
    }
    return best.F.map(F => ({ items: F.items }));
  }

  // ---------------------------------------------------------------- área útil vista pela montagem dos quadros
  try {
    const cp = collectPlot26;
    collectPlot26 = function (...a) {
      if (!on()) return cp.apply(this, a);
      const S = geo(), aw = S.area.x1 - S.area.x, ah = S.area.y1 - S.area.y, real = sheetSize26;
      let cw = 0; try { cw = window.noteCol95?.() || 0; } catch {}
      sheetSize26 = function () { return [aw + 20 + (cw ? cw + 6 : 0), ah + 56 - (cw ? 36 : 0)]; };
      try { return cp.apply(this, a); } finally { sheetSize26 = real; }
    };
  } catch (e) { console.error('V151 área', e); }
  try { const pk = packPlot29; packPlot29 = function (items, w, h) { if (!on()) return pk.call(this, items, w, h); return empacotar(items, !!window.__otim151); }; } catch (e) { console.error('V151 encaixe', e); }
  try { const pf = plotPositionFree33; plotPositionFree33 = function (sheet, item, x, y) { if (!on()) return pf.apply(this, arguments); const A = geo().area, fx = faixaLivre(plotSheets26.indexOf(sheet), plotSheets26.length), dentro = (x >= A.x - .01 && y >= A.y - .01 && x + item.w <= A.x1 + .01 && y + item.h <= A.y1 + .01) || (fx && x >= fx.x - .01 && y >= fx.y - .01 && x + item.w <= fx.x + fx.w + .01 && y + item.h <= fx.y + fx.h + .01); return dentro && !sheet.items.some(q => q !== item && overlap25({ x, y, w: item.w, h: item.h }, q, 0)); }; } catch (e) { console.error('V151 posição', e); }

  // ---------------------------------------------------------------- folha: moldura, faixa técnica e carimbo (SVG em mm)
  function desenhista() {
    const o = [];
    const ln = l => l === 'MOLDURA' ? .5 : l === 'CARIMBO' ? .35 : .25;
    return {
      o,
      line: (x1, y1, x2, y2, l) => o.push(`<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="#000" stroke-width="${ln(l)}"/>`),
      rect: (x, y, w, h, l) => o.push(`<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="none" stroke="#000" stroke-width="${ln(l)}"/>`),
      text: (x, y, s, p = {}) => { const h = p.h || 2.5; o.push(`<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-family="Arial,Helvetica,sans-serif" font-size="${(h / .72).toFixed(3)}" fill="#000"${p.bold ? ' font-weight="700"' : ''}${p.an && p.an !== 'start' ? ` text-anchor="${p.an}"` : ''}>${escH(s)}</text>`); },
      image: (x, y, w, h, href) => o.push(`<image x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" href="${escH(href)}" preserveAspectRatio="xMidYMid meet"/>`)
    };
  }
  const val = id => (document.getElementById(id)?.value || '').trim();
  function carimbo() {
    const c = store().car || {}, s = (() => { try { return plotSettings26(); } catch { return {}; } })();
    let logo = ''; try { logo = L7()?.S?.()?.stamp106?.logo || localStorage.getItem('stamp106logo') || ''; } catch {}
    const data = s.date ? String(s.date).split('-').reverse().join('/') : '';
    return {
      contractor: c.contractor || val('st106cli'), taxid: c.taxid || '', address: c.address || '', district: c.district || '', complement: c.complement || '',
      lot: c.lot || '', block: c.block || '', city: c.city || '', state: c.state || '', email: c.email || '', phone: c.phone || '',
      responsible: s.engineer || '', crea: s.crea ? 'CREA ' + s.crea : '', revision: s.revision || '00', date: data,
      title: (c.title || val('st106tit') || 'PROJETO ESTRUTURAL · ALVENARIA ESTRUTURAL').toUpperCase(), units: 'COTAS cm · NÍVEIS m', logo: logo || undefined
    };
  }
  const escalaBase = () => N(document.getElementById('plotScale26')?.value) || 50;
  function rotulo(sheet) {
    const ts = new Map(); for (const q of sheet.items || []) { const t = temaDe(q); if (!ts.has(t.k)) ts.set(t.k, { t, n: [], esc: q.scale82 || escalaBase() }); const p = numParede(q.title); if (p) ts.get(t.k).n.push(p); }
    const L = [...ts.values()].sort((a, b) => a.t.o - b.t.o || (a.t.v || 0) - (b.t.v || 0));
    const txt = L.map(x => x.t.nome + (x.n.length ? ' · P' + Math.min(...x.n) + (x.n.length > 1 ? ' A P' + Math.max(...x.n) : '') : '')).join(' + ');
    const escs = [...new Set(L.map(x => x.esc))];
    return { txt: txt || 'PRANCHA', cod: (L[0]?.t.cod || 'ALV'), esc: escs.length === 1 ? '1:' + escs[0] : 'INDICADA' };
  }
  function codigos() { const cont = {}; return plotSheets26.map(sh => { const r = rotulo(sh); cont[r.cod] = (cont[r.cod] || 0) + 1; return { ...r, nome: r.cod + '-' + String(cont[r.cod]).padStart(2, '0') }; }); }
  function moldura(index, total) {
    const S = geo(), dr = desenhista(), cods = codigos(), me = cods[index] || { txt: 'PRANCHA', nome: '' };
    E.frame(dr, S);
    const x = S.strip.x, w = S.strip.w; let y = S.strip.y;
    const fim = S.stamp.y - 4;
    if (index === 0 && total > 0) { y += E.index(dr, x, y, w, cods.map(c => ({ title: c.nome + ' · ' + c.txt, scale: c.esc }))) + 4; }
    const revs = store().revs || [];
    if (index === 0 && revs.length) { y += E.revTable(dr, x, y, w, revs) + 4; }
    if (fim - y > 30) E.notes(dr, x, y, w, fim - y, notas());
    E.stamp(dr, S, carimbo(), { format: fmtOri()[0], content: (me.nome ? me.nome + ' · ' : '') + me.txt, no: index + 1, total });
    return `<svg class="eng151" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S.w} ${S.h}" width="${S.w}mm" height="${S.h}mm" style="position:absolute;left:0;top:0;width:${S.w}mm;height:${S.h}mm;pointer-events:none;overflow:visible;background:none!important;max-width:none;max-height:none">${dr.o.join('')}</svg>`;
  }
  try {
    const base = plotSheetHTML26;
    plotSheetHTML26 = function (sheet, index, total, ...a) {
      const html = base.call(this, sheet, index, total, ...a);
      if (!on()) return html;
      try {
        const d = document.createElement('div'); d.innerHTML = html;
        const root = d.firstElementChild; if (!root) return html;
        root.querySelectorAll('.nt95,.plotStamp26').forEach(n => n.remove());
        root.classList.add('eng151s');
        root.insertAdjacentHTML('afterbegin', moldura(index, total));
        return d.innerHTML;
      } catch (e) { console.error('V151 folha', e); return html; }
    };
  } catch (e) { console.error('V151', e); }

  // primeira vez no padrão novo: a organização salva no padrão antigo (outra área útil) não vale mais.
  // Desenho maior que a folha: como na metálica, a escala SÓ daquele tipo de desenho aumenta sozinha (1:50 → 1:75 → 1:100…)
  // até caber, e o aviso diz o que foi ajustado (a escala fica gravada no campo do tipo, no painel Folha).
  const ESC = [20, 25, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500];
  const campoDe = t => { const k = temaDe({ title: t, load77: /^Mapa de cargas/.test(t) }).k.split('|')[0]; return k === 'PLA' ? ['plotEsc141_fiada', 'plantas de 1ª/2ª fiada'] : k === 'ELE' ? ['plotElevScale82', 'elevações'] : k === 'LAJ' ? ['plotEsc141_laje', 'lajes'] : k === 'CAR' ? ['plotEsc141_carga', 'mapa de cargas'] : ['plotScale26', 'demais desenhos']; };
  const escAtual = id => { const v = N(document.getElementById(id)?.value); if (v > 0) return v; if (id === 'plotElevScale82') return N(window.esc141?.('elev')) || 75; return escalaBase(); };
  try {
    const b0 = buildPlot26;
    buildPlot26 = function (...a) {
      if (on()) { try { const S = L7()?.S?.(); if (S && !store().v) { delete S.plot107; store().v = 1; } } catch {} }
      // estimativa pelo tamanho do prédio (antes de montar): plantas, lajes e cargas já começam numa escala que cabe
      const pre = [];
      if (on() && a[0] !== true) { try {
        const ws = window.level68?.all?.() || state.walls, ext = new Map();
        for (const w of ws) { if (!w.line) continue; const k = N(w.planScale) || 1, pg = N(w.page || 1), e = ext.get(pg) || { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }; for (const q of w.line) { e.x0 = Math.min(e.x0, q.x / k); e.x1 = Math.max(e.x1, q.x / k); e.y0 = Math.min(e.y0, q.y / k); e.y1 = Math.max(e.y1, q.y / k); } ext.set(pg, e); }
        let W = 0, H = 0; for (const e of ext.values()) { W = Math.max(W, e.x1 - e.x0); H = Math.max(H, e.y1 - e.y0); }
        if (W > 0) { const A = geo().area, aw = A.x1 - A.x - 45, ah = A.y1 - A.y - 45, need = Math.max((W + 120) * 10 / aw, (H + 120) * 10 / ah);
          for (const [id, nome] of [['plotEsc141_fiada', 'plantas de 1ª/2ª fiada'], ['plotEsc141_laje', 'lajes'], ['plotEsc141_carga', 'mapa de cargas']]) { const el = document.getElementById(id); if (!el || N(el.value) > 0) continue; const cur = escalaBase(); if (need <= cur) continue; const nx = ESC.find(v => v >= need - 1e-6); if (!nx) continue; el.value = nx; el.dispatchEvent(new Event('change', { bubbles: true })); pre.push({ id, nome, de: cur, esc: nx }); } }
      } catch (e) { console.error('V151 estimativa', e); } }
      let r = b0.apply(this, a);
      if (!on() || a[0] === true) return r;
      if (r && !pre.length) return r;
      const feitos = pre.slice(); let tent = 0;
      while (!r && tent++ < 6) {
        const st = document.getElementById('plotStatus26')?.textContent || '', m = st.match(/^Não cabe na escala 1:[\d.,]+: (.*?)\. Escolha/s); if (!m) break;
        const ids = new Map(); for (const t of m[1].split('; ')) { const [id, nome] = campoDe(t); ids.set(id, nome); }
        let mudou = false;
        for (const [id, nome] of ids) { const el = document.getElementById(id); if (!el) continue; const cur = escAtual(id), nx = ESC.find(v => v > cur + 1e-6); if (!nx) continue; el.value = nx; el.dispatchEvent(new Event('change', { bubbles: true })); mudou = true; const f = feitos.find(x => x.id === id); if (f) f.esc = nx; else feitos.push({ id, nome, de: cur, esc: nx }); }
        if (!mudou) break;
        r = b0.apply(this, a);
      }
      // planta de lajes / detalhamento de vigas e reforços que não coube é descartado sem erro: aumenta a escala das lajes
      const faltaLaje = () => { try { const R = L7()?.compute?.({}); return (R?.slabs || []).length > 0 && !(plotItems26 || []).some(q => q.slab95); } catch { return false; } };
      let tl = 0;
      while (r && tl++ < 5 && faltaLaje()) {
        const id = 'plotEsc141_laje', el = document.getElementById(id); if (!el) break;
        const cur = escAtual(id), nx = ESC.find(v => v > cur + 1e-6); if (!nx) break;
        el.value = nx; el.dispatchEvent(new Event('change', { bubbles: true }));
        const f = feitos.find(x => x.id === id); if (f) f.esc = nx; else feitos.push({ id, nome: 'lajes', de: cur, esc: nx });
        r = b0.apply(this, a);
      }
      if (r && feitos.length) { const s2 = document.getElementById('plotStatus26'), av = (s2?.textContent.match(/\d+ aviso\(s\):.*$/s) || [''])[0]; const txt = 'Escala ajustada para caber na folha ' + fmtOri()[0] + ': ' + feitos.map(f => f.nome + ' 1:' + f.de + ' → 1:' + f.esc).join(' · ') + '. Para mudar, use as escalas por tipo no painel Folha.' + (av ? ' · ' + av : ''); if (s2) s2.textContent = txt; setTimeout(() => { const s3 = document.getElementById('plotStatus26'); if (s3 && !/Escala ajustada/.test(s3.textContent)) s3.textContent = txt + ' ' + s3.textContent; }, 300); }
      return r;
    };
  } catch (e) { console.error('V151', e); }

  // ---------------------------------------------------------------- tela: botões como na metálica
  const css = document.createElement('style'); css.id = 'eng151css';
  css.textContent = `.plotSheet26.eng151s .sp108{left:28mm!important}.plotSheet26 svg.eng151{background:none!important;max-width:none!important;max-height:none!important}
body.mv151off #plotPreview26 .plotItem26{cursor:default!important}
#pr121rib .b121.on151{background:#174a78!important;color:#fff!important}#pr121rib .b121.on151 svg{stroke:#fff}
.car151{display:grid;grid-template-columns:1fr 1fr;gap:4px 8px;margin-top:8px}.car151 label{display:flex;flex-direction:column;font-size:11.5px;gap:2px}.car151 label.w2{grid-column:1/3}.car151 input,.car151 textarea{font:inherit;padding:3px 5px;border:1px solid #b9c6d3;border-radius:5px}.car151 textarea{min-height:120px;resize:vertical}
.car151 h5{grid-column:1/3;margin:8px 0 2px;color:#0f3354;font-size:12px;border-bottom:1px solid #dbe3ea;padding-bottom:2px}.car151 .rv151{grid-column:1/3;font-size:11px;color:#36536f}.car151 button{justify-self:start}`;
  document.head.append(css);
  let mover = false;
  function ribbon() {
    const rib = document.getElementById('pr121rib'); if (!rib || rib.dataset.v151) return;
    rib.dataset.v151 = '1';
    const pega = a => rib.querySelector(`[data-a="${a}"]`);
    const ic = a => pega(a)?.querySelector('svg')?.outerHTML || '';
    const bt = (k, txt, icon, tip, cls = '') => `<button type="button" class="b121 ${cls}" data-a151="${k}" title="${tip}">${ic(icon)}<span>${txt}</span></button>`;
    const btA = (k, txt, icon, tip, cls = '') => `<button type="button" class="b121 ${cls}" data-a="${k}" title="${tip}">${ic(icon)}<span>${txt}</span></button>`;
    rib.innerHTML =
      `<div class="g121"><div>${btA('montar', 'Ver pranchas', 'montar', 'Monta as pranchas do projeto aberto (mantém a arrumação que você fez)', 'prim')}</div><small>Pranchas</small></div>` +
      `<div class="g121"><div>${bt('mover', 'Mover desenhos', 'orgA', 'Liga/desliga o arraste dos desenhos (dentro da prancha, para outra prancha ou para uma nova)')}${bt('otim', 'Otimizar pranchas', 'orgB', 'Reencaixa todos os desenhos ocupando os espaços livres, com o menor número de folhas')}${bt('auto', 'Voltar à arrumação automática', 'orgZ', 'Descarta a arrumação manual e monta de novo por tema (plantas, elevações, lajes, cargas, quantitativos)')}</div><small>Arrumação</small></div>` +
      `<div class="g121"><div>${btA('textos', 'Textos', 'textos', 'Tamanho dos textos das pranchas (mm)')}</div><small>Aparência</small></div>` +
      `<div class="g121"><div>${btA('pdf', 'Baixar PDF', 'pdf', 'Baixar as pranchas em PDF', 'pdf121')}${btA('dxf', 'Baixar DXF', 'dxf', 'Baixar as pranchas em DXF', 'exp121')}${btA('imp', 'Imprimir', 'imp', 'Imprimir / salvar PDF pelo navegador', 'exp121')}</div><small>Exportar</small></div>`;
    rib.addEventListener('click', e => {
      const b = e.target.closest('[data-a151]'); if (!b) return; const a = b.dataset.a151;
      if (a === 'mover') { mover = !mover; b.classList.toggle('on151', mover); document.body.classList.toggle('mv151off', !mover); msg(mover ? 'Mover desenhos: arraste os quadros dentro da prancha ou para outra prancha. Clique de novo para terminar.' : 'Arraste desligado.'); }
      else if (a === 'otim' || a === 'auto') {
        if (a === 'auto' && plotSheets26.length && !confirm('Voltar à arrumação automática? A arrumação feita à mão será descartada.')) return;
        try { delete L7()?.S?.().plot107; } catch {}
        window.__otim151 = a === 'otim';
        try { buildPlot26(); } finally { window.__otim151 = false; }
        if (plotSheets26.length) msg(a === 'otim' ? 'Pranchas otimizadas: desenhos reencaixados nos espaços livres (' + plotSheets26.length + ' folha(s)).' : 'Arrumação automática por tema (' + plotSheets26.length + ' folha(s)).');
      }
    });
    document.body.classList.add('mv151off');
  }
  // rodapé da tela: a dica do arraste passa a citar o botão Mover desenhos
  new MutationObserver(ms => { for (const m of ms) for (const n of [m.target, ...m.addedNodes]) { const el = n.nodeType === 1 ? n : n.parentElement; if (!el) continue; for (const sp of el.querySelectorAll ? [el, ...el.querySelectorAll('span')] : []) { if (sp.childNodes.length === 1 && sp.firstChild.nodeType === 3 && /arraste para mover$/.test(sp.textContent)) sp.textContent = mover ? 'Mover desenhos ligado: arraste os quadros' : 'Para arrastar quadros: ligue Mover desenhos'; } } }).observe(document.body, { childList: true, subtree: true, characterData: false });
  const msg = t => { const s = document.getElementById('plotStatus26'); if (s) s.textContent = t; };
  // arraste só com "Mover desenhos" ligado (clique simples continua selecionando)
  document.addEventListener('pointerdown', e => { if (mover || !on()) return; const it = e.target.closest?.('#plotPreview26 .plotItem26'); if (it) { e.stopPropagation(); } }, true);

  // painel do carimbo: campos do carimbo Engenhar, notas executivas e revisões
  function painel() {
    const car = document.getElementById('pr121car'); if (!car || car.querySelector('.car151')) return;
    const c = store().car ??= {};
    const F = [['contractor', 'Contratante'], ['taxid', 'CPF/CNPJ'], ['address', 'Endereço', 1], ['district', 'Bairro'], ['complement', 'Complemento'], ['lot', 'Lote'], ['block', 'Quadra'], ['city', 'Cidade'], ['state', 'UF'], ['email', 'E-mail'], ['phone', 'Contato'], ['title', 'Título do carimbo', 1]];
    const box = document.createElement('div'); box.className = 'car151';
    box.innerHTML = '<h5>Carimbo Engenhar</h5>' + F.map(([k, t, w2]) => `<label${w2 ? ' class="w2"' : ''}>${t}<input data-c151="${k}" value="${escH(c[k] || '')}"${k === 'contractor' ? ' placeholder="(usa o campo Cliente)"' : k === 'title' ? ' placeholder="PROJETO ESTRUTURAL · ALVENARIA ESTRUTURAL"' : ''}></label>`).join('') +
      `<h5>Notas executivas <small style="font-weight:400;color:#6a7c8e">(uma por linha)</small></h5><label class="w2"><textarea data-n151>${escH(store().notas || NOTAS0.join('\n'))}</textarea></label>` +
      `<h5>Quadro de revisões</h5><div class="rv151"></div><label>Descrição da revisão<input data-rv151="desc" placeholder="Ex.: emissão inicial"></label><button type="button" data-rv151add>Registrar nova revisão</button>`;
    car.append(box);
    const rv = () => { const L = store().revs || []; box.querySelector('.rv151').innerHTML = L.length ? L.map(r => `R${escH(r.rev)} · ${escH(r.date)} · ${escH(r.desc)}`).join('<br>') : 'Nenhuma revisão registrada.'; };
    rv();
    box.addEventListener('input', e => { const k = e.target.dataset.c151; if (k) store().car[k] = e.target.value; if (e.target.matches('[data-n151]')) store().notas = e.target.value; });
    box.addEventListener('change', () => { if (plotSheets26.length) try { previewPlot26(); } catch {} });
    box.querySelector('[data-rv151add]').onclick = () => {
      const L = store().revs ??= [], d = box.querySelector('[data-rv151="desc"]').value.trim() || (L.length ? 'Revisão' : 'Emissão inicial');
      const n = String(L.length).padStart(2, '0'); L.push({ rev: n, date: new Date().toLocaleDateString('pt-BR'), desc: d });
      const r = document.getElementById('plotRevision26'); if (r) { r.value = n; r.dispatchEvent(new Event('change', { bubbles: true })); }
      box.querySelector('[data-rv151="desc"]').value = ''; rv(); if (plotSheets26.length) try { previewPlot26(); } catch {}
    };
  }
  const tenta = () => { try { ribbon(); painel(); } catch (e) { console.error('V151 tela', e); } };
  tenta(); setTimeout(tenta, 0); setTimeout(tenta, 800);
  new MutationObserver(() => { if (!document.getElementById('pr121rib')?.dataset.v151 || !document.querySelector('#pr121car .car151')) tenta(); }).observe(document.body, { childList: true, subtree: false });
  window.eng151 = { empacotar, rotulo, codigos, geo };
})();
