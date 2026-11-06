// V109 — ENCAIXE DAS PONTAS antes de gerar a modulação.
// Planta importada costuma ter parede que termina alguns centímetros antes (ou depois) do eixo da
// parede que ela encontra. Quando a ponta fica dentro do corpo da outra parede ou até 3 cm além da
// face, ela é levada exatamente até o eixo da outra — como o encaixe de um programa de CAD.
// Sem isso, o encontro não era reconhecido, os blocos das duas se sobrepunham e a amarração dos
// cantos se perdia (vãos nas fiadas). Ajuste de poucos centímetros, avisado na linha de comando.
(function () {
  'use strict';
  const N = Number;
  function encaixar(walls) {
    const L = walls.map((w, i) => {
      if (!w?.line || w.line.length !== 2) return null;
      const [a, b] = w.line, len = Math.hypot(b.x - a.x, b.y - a.y), k = N(w.planScale) || len / N(w.length);
      if (!(len > 0 && k > 0)) return null;
      return { w, i, k, u: { x: (b.x - a.x) / len, y: (b.y - a.y) / len } };
    });
    const log = [], perto = [];
    for (const B of L) {
      if (!B) continue;
      for (const ponta of [0, 1]) {
        // ponta recuada DE PROPÓSITO (amarração indireta / espessuras diferentes, V84/V86): não mexer
        if ((B.w.indirect84 || []).some(x => N(x.end) === ponta) || (B.w.extended86 || []).some(x => N(x.end) === ponta)) continue;
        let melhor = null;
        for (const A of L) {
          if (!A || A === B || N(A.w.page || 1) !== N(B.w.page || 1)) continue;
          if (Math.abs(A.u.x * B.u.x + A.u.y * B.u.y) > 0.005) continue;       // só encontros em ângulo reto
          if (Math.abs(A.k / B.k - 1) > 0.005) continue;
          const E = B.w.line[ponta], A0 = A.w.line[0];
          // distância da ponta ao eixo de A (cm) e posição ao longo de A (cm)
          const dx = E.x - A0.x, dy = E.y - A0.y;
          const d = (dx * -A.u.y + dy * A.u.x) / A.k, t = (dx * A.u.x + dy * A.u.y) / A.k;
          // dentro do corpo da outra parede ou até 3 cm além da face (não existe folga de 1–3 cm entre paredes)
          const tol = N(A.w.width) / 2 + 3;
          if (Math.abs(d) <= 0.05) continue;                                    // já encaixada
          if (Math.abs(d) > tol) { if (Math.abs(d) <= tol + 15 && t >= -tol && t <= N(A.w.length) + tol) perto.push({ B: B.i, A: A.i, d: Math.abs(d) - N(A.w.width) / 2 }); continue; }  // longe: só avisa
          if (t < -tol || t > N(A.w.length) + tol) continue;                    // fora do comprimento de A
          // a ponta precisa ser mesmo a ponta voltada para A (a parede não atravessa A)
          const outra = B.w.line[1 - ponta], dOutra = ((outra.x - A0.x) * -A.u.y + (outra.y - A0.y) * A.u.x) / A.k;
          if (Math.sign(dOutra) === Math.sign(d) && Math.abs(dOutra) < Math.abs(d)) continue;
          if (Math.sign(dOutra) !== Math.sign(d) && Math.abs(dOutra) <= tol) continue;
          if (!melhor || Math.abs(d) < Math.abs(melhor.d)) melhor = { A, d };
        }
        if (!melhor) continue;
        // move a ponta ao longo da própria parede até o eixo de A
        const { A, d } = melhor, E = B.w.line[ponta];
        const sentido = (B.u.x * -A.u.y + B.u.y * A.u.x);                     // quanto a parede B anda na direção normal de A
        const s = -d / sentido;                                               // cm ao longo de B
        const novo = { x: E.x + B.u.x * s * B.k, y: E.y + B.u.y * s * B.k };
        const antes = N(B.w.length);
        B.w.line = ponta === 0 ? [novo, { ...B.w.line[1] }] : [{ ...B.w.line[0] }, novo];
        const comp = Math.round(Math.hypot(B.w.line[1].x - B.w.line[0].x, B.w.line[1].y - B.w.line[0].y) / B.k * 10) / 10;
        const delta = Math.round((comp - antes) * 10) / 10;
        B.w.length = comp;
        if (ponta === 0 && delta) (B.w.openings || []).forEach(o => { o.start = Math.max(0, Math.round((N(o.start) + delta) * 10) / 10); });
        delete B.w.locked76;
        log.push('Parede ' + (B.i + 1) + ': ponta ' + (delta >= 0 ? 'estendida ' : 'recuada ') + Math.abs(delta).toLocaleString('pt-BR') + ' cm até o eixo da Parede ' + (A.i + 1));
      }
    }
    // pontas que ficaram perto, mas fora do corpo da outra parede (podem ser intencionais): só avisar
    const ja = new Set();
    log.aviso = perto.filter(p => { const k = p.B + '|' + p.A; if (ja.has(k)) return false; ja.add(k); return true; })
      .map(p => 'Parede ' + (p.B + 1) + ' termina a ' + (Math.round(p.d * 10) / 10).toLocaleString('pt-BR') + ' cm da face da Parede ' + (p.A + 1) + ' — confira se deveria encostar');
    // encontro caindo dentro de porta ou janela (erro de projeto): avisar com parede, abertura e posição
    try {
      for (const q of root109().detect(walls)) for (const [me, ot, t] of [[q.a, q.b, q.ta], [q.b, q.a, q.tb]]) {
        const folga = N(ot.w.width) / 2;
        for (const o of me.w.openings || []) {
          const a = N(o.start), b = a + N(o.width);
          if (t + folga > a + 0.5 && t - folga < b - 0.5) log.aviso.push('Parede ' + (ot.i + 1) + ' chega ' + (/porta/i.test(o.type || '') || N(o.bottom) === 0 ? 'na porta ' : 'na janela ') + (o.tag58 || '') + ' da Parede ' + (me.i + 1) + ' (encontro a ' + Math.round(t) + ' cm; vão de ' + a + ' a ' + b + ' cm) — mova a abertura ou a parede');
        }
      }
    } catch (e) { console.error('V109 encontro na abertura', e); }
    return log;
  }
  const root109 = () => window.JunctionEngine;
  window.encaixe109 = encaixar;
  // V116 — o encaixe roda NO CLIQUE em "Gerar", antes de o programa registrar as medidas do cálculo.
  // (Antes rodava durante o cálculo: as medidas mudavam no meio e o resultado era descartado —
  //  "As entradas mudaram durante o cálculo" — e nenhuma parede modulava.)
  function aoGerar() {
    try {
      const log = encaixar(state.walls);
      const agora = Date.now(), ant = state.enc109;
      const junto = ant && agora - (ant.t || 0) < 60000;  // o ciclo de geração pode repetir o clique sozinho
      state.enc109 = { t: agora, ajustes: [...new Set([...(junto ? ant.ajustes : []), ...log])], avisos: [...new Set([...(junto ? ant.avisos : []), ...(log.aviso || [])])] };
      try { window.dispatchEvent(new Event('encaixe109')); } catch {}
      if (log.length) { try { renderWalls(); } catch {} }
      if (log.length || log.aviso?.length) {
        const t = (log.length ? 'Encaixe das pontas antes de gerar: ' + log.join(' · ') + '. ' : '') + (log.aviso?.length ? '⚠ ' + log.aviso.join(' · ') + '.' : '');
        setTimeout(() => { try { if (typeof msg === 'function') msg(t); else { const m = document.getElementById('sMsg85'); if (m) m.textContent = t; } } catch {} }, 50);
      }
    } catch (e) { console.error('V109 encaixe', e); }
  }
  const gb = document.getElementById('generate');
  if (gb) gb.addEventListener('click', () => { if (/Cancelar/i.test(gb.textContent)) return; aoGerar(); }, true);
})();
