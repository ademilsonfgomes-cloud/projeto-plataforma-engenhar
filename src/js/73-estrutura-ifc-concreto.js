// V156 — ESTRUTURA MISTA · 1ª etapa: IFC da estrutura de concreto (Eberick, TQS, CypeCAD, Revit…) junto com o DXF da arquitetura
//  1. "Abrir IFC da estrutura": lê os pavimentos (IfcBuildingStorey) e, em cada um, pilares (IfcColumn), vigas (IfcBeam)
//     e lajes (IfcSlab), com cota de base e topo. Fica gravado no projeto (só o contorno de cada peça, não o arquivo).
//  2. Painel "Estrutura (IFC)": lista os níveis; cada nível é ligado a uma planta (DXF) do projeto — sugerida pela cota.
//     Clicar no nível abre a planta dele.
//  3. Na planta: pilares (cheios) e vigas (contorno) do nível; vigas do nível de cima tracejadas; lajes bem claras.
//  4. Alinhar com 2 cliques: um canto de pilar do IFC e o mesmo ponto no DXF (deslocamento gravado por planta).
//  5. Ímã: o traçado das paredes gruda nos cantos e no centro dos pilares e nas pontas/eixos das vigas.
//  6. 3D da estrutura: girar com o mouse; clicar numa peça abre a planta daquele nível.
// Não altera paredes, modulação nem cálculos: é uma camada de referência para lançar as paredes.
(function () {
  'use strict';
  const N = v => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
  const $id = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const L7 = () => window.loads77;
  const S = () => { let s = null; try { s = L7()?.S?.(); } catch {} s = s || (state.estr156s ??= {}); return s; };
  const dados = () => S().estr156 || null;
  const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch {} return null; };
  const pagina = () => N($id('page')?.value) || 1;
  const paginas = () => { try { return (pages36 || []).map(p => ({ id: N(p.id), nome: p.name || p.label || ('Planta ' + p.id) })); } catch { return []; } };
  const f2 = v => (v >= 0 ? '+' : '') + (v / 100).toFixed(2).replace('.', ',');
  const msg = t => { const s = $id('planStatus'); if (s) s.textContent = t; };

  // ---------------------------------------------------------------- leitura do IFC
  async function abrirIFC(file) {
    const K = window.ifc74; if (!K) throw Error('Leitor de IFC indisponível.');
    const txt = await file.text(), E = K.parseIFC(txt), m = K.ifcModel(E);
    const andares = new Map();
    for (const [id, e] of E) if (e.t === 'IFCBUILDINGSTOREY') { const pz = m.place(e.a[5]).T[2] * m.U, el = Number(e.a[9]); andares.set(id, { id, nome: String(e.a[2] || e.a[7] || ('Pavimento ' + id)).trim(), z: Number.isFinite(el) ? el * m.U : pz }); }
    const onde = new Map();
    for (const [, e] of E) if (e.t === 'IFCRELCONTAINEDINSPATIALSTRUCTURE') { const s = e.a[5]?.r; for (const r of e.a[4] || []) if (r?.r != null) onde.set(r.r, s); }
    const TIPO = { IFCCOLUMN: 'P', IFCCOLUMNSTANDARDCASE: 'P', IFCBEAM: 'V', IFCBEAMSTANDARDCASE: 'V', IFCSLAB: 'L', IFCSLABSTANDARDCASE: 'L', IFCMEMBER: 'V' };
    const els = [];
    for (const [id, e] of E) {
      const t = TIPO[e.t]; if (!t) continue;
      let pts = []; try { pts = m.bodyPts(e); } catch {} if (pts.length < 3) continue;
      let z0 = Infinity, z1 = -Infinity; for (const p of pts) { z0 = Math.min(z0, p[2]); z1 = Math.max(z1, p[2]); }
      const poly = K.hull(pts).map(q => [Math.round(q[0] * 10) / 10, Math.round(q[1] * 10) / 10]); if (poly.length < 3) continue;
      els.push({ id, t, nome: String(e.a[2] || e.a[7] || '').trim(), st: onde.get(id) ?? null, poly, z0: Math.round(z0 * 10) / 10, z1: Math.round(z1 * 10) / 10 });
    }
    if (!els.length) throw Error('Nenhum pilar, viga ou laje encontrado no IFC. Confira se é o IFC da estrutura (exportado do programa de concreto).');
    // pavimento de cada peça: o do IFC; sem pavimento, o mais próximo abaixo da base da peça
    let lista = [...andares.values()].sort((a, b) => a.z - b.z);
    if (!lista.length) { const zs = [...new Set(els.filter(e => e.t === 'L').map(e => Math.round(e.z1)))].sort((a, b) => a - b); lista = (zs.length ? [0, ...zs] : [0]).map((z, i) => ({ id: 'z' + i, nome: i ? 'Nível ' + f2(z) + ' m' : 'Térreo', z })); }
    const idx = new Map(lista.map((a, i) => [a.id, i]));
    for (const e of els) { let i = e.st != null && idx.has(e.st) ? idx.get(e.st) : -1; if (i < 0) { i = 0; lista.forEach((a, k) => { if (a.z <= e.z0 + 5) i = k; }); } e.s = i; delete e.st; }
    const prev = dados();
    S().estr156 = { arq: file.name, quando: new Date().toISOString(), niveis: lista.map(a => ({ nome: a.nome, z: Math.round(a.z * 10) / 10 })), els, liga: prev?.liga || {}, alinha: prev?.alinha || {}, sel: 0 };
    sugerirLigacoes();
    return S().estr156;
  }
  // nível do IFC ↔ planta do projeto: pela cota dos níveis já cadastrados (ex.: "2,95 2º pavimento") ou pela ordem
  function sugerirLigacoes() {
    const D = dados(); if (!D) return;
    const pgs = paginas(), lv = (state.levels53 || []).map(l => ({ page: N(l.page), z: N(String(l.text || '').replace(',', '.').match(/[-+]?\d+(\.\d+)?/)?.[0]) * 100 }));
    D.niveis.forEach((n, i) => {
      if (D.liga[i]) return;
      const m = lv.find(l => Math.abs(l.z - n.z) < 15); if (m) { D.liga[i] = m.page; return; }
      if (pgs[i]) D.liga[i] = pgs[i].id;
    });
  }

  // ---------------------------------------------------------------- coordenadas: IFC (cm) → mundo do projeto → planta
  // deslocamento da planta; planta sem alinhamento próprio usa o de outra planta com a mesma origem (cópias de pavimento)
  const desl = pg => { const A = dados()?.alinha || {}; let a = A[pg]; if (!a) for (const k of Object.keys(A)) { try { if (window.aligned74?.(N(k), pg)) { a = A[k]; break; } } catch {} } return a ? { x: N(a.x), y: N(a.y) } : { x: 0, y: 0 }; };
  const naPlanta = (pg, p) => { const d = desl(pg); return window.toPage74 ? window.toPage74(pg, { x: p[0] + d.x, y: p[1] + d.y }) : { x: p[0], y: p[1] }; };
  const nivelDaPagina = pg => { const D = dados(); if (!D) return -1; for (const [i, p] of Object.entries(D.liga || {})) if (N(p) === pg) return N(i); return -1; };
  // peças "deste nível": pilares do nível (do piso até a laje de cima), vigas/lajes do topo deste nível = base do nível de cima
  function pecas(i) {
    const D = dados(); if (!D || i < 0) return { pil: [], vig: [], vigCima: [], laj: [] };
    const zb = D.niveis[i]?.z ?? 0, zt = D.niveis[i + 1]?.z ?? Infinity;
    const dentro = e => e.s === i;
    const pil = D.els.filter(e => e.t === 'P' && (dentro(e) || (e.z0 < zt - 5 && e.z1 > zb + 5)));
    // vigas que apoiam este piso (topo ≈ cota do nível) e vigas do teto (topo ≈ cota do nível de cima)
    const vig = D.els.filter(e => e.t === 'V' && Math.abs(e.z1 - zb) < 40);
    const vigCima = D.els.filter(e => e.t === 'V' && Number.isFinite(zt) && Math.abs(e.z1 - zt) < 40);
    const laj = D.els.filter(e => e.t === 'L' && Math.abs(e.z1 - zb) < 40);
    return { pil, vig, vigCima, laj };
  }

  // ---------------------------------------------------------------- planta: desenho da estrutura
  const vis = () => LS('estr156vis') !== '0';
  function desenhar() {
    const D = dados(); if (!D || !vis()) return;
    const pg = pagina(), i = nivelDaPagina(pg); if (i < 0) return;
    const c = $id('plan'); if (!c) return; const ctx = c.getContext('2d'), o = c.planOrigin25 || { x: 0, y: 0 }, r = c.getBoundingClientRect(), px = r.width ? c.width / r.width : 1;
    const P = pecas(i), caminho = poly => { ctx.beginPath(); poly.forEach((q, k) => { const t = naPlanta(pg, q); k ? ctx.lineTo(t.x, t.y) : ctx.moveTo(t.x, t.y); }); ctx.closePath(); };
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -o.x, -o.y);
    ctx.lineWidth = 1.2 * px;
    ctx.fillStyle = 'rgba(56,189,248,.07)'; ctx.strokeStyle = 'rgba(56,189,248,.35)'; for (const e of P.laj) { caminho(e.poly); ctx.fill(); }
    ctx.strokeStyle = 'rgba(234,120,24,.9)'; ctx.fillStyle = 'rgba(234,120,24,.10)'; for (const e of P.vig) { caminho(e.poly); ctx.fill(); ctx.stroke(); }
    ctx.setLineDash([6 * px, 4 * px]); ctx.strokeStyle = 'rgba(250,204,21,.95)'; for (const e of P.vigCima) { caminho(e.poly); ctx.stroke(); } ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(120,130,145,.75)'; ctx.strokeStyle = 'rgba(30,41,59,.95)'; for (const e of P.pil) { caminho(e.poly); ctx.fill(); ctx.stroke(); }
    if (alinhando?.ifc) { const t = naPlanta(pg, alinhando.ifc); ctx.strokeStyle = '#e11d48'; ctx.lineWidth = 2 * px; ctx.beginPath(); ctx.arc(t.x, t.y, 7 * px, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
    try { (window.hud88 || []).push?.({ t: 'Estrutura (IFC): ' + D.niveis[i].nome + ' · pilares e vigas do piso; tracejado = vigas do teto', c: '#ea7818' }); } catch {}
  }
  // ímã: cantos e centro dos pilares, pontas e meio das faces das vigas
  const marca = Symbol('estr156');
  function ima() {
    try {
      if (typeof fixedPoints === 'undefined' || !Array.isArray(fixedPoints)) return;
      for (let k = fixedPoints.length - 1; k >= 0; k--) if (fixedPoints[k] && fixedPoints[k][marca]) fixedPoints.splice(k, 1);
      const D = dados(); if (!D || !vis() || LS('estr156ima') === '0') return;
      const pg = pagina(), i = nivelDaPagina(pg); if (i < 0) return;
      const P = pecas(i), add = q => { const t = naPlanta(pg, q); fixedPoints.push({ x: t.x, y: t.y, [marca]: 1 }); };
      for (const e of P.pil) { e.poly.forEach(add); const c = e.poly.reduce((a, q) => [a[0] + q[0] / e.poly.length, a[1] + q[1] / e.poly.length], [0, 0]); add(c); }
      for (const e of [...P.vig, ...P.vigCima]) { e.poly.forEach(add); for (let k = 0; k < e.poly.length; k++) { const a = e.poly[k], b = e.poly[(k + 1) % e.poly.length]; add([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); } }
    } catch (e) { console.error('V156 ímã', e); }
  }
  try { const dp = drawPlan; drawPlan = function (...a) { try { ima(); } catch {} const r = dp.apply(this, a); try { desenhar(); } catch (e) { console.error('V156 planta', e); } return r; }; } catch (e) { console.error('V156', e); }

  // ---------------------------------------------------------------- alinhar com 2 cliques
  let alinhando = null;
  const ponto = e => { const c = $id('plan'), r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * c.width / r.width + (c.planOrigin25?.x || 0), y: (e.clientY - r.top) * c.height / r.height + (c.planOrigin25?.y || 0) }; };
  function iniciarAlinhamento() {
    const pg = pagina(); if (nivelDaPagina(pg) < 0) { msg('Escolha antes um nível da estrutura ligado a esta planta.'); return; }
    alinhando = { pg }; msg('Alinhar estrutura · 1/2: clique num CANTO DE PILAR da estrutura (desenho cinza). Esc cancela.'); try { drawPlan(); } catch {}
  }
  document.addEventListener('click', e => {
    if (!alinhando || !e.target.closest?.('#plan')) return;
    e.stopPropagation(); e.preventDefault();
    const pg = alinhando.pg, P = ponto(e), i = nivelDaPagina(pg), pc = pecas(i);
    if (!alinhando.ifc) {
      let best = null; for (const el of pc.pil.concat(pc.vig)) for (const q of el.poly) { const t = naPlanta(pg, q), d = Math.hypot(t.x - P.x, t.y - P.y); if (!best || d < best.d) best = { d, q }; }
      if (!best) { msg('Nenhum pilar neste nível.'); alinhando = null; return; }
      alinhando.ifc = best.q; msg('Alinhar estrutura · 2/2: agora clique no MESMO PONTO no desenho da arquitetura (DXF).'); try { drawPlan(); } catch {}
      return;
    }
    // 2º clique: gruda no ponto do desenho mais perto (ponta de linha do DXF / parede), até 12 px na tela
    try { const c = $id('plan'), r = c.getBoundingClientRect(), tol = 12 * c.width / r.width; let best = null; for (const q of (typeof fixedPoints !== 'undefined' && fixedPoints) || []) { if (!q || q[marca]) continue; const d = Math.hypot(q.x - P.x, q.y - P.y); if (d < tol && (!best || d < best.d)) best = { d, q }; } if (best) { P.x = best.q.x; P.y = best.q.y; } } catch {}
    const W = window.world74 ? window.world74(pg, P) : P, d0 = desl(pg), D = dados();
    D.alinha ??= {}; D.alinha[pg] = { x: Math.round((W.x - alinhando.ifc[0]) * 10) / 10, y: Math.round((W.y - alinhando.ifc[1]) * 10) / 10 };
    msg('Estrutura alinhada com a planta: deslocamento ' + (D.alinha[pg].x - d0.x).toFixed(1).replace('.', ',') + ' / ' + (D.alinha[pg].y - d0.y).toFixed(1).replace('.', ',') + ' cm em relação ao anterior. Confira os pilares sobre o DXF.');
    alinhando = null; try { drawPlan(); } catch {}
  }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && alinhando) { alinhando = null; msg('Alinhamento cancelado.'); try { drawPlan(); } catch {} } }, true);

  // ---------------------------------------------------------------- ir para um nível
  function irPara(i) {
    const D = dados(); if (!D) return; D.sel = i;
    const pg = N(D.liga?.[i]);
    if (!pg) { painel(); msg('Ligue o nível "' + D.niveis[i].nome + '" a uma planta (DXF) no painel Estrutura.'); return; }
    try { document.querySelector('#tabs85 [data-v="plan"]')?.click(); } catch {}
    const sel = $id('page'); if (sel && N(sel.value) !== pg) { sel.value = pg; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    setTimeout(() => { try { drawPlan(); } catch {} }, 60);
    painel(); msg('Estrutura: ' + D.niveis[i].nome + ' (' + f2(D.niveis[i].z) + ' m) na planta ' + pg + '. Trace as paredes: o cursor gruda nos pilares e nas vigas.');
  }

  // ---------------------------------------------------------------- painel
  const css = document.createElement('style'); css.id = 'estr156css';
  css.textContent = `#estr156{position:fixed;left:170px;top:150px;width:300px;max-height:calc(100vh - 200px);z-index:62;display:none;flex-direction:column;background:#fff;border:1px solid #b9c6d3;border-radius:9px;box-shadow:0 8px 24px rgba(16,46,75,.22);font:12px 'Segoe UI',Arial,sans-serif;color:#1d2b38}
#estr156.on{display:flex}#estr156 .t{display:flex;align-items:center;gap:6px;padding:6px 8px;background:#7c2d12;color:#fff;border-radius:8px 8px 0 0;cursor:move;user-select:none}#estr156 .t b{flex:1}#estr156 .t button{background:none!important;border:0!important;color:#fde7d8!important;cursor:pointer;font-size:13px;min-height:0!important;padding:0 3px!important}
#estr156 .c{padding:7px 9px;overflow:auto}#estr156 .bt{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0}#estr156 .bt button{font-size:11.5px!important;padding:3px 8px!important;min-height:0!important;height:auto!important;border-radius:5px!important;border:1px solid #c2410c!important;background:#fff7ed!important;color:#7c2d12!important;cursor:pointer}#estr156 .bt button.pri{background:#c2410c!important;color:#fff!important}
#estr156 .nv{display:grid;grid-template-columns:1fr auto;gap:3px 6px;align-items:center;padding:4px 5px;border-radius:6px;cursor:pointer;border:1px solid transparent}#estr156 .nv:hover{background:#fff7ed}#estr156 .nv.sel{border-color:#c2410c;background:#ffedd5}#estr156 .nv b{font-size:12px}#estr156 .nv small{color:#6a7c8e;grid-column:1/3}#estr156 .nv select{font-size:11px;padding:1px 3px;max-width:120px}
#estr156 .op{display:flex!important;flex-direction:row!important;gap:5px;align-items:center;margin:2px 0!important;font-weight:400!important;font-size:11.5px}#estr156 .op input{width:auto!important;margin:0!important}#estr156 .n{color:#6a7c8e;font-size:11px;margin:4px 0}
#estr156v{position:fixed;inset:40px;z-index:10060;background:#0f172a;border-radius:10px;display:none;flex-direction:column;box-shadow:0 10px 40px rgba(0,0,0,.5)}#estr156v.on{display:flex}#estr156v .t{display:flex;gap:8px;align-items:center;padding:7px 12px;color:#e2e8f0;font:13px 'Segoe UI',Arial}#estr156v .t b{flex:1}#estr156v button{background:#1e293b!important;color:#e2e8f0!important;border:1px solid #334155!important;border-radius:6px!important;padding:4px 10px!important;cursor:pointer;min-height:0!important}#estr156v canvas{flex:1;width:100%;cursor:grab}`;
  document.head.append(css);
  const box = document.createElement('div'); box.id = 'estr156'; box.className = 'noPrint';
  box.innerHTML = '<div class="t"><b>🏗 Estrutura (IFC)</b><button data-a="x" title="Fechar">✕</button></div><div class="c"></div><input type="file" accept=".ifc" hidden>';
  document.body.append(box);
  const corpo = box.querySelector('.c'), arq = box.querySelector('input[type=file]');
  function painel() {
    const D = dados(), pgs = paginas();
    if (!D) { corpo.innerHTML = '<p class="n">Abra o IFC da estrutura de concreto (exportado do Eberick, TQS, CypeCAD, Revit…). O programa lê os pavimentos, pilares, vigas e lajes. Depois ligue cada nível à planta (DXF) da arquitetura daquele pavimento.</p><div class="bt"><button class="pri" data-a="abrir">📂 Abrir IFC da estrutura</button></div>'; return; }
    const cont = D.niveis.map((_, i) => { const p = pecas(i); return p.pil.length + ' pilar(es) · ' + p.vig.length + ' viga(s) no piso · ' + p.vigCima.length + ' no teto'; });
    corpo.innerHTML = `<div class="n"><b>${esc(D.arq)}</b> · ${D.els.length} peças · ${D.niveis.length} nível(is)</div>
<div class="bt"><button class="pri" data-a="3d">🧊 3D da estrutura</button><button data-a="alinhar">📐 Alinhar (2 cliques)</button><button data-a="abrir">📂 Trocar IFC</button></div>
${D.niveis.map((n, i) => `<div class="nv${D.sel === i ? ' sel' : ''}" data-i="${i}"><b>${esc(n.nome)} <span style="font-weight:400;color:#7c2d12">${f2(n.z)} m</span></b><select data-liga="${i}" title="Planta (DXF) deste nível"><option value="">— planta —</option>${pgs.map(p => `<option value="${p.id}"${N(D.liga?.[i]) === p.id ? ' selected' : ''}>${esc(p.nome)}</option>`).join('')}</select><small>${cont[i]}</small></div>`).join('')}
<label class="op"><input type="checkbox" data-o="vis" ${vis() ? 'checked' : ''}> Mostrar a estrutura na planta</label><label class="op"><input type="checkbox" data-o="ima" ${LS('estr156ima') !== '0' ? 'checked' : ''}> Ímã nos pilares e vigas</label>
<p class="n">Clique num nível para abrir a planta dele. Pilares em cinza, vigas do piso em laranja, vigas do teto tracejadas em amarelo.</p>`;
  }
  box.addEventListener('click', e => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'x') { box.classList.remove('on'); return; }
    if (a === 'abrir') { arq.click(); return; }
    if (a === '3d') { abrir3D(); return; }
    if (a === 'alinhar') { iniciarAlinhamento(); return; }
    if (e.target.closest('select,input,label')) return;
    const nv = e.target.closest('.nv[data-i]'); if (nv) irPara(N(nv.dataset.i));
  });
  box.addEventListener('change', e => {
    const s = e.target.closest('[data-liga]'); if (s) { const D = dados(); D.liga ??= {}; if (s.value) D.liga[s.dataset.liga] = N(s.value); else delete D.liga[s.dataset.liga]; try { drawPlan(); } catch {} return; }
    const o = e.target.dataset.o; if (o === 'vis') { LS('estr156vis', e.target.checked ? '1' : '0'); try { drawPlan(); } catch {} } if (o === 'ima') { LS('estr156ima', e.target.checked ? '1' : '0'); try { drawPlan(); } catch {} }
  });
  arq.addEventListener('change', async () => {
    const f = arq.files?.[0]; arq.value = ''; if (!f) return;
    corpo.innerHTML = '<p class="n">Lendo ' + esc(f.name) + '…</p>';
    await new Promise(r => setTimeout(r, 30));
    try { const D = await abrirIFC(f); painel(); const n = D.els.reduce((o, e) => (o[e.t] = (o[e.t] || 0) + 1, o), {}); msg('IFC da estrutura lido: ' + D.niveis.length + ' nível(is) · ' + (n.P || 0) + ' pilares · ' + (n.V || 0) + ' vigas · ' + (n.L || 0) + ' lajes. Ligue cada nível à planta e clique nele para abrir.'); try { drawPlan(); } catch {} }
    catch (er) { console.error('V156', er); painel(); msg('Não foi possível ler o IFC: ' + (er.message || er)); }
  });
  { const t = box.querySelector('.t'); let d = null;
    t.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; const r = box.getBoundingClientRect(); d = { dx: e.clientX - r.left, dy: e.clientY - r.top }; t.setPointerCapture(e.pointerId); });
    t.addEventListener('pointermove', e => { if (!d) return; box.style.left = Math.max(0, e.clientX - d.dx) + 'px'; box.style.top = Math.max(0, e.clientY - d.dy) + 'px'; });
    t.addEventListener('pointerup', () => { d = null; }); }
  function abrirPainel() { box.classList.add('on'); painel(); }

  // ---------------------------------------------------------------- 3D simples (sem bibliotecas): girar arrastando, roda = zoom, clique = abre o nível
  const v3 = document.createElement('div'); v3.id = 'estr156v'; v3.className = 'noPrint';
  v3.innerHTML = '<div class="t"><b>🧊 Estrutura (IFC) — arraste para girar · roda para aproximar · clique numa peça para abrir a planta do nível</b><button data-a="fit">Enquadrar</button><button data-a="x">✕ Fechar</button></div><canvas></canvas>';
  document.body.append(v3);
  const cv = v3.querySelector('canvas'); let cam = { az: -0.7, el: 0.55, zoom: 1, cx: 0, cy: 0, cz: 0 }, faces = [];
  const COR = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#eab308', '#ec4899', '#14b8a6', '#ef4444'];
  function enquadrar() { const D = dados(); if (!D) return; let a = [Infinity, Infinity, Infinity], b = [-Infinity, -Infinity, -Infinity]; for (const e of D.els) { for (const q of e.poly) { a[0] = Math.min(a[0], q[0]); a[1] = Math.min(a[1], q[1]); b[0] = Math.max(b[0], q[0]); b[1] = Math.max(b[1], q[1]); } a[2] = Math.min(a[2], e.z0); b[2] = Math.max(b[2], e.z1); } cam.cx = (a[0] + b[0]) / 2; cam.cy = (a[1] + b[1]) / 2; cam.cz = (a[2] + b[2]) / 2; cam.R = Math.max(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1000; cam.zoom = 1; }
  function proj(p) { const x = p[0] - cam.cx, y = p[1] - cam.cy, z = p[2] - cam.cz, ca = Math.cos(cam.az), sa = Math.sin(cam.az), ce = Math.cos(cam.el), se = Math.sin(cam.el); const X = x * ca - y * sa, Y = x * sa + y * ca; const Yr = Y * ce - z * se, Z = Y * se + z * ce; const k = Math.min(cv.width, cv.height) / (cam.R * 1.5) * cam.zoom; return { x: cv.width / 2 + X * k, y: cv.height / 2 - Z * k, d: Yr }; }
  function render3D() {
    const D = dados(); if (!D) return; const r = cv.getBoundingClientRect(); cv.width = r.width * devicePixelRatio; cv.height = r.height * devicePixelRatio;
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, cv.width, cv.height); faces = [];
    for (const e of D.els) {
      const cor = COR[e.s % COR.length], base = e.poly.map(q => [q[0], q[1], e.z0]), topo = e.poly.map(q => [q[0], q[1], e.z1]);
      const lista = [topo, base]; for (let k = 0; k < e.poly.length; k++) { const a = e.poly[k], b = e.poly[(k + 1) % e.poly.length]; lista.push([[a[0], a[1], e.z0], [b[0], b[1], e.z0], [b[0], b[1], e.z1], [a[0], a[1], e.z1]]); }
      for (const f of lista) { const pp = f.map(proj); faces.push({ pp, d: pp.reduce((s, q) => s + q.d, 0) / pp.length, e, cor, sel: e.s === D.sel }); }
    }
    faces.sort((a, b) => b.d - a.d);
    for (const f of faces) { ctx.beginPath(); f.pp.forEach((q, k) => k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.globalAlpha = f.e.t === 'L' ? .35 : .85; ctx.fillStyle = f.sel ? '#fde68a' : f.cor; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(15,23,42,.6)'; ctx.lineWidth = 1; ctx.stroke(); f.path = new Path2D(); f.pp.forEach((q, k) => k ? f.path.lineTo(q.x, q.y) : f.path.moveTo(q.x, q.y)); f.path.closePath(); }
    ctx.font = (13 * devicePixelRatio) + 'px Segoe UI,Arial'; ctx.fillStyle = '#e2e8f0';
    D.niveis.forEach((n, i) => { const q = proj([cam.cx + cam.R * .6, cam.cy - cam.R * .6, n.z]); ctx.fillStyle = COR[i % COR.length]; ctx.fillText('■ ' + n.nome + ' ' + f2(n.z) + ' m', q.x + 10, q.y); });
  }
  let arr = null;
  cv.addEventListener('pointerdown', e => { arr = { x: e.clientX, y: e.clientY, az: cam.az, el: cam.el, moveu: false }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!arr) return; const dx = e.clientX - arr.x, dy = e.clientY - arr.y; if (Math.hypot(dx, dy) > 3) arr.moveu = true; cam.az = arr.az + dx * .01; cam.el = Math.max(-.2, Math.min(1.5, arr.el + dy * .01)); render3D(); });
  cv.addEventListener('pointerup', e => {
    const a = arr; arr = null; if (!a || a.moveu) return;
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * devicePixelRatio, y = (e.clientY - r.top) * devicePixelRatio, ctx = cv.getContext('2d');
    for (let k = faces.length - 1; k >= 0; k--) if (faces[k].path && ctx.isPointInPath(faces[k].path, x, y)) { const i = faces[k].e.s; v3.classList.remove('on'); abrirPainel(); irPara(i); return; }
  });
  cv.addEventListener('wheel', e => { e.preventDefault(); cam.zoom *= e.deltaY < 0 ? 1.15 : 1 / 1.15; render3D(); }, { passive: false });
  v3.addEventListener('click', e => { const a = e.target.closest('[data-a]')?.dataset.a; if (a === 'x') v3.classList.remove('on'); if (a === 'fit') { enquadrar(); render3D(); } });
  function abrir3D() { if (!dados()) { abrirPainel(); return; } v3.classList.add('on'); enquadrar(); requestAnimationFrame(render3D); }
  addEventListener('resize', () => { if (v3.classList.contains('on')) render3D(); });

  // ---------------------------------------------------------------- onde aparece: menu (Arquivo/Planta), paleta de comandos
  try { const R = window.cad109?.REG; if (R) R.set('x:Estrutura (IFC)', { key: 'x:Estrutura (IFC)', t: { l: 'Estrutura (IFC)', ic: '🏗', t: () => abrirPainel() }, cat: 'extra' }); } catch {}
  window.estr156 = { abrirPainel, abrir3D, abrirIFC, irPara, pecas, dados, iniciarAlinhamento };
})();
