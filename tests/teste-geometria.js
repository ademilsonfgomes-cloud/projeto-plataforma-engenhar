// Teste do bloco 1 das melhorias (V116): Verificar geometria, nome do arquivo .json e Renumerar.
// Uso:  python3 build.py && node tests/teste-geometria.js
const path = require('path');
const { chromium } = require('playwright');
const ARQ = process.env.ARQ || path.resolve(__dirname, '..', 'dist', 'Modulacao_Alvenaria_Engenhar.html');

const R = (x1, y1, x2, y2, ops) => [x1, y1, x2, y2, ops];
const ret = [R(0, 0, 962, 0), R(962, 0, 962, 600), R(962, 600, 0, 600), R(0, 600, 0, 0)];
// [nome, paredes, críticos esperados, trecho esperado em algum aviso (ou null), bloqueia?]
const CASOS = [
  ['retângulo simples: nada a corrigir', ret, 0, null, false],
  ['parede lançada duas vezes (sobreposta, eixos a 7,5 cm)', [...ret, R(300, 0, 300, 600), R(307.5, 100, 307.5, 500)], 1, null, true],
  ['duas paredes alinhadas separadas por 1 cm', [...ret, R(0, 300, 400, 300), R(401, 300, 962, 300)], 0, 'separadas por 1 cm', false],
  ['parede terminando a 10 cm da face da outra', [...ret, R(463, 17, 463, 250)], 0, 'termina a 10 cm da face', false],
  ['encontro quase reto (88°)', [...ret, R(500, 0, 510.5, 300)], 0, 'quase reto', false],
  ['canto inclinado (45°)', [...ret, R(0, 300, 300, 0)], 0, 'Canto inclinado', false],
  ['porta saindo da parede', [...ret.slice(0, 3), R(0, 600, 0, 0, [{ start: 560, width: 80, bottom: 0, height: 220, type: 'Porta' }])], 1, null, true],
];

