// Teste de estresse do motor de modulação: plantas aleatórias (sempre as mesmas, pela semente),
// com comprimentos quebrados, encontros em T, pontas fora do eixo, portas e janelas.
// Mede a qualidade da modulação para comparar versões do motor.
// Uso:  node tests/estresse.js [quantidade=12] [semente=1]      (ARQ=outro.html para outra versão)
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const ARQ = process.env.ARQ || path.resolve(__dirname, '..', 'dist', 'Modulacao_Alvenaria_Engenhar.html');
const DET = fs.readFileSync(path.join(__dirname, 'detector-de-vaos.js'), 'utf8');
const QTD = +process.argv[2] || 12, SEM = +process.argv[3] || 1;

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function planta(seed, comConflito = false) {
  const r = rng(seed), ri = (a, b) => Math.round(a + r() * (b - a));
  const W = ri(550, 1300), H = ri(450, 950), torto = () => (r() < 0.3 ? ri(-6, 6) : 0);
  const ws = [[0, 0, W, 0], [W, 0, W, H], [W, H, 0, H], [0, H, 0, 0]].map(l => ({ l, ops: [] }));
  const nInt = ri(2, 5), xs = [], ys = [];
  for (let k = 0; k < nInt; k++) {
    if (r() < 0.5) { // vertical, do topo até uma altura qualquer ou até embaixo
      const x = ri(90, W - 90); if (xs.some(v => Math.abs(v - x) < 60)) continue; xs.push(x);
      const y2 = r() < 0.5 ? H : ri(Math.round(H * 0.35), Math.round(H * 0.75));
      ws.push({ l: [x, torto(), x, y2 + (y2 === H ? torto() : 0)], ops: [] });
    } else {
      const y = ri(90, H - 90); if (ys.some(v => Math.abs(v - y) < 60)) continue; ys.push(y);
      const x2 = r() < 0.5 ? W : ri(Math.round(W * 0.35), Math.round(W * 0.75));
      ws.push({ l: [torto(), y, x2 + (x2 === W ? torto() : 0), y], ops: [] });
    }
  }
  // aberturas: em cerca de metade das paredes, uma porta ou uma janela em posição aleatória.
  // comConflito=false (padrão): a abertura nunca fica em cima de um encontro (planta válida).
  const encontros = w => { const [x1, y1, x2, y2] = w.l, L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, out = [];
    for (const v of ws) { if (v === w) continue; const [a1, b1, a2, b2] = v.l;
      // ponto mais próximo do eixo de v sobre w (paredes ortogonais): cruzamento ou ponta
      for (const t of [(a1 - x1) * ux + (b1 - y1) * uy, (a2 - x1) * ux + (b2 - y1) * uy]) {
        const px = x1 + ux * t, py = y1 + uy * t;
        const dentro = Math.min(a1, a2) - 8 <= px && px <= Math.max(a1, a2) + 8 && Math.min(b1, b2) - 8 <= py && py <= Math.max(b1, b2) + 8;
        if (dentro && t > -8 && t < L + 8) out.push(t); } }
    return out; };
  for (const w of ws) {
    const L = Math.hypot(w.l[2] - w.l[0], w.l[3] - w.l[1]);
    if (L < 200 || r() < 0.45) continue;
    const porta = r() < 0.5, larg = porta ? 80 : ri(6, 15) * 10, st = ri(20, Math.max(21, Math.round(L - larg - 20)));
    const op = porta ? { start: st, width: larg, bottom: 0, height: 220, type: 'Porta' } : { start: st, width: larg, bottom: 100, height: 120, type: 'Janela' };
    if (!comConflito && encontros(w).some(t => t > op.start - 30 && t < op.start + op.width + 30)) continue;
    w.ops.push(op);
  }
  return ws;
}

