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
    // resultados de cada parede vêm do próprio quadro de resistências (mesma conta)
    const pav = D.levels.map(lv => ({ ...lv, paredes: lv.walls || [] }));
    return { R, D, cfg, s, pav };
  }

  function passoAPasso(c, D) {
    return `<div class="passo">
      <p><b>Parede crítica: ${esc(c.label)}</b> (t = ${f(c.t, 0)} cm, h = ${f(c.H, 0)} cm)</p>
      <p>N<sub>d</sub> = ${f(c.pd)} kN/m <span class="obs">(γg·G<sub>k</sub> + γq·Q<sub>k</sub>, com γg = ${f(D.gG, 2)} e γq = ${f(D.gQ, 2)})</span></p>
      <p>σ<sub>d</sub> = N<sub>d</sub> / t = ${f(c.pd)} / ${f(c.t / 100, 2)} = ${f(c.sig * 1000, 1)} kN/m² = <b>${f(c.sig, 3)} MPa</b></p>
      <p>h<sub>ef</sub> = ${f(D.fh, 2)} · ${f(c.H, 0)} = ${f(c.hef ?? c.H, 1)} cm &nbsp; t<sub>ef</sub> = ${f(D.delta, 2)} · ${f(c.t, 0)} = ${f(c.tef ?? c.t, 1)} cm</p>
      <p>λ = h<sub>ef</sub> / t<sub>ef</sub> = ${f(c.hef ?? c.H, 1)} / ${f(c.tef ?? c.t, 1)} = ${f(c.lam, 2)} &nbsp;→&nbsp; R = 1 − (λ/40)³ = <b>${f(c.R, 3)}</b></p>
      ${c.ef > 0 ? `<p>Excentricidade da laje: e = ${f(c.ef, 3)} · t = ${f(c.e, 2)} cm, aplicada à carga do próprio pavimento N<sub>exc</sub> = ${f(c.nexc)} kN/m</p>
      <p>M<sub>d</sub> = N<sub>exc</sub> · e = ${f(c.nexc)} · ${f(c.e / 100, 4)} = ${f(c.md, 3)} kN·m/m &nbsp; σ<sub>M</sub> = M<sub>d</sub> / W = ${f(c.md, 3)} / (${f(c.t / 100, 2)}²/6) = <b>${f(c.sigM, 3)} MPa</b></p>
      <p>f<sub>k</sub> ≥ γm · (σ<sub>d</sub> / R + σ<sub>M</sub> / 1,5) = ${f(D.gm, 1)} · (${f(c.sig, 3)} / ${f(c.R, 3)} + ${f(c.sigM, 3)} / 1,5) = <b>${f(c.fk, 3)} MPa</b> <span class="obs">(flexo-compressão; só compressão daria f<sub>bk</sub> = ${f(c.fbkN, 2)} MPa)</span></p>`
      : `<p>f<sub>k</sub> ≥ γm · σ<sub>d</sub> / R = ${f(D.gm, 1)} · ${f(c.sig, 3)} / ${f(c.R, 3)} = <b>${f(c.fk, 3)} MPa</b></p>`}
      <p>f<sub>pk</sub> = f<sub>k</sub> / ${f(D.kf, 2)} = <b>${f(c.fpk, 3)} MPa</b> &nbsp;&nbsp; f<sub>bk</sub> = f<sub>pk</sub> / η = ${f(c.fpk, 3)} / ${f(D.eta, 2)} = <b>${f(c.fbk, 2)} MPa</b></p>
    </div>`;
  }

  // Seção de ações horizontais (quando "incluir no memorial" estiver marcado no quadro do vento)
  function secaoVento() {
    const V = window.vento109; if (!V || !V.S().on) return null;
    const A = V.analisar(); if (!A) return null;
    const s = A.s, P = A.P;
    const dirs = A.dirs.map(d => `<h3>Vento em ${d.dir} — fachada de ${f(d.largura)} m, C<sub>a</sub> = ${f(d.Ca)}</h3>
      <table><tr><th>z (m)</th><th>V<sub>k</sub> (m/s)</th><th>q (kN/m²)</th><th>faixa (m)</th><th>F vento (kN)</th><th>F desaprumo (kN)</th><th>F total (kN)</th></tr>${
        d.forcas.map(x => `<tr><td>${f(x.z)}</td><td>${f(x.Vk, 1)}</td><td>${f(x.q, 3)}</td><td>${f(x.hTrib)}</td><td>${f(x.Fw)}</td><td>${f(x.Fd)}</td><td>${f(x.F)}</td></tr>`).join('')}</table>
      ${d.modo === 'maior' ? `<p>Momento na base: com vento ${f(d.Mw)} kN·m; com desaprumo ${f(d.Mdes)} kN·m → adotado <b>${d.caso}</b>.</p>` : ''}
      ${d.gz ? `<p class="${d.gz.gz <= 1.1 ? 'res' : 'aviso'}">Estabilidade global: γ<sub>z</sub> = 1 / (1 − ΔM<sub>d</sub> / M<sub>1d</sub>) = 1 / (1 − ${f(d.gz.dM, 4)} / ${f(d.gz.M1)}) = <b>${Number.isFinite(d.gz.gz) ? f(d.gz.gz, 3) : '∞'}</b>${
        d.gz.gz <= 1.1 ? ' ≤ 1,10 — efeitos globais de 2ª ordem desprezíveis.' : d.gz.gz <= 1.3 ? ' — majorar os esforços horizontais por 0,95·γ<sub>z</sub>.' : ' — rever o contraventamento.'}
        Deslocamento no topo (vento característico): ${f(d.gz.topoK * 1000, 2)} mm = H/${f(A.H / Math.max(d.gz.topoK, 1e-12), 0)}.</p>` : ''}
      ${d.niveis.map(n => `<p><b>${esc(n.nome)}</b> — na base: V<sub>k</sub> = ${f(n.V)} kN, M<sub>k</sub> = ${f(n.M)} kN·m</p>
        <table><tr><th>Trecho</th><th>L (m)</th><th>rigidez</th><th>V<sub>k</sub> (kN)</th><th>M<sub>k</sub> (kN·m)</th><th>σ (0,9G) (MPa)</th><th>f<sub>vk</sub> (MPa)</th><th>τ<sub>d</sub> / f<sub>vd</sub></th><th>σ<sub>t</sub> / f<sub>td</sub></th><th>f<sub>bk</sub> nec. (MPa)</th></tr>${
          n.trechos.map(p => `<tr${!p.cisOk || !p.tracaOk || p.fbk > n.fbkAdot + 1e-9 ? ' class="crit"' : ''}><td>${esc(p.nome)}</td><td>${f(p.L)}</td><td>${f(p.parte * 100, 1)}%</td><td>${f(p.Vk)}</td><td>${f(p.Mk)}</td><td>${f(p.sigma09, 3)}</td><td>${f(p.fvk, 3)}</td>
            <td>${f(p.tau, 3)} / ${f(p.fvd, 3)} ${p.cisOk ? '✓' : '✗'}</td><td>${f(p.sigt, 3)} / ${f(p.ftd, 3)} ${p.tracaOk ? '✓' : '✗'}</td><td>${f(p.fbk)}</td></tr>`).join('')}</table>
        <p class="${n.fbkMax > n.fbkAdot + 1e-9 || n.falhasCis || n.falhasTr ? 'aviso' : 'res'}">${n.fbkMax > n.fbkAdot + 1e-9 ? `⚠ Com vento, f<sub>bk</sub> necessário = ${f(n.fbkMax)} MPa, acima do adotado (${f(n.fbkAdot, 1)} MPa).` : `f<sub>bk</sub> adotado (${f(n.fbkAdot, 1)} MPa) atende com vento (máx. ${f(n.fbkMax)} MPa).`}
          ${n.falhasCis ? ` ⚠ ${n.falhasCis} trecho(s) não passam no cisalhamento.` : ' Cisalhamento atendido.'}
          ${n.falhasTr ? ` ⚠ ${n.falhasTr} trecho(s) com tração na flexão acima de f<sub>td</sub>. Armadura vertical grauteada em cada extremidade (pré-dimensionamento): ${
            n.trechos.filter(p => p.arm?.As > 0).map(p => `${esc(p.nome)}: T<sub>d</sub> = ${f(p.arm.T)} kN, A<sub>s</sub> = ${f(p.arm.As)} cm² → ${p.barras ? p.barras.n + ' ϕ ' + f(p.barras.d, p.barras.d % 1 ? 1 : 0) : 'aumentar o trecho'}`).join('; ')}.` : ' Sem tração acima de f<sub>td</sub>.'}</p>`).join('')}`).join('');
    return `<h2>4. Ações horizontais e contraventamento</h2>
      <p>Vento pela ABNT NBR 6123 (método estático): V<sub>k</sub> = V<sub>0</sub> · S<sub>1</sub> · S<sub>2</sub> · S<sub>3</sub>, S<sub>2</sub> = b · F<sub>r</sub> · (z/10)<sup>p</sup>, q = 0,613 · V<sub>k</sub>², F = C<sub>a</sub> · q · A<sub>e</sub>, com a força de cada pavimento na cota da laje e faixa de meia altura abaixo e acima.
      ${N(s.desaprumo) ? `Desaprumo (ABNT NBR 16868-1): θ<sub>a</sub> = 1/(100·√H) = 1/${f(1 / A.ang.formula, 0)}${A.ang.limite ? `, limitado ao ${A.ang.limite} adotado → θ<sub>a</sub> = 1/${f(1 / A.theta, 0)}` : ''}${N(s.thMax) > 0 || N(s.thMin) > 0 ? ` (limites adotados pelo projetista: ${[N(s.thMax) > 0 ? 'máx. 1/' + f(N(s.thMax), 0) : '', N(s.thMin) > 0 ? 'mín. 1/' + f(N(s.thMin), 0) : ''].filter(Boolean).join(', ')})` : ''}, força = θ<sub>a</sub> · peso do pavimento, ${N(s.desaprumo) === 2 ? 'considerado separadamente do vento: em cada direção vale o caso (vento ou desaprumo) com maior momento de tombamento na base' : 'somada ao vento'}.` : 'Desaprumo não considerado.'}</p>
      <dl><dt>V<sub>0</sub></dt><dd>${f(N(s.V0), 1)} m/s</dd><dt>S<sub>1</sub> / S<sub>3</sub></dt><dd>${f(N(s.S1), 2)} / ${f(N(s.S3), 2)}</dd><dt>S<sub>2</sub></dt><dd>categoria ${esc(s.cat)}, classe ${esc(A.cls)}</dd>
      <dt>Edificação</dt><dd>altura ${f(A.H)} m · planta ${f(A.Lx)} × ${f(A.Ly)} m</dd><dt>Argamassa</dt><dd>f<sub>a</sub> ${esc(s.arg)} MPa</dd>
      <dt>Combinações</dt><dd>vento principal: γg·G + γq·(W + ψ<sub>0</sub>·Q), ψ<sub>0</sub> = ${f(P.psiQ, 2)}; sobrecarga principal: γg·G + γq·(Q + ψ<sub>0</sub>·W), ψ<sub>0</sub> = ${f(P.psiW, 2)}; γq do vento = ${f(P.gW, 2)}; γm (cisalhamento e tração) = ${f(P.gmV, 2)}</dd></dl>
      <p>Distribuição: laje como diafragma rígido, sem torção; cada parede como trechos isolados entre aberturas, em balanço, sem abas; rigidez 1/k = h³/(3EI) + 1,2h/(GA), G = 0,4E. Verificações em cada trecho, na base de cada pavimento: cisalhamento τ<sub>d</sub> = V<sub>d</sub>/(t·L) ≤ f<sub>vk</sub>/γm, f<sub>vk</sub> = a + 0,5·σ (σ com 0,9·G); tração σ<sub>t</sub> = M<sub>d</sub>/W − 0,9·G/A ≤ f<sub>tk</sub>/γm; flexo-compressão f<sub>k</sub> ≥ γm·(N<sub>d</sub>/(A·R) + M<sub>d</sub>/(1,5·W)). Armadura dos trechos tracionados: diagrama elástico linear, zona tracionada x = L·σ<sub>t</sub>/(σ<sub>t</sub> + σ<sub>c</sub>), T<sub>d</sub> = σ<sub>t</sub>·t·x/2, A<sub>s</sub> = T<sub>d</sub>/f<sub>yd</sub> (f<sub>yd</sub> = ${f(N(s.fyk) / N(s.gs), 1)} MPa).
      γ<sub>z</sub>: E<sub>alv</sub> = ${f(N(s.Efat), 0)}·f<sub>pk</sub>${N(s.rEI) !== 1 ? ' × ' + f(N(s.rEI), 2) : ''}, deslocamentos com flexão e cisalhamento das paredes de cada direção, cargas verticais γg·G + γq·ψ<sub>0</sub>·Q.</p>
      ${A.avisos.map(w => `<p class="aviso">⚠ ${esc(w)}</p>`).join('')}${dirs}`;
  }

  // Seção de vergas (quando "incluir no memorial" estiver marcado no quadro das vergas)
  function secaoVergas(num) {
    const G = window.vergas109; if (!G || !G.S().on) return null;
    const A = G.analisar(); if (!A) return null;
    const s = A.s, todas = A.niveis.flatMap(n => n.vergas), falhas = todas.filter(v => !v.ok);
    return `<h2>${num}. Vergas</h2>
      <p>Verga em canaleta grauteada de ${f(N(s.hv), 0)} cm (d = ${f(N(s.hv) - N(s.cob), 0)} cm), apoio de ${f(N(s.apoio), 0)} cm de cada lado. Vão efetivo l = vão livre + d, limitado à distância entre os centros dos apoios.
      Efeito arco quando a altura de parede acima da verga supera 0,866·l (triângulo de 60°): carga = peso da alvenaria do triângulo (${f(N(s.gAlv), 1)} kN/m³), M = W·l/6; caso contrário, carga uniforme = parede acima + carga no topo da parede, M = q·l²/8. Peso próprio da verga sempre incluído. γ<sub>f</sub> = ${f(N(s.gf), 2)}.</p>
      <p>Flexão: compressão na alvenaria em retângulo de 0,8·x com f<sub>d</sub> = f<sub>k</sub>/γm (γm = ${f(N(s.gm), 1)}${N(s.fkV) > 0 ? `, f<sub>k</sub> da verga grauteada = ${f(N(s.fkV), 2)} MPa` : ', f<sub>k</sub> do pavimento — conservador'}), x ≤ 0,5·d, z = d − 0,4·x ≤ 0,95·d, A<sub>s</sub> = M<sub>d</sub>/(f<sub>yd</sub>·z) ≥ 0,10 %·b·d, f<sub>yd</sub> = ${f(N(s.fyk) / N(s.gs), 1)} MPa. Cisalhamento: τ<sub>d</sub> = V<sub>d</sub>/(b·d) ≤ f<sub>vk</sub>/γm, f<sub>vk</sub> = 0,35 + 17,5·ρ ≤ 0,7 MPa.</p>
      ${A.niveis.map(G.tabela).join('')}
      <p class="${falhas.length ? 'aviso' : 'res'}">${falhas.length ? `⚠ ${falhas.length} de ${todas.length} verga(s) não atendem com a barra detalhada em 1 fiada; ver a coluna "sugerido".` : `Todas as ${todas.length} vergas atendem com a barra detalhada.`}</p>`;
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
    const vento = secaoVento(), vergas = secaoVergas(vento ? 5 : 4);
    const modo = cfg.mode === 'grp' ? 'grupos de paredes (cargas uniformizadas no grupo)' : 'paredes isoladas';

    const secPav = pav.map(L => {
      const linhas = L.paredes.map(p => {
        const uso = L.fbk > 0 ? p.fbk / L.fbk : 0;
        const crit = L.crit && p.nome === L.crit.label;
        return `<tr${crit ? ' class="crit"' : ''}><td>${esc(p.nome)}${crit ? ' ★' : ''}</td><td>${f(p.t, 0)}</td><td>${f(p.H, 0)}</td><td>${f(p.lambda, 1)}${p.lambda > 24 ? ' ⚠' : ''}</td><td>${f(p.R, 3)}</td>
          <td>${f(p.gk)}</td><td>${f(p.qk)}</td><td>${f(p.nd)}</td><td>${f(p.sigma, 3)}</td>${D.ef > 0 ? `<td>${f(p.sigmaM, 3)}</td>` : ''}<td>${f(p.fbk)}</td><td>${f(uso * 100, 0)}%</td></tr>`;
      }).join('');
      const tipo = L.rep > 1 && L.groups?.length ? `<p>Pavimento-tipo repetido ${L.rep}×. fbk por andar (1 = o de baixo): ${L.groups.map(g =>
        `andar${g.from === g.to ? ' ' + g.from : 'es ' + g.from + '–' + g.to}: fbk ${f(g.fbk, 0)} MPa / fgk ${f(g.fgk, 0)} MPa`).join(' · ')}.</p>` : '';
      return `<h2>${esc(L.name)}</h2>
        <table><tr><th>Parede</th><th>t (cm)</th><th>h (cm)</th><th>λ</th><th>R</th><th>G<sub>k</sub> (kN/m)</th><th>Q<sub>k</sub> (kN/m)</th><th>N<sub>d</sub> (kN/m)</th><th>σ<sub>d</sub> (MPa)</th>${D.ef > 0 ? '<th>σ<sub>M</sub> (MPa)</th>' : ''}<th>f<sub>bk</sub> nec. (MPa)</th><th>uso</th></tr>${linhas}</table>
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
      tr.bad109 td{background:#fdecec}.no109{color:#a33a00}.ok109{color:#1d7a3a}.n109{color:#586c7c;font-size:8pt}h4{font-size:10.5pt;margin:10px 0 3px}
      @page{size:A4;margin:10mm}</style></head><body>
      <h1>Memorial de cálculo — alvenaria estrutural</h1>
      <p class="sub">${esc(projeto)} · cargas verticais${vento ? ', vento e contraventamento' : ' e compressão simples'} · ${hoje}</p>

      <h2>1. Normas e critérios</h2>
      <p>ABNT NBR 16868-1 (alvenaria estrutural — projeto) · ABNT NBR 6120:2019 (ações) · ABNT NBR 8681 (combinações) · ABNT NBR 15270-1:2023 (blocos cerâmicos).</p>
      <p>Verificação à compressão simples por metro de parede: N<sub>d</sub> ≤ f<sub>d</sub> · A · R, com f<sub>d</sub> = f<sub>k</sub> / γm, R = 1 − (λ/40)³ e λ = h<sub>ef</sub> / t<sub>ef</sub>; f<sub>k</sub> = k · f<sub>pk</sub> e f<sub>pk</sub> = η · f<sub>bk</sub>. Assim, f<sub>bk</sub> ≥ γm · σ<sub>d</sub> / (R · k · η).</p>
      <p>Adotado h<sub>ef</sub> = ${f(D.fh, 2)} · h${D.fh === 1 ? ' (parede travada no topo e na base pelas lajes)' : ''} e t<sub>ef</sub> = ${f(D.delta, 2)} · t${D.delta === 1 ? ' (sem enrijecedores considerados)' : ' (enrijecedores)'}.</p>
      ${D.ef > 0 ? `<p>Flexo-compressão: N<sub>d</sub> / (A · R) + M<sub>d</sub> / (1,5 · W) ≤ f<sub>d</sub>, com a reação da laje do próprio pavimento excêntrica de e = ${f(D.ef, 3)} · t (conservador: toda a carga do pavimento considerada excêntrica). Cargas dos pavimentos de cima consideradas centradas.</p>` : ''}

      <h2>2. Parâmetros adotados</h2>
      <dl><dt>γg (permanentes)</dt><dd>${f(D.gG, 2)}</dd><dt>γq (variáveis)</dt><dd>${f(D.gQ, 2)}</dd><dt>γm (alvenaria)</dt><dd>${f(D.gm, 2)}</dd>
      <dt>k = f<sub>k</sub> / f<sub>pk</sub></dt><dd>${f(D.kf, 2)}</dd><dt>η = f<sub>pk</sub> / f<sub>bk</sub></dt><dd>${f(D.eta, 2)} (confirmar com ensaio de prisma ou dado do fornecedor)</dd>
      <dt>f<sub>bk</sub> mínimo</dt><dd>${f(N(s.min), 1)} MPa${String(s.minItem || '').trim() ? ' (NBR 15270-1:2023, item ' + esc(s.minItem) + ')' : ''}</dd>
      <dt>f<sub>gk</sub> mínimo</dt><dd>${f(N(s.gMin), 0)} MPa${String(s.gItem || '').trim() ? ' (NBR 16868-1, item ' + esc(s.gItem) + ')' : ''}; f<sub>gk</sub> adotado = maior entre o mínimo e 2,3·f<sub>bk</sub> arredondado de 5 em 5 MPa</dd>
      <dt>Distribuição das cargas</dt><dd>${modo}</dd></dl>

      <h2>3. Verificação por pavimento</h2>
      ${secPav}
      ${(R.warn || []).length ? '<h3>Avisos do cálculo de cargas</h3>' + R.warn.map(w => `<p class="aviso">⚠ ${esc(w)}</p>`).join('') : ''}

      ${vento || ''}
      ${vergas || ''}
      <h2>${4 + (vento ? 1 : 0) + (vergas ? 1 : 0)}. Escopo e limitações</h2>
      <div class="lim"><p>Este memorial cobre <b>cargas verticais, ${D.ef > 0 ? 'flexo-compressão pela excentricidade das lajes' : 'compressão simples'}${vento ? ', ações horizontais (vento e desaprumo) com as paredes de contraventamento' : ''}${vergas ? ' e vergas' : ''}</b>. Não foram verificados:</p><ul>
        ${vento ? '<li>torção do edifício e contribuição das abas e das vergas no contraventamento;</li><li>detalhamento final das armaduras dos trechos tracionados (o valor indicado é pré-dimensionamento);</li>' : '<li>ações horizontais (vento — ABNT NBR 6123 — e desaprumo) e estabilidade global;</li><li>cisalhamento e flexão das paredes de contraventamento;</li>'}
        ${D.ef > 0 ? '' : '<li>flexo-compressão por excentricidade das lajes apoiadas;</li>'}
        <li>compressão localizada sob apoios concentrados${vergas ? ' e contravergas' : ', dimensionamento de vergas e contravergas'};</li>
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
