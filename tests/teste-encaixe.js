// Teste do defeito dos vãos nas fiadas (V109): paredes desenhadas alguns centímetros curtas ou
// longas no encontro. Antes, a amarração dos cantos se perdia e sobravam espaços sem bloco.
// Uso:  python3 build.py && node tests/teste-encaixe.js
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const ARQ = process.env.ARQ || path.resolve(__dirname, '..', 'dist', 'Modulacao_Alvenaria_Engenhar.html');
const DET = fs.readFileSync(path.join(__dirname, 'detector-de-vaos.js'), 'utf8');

// [nome, paredes [x1,y1,x2,y2], vãos esperados, pontas encaixadas esperadas, avisos esperados]
const R = (x1, y1, x2, y2) => [x1, y1, x2, y2];
const ret = [R(0, 0, 962, 0), R(962, 0, 962, 600), R(962, 600, 0, 600), R(0, 600, 0, 0)];
const CASOS = [
  ['parede interna 3 cm curta', [...ret, R(463, 3, 463, 250)], 0, 1, 0],
  ['três paredes internas fora do eixo (5 / 0 / −4 cm)', [...ret, R(134, 5, 134, 250), R(307, 0, 307, 250), R(463, -4, 463, 250)], 0, 2, 0],
  ['cantos em L desencontrados', [R(0, -4, 962, -4), R(965, 0, 965, 600), R(962, 603, 0, 603), R(-3, 600, -3, 0), R(463, 3, 463, 250)], 0, 9, 0],
  ['parede a 10 cm da face: não mexe, só avisa', [...ret, R(463, 17, 463, 250)], 0, 0, 1],
  ['parede chegando dentro de uma porta: avisa', [...ret.slice(0, 3), [0, 600, 0, 0, [{ start: 128, width: 80, bottom: 0, height: 220, type: 'Porta', tag58: 'P1' }]], R(0, 430, 500, 430)], null, 0, 1],
];

(async () => {
  const b = await chromium.launch();
  const falhas = [];
  const conferir = (ok, msg) => { console.log((ok ? '  ok   ' : '  FALHA ') + msg); if (!ok) falhas.push(msg); };
  for (const [nome, ws, vEsp, aEsp, wEsp] of CASOS) {
    const p = await b.newPage(); const erros = [];
    p.on('pageerror', e => erros.push(e.message)); p.on('dialog', d => d.accept());
    await p.goto('file://' + ARQ, { waitUntil: 'load' }); await p.waitForFunction(() => window.pdfjsLib);
    await p.addScriptTag({ content: DET });
    await p.evaluate(() => document.getElementById('example').click()); await p.waitForTimeout(800);
    await p.evaluate(ws => {
      const T = state.walls[0];
      state.walls = ws.map(([x1, y1, x2, y2, ops]) => { const w = JSON.parse(JSON.stringify(T)); w.line = [{ x: x1, y: y1 }, { x: x2, y: y2 }]; w.length = Math.hypot(x2 - x1, y2 - y1); w.openings = ops || []; w.uid = 'w' + Math.random().toString(36).slice(2); delete w.locationSegments24; w.locationMode24 = 'auto'; return w; });
      state.results = null; try { invalidate(); } catch {}
    }, ws);
    await p.evaluate(() => document.getElementById('generate').click());
    await require('./estresse.js').esperarFim(p);
    const r = await p.evaluate(() => ({ v: window.detectarVaos().length, a: (state.enc109?.ajustes || []).length, w: (state.enc109?.avisos || []).length }));
    conferir((vEsp === null || r.v === vEsp) && r.a === aEsp && r.w === wEsp && !erros.length,
      `${nome}: ${r.v} vão(s), ${r.a} ponta(s) encaixada(s), ${r.w} aviso(s)` + (erros.length ? ' · erros: ' + erros.join(' | ') : ''));
    await p.close();
  }
  await b.close();
  console.log(falhas.length ? `\n${falhas.length} falha(s).` : '\nTudo certo.');
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
