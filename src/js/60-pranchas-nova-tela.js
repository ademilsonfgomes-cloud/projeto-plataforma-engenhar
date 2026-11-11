// V121 — NOVA TELA DE PRANCHAS (proposta aprovada)
//  • faixa com ícones em grupos: Montar · Organizar · Quadro selecionado · Aparência · Exportar
//  • coluna com as miniaturas das folhas (clicar vai até a folha; arrastar muda a ordem das folhas)
//  • a folha grande no centro, com zoom; quadro selecionado com mini barra flutuante
//  • painel à direita em abas: Folha (formato, orientação, escalas, paredes iguais) · Carimbo · Avisos
//  • barra de status embaixo
//  • ARRASTAR: o quadro fica onde você soltou; os quadros que estavam ali procuram outro lugar
//    (o espaço livre mais perto na mesma folha; se não houver, a folha seguinte ou uma folha nova).
// Usa as mesmas funções e campos de antes (só muda de lugar): nada da montagem/organização é refeito aqui.
(function () {
  'use strict';
  const N = Number, $id = id => document.getElementById(id);
  const sec = $id('plot26'); if (!sec || typeof previewPlot26 !== 'function') return;
  const ic = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const I = {
    montar: '<rect x="3" y="4" width="18" height="15" rx="1.5"/><path d="M3 9h18M9 9v10"/><path d="m14 13 2 2 3-4"/>',
    caber: '<path d="M4 9V4h5M20 15v5h-5M4 4l6 6M20 20l-6-6"/><rect x="9" y="9" width="6" height="6" rx="1"/>',
    org: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/>',
    comp: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><path d="M17 13v8M13 17h8" stroke-dasharray="2 1.5"/>',
    todas: '<rect x="6" y="3" width="15" height="13" rx="1"/><path d="M3 7v13h14"/><path d="M9 7h9M9 10h9M9 13h5"/>',
    zero: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
    ant: '<rect x="9" y="4" width="12" height="16" rx="1"/><path d="M7 12H2m3-3-3 3 3 3"/>',
    prox: '<rect x="3" y="4" width="12" height="16" rx="1"/><path d="M17 12h5m-3-3 3 3-3 3"/>',
    texto: '<path d="M4 19 9 5l5 14M6 14h6M15 19l3-8 3 8M16 17h4"/>',
    pdf: '<path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/><path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9v-3zm0 3v2M13 13v5h1a2 2 0 0 0 0-5h-1zM18 13h-2v5M16 15.5h1.5"/>',
    dxf: '<path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/><path d="M9 18l3-5 3 5M10 16h4"/>',
    imp: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="1.5"/><path d="M7 14h10v7H7z"/>',
    web: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 8h18M7 12h10M7 15h6"/><path d="M15 17l2 2 3-4"/>',
    folha: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    carimbo: '<rect x="3" y="14" width="18" height="6" rx="1"/><path d="M8 14v-3a4 4 0 1 1 8 0v3"/>',
    aviso: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
    mais: '<path d="M12 5v14M5 12h14"/>', menos: '<path d="M5 12h14"/>', fit: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
    lixo: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', iguais: '<rect x="3" y="5" width="8" height="14" rx="1"/><rect x="13" y="5" width="8" height="14" rx="1"/><path d="M11 10h2M11 14h2"/>',
  };
  const status = t => { const s = $id('plotStatus26'); if (s) s.textContent = t; };
  const clica = id => { const b = $id(id); if (b) b.click(); else status('Função indisponível nesta versão.'); };

  // ---------------------------------------------------------------- estrutura
  const rib = document.createElement('div'); rib.id = 'pr121rib'; rib.className = 'noPrint';
  const bt = (k, txt, icon, tip, cls = '') => `<button type="button" class="b121 ${cls}" data-a="${k}" title="${tip}">${ic(I[icon])}<span>${txt}</span></button>`;
  rib.innerHTML =
    `<div class="g121"><div>${bt('montar', 'Montar pranchas', 'montar', 'Monta / atualiza as pranchas (mantém a sua organização)', 'prim')}${bt('caber', 'Caber na folha', 'caber', 'Ajusta a escala para todos os quadros caberem na folha')}</div><small>Montar</small></div>` +
    `<div class="g121"><div>${bt('orgA', 'Organizar folha', 'org', 'Arruma os quadros da folha em linhas, na ordem da numeração')}${bt('orgB', 'Organizar e completar', 'comp', 'Organiza e puxa quadros da folha seguinte para os espaços livres')}${bt('orgC', 'Organizar todas', 'todas', 'Organiza todas as folhas, completando cada uma')}${bt('orgZ', 'Do zero', 'zero', 'Descarta a organização e monta de novo')}</div><small>Organizar</small></div>` +
    `<div class="g121"><div>${bt('ant', 'Folha anterior', 'ant', 'Leva o quadro selecionado para a folha anterior')}${bt('prox', 'Próxima folha', 'prox', 'Leva o quadro selecionado para a próxima folha')}<label class="b121 mv121" title="Leva o quadro selecionado para a folha nº"><span class="mvn121">p/ folha <input id="pr121n" type="number" min="1" step="1"></span><span>Mover quadro</span></label></div><small>Quadro selecionado</small></div>` +
    `<div class="g121"><div>${bt('textos', 'Textos', 'texto', 'Tamanho dos textos das pranchas (mm)')}</div><small>Aparência</small></div>` +
    `<div class="g121"><div>${bt('pdf', 'PDF', 'pdf', 'Baixar as pranchas em PDF', 'pdf121')}${bt('dxf', 'DXF', 'dxf', 'Baixar as pranchas em DXF', 'exp121')}${bt('imp', 'Imprimir', 'imp', 'Imprimir / salvar PDF pelo navegador', 'exp121')}${bt('web', 'Gráfica', 'web', 'Baixar as pranchas num arquivo para imprimir em outro computador', 'exp121')}</div><small>Exportar</small></div>`;
  const th = document.createElement('aside'); th.id = 'pr121th'; th.className = 'noPrint';
  const mesa = document.createElement('section'); mesa.id = 'pr121mesa';
  const pn = document.createElement('aside'); pn.id = 'pr121pn'; pn.className = 'noPrint';
  pn.innerHTML = `<div class="tb121"><button type="button" data-t="folha" class="on">${ic(I.folha)}Folha</button><button type="button" data-t="carimbo">${ic(I.carimbo)}Carimbo</button><button type="button" data-t="avisos">${ic(I.aviso)}Avisos <i id="pr121nav"></i></button></div>
    <div class="pg121" data-p="folha"><div class="f121"><div class="l121">Formato</div><div class="chips121" id="pr121fmt"></div></div><div class="f121"><div class="l121">Orientação</div><div class="chips121" id="pr121ori"></div></div><div class="row121" id="pr121esc"></div><div class="card121" id="pr121ig"><h5>${ic(I.iguais)}Paredes iguais</h5></div></div>
    <div class="pg121" data-p="carimbo" hidden><div class="grid121" id="pr121car"></div></div>
    <div class="pg121" data-p="avisos" hidden><div id="pr121av"></div><div class="acts121"><button type="button" data-a="caber">Caber na folha</button><button type="button" data-a="maior">Usar folha maior</button></div></div>`;
  const st = document.createElement('div'); st.id = 'pr121st'; st.className = 'noPrint';
  const zoom = document.createElement('div'); zoom.id = 'pr121zoom'; zoom.className = 'noPrint';
  zoom.innerHTML = `<button type="button" data-z="-" title="Diminuir">${ic(I.menos)}</button><span id="pr121zv">40%</span><button type="button" data-z="+" title="Aumentar">${ic(I.mais)}</button><button type="button" data-z="fit" title="Ajustar a folha à tela">${ic(I.fit)}</button>`;
  const flut = document.createElement('div'); flut.id = 'pr121flut'; flut.className = 'noPrint'; flut.hidden = true;
  flut.innerHTML = `<button type="button" data-a="ant" title="Para a folha anterior">${ic(I.ant)}</button><button type="button" data-a="prox" title="Para a próxima folha">${ic(I.prox)}</button><button type="button" data-a="tirar" title="Tirar este quadro das pranchas (volta ao Montar do zero)">${ic(I.lixo)}</button>`;
  sec.prepend(rib); sec.append(th, mesa, pn, st);
  // largura da área da folha acompanhada por observador (ler clientWidth logo depois de desenhar forçava o layout de todas as folhas)
  let largMesa = 0; try { new ResizeObserver(en => { largMesa = en[0].contentRect.width + 48; }).observe(mesa); } catch {}
  const larguraMesa = () => largMesa || mesa.clientWidth;
  const vazio = document.createElement('div'); vazio.id = 'pr121vazio'; vazio.className = 'noPrint'; vazio.hidden = true;
  mesa.append(flut, vazio); sec.append(zoom);
  vazio.addEventListener('click', e => { const b = e.target.closest('button[data-a]'); if (b) acao(b.dataset.a); });
  function cartaoVazio() {
    const S = plotSheets26 || [], txt = ($id('plotStatus26')?.textContent || '').trim(); if (S.length) { vazio.hidden = true; return; }
    const naoCabe = /não cabe/i.test(txt);
    vazio.hidden = false;
    vazio.innerHTML = naoCabe ? `<div class="vz121 av">${ic(I.aviso)}<h3>Os desenhos não cabem na folha nesta escala</h3><p>${txt.replace(/</g, '&lt;')}</p><div><button type="button" data-a="caber" class="p">${ic(I.caber)}Caber na folha</button><button type="button" data-a="maior">${ic(I.folha)}Usar folha maior</button></div></div>`
      : `<div class="vz121">${ic(I.montar)}<h3>Pranchas ainda não montadas</h3><p>${txt ? txt.replace(/</g, '&lt;') : 'Gere a modulação e clique em Montar pranchas.'}</p><div><button type="button" data-a="montar" class="p">${ic(I.montar)}Montar pranchas</button></div></div>`;
  }

  // move os elementos existentes (mantêm os mesmos comportamentos)
  function montar() {
    const prev = $id('plotPreview26'); if (prev && prev.parentElement !== mesa) mesa.prepend(prev);
    const lab = id => $id(id)?.closest('label');
    const esc = $id('pr121esc');
    for (const id of ['plotScale26', 'plotElevScale82']) { const l = lab(id); if (l && l.parentElement !== esc) esc.append(l); }
    const car = $id('pr121car');
    for (const id of ['st106tit', 'st106cli', 'plotEngineer26', 'plotCrea26', 'st106prof', 'plotRevision26', 'plotClient27', 'plotDate27', 'st106apr', 'st106lg']) { const l = lab(id); if (l && l.parentElement !== car) car.append(l); }
    const ig = $id('pr121ig');
    for (const el of [document.querySelector('label.iguais117'), $id('iguaisBox117')]) if (el && el.parentElement !== ig) ig.append(el);
    const av = $id('pr121av'), ps = $id('plotStatus26'); if (ps && ps.parentElement !== av) av.prepend(ps);
    chips();
  }
  function chips() {
    const fmt = $id('plotFormat26'), ori = $id('plotOrientation26');
    const faz = (host, sel) => { if (!host || !sel) return; host.innerHTML = [...sel.options].map(o => `<button type="button" class="chip121${o.value === sel.value ? ' on' : ''}" data-v="${o.value}">${o.value === 'landscape' ? '▭ ' : o.value === 'portrait' ? '▯ ' : ''}${o.textContent}</button>`).join('');
      host.onclick = e => { const b = e.target.closest('[data-v]'); if (!b || sel.value === b.dataset.v) return; sel.value = b.dataset.v; sel.dispatchEvent(new Event('change', { bubbles: true })); faz(host, sel); barra(); }; };
    faz($id('pr121fmt'), fmt); faz($id('pr121ori'), ori);
  }
  montar(); setTimeout(montar, 900); setTimeout(montar, 2500);

  // abas
  pn.querySelector('.tb121').onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; pn.querySelectorAll('.tb121 button').forEach(x => x.classList.toggle('on', x === b)); pn.querySelectorAll('.pg121').forEach(p => p.hidden = p.dataset.p !== b.dataset.t); };

  // ---------------------------------------------------------------- ações
  function acao(a) {
    try {
      if (a === 'montar') buildPlot26();
      else if (a === 'caber') buildPlot26(true);
      else if (a === 'orgA') clica('org107a'); else if (a === 'orgB') clica('org107b'); else if (a === 'orgC') clica('org107c'); else if (a === 'orgZ') clica('org107z');
      else if (a === 'ant') transferSelected33(-1); else if (a === 'prox') transferSelected33(1);
      else if (a === 'textos') clica('txt85btn');
      else if (a === 'pdf') downloadPDF26(); else if (a === 'dxf') clica('plotDXF36'); else if (a === 'imp') printPlot26(); else if (a === 'web') downloadPlot26();
      else if (a === 'maior') { const f = $id('plotFormat26'); if (f && f.selectedIndex > 0) { f.selectedIndex--; f.dispatchEvent(new Event('change', { bubbles: true })); chips(); buildPlot26(); } else status('Já está na maior folha disponível.'); }
      else if (a === 'tirar') tirar();
    } catch (e) { console.error('V121 ação', a, e); }
    setTimeout(depois, 60);
  }
  for (const host of [rib, flut, pn]) host.addEventListener('click', e => { const b = e.target.closest('button[data-a]'); if (b) acao(b.dataset.a); });
  $id('pr121n').addEventListener('keydown', e => { if (e.key !== 'Enter') return; e.preventDefault(); const n = $id('org107n'); if (n) { n.value = e.target.value; clica('org107d'); setTimeout(depois, 60); } });
  function tirar() {
    const s = selectedPlot33, it = s && plotSheets26[s.si]?.items[s.ii]; if (!it) return;
    if (!confirm('Tirar "' + (it.title || 'quadro') + '" das pranchas?\n(Ele volta se você usar Montar do zero.)')) return;
    plotSheets26[s.si].items.splice(s.ii, 1); plotSheets26 = plotSheets26.filter(x => x.items.length); selectedPlot33 = null; previewPlot26(); refreshPlotMove33?.();
    status('"' + (it.title || 'Quadro') + '" tirado das pranchas.');
  }

  // ---------------------------------------------------------------- zoom
  const zsel = () => $id('plotZoom26');
  function setZoom(z) { const s = zsel(); if (!s) return; z = Math.max(.1, Math.min(1.5, z)); let o = [...s.options].find(o => Math.abs(N(o.value) - z) < .001); if (!o) { o = new Option(Math.round(z * 100) + '%', String(Math.round(z * 1000) / 1000)); s.add(o); } s.value = o.value; previewPlot26(); }
  let zoomManual = false;
  const ajustar = () => { const [W] = sheetSize26(); if (larguraMesa() > 200) setZoom(Math.floor((larguraMesa() - 60) / (W * 96 / 25.4) * 100) / 100); };
  zoom.onclick = e => {
    const b = e.target.closest('[data-z]'); if (!b) return; zoomManual = b.dataset.z !== 'fit'; const z = N(zsel()?.value) || .4, passos = [.15, .2, .25, .3, .4, .5, .6, .8, 1, 1.25, 1.5];
    if (b.dataset.z === '+') setZoom(passos.find(p => p > z + .001) || 1.5);
    else if (b.dataset.z === '-') setZoom([...passos].reverse().find(p => p < z - .001) || .15);
    else ajustar();
  };

  // ---------------------------------------------------------------- miniaturas
  const nome = sheet => { const t = sheet.items.map(q => String(q.title || '')).join(' '); return /fiada · planta|Planta de lajes|Mapa de cargas/.test(t) && !/^Parede/m.test(sheet.items.map(q => q.title).join('\n')) ? 'Plantas' : /Parede/.test(t) ? 'Paredes' : /Resumo|Quantitativo|Tabela|Resist/.test(t) ? 'Resumos' : 'Folha'; };
  let arrTh = null;
  function miniaturas() {
    const [W, H] = sheetSize26(), S = plotSheets26 || [], cur = atual();
    th.innerHTML = `<h4>${ic(I.folha)}Folhas (${S.length})</h4>` + S.map((sh, i) => {
      const warn = sh.items.filter(q => /pendente/i.test(q.title || '')).length;
      const r = sh.items.map(q => `<rect x="${q.x}" y="${q.y}" width="${q.w}" height="${q.h}" class="${/Resumo|Quantitativo|Tabela/.test(q.title || '') ? 'c' : ''}"/>`).join('');
      return `<div class="th121${i === cur ? ' on' : ''}" draggable="true" data-i="${i}">${warn ? `<b class="w121" title="${warn} quadro(s) com revisão pendente">⚠ ${warn}</b>` : ''}<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"><rect x="0" y="0" width="${W}" height="${H}" class="pg"/>${r}<rect x="${W - 190}" y="${H - 46}" width="180" height="40" class="c"/></svg><span>${i + 1} · ${nome(sh)} <em>${sh.items.length} quadro${sh.items.length === 1 ? '' : 's'}</em></span></div>`;
    }).join('') + (S.length ? '' : '<p class="v121">Clique em <b>Montar pranchas</b>.</p>');
  }
  th.addEventListener('click', e => { const t = e.target.closest('.th121'); if (!t) return; irPara(N(t.dataset.i)); });
  th.addEventListener('dragstart', e => { const t = e.target.closest('.th121'); if (!t) return; arrTh = N(t.dataset.i); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(arrTh)); } catch {} t.classList.add('arr'); });
  th.addEventListener('dragover', e => { if (arrTh == null) return; e.preventDefault(); const t = e.target.closest('.th121'); th.querySelectorAll('.th121').forEach(x => x.classList.toggle('alvo', x === t)); });
  th.addEventListener('dragend', () => { arrTh = null; th.querySelectorAll('.th121').forEach(x => x.classList.remove('alvo', 'arr')); });
  th.addEventListener('drop', e => {
    e.preventDefault(); const t = e.target.closest('.th121'), de = arrTh; arrTh = null; if (de == null || !t) return; const para = N(t.dataset.i); if (para === de) return;
    const S = plotSheets26.slice(), [m] = S.splice(de, 1); S.splice(para, 0, m); plotSheets26 = S; selectedPlot33 = null; previewPlot26(); try { refreshPlotMove33(); } catch {}
    status('Folha ' + (de + 1) + ' passou a ser a folha ' + (para + 1) + '. Numeração e carimbos atualizados.'); setTimeout(() => irPara(para), 50);
  });
  const vistas = () => [...mesa.querySelectorAll('#plotPreview26 .plotViewport26')];
  function atual() { const vs = vistas(); if (!vs.length) return 0; const R = mesa.getBoundingClientRect(); let best = 0, bv = -1; vs.forEach((v, i) => { const r = v.getBoundingClientRect(), vis = Math.max(0, Math.min(R.bottom, r.bottom) - Math.max(R.top, r.top)); if (vis > bv) { bv = vis; best = i; } }); return best; }
  function irPara(i) { const v = vistas()[i]; if (v) mesa.scrollTo({ top: v.offsetTop - 16, behavior: 'smooth' }); }
  let rolando = 0; mesa.addEventListener('scroll', () => { if (rolando) return; rolando = requestAnimationFrame(() => { rolando = 0; const c = atual(); th.querySelectorAll('.th121').forEach(x => x.classList.toggle('on', N(x.dataset.i) === c)); barra(); posFlut(); }); });

  // ---------------------------------------------------------------- quadro selecionado, selos "= n", status
  function selos() { for (const n of mesa.querySelectorAll('.plotItem26')) { const t = n.querySelector('.plotItemTitle26')?.textContent || ''; const m = /\((\d+) paredes iguais\)/.exec(t); if (m && !n.querySelector('.selo121')) { const s = document.createElement('i'); s.className = 'selo121 noPrint'; s.textContent = '= ' + m[1]; n.append(s); } } }
  function posFlut() {
    const s = selectedPlot33, node = s && mesa.querySelector('.plotSheet26[data-sheet="' + s.si + '"] .plotItem26[data-item="' + s.ii + '"]');
    mesa.querySelectorAll('.plotItem26.sel121').forEach(x => { if (x !== node) x.classList.remove('sel121'); });
    if (!node) { flut.hidden = true; return; }
    node.classList.add('sel121'); const r = node.getBoundingClientRect(), R = mesa.getBoundingClientRect();
    flut.hidden = false; flut.style.left = (r.left - R.left + mesa.scrollLeft + r.width / 2 - flut.offsetWidth / 2) + 'px'; flut.style.top = Math.max(mesa.scrollTop + 4, r.top - R.top + mesa.scrollTop - flut.offsetHeight - 6) + 'px';
  }
  function barra() {
    const S = plotSheets26 || [], q = S.reduce((s, x) => s + x.items.length, 0), u = window.iguais117?.ultimo?.() || { economia: 0 };
    const f = $id('plotFormat26')?.value || '', o = $id('plotOrientation26')?.value === 'portrait' ? 'retrato' : 'paisagem', e = $id('plotScale26')?.value || '';
    const sel = selectedPlot33 && S[selectedPlot33.si]?.items[selectedPlot33.ii];
    st.innerHTML = S.length ? `<span>Folha <b>${atual() + 1} de ${S.length}</b></span><span><b>${f}</b> ${o} · <b>1:${e}</b></span><span><b>${q}</b> quadros${u.economia ? ' (' + u.economia + ' a menos com paredes iguais)' : ''}</span><span>${sel ? 'Selecionado: <b>' + String(sel.title || '').replace(/</g, '&lt;').slice(0, 60) + '</b> · folha ' + (selectedPlot33.si + 1) : 'Clique num quadro para selecionar · arraste para mover'}</span>` : '<span>Gere a modulação e clique em <b>Montar pranchas</b>.</span>';
    { const m = ($id('plotStatus26')?.textContent || '').trim(); if (m) st.insertAdjacentHTML('beforeend', '<span class="msg121" title="' + m.replace(/"/g, '&quot;') + '">' + m.replace(/</g, '&lt;') + '</span>'); }
    const txt = $id('plotStatus26')?.textContent || '', n = /não cabe|pendente|recusad|desfeito|não há|não foi possível|indispon/i.test(txt) ? 1 : 0, b = $id('pr121nav');
    if (b) { b.textContent = n ? '1' : ''; b.style.display = n ? '' : 'none'; }
    const zv = $id('pr121zv'); if (zv) zv.textContent = Math.round((N(zsel()?.value) || .4) * 100) + '%';
  }
  let ajustando = false;
  function depois() { cartaoVazio(); if (!zoomManual && !ajustando && plotSheets26?.length && document.body.dataset.v85 === 'plot') { const [W] = sheetSize26(), alvo = Math.floor((larguraMesa() - 60) / (W * 96 / 25.4) * 100) / 100; if (larguraMesa() > 200 && Math.abs((N(zsel()?.value) || 0) - alvo) > .011) { ajustando = true; try { setZoom(alvo); } finally { ajustando = false; } return; } } miniaturas(); selos(); posFlut(); barra(); }
  try { const p0 = previewPlot26; previewPlot26 = function (...a) { const r = p0.apply(this, a); try { depois(); } catch (e) { console.error('V121', e); } return r; }; } catch {}
  try { const r0 = refreshPlotMove33; refreshPlotMove33 = function (...a) { const r = r0.apply(this, a); try { depois(); } catch {} return r; }; } catch {}
  new MutationObserver(() => { barra(); cartaoVazio(); }).observe($id('plotStatus26') || sec, { childList: true, characterData: true, subtree: true });
  mesa.addEventListener('pointerup', () => setTimeout(() => { posFlut(); barra(); }, 30));
  window.addEventListener('resize', () => posFlut());

  // ---------------------------------------------------------------- ARRASTAR: o quadro fica onde soltou; os outros procuram lugar
  function livreMaisPerto(sheet, item, x, y) {
    const [W, H] = sheetSize26(); let best = null, bd = Infinity; const passo = 5;
    for (let r = 0; r <= Math.max(W, H); r += passo) {
      if (r > bd) break;
      for (let dx = -r; dx <= r; dx += passo) for (const dy of (Math.abs(dx) === r ? Array.from({ length: 2 * r / passo + 1 }, (_, i) => -r + i * passo) : [-r, r])) {
        const X = x + dx, Y = y + dy; if (plotPositionFree33(sheet, item, X, Y)) { const d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = { x: X, y: Y }; } }
      }
    }
    return best;
  }
  function colocar(si, ii, ti, x, y) {
    const from = plotSheets26[si], to = plotSheets26[ti], item = from?.items[ii]; if (!to || !item) return null;
    // 1) onde soltou (se sair da área útil da folha, o mais perto dentro dela)
    let P = plotPositionFree33({ items: [] }, item, x, y) ? { x, y } : livreMaisPerto({ items: [] }, item, x, y); if (!P) return null;
    from.items.splice(ii, 1); item.x = P.x; item.y = P.y; to.items.push(item);
    // 2) quem estava embaixo sai e procura o espaço livre mais perto do lugar onde estava
    const caixa = { x: P.x, y: P.y, w: item.w, h: item.h }, saem = to.items.filter(q => q !== item && overlap25(caixa, q, 0));
    to.items = to.items.filter(q => !saem.includes(q));
    const rel = []; let novas = 0;
    for (const q of saem.sort((a, b) => (a.ord107 ?? 1e9) - (b.ord107 ?? 1e9))) {
      let L = livreMaisPerto(to, q, q.x, q.y);
      if (L) { q.x = L.x; q.y = L.y; to.items.push(q); rel.push({ q, f: ti }); continue; }
      let ok = false;
      for (let t = ti + 1; t < plotSheets26.length && !ok; t++) { const T = plotSheets26[t]; L = livreMaisPerto(T, q, 10, 10); if (L) { q.x = L.x; q.y = L.y; T.items.push(q); rel.push({ q, f: t }); ok = true; } }
      if (!ok) { const T = { items: [] }; L = livreMaisPerto(T, q, 10, 10) || { x: 10, y: 10 }; q.x = L.x; q.y = L.y; T.items.push(q); plotSheets26.splice(ti + 1 + novas, 0, T); novas++; rel.push({ q, f: ti + novas }); }
    }
    plotSheets26 = plotSheets26.filter(s => s.items.length);
    selectedPlot33 = { si: plotSheets26.indexOf(to), ii: to.items.indexOf(item) };
    return { item, rel, novas };
  }
  window.colocar121 = colocar;
  function scrollerOf(el) { for (let e = el.parentElement; e; e = e.parentElement) { const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 2) return e; } return document.scrollingElement || document.documentElement; }
  startPlotDrag26 = function (e) {
    if (e.button !== 0) return; const n = e.currentTarget, sheetNode = n.closest('.plotSheet26'), si = N(sheetNode.dataset.sheet), ii = N(n.dataset.item), item = plotSheets26[si]?.items[ii]; if (!item) return;
    const sc = scrollerOf(sheetNode), s0 = sc.scrollTop, sx0 = sc.scrollLeft, start = { x: e.clientX, y: e.clientY, ix: item.x, iy: item.y }, r0 = sheetNode.getBoundingClientRect(), factor = r0.width / sheetSize26()[0], grabX = (e.clientX - r0.left) / factor - item.x, grabY = (e.clientY - r0.top) / factor - item.y;
    selectedPlot33 = { si, ii }; e.preventDefault(); document.body.classList.add('drag107'); n.setPointerCapture(e.pointerId); n.style.zIndex = '50'; n.style.outline = '0.6mm dashed #1d4f86'; flut.hidden = true;
    let last = { x: e.clientX, y: e.clientY }, raf = 0, live = true, mexeu = false;
    const place = () => { const dy = sc.scrollTop - s0, dx = sc.scrollLeft - sx0; n.style.left = (start.ix + (last.x - start.x + dx) / factor) + 'mm'; n.style.top = (start.iy + (last.y - start.y + dy) / factor) + 'mm'; };
    const tick = () => { if (!live) return; const R = sc === document.scrollingElement || sc === document.documentElement ? { top: 0, bottom: innerHeight } : sc.getBoundingClientRect(), m = 28; let v = 0; if (last.y < R.top + m) v = -Math.ceil((R.top + m - last.y) / 4); else if (last.y > R.bottom - m) v = Math.ceil((last.y - (R.bottom - m)) / 4); if (v && mexeu) { sc.scrollTop += v; place(); } raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick);
    const move = ev => { last = { x: ev.clientX, y: ev.clientY }; if (Math.hypot(last.x - start.x, last.y - start.y) > 3) mexeu = true; place(); };
    const end = ev => {
      live = false; cancelAnimationFrame(raf); document.body.classList.remove('drag107'); n.removeEventListener('pointermove', move); n.removeEventListener('pointerup', end); n.removeEventListener('pointercancel', end); n.style.zIndex = ''; n.style.outline = '';
      if (ev.type === 'pointercancel' || !mexeu) { previewPlot26(); return; }
      let tgt = null, bo = 0;
      for (const node of $id('plotPreview26').querySelectorAll('.plotSheet26')) { const r = node.getBoundingClientRect(); const dentro = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom; const d = ev.clientY < r.top ? r.top - ev.clientY : ev.clientY > r.bottom ? ev.clientY - r.bottom : 0; const sc2 = dentro ? 1e9 : -d; if (tgt == null || sc2 > bo) { bo = sc2; tgt = node; } }
      let res = null;
      if (tgt) { const r = tgt.getBoundingClientRect(), ti = N(tgt.dataset.sheet), f = r.width / sheetSize26()[0]; res = colocar(si, ii, ti, (ev.clientX - r.left) / f - grabX, (ev.clientY - r.top) / f - grabY); }
      previewPlot26(); try { refreshPlotMove33(); } catch {}
      if (!res) { status('Não foi possível colocar o quadro aí.'); return; }
      const fora = res.rel.filter(o => o.f !== plotSheets26.indexOf(plotSheets26.find(s => s.items.includes(res.item))));
      status('"' + String(res.item.title || 'Quadro').slice(0, 50) + '" ficou onde você soltou.' + (res.rel.length ? ' ' + res.rel.length + ' quadro(s) que estavam ali foram para o espaço livre mais perto' + (fora.length ? ' (' + fora.length + ' na folha ' + [...new Set(fora.map(o => o.f + 1))].join(', ') + ')' : '') + '.' : '') + (res.novas ? ' Foi criada ' + res.novas + ' folha nova.' : ''));
    };
    n.addEventListener('pointermove', move); n.addEventListener('pointerup', end); n.addEventListener('pointercancel', end);
  };

  // ---------------------------------------------------------------- estilo
  const css = document.createElement('style');
  css.textContent = `
body[data-v85=plot] #plot26.on85{display:grid!important;grid-template-columns:172px minmax(0,1fr) 300px;grid-template-rows:auto minmax(0,1fr) 28px;padding:0!important;overflow:hidden!important;background:#eef2f6}
body[data-v85=plot] #plot26>.noPrint:not([id^=pr121]){display:none!important}
body[data-v85=plot] #org107f{display:none!important}
#pr121rib{grid-column:1/4;display:flex;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:thin;align-items:stretch;gap:4px;padding:5px 8px;background:linear-gradient(180deg,#eef5fc,#dcebf8);border-bottom:1px solid #c3d6ea}
.g121{display:flex;flex-direction:column;padding:0 7px;border-right:1px solid #c3d6ea}.g121:last-child{border:0}.g121>div{display:flex;gap:2px;flex:1;align-items:stretch}
.g121 small{font-size:10px;color:#5b7189;text-align:center;letter-spacing:.3px;text-transform:uppercase;margin-top:2px}
.b121{display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:50px!important;height:50px!important;min-height:0!important;padding:2px 6px!important;margin:0!important;border-radius:7px!important;font:11px "Segoe UI",Arial,sans-serif!important;color:#17324d!important;background:transparent!important;border:1px solid transparent!important;box-shadow:none!important;height:auto!important;white-space:nowrap;cursor:pointer}
.b121 span{font:inherit!important;line-height:1.15}.b121:hover{background:#cfe2f4!important;border-color:#9fc0de!important}.b121 svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.b121.prim{background:#1d8a4c!important;color:#fff!important;border-color:#17703d!important;padding:3px 12px!important}.b121.prim:hover{background:#17703d!important}
.b121.pdf121{background:#fff3e6!important;border-color:#f0c48e!important}.b121.pdf121 svg,.b121.exp121 svg{stroke:#b4471b}
.mv121{cursor:default}.mvn121{display:flex;align-items:center;gap:3px;color:#5b7189}.mvn121 input{width:40px!important;height:20px!important;min-height:0!important;margin:0!important;padding:0 3px!important;border:1px solid #c3d6ea!important;border-radius:5px!important;text-align:center;font-size:12px}
#pr121th{grid-row:2;overflow:auto;background:#f7f9fb;border-right:1px solid #c3d6ea;padding:10px}
#pr121th h4,.tb121{font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#5b7189}
#pr121th h4{margin:0 0 8px;display:flex;align-items:center;gap:6px}#pr121th h4 svg,.tb121 svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8}
.th121{background:#fff;border:1px solid #d4dde6;border-radius:6px;padding:6px;margin-bottom:9px;position:relative;cursor:grab;user-select:none}
.th121:hover{border-color:#9fb7cf}.th121.on{border:2px solid #2a7fd4;box-shadow:0 0 0 3px #2a7fd422}.th121.alvo{box-shadow:0 -4px 0 #1d8a4c}.th121.arr{opacity:.45}
.th121 svg{width:100%;display:block}.th121 .pg{fill:#fff;stroke:#9aa9b8;stroke-width:3}.th121 rect:not(.pg){fill:#d9e5f1;stroke:#9fb7cf;stroke-width:2}.th121 rect.c{fill:#f1f3f5;stroke:#aab4bf}
.th121 span{font-size:11px;display:flex;justify-content:space-between;margin-top:4px;color:#17324d}.th121 em{font-style:normal;color:#5b7189}
.w121{position:absolute;top:3px;right:5px;background:#e8930c;color:#fff;border-radius:8px;font-size:10px;padding:0 5px;font-weight:600}.v121{font-size:12px;color:#5b7189}
#pr121mesa{grid-row:2;position:relative;overflow:auto;background:#5d6b78 radial-gradient(#6a7885 1px,transparent 1px) 0 0/14px 14px;padding:24px 24px 60px}
#pr121mesa #plotPreview26:empty{display:none}#pr121mesa #plotPreview26{display:flex;flex-direction:column;align-items:center;gap:22px}
#pr121mesa .plotViewport26{box-shadow:0 10px 30px #0006;background:#fff}
#pr121mesa .plotItem26{cursor:grab}#pr121mesa .plotItem26.sel121{outline:.7mm solid #2a7fd4;outline-offset:.8mm}
.selo121{position:absolute;top:-3.2mm;right:3mm;background:#1d8a4c;color:#fff;font:700 3mm/4.4mm Arial;border-radius:2.2mm;padding:0 1.6mm;font-style:normal}
body[data-v85=plot] #pr121zoom{display:flex}#pr121zoom{display:none;position:absolute;right:316px;bottom:42px;z-index:8;gap:2px;align-items:center;background:#ffffffe8;border-radius:8px;padding:3px;font-size:12px;box-shadow:0 4px 12px #0003}
#pr121zoom button,#pr121flut button{display:grid!important;place-items:center;width:28px!important;min-width:0!important;height:26px!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:5px!important;background:none!important;box-shadow:none!important;color:#17324d!important;cursor:pointer}
#pr121zoom button:hover,#pr121flut button:hover{background:#e3edf7!important}#pr121zoom svg,#pr121flut svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}#pr121zv{min-width:38px;text-align:center}
#pr121flut{position:absolute;z-index:9;display:flex;gap:2px;background:#fff;border:1px solid #b9c6d3;border-radius:8px;padding:3px;box-shadow:0 6px 16px #0003}#pr121flut[hidden]{display:none}
#pr121pn{grid-row:2;background:#fff;border-left:1px solid #c3d6ea;display:flex;flex-direction:column;min-height:0}
.tb121{display:flex;border-bottom:1px solid #c3d6ea;text-transform:none;letter-spacing:0}.tb121 button{flex:1;display:flex!important;align-items:center;justify-content:center;gap:5px;padding:9px 0!important;margin:0!important;border:0!important;border-radius:0!important;background:none!important;box-shadow:none!important;color:#5b7189!important;font:12px "Segoe UI",Arial,sans-serif!important;height:auto!important;min-height:0!important;cursor:pointer}
.tb121 button.on{color:#17324d!important;font-weight:600!important;box-shadow:inset 0 -2px 0 #2a7fd4!important}.tb121 i{font-style:normal;background:#e8930c;color:#fff;border-radius:7px;font-size:10px;padding:0 5px}
.pg121{padding:12px 14px;overflow:auto;display:flex;flex-direction:column;gap:14px}.pg121[hidden]{display:none}
.l121{font-size:11px;color:#5b7189;margin-bottom:5px}.chips121{display:flex;gap:5px;flex-wrap:wrap}
.chip121{border:1px solid #b9c6d3!important;border-radius:14px!important;padding:3px 11px!important;font:12px "Segoe UI",Arial,sans-serif!important;background:#fff!important;color:#17324d!important;margin:0!important;height:auto!important;min-height:0!important;min-width:0!important;box-shadow:none!important;cursor:pointer}.chip121:hover{border-color:#2a7fd4!important}.chip121.on{background:#2a7fd4!important;border-color:#2a7fd4!important;color:#fff!important}
.row121,.grid121{display:grid;grid-template-columns:1fr 1fr;gap:8px}.grid121{grid-template-columns:1fr}
.row121 label,.grid121 label{display:flex;flex-direction:column;gap:3px;font-size:11px;color:#5b7189;margin:0}.row121 input,.grid121 input{margin:0;width:100%}
.card121{border:1px solid #d6e2ee;border-radius:8px;padding:9px 10px;background:#f7fafd}.card121 h5{margin:0 0 6px;font-size:12px;display:flex;align-items:center;gap:6px}.card121 h5 svg{width:16px;height:16px;fill:none;stroke:#1d8a4c;stroke-width:1.8}
.card121 #iguaisBox117{margin:6px 0 0;border:0;background:none;padding:0}
#pr121av #plotStatus26{margin:0;padding:10px;border:1px solid #f3d39d;background:#fff8ec;border-radius:8px;font-size:12.5px;color:#17324d}
.acts121{display:flex;gap:6px;flex-wrap:wrap}.acts121 button{margin:0!important}
#pr121st{grid-column:1/4;display:flex;align-items:center;gap:18px;padding:0 12px;background:#e3ecf5;border-top:1px solid #c3d6ea;font-size:12px;color:#5b7189;white-space:nowrap;overflow:hidden}#pr121st b{color:#17324d}#pr121st .msg121{margin-left:auto;color:#17324d;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1;text-align:right}
#pr121vazio{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none}#pr121vazio[hidden]{display:none}.vz121{pointer-events:auto;max-width:560px;background:#fff;border-radius:12px;padding:22px 24px;box-shadow:0 12px 34px #0005;text-align:center;color:#17324d}.vz121>svg{width:40px;height:40px;fill:none;stroke:#2a7fd4;stroke-width:1.6}.vz121.av>svg{stroke:#e8930c}.vz121 h3{margin:8px 0 6px;font-size:17px}.vz121 p{font-size:12.5px;color:#5b7189;max-height:120px;overflow:auto;text-align:left}.vz121>div{display:flex;gap:8px;justify-content:center;margin-top:12px}.vz121 button{display:flex!important;align-items:center;gap:6px;margin:0!important;padding:8px 14px!important;height:auto!important;border-radius:8px!important;background:#fff!important;color:#17324d!important;border:1px solid #b9c6d3!important;box-shadow:none!important;font:600 13px "Segoe UI",Arial,sans-serif!important}.vz121 button.p{background:#1d8a4c!important;color:#fff!important;border-color:#17703d!important}.vz121 button svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8}
@media print{#pr121vazio,#pr121rib,#pr121th,#pr121pn,#pr121st,#pr121zoom,#pr121flut,.selo121{display:none!important}}`;
  document.head.append(css);
  setTimeout(depois, 1000);
})();
