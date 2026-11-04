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

  // Vento e contraventamento (exemplo: térreo de 2,90 m, planta 8,00 × 5,60 m, padrões V0 = 35, cat. IV)
  const vt = await page.evaluate(() => {
    const A = window.vento109.analisar(), X = A.dirs[0], n = X.niveis[0];
    window.vento109.S().on = 1; const mem = window.memorial.html(); window.vento109.S().on = 0;
    return { H: A.H, Lx: A.Lx, Ly: A.Ly, Fw: X.forcas[0].Fw, Fd: X.forcas[0].Fd, P1: n.trechos.find(t => t.nome === 'P1')?.parte,
      nTrechos: n.trechos.length, todosOk: A.dirs.every(d => d.niveis.every(n => !n.falhasCis && !n.falhasTr)),
      mem: /Ações horizontais e contraventamento/.test(mem) && /Vento em Y/.test(mem), gz: X.gz.gz,
      arm: (() => { const s = window.vento109.S(); s.V0 = 120; const B = window.vento109.analisar(); s.V0 = 35;
        return B.dirs[1].niveis[0].trechos.filter(t => t.arm).map(t => t.nome + ':' + t.barras.n + 'x' + t.barras.d).join(' '); })() };
  });
  // F = 1,3 · 0,41264 · 5,6 · 1,45 = 4,3558 kN ; desaprumo = 435,99 / (100·√2,9) = 2,5602 kN
  conferir(Math.abs(vt.H - 2.9) < 1e-9 && vt.Lx === 8 && Math.abs(vt.Ly - 5.6) < 1e-9, `geometria do vento: H ${vt.H} m, planta ${vt.Lx} × ${vt.Ly} m`);
  conferir(Math.abs(vt.Fw - 4.3558) < 1e-3 && Math.abs(vt.Fd - 2.5602) < 1e-3, `forças em X: vento ${vt.Fw.toFixed(4)} kN, desaprumo ${vt.Fd.toFixed(4)} kN`);
  conferir(vt.nTrechos === 7 && Math.abs(vt.P1 - 0.524) < 1e-3, `contraventamento em X: 7 trechos, P1 com ${(vt.P1 * 100).toFixed(1)}% da rigidez`);
  conferir(vt.todosOk, 'térreo do exemplo passa no cisalhamento e na tração');
  conferir(vt.mem, 'memorial inclui ações horizontais quando marcado');
  // γz em X: Fd = 1,4·6,916 ; δ = Fd·H³/3EI + 1,2·Fd·H/GA = 3,07e-5 m ; ΔM = 577,09·δ ; M1 = 28,079 → 1,00063
  conferir(Math.abs(vt.gz - 1.000631) < 1e-5, `γz em X = ${vt.gz.toFixed(6)} (esperado 1,000631)`);
  conferir(vt.arm === 'P2.2:1x10 P4.1:1x10 P4.2:1x8 P5.1:1x10', `armadura nos trechos tracionados com V0 = 120 m/s: ${vt.arm}`);

  // Desaprumo "usar o maior": em X vento 4,3558 kN × desaprumo 2,5602 kN (mesma cota) → vale o vento
  const dm = await page.evaluate(() => {
    const s = window.vento109.S(); s.desaprumo = 2; const A = window.vento109.analisar(); s.desaprumo = 1;
    const B = window.vento109.analisar();
    return { caso: A.dirs[0].caso, F: A.dirs[0].forcas[0].F, Fsoma: B.dirs[0].forcas[0].F };
  });
  conferir(dm.caso === 'vento' && Math.abs(dm.F - 4.3558) < 1e-3 && Math.abs(dm.Fsoma - 6.9160) < 1e-3,
    `desaprumo: usar o maior → ${dm.caso} ${dm.F.toFixed(4)} kN ; somar → ${dm.Fsoma.toFixed(4)} kN`);

  // Vergas do exemplo (verga de 1 fiada, fk do pavimento = 1,4 MPa)
  const vg = await page.evaluate(() => {
    const A = window.vergas109.analisar(), v = A.niveis[0].vergas, p1 = v.find(x => x.nome === 'P1');
    window.vergas109.S().on = 1; const mem = window.memorial.html(); window.vergas109.S().on = 0;
    return { n: v.length, p1Md: p1.Md, p1alt: p1.alt?.sug ? p1.alt.sug.n + 'x' + p1.alt.sug.d : null, p2ok: v.find(x => x.nome === 'P2').ok,
      mem: /\. Vergas<\/h2>/.test(mem) };
  });
  // P1 em P3: q = 0,784 + 0,392 + (11,1247 − 5,488) + 1,5614 = 8,374 kN/m ; l = 0,96 ; Md = 1,4·8,374·0,96²/8 = 1,3506
  conferir(vg.n === 6 && Math.abs(vg.p1Md - 1.3506) < 1e-3, `vergas: ${vg.n} aberturas, P1 Md = ${vg.p1Md.toFixed(4)} kN·m`);
  conferir(vg.p1alt === '1x10' && vg.p2ok === true, `P1 pede 2 fiadas (1 ϕ 10); P2 passa com 1 fiada`);
  conferir(vg.mem, 'memorial inclui as vergas quando marcado');

  conferir(erros.length === 0, 'nenhum erro no navegador' + (erros.length ? ':\n    ' + erros.join('\n    ') : ''));

  await browser.close();
  console.log(falhas.length ? `\n${falhas.length} falha(s).` : '\nTudo certo.');
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