// fim da geração = botão parado (não está em "Cancelar") e resultados completos por 3 s seguidos
async function esperarFim(p, limite = 180000) {
  const t0 = Date.now(); let quieto = 0, ultimo = '';
  while (Date.now() - t0 < limite) {
    const e = await p.evaluate(() => ({ ocupado: /Cancelar/i.test(document.getElementById('generate').textContent), ok: Array.isArray(state.results) && state.results.length === state.walls.length,
      marca: JSON.stringify((state.results || []).map(m => m?.rows?.length || 0)) + (document.getElementById('genReport57')?.textContent || '').length }));
    if (!e.ocupado && e.ok && e.marca === ultimo) quieto += 500; else quieto = 0;
    ultimo = e.marca; if (quieto >= 3000) return true;
    await p.waitForTimeout(500);
  }
  return false;
}
module.exports = { planta, esperarFim };
if (require.main === module) (async () => {
  const b = await chromium.launch();
  const tot = { paredes: 0, falhas: 0, vaos: 0, filetes: 0, cortes: 0, peq: 0, comp: 0, comp39: 0, avisoAmarr: 0, tempo: 0 };
  console.log('planta  paredes  sem_modular  vãos  filetes  cortes  peças<14  %B39  aviso_amarr  tempo');
  for (let k = 0; k < QTD; k++) {
    const ws = planta(SEM * 1000 + k);
    const p = await b.newPage(); p.on('dialog', d => d.accept());
    await p.goto('file://' + ARQ, { waitUntil: 'load' }); await p.waitForFunction(() => window.pdfjsLib);
    await p.addScriptTag({ content: DET });
    await p.evaluate(() => document.getElementById('example').click()); await p.waitForTimeout(600);
    await p.evaluate(ws => {
      const T = state.walls[0];
      state.walls = ws.map(({ l: [x1, y1, x2, y2], ops }) => { const w = JSON.parse(JSON.stringify(T)); w.line = [{ x: x1, y: y1 }, { x: x2, y: y2 }]; w.length = Math.round(Math.hypot(x2 - x1, y2 - y1) * 10) / 10; w.openings = ops.map((o, i) => ({ ...o, tag58: (o.type === 'Porta' ? 'P' : 'J') + (i + 1) })); w.uid = 'w' + Math.random().toString(36).slice(2); delete w.locationSegments24; w.locationMode24 = 'auto'; return w; });
      state.results = null; try { invalidate(); } catch {}
    }, ws);
    const t0 = Date.now();
    await p.evaluate(() => document.getElementById('generate').click());
    // espera o programa terminar de verdade: ele pode gerar de novo sozinho (correções automáticas)
    await esperarFim(p);
    const m = await p.evaluate(() => {
      const R = state.results || [], W = state.walls; let fil = 0, cor = 0, peq = 0, comp = 0, c39 = 0, av = 0, falhas = 0;
      W.forEach((w, i) => {
        const r = R[i]; if (!r?.rows?.length) { falhas++; return; }
        if ((r.warnings || []).some(x => /Amarração insuficiente/.test(x))) av++;
        for (const row of r.rows) for (const q of row.pieces || []) {
          if (q.fill) { fil++; continue; } if (q.channel || /^U|^J/.test(q.code)) continue;
          comp += +q.length; if (q.cut) cor++; else if (Math.abs(q.length - 39) < 0.01) c39 += +q.length; if (+q.length < 14) peq++;
        }
      });
      return { paredes: W.length, falhas, vaos: window.detectarVaos().length, filetes: fil, cortes: cor, peq, comp, comp39: c39, avisoAmarr: av };
    });
    m.tempo = (Date.now() - t0) / 1000;
    for (const k2 in tot) tot[k2] += m[k2];
    console.log(String(k + 1).padStart(6), String(m.paredes).padStart(8), String(m.falhas).padStart(12), String(m.vaos).padStart(5), String(m.filetes).padStart(8), String(m.cortes).padStart(7), String(m.peq).padStart(9),
      (m.comp ? (m.comp39 / m.comp * 100).toFixed(0) + '%' : '—').padStart(5), String(m.avisoAmarr).padStart(12), m.tempo.toFixed(1).padStart(6) + ' s');
    await p.close();
  }
  await b.close();
  console.log('TOTAL  ', String(tot.paredes).padStart(8), String(tot.falhas).padStart(12), String(tot.vaos).padStart(5), String(tot.filetes).padStart(8), String(tot.cortes).padStart(7), String(tot.peq).padStart(9),
    ((tot.comp39 / tot.comp) * 100).toFixed(1).padStart(4) + '%', String(tot.avisoAmarr).padStart(12), tot.tempo.toFixed(0).padStart(5) + ' s');
  fs.writeFileSync(path.join(__dirname, '..', 'estresse-ultimo.json'), JSON.stringify(tot));
})().catch(e => { console.error(e); process.exit(1); });
