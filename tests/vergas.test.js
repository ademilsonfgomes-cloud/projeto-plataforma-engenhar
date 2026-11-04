// Testes das vergas (src/calculo/vergas.js). Valores esperados calculados à mão.
// Uso:  node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const V = require('../src/calculo/vergas.js');

const perto = (real, esperado, tol = 1e-3) =>
  assert.ok(Math.abs(real - esperado) <= tol, `${real} deveria ser ≈ ${esperado}`);

const BASE = { apoio: 30, hv: 20, cob: 4, t: 14, gAlv: 14, fk: 1.4, gm: 2, gf: 1.4, fyd: 500 / 1.15 };

test('porta de 1,00 m com parede alta acima: efeito arco', () => {
  // l = 100 + 16 = 116 cm ; triângulo 0,866·1,16 = 1,0046 m < 1,20 m acima → arco
  // W = 14·0,14·1,16·1,0046/2 = 1,1420 kN ; q pp = 14·0,14·0,20 = 0,392 kN/m
  // Mk = 1,1420·1,16/6 + 0,392·1,16²/8 = 0,22079 + 0,06593 = 0,28672 ; Md = 0,40141 kN·m
  // Vk = 0,5710 + 0,2274 = 0,79837 ; Vd = 1,11772 kN
  const r = V.verga({ ...BASE, vao: 100, acima: 120, gTopo: 10, qTopo: 2 });
  assert.equal(r.caso, 'arco');
  perto(r.l, 1.16);
  perto(r.W, 1.14202);
  perto(r.Md, 0.401415);
  perto(r.Vd, 1.11772);
  // fd = 0,7 MPa ; 78,4·x·(0,16 − 0,4x) = 0,40141 → x = 0,035077 m (x/d = 0,219)
  // z = 0,16 − 0,01403 = 0,14597 ; As = 0,40141/(434783·0,14597) = 0,0632 cm² < mínimo 0,224 cm²
  perto(r.x, 0.035077, 1e-5);
  assert.equal(r.flexOk, true);
  perto(r.AsCalc, 0.06325, 1e-4);
  perto(r.As, 0.224, 1e-6);
  // cisalhamento com 1 ϕ 8 (0,503 cm²): ρ = 0,503/224 ; fvk = 0,35 + 17,5ρ = 0,3893 ; fvd = 0,1946
  // τd = 1,11772/(0,14·0,16)/1000 = 0,0499 MPa → ok
  const c = V.cisalhamento(r, 0.503, 14, 2);
  perto(r.tau, 0.049898, 1e-5);
  perto(c.fvk, 0.389295, 1e-5);
  assert.equal(c.ok, true);
});

test('janela de 2,00 m logo abaixo da laje: carga total e verga de 1 fiada não passa', () => {
  // l = 216 cm ; triângulo 1,8706 m > 0,40 m acima → carga total
  // q = 14·0,14·0,40 + 0,392 + 10 + 2 = 13,176 kN/m ; Mk = 13,176·2,16²/8 = 7,6842 ; Md = 10,7579 kN·m
  // momento máximo com x = 0,5d: 0,7·1000·0,14·0,8·0,08·(0,16 − 0,032) = 0,8028 kN·m → não passa
  const r = V.verga({ ...BASE, vao: 200, acima: 40, gTopo: 10, qTopo: 2 });
  assert.equal(r.caso, 'carga total');
  perto(r.q, 13.176);
  perto(r.Md, 10.75794);
  assert.equal(r.flexOk, false);
  assert.equal(r.As, Infinity);
});

test('verga de 2 fiadas com fk maior passa', () => {
  // mesma janela, hv = 40 (d = 0,36), fk = 6 MPa → fd = 3 MPa
  // l = min(200 + 30, 200 + 36) = 230 cm ; q = 14·0,14·0,40 + 14·0,14·0,40 + 12 = 13,568 kN/m
  // Mk = 13,568·2,3²/8 = 8,9722 ; Md = 12,5611
  // 336·x·(0,36 − 0,4x) = 12,5611 → 134,4x² − 120,96x + 12,5611 = 0
  // Δ = 120,96² − 4·134,4·12,5611 = 7878,7 → x = (120,96 − 88,762)/268,8 = 0,11978 (x/d = 0,333)
  // z = 0,36 − 0,04791 = 0,31209 ; As = 12,5611/(434783·0,31209) = 0,9257 cm²
  const r = V.verga({ ...BASE, hv: 40, fk: 6, vao: 200, acima: 40, gTopo: 10, qTopo: 2 });
  perto(r.l, 2.3);
  perto(r.q, 13.568);
  perto(r.Md, 12.5611, 2e-3);
  perto(r.x, 0.11978, 2e-5);
  assert.equal(r.flexOk, true);
  perto(r.As, 0.9257, 2e-4);
});
