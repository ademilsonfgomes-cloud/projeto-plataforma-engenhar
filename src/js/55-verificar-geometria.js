// V116 — Melhorias do documento "Engenhar 13 melhorias" (bloco 1)
//  12. VERIFICAR GEOMETRIA DO PAVIMENTO antes da modulação: paredes sobrepostas, folgas, desalinhamentos,
//      ângulos quase retos e inclinados, encontros muito próximos, encontro dentro de porta/janela, vigas soltas.
//      Cada problema aparece marcado no desenho, com a distância e a correção recomendada.
//      Crítico (parede sumiria ou não pode ser modulada): bloqueia o Gerar até corrigir. Aviso: deixa gerar.
//  13. Projeto salvo com o nome do cliente (campo Cliente do carimbo; se vazio, o Nome do projeto).
//  02. Renumerar com ícone na barra (paredes, portas/janelas, vigas, reforços e aberturas da laje).
(function () {
  'use strict';
  const N = Number, $id = id => document.getElementById(id);
  const pg = () => N($id('page')?.value) || 1;
  const f1 = v => (Math.round(v * 10) / 10).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  const P = i => 'P' + (i + 1);
  const esc116 = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const passo = () => (N(state.blocks.find(b => b.active !== false && b.type !== 'Canaleta')?.height) || 19) + (N($id('jv')?.value) || 1);

  // ---------------------------------------------------------------- 12. verificação
  function geo(w, i) {
    if (!w?.line || w.line.length !== 2) return null;
    const [a, b] = w.line, len = Math.hypot(b.x - a.x, b.y - a.y);
    if (!(len > 0)) return null;
    const k = N(w.planScale) || len / N(w.length);
    if (!(k > 0)) return null;
    return { w, i, a, b, k, L: len / k, wd: N(w.width) || 14, u: { x: (b.x - a.x) / len, y: (b.y - a.y) / len } };
  }
  // ponto E em relação ao eixo de A: d = distância perpendicular (cm, com sinal), t = posição ao longo de A (cm)
  const rel = (A, E) => { const dx = E.x - A.a.x, dy = E.y - A.a.y; return { d: (dx * -A.u.y + dy * A.u.x) / A.k, t: (dx * A.u.x + dy * A.u.y) / A.k }; };
  const noEixo = (A, t) => ({ x: A.a.x + A.u.x * t * A.k, y: A.a.y + A.u.y * t * A.k });

  function verificar(page = pg()) {
    const out = [], add = (nivel, titulo, correcao, walls, pts, extra = {}) => out.push({ nivel, titulo, correcao, walls, pts, ...extra });
    const todas = state.walls.map((w, i) => ({ w, i })).filter(o => N(o.w.page || 1) === page);
    const st = passo();
    // --- 1. medidas de cada parede e aberturas fora da parede (críticos: o motor não consegue modular)
    for (const { w, i } of todas) {
      const L = N(w.length), H = N(w.height), g = geo(w, i), meio = g ? [noEixo(g, g.L / 2)] : [];
      if (!(L > 0) || !(H > 0)) { add('critico', 'Parede ' + (i + 1) + ' sem comprimento ou altura válidos', 'Informe o comprimento e a altura da parede (ou apague-a se foi criada por engano).', [i], meio); continue; }
      if (Math.floor((H + .01) / st) < 2) add('critico', 'Parede ' + (i + 1) + ': altura de ' + f1(H) + ' cm não fecha duas fiadas', 'A altura mínima é ' + 2 * st + ' cm (duas fiadas de ' + st + ' cm).', [i], meio);
      (w.openings || []).forEach(o => {
        const s = N(o.start), wd = N(o.width), b = N(o.bottom) || 0, h = N(o.height), nome = (o.tag58 || (/porta/i.test(o.type || '') || b === 0 ? 'Porta' : 'Janela'));
        if (!(wd > 0) || !(h > 0) || s < -.01 || s + wd > L + .01 || b + h > H + .01) {
          const p = g ? [noEixo(g, Math.min(Math.max(s + wd / 2, 0), g.L))] : meio;
          add('critico', nome + ' da Parede ' + (i + 1) + ' sai da parede (vão de ' + f1(s) + ' a ' + f1(s + wd) + ' cm; parede com ' + f1(L) + ' × ' + f1(H) + ' cm)', 'Corrija a posição ou a medida da abertura, ou o comprimento da parede.', [i], p);
        }
      });
    }
    const G = todas.map(o => geo(o.w, o.i)).filter(Boolean);
    const par = new Set(), chave = (x, y) => Math.min(x, y) + '|' + Math.max(x, y);
    // --- 2. pares de paredes
    for (const A of G) for (const B of G) {
      if (A === B) continue;
      const c = Math.abs(A.u.x * B.u.x + A.u.y * B.u.y);
      if (c > 0.999) {                                                     // paralelas
        if (A.i > B.i) continue;
        const ra = rel(A, B.a), rb = rel(A, B.b), d = Math.abs((ra.d + rb.d) / 2);
        const t0 = Math.min(ra.t, rb.t), t1 = Math.max(ra.t, rb.t), ov = Math.min(A.L, t1) - Math.max(0, t0);
        const gap = Math.max(0, t0 - A.L, 0 - t1), lim = (A.wd + B.wd) / 2 - 0.5;
        if (d < lim && ov > 2) {
          const m = noEixo(A, (Math.max(0, t0) + Math.min(A.L, t1)) / 2);
          add('critico', 'Paredes ' + (A.i + 1) + ' e ' + (B.i + 1) + ' sobrepostas: uma em cima da outra em ' + f1(ov) + ' cm (eixos a ' + f1(d) + ' cm)', 'Parece a mesma parede lançada duas vezes. Apague a duplicada ou encurte uma delas até a face da outra. Sem isso os blocos saem em dobro.', [A.i, B.i], [m], { dist: ov });
        } else if (d <= 0.3 && gap > 0.05 && gap <= 20 && Math.abs(A.wd - B.wd) < .5) {
          const m = noEixo(A, t0 > A.L ? (A.L + t0) / 2 : t1 / 2);
          add('aviso', 'Paredes ' + (A.i + 1) + ' e ' + (B.i + 1) + ' alinhadas, separadas por ' + f1(gap) + ' cm', 'Se são a mesma parede, use Unir (ou Estender) para ligar as duas.', [A.i, B.i], [m], { dist: gap });
        } else if (d > 0.3 && d < lim && ov <= 2 && gap <= Math.max(A.wd, B.wd)) {
          const m = noEixo(A, t0 >= A.L - 2 ? A.L : 0);
          add('aviso', 'Paredes ' + (A.i + 1) + ' e ' + (B.i + 1) + ' em sequência com eixos desalinhados ' + f1(d) + ' cm', 'Use "Mover p/ eixo" para alinhar, ou confira se o desalinhamento é intencional.', [A.i, B.i], [m], { dist: d });
        }
        continue;
      }
      for (const ponta of [0, 1]) {                                         // ponta de B junto de A
        const E = ponta ? B.b : B.a, outra = ponta ? B.a : B.b, r = rel(A, E), ro = rel(A, outra), tol = A.wd / 2 + 3;
        if (r.t < -tol || r.t > A.L + tol) continue;
        if (Math.abs(ro.d) < Math.abs(r.d)) continue;                      // a ponta não está voltada para A
        if ((B.w.indirect84 || []).some(x => N(x.end) === ponta) || (B.w.extended86 || []).some(x => N(x.end) === ponta)) continue;
        if (Math.abs(r.d) <= tol) {
          if (c <= 0.005) {                                                 // encontro reto: o programa reconhece
            const g = Math.abs(r.d) - A.wd / 2;                             // ponta além da face (até 3 cm): o Gerar encaixa sozinho
            if (g > 0.05) add('aviso', 'Parede ' + (B.i + 1) + ' termina a ' + f1(g) + ' cm da face da Parede ' + (A.i + 1) + ' — será encaixada no eixo ao gerar', 'Folga tão pequena costuma ser erro de desenho, e o programa fecha sozinho. Se a folga é do projeto, marque "É intencional" e ela fica como está.', [A.i, B.i], [E], { dist: g, snap: { uid: B.w.uid, ponta } });
            continue;
          }
          const k2 = chave(A.i, B.i); if (par.has(k2)) continue; par.add(k2);
          const ang = Math.acos(Math.min(1, c)) * 180 / Math.PI;
          if (ang >= 80) add('aviso', 'Parede ' + (B.i + 1) + ' encontra a Parede ' + (A.i + 1) + ' a ' + f1(ang) + '° (quase reto)', 'O programa só amarra encontros a 90°. Acerte o ângulo (mova a ponta ' + f1(Math.abs(Math.tan((90 - ang) * Math.PI / 180)) * B.L) + ' cm aprox.) para o encontro ser amarrado; senão ele sai pendente.', [A.i, B.i], [E], { dist: 90 - ang });
          else add('aviso', 'Canto inclinado a ' + f1(ang) + '° entre as Paredes ' + (B.i + 1) + ' e ' + (A.i + 1), 'Sem amarração direta: detalhe com amarração indireta (grampo ou tela a cada 2 fiadas) e acerte o canto no editor de elevação.', [A.i, B.i], [E]);
        } else if (c <= 0.005 && Math.abs(r.d) <= tol + 15) {
          const g = Math.abs(r.d) - A.wd / 2;
          add('aviso', 'Parede ' + (B.i + 1) + ' termina a ' + f1(g) + ' cm da face da Parede ' + (A.i + 1), 'Se deveria encostar, use Estender até a Parede ' + (A.i + 1) + '. Folga pequena entre paredes não existe na obra.', [A.i, B.i], [E, noEixo(A, Math.min(Math.max(r.t, 0), A.L))], { dist: g });
        }
      }
    }
    // --- 3. encontros muito próximos, ponta solta curta e encontro dentro de porta/janela
    let qs = [];
    try { qs = window.JunctionEngine.detect(state.walls).filter(q => N(q.a.w.page || 1) === page); } catch {}
    const porParede = new Map();
    for (const q of qs) for (const [me, ot, t, e] of [[q.a, q.b, q.ta, q.ae], [q.b, q.a, q.tb, q.be]]) {
      if (!porParede.has(me.i)) porParede.set(me.i, []);
      porParede.get(me.i).push({ t: N(t), o: ot.i, ponta: e, tipo: q.type });
      const folga = N(ot.w.width) / 2;
      for (const o of me.w.openings || []) {
        const a = N(o.start), b = a + N(o.width);
        if (t + folga > a + 0.5 && t - folga < b - 0.5) {
          const g = geo(me.w, me.i);
          add('aviso', 'Parede ' + (ot.i + 1) + ' chega ' + (/porta/i.test(o.type || '') || N(o.bottom) === 0 ? 'na porta ' : 'na janela ') + (o.tag58 || '') + ' da Parede ' + (me.i + 1) + ' (encontro a ' + Math.round(t) + ' cm; vão de ' + f1(a) + ' a ' + f1(b) + ' cm)', 'Mova a abertura ou a parede: não existe encontro dentro de um vão.', [me.i, ot.i], g ? [noEixo(g, t)] : []);
        }
      }
    }
    for (const [i, js] of porParede) {
      const A = geo(state.walls[i], i); if (!A) continue;
      js.sort((x, y) => x.t - y.t);
      for (let k = 1; k < js.length; k++) {
        const dt = js[k].t - js[k - 1].t;
        if (dt > 0.5 && dt < 30) add('aviso', 'Encontros a ' + f1(dt) + ' cm um do outro na Parede ' + (i + 1) + ' (com as Paredes ' + (js[k - 1].o + 1) + ' e ' + (js[k].o + 1) + ')', 'Pode não caber a amarração dos dois encontros. Confira as posições; se forem assim mesmo, use amarração indireta em um deles.', [i, js[k - 1].o, js[k].o], [noEixo(A, (js[k].t + js[k - 1].t) / 2)], { dist: dt });
      }
      const ini = js[0], fim = js[js.length - 1];
      for (const [j, tail, ponta] of [[ini, ini.t, 0], [fim, A.L - fim.t, 1]]) {
        if (j.ponta >= 0 || tail <= 2 || tail >= 45) continue;              // a parede termina no encontro, ou o trecho é longo
        if (js.some(x => Math.abs(x.t - (ponta ? A.L : 0)) < 2)) continue;
        add('aviso', 'Parede ' + (i + 1) + ' passa ' + f1(tail) + ' cm além do encontro com a Parede ' + (j.o + 1), 'Trecho curto: pode dificultar a amarração. Confira se a parede deveria terminar no encontro (use Aparar) ou se o trecho existe mesmo.', [i, j.o], [noEixo(A, ponta ? A.L : 0)], { dist: tail });
      }
    }
    // --- 4. vigas: soltas perto de parede ou de outra viga
    try {
      const k = G[0]?.k || (typeof pxCm !== 'undefined' && pxCm) || 1;
      const vigas = (window.loads77?.S?.().items || []).filter(it => it.kind === 'beam' && it.sub === 'viga' && N(it.page || 1) === page);
      // pontas EFETIVAS (as do cálculo): a viga que chega na parede já apoia sozinha até a face de fora (V99)
      const efetivas = v => { try { if (window.beamEnds97 && window.toPage74) return window.beamEnds97(v).map(Q => window.toPage74(page, Q)); } catch {} return v.pts || []; };
      const pontas = vigas.flatMap(v => { const p = efetivas(v); return p.length >= 2 ? [{ v, E: p[0] }, { v, E: p[p.length - 1] }] : []; });
      for (const v of vigas) {
        const p = v.pts || [], len = p.length >= 2 ? p.slice(1).reduce((s, q, z) => s + Math.hypot(q.x - p[z].x, q.y - p[z].y), 0) / k : 0;
        if (len < 1) add('critico', 'Viga ' + (v.name || '') + ' sem comprimento', 'Apague a viga ou desenhe de novo.', [], p.slice(0, 1));
      }
      for (const { v, E } of pontas) {
        for (const A of G) {
          const r = rel(A, E), g = Math.abs(r.d) - A.wd / 2;
          if (r.t >= -A.wd && r.t <= A.L + A.wd && g > 0.5 && g <= 15) add('aviso', 'Viga ' + (v.name || '') + ' termina a ' + f1(g) + ' cm da face da Parede ' + (A.i + 1), 'Longe demais para apoiar sozinha: estique a ponta da viga até a parede (selecione a viga e arraste o quadradinho da ponta) ou confira se a folga é intencional.', [A.i], [E], { dist: g });
        }
        for (const o of pontas) {
          if (o.v === v || String(o.v.name) < String(v.name)) continue;
          const g = Math.hypot(o.E.x - E.x, o.E.y - E.y) / k;
          if (g > 0.5 && g <= 15) add('aviso', 'Vigas ' + (v.name || '') + ' e ' + (o.v.name || '') + ' separadas por ' + f1(g) + ' cm', 'Use Unir ou estique uma delas até a outra.', [], [E, o.E], { dist: g });
        }
      }
    } catch (e) { console.error('V116 vigas', e); }
    out.sort((x, y) => (x.nivel === 'critico' ? 0 : 1) - (y.nivel === 'critico' ? 0 : 1));
    // aviso marcado como intencional (fica gravado na parede; volta se a medida mudar)
    for (const it of out) { it.key = chaveDe(it); it.ok = it.nivel !== 'critico' && it.walls.some(i => (state.walls[i]?.geoOk116 || []).includes(it.key)); }
    return out;
  }

  // chave do aviso: tipo (texto sem os números) + paredes (pelo identificador, não pelo número) + medida arredondada
  function chaveDe(it) { return it.titulo.replace(/\d+([.,]\d+)?/g, '#') + '|' + it.walls.map(i => state.walls[i]?.uid || '?').sort().join(',') + '|' + Math.round(N(it.dist) || 0); }
  function intencional(it, sim) {
    for (const i of it.walls) { const w = state.walls[i]; if (!w) continue; const l = (w.geoOk116 || []).filter(k => k !== it.key); if (sim) l.push(it.key); if (l.length) w.geoOk116 = l; else delete w.geoOk116; }
    if (it.snap) { const w = state.walls.find(x => x.uid === it.snap.uid); if (w) { const l = (w.noSnap116 || []).filter(p => p !== it.snap.ponta); if (sim) l.push(it.snap.ponta); if (l.length) w.noSnap116 = l; else delete w.noSnap116; } }
    it.ok = !!sim; try { window.dispatchEvent(new Event('geo116')); } catch {}
  }
  const ativos = () => (lista || []).filter(x => !x.ok);
  // a marcação não é mudança da parede: não pode invalidar a modulação já feita
  try { const ss = sourceSignature; sourceSignature = function (w) { if (!w || !w.geoOk116) return ss(w); const { geoOk116, ...rest } = w; return ss(rest); }; } catch (e) { console.error('V116 assinatura', e); }

  // ---------------------------------------------------------------- painel e marcas no desenho
  let lista = null, ativo = -1;
  const painel = document.createElement('div'); painel.id = 'geo116'; painel.className = 'noPrint'; painel.hidden = true; document.body.append(painel);
  const cv = $id('plan'), wrap = $id('planWrap');
  const NS = 'http://www.w3.org/2000/svg', sv = document.createElementNS(NS, 'svg'); sv.id = 'geoSv116'; sv.setAttribute('aria-hidden', 'true');
  if (wrap) wrap.append(sv);
  const escala = () => { const r = cv?.getBoundingClientRect(); return r?.width && cv.width ? r.width / cv.width : 1; };
  function marcas() {
    if (!cv || !lista || painel.hidden || typeof image === 'undefined' || !image) { sv.innerHTML = ''; sv.style.display = 'none'; return; }
    sv.style.display = ''; sv.style.left = cv.offsetLeft + 'px'; sv.style.top = cv.offsetTop + 'px'; sv.style.width = cv.style.width || cv.getBoundingClientRect().width + 'px'; sv.style.height = cv.style.height || cv.getBoundingClientRect().height + 'px';
    sv.setAttribute('viewBox', '0 0 ' + cv.width + ' ' + cv.height);
    const O = cv.planOrigin25 || { x: 0, y: 0 }, sc = escala(), X = q => (q.x - O.x).toFixed(1), Y = q => (q.y - O.y).toFixed(1);
    let h = '';
    lista.forEach((it, n) => {
      if (it.ok) return;
      const cor = it.nivel === 'critico' ? '#e0261b' : '#f29900', on = n === ativo, sw = (on ? 9 : 5) / sc;
      for (const i of it.walls) { const w = state.walls[i]; if (!w?.line || N(w.page || 1) !== pg()) continue; h += `<line x1="${X(w.line[0])}" y1="${Y(w.line[0])}" x2="${X(w.line[1])}" y2="${Y(w.line[1])}" stroke="${cor}" stroke-opacity="${on ? .55 : .3}" stroke-width="${sw}" stroke-linecap="round"/>`; }
      it.pts.forEach((p, z) => {
        h += `<circle cx="${X(p)}" cy="${Y(p)}" r="${(on ? 16 : 11) / sc}" fill="${cor}" fill-opacity=".14" stroke="${cor}" stroke-width="${(on ? 3 : 2) / sc}"/>`;
        if (!z) h += `<text x="${(p.x - O.x + 14 / sc).toFixed(1)}" y="${(p.y - O.y - 12 / sc).toFixed(1)}" font-size="${(on ? 14 : 11) / sc}" font-family="Segoe UI,Arial" font-weight="700" fill="${cor}" stroke="#fff" stroke-width="${3 / sc}" paint-order="stroke">${n + 1}${it.dist != null && it.dist > 0 ? ' · ' + f1(it.dist) + (it.titulo.includes('°') && it.titulo.includes('quase') ? '°' : ' cm') : ''}</text>`;
      });
    });
    sv.innerHTML = h;
  }
  try { const dp = drawPlan; drawPlan = function (...a) { const r = dp.apply(this, a); try { marcas(); } catch (e) { console.error('V116 marcas', e); } return r; }; } catch {}
  function centrar(p) {
    if (!cv || !wrap || !p) return;
    const O = cv.planOrigin25 || { x: 0, y: 0 }, sc = escala();
    wrap.scrollTo({ left: cv.offsetLeft + (p.x - O.x) * sc - wrap.clientWidth / 2, top: cv.offsetTop + (p.y - O.y) * sc - wrap.clientHeight / 2, behavior: 'smooth' });
  }
  function botao() {
    const crit = lista?.some(x => x.nivel === 'critico');
    document.querySelectorAll('.geo109').forEach(b => { b.classList.toggle('crit116', !!crit); b.classList.toggle('ok116', !!lista && !ativos().length); });
  }
  function mostrar() {
    const crit = lista.filter(x => x.nivel === 'critico').length, ig = lista.filter(x => x.ok).length, av = lista.length - crit - ig;
    const item = (x, n) => `<li class="${x.nivel}${n === ativo ? ' on' : ''}" data-n="${n}"><div class="t116"><i>${n + 1}</i>${x.nivel === 'critico' ? '⛔' : '⚠'} ${esc116(x.titulo)}</div><div class="c116">${esc116(x.correcao)}</div>${x.nivel === 'critico' || !x.walls.length ? '' : '<button type="button" class="ok116b" data-ok="' + n + '" title="O projeto é assim mesmo: não avisar mais (volta se a medida mudar)">✔ É intencional</button>'}</li>`;
    painel.innerHTML = `<div class="h116"><b>Verificar geometria</b><span>Pavimento / planta ${pg()}</span><button type="button" class="x116" title="Fechar">✕</button></div>
      <div class="r116 ${crit ? 'c' : av ? 'a' : 'o'}">${crit ? '⛔ ' + crit + ' problema(s) crítico(s): a geração fica bloqueada até corrigir.' : ''}${crit && av ? '<br>' : ''}${av ? '⚠ ' + av + ' aviso(s): pode gerar, mas confira.' : ''}${!crit && !av ? '✔ Nenhum problema de geometria encontrado.' : ''}</div>
      <ol class="l116">${lista.map((x, n) => x.ok ? '' : item(x, n)).join('')}${ig ? `<li class="ig116"><details><summary>✔ ${ig} aviso(s) marcado(s) como intencional</summary>${lista.map((x, n) => x.ok ? `<div class="i116"><span>${esc116(x.titulo)}</span><button type="button" data-des="${n}" title="Voltar a avisar">desfazer</button></div>` : '').join('')}</details></li>` : ''}</ol>
      <div class="b116"><button type="button" id="geoDe116" class="secondary">↻ Verificar de novo</button><button type="button" id="geoGo116" ${crit ? 'disabled title="Corrija os problemas críticos e verifique de novo"' : ''}>▶ Gerar modulação</button></div>`;
    painel.querySelector('.x116').onclick = fechar;
    painel.querySelector('#geoDe116').onclick = () => abrir();
    painel.querySelector('#geoGo116').onclick = () => { fechar(); $id('generate')?.click(); };
    painel.querySelectorAll('[data-ok]').forEach(bt => bt.onclick = ev => { ev.stopPropagation(); intencional(lista[N(bt.dataset.ok)], true); ativo = -1; mostrar(); });
    painel.querySelectorAll('[data-des]').forEach(bt => bt.onclick = ev => { ev.stopPropagation(); intencional(lista[N(bt.dataset.des)], false); mostrar(); });
    painel.querySelectorAll('li[data-n]').forEach(li => li.onclick = () => { ativo = N(li.dataset.n); painel.querySelectorAll('li').forEach(x => x.classList.toggle('on', x === li)); marcas(); centrar(lista[ativo].pts[0]); });
    painel.hidden = false; botao(); marcas();
  }
  function abrir(page) {
    try { window.ui85?.view?.('plan'); } catch {}
    lista = verificar(page); ativo = -1; mostrar(); return lista;
  }
  function fechar() { painel.hidden = true; marcas(); }
  window.geo116 = { verificar, abrir, fechar, lista: () => lista };

  // bloqueio no Gerar: só os críticos. (Os ciclos internos de geração usam __noCheck71 e passam direto.)
  document.addEventListener('click', e => {
    const g = e.target?.closest?.('#generate'); if (!g) return;
    if (/Cancelar/i.test(g.textContent) || window.__noCheck71 || window.__geo116off) return;
    let r = [];
    try { r = verificar(); } catch (er) { console.error('V116 verificar', er); return; }
    lista = r; botao();
    if (r.some(x => x.nivel === 'critico')) {
      e.stopImmediatePropagation(); e.preventDefault(); ativo = -1; mostrar();
      const n = r.filter(x => x.nivel === 'critico').length;
      setTimeout(() => { try { msg('⛔ Geração bloqueada: ' + n + ' problema(s) crítico(s) de geometria. Corrija e clique em "Verificar de novo".'); } catch {} }, 30);
    } else if (r.some(x => !x.ok)) {
      setTimeout(() => { try { const s = $id('planStatus'); if (s && !/aviso\(s\) de geometria/.test(s.textContent)) s.textContent += ' · ⚠ ' + r.filter(x => !x.ok).length + ' aviso(s) de geometria — veja em "Verificar geometria".'; } catch {} }, 400);
    }
  }, true);

  // ---------------------------------------------------------------- 13. nome do arquivo = nome do cliente
  function nomeArquivo(t) {
    return String(t || '').normalize('NFC').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/[. ]+$/, '').slice(0, 120);
  }
  try {
    const dl = download;
    download = function (name, ...rest) {
      if (/^Projeto_Modulacao_Alvenaria_V\d+\.json$/i.test(String(name))) { let cli = $id('st106cli')?.value; try { cli = cli || window.st106?.()?.cliente; } catch {} const n = nomeArquivo(cli) || nomeArquivo($id('project')?.value); if (n) name = n + '.json'; }
      return dl.call(this, name, ...rest);
    };
    window.nomeArquivo116 = nomeArquivo;
  } catch (e) { console.error('V116 nome do arquivo', e); }

  // ---------------------------------------------------------------- 02. Renumerar pela barra
  // Defeito corrigido: a ordem das paredes do nível é guardada em seq58 (V68). Renumerar reordenava a lista, mas a
  // troca/atualização do nível reordenava de novo pela sequência antiga e a numeração voltava. Agora a sequência acompanha.
  // Paredes na mesma linha (diferença de até 3 cm no eixo) seguem da esquerda para a direita / de cima para baixo.
  try {
    const ordOrig = SnapEngine.order;
    SnapEngine.order = function (walls) {
      const placed = w => Array.isArray(w.line) && w.line.length === 2 && w.line.every(p => Number.isFinite(p.x) && Number.isFinite(p.y));
      const key = w => { const [a, b] = w.line, hz = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y), k = N(w.planScale) || 1; return { g: hz ? 0 : 1, p: hz ? (a.y + b.y) / 2 : (a.x + b.x) / 2, s: hz ? Math.min(a.x, b.x) : Math.min(a.y, b.y), tol: 3 * k }; };
      try {
        // V133 — faixas de 30 cm: paredes lado a lado com eixo alguns cm desencontrado ficam na mesma "linha" e seguem
        // da esquerda para a direita (antes a tolerância era 3 cm e paredes de outra unidade entravam no meio).
        const it = walls.map((w, i) => ({ w, i, k: placed(w) ? key(w) : null }));
        const sem = it.filter(x => !x.k), com = it.filter(x => x.k), out = [];
        const grupos = new Map();
        for (const x of com) { const g = (N(x.w.page) || 1) + '|' + x.k.g; if (!grupos.has(g)) grupos.set(g, []); grupos.get(g).push(x); }
        const chaves = [...grupos.keys()].sort((A, B) => { const [pa, ga] = A.split('|').map(Number), [pb, gb] = B.split('|').map(Number); return pa - pb || ga - gb; });
        for (const g of chaves) {
          const l = grupos.get(g).sort((A, B) => A.k.p - B.k.p || A.k.s - B.k.s || A.i - B.i);
          let faixa = [], ini = null;
          const fecha = () => { faixa.sort((A, B) => A.k.s - B.k.s || A.k.p - B.k.p || A.i - B.i); out.push(...faixa); faixa = []; };
          for (const x of l) { const tol = 30 * (N(x.w.planScale) || 1); if (ini !== null && x.k.p - ini > tol) fecha(); if (!faixa.length) ini = x.k.p; faixa.push(x); }
          fecha();
        }
        return [...out, ...sem].map(x => x.w);
      } catch (e) { console.error('V116 ordem', e); return ordOrig.call(this, walls); }
    };
  } catch (e) { console.error('V116 ordem', e); }
  try {
    const nb = $id('numberWalls'), velho = nb?.onclick;
    if (nb && velho) nb.onclick = function (...a) {
      try {
        const ord = SnapEngine.order(state.walls), seqs = state.walls.map(w => N(w.seq58)).filter(Number.isFinite).sort((x, y) => x - y);
        let mx = Math.max(0, ...seqs);
        ord.forEach((w, k) => { w.seq58 = k < seqs.length ? seqs[k] : ++mx; });
      } catch (e) { console.error('V116 renumerar', e); }
      return velho.apply(this, a);
    };
  } catch (e) { console.error('V116 renumerar', e); }
  let ultimo = { x: 120, y: 90 };
  document.addEventListener('pointerdown', e => { ultimo = { x: e.clientX, y: e.clientY }; }, true);
  window.renum116 = () => {
    const b = $id('renum101'); if (!b) return;
    b.click();
    const pop = $id('rn101'); if (!pop || pop.hidden) return;
    pop.style.left = Math.max(8, Math.min(innerWidth - 340, ultimo.x + 14)) + 'px';
    pop.style.top = Math.max(8, Math.min(innerHeight - 320, ultimo.y - 10)) + 'px';
  };

  const css = document.createElement('style');
  css.textContent = `
#geo116{position:fixed;right:10px;top:96px;width:370px;max-height:calc(100vh - 140px);z-index:90;display:flex;flex-direction:column;background:#fff;color:#1b2b3a;border:1px solid #b9c6d3;border-radius:8px;box-shadow:0 12px 30px #0005;font:12.5px "Segoe UI",Arial,sans-serif}
#geo116[hidden]{display:none}
#geo116 .h116{display:flex;align-items:center;gap:8px;padding:8px 10px;background:linear-gradient(180deg,#e8f2fb,#dceaf7);border-bottom:1px solid #b9d0e6;border-radius:8px 8px 0 0}
#geo116 .h116 span{color:#5a6f83;font-size:11.5px}#geo116 .x116{margin-left:auto;background:none;border:0;cursor:pointer;font-size:14px;color:#334;box-shadow:none;padding:2px 6px}
#geo116 .r116{padding:8px 10px;font-weight:600;border-bottom:1px solid #e3e9ef}#geo116 .r116.c{background:#fdecea;color:#a01d1d}#geo116 .r116.a{background:#fff6e0;color:#7a5200}#geo116 .r116.o{background:#e8f6ec;color:#1d6b34}
#geo116 .l116{list-style:none;margin:0;padding:4px;overflow:auto;flex:1}
#geo116 .l116 li{padding:7px 8px;border-radius:6px;cursor:pointer;border:1px solid transparent;margin-bottom:2px}
#geo116 .l116 li:hover{background:#f1f6fb}#geo116 .l116 li.on{border-color:#6f9fcb;background:#e8f0f9}
#geo116 .t116{font-weight:600;line-height:1.3}#geo116 .t116 i{display:inline-block;min-width:18px;height:18px;border-radius:9px;margin-right:5px;text-align:center;font:700 11px/18px Arial;color:#fff;background:#f29900}
#geo116 li.critico .t116 i{background:#e0261b}#geo116 .c116{color:#4a5d70;margin:3px 0 0 23px;line-height:1.35}
#geo116 .b116{display:flex;gap:6px;justify-content:flex-end;padding:8px 10px;border-top:1px solid #e3e9ef}#geo116 .b116 button{margin:0}
#geo116 .ok116b{margin:5px 0 0 23px;padding:2px 8px;height:auto;font-size:11.5px;background:#fff;color:#1d6b34;border:1px solid #9bcfa9;border-radius:4px;cursor:pointer;box-shadow:none}#geo116 .ok116b:hover{background:#e8f6ec}
#geo116 .ig116{cursor:default;color:#4a5d70}#geo116 .ig116 summary{cursor:pointer;font-weight:600;color:#1d6b34}#geo116 .i116{display:flex;gap:6px;align-items:center;margin:4px 0 0 14px;font-size:11.5px}#geo116 .i116 span{flex:1}#geo116 .i116 button{padding:1px 7px;height:auto;font-size:11px;margin:0;background:#fff;color:#334;border:1px solid #c6d3df;box-shadow:none;cursor:pointer}
#geo116 .b116 button[disabled]{opacity:.45;cursor:not-allowed}
#geoSv116{position:absolute;pointer-events:none;z-index:6;overflow:visible}`;
  document.head.append(css);
})();
