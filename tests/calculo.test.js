// Testes das fórmulas de alvenaria estrutural (src/calculo/alvenaria.js).
// Os valores esperados foram calculados à mão; a conta está nos comentários.
// Uso:  node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/calculo/alvenaria.js');

const perto = (real, esperado, tol = 1e-3) =>
  assert.ok(Math.abs(real - esperado) <= tol, `${real} deveria ser ≈ ${esperado}`);

const NORMA = { gm: 2.0, kf: 0.7, eta: 0.5 };

test('fator de esbeltez R = 1 − (λ/40)³', () => {
  perto(C.fatorEsbeltez(20), 0.875);        // 1 − 0,5³
  perto(C.fatorEsbeltez(24), 0.784);        // 1 − 0,6³ = 1 − 0,216
  perto(C.fatorEsbeltez(0), 1);
  perto(C.fatorEsbeltez(60), 0.05);         // limitado (seria negativo)
});

test('carga de cálculo Nd = γg·Gk + γq·Qk', () => {
  perto(C.cargaDeCalculo(100, 20, 1.4, 1.4), 168);
  perto(C.cargaDeCalculo(100, 20, 1.4, 1.5), 170);
});

test('parede P6 do exemplo didático (14 cm, 280 cm)', () => {
  // Nd = 1,4·16,7384 + 1,4·3,3404 = 28,110 kN/m
  // σd = 28,110 / 0,14 / 1000 = 0,2008 MPa ;  λ = 280/14 = 20 ;  R = 0,875
  // fk = 2,0·0,2008/0,875 = 0,4589 ; fpk = 0,4589/0,7 = 0,6556 ; fbk = 0,6556/0,5 = 1,311
  const nd = C.cargaDeCalculo(16.738368, 3.340351, 1.4, 1.4);
  const r = C.compressaoSimples(nd, 14, 280, NORMA);
  perto(r.nd, 28.110);
  perto(r.lambda, 20);
  perto(r.R, 0.875);
  perto(r.sigma, 0.2008);
  perto(r.fk, 0.4589);
  perto(r.fpk, 0.6556);
  perto(r.fbk, 1.311);
});

test('prédio: parede de 14 cm no térreo com 8 pavimentos acima', () => {
  // Nd = 8 × 28 kN/m = 224 kN/m ; σd = 224/0,14/1000 = 1,600 MPa
  // fbk = 2,0 · 1,600 / (0,875 · 0,7 · 0,5) = 3,2 / 0,30625 = 10,449 MPa
  const r = C.compressaoSimples(224, 14, 280, NORMA);
  perto(r.sigma, 1.6);
  perto(r.fbk, 10.449);
  assert.equal(C.fbkComercial(r.fbk, [4, 6, 8, 10, 12, 14]), 12);
  assert.equal(C.fgkDoGraute(12, 15), 30);  // 2,3·12 = 27,6 → 30
});

test('parede de 19 cm é menos esbelta e precisa de bloco mais fraco', () => {
  // λ = 280/19 = 14,74 ; R = 1 − 0,3684³ = 0,9500
  // σd = 224/0,19/1000 = 1,1789 ; fbk = 2·1,1789/(0,95·0,35) = 7,091
  const r = C.compressaoSimples(224, 19, 280, NORMA);
  perto(r.R, 0.9500);
  perto(r.fbk, 7.091);
});

test('fbk comercial: primeiro da lista que atende', () => {
  const L = [4, 6, 8, 10, 12];
  assert.equal(C.fbkComercial(1.3, L), 4);
  assert.equal(C.fbkComercial(6, L), 6);
  assert.equal(C.fbkComercial(6.01, L), 8);
  assert.equal(C.fbkComercial(13.2, L), 14);  // acima da lista: arredonda para cima
});

test('fgk do graute: mínimo ou 2,3·fbk em múltiplos de 5', () => {
  assert.equal(C.fgkDoGraute(4, 15), 15);     // 9,2 → 10, vale o mínimo 15
  assert.equal(C.fgkDoGraute(8, 15), 20);     // 18,4 → 20
  assert.equal(C.fgkDoGraute(10, 15), 25);    // 23 → 25
  assert.equal(C.fgkDoGraute(4, 0), 15);      // sem mínimo informado: 15
});

test('altura efetiva: hef = 1,2·h aumenta a esbeltez', () => {
  // hef = 336 ; λ = 336/14 = 24 ; R = 0,784 ; σ = 28/0,14/1000 = 0,2
  // fbk = 2·0,2/0,784/0,35 = 1,4577
  const r = C.compressaoSimples(28, 14, 280, { ...NORMA, fh: 1.2 });
  perto(r.hef, 336);
  perto(r.lambda, 24);
  perto(r.fbk, 1.4577);
});

test('espessura efetiva com enrijecedores: tef = δ·t', () => {
  // tef = 1,4·14 = 19,6 ; λ = 280/19,6 = 14,286 ; R = 1 − 0,35714³ = 0,95445
  // σ continua com a espessura real: 0,2 MPa ; fbk = 2·0,2/0,95445/0,35 = 1,1974
  const r = C.compressaoSimples(28, 14, 280, { ...NORMA, delta: 1.4 });
  perto(r.tef, 19.6);
  perto(r.R, 0.95445);
  perto(r.fbk, 1.1974);
});

test('sem as opções novas o resultado não muda', () => {
  const a = C.compressaoSimples(28, 14, 280, NORMA);
  const b = C.compressaoSimples(28, 14, 280, { ...NORMA, fh: 1, delta: 1 });
  assert.equal(a.fbk, b.fbk);
});

test('flexo-compressão: laje com e = t/6', () => {
  // e = 0,14/6 = 0,02333 m ; Md = 28·0,02333 = 0,6533 kN·m/m ; W = 0,14²/6 = 0,0032667 m³
  // σM = 0,6533/0,0032667/1000 = 0,2 MPa (com e = t/6, σM = σN)
  // fk = 2·(0,2/0,875 + 0,2/1,5) = 0,72381 ; fpk = 1,03401 ; fbk = 2,06803
  const r = C.flexoCompressao(28, 28, 14, 280, NORMA, 1 / 6);
  perto(r.e, 2.3333);
  perto(r.md, 0.6533);
  perto(r.sigmaM, 0.2);
  perto(r.fk, 0.72381);
  perto(r.fbk, 2.06803);
  perto(r.fbkCompressao, 1.30612);  // só compressão: 2·0,2/0,875/0,35
});

test('flexo-compressão: só a carga do próprio pavimento é excêntrica', () => {
  // térreo: Nd = 224 (8 pavimentos), excêntrica só a do pavimento: 28
  // σN = 1,6 ; σM = 0,2 ; fk = 2·(1,6/0,875 + 0,2/1,5) = 3,92381 ; fbk = 11,2109
  const r = C.flexoCompressao(224, 28, 14, 280, NORMA, 1 / 6);
  perto(r.fbk, 11.2109);
});
