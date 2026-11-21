// V147 — MEMORIAL DESCRITIVO E LISTA DE MATERIAIS
// Documento único, no padrão de empresa/prefeitura, montado a partir do que está lançado no projeto:
//  • identificação da obra, normas, sistema construtivo, pavimentos (fbk/fgk/fpk), lajes, vigas e reforços, varandas,
//    aberturas na laje, esquadrias das paredes;
//  • lista de materiais consolidada: blocos por tipo, aço por bitola (paredes, vergas, cintas, lajes, vigas, reforços),
//    telas, concreto (lajes e vigas), graute, argamassa, e os insumos (cimento, cal, areia, brita) pelos consumos de referência;
//  • seções que o programa não conhece (fundação, cobertura, instalações, acabamentos…) com texto-base editável — o texto
//    fica guardado no projeto e também como modelo para a próxima obra.
// Saídas: visualizar e imprimir / salvar em PDF, Word (.doc) e Excel (.xlsx). Não altera nada no projeto nem nos cálculos.
(function () {
  'use strict';
  const N = v => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
  const L7 = () => window.loads77;
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fx = (v, d = 2) => N(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const fi = v => Math.round(N(v)).toLocaleString('pt-BR');
  const up = v => Math.ceil(N(v) - 1e-9);
  const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch {} return null; };
  const KG0 = { 4.2: 0.109, 5: 0.154, 6.3: 0.245, 8: 0.395, 10: 0.617, 12.5: 0.963, 16: 1.578, 20: 2.466, 25: 3.853 };
  const kgm = d => { try { const v = steelMassPerMetre(d); if (v > 0) return v; } catch {} return KG0[d] || Math.PI * (N(d) / 1000) ** 2 / 4 * 7850; };
  const bit = d => 'Ø' + fx(d, N(d) % 1 ? 1 : 0).replace(/,0$/, '');
  const hoje = () => new Date().toLocaleDateString('pt-BR');

  // ---------------------------------------------------------------- configuração (consumos de referência, perdas)
  const CFG0 = {
    fck: 25, cob: 2.5,
    tr: { tr8: 0.050, tr12: 0.065, tr16: 0.075, tr20: 0.090, alv: 0.050 },      // m³ de concreto por m² de laje treliçada / capa da alveolar
    conc: { cim: 350, areia: 0.72, brita: 0.82 },                                // por m³ de concreto (referência fck 25, brita 1)
    grau: { cim: 420, cal: 20, areia: 0.75, brita: 0.55 },                       // por m³ de graute fino (brita 0 / pedrisco)
    arg: { cim: 260, cal: 65, areia: 1.05 },                                     // por m³ de argamassa mista 1:0,5:4,5
    perda: { conc: 5, grau: 10, arg: 15, tela: 10 },
    saco: 50
  };
  const SECOES0 = [
    ['prelim', 'Serviços preliminares', 'Limpeza do terreno, locação da obra por gabarito de madeira com marcação dos eixos das paredes, instalação do canteiro (depósito, sanitário e ligações provisórias de água e energia) e placa de obra conforme exigências do CREA e da Prefeitura.'],
    ['fund', 'Fundações', 'Fundação conforme projeto específico de fundações, compatível com as cargas das paredes indicadas no mapa de cargas deste projeto. Respaldo da fundação nivelado na cota de início da alvenaria (primeira fiada).'],
    ['impermeab', 'Impermeabilização', 'Impermeabilização do respaldo da fundação/baldrame com argamassa polimérica ou emulsão asfáltica em duas demãos cruzadas, subindo 15 cm nas faces das paredes. Áreas molhadas impermeabilizadas conforme especificação do fabricante.'],
    ['cobertura', 'Cobertura', 'Estrutura de cobertura e telhamento conforme projeto de arquitetura, apoiados sobre a laje/respaldo das paredes. Calhas, rufos e contrarrufos em chapa galvanizada onde indicado.'],
    ['esquadrias', 'Esquadrias', 'Portas e janelas conforme quadro de esquadrias da arquitetura, assentadas nos vãos deixados na alvenaria (dimensões indicadas neste memorial). Vergas e contravergas conforme detalhamento das elevações.'],
    ['revest', 'Revestimentos', 'Paredes internas: chapisco, emboço/reboco e acabamento conforme arquitetura. Paredes externas: chapisco, reboco com argamassa adequada a áreas externas. Áreas molhadas: revestimento cerâmico até a altura indicada. Não é permitido rasgar a alvenaria estrutural para embutir tubulações horizontais.'],
    ['pisos', 'Pisos', 'Contrapiso regularizado e revestimento de piso conforme arquitetura, com rodapés e soleiras nos vãos de portas.'],
    ['pintura', 'Pintura', 'Selador e duas demãos de tinta acrílica nas paredes; esmalte nas esquadrias metálicas e madeiras, conforme arquitetura.'],
    ['eletrica', 'Instalações elétricas', 'Conforme projeto elétrico e NBR 5410. Eletrodutos verticais passando pelos furos dos blocos (sem rasgos horizontais), caixas posicionadas na modulação dos blocos.'],
    ['hidro', 'Instalações hidrossanitárias', 'Conforme projetos hidrossanitários e NBR 5626 / NBR 8160. Prumadas em shafts ou nos furos de blocos não grauteados; não é permitido embutir tubulação horizontal na alvenaria estrutural.'],
    ['loucas', 'Louças, metais e acessórios', 'Conforme especificação da arquitetura.'],
    ['final', 'Serviços finais e limpeza', 'Remoção de entulho, limpeza geral da obra e verificação das instalações antes da entrega.']
  ];
  const memo = () => { const s = L7()?.S?.(); if (!s) return null; s.memo147 ??= {}; return s.memo147; };
  const tpl = () => { try { return JSON.parse(LS('memo147tpl') || '{}'); } catch { return {}; } };
  function dados() {
    const m = memo() || {}, t = tpl(), d = m.dados || {};
    const ps = (() => { try { return plotSettings26(); } catch { return {}; } })();
    return {
      obra: d.obra ?? ($('project')?.value || ''), cliente: d.cliente ?? '', endereco: d.endereco ?? '', municipio: d.municipio ?? '',
      finalidade: d.finalidade ?? 'Residencial', area: d.area ?? '', rt: d.rt ?? (ps.engineer || t.rt || ''), crea: d.crea ?? (ps.crea || t.crea || ''),
      art: d.art ?? '', empresa: d.empresa ?? (t.empresa || ''), data: d.data ?? hoje(), rev: d.rev ?? (ps.revision || '00')
    };
  }
  const cfg = () => { const m = memo() || {}, t = tpl(), c = JSON.parse(JSON.stringify(CFG0)); const mix = (a, b) => { for (const k in b || {}) { if (b[k] && typeof b[k] === 'object' && typeof a[k] === 'object') mix(a[k], b[k]); else if (b[k] !== '' && b[k] != null) a[k] = b[k]; } }; mix(c, t.cfg); mix(c, m.cfg); return c; };
  const secoes = () => { const m = memo() || {}, t = tpl(); return SECOES0.map(([id, nome, txt]) => { const p = m.sec?.[id] ?? t.sec?.[id] ?? {}; return { id, nome, on: p.on !== false, txt: p.txt ?? txt }; }); };
  const perdas = () => { let l = { blocks: 5, steel: 10 }; try { Object.assign(l, JSON.parse(LS('loss73') || '{}')); } catch {} return l; };

  // ---------------------------------------------------------------- coleta dos dados do projeto
  const scalePg = pg => N(state.pageScales23?.[pg]) || N(state.walls.find(w => N(w.page || 1) === N(pg))?.planScale) || (typeof pxCm === 'number' && pxCm > 0 ? pxCm : 1);
  const areaPoly = P => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p.x * q.y - q.x * p.y; } return Math.abs(a) / 2; };
  const repOfPage = pg => N((state.levels53 || []).find(l => String(l.page) === String(pg))?.rep) || 1;
  function descBloco(c) {
    const b = state.blocks.find(b => b.code === c) || state.blocks.find(b => String(c).startsWith(b.code + '_'));
    if (!b) return /_C/.test(c) ? 'Bloco cortado' : 'Peça ' + c;
    const d = [b.length, b.height, b.width].filter(v => v !== '' && Number.isFinite(Number(v))).map(v => fx(v, Number(v) % 1 ? 1 : 0)).join(' × ');
    return (b.type || 'Bloco') + (b.name ? ' · ' + b.name : '') + (d ? ' (' + d + ' cm)' : '') + (/_C/.test(c) ? ' — cortado' : '');
  }
  async function coletar() {
    const L = window.level68, cur = L?.current?.() || 'all';
    if (cur !== 'all') await L.switchTo('all', true);
    const out = { niveis: [], avisos: [], semModulacao: 0 };
    try {
      if (!Array.isArray(state.results)) throw Error('Gere a modulação antes de emitir o memorial (Gerar modulação ou Gerar todos os níveis).');
      out.semModulacao = state.walls.filter((w, i) => !state.results[i]?.rows?.length).length;
      const gs = window.levelGroups54?.() || [];
      if (!gs.length) throw Error('Ainda não há paredes moduladas para o memorial.');
      for (const g of gs) {
        let blocks = {}, rows = [], vol = null;
        window.withLevel54(g, () => { blocks = blockTotals26(); rows = steelSchedule(); try { vol = materialVolumes34(); } catch {} });
        const ws = [...g.walls].map(i => state.walls[i]).filter(Boolean);
        let rep = 1; for (const w of ws) rep = Math.max(rep, repOfPage(w.page || 1));
        let ext = 0, areaAlv = 0; const esq = new Map();
        for (const w of ws) {
          const Lw = N(w.length), H = N(w.height); ext += Lw; let ab = 0;
          for (const o of w.openings || []) {
            const wd = N(o.width), ht = N(o.height); ab += wd * ht;
            const tipo = /porta/i.test(o.type || '') ? 'Porta' : /janela/i.test(o.type || '') ? 'Janela' : (o.type || 'Abertura');
            const k = tipo + '|' + wd + '|' + ht + '|' + N(o.bottom); const e = esq.get(k) || { tipo, w: wd, h: ht, pe: N(o.bottom), n: 0, tags: new Set() };
            e.n++; if (o.tag58) e.tags.add(o.tag58); esq.set(k, e);
          }
          areaAlv += Math.max(0, Lw * H - ab);
        }
        out.niveis.push({ g, nome: g.label || ('Nível ' + fx(g.value)), cota: N(g.value), rep, blocks, rows, vol, paredes: ws.length, ext: ext / 100, areaAlv: areaAlv / 1e4, alt: ws.length ? Math.max(...ws.map(w => N(w.height))) : 0, esq: [...esq.values()] });
        if (vol?.missing?.length) out.avisos.push((g.label || 'Nível') + ': volume de graute/argamassa parcial (' + vol.missing.length + ' ponto(s) a conferir).');
      }
    } finally { if (cur !== 'all') await L.switchTo(cur, true); }
    // resistências por pavimento
    try { const D = window.res96?.compute?.(); out.res = D; for (const n of out.niveis) { const l = D?.levels?.find(x => Math.abs(N(x.v) - n.cota) < .006) || (D?.levels?.length === 1 ? D.levels[0] : null); if (l) { n.fbk = l.fbk; n.fgk = l.fgk; n.fpk = l.fpk; n.pd = l.step; } } } catch (e) { console.error('V147 res', e); }
    // lajes
    out.lajes = []; out.balancos = []; out.furos = []; out.vigas = []; out.lajeAco = new Map(); out.telas = new Map(); out.avisosLaje = [];
    try {
      const R = L7().compute({}), LV = R.LV || [], TY = { mac: 'Maciça', tr8: 'Treliçada TR8', tr12: 'Treliçada TR12', tr16: 'Treliçada TR16', tr20: 'Treliçada TR20', alv: 'Alveolar protendida', sem: 'Sem laje' };
      for (const sl of R.slabs || []) {
        const c = sl.ctx, times = N(sl.times) || 1, porTipo = new Map();
        for (let i = 0; i < c.n; i++) { if (!c.inside[i]) continue; const k = c.comp[i], p = k >= 0 ? (c.props[k] || c.def) : c.def; const t = p.type || 'tr8', h = N(p.h) || (t === 'mac' ? 10 : 12); const key = t + '|' + h; porTipo.set(key, (porTipo.get(key) || 0) + c.s0 * c.s0 / 1e4); }
        for (const [k, a] of porTipo) { const [t, h] = k.split('|'); if (t === 'sem') continue; out.lajes.push({ nome: sl.name, tipo: t, nomeTipo: TY[t] || t, h: N(h), area: a, vezes: times, kind: sl.kind }); }
        // aço das lajes: negativos e positivos informados (V106)
        try {
          const Lk = { key: LV[sl.lvl]?.key, tgt: sl.kind === 'cob' ? 'cob' : sl.kind === 'tipo' ? 'tipo' : 'piso', rj: N(sl.own) || 0, name: sl.name };
          const its = window.arm106?.items?.(Lk, c, 1e9, 1e9) || [];
          for (const it of its) {
            const box = document.createElement('div'); box.innerHTML = it.html || '';
            for (const h3 of box.querySelectorAll('h3')) {
              const tb = h3.nextElementSibling; if (!tb || tb.tagName !== 'TABLE') continue;
              if (/Resumo por bitola/.test(h3.textContent)) for (const tr of tb.querySelectorAll('tbody tr')) { const td = [...tr.children].map(x => x.textContent.trim()); const d = N(String(td[0]).replace('Ø', '').replace(',', '.')); const m = N(String(td[1]).replace(/\./g, '').replace(',', '.')); if (d > 0 && m > 0) out.lajeAco.set(d, (out.lajeAco.get(d) || 0) + m * times); }
              if (/telas soldadas/i.test(h3.textContent)) for (const tr of tb.querySelectorAll('tbody tr')) { const td = [...tr.children].map(x => x.textContent.trim()); const a = N(String(td[3]).replace(/\./g, '').replace(',', '.')); if (a > 0) { const e = out.telas.get(td[0]) || { malha: td[1], area: 0 }; e.area += a * times; out.telas.set(td[0], e); } }
            }
          }
        } catch (e) { console.error('V147 aço laje', e); }
      }
      // lajes maciças calculadas pelo programa (V82), quando não há armadura informada
      try { const A = window.slab82?.designAll?.(); for (const d of A?.list || []) for (const [dd, m] of d.byD || []) out.lajeAco.set(dd, (out.lajeAco.get(dd) || 0) + N(m)); } catch (e) { console.error('V147 V82', e); }
      // vigas, reforços e aberturas na laje
      for (const grp of window.el97?.slabGroups?.() || []) {
        for (const it of grp.its) {
          if (it.kind === 'hole') { const P = it.pts || [], sc = scalePg(it.page || 1); out.furos.push({ laje: grp.name, nome: it.name || 'A', uso: it.use || 'Abertura', area: P.length > 2 ? areaPoly(P) / (sc * sc) / 1e4 : 0 }); continue; }
          if (it.kind !== 'beam') continue;
          const B = window.el97.bars(it), v = it.viga || {}, ref = it.sub === 'ref';
          out.vigas.push({ laje: grp.name, nome: it.name || (ref ? 'R' : 'V'), ref, b: N(v.b), h: N(v.h), L: N(B.L) / 100, rows: B.rows, kg: N(B.kg), conc: ref ? 0 : N(v.b) * N(v.h) * N(B.L) / 1e6, obs: it.var130 || '' });
        }
      }
      // balanços (varandas / beirais)
      for (const it of L7().S().items || []) if (it.kind === 'edge') { const P = it.pts || [], sc = scalePg(it.page || 1); out.balancos.push({ nome: it.name || 'Balanço', area: P.length > 2 ? areaPoly(P) / (sc * sc) / 1e4 : 0, nivel: (() => { try { return L7().slabName(L7().itemKey(it)); } catch { return ''; } })() }); }
      if (R.warn?.length) out.avisosLaje.push(...R.warn);
    } catch (e) { console.error('V147 lajes', e); out.avisos.push('Não foi possível ler as lajes: ' + (e.message || e)); }
    return out;
  }

  // ---------------------------------------------------------------- consolidação da lista de materiais
  function consolidar(D, C) {
    const P = perdas(), pb = P.blocks / 100, pa = P.steel / 100;
    const blocos = new Map();
    for (const n of D.niveis) for (const [c, q] of Object.entries(n.blocks || {})) { const e = blocos.get(c) || { c, desc: descBloco(c), q: 0, por: {} }; e.q += N(q) * n.rep; e.por[n.nome] = (e.por[n.nome] || 0) + N(q) * n.rep; blocos.set(c, e); }
    const aco = new Map(), add = (orig, d, m) => { if (!(m > 0)) return; d = N(d); const e = aco.get(d) || { d, m: 0, orig: {} }; e.m += m; e.orig[orig] = (e.orig[orig] || 0) + m; aco.set(d, e); };
    for (const n of D.niveis) for (const r of n.rows || []) add('Paredes (vertical, cintas, vergas)', r.diameter, N(r.total) * n.rep);
    for (const v of D.vigas) for (const r of v.rows || []) add(v.ref ? 'Reforços de laje' : 'Vigas', r.d, N(r.tot));
    for (const [d, m] of D.lajeAco) add('Lajes (negativos/positivos)', d, m);
    const tipos = new Map(); let concLaje = 0;
    for (const l of D.lajes) { const a = l.area * l.vezes, k = l.tipo === 'mac' ? 'Laje maciça h = ' + fx(l.h, 0) + ' cm' : l.nomeTipo + ' (h = ' + fx(l.h, 0) + ' cm)'; const cons = l.tipo === 'mac' ? l.h / 100 : N(C.tr[l.tipo] ?? C.tr.tr12); const e = tipos.get(k) || { k, tipo: l.tipo, h: l.h, area: 0, conc: 0, cons }; e.area += a; e.conc += a * cons; tipos.set(k, e); concLaje += a * cons; }
    const concViga = D.vigas.reduce((s, v) => s + v.conc, 0);
    const grau = D.niveis.reduce((s, n) => s + N(n.vol?.grout) * n.rep, 0), arg = D.niveis.reduce((s, n) => s + N(n.vol?.argamassa) * n.rep, 0);
    const pc = C.perda.conc / 100, pg = C.perda.grau / 100, pr = C.perda.arg / 100;
    const conc = concLaje + concViga, concT = conc * (1 + pc), grauT = grau * (1 + pg), argT = arg * (1 + pr);
    const ins = {
      cim: (concT * C.conc.cim + grauT * C.grau.cim + argT * C.arg.cim),
      cal: (grauT * C.grau.cal + argT * C.arg.cal),
      areia: concT * C.conc.areia + grauT * C.grau.areia + argT * C.arg.areia,
      brita1: concT * C.conc.brita, brita0: grauT * C.grau.brita
    };
    const fgk = Math.max(0, ...D.niveis.map(n => N(n.fgk))), fbkMax = Math.max(0, ...D.niveis.map(n => N(n.fbk)));
    return { P, pb, pa, blocos: [...blocos.values()].sort((a, b) => b.q - a.q), aco: [...aco.values()].sort((a, b) => a.d - b.d), tipos: [...tipos.values()], concLaje, concViga, conc, concT, grau, grauT, arg, argT, ins, fgk, fbkMax };
  }

  // ---------------------------------------------------------------- documento
  function html(D, M, C, dd, secs, logo) {
    const fam = state.family34 || '', bl = state.blocks.filter(b => b.active !== false);
    const blP = bl.find(b => b.role === 'Principal') || bl[0];
    const totAlv = D.niveis.reduce((s, n) => s + n.areaAlv * n.rep, 0), totExt = D.niveis.reduce((s, n) => s + n.ext * n.rep, 0);
    const kgTot = M.aco.reduce((s, a) => s + a.m * kgm(a.d), 0);
    let sec = 0, sub = 0; const toc = [];
    const H2 = t => { sec++; sub = 0; toc.push([sec + '.', t]); return `<h2 id="s${sec}"><span>${sec}.</span> ${esc(t)}</h2>`; };
    const H3 = t => { sub++; return `<h3>${sec}.${sub} ${esc(t)}</h3>`; };
    const T = (head, rows, cls = '') => `<table class="${cls}"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr${r.cls ? ` class="${r.cls}"` : ''}>${(r.c || r).map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    let b = '';
    // 1 identificação
    b += H2('Identificação da obra');
    b += T(['Item', 'Descrição'], [['Obra / projeto', esc(dd.obra)], ['Proprietário / cliente', esc(dd.cliente)], ['Endereço', esc(dd.endereco)], ['Município / UF', esc(dd.municipio)], ['Finalidade', esc(dd.finalidade)],
      ['Área construída', dd.area ? esc(dd.area) + ' m²' : '—'], ['Pavimentos', D.niveis.map(n => esc(n.nome) + (n.rep > 1 ? ' (× ' + n.rep + ')' : '')).join(' · ')], ['Sistema estrutural', 'Alvenaria estrutural de blocos de concreto' + (fam ? ' — família ' + esc(fam) : '')],
      ['Responsável técnico', esc(dd.rt) + (dd.crea ? ' · CREA ' + esc(dd.crea) : '')], ['ART / RRT', esc(dd.art) || '—'], ['Data / revisão', esc(dd.data) + ' · rev. ' + esc(dd.rev)]], 'kv');
    // 2 objetivo
    b += H2('Objetivo');
    b += `<p>Este memorial descreve os materiais, as especificações e os procedimentos de execução da estrutura em alvenaria estrutural da obra acima identificada, e apresenta a lista de materiais da estrutura levantada a partir do projeto de modulação (plantas de 1ª e 2ª fiadas, elevações das paredes, lajes, vigas e reforços). Os serviços não estruturais estão descritos de forma resumida e devem seguir os respectivos projetos complementares.</p>`;
    // 3 normas
    b += H2('Normas técnicas de referência');
    b += '<ul class="cols">' + ['ABNT NBR 16868-1, -2 e -3 — Alvenaria estrutural: projeto, execução e controle de obras, métodos de ensaio', 'ABNT NBR 6136 — Blocos vazados de concreto simples para alvenaria', 'ABNT NBR 6118 — Projeto de estruturas de concreto', 'ABNT NBR 6120 — Ações para o cálculo de estruturas de edificações', 'ABNT NBR 6123 — Forças devidas ao vento em edificações', 'ABNT NBR 8681 — Ações e segurança nas estruturas', 'ABNT NBR 7480 — Aço destinado a armaduras para estruturas de concreto armado', 'ABNT NBR 14859-1 e -2 — Lajes pré-fabricadas (vigotas treliçadas)', 'ABNT NBR 13281 — Argamassa para assentamento e revestimento de paredes e tetos', 'ABNT NBR 12655 — Concreto de cimento Portland: preparo, controle, recebimento e aceitação', 'ABNT NBR 7212 — Concreto dosado em central', 'ABNT NBR 15575 — Edificações habitacionais: desempenho'].map(x => `<li>${x}</li>`).join('') + '</ul>';
    // 4 sistema construtivo
    b += H2('Sistema construtivo — alvenaria estrutural');
    b += H3('Blocos');
    b += `<p>Paredes em blocos vazados de concreto${fam ? ' da família ' + esc(fam) : ''}${blP ? ' (bloco principal ' + esc(blP.code) + ': ' + fx(blP.length, 0) + ' × ' + fx(blP.height, 0) + ' × ' + fx(blP.width, 0) + ' cm)' : ''}, classe estrutural conforme NBR 6136, com resistência característica à compressão (f<sub>bk</sub>) indicada por pavimento no item 5. Os blocos devem ser recebidos com laudo do fabricante, armazenados sobre estrado, protegidos da chuva e utilizados com a idade mínima recomendada pelo fabricante. Peças especiais utilizadas no projeto:</p>`;
    b += T(['Código', 'Peça', 'Função'], bl.map(x => [esc(x.code), esc((x.type || 'Bloco') + ' ' + [x.length, x.height, x.width].filter(v => v !== '' && v != null).map(v => fx(v, Number(v) % 1 ? 1 : 0)).join(' × ') + ' cm'), esc(x.role || x.name || '')]));
    b += H3('Assentamento e juntas');
    b += `<p>Assentamento com argamassa de cimento, cal e areia (traço de referência 1 : 0,5 : 4,5 em volume, ou argamassa industrializada para alvenaria estrutural conforme NBR 13281), com juntas horizontais e verticais de ${fx(N($('jh')?.value) || 1, 1)} cm, preenchidas. A primeira fiada é assentada sobre o respaldo nivelado da fundação, conferindo-se prumo, nível e alinhamento a cada fiada. A amarração entre paredes é feita pela modulação dos blocos (juntas a prumo apenas onde indicado nas elevações). É proibido o corte de blocos não previsto no projeto e o rasgo horizontal das paredes.</p>`;
    b += H3('Graute e armaduras');
    b += `<p>Graute com resistência característica f<sub>gk</sub> indicada por pavimento (item 5), lançado nos furos indicados nas elevações (armaduras verticais) e nas canaletas (cintas de respaldo, vergas e contravergas), em camadas, com adensamento manual. Os furos a grautear devem ter a base limpa (janela de inspeção na primeira fiada). Aço CA-50 (barras) e CA-60 (fios), conforme NBR 7480, nas posições, bitolas e comprimentos das elevações; o cobrimento e as emendas seguem o detalhamento.</p>`;
    // 5 pavimentos
    b += H2('Pavimentos e resistências');
    b += T(['Pavimento', 'Cota (m)', 'Repet.', 'Paredes', 'Extensão (m)', 'Área de alvenaria (m²)', 'Pé-direito (cm)', 'f<sub>bk</sub> (MPa)', 'f<sub>gk</sub> (MPa)', 'f<sub>pk</sub> (MPa)'],
      D.niveis.map(n => [esc(n.nome), fx(n.cota), n.rep, n.paredes, fx(n.ext * n.rep, 1), fx(n.areaAlv * n.rep, 1), fx(n.alt, 0), n.fbk ? fx(n.fbk, 0) : '—', n.fgk ? fx(n.fgk, 0) : '—', n.fpk ? fx(n.fpk, 0) : '—']).concat([{ cls: 'tot', c: ['Total', '', '', D.niveis.reduce((s, n) => s + n.paredes * n.rep, 0), fx(totExt, 1), fx(totAlv, 1), '', '', '', ''] }]));
    b += `<p class="nota">f<sub>bk</sub>: resistência característica do bloco (área bruta); f<sub>gk</sub>: do graute; f<sub>pk</sub>: do prisma. Valores do dimensionamento à compressão do programa (memorial de cálculo). Área de alvenaria descontando os vãos de portas e janelas; extensão e área multiplicadas pelas repetições do pavimento tipo.</p>`;
    // 6 lajes
    b += H2('Lajes, vigas e reforços');
    if (M.tipos.length) {
      b += H3('Lajes');
      b += `<p>Lajes ${M.tipos.some(t => /^tr/.test(t.tipo)) ? 'pré-fabricadas treliçadas (vigotas treliçadas com elementos de enchimento e capa de concreto moldada no local, conforme NBR 14859), ' : ''}${M.tipos.some(t => t.tipo === 'mac') ? 'maciças de concreto armado moldadas no local, ' : ''}apoiadas sobre as paredes estruturais por meio das cintas de respaldo. Concreto f<sub>ck</sub> ≥ ${fx(C.fck, 0)} MPa, cobrimento de ${fx(C.cob, 1)} cm. Escoramento e retirada de escoras conforme fabricante e NBR 15696; cura úmida por no mínimo 7 dias.</p>`;
      b += T(['Laje', 'Tipo', 'h (cm)', 'Área (m²)', 'Vezes', 'Concreto (m³/m²)', 'Concreto (m³)'], D.lajes.map(l => { const cons = l.tipo === 'mac' ? l.h / 100 : N(C.tr[l.tipo] ?? C.tr.tr12); return [esc(l.nome), esc(l.nomeTipo), fx(l.h, 0), fx(l.area, 2), l.vezes, fx(cons, 3), fx(l.area * l.vezes * cons, 2)]; })
        .concat([{ cls: 'tot', c: ['Total', '', '', fx(M.tipos.reduce((s, t) => s + t.area, 0), 2), '', '', fx(M.concLaje, 2)] }]));
      if (M.tipos.some(t => /^tr|alv/.test(t.tipo))) b += `<p class="nota">Concreto das lajes treliçadas e da capa da alveolar pelo consumo por m² de referência (lajota cerâmica/EPS e capa de 4 a 5 cm) — confirmar com a tabela do fabricante das vigotas. Áreas medidas no contorno das lajes, descontadas as aberturas.</p>`;
    }
    if (D.balancos.length) { b += H3('Balanços (varandas e beirais)'); b += T(['Balanço', 'Laje', 'Área (m²)'], D.balancos.map(x => [esc(x.nome), esc(x.nivel), fx(x.area, 2)])); b += '<p>As vigas de borda e de ancoragem dos balanços estão relacionadas no quadro de vigas a seguir e detalhadas nas pranchas.</p>'; }
    if (D.vigas.length) {
      b += H3('Vigas e reforços de laje');
      const arm = r => r.n + ' ' + bit(r.d) + (r.pos === 'Estribo' ? ' c/' + fx(r.s, 0) : ' ' + r.pos.toLowerCase().slice(0, 3) + '.');
      const lajes = [...new Set(D.vigas.map(v => v.laje))], rows = [];
      for (const lj of lajes) {
        rows.push({ cls: 'grp', c: ['<b>' + esc(lj) + '</b>', '', '', '', '', ''] });
        for (const v of D.vigas.filter(v => v.laje === lj && !v.ref)) rows.push([esc(v.nome) + (v.obs ? ' <small>' + esc(v.obs) + '</small>' : ''), fx(v.b, 0) + ' × ' + fx(v.h, 0), fx(v.L, 2), v.rows.map(arm).join(' · '), fx(v.kg, 1), fx(v.conc, 3)]);
        const G = new Map(); for (const v of D.vigas.filter(v => v.laje === lj && v.ref)) { const k = v.rows.map(arm).join(' · '); const e = G.get(k) || { k, nomes: [], L: 0, kg: 0 }; e.nomes.push(v.nome); e.L += v.L; e.kg += v.kg; G.set(k, e); }
        for (const e of G.values()) { const ns = e.nomes.slice().sort((a, b) => String(a).localeCompare(String(b), 'pt', { numeric: true })); rows.push([esc(ns.length > 3 ? ns[0] + ' a ' + ns.at(-1) : ns.join(', ')) + ' <small>(' + ns.length + ' reforço' + (ns.length > 1 ? 's' : '') + ' na nervura)</small>', '—', fx(e.L, 2) + ' <small>total</small>', esc(e.k), fx(e.kg, 1), '—']); }
      }
      rows.push({ cls: 'tot', c: ['Total', '', fx(D.vigas.reduce((s, v) => s + v.L, 0), 2), D.vigas.filter(v => !v.ref).length + ' vigas · ' + D.vigas.filter(v => v.ref).length + ' reforços', fx(D.vigas.reduce((s, v) => s + v.kg, 0), 1), fx(M.concViga, 3)] });
      b += T(['Peça', 'Seção (cm)', 'Comp. (m)', 'Armadura', 'Aço (kg)', 'Concreto (m³)'], rows, 'small');
      b += '<p class="nota">Comprimentos com o apoio nas paredes; aço com ganchos e estribos, conforme o detalhamento das pranchas. Relação peça por peça na planilha Excel (aba Vigas e reforços).</p>';
    }
    if (D.furos.length) { b += H3('Aberturas nas lajes'); b += T(['Laje', 'Abertura', 'Uso', 'Área (m²)'], D.furos.map(x => [esc(x.laje), esc(x.nome), esc(x.uso), fx(x.area, 2)])); }
    if (D.telas.size) { b += H3('Telas soldadas'); b += T(['Tela', 'Malha', 'Área (m²)', 'Área + ' + fx(C.perda.tela, 0) + '% (m²)', 'Painéis 2,45 × 6,00 m'], [...D.telas].map(([k, t]) => [esc(k), esc(t.malha), fx(t.area, 2), fx(t.area * (1 + C.perda.tela / 100), 2), up(t.area * (1 + C.perda.tela / 100) / 14.7)])); }
    // 7 esquadrias
    const esqT = new Map(); for (const n of D.niveis) for (const e of n.esq) { const k = e.tipo + '|' + e.w + '|' + e.h + '|' + e.pe; const x = esqT.get(k) || { ...e, n: 0, por: [] , tags: new Set() }; x.n += e.n * n.rep; x.por.push(n.nome + ': ' + e.n * n.rep); e.tags.forEach(t => x.tags.add(t)); esqT.set(k, x); }
    if (esqT.size) {
      b += H2('Vãos de esquadrias nas paredes');
      b += T(['Tipo', 'Largura (cm)', 'Altura (cm)', 'Peitoril (cm)', 'Quantidade', 'Por pavimento', 'Identificação'], [...esqT.values()].sort((a, b) => a.tipo.localeCompare(b.tipo) || b.w - a.w).map(e => [esc(e.tipo), fx(e.w, 0), fx(e.h, 0), fx(e.pe, 0), e.n, esc(e.por.join(' · ')), esc([...e.tags].slice(0, 12).join(', ') + (e.tags.size > 12 ? '…' : ''))]), 'small');
      b += '<p class="nota">Dimensões dos vãos na alvenaria (modulados). As dimensões das esquadrias devem descontar as folgas de instalação indicadas pelo fornecedor.</p>';
    }
    // 8 seções complementares
    const on = secs.filter(s => s.on && String(s.txt).trim());
    if (on.length) { b += H2('Serviços complementares'); for (const s of on) b += H3(s.nome) + '<p>' + esc(s.txt).replace(/\n/g, '<br>') + '</p>'; }
    // 9 lista de materiais
    b += H2('Lista de materiais — estrutura');
    const linhas = [];
    const L = (grupo, item, esp, un, q, perda, tot) => linhas.push({ grupo, item, esp, un, q, perda, tot });
    for (const x of M.blocos) L('Alvenaria', esc(x.c), esc(x.desc) + (M.fbkMax ? ' · f<sub>bk</sub> conforme pavimento' : ''), 'un', fi(x.q), fx(M.P.blocks, 1) + '%', fi(up(x.q * (1 + M.pb))));
    if (M.arg > 0) L('Alvenaria', 'Argamassa', 'Assentamento · traço 1 : 0,5 : 4,5 ou industrializada', 'm³', fx(M.arg, 2), fx(C.perda.arg, 0) + '%', fx(M.argT, 2));
    if (M.grau > 0) L('Alvenaria', 'Graute', 'f<sub>gk</sub> ≥ ' + fx(M.fgk || 15, 0) + ' MPa · furos e canaletas', 'm³', fx(M.grau, 2), fx(C.perda.grau, 0) + '%', fx(M.grauT, 2));
    for (const a of M.aco) { const kg = a.m * kgm(a.d), b12 = up(a.m / 12 * (1 + M.pa)); L('Aço', bit(a.d), (a.d <= 5 ? 'CA-60' : 'CA-50') + ' · ' + Object.entries(a.orig).map(([o, m]) => esc(o) + ' ' + fx(m, 0) + ' m').join('; '), 'kg', fx(kg, 1), fx(M.P.steel, 1) + '%', fx(b12 * 12 * kgm(a.d), 1) + ' <small>(' + b12 + ' barras 12 m)</small>'); }
    for (const [k, t] of D.telas) L('Aço', 'Tela ' + esc(k), esc(t.malha), 'm²', fx(t.area, 2), fx(C.perda.tela, 0) + '%', fx(t.area * (1 + C.perda.tela / 100), 2));
    for (const t of M.tipos) if (/^tr|alv/.test(t.tipo)) L('Lajes', esc(t.k), 'Vigotas, enchimento e treliças conforme fabricante', 'm²', fx(t.area, 2), '—', fx(t.area, 2));
    if (M.conc > 0) L('Concreto', 'Concreto f<sub>ck</sub> ' + fx(C.fck, 0) + ' MPa', 'Lajes ' + fx(M.concLaje, 2) + ' m³ · vigas ' + fx(M.concViga, 2) + ' m³', 'm³', fx(M.conc, 2), fx(C.perda.conc, 0) + '%', fx(M.concT, 2));
    b += T(['Grupo', 'Item', 'Especificação', 'Un.', 'Quantidade', 'Perda', 'Total a comprar'], linhas.map(l => [l.grupo, '<b>' + l.item + '</b>', l.esp, l.un, l.q, l.perda, '<b>' + l.tot + '</b>']), 'lista');
    b += `<p class="nota">Aço total da estrutura: <b>${fx(kgTot, 1)} kg</b> sem perdas (${fx(kgTot * (1 + M.pa), 1)} kg com ${fx(M.P.steel, 1)}% de perda). Quantidades geométricas extraídas do projeto (peças desenhadas nas elevações e plantas), com repetições dos pavimentos tipo.</p>`;
    b += H3('Insumos para preparo em obra (referência)');
    b += `<p>Se o concreto, o graute e a argamassa forem preparados na obra (em vez de usinados/industrializados), os insumos estimados, já com as perdas, são:</p>`;
    const sacos = M.ins.cim / C.saco;
    b += T(['Insumo', 'Quantidade', 'Base de cálculo'], [
      ['Cimento Portland', fx(M.ins.cim / 1000, 2) + ' t · <b>' + fi(up(sacos)) + ' sacos de ' + C.saco + ' kg</b>', 'concreto ' + C.conc.cim + ' kg/m³ · graute ' + C.grau.cim + ' kg/m³ · argamassa ' + C.arg.cim + ' kg/m³'],
      ['Cal hidratada', fx(M.ins.cal, 0) + ' kg · ' + fi(up(M.ins.cal / 20)) + ' sacos de 20 kg', 'graute ' + C.grau.cal + ' kg/m³ · argamassa ' + C.arg.cal + ' kg/m³'],
      ['Areia média', fx(M.ins.areia, 2) + ' m³', 'concreto ' + fx(C.conc.areia, 2) + ' · graute ' + fx(C.grau.areia, 2) + ' · argamassa ' + fx(C.arg.areia, 2) + ' m³/m³'],
      ['Brita 1', fx(M.ins.brita1, 2) + ' m³', 'concreto ' + fx(C.conc.brita, 2) + ' m³/m³'],
      ['Brita 0 / pedrisco', fx(M.ins.brita0, 2) + ' m³', 'graute ' + fx(C.grau.brita, 2) + ' m³/m³']]);
    b += '<p class="nota">Consumos de referência para traços usuais; a dosagem definitiva deve ser feita por laboratório (NBR 12655) para atingir f<sub>ck</sub>, f<sub>gk</sub> e a resistência da argamassa especificados.</p>';
    // 10 por pavimento
    b += H2('Quantitativos por pavimento');
    for (const n of D.niveis) {
      b += H3(n.nome + (n.rep > 1 ? ' — ' + n.rep + ' pavimentos iguais (quantidades já multiplicadas)' : ''));
      const bk = Object.entries(n.blocks || {}).sort((a, b) => b[1] - a[1]);
      const ac = new Map(); for (const r of n.rows || []) ac.set(N(r.diameter), (ac.get(N(r.diameter)) || 0) + N(r.total) * n.rep);
      b += '<div class="duas">' + T(['Peça', 'Quantidade'], bk.map(([c, q]) => [esc(c) + ' <small>' + esc(descBloco(c)) + '</small>', fi(q * n.rep)]), 'small') +
        T(['Aço das paredes', 'm', 'kg'], [...ac].sort((a, b) => a[0] - b[0]).map(([d, m]) => [bit(d), fx(m, 1), fx(m * kgm(d), 1)]).concat([['Graute (m³)', '', fx(N(n.vol?.grout) * n.rep, 2)], ['Argamassa (m³)', '', fx(N(n.vol?.argamassa) * n.rep, 2)]]), 'small') + '</div>';
    }
    // 11 observações
    b += H2('Observações gerais');
    const obs = ['Este memorial complementa o projeto de modulação e o memorial de cálculo; em caso de divergência, prevalecem as pranchas de detalhamento.', 'Quantidades sem perdas são geométricas; as perdas indicadas são de referência e podem ser ajustadas conforme a obra.', 'Qualquer alteração de vãos, paredes ou cargas deve ser comunicada ao responsável técnico antes da execução.', 'Controle tecnológico dos blocos, graute, argamassa e prismas conforme NBR 16868-2.'];
    if (D.semModulacao) obs.unshift('ATENÇÃO: ' + D.semModulacao + ' parede(s) ainda sem modulação não entram nas quantidades. Gere a modulação de todos os níveis antes de emitir a versão final.');
    for (const a of [...D.avisos, ...D.avisosLaje]) obs.push(a);
    b += '<ul>' + obs.map(o => `<li>${esc(o)}</li>`).join('') + '</ul>';
    // assinaturas
    b += `<div class="ass"><div><i></i><b>${esc(dd.rt) || 'Responsável técnico'}</b><span>Responsável técnico${dd.crea ? ' · CREA ' + esc(dd.crea) : ''}${dd.art ? ' · ART ' + esc(dd.art) : ''}</span></div><div><i></i><b>${esc(dd.cliente) || 'Proprietário'}</b><span>Proprietário / contratante</span></div></div>`;
    const sum = '<section class="toc"><h2>Sumário</h2>' + toc.map(([n, t]) => `<div><a href="#s${n.replace('.', '')}">${n} ${esc(t)}</a></div>`).join('') + '</section>';
    const capa = `<section class="capa">${logo ? `<img class="logo" src="${esc(logo)}">` : ''}<div class="marca">${esc(dd.empresa || 'ENGENHAR')}</div><h1>Memorial descritivo<br><small>e lista de materiais da estrutura</small></h1><div class="sub">Alvenaria estrutural${fam ? ' · família ' + esc(fam) : ''}</div>
      <table class="capaT"><tr><th>Obra</th><td>${esc(dd.obra)}</td></tr><tr><th>Proprietário</th><td>${esc(dd.cliente)}</td></tr><tr><th>Local</th><td>${esc([dd.endereco, dd.municipio].filter(Boolean).join(' — '))}</td></tr><tr><th>Responsável técnico</th><td>${esc(dd.rt)}${dd.crea ? ' · CREA ' + esc(dd.crea) : ''}</td></tr><tr><th>ART</th><td>${esc(dd.art)}</td></tr><tr><th>Data</th><td>${esc(dd.data)} · revisão ${esc(dd.rev)}</td></tr></table></section>`;
    const css = `@page{size:A4;margin:18mm 15mm 16mm 15mm}*{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#1d2b38;font-size:10pt;line-height:1.45;margin:0;background:#fff}
main{max-width:190mm;margin:0 auto;padding:6mm 0}h2{font-size:13pt;color:#0f3354;border-bottom:2px solid #0f3354;padding-bottom:1.5mm;margin:8mm 0 3mm;break-after:avoid}h2 span{color:#d58e0b}h3{font-size:10.8pt;color:#174a78;margin:5mm 0 2mm;break-after:avoid}
p{margin:0 0 2.5mm;text-align:justify}ul{margin:0 0 3mm;padding-left:6mm}li{margin:0 0 1mm}ul.cols{columns:2;column-gap:8mm}table{border-collapse:collapse;width:100%;margin:1mm 0 4mm;font-size:8.8pt;break-inside:auto}tr{break-inside:avoid}
th{background:#0f3354;color:#fff;text-align:left;padding:1.4mm 2mm;font-weight:600}td{border-bottom:1px solid #dbe3ea;padding:1.2mm 2mm;vertical-align:top}tr:nth-child(even) td{background:#f5f8fb}tr.tot td{font-weight:700;background:#e8eef5;border-top:1.5px solid #0f3354}tr.grp td{background:#eaf1f8!important;color:#0f3354;border-top:1px solid #9fb6cc}
table.kv td:first-child{width:52mm;font-weight:600;color:#0f3354}table.small{font-size:8pt}table.lista td:nth-child(5),table.lista td:nth-child(7){text-align:right;white-space:nowrap}small{color:#5b7085}.nota{font-size:8.6pt;color:#4a5d70;background:#f3f6f9;border-left:3px solid #f2a516;padding:2mm 3mm}
.duas{display:grid;grid-template-columns:1.3fr 1fr;gap:4mm}.capa{height:255mm;display:flex;flex-direction:column;justify-content:center;break-after:page;border-left:9mm solid #f2a516;padding-left:14mm;position:relative}.capa .logo{position:absolute;top:8mm;right:0;max-height:24mm;max-width:60mm}
.capa .marca{letter-spacing:.3em;color:#5b7c9c;font-weight:700;font-size:10pt}.capa h1{font-size:30pt;color:#0f3354;margin:6mm 0 3mm;line-height:1.1}.capa h1 small{font-size:15pt;color:#36536f;font-weight:500}.capa .sub{color:#4a5d70;font-size:12pt;margin-bottom:12mm}
.capaT{width:auto;min-width:120mm;font-size:10.5pt}.capaT th{background:none;color:#5b7085;font-weight:600;padding:1.6mm 6mm 1.6mm 0;border:0}.capaT td{border:0;border-bottom:1px solid #dbe3ea;background:none!important;min-width:80mm}
.toc{break-after:page}.toc div{padding:1.4mm 0;border-bottom:1px dotted #b8c5d1;font-size:10.5pt}.toc a{color:#0f3354;text-decoration:none}.ass{display:flex;gap:16mm;margin-top:22mm;break-inside:avoid}.ass div{flex:1;text-align:center}.ass i{display:block;border-top:1px solid #1d2b38;margin-bottom:2mm}.ass b{display:block}.ass span{font-size:8.6pt;color:#5b7085}
footer{display:none}@media screen{body{background:#e9eef3}main{background:#fff;padding:14mm 16mm;margin:8mm auto;box-shadow:0 4px 20px rgba(0,0,0,.12)}}`;
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Memorial descritivo — ${esc(dd.obra)}</title><style>${css}</style></head><body><main>${capa}${sum}${b}<p class="nota" style="margin-top:10mm">Documento gerado pelo programa Modulação de Alvenaria · Engenhar em ${esc(hoje())}.</p></main></body></html>`;
  }

  // ---------------------------------------------------------------- Excel
  function xlsx(D, M, C, dd) {
    const K = window.xlsxKit73; if (!K) throw Error('Gerador de planilha indisponível.');
    const { zip, sheetXML, STYLES, STY } = K, h = t => ({ t, s: STY.head }), T = t => ({ t, s: STY.title }), n2 = v => ({ n: Math.round(N(v) * 100) / 100, s: STY.dec }), ni = v => ({ n: Math.round(N(v)), s: STY.int });
    const R = [[T('Lista de materiais da estrutura — ' + (dd.obra || ''))], [], ['Responsável técnico', dd.rt + (dd.crea ? ' · CREA ' + dd.crea : '')], ['Data', dd.data], [], [h('Grupo'), h('Item'), h('Especificação'), h('Un.'), h('Quantidade'), h('Perda (%)'), h('Total a comprar')]];
    const strip = s => String(s).replace(/<[^>]+>/g, '');
    for (const x of M.blocos) R.push(['Alvenaria', x.c, x.desc, 'un', ni(x.q), n2(M.P.blocks), ni(up(x.q * (1 + M.pb)))]);
    if (M.arg > 0) R.push(['Alvenaria', 'Argamassa de assentamento', 'Traço 1:0,5:4,5 ou industrializada', 'm³', n2(M.arg), n2(C.perda.arg), n2(M.argT)]);
    if (M.grau > 0) R.push(['Alvenaria', 'Graute', 'fgk ≥ ' + (M.fgk || 15) + ' MPa', 'm³', n2(M.grau), n2(C.perda.grau), n2(M.grauT)]);
    for (const a of M.aco) { const b12 = up(a.m / 12 * (1 + M.pa)); R.push(['Aço', strip(bit(a.d)) + (a.d <= 5 ? ' CA-60' : ' CA-50'), Object.entries(a.orig).map(([o, m]) => o + ' ' + fx(m, 0) + ' m').join('; '), 'kg', n2(a.m * kgm(a.d)), n2(M.P.steel), n2(b12 * 12 * kgm(a.d))]); R.push(['', '', 'Barras de 12 m', 'barra', n2(a.m / 12), n2(M.P.steel), ni(b12)]); }
    for (const [k, t] of D.telas) R.push(['Aço', 'Tela ' + k, t.malha, 'm²', n2(t.area), n2(C.perda.tela), n2(t.area * (1 + C.perda.tela / 100))]);
    for (const t of M.tipos) if (/^tr|alv/.test(t.tipo)) R.push(['Lajes', t.k, 'Vigotas, enchimento e treliças conforme fabricante', 'm²', n2(t.area), '', n2(t.area)]);
    if (M.conc > 0) R.push(['Concreto', 'Concreto fck ' + C.fck + ' MPa', 'Lajes ' + fx(M.concLaje, 2) + ' m³ · vigas ' + fx(M.concViga, 2) + ' m³', 'm³', n2(M.conc), n2(C.perda.conc), n2(M.concT)]);
    R.push([], [T('Insumos para preparo em obra (com perdas)')], [h('Insumo'), h('Un.'), h('Quantidade')], ['Cimento Portland (sacos de ' + C.saco + ' kg)', 'saco', ni(up(M.ins.cim / C.saco))], ['Cal hidratada (sacos de 20 kg)', 'saco', ni(up(M.ins.cal / 20))], ['Areia média', 'm³', n2(M.ins.areia)], ['Brita 1', 'm³', n2(M.ins.brita1)], ['Brita 0 / pedrisco', 'm³', n2(M.ins.brita0)]);
    const V = [[T('Vigas e reforços')], [], [h('Laje'), h('Peça'), h('b (cm)'), h('h (cm)'), h('Comp. (m)'), h('Posição'), h('Qtde.'), h('Bitola (mm)'), h('C unit. (cm)'), h('Aço (kg)'), h('Concreto (m³)')]];
    for (const v of D.vigas) v.rows.forEach((r, i) => V.push([i ? '' : v.laje, i ? '' : v.nome + (v.ref ? ' (reforço)' : ''), i || v.ref ? '' : ni(v.b), i || v.ref ? '' : ni(v.h), i ? '' : n2(v.L), r.pos, ni(r.n), n2(r.d), ni(r.C), n2(r.kg), i || v.ref ? '' : { n: Math.round(v.conc * 1000) / 1000, s: STY.dec }]));
    const P = [[T('Quantitativos por pavimento')], []];
    for (const n of D.niveis) { P.push([{ t: n.nome + (n.rep > 1 ? ' (× ' + n.rep + ')' : ''), s: STY.tot }], [h('Peça'), h('Descrição'), h('Quantidade')]); for (const [c, q] of Object.entries(n.blocks || {})) P.push([c, descBloco(c), ni(q * n.rep)]); P.push([h('Aço'), h(''), h('kg')]); const ac = new Map(); for (const r of n.rows || []) ac.set(N(r.diameter), (ac.get(N(r.diameter)) || 0) + N(r.total) * n.rep); for (const [d, m] of [...ac].sort((a, b) => a[0] - b[0])) P.push([strip(bit(d)), fx(m, 1) + ' m', n2(m * kgm(d))]); P.push(['Graute', 'm³', n2(N(n.vol?.grout) * n.rep)], ['Argamassa', 'm³', n2(N(n.vol?.argamassa) * n.rep)], []); }
    const LJ = [[T('Lajes')], [], [h('Laje'), h('Tipo'), h('h (cm)'), h('Área (m²)'), h('Vezes'), h('Concreto (m³)')]];
    for (const l of D.lajes) { const cons = l.tipo === 'mac' ? l.h / 100 : N(C.tr[l.tipo] ?? C.tr.tr12); LJ.push([l.nome, l.nomeTipo, ni(l.h), n2(l.area), ni(l.vezes), n2(l.area * l.vezes * cons)]); }
    const all = [{ name: 'Lista de materiais', xml: sheetXML(R, [14, 30, 60, 8, 14, 11, 16]) }, { name: 'Por pavimento', xml: sheetXML(P, [16, 50, 14]) }, { name: 'Vigas e reforços', xml: sheetXML(V, [40, 18, 8, 8, 10, 12, 8, 11, 12, 10, 13]) }, { name: 'Lajes', xml: sheetXML(LJ, [50, 24, 8, 12, 8, 14]) }];
    const xe = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const files = [['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + all.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') + '</Types>'],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + all.map((s, i) => `<sheet name="${xe(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + all.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') + `<Relationship Id="rId${all.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
      ['xl/styles.xml', STYLES], ...all.map((s, i) => ['xl/worksheets/sheet' + (i + 1) + '.xml', s.xml])];
    return zip(files);
  }

  // ---------------------------------------------------------------- janela
  const css = document.createElement('style'); css.id = 'memo147css';
  css.textContent = `#memo147{position:fixed;inset:0;z-index:10050;background:rgba(10,24,38,.55);display:none;align-items:stretch;justify-content:center}#memo147.on{display:flex}
#memo147 .w{background:#eef3f8;width:min(1280px,100%);display:flex;flex-direction:column;box-shadow:0 10px 40px rgba(0,0,0,.35)}#memo147 .bar{display:flex;gap:8px;align-items:center;padding:9px 14px;background:#102e4b;color:#fff;flex-wrap:wrap}
#memo147 .bar b{font-size:14px;margin-right:6px}#memo147 .bar button{background:#1f5a8f;color:#fff;border:1px solid #3d77ad;border-radius:6px;padding:6px 11px;cursor:pointer;font-size:12.5px}#memo147 .bar button.pri{background:#f2a516;border-color:#f2a516;color:#1d2b38;font-weight:700}#memo147 .bar .sp{flex:1}#memo147 .bar .st{color:#c9dcef;font-size:12px}
#memo147 .corpo{flex:1;display:grid;grid-template-columns:340px 1fr;min-height:0}#memo147 .lado{overflow:auto;padding:10px 12px;background:#fff;border-right:1px solid #cfdceb;font-size:12.5px}#memo147 .lado h4{margin:12px 0 5px;color:#0f3354;font-size:12.5px;border-bottom:1px solid #dbe3ea;padding-bottom:3px}
#memo147 .lado label{display:flex;flex-direction:column;gap:2px;margin:0 0 6px;font-weight:600;color:#36536f}#memo147 .lado input,#memo147 .lado textarea{font:inherit;font-weight:400;padding:4px 6px;border:1px solid #b9c6d3;border-radius:5px;width:100%}#memo147 .lado textarea{min-height:58px;resize:vertical}
#memo147 .lado .g2{display:grid;grid-template-columns:1fr 1fr;gap:6px}#memo147 .lado .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}#memo147 .lado .sec{border:1px solid #dbe3ea;border-radius:6px;padding:5px 7px;margin:0 0 6px}#memo147 .lado .sec>span{display:flex;gap:6px;align-items:center;font-weight:700;color:#0f3354}
#memo147 .lado .n{font-weight:400;color:#6a7c8e;font-size:11px}#memo147 iframe{width:100%;height:100%;border:0;background:#e9eef3}`;
  document.head.append(css);
  const box = document.createElement('div'); box.id = 'memo147'; box.className = 'noPrint';
  box.innerHTML = `<div class="w"><div class="bar"><b>📑 Memorial descritivo e lista de materiais</b><button class="pri" data-a="ger">↻ Atualizar documento</button><button data-a="pdf">🖨 Imprimir / salvar PDF</button><button data-a="doc">📝 Word (.doc)</button><button data-a="xls">📊 Excel</button><span class="st"></span><span class="sp"></span><button data-a="fec">✕ Fechar</button></div>
<div class="corpo"><div class="lado"></div><iframe title="Memorial descritivo"></iframe></div></div>`;
  document.body.append(box);
  const lado = box.querySelector('.lado'), fr = box.querySelector('iframe'), st = box.querySelector('.st');
  let ultimo = null;
  const campo = (id, rot, v, tipo = 'text') => `<label>${rot}<input data-k="${id}" type="${tipo}" value="${esc(v)}"></label>`;
  function painel() {
    const d = dados(), c = cfg(), S = secoes(), P = perdas();
    lado.innerHTML = `<h4>Dados da obra</h4>${campo('d.obra', 'Obra / projeto', d.obra)}${campo('d.cliente', 'Proprietário / cliente', d.cliente)}${campo('d.endereco', 'Endereço', d.endereco)}
<div class="g2">${campo('d.municipio', 'Município / UF', d.municipio)}${campo('d.area', 'Área construída (m²)', d.area)}</div>${campo('d.finalidade', 'Finalidade', d.finalidade)}${campo('d.empresa', 'Empresa (capa)', d.empresa)}
<div class="g2">${campo('d.rt', 'Responsável técnico', d.rt)}${campo('d.crea', 'CREA', d.crea)}</div><div class="g3">${campo('d.art', 'ART', d.art)}${campo('d.data', 'Data', d.data)}${campo('d.rev', 'Revisão', d.rev)}</div>
<h4>Concreto e consumos <span class="n">(referência — ajuste ao traço/fabricante)</span></h4><div class="g2">${campo('c.fck', 'fck lajes e vigas (MPa)', c.fck, 'number')}${campo('c.cob', 'Cobrimento (cm)', c.cob, 'number')}</div>
<div class="g2">${campo('c.tr.tr8', 'TR8 h12 (m³/m²)', c.tr.tr8, 'number')}${campo('c.tr.tr12', 'TR12 h16 (m³/m²)', c.tr.tr12, 'number')}${campo('c.tr.tr16', 'TR16 h20 (m³/m²)', c.tr.tr16, 'number')}${campo('c.tr.tr20', 'TR20 h25 (m³/m²)', c.tr.tr20, 'number')}</div>
<div class="g3">${campo('c.conc.cim', 'Concreto: cimento kg/m³', c.conc.cim, 'number')}${campo('c.conc.areia', 'areia m³/m³', c.conc.areia, 'number')}${campo('c.conc.brita', 'brita 1 m³/m³', c.conc.brita, 'number')}</div>
<div class="g3">${campo('c.grau.cim', 'Graute: cimento kg/m³', c.grau.cim, 'number')}${campo('c.grau.areia', 'areia m³/m³', c.grau.areia, 'number')}${campo('c.grau.brita', 'brita 0 m³/m³', c.grau.brita, 'number')}</div>
<div class="g3">${campo('c.arg.cim', 'Argamassa: cimento kg/m³', c.arg.cim, 'number')}${campo('c.arg.cal', 'cal kg/m³', c.arg.cal, 'number')}${campo('c.arg.areia', 'areia m³/m³', c.arg.areia, 'number')}</div>
<h4>Perdas (%)</h4><div class="g3"><label>Blocos<input data-k="p.blocks" type="number" value="${P.blocks}"></label><label>Aço<input data-k="p.steel" type="number" value="${P.steel}"></label>${campo('c.perda.conc', 'Concreto', c.perda.conc, 'number')}${campo('c.perda.grau', 'Graute', c.perda.grau, 'number')}${campo('c.perda.arg', 'Argamassa', c.perda.arg, 'number')}${campo('c.perda.tela', 'Telas', c.perda.tela, 'number')}</div>
<p class="n">Perdas de blocos e aço são as mesmas da planilha de quantitativos.</p>
<h4>Serviços complementares <span class="n">(o programa não conhece — edite o texto)</span></h4>${S.map(s => `<div class="sec"><span><input type="checkbox" data-s="${s.id}" ${s.on ? 'checked' : ''}> ${esc(s.nome)}</span><textarea data-t="${s.id}">${esc(s.txt)}</textarea></div>`).join('')}
<p class="n">Os textos ficam salvos no projeto e viram o modelo da próxima obra.</p>`;
    lado.oninput = salvar; lado.onchange = salvar;
  }
  function salvar() {
    const m = memo(); if (!m) return; m.dados ??= {}; m.cfg ??= {}; m.sec ??= {};
    for (const el of lado.querySelectorAll('[data-k]')) {
      const [g, ...p] = el.dataset.k.split('.'), v = el.type === 'number' ? (el.value === '' ? '' : Number(el.value)) : el.value;
      if (g === 'd') m.dados[p[0]] = v;
      else if (g === 'p') { let l = perdas(); l[p[0]] = N(v); LS('loss73', JSON.stringify(l)); for (const id of ['lossB73', 'lossS73']) { const e = $(id); if (e && ((id === 'lossB73' && p[0] === 'blocks') || (id === 'lossS73' && p[0] === 'steel'))) e.value = N(v); } }
      else { let o = m.cfg; for (let i = 0; i < p.length - 1; i++) o = o[p[i]] ??= {}; o[p.at(-1)] = v; }
    }
    for (const el of lado.querySelectorAll('[data-s]')) (m.sec[el.dataset.s] ??= {}).on = el.checked;
    for (const el of lado.querySelectorAll('[data-t]')) (m.sec[el.dataset.t] ??= {}).txt = el.value;
    LS('memo147tpl', JSON.stringify({ cfg: m.cfg, sec: m.sec, rt: m.dados.rt, crea: m.dados.crea, empresa: m.dados.empresa }));
    st.textContent = 'Alterações salvas — clique em Atualizar documento.';
  }
  async function gerar() {
    st.textContent = 'Levantando os dados do projeto…';
    await new Promise(r => setTimeout(r, 30));
    try {
      const D = await coletar(), C = cfg(), M = consolidar(D, C), d = dados(), S = secoes();
      let logo = ''; try { logo = localStorage.getItem('stamp106logo') || ''; } catch {}
      const doc = html(D, M, C, d, S, logo);
      ultimo = { D, M, C, d, doc };
      fr.srcdoc = doc;
      st.textContent = 'Documento pronto · ' + D.niveis.length + ' pavimento(s), ' + M.blocos.length + ' tipo(s) de peça, ' + fx(M.aco.reduce((s, a) => s + a.m * kgm(a.d), 0), 0) + ' kg de aço.' + (D.semModulacao ? ' Atenção: ' + D.semModulacao + ' parede(s) sem modulação.' : '');
    } catch (e) { console.error('V147', e); st.textContent = e.message || String(e); fr.srcdoc = '<p style="font:14px Segoe UI,Arial;padding:30px;color:#9b1c1c">' + esc(e.message || e) + '</p>'; ultimo = null; }
  }
  const nomeArq = ext => 'Memorial_descritivo_' + ((dados().obra || 'Engenhar').trim().replace(/[^\w\-]+/g, '_').slice(0, 40) || 'Engenhar') + ext;
  box.querySelector('.bar').onclick = async e => {
    const a = e.target.closest('button')?.dataset.a; if (!a) return;
    if (a === 'fec') { box.classList.remove('on'); return; }
    if (a === 'ger') { await gerar(); return; }
    if (!ultimo) await gerar(); if (!ultimo) return;
    if (a === 'pdf') { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (er) { st.textContent = 'Não foi possível imprimir: ' + er.message; } }
    if (a === 'doc') download(nomeArq('.doc'), '﻿' + ultimo.doc.replace('<html lang="pt-BR">', '<html lang="pt-BR" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">'), 'application/msword');
    if (a === 'xls') { try { download(nomeArq('.xlsx'), xlsx(ultimo.D, ultimo.M, ultimo.C, ultimo.d), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); st.textContent = 'Planilha baixada.'; } catch (er) { st.textContent = er.message; } }
  };
  function abrir() { box.classList.add('on'); painel(); gerar(); }
  window.memo147 = { abrir, coletar, consolidar, html, xlsx };

  // ---------------------------------------------------------------- onde aparece
  // botão ao lado de "Baixar quantitativos (Excel)", no menu Arquivo/Cálculo e no Exportar da barra azul
  function botao() { const xb = $('xlBtn73'); if (!xb || $('memo147btn')) return; const b = document.createElement('button'); b.type = 'button'; b.id = 'memo147btn'; b.textContent = '📑 Memorial descritivo e materiais'; b.onclick = abrir; xb.after(b); }
  try { const rr = renderResults; renderResults = function (...a) { const r = rr.apply(this, a); try { botao(); } catch {} return r; }; } catch {}
  setTimeout(botao, 0);
  try { const R = window.cad109?.REG; if (R) R.set('x:Memorial descritivo', { key: 'x:Memorial descritivo', t: { l: 'Memorial descritivo', ic: '📑', t: () => abrir() }, cat: 'extra' }); } catch {}
})();
