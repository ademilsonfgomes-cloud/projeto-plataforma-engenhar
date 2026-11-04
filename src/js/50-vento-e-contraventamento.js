// Vento e contraventamento — ações horizontais (vento NBR 6123 + desaprumo) distribuídas
// às paredes de contraventamento e verificação de cada trecho (cisalhamento, tração na
// flexão e flexo-compressão). As contas estão em src/calculo/vento.js (window.calcVento).
//
// Hipóteses (aparecem no quadro e no memorial):
// - laje como diafragma rígido, sem torção (forças distribuídas pela rigidez das paredes);
// - cada parede trabalha como trechos isolados entre aberturas, em balanço, sem abas;
// - só paredes paralelas à direção do vento (até 10°) contraventam nessa direção.
(function () {
  'use strict';
  const N = Number, L7 = () => window.loads77, CV = window.calcVento, CA = window.calcAlv;
  if (!L7() || !CV || !CA) return;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const f = (v, d = 2) => (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

  const DEF = { on: 0, V0: 35, S1: 1, S3: 1, cat: 'IV', cls: 'auto', CaX: 1.3, CaY: 1.3, desaprumo: 1,
    arg: '3,5 a 7,0', gW: 1.4, psiQ: 0.5, psiW: 0.6, gmV: 2.0 };
  function S() {
    const s = L7().S(); s.vento ??= {};
    for (const k in DEF) if (s.vento[k] === undefined || s.vento[k] === null || s.vento[k] === '') s.vento[k] = DEF[k];
    return s.vento;
  }

  // Trechos cheios de uma parede (cm), descontando as aberturas.
  function trechos(Lcm, ops) {
    const cuts = (ops || []).map(o => [Math.max(0, N(o.a)), Math.min(Lcm, N(o.b))]).filter(c => c[1] > c[0]).sort((a, b) => a[0] - b[0]);
    const out = []; let x = 0;
    for (const [a, b] of cuts) { if (a > x + 0.5) out.push([x, a]); x = Math.max(x, b); }
    if (Lcm > x + 0.5) out.push([x, Lcm]);
    return out;
  }

  function analisar() {
    const s = S(), R = L7().compute({}), D = window.res96?.compute();
    if (!R?.LV?.length || !D) return null;
    const s96 = window.res96.S(), tt = N(window.opt3d74?.t) || 10;
    const avisos = [];

    // pavimentos (o pavimento-tipo repetido entra uma vez para cada andar)
    const andares = [];
    R.LV.forEach((l, i) => {
      const step = ((N(l.H) || 280) + tt) / 100, rep = Math.max(1, N(l.rep) || 1), z0 = N(l.z) || 0;
      for (let k = 0; k < rep; k++) andares.push({ i, k, zBase: z0 + k * step, zTopo: z0 + (k + 1) * step });
    });
    andares.sort((a, b) => a.zTopo - b.zTopo);
    const H = andares.at(-1).zTopo - andares[0].zBase;

    // dimensões em planta (m), pelas paredes de todos os pavimentos
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const rows of R.rows) for (const r of rows) {
      const ln = r.x?.w?.line; if (!ln || ln.length < 2) continue;
      const len = Math.hypot(ln[1].x - ln[0].x, ln[1].y - ln[0].y) || 1, sc = (N(r.x.L) || len) / len;
      for (const p of ln) { x0 = Math.min(x0, p.x * sc); x1 = Math.max(x1, p.x * sc); y0 = Math.min(y0, p.y * sc); y1 = Math.max(y1, p.y * sc); }
    }
    const Lx = (x1 - x0) / 100, Ly = (y1 - y0) / 100;
    if (!(Lx > 0 && Ly > 0)) return null;
    const cls = s.cls === 'auto' ? CV.classe(Math.max(H, Lx, Ly)) : s.cls;
    const v = { V0: N(s.V0), S1: N(s.S1), S3: N(s.S3), cat: s.cat, cls };

    // peso de cada pavimento (G + Q do próprio pavimento) para o desaprumo
    const peso = R.LV.map((l, i) => {
      let own = null; try { own = L7().compute({ lv: l.key }); } catch {}
      return (own?.rows?.[i] || []).reduce((a, r) => a + (N(r.G) || 0) + (N(r.Q) || 0), 0);
    });
    const theta = CV.anguloDesaprumo(H);

    const P = { gG: D.gG, gQ: D.gQ, gW: N(s.gW), psiQ: N(s.psiQ), psiW: N(s.psiW), gm: D.gm, gmV: N(s.gmV), kf: D.kf, eta: D.eta, arg: s.arg };
    const PR = { gm: D.gm, kf: D.kf, eta: D.eta, fh: N(s96.fh) || 1, delta: N(s96.delta) || 1 };
    let inclinadas = 0;

    const dirs = ['X', 'Y'].map(dir => {
      const largura = dir === 'X' ? Ly : Lx, Ca = N(dir === 'X' ? s.CaX : s.CaY);
      const Fw = CV.forcasVento(andares, largura, Ca, v);
      const forcas = Fw.map((fw, j) => {
        const Fd = s.desaprumo ? theta * peso[andares[j].i] : 0;
        return { ...fw, Fw: fw.F, Fd, F: fw.F + Fd };
      });
      const niveis = R.LV.map((l, i) => {
        const zb = N(l.z) || 0, { V, M } = CV.esforcosNaBase(forcas, zb), hAcima = H - (zb - andares[0].zBase);
        const tr = [];
        (R.rows[i] || []).forEach(r => {
          const ln = r.x?.w?.line; if (!ln) return;
          const dx = Math.abs(ln[1].x - ln[0].x), dy = Math.abs(ln[1].y - ln[0].y), ang = Math.atan2(Math.min(dx, dy), Math.max(dx, dy)) * 180 / Math.PI;
          if (ang > 10) { if (dir === 'X') inclinadas++; return; }
          if ((dir === 'X') !== (dx >= dy)) return;
          const t = (N(r.x.t) || 14) / 100, Hp = N(r.x.H) || 280, Lw = N(r.x.L) || 0;
          const R_ = CA.compressaoSimples(1, t * 100, Hp, PR).R;
          const segs = trechos(Lw, r.x.ops);
          segs.forEach(([a, b], n) => {
            const Lp = (b - a) / 100;
            tr.push({ nome: r.label + (segs.length > 1 ? '.' + (n + 1) : ''), L: Lp, t, R: R_, NG: r.g * Lp, NQ: r.q * Lp, k: CV.rigidez(Lp, t, hAcima) });
          });
        });
        const K = tr.reduce((a, p) => a + p.k, 0) || 1;
        for (const p of tr) { p.parte = p.k / K; p.Vk = V * p.parte; p.Mk = M * p.parte; Object.assign(p, CV.verificarTrecho(p, P)); }
        const fbkAdot = D.levels[i]?.fbk || 0, fbkMax = tr.reduce((a, p) => Math.max(a, p.fbk), 0);
        return { i, nome: l.name, zb, V, M, trechos: tr, fbkAdot, fbkMax,
          falhasCis: tr.filter(p => !p.cisOk).length, falhasTr: tr.filter(p => !p.tracaOk).length };
      });
      return { dir, largura, Ca, forcas, niveis };
    });
    if (inclinadas) avisos.push(inclinadas + ' parede(s) inclinadas (mais de 10°) não entraram no contraventamento.');
    return { s, v, cls, H, Lx, Ly, theta, peso, andares, dirs, avisos, P };
  }

  // ---------- quadro na tela
  const box = document.createElement('div'); box.id = 'vento109'; box.className = 'noPrint'; box.hidden = true; document.body.append(box);
  const inp = (k, l, val, t = 'number') => `<label>${l}<input data-v="${k}" type="${t}" step="any" value="${esc(String(val))}"></label>`;
  const sel = (k, l, val, ops) => `<label>${l}<select data-v="${k}">${ops.map(o => `<option${String(o) === String(val) ? ' selected' : ''}>${o}</option>`).join('')}</select></label>`;
  const ok = (b, txt) => `<span class="${b ? 'ok109' : 'no109'}">${b ? '✓' : '✗'} ${txt}</span>`;

  function tabelaDirecao(d, A) {
    const forcas = `<table class="t109"><tr><th>z (m)</th><th>V<sub>k</sub> (m/s)</th><th>q (kN/m²)</th><th>faixa (m)</th><th>F vento (kN)</th><th>F desaprumo (kN)</th><th>F total (kN)</th></tr>${
      d.forcas.map(x => `<tr><td>${f(x.z)}</td><td>${f(x.Vk, 1)}</td><td>${f(x.q, 3)}</td><td>${f(x.hTrib)}</td><td>${f(x.Fw)}</td><td>${f(x.Fd)}</td><td><b>${f(x.F)}</b></td></tr>`).join('')}</table>`;
    const niveis = d.niveis.map(n => {
      const linhas = n.trechos.map(p => `<tr class="${!p.cisOk || !p.tracaOk || p.fbk > n.fbkAdot + 1e-9 ? 'bad109' : ''}"><td>${esc(p.nome)}</td><td>${f(p.L)}</td><td>${f(p.parte * 100, 1)}%</td><td>${f(p.Vk)}</td><td>${f(p.Mk)}</td>
        <td>${f(p.tau, 3)} / ${f(p.fvd, 3)} ${ok(p.cisOk, '')}</td><td>${f(p.sigt, 3)} / ${f(p.ftd, 3)} ${ok(p.tracaOk, '')}</td><td>${f(p.fbk)}</td></tr>`).join('');
      const fb = n.fbkMax > n.fbkAdot + 1e-9 ? `<p class="no109">⚠ Com vento, o trecho mais solicitado pede f<sub>bk</sub> = ${f(n.fbkMax)} MPa, acima do adotado (${f(n.fbkAdot, 1)} MPa). Ajuste o f<sub>bk</sub> do pavimento em "Resistências por pavimento".</p>` : `<p class="ok109">✓ f<sub>bk</sub> adotado (${f(n.fbkAdot, 1)} MPa) atende com vento (máx. necessário ${f(n.fbkMax)} MPa).</p>`;
      const tr = n.falhasTr ? `<p class="no109">⚠ ${n.falhasTr} trecho(s) com tração na flexão acima de f<sub>td</sub>: prever armadura vertical grauteada nas extremidades desses trechos (dimensionar) ou aumentar o trecho.</p>` : '';
      const ci = n.falhasCis ? `<p class="no109">⚠ ${n.falhasCis} trecho(s) não passam no cisalhamento.</p>` : '';
      return `<h4>${esc(n.nome)} — base: V<sub>k</sub> = ${f(n.V)} kN · M<sub>k</sub> = ${f(n.M)} kN·m</h4>
        ${n.trechos.length ? `<table class="t109"><tr><th>Trecho</th><th>L (m)</th><th>rigidez</th><th>V<sub>k</sub> (kN)</th><th>M<sub>k</sub> (kN·m)</th><th>τ<sub>d</sub> / f<sub>vd</sub> (MPa)</th><th>σ<sub>t</sub> / f<sub>td</sub> (MPa)</th><th>f<sub>bk</sub> nec. (MPa)</th></tr>${linhas}</table>${fb}${tr}${ci}`
          : '<p class="no109">⚠ Nenhuma parede nesta direção.</p>'}`;
    }).join('');
    return `<h3>Vento em ${d.dir} (fachada de ${f(d.largura)} m, C<sub>a</sub> = ${f(d.Ca)})</h3>${forcas}${niveis}`;
  }

  function render() {
    const s = S(), A = analisar();
    const params = `<div class="p109">${inp('V0', 'V<sub>0</sub> (m/s)', s.V0)}${inp('S1', 'S<sub>1</sub> (terreno)', s.S1)}${sel('cat', 'Categoria (S<sub>2</sub>)', s.cat, ['I', 'II', 'III', 'IV', 'V'])}${sel('cls', 'Classe', s.cls, ['auto', 'A', 'B', 'C'])}${inp('S3', 'S<sub>3</sub> (estatístico)', s.S3)}
      ${inp('CaX', 'C<sub>a</sub> vento em X', s.CaX)}${inp('CaY', 'C<sub>a</sub> vento em Y', s.CaY)}${sel('desaprumo', 'Desaprumo', s.desaprumo ? 'somar ao vento' : 'não considerar', ['somar ao vento', 'não considerar'])}
      ${sel('arg', 'Argamassa f<sub>a</sub> (MPa)', s.arg, Object.keys(CV.ARGAMASSA))}${inp('gW', 'γ<sub>q</sub> do vento', s.gW)}${inp('psiQ', 'ψ<sub>0</sub> sobrecarga', s.psiQ)}${inp('psiW', 'ψ<sub>0</sub> vento', s.psiW)}${inp('gmV', 'γ<sub>m</sub> cisalh./tração', s.gmV)}</div>`;
    const resumo = A ? `<p class="n109">Altura ${f(A.H)} m · planta ${f(A.Lx)} × ${f(A.Ly)} m · classe ${A.cls} · θ<sub>a</sub> = 1/${f(1 / A.theta, 0)} · pesos dos pavimentos: ${A.peso.map(p => f(p, 0)).join(' · ')} kN</p>${A.avisos.map(w => `<p class="no109">⚠ ${esc(w)}</p>`).join('')}` : '<p class="no109">Lance as paredes na planta para calcular.</p>';
    box.innerHTML = `<div class="h109"><b>Vento e contraventamento</b><span>arraste por aqui</span>
      <label class="on109"><input type="checkbox" class="cb109"${s.on ? ' checked' : ''}> incluir no memorial</label>
      <button type="button" class="x109" title="Fechar">✕</button></div><div class="b109">
      <p class="n109">Confira V<sub>0</sub> no mapa de isopletas e C<sub>a</sub> no ábaco da NBR 6123 para a sua edificação. Hipóteses: laje como diafragma rígido sem torção; paredes como trechos isolados entre aberturas, em balanço, sem abas.</p>
      <details${A ? '' : ' open'}><summary>Parâmetros</summary>${params}</details>${resumo}${A ? A.dirs.map(d => tabelaDirecao(d, A)).join('') : ''}</div>`;
    box.querySelector('.x109').onclick = () => { box.hidden = true; };
    box.querySelector('.cb109').onchange = e => { s.on = e.target.checked ? 1 : 0; salvar(); };
    box.querySelectorAll('[data-v]').forEach(el => el.onchange = () => {
      const k = el.dataset.v;
      if (k === 'desaprumo') s[k] = el.value === 'somar ao vento' ? 1 : 0;
      else if (el.tagName === 'SELECT') s[k] = el.value;
      else { const x = N(String(el.value).replace(',', '.')); s[k] = Number.isFinite(x) && x > 0 ? x : DEF[k]; }
      salvar(); render(); box.querySelector('details').open = true;
    });
    arrastar();
  }
  function salvar() { try { window.undo58?.push?.(); } catch {} }
  let d = null;
  function arrastar() {
    const h = box.querySelector('.h109');
    h.onpointerdown = e => { if (e.target.closest('button,input,label')) return; const r = box.getBoundingClientRect(); d = { dx: e.clientX - r.left, dy: e.clientY - r.top }; try { h.setPointerCapture(e.pointerId); } catch {} e.preventDefault(); };
    h.onpointermove = e => { if (!d) return; box.style.left = Math.max(0, Math.min(innerWidth - 160, e.clientX - d.dx)) + 'px'; box.style.top = Math.max(40, Math.min(innerHeight - 60, e.clientY - d.dy)) + 'px'; box.style.right = 'auto'; };
    h.onpointerup = () => { d = null; };
  }
  function open() { render(); box.hidden = false; }

  const css = document.createElement('style');
  css.textContent = '#vento109{position:fixed;top:110px;right:24px;width:min(1040px,calc(100vw - 32px));max-height:calc(100vh - 150px);overflow:auto;z-index:64;background:#fff;border:1px solid #b9c6d3;border-radius:9px;box-shadow:0 10px 28px rgba(16,46,75,.22);font-size:12.5px}#vento109[hidden]{display:none}' +
    '#vento109 .h109{display:flex;align-items:center;gap:10px;padding:7px 10px;background:#eef3f8;border-bottom:1px solid #d5dee7;cursor:move;user-select:none;position:sticky;top:0;z-index:1}#vento109 .h109 span{color:#8a9aaa;font-size:11px;flex:1}' +
    '#vento109 .on109{display:flex;align-items:center;gap:4px;font-size:11.5px;color:#174a78;cursor:pointer}#vento109 .on109 input{width:auto;margin:0}#vento109 .x109{border:0;background:none;font-size:15px;cursor:pointer;margin:0;padding:0 4px;color:#40566b}' +
    '#vento109 .b109{padding:8px 12px}#vento109 h3{font-size:14px;color:#174a78;margin:14px 0 4px}#vento109 h4{font-size:12.5px;margin:10px 0 3px}' +
    '.t109{border-collapse:collapse;width:100%;margin:4px 0}.t109 th,.t109 td{border:1px solid #c9d4df;padding:3px 5px;text-align:right}.t109 th{background:#eef3f8;font-weight:600}.t109 td:first-child,.t109 th:first-child{text-align:left}.t109 tr.bad109 td{background:#fdecec}' +
    '.n109{font-size:11px;color:#40566b;margin:5px 0}.ok109{color:#1d7a3a}.no109{color:#a33a00}#vento109 summary{cursor:pointer;font-weight:600;color:#174a78}' +
    '.p109{display:flex;flex-wrap:wrap;gap:6px 12px;margin:6px 0}.p109 label{display:flex;flex-direction:column;font-size:11px;color:#40566b}.p109 input,.p109 select{width:120px;margin:0;padding:4px}';
  document.head.append(css);

  window.vento109 = { analisar, open, S, trechos };
})();
