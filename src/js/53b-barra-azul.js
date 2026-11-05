// V114/V115 — Barra azul vertical (visual "Engenhar Studio", feito no outro chat) integrada à tela
// estilo CAD: fica à esquerda de tudo, sem cobrir nada; cada atalho executa uma ação real.
(function () {
  'use strict';
  const U = window.ui85, CAD = window.cad109;
  if (!U || !CAD || !document.body.classList.contains('cad109')) return;
  const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch {} return null; };
  const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const run = k => CAD.executar(k);
  const redraw = () => { try { window.dispatchEvent(new Event('resize')); drawPlan(); } catch {} };

  // [rótulo, ícone, ação, dica]
  const ITENS = [
    ['Projeto', '<rect height="18" rx="3" width="18" x="3" y="3"/><path d="M8 3v18M3 9h18"/>', () => U.view('dados'), 'Dados do projeto e níveis'],
    ['Planta', '<path d="M3 3h18v18H3z"/><path d="M3 11h9v10M12 3v5M15 11h6"/>', () => { U.cat('main'); U.view('plan'); }, 'Planta (área de desenho)'],
    ['Aberturas', '<path d="M5 21V3h14v18M5 21h14M9 18h.01"/>', () => run('Novo vão|newvao54'), 'Novo vão: porta ou janela'],
    ['Modulação', '<path d="M3 5h18v14H3zM3 12h18M9 5v7m6 0v7"/>', () => { U.cat('mod'); U.view('fiadas'); }, 'Modulação: gerar e ver as fiadas'],
    ['Blocos', '<path d="m12 2 9 5-9 5-9-5 9-5Zm-9 5v10l9 5 9-5V7M12 12v10"/>', () => U.view('blocks'), 'Blocos e juntas'],
    ['Lajes', '<path d="M2.5 14.5 8 9.5h13.5L16 14.5z"/><path d="M2.5 14.5v2.5H16l5.5-5v-2.5M16 14.5V17"/>', () => { U.cat('laje'); U.view('plan'); }, 'Lajes e beirais'],
    ['Resultados', '<path d="M4 20V12h4v8M10 20V4h4v16M16 20v-9h4v9M2 20h20"/>', () => U.view('quant'), 'Quantitativos'],
    ['Exportar', '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>', e => menuExportar(e), 'Pranchas em PDF, DXF, Excel e memorial'],
  ];

  const aside = document.createElement('aside');
  aside.id = 'engSideNav'; aside.className = 'eng-sidebar109 noPrint';
  aside.innerHTML = `<div class="br109"><span class="mk109">E</span><button type="button" id="engCollapse" title="Recolher / mostrar os nomes">☰</button></div>
    <nav aria-label="Navegação do programa">${ITENS.map((it, i) => `<a href="#" data-i="${i}" title="${it[3]}">${svg(it[1])}<span>${it[0]}</span></a>`).join('')}</nav>
    <div class="ft109">ENGENHAR</div>`;
  document.body.append(aside);
  aside.querySelector('nav').addEventListener('click', e => {
    const a = e.target.closest('a[data-i]'); if (!a) return; e.preventDefault();
    aside.querySelectorAll('nav a').forEach(x => x.classList.toggle('on', x === a));
    ITENS[Number(a.dataset.i)][2](e);
  });
  // recolher: só ícones (44 px)
  const aplicar = () => { const c = LS('side109') === 'c'; document.body.classList.toggle('side109c', c); setTimeout(redraw, 30); };
  aside.querySelector('#engCollapse').onclick = () => { LS('side109', LS('side109') === 'c' ? 'e' : 'c'); aplicar(); };
  aplicar();

  // menu Exportar
  const pop = document.createElement('div'); pop.id = 'exp109'; pop.className = 'noPrint'; pop.hidden = true; document.body.append(pop);
  function menuExportar(e) {
    const r = e.target.closest('a').getBoundingClientRect();
    const op = [['Pranchas em PDF', 'PDF|plotPDF26'], ['Pranchas em DXF', 'DXF|plotDXF36'], ['Quantitativos em Excel', 'Excel|xlBtn73'], ['Memorial de cálculo', 'x:Memorial de cálculo'], ['Diagnóstico (.txt)', 'Diagnóstico (.txt)|downloadAuditV48']];
    pop.innerHTML = op.map(([t, k]) => `<button type="button" data-k="${k}">${t}</button>`).join('');
    pop.style.top = Math.min(r.top, innerHeight - 220) + 'px'; pop.style.left = r.right + 6 + 'px'; pop.hidden = false;
    pop.onclick = ev => { const b = ev.target.closest('[data-k]'); if (!b) return; pop.hidden = true; run(b.dataset.k); };
  }
  document.addEventListener('pointerdown', e => { if (!pop.hidden && !e.target.closest('#exp109,#engSideNav')) pop.hidden = true; });

  const css = document.createElement('style');
  css.textContent = `
body.cad109{--sb109:64px;padding-left:0!important}body.cad109.side109c{--sb109:44px}
.eng-sidebar109{position:fixed;left:0;top:0;bottom:0;width:var(--sb109);z-index:75;display:flex;flex-direction:column;align-items:stretch;
 background:linear-gradient(170deg,#0d2b49,#123e63 70%,#0f4a6a);color:#d9e8f3;box-shadow:2px 0 10px #0003;font:11px "Segoe UI",Arial,sans-serif}
.eng-sidebar109 .br109{display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 0 6px;border-bottom:1px solid #ffffff1c}
.eng-sidebar109 .mk109{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;background:linear-gradient(135deg,#16a3ad,#0e6f8f);color:#fff;font:800 17px Arial}
.eng-sidebar109 #engCollapse{width:30px;height:22px;border:0;border-radius:5px;background:#ffffff14;color:#cfe3f1;cursor:pointer;margin:0;padding:0;font-size:13px;box-shadow:none}
.eng-sidebar109 nav{display:flex;flex-direction:column;gap:2px;padding:6px 5px;overflow-y:auto;scrollbar-width:none}
.eng-sidebar109 nav a{display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 2px 5px;border-radius:8px;color:#d9e8f3;text-decoration:none;border:1px solid transparent}
.eng-sidebar109 nav a svg{width:22px;height:22px;flex:none}.eng-sidebar109 nav a span{font-size:9.5px;line-height:1.1;text-align:center;letter-spacing:.1px}
.eng-sidebar109 nav a:hover{background:#ffffff14;border-color:#ffffff30;color:#fff}.eng-sidebar109 nav a.on{background:#087e91;color:#fff}
body.side109c .eng-sidebar109 nav a span,body.side109c .eng-sidebar109 .ft109{display:none}body.side109c .eng-sidebar109 nav a{padding:8px 0}
.eng-sidebar109 .ft109{margin-top:auto;padding:8px 0;text-align:center;font-size:8px;letter-spacing:1.5px;color:#7fa3bf;border-top:1px solid #ffffff1c}
#exp109{position:fixed;z-index:96;background:#fff;border:1px solid #b9c6d3;border-radius:8px;box-shadow:0 10px 26px #0004;padding:4px;display:flex;flex-direction:column;min-width:210px;font:12.5px "Segoe UI",Arial,sans-serif}
#exp109[hidden]{display:none}#exp109 button{background:none;border:0;text-align:left;padding:7px 10px;border-radius:4px;color:#1b2b3a;cursor:pointer;margin:0;box-shadow:none;height:auto}#exp109 button:hover{background:#e8f0f9}
/* tudo começa depois da barra azul */
body.cad109 #mb109,body.cad109 #fl109,body.cad109 #stat85,body.cad109 #rib85{left:var(--sb109)!important}
body.cad109 #lb109{left:var(--sb109)!important}
body.cad109 main{left:calc(var(--sb109) + 38px)!important}
body.cad109 #tabs85{left:calc(var(--sb109) + 38px)!important}
body.cad109 #mb109 .logo109{display:none}`;
  document.head.append(css);
  setTimeout(redraw, 60);
})();
