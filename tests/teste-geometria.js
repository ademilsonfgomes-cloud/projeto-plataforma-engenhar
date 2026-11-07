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

  // nome do arquivo .json
  {
    const { p, erros } = await abrir();
    const nomes = await p.evaluate(() => {
      const got = [], o = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { got.push(this.download); };
      for (const v of ['João Silva', ' Maria / Casa: 2*? ', '']) { document.getElementById('project').value = v; document.getElementById('save').click(); }
      HTMLAnchorElement.prototype.click = o; return got;
    });
    conferir(nomes[0] === 'João Silva.json' && nomes[1] === 'Maria Casa 2.json' && /^Projeto_Modulacao_Alvenaria_V\d+\.json$/.test(nomes[2]) && !erros.length, 'arquivo salvo com o nome do cliente: ' + nomes.join(' | '));
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
  await b.close();
  console.log(falhas.length ? '\n' + falhas.length + ' falha(s).' : '\nTudo certo.');
  process.exit(falhas.length ? 1 : 0);
})();
