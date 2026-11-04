// Ações horizontais e contraventamento — funções puras, testáveis à parte
// (tests/vento.test.js). No navegador: window.calcVento; no Node.js: módulo.
//
// Vento — ABNT NBR 6123 (método estático):
//   Vk = V0 · S1 · S2 · S3      S2 = b · Fr · (z/10)^p      q = 0,613 · Vk²  (N/m²)
//   F = Ca · q · Ae   (força de arrasto no pavimento)
// Desaprumo — ABNT NBR 16868-1:  θa = 1 / (100 · √H)  (H em m), F = θa · peso do pavimento
// Verificações de cada trecho de parede (ABNT NBR 16868-1):
//   cisalhamento   τd = Vd / (t · L) ≤ fvk / γm,   fvk = a + 0,5 · σ ≤ máx  (σ = 0,9 · G / A)
//   tração         σt = Md / W − 0,9 · G / A ≤ ftk / γm
//   flexo-compr.   fk ≥ γm · (Nd / (A · R) + Md / (1,5 · W))  →  fbk = fk / (k · η)
(function (root) {
  'use strict';

  // NBR 6123, Tabela 1 — parâmetros de S2 por categoria de rugosidade e classe da edificação.
  // Fr é sempre o da categoria II.
  const S2_TAB = {
    I:   { b: { A: 1.10, B: 1.11, C: 1.12 }, p: { A: 0.06, B: 0.065, C: 0.07 } },
    II:  { b: { A: 1.00, B: 1.00, C: 1.00 }, p: { A: 0.085, B: 0.09, C: 0.10 } },
    III: { b: { A: 0.94, B: 0.94, C: 0.93 }, p: { A: 0.10, B: 0.105, C: 0.115 } },
    IV:  { b: { A: 0.86, B: 0.85, C: 0.84 }, p: { A: 0.12, B: 0.125, C: 0.135 } },
    V:   { b: { A: 0.74, B: 0.73, C: 0.71 }, p: { A: 0.15, B: 0.16, C: 0.175 } },
  };
  const FR = { A: 1.00, B: 0.98, C: 0.95 };

  // Classe pela maior dimensão da edificação (m): A ≤ 20, B ≤ 50, C > 50.
  function classe(maiorDimensao) {
    return maiorDimensao <= 20 ? 'A' : maiorDimensao <= 50 ? 'B' : 'C';
  }

  function s2(z, cat, cls) {
    const t = S2_TAB[cat]; if (!t) throw new Error('categoria inválida: ' + cat);
    return t.b[cls] * FR[cls] * Math.pow(Math.max(z, 0) / 10, t.p[cls]);
  }

  // Pressão dinâmica (kN/m²) na cota z.
  function pressao(z, v) {
    const Vk = v.V0 * v.S1 * s2(z, v.cat, v.cls) * v.S3;
    return { Vk, q: 0.613 * Vk * Vk / 1000 };
  }

  // Forças de vento por pavimento. andares: [{ zBase, zTopo }] em m, de baixo para cima.
  // A força de cada pavimento atua na cota da laje (zTopo), com área de influência de
  // meia altura abaixo e meia acima.  largura: fachada perpendicular ao vento (m).
  function forcasVento(andares, largura, Ca, v) {
    return andares.map((a, i) => {
      const abaixo = (a.zTopo - a.zBase) / 2;
      const acima = i + 1 < andares.length ? (andares[i + 1].zTopo - andares[i + 1].zBase) / 2 : 0;
      const hTrib = abaixo + acima;
      const { Vk, q } = pressao(a.zTopo, v);
      return { z: a.zTopo, Vk, q, hTrib, area: largura * hTrib, F: Ca * q * largura * hTrib };
    });
  }

  function anguloDesaprumo(alturaTotal) {
    return 1 / (100 * Math.sqrt(alturaTotal));
  }

  // Esforços na base de um pavimento (cota zBase) devidos a forças { z, F } acima dela.
  function esforcosNaBase(forcas, zBase) {
    let V = 0, M = 0;
    for (const f of forcas) if (f.z > zBase + 1e-9) { V += f.F; M += f.F * (f.z - zBase); }
    return { V, M };
  }

  // Rigidez lateral de um trecho de parede em balanço (unidades relativas, E = 1, G = 0,4·E):
  //   1 / k = h³ / (3·E·I) + 1,2·h / (G·A)       L, t, h em m
  function rigidez(L, t, h) {
    const I = t * L * L * L / 12, A = t * L, E = 1, G = 0.4;
    return 1 / (h * h * h / (3 * E * I) + 1.2 * h / (G * A));
  }

  // NBR 16868-1 — resistência ao cisalhamento e à tração na flexão pela argamassa (MPa).
  const ARGAMASSA = {
    '1,5 a 3,4': { a: 0.10, max: 1.0, ftk: 0.10 },
    '3,5 a 7,0': { a: 0.15, max: 1.4, ftk: 0.20 },
    'acima de 7,0': { a: 0.35, max: 1.7, ftk: 0.25 },
  };

  // Verifica um trecho de parede na base de um pavimento.
  //   tr: { L, t (m), NG, NQ (kN, acumulados), Vk (kN), Mk (kN·m), R }
  //   p:  { gG, gQ, gW, psiQ, psiW, gm, gmV, kf, eta, arg }
  function verificarTrecho(tr, p) {
    const A = tr.t * tr.L, W = tr.t * tr.L * tr.L / 6;
    const arg = ARGAMASSA[p.arg] || ARGAMASSA['3,5 a 7,0'];
    // cisalhamento: pré-compressão só com 0,9·G (favorável)
    const sigma09 = 0.9 * tr.NG / A / 1000;
    const fvk = Math.min(arg.max, arg.a + 0.5 * sigma09);
    const Vd = p.gW * tr.Vk;
    const tau = Vd / A / 1000;
    const fvd = fvk / p.gmV;
    // tração na flexão
    const Md = p.gW * tr.Mk;
    const sigt = Md / W / 1000 - sigma09;
    const ftd = arg.ftk / p.gmV;
    // flexo-compressão nas duas combinações (vento principal e sobrecarga principal)
    const comb = [
      { nome: 'vento principal', Nd: p.gG * tr.NG + p.gQ * p.psiQ * tr.NQ, Md: p.gW * tr.Mk },
      { nome: 'sobrecarga principal', Nd: p.gG * tr.NG + p.gQ * tr.NQ, Md: p.gW * p.psiW * tr.Mk },
    ].map(c => {
      const sN = c.Nd / A / 1000, sM = c.Md / W / 1000;
      const fk = p.gm * (sN / tr.R + sM / 1.5);
      return { ...c, sN, sM, fk, fbk: fk / p.kf / p.eta };
    });
    const crit = comb[0].fbk >= comb[1].fbk ? comb[0] : comb[1];
    return {
      A, W, sigma09, fvk, fvd, Vd, tau, usoCis: tau / fvd, cisOk: tau <= fvd + 1e-12,
      Md, sigt, ftd, tracaOk: sigt <= ftd + 1e-12, comb, fbk: crit.fbk, combCrit: crit.nome,
    };
  }

  // Deslocamentos horizontais de uma estrutura em balanço (conjunto das paredes de uma direção),
  // por carga unitária com integração numérica: δk = ∫ M·m/EI ds + ∫ 1,2·V·v/GA ds.
  //   segs:   [{ z0, z1, EI (kN·m²), GA (kN) }] da base ao topo (cotas em m, base = segs[0].z0)
  //   forcas: [{ z, F (kN) }]
  // Devolve o deslocamento (m) na cota de cada força.
  function deslocamentos(segs, forcas) {
    const base = segs[0].z0;
    const M = s => forcas.reduce((a, f) => a + (f.z > s ? f.F * (f.z - s) : 0), 0);
    const V = s => forcas.reduce((a, f) => a + (f.z > s ? f.F : 0), 0);
    return forcas.map(fk => {
      let d = 0;
      for (const g of segs) {
        const n = 60, h = (g.z1 - g.z0) / n;
        for (let k = 0; k < n; k++) {
          const s = g.z0 + (k + 0.5) * h;
          if (s >= fk.z) break;
          d += M(s) * (fk.z - s) / g.EI * h + 1.2 * V(s) / g.GA * h;
        }
      }
      return { z: fk.z, d, rel: fk.z - base };
    });
  }

  // Coeficiente γz (estabilidade global): γz = 1 / (1 − ΔMd / M1d)
  //   M1d = Σ Fd · z (momento de tombamento na base)   ΔMd = Σ Pd · δ (cargas verticais × deslocamentos)
  //   forcasD: [{ z, F }] de cálculo ; pesosD: [kN] de cálculo no mesmo andar ; base: cota da base (m)
  function gamaZ(segs, forcasD, pesosD) {
    const base = segs[0].z0, des = deslocamentos(segs, forcasD);
    const M1 = forcasD.reduce((a, f) => a + f.F * (f.z - base), 0);
    const dM = des.reduce((a, x, i) => a + pesosD[i] * x.d, 0);
    return { M1, dM, gz: dM < M1 ? 1 / (1 - dM / M1) : Infinity, des };
  }

  // Armadura vertical na extremidade tracionada de um trecho (pré-dimensionamento elástico,
  // seção não fissurada): diagrama linear com σt = Md/W − N/A e σc = Md/W + N/A (N = 0,9·G);
  // zona tracionada x = L·σt/(σt + σc), força T = σt·t·x/2, As = T / fyd.
  //   fyd em MPa (CA-50: 500/1,15 = 434,8)
  function armaduraTracao(tr, Md, fyd) {
    const A = tr.t * tr.L, W = tr.t * tr.L * tr.L / 6;
    const sM = Md / W / 1000, sN = 0.9 * tr.NG / A / 1000;
    const st = sM - sN;
    if (st <= 0) return { T: 0, x: 0, As: 0 };
    const x = tr.L * st / (st + sM + sN);
    const T = st * 1000 * tr.t * x / 2;           // kN
    return { st, sc: sM + sN, x, T, As: T / (fyd / 10) };  // cm² (fyd em kN/cm²)
  }

  // Menor combinação de 1 ou 2 barras que atende à área (cm²).
  const BARRAS = [8, 10, 12.5, 16, 20, 25];
  function escolherBarras(As) {
    const op = [];
    for (const d of BARRAS) for (const n of [1, 2]) op.push({ n, d, area: n * Math.PI * d * d / 400 });
    op.sort((a, b) => a.area - b.area || a.n - b.n);
    return op.find(o => o.area >= As - 1e-9) || null;
  }

  const api = { S2_TAB, FR, ARGAMASSA, classe, s2, pressao, forcasVento, anguloDesaprumo, esforcosNaBase, rigidez, verificarTrecho,
    deslocamentos, gamaZ, armaduraTracao, escolherBarras };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.calcVento = api;
})(this);