(async () => {
  const b = await chromium.launch();
  const falhas = [];
  const conferir = (ok, msg) => { console.log((ok ? '  ok   ' : '  FALHA ') + msg); if (!ok) falhas.push(msg); };
  const abrir = async () => {
    const p = await b.newPage(); const erros = [];
    p.on('pageerror', e => erros.push(e.message)); p.on('dialog', d => d.accept());
    await p.goto('file://' + ARQ, { waitUntil: 'load' }); await p.waitForFunction(() => window.pdfjsLib);
    await p.evaluate(() => document.getElementById('example').click()); await p.waitForTimeout(800);
    return { p, erros };
  };
  const paredes = (p, ws) => p.evaluate(ws => {
    const T = state.walls[0];
    state.walls = ws.map(([x1, y1, x2, y2, ops], i) => { const w = JSON.parse(JSON.stringify(T)); w.line = [{ x: x1, y: y1 }, { x: x2, y: y2 }]; w.planScale = 1; w.length = Math.round(Math.hypot(x2 - x1, y2 - y1) * 10) / 10; w.openings = ops || []; w.uid = 'g' + i; w.seq58 = i + 1; delete w.indirect84; delete w.extended86; w.confirmed = true; return w; });
    state.results = null; try { invalidate(); } catch {}
  }, ws);

  for (const [nome, ws, critEsp, trecho, bloqueia] of CASOS) {
    const { p, erros } = await abrir();
    await paredes(p, ws);
    const r = await p.evaluate(() => geo116.verificar());
    const crit = r.filter(x => x.nivel === 'critico').length;
    const achou = trecho === null ? true : r.some(x => x.titulo.includes(trecho));
    await p.evaluate(() => document.getElementById('generate').click()); await p.waitForTimeout(400);
    const bloqueou = await p.evaluate(() => !document.getElementById('geo116').hidden && !/Cancelar/i.test(document.getElementById('generate').textContent));
    conferir(crit === critEsp && achou && bloqueou === bloqueia && !erros.length,
      `${nome}: ${crit} crítico(s), ${r.length - crit} aviso(s)${bloqueou ? ', geração bloqueada' : ''}` + (achou ? '' : ' · faltou o aviso "' + trecho + '"') + (erros.length ? ' · erros: ' + erros.join(' | ') : ''));
    await p.close();
  }

  // aviso intencional: some da lista, fica gravado na parede (vai no .json) e volta se a medida mudar
  {
    const { p, erros } = await abrir();
    await paredes(p, [...ret, R(463, 12, 463, 250)]);
    const r = await p.evaluate(() => {
      const sig0 = sourceSignature(state.walls[4]);
      geo116.abrir(); const antes = geo116.lista().filter(x => !x.ok).length;
      document.querySelector('#geo116 [data-ok]').click();
      const depois = geo116.verificar().filter(x => !x.ok).length, gravado = JSON.stringify(state.walls).includes('geoOk116'), sig1 = sourceSignature(state.walls[4]);
      const w = state.walls[4]; w.line[0].y = 20; w.length = 230;
      const mudou = geo116.verificar().filter(x => !x.ok).length;
      return { antes, depois, gravado, mesmaAssinatura: sig0 === sig1, mudou };
    });
    conferir(r.antes === 1 && r.depois === 0 && r.gravado && r.mesmaAssinatura && r.mudou === 1 && !erros.length, 'aviso marcado como intencional: ' + JSON.stringify(r));
    await p.close();
  }

  // folga de 2 cm (o Gerar encaixaria sozinho): marcada como intencional, o encaixe não mexe
  {
    const { p, erros } = await abrir();
    await paredes(p, [...ret, R(463, 9, 463, 250)]);
    const r = await p.evaluate(() => {
      geo116.abrir(); const it = geo116.lista().find(x => x.snap); if (!it) return { achou: false };
      const b = document.querySelector('#geo116 [data-ok="' + geo116.lista().indexOf(it) + '"]'); b.click();
      const L0 = state.walls[4].length, log = window.encaixe109(state.walls);
      return { achou: true, encaixou: log.length, igual: state.walls[4].length === L0 };
    });
    conferir(r.achou && r.encaixou === 0 && r.igual && !erros.length, 'folga de 2 cm marcada como intencional não é encaixada: ' + JSON.stringify(r));
    await p.close();
  }

  // nome do arquivo .json
  {
    const { p, erros } = await abrir();
    const nomes = await p.evaluate(() => {
      const got = [], o = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { got.push(this.download); };
      for (const v of ['João Silva', ' Maria / Casa: 2*? ', '']) { document.getElementById('project').value = v; document.getElementById('save').click(); }
      const c = document.getElementById('st106cli'); if (c) { c.value = 'Cliente do Carimbo'; document.getElementById('project').value = 'Outro nome'; document.getElementById('save').click(); c.value = ''; }
      HTMLAnchorElement.prototype.click = o; return got;
    });
    conferir(nomes[3] === 'Cliente do Carimbo.json' && nomes[0] === 'João Silva.json' && nomes[1] === 'Maria Casa 2.json' && /^Projeto_Modulacao_Alvenaria_V\d+\.json$/.test(nomes[2]) && !erros.length, 'arquivo salvo com o nome do cliente: ' + nomes.join(' | '));
    await p.close();
  }

  // Paredes iguais: só nas pranchas; cada grupo pode ser desmarcado; a escolha não invalida a modulação
  {
    const { p, erros } = await abrir();
    await paredes(p, [...ret, R(300, 0, 300, 600), R(660, 0, 660, 600)]);
    await p.evaluate(() => { window.__geo116off = true; document.getElementById('generate').click(); });
    await require('./estresse.js').esperarFim(p);
    const r = await p.evaluate(() => {
      const d1 = collectPlot26(), g = iguais117.ultimo().grupos.map(x => x.ns), n1 = d1.items.length;
      if (!g.length) return { g };
      const sig = sourceSignature(state.walls[g[0][0] - 1]);
      for (const n of g[0]) state.walls[n - 1].separar117 = true;
      const n2 = collectPlot26().items.length, sig2 = sourceSignature(state.walls[g[0][0] - 1]);
      iguais117.set(false); const n3 = collectPlot26().items.length; iguais117.set(true);
      return { g, n1, n2, n3, mesma: sig === sig2, titulo: d1.items.find(i => i.iguais117)?.title };
    });
    conferir(r.g.length >= 1 && r.n2 === r.n1 + r.g[0].length - 1 && r.n3 >= r.n2 && r.mesma && !erros.length, 'paredes iguais nas pranchas: ' + JSON.stringify(r));
    await p.close();
  }

  // Trena (pontos livres com Shift) e texto da parede arrastado na planta principal
  {
    const { p, erros } = await abrir();
    await paredes(p, ret);
    await p.evaluate(() => { try { drawPlan(); } catch {} });
    const tela = q => p.evaluate(q => { const cv = document.getElementById('plan'), r = cv.getBoundingClientRect(), sc = r.width / cv.width, O = cv.planOrigin25 || { x: 0, y: 0 }; return { x: r.left + (q.x - O.x) * sc, y: r.top + (q.y - O.y) * sc }; }, q);
    await p.evaluate(() => window.trena118.ligar());
    const A = await tela({ x: 200, y: 300 }), B = await tela({ x: 500, y: 300 });
    await p.keyboard.down('Shift'); await p.mouse.click(A.x, A.y); await p.mouse.click(B.x, B.y); await p.keyboard.up('Shift');
    const med = await p.evaluate(() => { const m = trena118.medidas()[0], k = state.walls[0].planScale; trena118.desligar(); return m ? Math.round(Math.hypot(m.B.x - m.A.x, m.B.y - m.A.y) / k) : null; });
    const l = await p.evaluate(() => PlanEngine.labels(state.walls, 1).find(l => l.wall === 2)), L = await tela(l), sig = await p.evaluate(() => sourceSignature(state.walls[1]));
    await p.mouse.move(L.x, L.y); await p.mouse.down(); await p.mouse.move(L.x - 60, L.y + 40, { steps: 5 }); await p.mouse.up();
    const arr = await p.evaluate(s => ({ gravou: !!state.walls[1].labelPosition28, mesma: sourceSignature(state.walls[1]) === s, seta: !!PlanEngine.labels(state.walls, 1).find(l => l.wall === 2).seta118 }), sig);
    const l2 = await tela(await p.evaluate(() => PlanEngine.labels(state.walls, 1).find(l => l.wall === 2)));
    await p.mouse.dblclick(l2.x, l2.y);
    const volta = await p.evaluate(() => !state.walls[1].labelPosition28);
    conferir(med === 300 && arr.gravou && arr.mesma && arr.seta && volta && !erros.length, 'trena e texto da parede: ' + JSON.stringify({ med, ...arr, volta }));
    await p.close();
  }

  // Abertura poligonal na laje: desconta da área exatamente o polígono (L de 0,75 m²)
  {
    const { p, erros } = await abrir();
    const r = await p.evaluate(async () => {
      const e = (lvl92.entries() || []).find(x => !x.id.startsWith('p|')); await lvl92.go(e.id);
      const L = window.loads77, S = L.S();
      const area = () => { L.touch(); let a = 0; const walk = (o, d = 0) => { if (!o || d > 4) return; if (Array.isArray(o)) return o.forEach(x => walk(x, d + 1)); if (typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (typeof v === 'number') { if (/^area$/i.test(k)) a += v; } else walk(v, d + 1); } }; walk(L.compute()); return a; };
      const a0 = area(), w = state.walls.find(w => w.line), k = w.planScale, x0 = Math.min(...state.walls.flatMap(w => w.line.map(q => q.x))), y0 = Math.min(...state.walls.flatMap(w => w.line.map(q => q.y)));
      const P = (x, y) => ({ x: x0 + x * k, y: y0 + y * k });
      S.items.push({ id: 't1', kind: 'hole', forma: 'pol', page: e.pg, tgt: e.tgt, g: 0, q: 0, use: 'Escada', name: 'AX', pts: [P(150, 150), P(250, 150), P(250, 200), P(200, 200), P(200, 250), P(150, 250)] });
      const a1 = area(); S.items.pop(); area();
      window.el97.open(); document.querySelector('#el97 [data-k="hole"]')?.click();
      const botoes = [...document.querySelectorAll('#el97 [data-f]')].map(b => b.dataset.f).join(',');
      return { desconto: Math.round((a0 - a1) * 100) / 100, botoes };
    });
    conferir(r.desconto === 0.75 && r.botoes === 'ret,pol,circ' && !erros.length, 'abertura poligonal na laje: ' + JSON.stringify(r));
    await p.close();
  }

  // Pranchas: o quadro arrastado fica onde foi solto; os que estavam lá procuram o espaço livre mais perto
  {
    const { p, erros } = await abrir();
    await p.evaluate(() => { window.__geo116off = true; document.getElementById('generate').click(); });
    await require('./estresse.js').esperarFim(p);
    await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
    await p.click('#tabs85 [data-v="plot"]'); await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      buildPlot26(); const S = plotSheets26, si = S.findIndex(s => s.items.length >= 2); if (si < 0) return { erro: 'sem folha com 2 quadros' };
      const alvo = S[si].items[1], x = alvo.x, y = alvo.y, mov = S[si].items[0], res = window.colocar121(si, 0, si, x, y);
      const T = plotSheets26.find(s => s.items.includes(mov)), ov = [];
      plotSheets26.forEach(s => s.items.forEach((q, j) => s.items.forEach((o, k) => { if (k > j && overlap25(q, o, 0)) ov.push(q.title + ' × ' + o.title); })));
      return { noLugar: Math.abs(mov.x - x) < .01 && Math.abs(mov.y - y) < .01, mesmaFolha: plotSheets26.indexOf(T) === si, realocados: res?.rel.length || 0, sobrepostos: ov.length, ui: !!document.querySelector('#pr121rib [data-a="montar"]') && document.querySelectorAll('.th121').length === plotSheets26.length };
    });
    conferir(r.noLugar && r.mesmaFolha && r.realocados >= 1 && r.sobrepostos === 0 && r.ui && !erros.length, 'pranchas: quadro fica onde soltou e os outros saem: ' + JSON.stringify(r));
    await p.close();
  }

  // Viga que chega a 8 cm da parede: apoio gravado até a face de fora; Verificar geometria não reclama
  {
    const { p, erros } = await abrir();
    const r = await p.evaluate(async () => {
      const e = (lvl92.entries() || []).find(x => !x.id.startsWith('p|')); await lvl92.go(e.id);
      const ws = state.walls.filter(w => w.line && Math.abs(w.line[0].x - w.line[1].x) < 1).sort((a, b) => a.line[0].x - b.line[0].x), A = ws[0], k = A.planScale, y = (A.line[0].y + A.line[1].y) / 2;
      const it = { id: 'vt', kind: 'beam', sub: 'viga', page: e.pg, tgt: e.tgt, g: 0, q: 0, c: 2.5, name: 'VT', viga: { b: 14, h: 30, ni: 2, di: 10, ns: 2, ds: 8, de: 5, s: 15 }, pts: [{ x: A.line[0].x + (A.width / 2 + 8) * k, y }, { x: A.line[0].x + 200 * k, y }] };
      window.loads77.S().items.push(it); const mud = window.apoiarViga122(it);
      const x0 = (it.pts[0].x - A.line[0].x) / k, av = geo116.verificar().filter(x => /^Viga VT/.test(x.titulo)).length;
      window.loads77.S().items.pop();
      return { mud, ponta: Math.round(x0 * 10) / 10, face: -A.width / 2, avisos: av };
    });
    conferir(r.mud && r.ponta === r.face && r.avisos === 0 && !erros.length, 'viga a 8 cm da parede apoia até a face de fora: ' + JSON.stringify(r));
    await p.close();
  }

  // Unir vigas: alinhadas viram uma; seções diferentes não unem
  {
    const { p, erros } = await abrir();
    const r = await p.evaluate(async () => {
      const e = (lvl92.entries() || []).find(x => !x.id.startsWith('p|')); await lvl92.go(e.id);
      const S = window.loads77.S(), k = state.walls.find(w => w.line).planScale, x0 = Math.min(...state.walls.flatMap(w => w.line.map(q => q.x))), y0 = Math.min(...state.walls.flatMap(w => w.line.map(q => q.y)));
      const P = (x, y) => ({ x: x0 + x * k, y: y0 + y * k }), viga = (n, a, b, h = 40) => ({ id: n, kind: 'beam', sub: 'viga', page: e.pg, tgt: e.tgt, g: 0, q: 0, c: 2.5, name: n, viga: { b: 15, h, ni: 3, di: 10, ns: 2, ds: 8, de: 5, s: 15 }, pts: [a, b] });
      const A = viga('VA', P(100, 150), P(230, 150)), B = viga('VB', P(250, 150), P(380, 150)); S.items.push(A, B);
      const r1 = window.unirVigas125(A, B), sobrou = S.items.filter(i => i.id === 'VA' || i.id === 'VB').length, L = Math.round((A.pts[1].x - A.pts[0].x) / k);
      const C = viga('VC', P(100, 150), P(230, 150)), D = viga('VD', P(250, 150), P(380, 150), 30); S.items.push(C, D);
      const r2 = window.unirVigas125(C, D);
      S.items = S.items.filter(i => !['VA', 'VB', 'VC', 'VD'].includes(i.id));
      return { alinhadas: r1.ok && sobrou === 1 && L === 280, secoes: !r2.ok };
    });
    conferir(r.alinhadas && r.secoes && !erros.length, 'unir vigas: ' + JSON.stringify(r));
    await p.close();
  }

  // Lápis de referência: captura na Trena e fora das pranchas
  {
    const { p, erros } = await abrir();
    const r = await p.evaluate(() => {
      const L = window.ref126.lista(), w = state.walls.find(w => w.line), k = w.planScale, x0 = Math.min(...state.walls.flatMap(w => w.line.map(q => q.x))), y0 = Math.min(...state.walls.flatMap(w => w.line.map(q => q.y)));
      const pg = Number(document.getElementById('page').value) || 1, A = { x: x0 + 500 * k, y: y0 + 200 * k };
      L.push({ id: 'rt', page: pg, t: 'p', a: A }, { id: 'rl', page: pg, t: 'l', tr: true, a: { x: x0 + 120 * k, y: y0 + 300 * k }, b: { x: x0 + 420 * k, y: y0 + 300 * k } });
      const cap = window.trena118.capturar({ x: A.x + 1, y: A.y + 1 }, false).t;
      return { cap, pontos: window.ref126.pontos(pg).length };
    });
    conferir(r.cap === 'ref' && r.pontos === 4 && !erros.length, 'lápis de referência: ' + JSON.stringify(r));
    await p.close();
  }

  // Beiral: captura no canto externo verdadeiro e área em balanço reconhecida
  {
    const { p, erros } = await abrir();
    const r = await p.evaluate(async () => {
      const e = (lvl92.entries() || []).find(x => !x.id.startsWith('p|')); await lvl92.go(e.id);
      const ws = state.walls.filter(w => w.line), k = ws[0].planScale, h = ws[0].width / 2, x0 = Math.min(...ws.flatMap(w => w.line.map(q => q.x))), y0 = Math.min(...ws.flatMap(w => w.line.map(q => q.y)));
      const S = window.loads77.S();
      S.items.push({ id: 'bt', kind: 'edge', page: e.pg, tgt: e.tgt, pts: [{ x: x0 - h * k, y: y0 - h * k }, { x: x0 - h * k, y: y0 - 207 * k }, { x: x0 + 300 * k, y: y0 - 207 * k }, { x: x0 + 300 * k, y: y0 - h * k }], name: 'Beiral teste', g: null, q: null, mode: 'sub' });
      window.loads77.touch(); let cant = 0; const walk = (o, d = 0) => { if (!o || d > 5) return; if (Array.isArray(o)) return o.forEach(x => walk(x, d + 1)); if (typeof o === 'object') for (const [kk, v] of Object.entries(o)) { if (typeof v === 'number') { if (kk === 'cant') cant += v; } else walk(v, d + 1); } }; walk(window.loads77.compute());
      S.items = S.items.filter(i => i.id !== 'bt'); window.loads77.touch();
      return { cant: Math.round(cant * 10) / 10 };
    });
    conferir(r.cant >= 5.6 && r.cant <= 6.4 && !erros.length, 'beiral de 2 m reconhecido em balanço: ' + JSON.stringify(r));
    await p.close();
  }

  // Renumerar: a nova ordem precisa ficar (antes voltava para a ordem antiga ao atualizar o nível)
  {
    const { p, erros } = await abrir();
    await paredes(p, [R(0, 600, 0, 0), R(962, 600, 0, 600), R(962, 0, 962, 600), R(0, 0, 962, 0), R(500, 300.5, 962, 300.5), R(0, 299.6, 500, 300.4)]);
    await p.evaluate(() => window.renum116()); await p.waitForTimeout(200);
    await p.click('#rnGo101'); await p.waitForTimeout(400);
    const ordem = await p.evaluate(() => state.walls.map(w => w.uid).join(','));
    conferir(ordem === 'g3,g5,g4,g1,g0,g2' && !erros.length, 'Renumerar: horizontais de cima para baixo e da esquerda para a direita, depois verticais: ' + ordem);
    await p.close();
  }
  // Paredes lado a lado com eixo alguns cm desencontrado ficam juntas na numeração, e parede nova é numerada sozinha
  {
    const { p, erros } = await abrir();
    await paredes(p, [R(0, 100, 200, 100), R(600, 400, 800, 400), R(300, 106, 500, 106), R(900, 103, 1100, 103)]);
    await p.evaluate(() => window.renum116()); await p.waitForTimeout(200);
    await p.click('#rnGo101'); await p.waitForTimeout(400);
    const ordem = await p.evaluate(() => state.walls.map(w => w.uid).join(','));
    const nova = await p.evaluate(async () => {
      const w = state.walls[0], k = Number(w.planScale) || 1, [a] = w.line;
      document.body.classList.add('wall101');
      state.walls.push({ ...JSON.parse(JSON.stringify(w)), uid: 'nova', seq58: undefined, line: [{ x: a.x + 1200 * k, y: a.y + 4 * k }, { x: a.x + 1350 * k, y: a.y + 4 * k }], length: 150 });
      renderWalls(); document.body.classList.remove('wall101'); await new Promise(r => setTimeout(r, 1200));
      return state.walls.map(w => w.uid).join(',');
    });
    conferir(ordem === 'g0,g2,g3,g1' && nova === 'g0,g2,g3,nova,g1' && !erros.length, 'Numeração: mesma linha com eixo desencontrado (' + ordem + ') e parede nova numerada sozinha (' + nova + ')');
    await p.close();
  }
  await b.close();
  console.log(falhas.length ? '\n' + falhas.length + ' falha(s).' : '\nTudo certo.');
  process.exit(falhas.length ? 1 : 0);
})();
