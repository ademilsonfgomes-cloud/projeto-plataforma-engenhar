// Testes de vento e contraventamento (src/calculo/vento.js).
// Valores esperados calculados à mão; a conta está nos comentários.
// Uso:  node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const V = require('../src/calculo/vento.js');

const perto = (real, esperado, tol = 1e-3) =>
  assert.ok(Math.abs(real - esperado) <= tol, `${real} deveria ser ≈ ${esperado}`);

const VENTO = { V0: 35, S1: 1, S3: 1, cat: 'IV', cls: 'A' };

test('classe da edificação pela maior dimensão', () => {
  assert.equal(V.classe(15), 'A');
  assert.equal(V.classe(20), 'A');
  assert.equal(V.classe(35), 'B');
  assert.equal(V.classe(60), 'C');
});

test('fator S2 = b · Fr · (z/10)^p', () => {
  perto(V.s2(10, 'IV', 'A'), 0.86);                // 0,86 · 1,00 · 1
  perto(V.s2(20, 'II', 'B'), 1.04308);             // 1,00 · 0,98 · 2^0,09
  perto(V.s2(3, 'IV', 'A'), 0.744309);             // 0,86 · 0,3^0,12
});

test('pressão dinâmica q = 0,613 · Vk²', () => {
  // Vk = 35 · 1 · 0,86 · 1 = 30,1 m/s ; q = 0,613 · 30,1² = 555,38 N/m²
  const r = V.pressao(10, VENTO);
  perto(r.Vk, 30.1);
  perto(r.q, 0.555384, 1e-5);
});

test('forças de vento por pavimento (sobrado de 2 pavimentos, fachada de 10 m)', () => {
  // pav. 1: z = 3 m, faixa 1,5 + 1,5 = 3 m ; q = 0,416009 ; F = 1,3 · 0,416009 · 10 · 3 = 16,224 kN
  // pav. 2: z = 6 m, faixa 1,5 m ;          q = 0,491303 ; F = 1,3 · 0,491303 · 10 · 1,5 = 9,580 kN
  const F = V.forcasVento([{ zBase: 0, zTopo: 3 }, { zBase: 3, zTopo: 6 }], 10, 1.3, VENTO);
  perto(F[0].hTrib, 3);
  perto(F[0].F, 16.2244);
  perto(F[1].hTrib, 1.5);
  perto(F[1].F, 9.5804);
  // na base: V = 25,805 kN ; M = 16,224·3 + 9,580·6 = 106,156 kN·m
  const b = V.esforcosNaBase(F, 0);
  perto(b.V, 25.8048);
  perto(b.M, 106.156, 2e-3);
  // na base do 2º pavimento só entra a força de cima: V = 9,580 ; M = 9,580 · 3
  const b2 = V.esforcosNaBase(F, 3);
  perto(b2.V, 9.5804);
  perto(b2.M, 28.7412);
});

test('desaprumo θa = 1 / (100 · √H)', () => {
  perto(V.anguloDesaprumo(25), 0.002, 1e-9);
  perto(V.anguloDesaprumo(9), 1 / 300, 1e-9);
});

test('rigidez de parede em balanço (flexão + cisalhamento)', () => {
  // L = 4 ; t = 0,14 ; h = 3 ; I = 0,74667 ; A = 0,56
  // h³/(3EI) = 12,0536 ; 1,2h/(GA) = 16,0714 ; k = 1/28,125 = 0,035556
  perto(V.rigidez(4, 0.14, 3), 0.0355556, 1e-6);
  // L = 8: I = 5,97333 ; h³/(3EI) = 1,5067 ; 1,2h/(GA) = 8,0357 ; k = 1/9,5424 = 0,10480
  // (parede baixa e comprida: o cisalhamento domina; o dobro do comprimento dá ≈ 2,95× a rigidez)
  perto(V.rigidez(8, 0.14, 3), 0.104796, 1e-6);
});

