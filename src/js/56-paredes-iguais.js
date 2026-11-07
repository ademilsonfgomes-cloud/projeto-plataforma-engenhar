// V117 — 01. AGRUPAR PAREDES IGUAIS NAS PRANCHAS (economia de folhas)
// Duas paredes do mesmo pavimento ficam num quadro só ("Parede 1 = Parede 5 = Parede 9") quando o DESENHO
// pronto delas é idêntico: elevação, corte, 1ª e 2ª fiada, armaduras, grautes e amarração dos encontros.
// Na comparação só se ignoram os números (Parede N, etiquetas de portas/janelas e de vigas). Assim nunca se
// força uma equivalência que mude o detalhe. Os quantitativos continuam somando parede por parede.
(function () {
  'use strict';
  const N = Number, $id = id => document.getElementById(id);
  const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch {} return null; };
  let ligado = LS('iguais117') !== '0';
  const norm = h => String(h || '').replace(/\sfont-size="[^"]*"/g, '').replace(/(bloco de referência da outra parede<\/title><rect[^>]*?) fill="[^"]*"/g, '$1').replace(/\s(on[a-z]+|id|for|data-[\w-]+)="[^"]*"/gi, '').replace(/Parede\s*\d+/g, 'Parede #').replace(/\b([PJVRAN])\d+\b/g, '$1#').replace(/-?\d+\.\d+/g, x => String(Math.round(N(x) * 100) / 100));
  const nivel = w => { try { return window.L68 ? L68().keyOf?.(N(w.page || 1)) ?? N(w.page || 1) : N(w.page || 1); } catch { return N(w.page || 1); } };
  const lista = ns => ns.length <= 4 ? ns.map(n => 'Parede ' + n).join(' = ') : 'Paredes ' + ns.join(' = ');
  let ultimo = { grupos: [], economia: 0 };

  function agrupar(d) {
    if (!ligado || !d?.items?.length) { ultimo = { grupos: [], economia: 0 }; return d; }
    const por = new Map(), saida = [];
    for (const it of d.items) {
      const m = /^Parede (\d+)(?!\s*·\s*pendente)/.exec(it.title || ''), i = m ? N(m[1]) - 1 : -1, w = state.walls[i];
      if (!w || !it.html || /pendente/.test(it.title)) { saida.push(it); continue; }
      const chave = nivel(w) + '|' + Math.round(it.w) + 'x' + Math.round(it.h) + '|' + norm(it.html);
      const g = por.get(chave);
      if (g) { g.ns.push(i + 1); continue; }
      const novo = { it, ns: [i + 1] }; por.set(chave, novo); saida.push(it);
    }
    const grupos = [...por.values()].filter(g => g.ns.length > 1);
    for (const g of grupos) {
      const resto = g.it.title.replace(/^Parede \d+/, '');
      g.it.title = lista(g.ns) + resto + ' (' + g.ns.length + ' paredes iguais)';
      if (g.it.contents27) g.it.contents27 = g.it.contents27.replace(/^Parede \d+/, lista(g.ns));
      g.it.iguais117 = g.ns.slice();
    }
    ultimo = { grupos: grupos.map(g => g.ns), economia: grupos.reduce((s, g) => s + g.ns.length - 1, 0) };
    return { ...d, items: saida };
  }
  try {
    const cp = collectPlot26;
    collectPlot26 = function (...a) {
      const d = cp.apply(this, a);
      try { return agrupar(d); } catch (e) { console.error('V117 paredes iguais', e); return d; }
    };
  } catch (e) { console.error('V117 paredes iguais', e); }
  // ---------------------------------------------------------------- 2ª etapa: igualar a modulação
  // Paredes com a MESMA geometria (comprimento, altura, espessura, aberturas, posição interna/externa…) que o
  // motor modulou de jeitos diferentes: tenta usar em todas a modulação de uma delas. Só aceita se, para cada
  // parede, não surgir bloco sobreposto na planta, nenhum encontro com as vizinhas deixar de fechar e as
  // regras de amarração continuarem atendidas. Senão, a parede fica com a modulação própria.
  const FORA = ['uid', 'line', 'seq58', 'locked76', 'confirmed', 'source', 'detectedSegments', 'locationSegments24', 'locationUncertain24', 'locationMode24', 'geoOk116', 'noSnap116', 'manualRows', 'manualAnchor', 'fix76', 'planScale', 'indirect84', 'extended86', 'iguala117'];
  function chaveGeo(w) {
    const d = {}; for (const [k, v] of Object.entries(w)) if (!FORA.includes(k)) d[k] = v;
    d.openings = (w.openings || []).map(o => [N(o.start), N(o.width), N(o.bottom), N(o.height), o.type || '']);
    d.nivel = nivel(w);
    return JSON.stringify(d);
  }
  const assinaturaRows = m => JSON.stringify((m.rows || []).map(r => r.pieces.map(p => [p.code, Math.round(N(p.x) * 10), Math.round(N(p.length) * 10), Math.round(N(p.joint) * 10), !!p.fill, !!p.channel])));
  function vizinhas(i) { try { return JunctionEngine.detect(state.walls).filter(q => q.a.i === i || q.b.i === i).map(q => q.a.i === i ? q.b.i : q.a.i); } catch { return []; } }
  function problemas(results, alvo) {
    // conflitos na planta e encontros que não fecham, só na parede alvo e nas vizinhas dela
    const idx = [alvo, ...vizinhas(alvo)], ws = idx.map(i => state.walls[i]), rs = idx.map(i => results[i]), out = new Set();
    const page = N(state.walls[alvo].page || 1), nr = Math.max(0, ...rs.map(m => m?.rows?.length || 0)), vistos = new Set();
    for (let r = 0; r < nr; r++) {
      const sig = JSON.stringify(rs.map(m => m?.rows?.[r]?.pieces.map(p => [p.x, p.length, p.joint]))); if (vistos.has(sig)) continue; vistos.add(sig);
      const g = PlanEngine.geometry(ws, rs, page, r);
      for (const p of g.pieces) if (p.conflict) out.add('conflito ' + idx[p.wall - 1] + ' f' + (r % 2));
    }
    try { for (const c of JunctionEngine.auditMeetings(ws, rs, state.blocks, N($id('jh').value))) if (!c.ok) out.add('encontro ' + c.walls.map(k => idx[k]).sort().join('-')); } catch {}
    for (const v of vaos(results, idx)) out.add(v);
    return out;
  }
  // vão real numa fiada: espaço entre peças que não é abertura nem é ocupado por bloco de outra parede
  function vaos(R, idx) {
    const W = state.walls, out = [], pagina = N(W[idx[0]].page || 1);
    const geoW = i => { const w = W[i]; if (!w?.line) return null; const [a, b] = w.line, L = Math.hypot(b.x - a.x, b.y - a.y) || 1, s = (N(w.length) || L) / L; return { ax: a.x * s, ay: a.y * s, ux: (b.x - a.x) / L, uy: (b.y - a.y) / L, t: N(w.width) || 14 }; };
    const G = W.map((w, i) => N(w.page || 1) === pagina ? geoW(i) : null);
    const ocupado = (px, py, fi, menos) => R.some((m, j) => {
      if (j === menos || !G[j]) return false; const g = G[j], r = m?.rows?.[fi]; if (!r) return false;
      const lx = (px - g.ax) * g.ux + (py - g.ay) * g.uy, ly = -(px - g.ax) * g.uy + (py - g.ay) * g.ux;
      return Math.abs(ly) <= g.t / 2 + 0.5 && (r.pieces || []).some(p => lx >= p.x - 0.5 && lx <= p.x + p.length + 0.5);
    });
    for (const wi of idx) {
      const w = W[wi], g = G[wi]; if (!g) continue;
      (R[wi]?.rows || []).forEach((r, fi) => {
        const P = (r.pieces || []).slice().sort((a, b) => a.x - b.x); if (!P.length) return;
        const y0 = P[0].y ?? fi * 20, h = P[0].height ?? 19, pts = [];
        for (let k = 1; k < P.length; k++) { const a = P[k - 1], c = P[k], fim = a.x + a.length + (a.fill ? 0 : (N(a.joint) || 0)); if (c.x - fim > 0.6) pts.push([fim, c.x]); }
        if (P[0].x > 0.6) pts.push([0, P[0].x]); const u = P.at(-1), fim = u.x + u.length; if (N(w.length) - fim > 0.6) pts.push([fim, N(w.length)]);
        for (const [a, b] of pts) {
          if ((w.openings || []).some(o => a >= N(o.start) - 1 && b <= N(o.start) + N(o.width) + 1 && y0 + h > N(o.bottom) && y0 < N(o.bottom) + N(o.height))) continue;
          let livre = 0; for (let x = a + 0.5; x < b; x += 1) if (!ocupado(g.ax + g.ux * x, g.ay + g.uy * x, fi, wi)) livre++;
          if (livre >= 2) out.push('vão ' + wi + ' f' + fi + ' ' + Math.round(a) + '-' + Math.round(b));
        }
      });
    }
    return out;
  }
  function igualar() {
    const R = state.results; if (!Array.isArray(R) || R.length !== state.walls.length) return { igualadas: 0 };
    const grupos = new Map();
    state.walls.forEach((w, i) => { const m = R[i]; if (!w.line || !m?.rows?.length || m.errors?.length || m.manual || w.manualRows) return; const k = chaveGeo(w); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(i); });
    let igualadas = 0; const feitos = [];
    for (const ids of grupos.values()) {
      if (ids.length < 2) continue;
      // modelos: as modulações do grupo, da mais repetida para a menos; preferir as sem pendência
      const porSig = new Map(); for (const i of ids) { const s = assinaturaRows(R[i]); if (!porSig.has(s)) porSig.set(s, []); porSig.get(s).push(i); }
      if (porSig.size < 2) continue;
      const modelos = [...porSig.values()].sort((a, b) => (R[a[0]].pending ? 1 : 0) - (R[b[0]].pending ? 1 : 0) || b.length - a.length);
      const resolvidos = new Set();
      for (const mod of modelos) {
        const M = R[mod[0]]; if (M.pending) continue;
        for (const i of ids) {
          if (resolvidos.has(i) || mod.includes(i) || R[i].pending && !R[i].isolated116 && false) continue;
          if (assinaturaRows(R[i]) === assinaturaRows(M)) continue;
          const antes = problemas(R, i), tent = R.slice(); tent[i] = { ...clone(M), igualada117: mod[0] + 1 };
          const depois = problemas(tent, i);
          if ([...depois].every(x => antes.has(x)) && !V7Rules.audit(tent[i].rows)) {
            R[i] = tent[i]; resolvidos.add(i); mod.push(i); igualadas++; feitos.push((i + 1) + '←' + (mod[0] + 1));
            try { const w = state.walls[i]; state.savedResults[w.uid] = { signature: sourceSignature(w), neighbours: neighbourSignature(i), result: clone(R[i]), bondVersion: bondVer53() }; } catch {}
          }
        }
        mod.forEach(i => resolvidos.add(i));
      }
    }
    return { igualadas, feitos };
  }
  // roda sozinho depois de cada geração (quando o ciclo termina), se a opção estiver ligada
  let tmr = null, dentro = false;
  try {
    const rr = renderResults;
    renderResults = function (...a) {
      const r = rr.apply(this, a);
      if (!dentro && ligado && LS('igualar117') !== '0') { clearTimeout(tmr); tmr = setTimeout(depoisDeGerar, 1500); }
      return r;
    };
  } catch (e) { console.error('V117 igualar', e); }
  function depoisDeGerar() {
    const g = $id('generate'); if (g && /Cancelar/i.test(g.textContent)) { tmr = setTimeout(depoisDeGerar, 1500); return; }
    let r; try { r = igualar(); } catch (e) { console.error('V117 igualar', e); return; }
    ultimoIgualar = r;
    if (!r.igualadas) return;
    dentro = true;
    try { renderResults({ reports: state.junctionReports || [] }, state.results); drawPlan(); } catch (e) { console.error('V117 igualar', e); } finally { dentro = false; }
    try { msg('Paredes iguais: ' + r.igualadas + ' parede(s) passaram a usar a mesma modulação de outra igual (' + r.feitos.join(', ') + '), sem sobreposição e com os encontros fechados. Nas pranchas elas saem num quadro só.'); } catch {}
  }
  let ultimoIgualar = { igualadas: 0 };

  window.iguais117 = { igualar, ultimoIgualar: () => ultimoIgualar, ultimo: () => ultimo, ligado: () => ligado, set: v => { ligado = !!v; LS('iguais117', v ? '1' : '0'); } };

  // opção nas configurações das pranchas + resumo da economia
  function opcao() {
    const ref = $id('plotDate27')?.closest('label'); if (!ref || $id('iguais117')) return;
    const l = document.createElement('label'); l.className = 'iguais117';
    l.innerHTML = '<input type="checkbox" id="iguais117"> Agrupar paredes iguais (P1 = P2 = P3)';
    ref.after(l);
    const c = $id('iguais117'); c.checked = ligado;
    c.onchange = () => { window.iguais117.set(c.checked); try { $id('plotStatus26').textContent = 'Configuração alterada. Monte novamente as pranchas.'; } catch {} };
  }
  opcao(); setTimeout(opcao, 800);
  try {
    const bp = buildPlot26;
    buildPlot26 = function (...a) {
      const r = bp.apply(this, a);
      try {
        const u = ultimo, s = $id('plotStatus26');
        if (s && u.economia) s.textContent = (s.textContent ? s.textContent.replace(/\s*· Paredes iguais:.*$/, '') + ' · ' : '') + 'Paredes iguais: ' + u.grupos.length + ' grupo(s), ' + u.economia + ' quadro(s) a menos (' + u.grupos.map(g => 'P' + g.join('=P')).join('; ') + ').';
      } catch {}
      return r;
    };
  } catch (e) { console.error('V117 resumo', e); }
  const css = document.createElement('style');
  css.textContent = 'label.iguais117{display:flex;align-items:center;gap:6px;font-weight:600}label.iguais117 input{width:auto;margin:0}';
  document.head.append(css);
})();
