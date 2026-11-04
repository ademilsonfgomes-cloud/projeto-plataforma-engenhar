// Teste básico: abre o programa montado (dist/) num navegador, carrega o exemplo
// didático, gera a modulação e confere se não houve nenhum erro.
// Uso:  python3 build.py && node tests/teste-basico.js
const path = require('path');
const { chromium } = require('playwright');

const ARQ = path.resolve(__dirname, '..', 'dist', 'Modulacao_Alvenaria_Engenhar.html');

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
  conferir(erros.length === 0, 'nenhum erro no navegador' + (erros.length ? ':\n    ' + erros.join('\n    ') : ''));

  await browser.close();
  console.log(falhas.length ? `\n${falhas.length} falha(s).` : '\nTudo certo.');
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
