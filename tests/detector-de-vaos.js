// Usado pelos testes (tests/teste-encaixe.js); roda dentro da página do programa.
// Detector de vãos reais: espaços entre peças de uma fiada que não são abertura e
// não são ocupados por bloco de outra parede na mesma fiada.
window.detectarVaos = function () {
  const W = state.walls, R = state.results || [], out = [];
  const geo = W.map(w => { const a = w.line[0], b = w.line[1], L = Math.hypot(b.x - a.x, b.y - a.y), s = (+w.length || L) / L;
    return { ax: a.x * s, ay: a.y * s, ux: (b.x - a.x) / L, uy: (b.y - a.y) / L, t: +w.width || 14 }; });
  const ocupado = (px, py, fiada, menos) => R.some((m, j) => { if (j === menos) return false; const g = geo[j], r = m?.rows?.[fiada]; if (!r) return false;
    const lx = (px - g.ax) * g.ux + (py - g.ay) * g.uy, ly = -(px - g.ax) * g.uy + (py - g.ay) * g.ux;
    if (Math.abs(ly) > g.t / 2 + 0.5) return false;
    return (r.pieces || []).some(p => lx >= p.x - 0.5 && lx <= p.x + p.length + 0.5); });
  R.forEach((m, wi) => { const w = W[wi], g = geo[wi]; (m?.rows || []).forEach((r, fi) => {
    const P = (r.pieces || []).slice().sort((a, b) => a.x - b.x);
    const y0 = P[0]?.y ?? fi * 20, h = P[0]?.height ?? 19;
    const pts = []; for (let k = 1; k < P.length; k++) { const a = P[k - 1], c = P[k], fim = a.x + a.length + (a.fill ? 0 : (+a.joint || 0)); if (c.x - fim > 0.6) pts.push([fim, c.x]); }
    // pontas da parede: do início (0) à primeira peça e da última ao fim
    if (P.length) { if (P[0].x > 0.6) pts.push([0, P[0].x]); const u = P.at(-1), fim = u.x + u.length; if (w.length - fim > 0.6) pts.push([fim, +w.length]); }
    for (const [a, b] of pts) {
      const ab = (w.openings || []).some(o => a >= o.start - 1 && b <= o.start + o.width + 1 && y0 + h > o.bottom && y0 < o.bottom + o.height);
      if (ab) continue;
      // amostra o vão a cada 1 cm: o que não for ocupado por outra parede é vão real
      let livre = 0; for (let x = a + 0.5; x < b; x += 1) { const px = g.ax + g.ux * x, py = g.ay + g.uy * x; if (!ocupado(px, py, fi, wi)) livre++; }
      if (livre >= 2) out.push({ parede: wi + 1, fiada: fi + 1, de: +a.toFixed(1), ate: +b.toFixed(1), livre });
    }
  }); });
  return out;
};
