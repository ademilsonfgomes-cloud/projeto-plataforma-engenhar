// V148 — LISTA DE CONFERÊNCIA DAS PAREDES (tela Elevações)
// Painel pequeno, no canto da tela de Elevações, com todas as paredes do nível:
//  • bolinha = situação dada pelo programa (verde modulada OK · amarela pendente/aviso · vermelha sem modulação · cinza
//    parede não conferida na planta);
//  • ☐/☑ = "conferida por mim" — o projetista marca quando terminou de corrigir a parede (também há o botão no título de
//    cada elevação). A marca fica salva no projeto, junto da parede;
//  • se a parede (ou a modulação dela) mudar depois de marcada, a marca vira ⚠ "mudou depois de conferida";
//  • barra de progresso, filtros (Todas · A fazer · Conferidas), clique no nome vai até a elevação, a parede que está na
//    tela fica destacada, e o painel pode ser recolhido.
(function () {
  'use strict';
  const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch {} return null; };
  const $id = id => document.getElementById(id);
  // assinatura da parede + modulação: muda quando a parede ou o desenho dela mudam
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  const FORA = new Set(['conf148', 'labelPosition28', 'seq58', 'confirmed']);
  function assinatura(i) {
    const w = state.walls[i], m = state.results?.[i]; if (!w) return '';
    const o = {}; for (const k of Object.keys(w).sort()) if (!FORA.has(k)) o[k] = w[k];
    const rows = m?.rows ? m.rows.map(r => (r.pieces || []).map(p => [p.code, Math.round((Number(p.x) || 0) * 10), Math.round((Number(p.length ?? p.l) || 0) * 10)])) : null;
    let s = ''; try { s = JSON.stringify([o, rows]); } catch {}
    return hash(s);
  }
  function situacao(i) {
    const w = state.walls[i], m = state.results?.[i];
    if (!w.confirmed) return ['cinza', 'Parede não conferida na planta'];
    if (!m || !m.rows?.length) return ['verm', (m?.errors?.[0]) || 'Sem modulação'];
    if (m.errors?.length) return ['verm', m.errors[0]];
    if (m.pending || m.revisionStale) return ['amar', m.statusReason || 'Pendente: gere a modulação de novo'];
    if (m.manual) return ['verde', 'Modulada (editada à mão)'];
    return ['verde', 'Modulada OK'];
  }
  function marca(i) {
    const c = state.walls[i]?.conf148; if (!c) return 'nao';
    return c.sig === assinatura(i) ? 'sim' : 'mudou';
  }
  function marcar(i, on) {
    const w = state.walls[i]; if (!w) return;
    if (on) w.conf148 = { sig: assinatura(i), em: new Date().toISOString() }; else delete w.conf148;
    desenhar(); cabecalhos();
  }

  // ---------------------------------------------------------------- painel
  const css = document.createElement('style'); css.id = 'conf148css';
  css.textContent = `#conf148{position:fixed;right:14px;top:150px;width:206px;max-height:calc(100vh - 220px);z-index:60;display:none;flex-direction:column;background:#fff;border:1px solid #b9c6d3;border-radius:9px;box-shadow:0 8px 24px rgba(16,46,75,.2);font:12px 'Segoe UI',Arial,sans-serif;color:#1d2b38}
body[data-v85="elev"] #conf148{display:flex}body.plotPrinting26 #conf148{display:none!important}
#conf148 .t{display:flex;align-items:center;gap:6px;padding:6px 8px;background:#102e4b;color:#fff;border-radius:8px 8px 0 0;cursor:move;user-select:none}#conf148 .t b{flex:1;font-size:12px}#conf148 .t button{background:none;border:0;color:#cfe0f0;cursor:pointer;font-size:13px;padding:0 2px}
#conf148 .pg{padding:6px 8px 4px}#conf148 .bar{height:6px;background:#e3eaf1;border-radius:4px;overflow:hidden}#conf148 .bar i{display:block;height:100%;background:linear-gradient(90deg,#1f7a3a,#3fae5a)}#conf148 .n{margin-top:3px;color:#36536f}#conf148 .n b{color:#0f3354}
#conf148 .f{display:flex;gap:3px;padding:0 8px 5px}#conf148 .f button{flex:1;border:1px solid #c9d5e0;background:#f5f8fb;border-radius:5px;padding:2px 0;font-size:11px;cursor:pointer;color:#36536f}#conf148 .f button.on{background:#174a78;border-color:#174a78;color:#fff}
#conf148 .l{overflow:auto;padding:0 4px 6px;flex:1;min-height:40px}#conf148 .r{display:flex;align-items:center;gap:5px;padding:2px 4px;border-radius:5px;cursor:pointer;line-height:1.35}#conf148 .r:hover{background:#eef4fa}#conf148 .r.vis{background:#fff4dc;box-shadow:inset 3px 0 0 #f2a516}
#conf148 .r .d{width:9px;height:9px;border-radius:50%;flex:0 0 9px}#conf148 .d.verde{background:#2e9d4f}#conf148 .d.amar{background:#e0a106}#conf148 .d.verm{background:#d03a2f}#conf148 .d.cinza{background:#9aa8b6}
#conf148 .r .nm{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#conf148 .r .nm small{color:#7a8a99}#conf148 .r .ck{border:0!important;background:none!important;box-shadow:none!important;color:#36536f!important;cursor:pointer;font-size:15px!important;padding:0 2px!important;margin:0!important;min-width:0!important;min-height:0!important;height:auto!important;line-height:1!important}#conf148 .r.sim .ck{color:#1f7a3a!important}#conf148 .r.mudou .ck{color:#b7791f!important}#conf148 .t button,#conf148 .f button{min-height:0!important;height:auto!important;box-shadow:none!important}#conf148 .t button{background:none!important;border:0!important;color:#cfe0f0!important}#conf148 .f button{background:#f5f8fb!important;color:#36536f!important;border:1px solid #c9d5e0!important}#conf148 .f button.on{background:#174a78!important;color:#fff!important;border-color:#174a78!important}#conf148 .r.sim .nm{color:#1f7a3a}#conf148 .r.sim .nm b{text-decoration:none}
#conf148 .vazio{padding:8px;color:#6a7c8e}#conf148 .leg{padding:4px 8px 6px;border-top:1px solid #e3eaf1;color:#6a7c8e;font-size:10.5px;display:flex;flex-wrap:wrap;gap:2px 8px}#conf148 .leg i{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:3px}
#conf148.min{width:auto;max-height:none}#conf148.min .pg,#conf148.min .f,#conf148.min .l,#conf148.min .leg{display:none}#conf148.min .t{border-radius:8px}
.conf148h{margin-left:8px!important;font-size:13px!important;border:1.5px solid #9fb0c0!important;background:#fff!important;color:#36536f!important;border-radius:14px!important;padding:3px 12px!important;cursor:pointer;vertical-align:middle;font-weight:600!important;box-shadow:none!important;min-height:0!important;height:auto!important;width:auto!important}.conf148h.sim{background:#e3f4e8!important;border-color:#2e9d4f!important;color:#1f7a3a!important}.conf148h.mudou{background:#fff4dc!important;border-color:#e0a106!important;color:#8a5a00!important}
@media print{#conf148,.conf148h{display:none!important}}`;
  document.head.append(css);
  const box = document.createElement('div'); box.id = 'conf148'; box.className = 'noPrint';
  box.innerHTML = `<div class="t"><b>✔ Conferência das paredes</b><button data-a="min" title="Recolher / abrir">▾</button></div><div class="pg"><div class="bar"><i></i></div><div class="n"></div></div>
<div class="f"><button data-f="todas">Todas</button><button data-f="fazer">A fazer</button><button data-f="ok">Conferidas</button></div><div class="l"></div>
<div class="leg"><span><i style="background:#2e9d4f"></i>OK</span><span><i style="background:#e0a106"></i>pendente</span><span><i style="background:#d03a2f"></i>sem modulação</span><span>☑ conferida por mim</span><span>⚠ mudou depois</span></div>`;
  document.body.append(box);
  let filtro = LS('conf148f') || 'fazer', visivel = -1;
  if (LS('conf148min') === '1') box.classList.add('min');
  try { const p = JSON.parse(LS('conf148pos') || 'null'); if (p) { box.style.left = p.x + 'px'; box.style.top = p.y + 'px'; box.style.right = 'auto'; } } catch {}
  const lista = box.querySelector('.l');
  function desenhar() {
    const W = state.walls || [];
    box.querySelectorAll('.f button').forEach(b => b.classList.toggle('on', b.dataset.f === filtro));
    let nivel = ''; try { const k = window.level68?.current?.(); if (k && k !== 'all') nivel = String(k).split('|')[1] || ''; } catch {}
    box.querySelector('.t b').textContent = '✔ Conferência' + (nivel ? ' · ' + nivel : '');
    if (!W.length) { lista.innerHTML = '<div class="vazio">Sem paredes neste nível.</div>'; box.querySelector('.n').textContent = ''; box.querySelector('.bar i').style.width = '0'; return; }
    let feitas = 0, okProg = 0; const linhas = [];
    W.forEach((w, i) => {
      const [cor, txt] = situacao(i), mk = marca(i); if (mk === 'sim') feitas++; if (cor === 'verde') okProg++;
      const mostra = filtro === 'todas' || (filtro === 'ok' ? mk === 'sim' : mk !== 'sim');
      if (!mostra) return;
      const ic = mk === 'sim' ? '☑' : mk === 'mudou' ? '⚠' : '☐', tit = mk === 'sim' ? 'Conferida por você — clique para desmarcar' : mk === 'mudou' ? 'Mudou depois de conferida — clique para marcar de novo' : 'Marcar como conferida';
      linhas.push(`<div class="r ${mk}${i === visivel ? ' vis' : ''}" data-i="${i}" title="${txt.replace(/"/g, '&quot;')}"><span class="d ${cor}"></span><span class="nm"><b>P${i + 1}</b> <small>${Math.round(Number(w.length) || 0)} cm</small></span><button class="ck" data-ck="${i}" title="${tit}">${ic}</button></div>`);
    });
    lista.innerHTML = linhas.join('') || `<div class="vazio">${filtro === 'fazer' ? '🎉 Todas as paredes conferidas.' : 'Nenhuma parede conferida ainda.'}</div>`;
    const pct = Math.round(feitas / W.length * 100);
    box.querySelector('.bar i').style.width = pct + '%';
    box.querySelector('.n').innerHTML = `<b>${feitas} / ${W.length}</b> conferidas (${pct}%) · ${okProg} OK no programa`;
  }
  box.addEventListener('click', e => {
    const ck = e.target.closest('[data-ck]'); if (ck) { const i = +ck.dataset.ck; marcar(i, marca(i) !== 'sim'); e.stopPropagation(); return; }
    const f = e.target.closest('[data-f]'); if (f) { filtro = f.dataset.f; LS('conf148f', filtro); desenhar(); return; }
    if (e.target.closest('[data-a="min"]')) { box.classList.toggle('min'); LS('conf148min', box.classList.contains('min') ? '1' : '0'); return; }
    const r = e.target.closest('.r[data-i]'); if (r) { const el = $id('wall-result-' + r.dataset.i); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); try { window.sel85set?.(+r.dataset.i); } catch {} }
  });
  // arrastar pelo título
  { const t = box.querySelector('.t'); let d = null;
    t.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; const r = box.getBoundingClientRect(); d = { dx: e.clientX - r.left, dy: e.clientY - r.top }; t.setPointerCapture(e.pointerId); });
    t.addEventListener('pointermove', e => { if (!d) return; const x = Math.max(0, Math.min(innerWidth - 80, e.clientX - d.dx)), y = Math.max(0, Math.min(innerHeight - 40, e.clientY - d.dy)); box.style.left = x + 'px'; box.style.top = y + 'px'; box.style.right = 'auto'; });
    t.addEventListener('pointerup', () => { if (!d) return; d = null; const r = box.getBoundingClientRect(); LS('conf148pos', JSON.stringify({ x: Math.round(r.left), y: Math.round(r.top) })); }); }

  // botão "Conferida" no título de cada elevação
  function cabecalhos() {
    const out = $id('output'); if (!out) return;
    for (const art of out.querySelectorAll('article[id^="wall-result-"]')) {
      const i = +art.id.slice(12), h = art.querySelector('h3'); if (!h || !state.walls[i]) continue;
      let b = h.querySelector('.conf148h'); if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'conf148h noPrint'; b.dataset.i = i; h.append(b); }
      const mk = marca(i); b.className = 'conf148h noPrint ' + mk; b.dataset.i = i;
      b.textContent = mk === 'sim' ? '☑ Conferida' : mk === 'mudou' ? '⚠ Mudou — conferir de novo' : '☐ Marcar como conferida';
    }
  }
  document.addEventListener('click', e => { const b = e.target.closest?.('.conf148h'); if (!b) return; e.preventDefault(); e.stopPropagation(); const i = +b.dataset.i; marcar(i, marca(i) !== 'sim'); }, true);

  // parede que está na tela
  let io = null;
  function observar() {
    try { io?.disconnect(); } catch {}
    if (!('IntersectionObserver' in window)) return;
    const vis = new Map();
    io = new IntersectionObserver(ents => { for (const e of ents) vis.set(+e.target.id.slice(12), e.isIntersecting ? e.intersectionRatio : 0); let best = -1, br = 0; for (const [i, r] of vis) if (r > br) { br = r; best = i; } if (best !== visivel) { visivel = best; for (const r of lista.querySelectorAll('.r')) r.classList.toggle('vis', +r.dataset.i === visivel); const el = lista.querySelector('.r.vis'); if (el && !box.classList.contains('min')) { const lr = lista.getBoundingClientRect(), er = el.getBoundingClientRect(); if (er.top < lr.top || er.bottom > lr.bottom) el.scrollIntoView({ block: 'nearest' }); } } }, { threshold: [0, .15, .35, .6] });
    for (const a of document.querySelectorAll('#output article[id^="wall-result-"]')) io.observe(a);
  }

  let tm = null;
  const atualizar = () => { if (tm) return; tm = setTimeout(() => { tm = null; if (document.body.dataset.v85 !== 'elev') return; try { desenhar(); cabecalhos(); observar(); } catch (e) { console.error('V148', e); } }, 120); };
  try { const rr = renderResults; renderResults = function (...a) { const r = rr.apply(this, a); atualizar(); return r; }; } catch {}
  try { const rw = renderWalls; renderWalls = function (...a) { const r = rw.apply(this, a); atualizar(); return r; }; } catch {}
  new MutationObserver(atualizar).observe(document.body, { attributes: true, attributeFilter: ['data-v85'] });
  window.conf148 = { desenhar: () => { desenhar(); cabecalhos(); }, marcar, marca, situacao };
})();
