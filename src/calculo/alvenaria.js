// Cálculos de alvenaria estrutural — funções puras, sem tela, testáveis à parte
// (tests/calculo.test.js). Usadas pelo programa no navegador como window.calcAlv
// e pelo Node.js como módulo.
//
// Compressão simples — ABNT NBR 16868-1:
//   Nd ≤ fd · A · R      fd = fk / γm      R = 1 − (λ / 40)³      λ = hef / tef
//   fk = k · fpk         fpk = η · fbk
// Por metro de parede (A = t · 1 m), o fbk necessário fica:
//   σd = Nd / t      fbk = γm · σd / (R · k · η)
(function (root) {
  'use strict';

  // Fator redutor da resistência pela esbeltez: R = 1 − (λ/40)³.
  // Limitado a 0,05 para não dividir por zero em paredes muito esbeltas
  // (o programa já avisa quando λ > 24).
  function fatorEsbeltez(lambda) {
    return Math.max(0.05, 1 - Math.pow(lambda / 40, 3));
  }

  // Carga de cálculo por metro: Nd = γg · Gk + γq · Qk  (kN/m)
  function cargaDeCalculo(gk, qk, gG, gQ) {
    return gG * gk + gQ * qk;
  }

  // fbk necessário para a parede resistir a Nd (kN/m).
  //   t: espessura (cm)   H: altura efetiva (cm)
  //   p: { gm: γm, kf: fk/fpk, eta: fpk/fbk }
  // Devolve todos os passos, para a tela e o memorial de cálculo.
  function compressaoSimples(nd, t, H, p) {
    const lambda = H / t;
    const R = fatorEsbeltez(lambda);
    const sigma = nd / (t / 100) / 1000; // kN/m ÷ m → kN/m² → MPa
    const fk = p.gm * sigma / R;
    const fpk = fk / p.kf;
    const fbk = fpk / p.eta;
    return { nd, t, H, lambda, R, sigma, fk, fpk, fbk };
  }

  // fgk do graute: o maior entre o mínimo informado e 2,3 · fbk arredondado
  // para cima de 5 em 5 MPa (regra do programa; conferir a referência adotada).
  function fgkDoGraute(fbk, gMin) {
    return Math.max(Number(gMin) || 15, Math.ceil(2.3 * fbk / 5 - 1e-9) * 5);
  }

  // Primeiro valor da lista de fbk comerciais que atende ao necessário.
  function fbkComercial(necessario, lista) {
    const l = lista.map(Number).filter(x => x > 0).sort((a, b) => a - b);
    return l.find(x => x >= necessario - 1e-9) ?? Math.ceil(necessario);
  }

  const api = { fatorEsbeltez, cargaDeCalculo, compressaoSimples, fgkDoGraute, fbkComercial };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.calcAlv = api;
})(this);
