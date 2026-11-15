// Vergas — funções puras, testáveis à parte (tests/vergas.test.js).
// No navegador: window.calcVergas; no Node.js: módulo.
//
// Critérios (ABNT NBR 16868-1 e prática usual de alvenaria estrutural):
// - vão efetivo l = vão livre + d, sem passar da distância entre os centros dos apoios (vão + apoio);
// - efeito arco: se a parede acima da verga for mais alta que o triângulo de 60° (0,866·l),
//   a verga recebe só o peso da alvenaria do triângulo (carga triangular, M = W·l/6);
//   senão recebe a parede acima + a carga que chega no topo da parede (uniforme, M = q·l²/8);
//   o peso próprio da verga entra sempre como carga uniforme;
// - flexão: compressão na alvenaria em retângulo de altura 0,8·x com fd = fk/γm, x ≤ 0,5·d,
//   z = d − 0,4·x ≤ 0,95·d, As = Md / (fyd · z), As ≥ 0,10 % · b · d;
// - cisalhamento (alvenaria armada): fvk = 0,35 + 17,5·ρ ≤ 0,7 MPa, τd = Vd / (b·d) ≤ fvk/γm.
(function (root) {
  'use strict';

  // v: { vao, apoio, hv, cob, t (cm); acima (cm de parede acima da verga);
  //      gAlv (kN/m³); gTopo, qTopo (kN/m, carga no topo da parede);
  //      fk (MPa), gm, gf, fyd (MPa) }
  function verga(v) {
    const d = (v.hv - v.cob) / 100, b = v.t / 100;
    const l = Math.min(v.vao + v.apoio, v.vao + v.hv - v.cob) / 100;
    const hT = 0.866 * l, acima = Math.max(0, v.acima) / 100;
    const qpp = v.gAlv * b * v.hv / 100;                     // peso próprio da verga (kN/m)
    let caso, Mk, Vk, W = 0, q = 0;
    if (acima >= hT) {
      caso = 'arco';
      W = v.gAlv * b * l * hT / 2;                           // peso do triângulo (kN)
      Mk = W * l / 6 + qpp * l * l / 8;
      Vk = W / 2 + qpp * l / 2;
    } else {
      caso = 'carga total';
      q = v.gAlv * b * acima + qpp + v.gTopo + v.qTopo;      // kN/m
      Mk = q * l * l / 8;
      Vk = q * l / 2;
    }
    const Md = v.gf * Mk, Vd = v.gf * Vk;
    const fd = v.fk / v.gm * 1000;                           // kN/m²
    // Md = fd · b · 0,8x · (d − 0,4x)  →  0,32·fd·b·x² − 0,8·fd·b·d·x + Md = 0
    const A2 = 0.32 * fd * b, A1 = -0.8 * fd * b * d, disc = A1 * A1 - 4 * A2 * Md;
    const x = disc >= 0 ? (-A1 - Math.sqrt(disc)) / (2 * A2) : Infinity;
    const flexOk = x <= 0.5 * d + 1e-12;
    const z = Number.isFinite(x) ? Math.min(d - 0.4 * x, 0.95 * d) : 0;
    const AsCalc = flexOk ? Md / (v.fyd * 1000 * z) * 1e4 : Infinity;   // cm²
    const AsMin = 0.001 * v.t * (v.hv - v.cob);
    const As = Math.max(AsCalc, AsMin);
    const tau = Vd / (b * d) / 1000;
    return { l, d, hT, caso, W, q, qpp, Mk, Vk, Md, Vd, fd: fd / 1000, x, xd: x / d, flexOk, z, AsCalc, AsMin, As, tau };
  }

  // Cisalhamento com a armadura adotada (cm²).
  function cisalhamento(r, AsAdot, t, gm) {
    const rho = AsAdot / (t * r.d * 100);
    const fvk = Math.min(0.7, 0.35 + 17.5 * rho), fvd = fvk / gm;
    return { rho, fvk, fvd, ok: r.tau <= fvd + 1e-12 };
  }

  const api = { verga, cisalhamento };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.calcVergas = api;
})(this);
