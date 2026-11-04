// Teste básico: abre o programa montado (dist/) num navegador, carrega o exemplo
// didático, gera a modulação e confere se não houve nenhum erro.
// Uso:  python3 build.py && node tests/teste-basico.js
const path = require('path');
const { chromium } = require('playwright');

const fs = require('fs');
const ARQ = path.resolve(__dirname, '..', 'dist', 'Modulacao_Alvenaria_Engenhar.html');
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
    return {
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
    conferir(dif.length === 0, 'cargas e fbk/fgk iguais à referência' + (dif.length ? ':\n    ' + dif.slice(0, 10).join('\n    ') : ''));
  }

  conferir(erros.length === 0, 'nenhum erro no navegador' + (erros.length ? ':\n    ' + erros.join('\n    ') : ''));

  await browser.close();
  console.log(falhas.length ? `\n${falhas.length} falha(s).` : '\nTudo certo.');
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
