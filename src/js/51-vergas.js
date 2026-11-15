// Vergas — cálculo de cada verga sobre as aberturas (contas em src/calculo/vergas.js,
// window.calcVergas) e comparação com a barra detalhada pelo programa.
(function () {
  'use strict';
  const N = Number, L7 = () => window.loads77, CVg = window.calcVergas, CV = window.calcVento;
  if (!L7() || !CVg || !CV) return;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const f = (v, d = 2) => (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const fd = d => f(d, d % 1 ? 1 : 0);

  const DEF = { on: 0, hv: 20, cob: 4, apoio: 30, gAlv: 14, fkV: 0, fyk: 500, gs: 1.15, gf: 1.4, gm: 2 };
  function S() {
    const s = L7().S(); s.vergas ??= {};
    for (const k in DEF) if (s.vergas[k] === undefined || s.vergas[k] === null || s.vergas[k] === '') s.vergas[k] = DEF[k];
    return s.vergas;
  }
  // barra que o programa detalha hoje em cada verga: 1 barra da bitola horizontal
  function detalhada() {
    const d = N(document.getElementById('steelDiameter')?.value);
    const dia = [6, 8, 10, 12.5].includes(d) ? d : 10;
    return { n: 1, d: dia, area: Math.PI * dia * dia / 400 };
  }

  function analisar() {
    const s = S(), R = L7().compute({}), D = window.res96?.compute();
    if (!R?.LV?.length || !D) return null;
    const det = detalhada(), fyd = N(s.fyk) / N(s.gs);
    const niveis = R.LV.map((l, i) => {
      const fk = N(s.fkV) > 0 ? N(s.fkV) : (D.levels[i]?.fk || 1.4);
      const vergas = [];
      (R.rows[i] || []).forEach(r => {
        const ops = r.x?.ops || [], abert = r.x?.w?.openings || [];
        const t = N(r.x.t) || 14, H = N(r.x.H) || 280;
        // carga no topo da parede: a carga na base menos o peso próprio da parede deste pavimento
        const gTopo = Math.max(0, r.g - N(s.gAlv) * t / 100 * H / 100), qTopo = r.q;
        ops.forEach((o, k) => {
          const vao = N(o.b) - N(o.a), topo = N(o.bot) + N(o.h);
          if (!(vao > 0)) return;
          const acima = H - topo - N(s.hv);
          const v = CVg.verga({ vao, apoio: N(s.apoio), hv: N(s.hv), cob: N(s.cob), t, acima, gAlv: N(s.gAlv), gTopo, qTopo, fk, gm: N(s.gm), gf: N(s.gf), fyd });
          const sug = v.flexOk ? CV.escolherBarras(v.As) : null;
          // não passou com uma fiada: tenta verga de 2 fiadas (dobro da altura)
          let alt = null;
          if (!v.flexOk) {
            const v2 = CVg.verga({ vao, apoio: N(s.apoio), hv: 2 * N(s.hv), cob: N(s.cob), t, acima: acima - N(s.hv), gAlv: N(s.gAlv), gTopo, qTopo, fk, gm: N(s.gm), gf: N(s.gf), fyd });
            alt = { ...v2, sug: v2.flexOk ? CV.escolherBarras(v2.As) : null };
            alt.cis = CVg.cisalhamento(v2, Math.max(det.area, alt.sug?.area || 0), t, N(s.gm));
          }
          const cis = CVg.cisalhamento(v, Math.max(det.area, sug?.area || 0), t, N(s.gm));
          const detOk = v.flexOk && det.area >= v.As - 1e-9;
          vergas.push({ nome: (abert[k]?.tag58 || ('A' + (k + 1))), parede: r.label, vao, t, acima, fk, ...v, sug, alt, det, detOk, cis,
            ok: v.flexOk && detOk && cis.ok });
        });
      });
      return { i, nome: l.name, fk, vergas };
    });
    return { s, niveis, det };
  }

  // ---------- quadro
  const box = document.createElement('div'); box.id = 'vergas109'; box.className = 'noPrint'; box.hidden = true; document.body.append(box);
  const inp = (k, l, val) => `<label>${l}<input data-g="${k}" type="number" step="any" value="${esc(String(val))}"></label>`;

  function tabela(n) {
    if (!n.vergas.length) return '';
    return `<h4>${esc(n.nome)} — f<sub>k</sub> = ${f(n.fk)} MPa</h4><table class="t109"><tr><th>Abertura</th><th>Parede</th><th>vão (cm)</th><th>l (m)</th><th>acima (cm)</th><th>carga</th><th>M<sub>d</sub> (kN·m)</th><th>V<sub>d</sub> (kN)</th><th>x/d</th><th>A<sub>s</sub> nec. (cm²)</th><th>sugerido</th><th>detalhado</th><th>τ<sub>d</sub> / f<sub>vd</sub> (MPa)</th></tr>${
      n.vergas.map(v => `<tr class="${v.ok ? '' : 'bad109'}"><td>${esc(v.nome)}</td><td>${esc(v.parede)}</td><td>${f(v.vao, 0)}</td><td>${f(v.l)}</td><td>${f(v.acima, 0)}</td>
        <td>${v.caso === 'arco' ? 'arco (triângulo)' : `total, q = ${f(v.q)} kN/m`}</td><td>${f(v.Md)}</td><td>${f(v.Vd)}</td>
        <td>${v.flexOk ? f(v.xd) : '<span class="no109">&gt; 0,50</span>'}</td><td>${v.flexOk ? f(v.As) : '—'}</td>
        <td>${v.sug ? v.sug.n + ' ϕ ' + fd(v.sug.d) : v.alt?.sug ? `<span class="no109">2 fiadas: ${v.alt.sug.n} ϕ ${fd(v.alt.sug.d)}</span>` : '<span class="no109">nem com 2 fiadas: verga de concreto ou f<sub>k</sub> maior</span>'}</td>
        <td>${v.det.n} ϕ ${fd(v.det.d)} ${v.flexOk ? (v.detOk ? '<span class="ok109">✓</span>' : '<span class="no109">✗</span>') : ''}</td>
        <td>${(c => `${f(c.tau, 3)} / ${f(c.fvd, 3)} ${c.ok ? '<span class="ok109">✓</span>' : '<span class="no109">✗ estribos</span>'}${v.alt ? ' <span class="n109">(2 fiadas)</span>' : ''}`)(v.alt ? { tau: v.alt.tau, ...v.alt.cis } : { tau: v.tau, ...v.cis })}</td></tr>`).join('')}</table>`;
  }

  function render() {
    const s = S(), A = analisar();
    const falhas = A ? A.niveis.flatMap(n => n.vergas).filter(v => !v.ok) : [];
    box.innerHTML = `<div class="h109"><b>Vergas</b><span>arraste por aqui</span>
      <label class="on109"><input type="checkbox" class="cb109"${s.on ? ' checked' : ''}> incluir no memorial</label>
      <button type="button" class="x109" title="Fechar">✕</button></div><div class="corpo109">
      <p class="n109">Vão efetivo l = vão + d (até o centro dos apoios). Efeito arco quando a parede acima passa do triângulo de 60° (0,87·l): a verga leva só o peso do triângulo; senão leva a parede acima e a carga que chega no topo da parede (laje e pavimentos de cima). Flexão com fd = fk/γm (bloco 0,8x, x ≤ 0,5d), A<sub>s</sub> ≥ 0,10 %·b·d; cisalhamento f<sub>vk</sub> = 0,35 + 17,5ρ ≤ 0,7 MPa. O efeito arco pede parede ao lado da abertura capaz de absorver o empuxo.</p>
      <details${A ? '' : ' open'}><summary>Parâmetros</summary><div class="p109">${inp('hv', 'altura da verga (cm)', s.hv)}${inp('cob', 'centro da barra ao fundo (cm)', s.cob)}${inp('apoio', 'apoio de cada lado (cm)', s.apoio)}
        ${inp('gAlv', 'peso da alvenaria (kN/m³)', s.gAlv)}${inp('fkV', 'f<sub>k</sub> da verga grauteada (MPa; 0 = f<sub>k</sub> do pavimento)', s.fkV)}${inp('gm', 'γ<sub>m</sub>', s.gm)}${inp('gf', 'γ<sub>f</sub>', s.gf)}${inp('fyk', 'f<sub>yk</sub> (MPa)', s.fyk)}${inp('gs', 'γ<sub>s</sub>', s.gs)}</div></details>
      ${A ? (falhas.length ? `<p class="no109">⚠ ${falhas.length} verga(s) precisam de atenção (em vermelho): aumentar a altura (2 fiadas), a armadura ou informar o f<sub>k</sub> do prisma grauteado.${N(s.fkV) > 0 ? '' : ' O cálculo está usando o f<sub>k</sub> do pavimento (alvenaria sem graute), que é conservador para a canaleta grauteada.'}</p>` : '<p class="ok109">✓ Todas as vergas atendem com a barra detalhada.</p>') + A.niveis.map(tabela).join('') : '<p class="no109">Lance as paredes e as aberturas para calcular.</p>'}</div>`;
    box.querySelector('.x109').onclick = () => { box.hidden = true; };
    box.querySelector('.cb109').onchange = e => { s.on = e.target.checked ? 1 : 0; salvar(); };
    box.querySelectorAll('[data-g]').forEach(el => el.onchange = () => {
      const k = el.dataset.g, x = N(String(el.value).replace(',', '.'));
      s[k] = Number.isFinite(x) && (x > 0 || k === 'fkV') ? x : DEF[k];
      salvar(); render(); box.querySelector('details').open = true;
    });
    arrastar();
  }
  function salvar() { try { window.undo58?.push?.(); } catch {} }
  let dr = null;
  function arrastar() {
    const h = box.querySelector('.h109');
    h.onpointerdown = e => { if (e.target.closest('button,input,label')) return; const r = box.getBoundingClientRect(); dr = { dx: e.clientX - r.left, dy: e.clientY - r.top }; try { h.setPointerCapture(e.pointerId); } catch {} e.preventDefault(); };
    h.onpointermove = e => { if (!dr) return; box.style.left = Math.max(0, Math.min(innerWidth - 160, e.clientX - dr.dx)) + 'px'; box.style.top = Math.max(40, Math.min(innerHeight - 60, e.clientY - dr.dy)) + 'px'; box.style.right = 'auto'; };
    h.onpointerup = () => { dr = null; };
  }
  function open() { render(); box.hidden = false; }

  // mesmo visual do quadro do vento (classes .h109, .t109 etc.)
  const css = document.createElement('style');
  css.textContent = '#vergas109{position:fixed;top:120px;right:30px;width:min(1080px,calc(100vw - 32px));max-height:calc(100vh - 150px);overflow:auto;z-index:65;background:#fff;border:1px solid #b9c6d3;border-radius:9px;box-shadow:0 10px 28px rgba(16,46,75,.22);font-size:12.5px}#vergas109[hidden]{display:none}' +
    '#vergas109 .h109{display:flex;align-items:center;gap:10px;padding:7px 10px;background:#eef3f8;border-bottom:1px solid #d5dee7;cursor:move;user-select:none;position:sticky;top:0;z-index:1}#vergas109 .h109 span{color:#8a9aaa;font-size:11px;flex:1}' +
    '#vergas109 .on109{display:flex;align-items:center;gap:4px;font-size:11.5px;color:#174a78;cursor:pointer}#vergas109 .on109 input{width:auto;margin:0}#vergas109 .x109{border:0;background:none;font-size:15px;cursor:pointer;margin:0;padding:0 4px;color:#40566b}' +
    '#vergas109 .corpo109{padding:8px 12px}#vergas109 h4{font-size:12.5px;margin:10px 0 3px}#vergas109 summary{cursor:pointer;font-weight:600;color:#174a78}';
  document.head.append(css);

  window.vergas109 = { analisar, open, S, tabela };
})();
