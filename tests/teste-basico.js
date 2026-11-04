// Teste básico: abre o programa montado (dist/) num navegador, carrega o exemplo
// didático, gera a modulação e confere se não houve nenhum erro.
// Uso:  python3 build.py && node tests/teste-basico.js
const path = require('path');
const { chromium } = require('playwright');

const fs = require('fs');
const ARQ = process.env.ARQ || path.resolve(__dirname, '..', 'dist', 'Modulacao_Alvenaria_Engenhar.html');
const REF = path.resolve(__dirname, 'referencia', 'exemplo-didatico.json');
const GRAVAR = process.argv.includes('--gravar-referencia');
const TOL = 1e-6;

// Compara dois valores (números com tolerância); devolve a lista de diferenças.
function diferencas(a, b, onde = '') {
  if (typeof a === 'number' && typeof b === 'number')
    return Math.abs(a - b) <= TOL * Math.max(1, Math.abs(b)) ? [] : [`${onde}: ${a} ≠ ${b}`];
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ks = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...ks].flatMap(k => diferencas(a[k], b[k], onde + '.' + k));
  }
  return a === b ? [] : [`${onde}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`];
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const erros = [];
  page.on('pageerror', e => erros.push('erro na página: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());

  await page.goto('file://' + ARQ, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.pdfjsLib, null, { timeout: 30000 });

  const falhas = [];
  const conferir = (ok, msg) => { console.log((ok ? '  ok   ' : '  FALHA ') + msg); if (!ok) falhas.push(msg); };

  conferir(true, 'programa abriu e o leitor de PDF iniciou');

  await page.evaluate(() => document.getElementById('example').click());
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.getElementById('generate').click());
  await page.waitForTimeout(3000);

  const r = await page.evaluate(() => ({
    paredes: (typeof state !== 'undefined' ? state.walls || [] : []).length,
    resultados: (typeof state !== 'undefined' ? state.results || [] : []).length,
    saida: document.getElementById('output')?.innerText || '',
  }));
  conferir(r.paredes > 0, `exemplo didático carregou ${r.paredes} paredes`);
  conferir(r.resultados === r.paredes, `modulação gerada para ${r.resultados}/${r.paredes} paredes`);
  conferir(/Modulação e quantitativos/.test(r.saida), 'quadro de resultados apareceu');
  // Cálculos: cargas por parede e resistências por pavimento
  const calc = await page.evaluate(() => {
    const R = window.loads77.compute({});
    const D = window.res96.compute();
    // modulação: todas as peças de todas as fiadas de todas as paredes
    const modulacao = (state.results || []).map(m => (m.rows || []).map(r =>
      (r.pieces || []).map(p => [p.code, +(+p.x).toFixed(3), +(+p.length).toFixed(3)].join(' ')).join(' | ')));
    return {
      modulacao,
      cargas: R.rows.map(lv => lv.map(r => ({ parede: r.label, gk: r.g, qk: r.q, t: r.x.t, H: r.x.H }))),
      pavimentos: D.levels.map(L => ({ nome: L.name, fbkCalculado: L.calc, fbk: L.fbk, fgk: L.fgk, motivo: L.why,
        critica: L.crit && { parede: L.crit.label, nd: L.crit.pd, lambda: L.crit.lam, R: L.crit.R, sigma: L.crit.sig, fk: L.crit.fk, fpk: L.crit.fpk, fbk: L.crit.fbk } })),
    };
  });
  if (GRAVAR) {
    fs.mkdirSync(path.dirname(REF), { recursive: true });
    fs.writeFileSync(REF, JSON.stringify(calc, null, 1) + '\n');
    console.log('  referência gravada em ' + path.relative(process.cwd(), REF));
  } else {
    const dif = diferencas(calc, JSON.parse(fs.readFileSync(REF, 'utf8')));
    conferir(dif.length === 0, 'modulação, cargas e fbk/fgk iguais à referência' + (dif.length ? ':\n    ' + dif.slice(0, 10).join('\n    ') : ''));
  }

  const mem = await page.evaluate(() => window.memorial?.html() || '');
  conferir(/Memorial de cálculo/.test(mem) && /P6 ★/.test(mem) && /Escopo e limitações/.test(mem), 'memorial de cálculo gerado (parede crítica P6)');

  // Opções novas ligadas (excentricidade e = t/6 e hef = 1,2·h) — depois volta ao padrão
  const op = await page.evaluate(() => {
    const s = window.res96.S(); s.exc = 1 / 6;
    const a = window.res96.compute().levels[0];
    const memExc = window.memorial.html();
    s.exc = 0; s.fh = 1.2;
    const b = window.res96.compute().levels[0];
    s.fh = 1;
    const c = window.res96.compute().levels[0];
    return { exc: a.crit.fbk, critExc: a.crit.label, memExc: /flexo-compressão/.test(memExc) && /σ<sub>M<\/sub> = M<sub>d<\/sub>/.test(memExc), hef: b.crit.fbk, lamHef: b.crit.lam, volta: c.crit.fbk };
  });
  conferir(Math.abs(op.exc - 2.0762) < 1e-3 && op.critExc === 'P6', `flexo-compressão e = t/6: P6 fbk = ${op.exc.toFixed(4)} (esperado 2,0762)`);
  conferir(op.memExc, 'memorial mostra o passo a passo da flexo-compressão');
  conferir(Math.abs(op.lamHef - 24) < 1e-9, `hef = 1,2·h: λ = ${op.lamHef}`);
  conferir(Math.abs(op.volta - 1.311263) < 1e-5, 'com as opções desligadas volta ao resultado original');

  conferir(erros.length === 0, 'nenhum erro no navegador' + (erros.length ? ':\n    ' + erros.join('\n    ') : ''));

  await browser.close();
  console.log(falhas.length ? `\n${falhas.length} falha(s).` : '\nTudo certo.');
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