test('verificação de um trecho de parede', () => {
  // L = 4 m ; t = 0,14 m ; A = 0,56 m² ; W = 0,37333 m³ ; G = 200 kN ; Q = 40 kN ; Vk = 10 ; Mk = 30
  const r = V.verificarTrecho({ L: 4, t: 0.14, NG: 200, NQ: 40, Vk: 10, Mk: 30, R: 0.875 },
    { gG: 1.4, gQ: 1.4, gW: 1.4, psiQ: 0.5, psiW: 0.6, gm: 2, gmV: 2, kf: 0.7, eta: 0.5, arg: '3,5 a 7,0' });
  // cisalhamento: σ = 0,9·200/0,56 = 0,32143 MPa ; fvk = 0,15 + 0,16071 = 0,31071 ; fvd = 0,15536
  //               τd = 1,4·10/0,56 = 0,025 MPa  → ok
  perto(r.fvk, 0.310714, 1e-5);
  perto(r.tau, 0.025, 1e-6);
  assert.equal(r.cisOk, true);
  // tração: σt = 1,4·30/0,37333 − 0,32143 = 0,1125 − 0,32143 < 0 → ok
  perto(r.sigt, -0.208929, 1e-5);
  assert.equal(r.tracaOk, true);
  // vento principal:      Nd = 280 + 28 = 308 ; fk = 2·(0,55/0,875 + 0,1125/1,5) = 1,40714 ; fbk = 4,0204
  // sobrecarga principal: Nd = 280 + 56 = 336 ; Md = 1,4·0,6·30 = 25,2
  //                       fk = 2·(0,6/0,875 + 0,0675/1,5) = 1,46143 ; fbk = 4,1755
  perto(r.comb[0].fbk, 4.020408, 1e-5);
  perto(r.comb[1].fbk, 4.175510, 1e-5);
  perto(r.fbk, 4.175510, 1e-5);
  assert.equal(r.combCrit, 'sobrecarga principal');
});

test('parede curta e pouco carregada: tração na flexão não passa', () => {
  // L = 1 ; A = 0,14 ; W = 0,023333 ; G = 10 kN ; Mk = 10
  // σt = 1,4·10/0,023333/1000 − 0,9·10/0,14/1000 = 0,6 − 0,0643 = 0,5357 > ftd = 0,10
  const r = V.verificarTrecho({ L: 1, t: 0.14, NG: 10, NQ: 0, Vk: 2, Mk: 10, R: 0.875 },
    { gG: 1.4, gQ: 1.4, gW: 1.4, psiQ: 0.5, psiW: 0.6, gm: 2, gmV: 2, kf: 0.7, eta: 0.5, arg: '3,5 a 7,0' });
  perto(r.sigt, 0.535714, 1e-5);
  assert.equal(r.tracaOk, false);
});

test('deslocamento no topo de balanço com carga na ponta: PH³/3EI + 1,2PH/GA', () => {
  // P = 10 kN ; H = 6 m ; EI = 1e6 kN·m² ; GA = 1e5 kN
  // flexão = 10·216/3e6 = 7,2e-4 m ; cisalhamento = 1,2·10·6/1e5 = 7,2e-4 m ; total = 1,44e-3 m
  const segs = [{ z0: 0, z1: 3, EI: 1e6, GA: 1e5 }, { z0: 3, z1: 6, EI: 1e6, GA: 1e5 }];
  const d = V.deslocamentos(segs, [{ z: 6, F: 10 }]);
  perto(d[0].d, 1.44e-3, 2e-7);
});

test('γz = 1 / (1 − ΔMd / M1d)', () => {
  // 1 andar: F = 10 kN a 3 m ; EI = 1e4 ; GA infinito na prática
  // δ = 10·27/(3·1e4) = 9e-3 m ; M1 = 30 ; ΔM = 1000·9e-3 = 9 ; γz = 1/(1 − 0,3) = 1,4286
  const r = V.gamaZ([{ z0: 0, z1: 3, EI: 1e4, GA: 1e12 }], [{ z: 3, F: 10 }], [1000]);
  perto(r.M1, 30);
  perto(r.dM, 9, 1e-3);
  perto(r.gz, 1.4286);
});

test('armadura na extremidade tracionada', () => {
  // L = 1 ; t = 0,14 ; G = 10 kN ; Md = 14 kN·m
  // σM = 14/0,023333 = 0,6 MPa ; σN = 0,9·10/0,14 = 0,06429 ; σt = 0,53571 ; σc = 0,66429
  // x = 0,53571/1,2 = 0,44643 m ; T = 535,71·0,14·0,44643/2 = 16,741 kN ; As = 16,741/43,478 = 0,3850 cm²
  const r = V.armaduraTracao({ L: 1, t: 0.14, NG: 10 }, 14, 500 / 1.15);
  perto(r.x, 0.446429, 1e-5);
  perto(r.T, 16.7411, 1e-3);
  perto(r.As, 0.38504, 1e-4);
  assert.deepEqual([V.escolherBarras(r.As).n, V.escolherBarras(r.As).d], [1, 8]);
  // sem tração: não precisa
  assert.equal(V.armaduraTracao({ L: 4, t: 0.14, NG: 200 }, 10, 434.8).As, 0);
  // 2,2 cm² → 1 ϕ 20 (3,14) é menor que 2 ϕ 12,5 (2,45)? não: 2 ϕ 12,5 = 2,45 atende primeiro
  assert.deepEqual([V.escolherBarras(2.2).n, V.escolherBarras(2.2).d], [2, 12.5]);
});
