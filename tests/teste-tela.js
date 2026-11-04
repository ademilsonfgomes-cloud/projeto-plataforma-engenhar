// Teste da tela estilo CAD: barras personalizáveis, menus, linha de comando.
// Uso:  python3 build.py && node tests/teste-tela.js
const path = require('path');
const { chromium } = require('playwright');
const ARQ = process.env.ARQ || path.resolve(__dirname, '..', 'dist', 'Modulacao_Alvenaria_Engenhar.html');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const erros = [];
  p.on('pageerror', e => erros.push(e.message));
  p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  p.on('dialog', d => d.accept());
  const falhas = [];
  const conferir = (ok, msg) => { console.log((ok ? '  ok   ' : '  FALHA ') + msg); if (!ok) falhas.push(msg); };
  const centro = async sel => { const r = await p.locator(sel).first().boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
  const arrastar = async (de, para) => {
    await p.mouse.move(de.x, de.y); await p.mouse.down();
    await p.mouse.move(de.x + 15, de.y + 3, { steps: 3 }); await p.mouse.move(para.x, para.y, { steps: 8 }); await p.mouse.up();
  };
  const barras = () => p.evaluate(() => window.cad109.barras());

  await p.goto('file://' + ARQ, { waitUntil: 'load' });
  await p.waitForFunction(() => window.pdfjsLib);
  await p.evaluate(() => { try { localStorage.removeItem('barras109'); } catch {} });
  await p.reload({ waitUntil: 'load' }); await p.waitForFunction(() => window.pdfjsLib);
  await p.evaluate(() => document.getElementById('example').click()); await p.waitForTimeout(1200);

  conferir(await p.evaluate(() => document.body.classList.contains('cad109') && !!document.getElementById('mb109')), 'tela estilo CAD montada');
  conferir(await p.evaluate(() => window.bg88.get().theme === 'escuro'), 'fundo padrão: Escuro (CAD)');
  conferir(await p.evaluate(() => getComputedStyle(document.getElementById('hud88') || document.body).display === 'none'), 'aviso de cima da planta escondido');
  conferir(/sem laje/.test(await p.evaluate(() => document.getElementById('hudMsg109').textContent)), 'aviso do piso aparece na linha de comando');
  conferir(await p.evaluate(() => document.querySelectorAll('#stat85 .tg109 button').length) === 5, 'liga/desliga e fundo na linha de comando');

  // clique simples executa
  await p.click('#leftBar109 [data-key="Nova parede|fn"]'); await p.waitForTimeout(150);
  conferir(await p.evaluate(() => !!window.wall101?.active?.()), 'clique em Nova parede liga a ferramenta');
  await p.keyboard.press('Escape'); await p.click('#leftBar109 [data-key="Selecionar|sel"]');

  // arrastar da lateral para a de cima, antes de "Gerar"
  await arrastar(await centro('#leftBar109 [data-key="Aparar|trim88"]'), { ...(await centro('#flowBar109 [data-key="Gerar|gen85"]')), x: (await centro('#flowBar109 [data-key="Gerar|gen85"]')).x - 40 });
  let B = await barras();
  conferir(B.flow.indexOf('Aparar|trim88') === B.flow.indexOf('Gerar|gen85') - 1 && !B.left.includes('Aparar|trim88'), 'arrastar: Aparar foi para a barra de cima, antes de Gerar');
  conferir(await p.evaluate(() => !window.trim88?.active?.()), 'arrastar não executa a ferramenta');

  // arrastar para fora tira da barra
  await arrastar(await centro('#leftBar109 [data-key="Estender|extend88"]'), { x: 650, y: 480 });
  B = await barras();
  conferir(!B.left.includes('Estender|extend88'), 'arrastar para fora tira da barra');

  // a arrumação fica salva
  await p.reload({ waitUntil: 'load' }); await p.waitForFunction(() => window.pdfjsLib);
  B = await barras();
  conferir(B.flow.includes('Aparar|trim88') && !B.left.includes('Estender|extend88'), 'arrumação continua depois de recarregar');

  // paleta: devolver Estender logo depois de Mover
  await p.evaluate(() => window.cad109.abrirPaleta()); await p.waitForTimeout(100);
  const alvo = await centro('#leftBar109 [data-key="Mover|fn"]');
  await arrastar(await centro('#pal109 [data-key="Estender|extend88"]'), { x: alvo.x, y: alvo.y + 10 });
  B = await barras();
  conferir(B.left.indexOf('Estender|extend88') === B.left.indexOf('Mover|fn') + 1, 'paleta: Estender voltou logo depois de Mover');
  await p.click('#pal109 .r109p');
  B = await barras(); const P = await p.evaluate(() => window.cad109.padrao);
  conferir(JSON.stringify(B) === JSON.stringify({ flow: P.flow, left: P.left }), 'restaurar o padrão');
  await p.click('#pal109 .ok109p');

  // menus e categoria
  await p.click('#mb109 [data-m="2"]');
  conferir(await p.evaluate(() => !document.getElementById('dd109').hidden && /Personalizar barras/.test(document.getElementById('dd109').textContent)), 'menu Ver abre com Personalizar barras');
  await p.keyboard.press('Escape');
  await p.click('#flowBar109 [data-key="Cargas|#cargas"]'); await p.waitForTimeout(200);
  conferir(await p.evaluate(() => window.ui85.curCat === 'cargas' && document.body.classList.contains('ctx109')), 'Cargas abre a faixa da categoria');
  await p.click('#rib85 .back85'); await p.waitForTimeout(150);
  conferir(await p.evaluate(() => !document.body.classList.contains('ctx109')), 'Principal fecha a faixa');

  // fundo pelo rodapé
  await p.click('#stat85 .fd109'); await p.waitForTimeout(100);
  const preto = p.locator('#dd109 button', { hasText: 'Preto' });
  await preto.click();
  conferir(await p.evaluate(() => window.bg88.get().theme === 'preto'), 'fundo trocado para Preto pelo rodapé');
  await p.evaluate(() => window.bg88.set('escuro'));

  conferir(erros.length === 0, 'nenhum erro no navegador' + (erros.length ? ':\n    ' + erros.join('\n    ') : ''));
  await b.close();
  console.log(falhas.length ? `\n${falhas.length} falha(s).` : '\nTudo certo.');
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
