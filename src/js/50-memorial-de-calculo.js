// Memorial de cálculo — cargas verticais e compressão simples por pavimento.
// Mostra os parâmetros, a tabela de todas as paredes, o passo a passo da parede
// crítica e o que NÃO foi verificado. Abre para imprimir ou salvar em PDF.
// Usa as mesmas contas da tela (window.loads77, window.res96, window.calcAlv).
(function () {
  'use strict';
  const N = Number;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const f = (v, d = 2) => (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const VERSAO = (document.title.match(/V[\d.]+/) || ['V108.8'])[0];

  function dados() {
    const L = window.loads77, R96 = window.res96, C = window.calcAlv;
    if (!L || !R96 || !C) return null;
    const R = L.compute({}), D = R96.compute();
    if (!R?.LV?.length || !D) return null;
    const cfg = L.S().cfg, s = R96.S();
    const P = { gm: D.gm, kf: D.kf, eta: D.eta };
    const pav = D.levels.map((lv, i) => {
      const paredes = (R.rows[i] || []).map(r => {
        const t = N(r.x.t) || 14, H = N(r.x.H) || 280;
        const nd = C.cargaDeCalculo(r.g, r.q, D.gG, D.gQ);
        return { nome: r.label, gk: r.g, qk: r.q, ...C.compressaoSimples(nd, t, H, P) };
      });
      return { ...lv, paredes };
    });
    return { R, D, cfg, s, pav, P };
  }

  function passoAPasso(c, D) {
    return `<div class="passo">
      <p><b>Parede crítica: ${esc(c.label)}</b> (t = ${f(c.t, 0)} cm, h = ${f(c.H, 0)} cm)</p>
      <p>N<sub>d</sub> = ${f(c.pd)} kN/m <span class="obs">(γg·G<sub>k</sub> + γq·Q<sub>k</sub>, com γg = ${f(D.gG, 2)} e γq = ${f(D.gQ, 2)})</span></p>
      <p>σ<sub>d</sub> = N<sub>d</sub> / t = ${f(c.pd)} / ${f(c.t / 100, 2)} = ${f(c.sig * 1000, 1)} kN/m² = <b>${f(c.sig, 3)} MPa</b></p>
      <p>λ = h<sub>ef</sub> / t<sub>ef</sub> = ${f(c.H, 0)} / ${f(c.t, 0)} = ${f(c.lam, 2)} &nbsp;→&nbsp; R = 1 − (λ/40)³ = <b>${f(c.R, 3)}</b></p>
      <p>f<sub>k</sub> ≥ γm · σ<sub>d</sub> / R = ${f(D.gm, 1)} · ${f(c.sig, 3)} / ${f(c.R, 3)} = <b>${f(c.fk, 3)} MPa</b></p>
      <p>f<sub>pk</sub> = f<sub>k</sub> / ${f(D.kf, 2)} = <b>${f(c.fpk, 3)} MPa</b> &nbsp;&nbsp; f<sub>bk</sub> = f<sub>pk</sub> / η = ${f(c.fpk, 3)} / ${f(D.eta, 2)} = <b>${f(c.fbk, 2)} MPa</b></p>
    </div>`;
  }

  function motivo(L, s) {
    return L.why === 'min' ? `mínimo adotado (${f(N(s.min), 1)} MPa)` :
      L.why === 'acima' ? 'igual ao pavimento de cima (não diminui de cima para baixo)' :
      L.why === 'ovr' ? 'escolhido pelo projetista' : `pela parede mais carregada (${esc(L.crit?.label || '—')})`;
  }

  function html() {
    const X = dados();
    if (!X) return null;
    const { R, D, cfg, s, pav } = X;
    const projeto = (document.getElementById('project')?.value || '').trim() || 'Projeto sem nome';
    const hoje = new Date().toLocaleDateString('pt-BR');
    const modo = cfg.mode === 'grp' ? 'grupos de paredes (cargas uniformizadas no grupo)' : 'paredes isoladas';

    const secPav = pav.map(L => {
      const linhas = L.paredes.map(p => {
        const uso = L.fbk > 0 ? p.fbk / L.fbk : 0;
        const crit = L.crit && p.nome === L.crit.label;
        return `<tr${crit ? ' class="crit"' : ''}><td>${esc(p.nome)}${crit ? ' ★' : ''}</td><td>${f(p.t, 0)}</td><td>${f(p.H, 0)}</td><td>${f(p.lambda, 1)}${p.lambda > 24 ? ' ⚠' : ''}</td><td>${f(p.R, 3)}</td>
          <td>${f(p.gk)}</td><td>${f(p.qk)}</td><td>${f(p.nd)}</td><td>${f(p.sigma, 3)}</td><td>${f(p.fbk)}</td><td>${f(uso * 100, 0)}%</td></tr>`;
      }).join('');
      const tipo = L.rep > 1 && L.groups?.length ? `<p>Pavimento-tipo repetido ${L.rep}×. fbk por andar (1 = o de baixo): ${L.groups.map(g =>
        `andar${g.from === g.to ? ' ' + g.from : 'es ' + g.from + '–' + g.to}: fbk ${f(g.fbk, 0)} MPa / fgk ${f(g.fgk, 0)} MPa`).join(' · ')}.</p>` : '';
      return `<h2>${esc(L.name)}</h2>
        <table><tr><th>Parede</th><th>t (cm)</th><th>h (cm)</th><th>λ</th><th>R</th><th>G<sub>k</sub> (kN/m)</th><th>Q<sub>k</sub> (kN/m)</th><th>N<sub>d</sub> (kN/m)</th><th>σ<sub>d</sub> (MPa)</th><th>f<sub>bk</sub> nec. (MPa)</th><th>uso</th></tr>${linhas}</table>
        <p class="obs">★ parede crítica · uso = f<sub>bk</sub> necessário ÷ f<sub>bk</sub> adotado no pavimento · cargas acumuladas dos pavimentos de cima.</p>
        ${L.crit ? passoAPasso(L.crit, D) : ''}
        <p class="res">Adotado: <b>f<sub>bk</sub> = ${f(L.fbk, 1)} MPa</b> — ${motivo(L, s)} · <b>f<sub>gk</sub> = ${f(L.fgk, 0)} MPa</b> · f<sub>pk</sub> = ${f(L.fpk, 2)} MPa · f<sub>k</sub> = ${f(L.fk, 2)} MPa</p>
        ${tipo}${(L.warn || []).map(w => `<p class="aviso">⚠ ${esc(w)}</p>`).join('')}`;
    }).join('');

    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Memorial de cálculo — ${esc(projeto)}</title><style>
      body{font-family:Arial,sans-serif;margin:14mm;color:#102e4b;font-size:10pt;line-height:1.45}
      h1{font-size:17pt;margin:0}h2{font-size:12.5pt;margin:18px 0 6px;border-bottom:2px solid #174a78;padding-bottom:2px;page-break-after:avoid}
      h3{font-size:11pt;margin:14px 0 4px}p{margin:3px 0}.sub{color:#586c7c}.obs{color:#586c7c;font-size:8.5pt}
      table{border-collapse:collapse;width:100%;font-size:8.8pt;margin:6px 0;page-break-inside:auto}tr{page-break-inside:avoid}
      th,td{border:1px solid #c9d7e6;padding:3px 5px;text-align:right}th{background:#174a78;color:#fff;font-weight:600}td:first-child,th:first-child{text-align:left}
      tr.crit td{background:#fff4dc;font-weight:600}.passo{background:#f3f7fb;border-left:4px solid #174a78;padding:6px 10px;margin:8px 0;page-break-inside:avoid}
      .res{background:#e9f6ec;border-left:4px solid #2e8b4a;padding:6px 10px;margin:8px 0}.aviso{color:#a33a00}
      .lim{background:#fff4dc;border-left:4px solid #dfa03e;padding:6px 12px}.lim li{margin:2px 0}
      dl{display:grid;grid-template-columns:auto 1fr;gap:2px 14px;margin:6px 0}dt{color:#586c7c}dd{margin:0}
      .ass{margin-top:40px;display:flex;justify-content:flex-end}.ass div{border-top:1px solid #102e4b;width:80mm;text-align:center;padding-top:4px;font-size:9pt}
      @page{size:A4;margin:10mm}</style></head><body>
      <h1>Memorial de cálculo — alvenaria estrutural</h1>
      <p class="sub">${esc(projeto)} · cargas verticais e compressão simples · ${hoje}</p>

      <h2>1. Normas e critérios</h2>
      <p>ABNT NBR 16868-1 (alvenaria estrutural — projeto) · ABNT NBR 6120:2019 (ações) · ABNT NBR 8681 (combinações) · ABNT NBR 15270-1:2023 (blocos cerâmicos).</p>
      <p>Verificação à compressão simples por metro de parede: N<sub>d</sub> ≤ f<sub>d</sub> · A · R, com f<sub>d</sub> = f<sub>k</sub> / γm, R = 1 − (λ/40)³ e λ = h<sub>ef</sub> / t<sub>ef</sub>; f<sub>k</sub> = k · f<sub>pk</sub> e f<sub>pk</sub> = η · f<sub>bk</sub>. Assim, f<sub>bk</sub> ≥ γm · σ<sub>d</sub> / (R · k · η).</p>
      <p>Adotado h<sub>ef</sub> = altura da parede e t<sub>ef</sub> = espessura do bloco (paredes travadas no topo e na base pelas lajes, sem enrijecedores considerados).</p>

      <h2>2. Parâmetros adotados</h2>
      <dl><dt>γg (permanentes)</dt><dd>${f(D.gG, 2)}</dd><dt>γq (variáveis)</dt><dd>${f(D.gQ, 2)}</dd><dt>γm (alvenaria)</dt><dd>${f(D.gm, 2)}</dd>
      <dt>k = f<sub>k</sub> / f<sub>pk</sub></dt><dd>${f(D.kf, 2)}</dd><dt>η = f<sub>pk</sub> / f<sub>bk</sub></dt><dd>${f(D.eta, 2)} (confirmar com ensaio de prisma ou dado do fornecedor)</dd>
      <dt>f<sub>bk</sub> mínimo</dt><dd>${f(N(s.min), 1)} MPa${String(s.minItem || '').trim() ? ' (NBR 15270-1:2023, item ' + esc(s.minItem) + ')' : ''}</dd>
      <dt>f<sub>gk</sub> mínimo</dt><dd>${f(N(s.gMin), 0)} MPa${String(s.gItem || '').trim() ? ' (NBR 16868-1, item ' + esc(s.gItem) + ')' : ''}; f<sub>gk</sub> adotado = maior entre o mínimo e 2,3·f<sub>bk</sub> arredondado de 5 em 5 MPa</dd>
      <dt>Distribuição das cargas</dt><dd>${modo}</dd></dl>

      <h2>3. Verificação por pavimento</h2>
      ${secPav}
      ${(R.warn || []).length ? '<h3>Avisos do cálculo de cargas</h3>' + R.warn.map(w => `<p class="aviso">⚠ ${esc(w)}</p>`).join('') : ''}

      <h2>4. Escopo e limitações</h2>
      <div class="lim"><p>Este memorial cobre <b>somente cargas verticais e compressão simples</b>. Não foram verificados:</p><ul>
        <li>ações horizontais (vento — ABNT NBR 6123 — e desaprumo) e estabilidade global;</li>
        <li>cisalhamento e flexão das paredes de contraventamento;</li>
        <li>flexo-compressão por excentricidade das lajes apoiadas;</li>
        <li>compressão localizada sob apoios concentrados, dimensionamento de vergas e contravergas;</li>
        <li>situação de incêndio e colapso progressivo.</li></ul>
        <p>Cabe ao engenheiro responsável verificar esses itens e conferir os resultados deste memorial.</p></div>

      <div class="ass"><div>Engenheiro responsável · CREA</div></div>
      <p class="obs">Engenhar Engenharia e Projetos · Modulação de Alvenaria ${esc(VERSAO)} · gerado em ${hoje}</p>
      </body></html>`;
  }

  // Abre numa nova aba (no iPhone: Compartilhar → Imprimir / Salvar em PDF).
  // Se o navegador bloquear a aba, imprime por um quadro escondido.
  function imprimir() {
    const h = html();
    if (!h) { alert('Sem dados para o memorial: lance as paredes na planta e confira as cargas.'); return; }
    const w = window.open('', '_blank');
    if (w) {
      w.document.open(); w.document.write(h); w.document.close();
      setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 400);
      return;
    }
    const fr = document.createElement('iframe');
    fr.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0';
    document.body.append(fr);
    fr.contentDocument.open(); fr.contentDocument.write(h); fr.contentDocument.close();
    setTimeout(() => {
      try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { alert(e.message); }
      setTimeout(() => fr.remove(), 2000);
    }, 300);
  }

  window.memorial = { html, imprimir, dados };
})();
