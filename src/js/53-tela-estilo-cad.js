// V109 — Tela no estilo CAD: área de desenho grande, ferramentas pequenas e organizadas pelo uso.
//  · barra de menus (tudo o que se usa de vez em quando, nada se perde)
//  · barra do fluxo do projeto (na ordem: planta → paredes → gerar → elevações → armaduras → laje → cargas…)
//  · barra lateral de desenho (o que se usa o tempo todo)
//  · faixa da categoria só aparece quando uma categoria é aberta
//  · abas das vistas no rodapé, linha de comando com os avisos e os liga/desliga (encaixe, grade…)
//  · AS BARRAS SÃO PERSONALIZÁVEIS: arraste um ícone para mudar de lugar, para a outra barra ou para
//    fora (tira da barra); Ver → Personalizar barras traz a paleta com todas as ferramentas.
//    A arrumação fica salva no navegador de cada pessoa.
// Cada botão executa a MESMA ação da tela anterior (window.ui85.run) — nenhuma função muda.
(function () {
  'use strict';
  const U = window.ui85;
  if (!U || !document.body.classList.contains('ui85')) return;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch {} return null; };
  const msg = t => { try { if (typeof window.msg === 'function') return window.msg(t); } catch {} const m = $('sMsg85'); if (m) m.textContent = t; };
  const redraw = () => { try { window.dispatchEvent(new Event('resize')); drawPlan(); } catch {} };

  // ---------- ícones (traço fino, cor por família)
  const FAM = { arq: '#4a5b6e', des: '#1f6fc5', mod: '#1d8a4c', arm: '#c4422b', car: '#7a4fc0', sai: '#c27a00', ver: '#2c7f8f' };
  const I = {
    'Novo projeto': ['arq', '<path d="M6 2.8h8l4 4v14.4H6z"/><path d="M14 2.8v4h4"/><path d="M12 11v6M9 14h6"/>'],
    'Abrir projeto': ['arq', '<path d="M3 6.5h6l2 2h10v10.5H3z"/><path d="M3 10.5h18"/>'],
    'Salvar': ['arq', '<path d="M4 3.5h13l3 3v14H4z"/><path d="M7.5 3.5v5h8v-5"/><rect x="7.5" y="13" width="9" height="7.5"/>'],
    'Desfazer': ['arq', '<path d="M8 6 4 10l4 4"/><path d="M4 10h10a5.5 5.5 0 0 1 0 11h-3"/>'],
    'Refazer': ['arq', '<path d="m16 6 4 4-4 4"/><path d="M20 10H10a5.5 5.5 0 0 0 0 11h3"/>'],
    'Exemplo': ['arq', '<path d="M3 8.5 12 4l9 4.5-9 4.5z"/><path d="M7 10.5V16c3 2.3 7 2.3 10 0v-5.5M21 8.5V14"/>'],
    'Importar planta': ['arq', '<path d="M5 2.8h9l4 4v6"/><path d="M14 2.8v4h4"/><path d="M5 2.8v18.4h7"/><path d="M17 15v7M14 19l3 3 3-3"/><path d="M8 10h6M8 13.5h4" stroke-width="1.1"/>'],
    'Calibrar escala': ['arq', '<path d="M2.5 15.5 15.5 2.5l6 6-13 13z"/><path d="m6 12 2 2M9 9l1.5 1.5M12 6l2 2M15 3l1.5 1.5" stroke-width="1.2"/>'],
    'Dados do projeto': ['arq', '<rect x="3.5" y="3" width="17" height="18" rx="1.2"/><path d="M7 8h10M7 12h10M7 16h6" stroke-width="1.2"/>'],
    'Blocos e juntas': ['arq', '<rect x="2.5" y="7" width="12" height="6" rx=".5"/><rect x="9" y="14" width="12.5" height="6" rx=".5"/><path d="M8.5 7v6M15 14v6" stroke-width="1"/><path d="M15.5 4h6M18.5 2v4" stroke-width="1.2"/>'],
    'Ponto de origem': ['arq', '<circle cx="12" cy="12" r="3"/><path d="M12 2v6M12 16v6M2 12h6M16 12h6"/>'],
    'Apagar origem': ['arq', '<circle cx="9" cy="9" r="2.5"/><path d="M9 2v4M9 12v4M2 9h4M12 9h4" stroke-width="1.3"/><path d="m14 14 7 7M21 14l-7 7"/>'],
    'Alinhar com o de baixo': ['arq', '<rect x="4" y="3" width="11" height="7" rx=".5"/><rect x="9" y="14" width="11" height="7" rx=".5" stroke-dasharray="2 1.5"/><path d="M12 10v4"/><path d="m10.5 12.5 1.5 1.5 1.5-1.5"/>'],
    'Ajustes': ['arq', '<path d="M4 6.5h16M4 12h16M4 17.5h16" stroke-width="1.3"/><circle cx="9" cy="6.5" r="2" fill="#fff"/><circle cx="15.5" cy="12" r="2" fill="#fff"/><circle cx="7" cy="17.5" r="2" fill="#fff"/>'],
    'Selecionar': ['des', '<path d="M6 3.5 18 11l-5.6 1.4L10 18.2z"/><path d="M12.4 12.4 16.5 18"/>'],
    'Nova parede': ['des', '<rect x="2.5" y="13" width="13" height="5" rx=".5"/><path d="M6.5 13v5M10.5 13v5" stroke-width="1"/><path d="M14 10.5 19.5 5l2 2-5.5 5.5-2.6.6z"/>'],
    'Porta': ['des', '<path d="M4 21V3.5h10V21"/><path d="M2.5 21h19"/><path d="M14 3.5a10 10 0 0 1 6.5 9" stroke-dasharray="2 1.8" stroke-width="1.2"/><circle cx="11.5" cy="12.5" r=".9" fill="currentColor"/>'],
    'Janela': ['des', '<rect x="3.5" y="5" width="17" height="12" rx=".5"/><path d="M12 5v12M3.5 11h17" stroke-width="1.2"/><path d="M2 20h20" stroke-width="2"/>'],
    'Mover': ['des', '<path d="M12 3v18M3 12h18"/><path d="M9.5 5.5 12 3l2.5 2.5M9.5 18.5 12 21l2.5-2.5M5.5 9.5 3 12l2.5 2.5M18.5 9.5 21 12l-2.5 2.5"/>'],
    'Aparar': ['des', '<path d="M6 3v18M18 3v18" stroke-width="1.3"/><path d="M2 12h4M18 12h4" stroke-width="3"/><path d="M8 12h8" stroke-dasharray="1.6 1.6" opacity=".5"/><path d="m10 8.5 4 7M14 8.5l-4 7" stroke-width="1.3"/>'],
    'Estender': ['des', '<path d="M2.5 12h9" stroke-width="3"/><path d="M11.5 12h8" stroke-dasharray="1.8 1.6"/><path d="m16.5 9 3 3-3 3"/><path d="M21.5 5v14" stroke-width="1.3"/>'],
    'Unir canto': ['des', '<path d="M5 4v15h15" stroke-width="3"/><path d="M10 9.5h7M13.5 6v7" stroke-width="1.2"/>'],
    'Mover p/ eixo': ['des', '<rect x="3" y="4" width="18" height="5" rx=".5"/><path d="M3 17h18" stroke-dasharray="3 1.6 .6 1.6"/><path d="M12 10.5v4.5M10 13l2 2 2-2"/>'],
    'Apagar': ['des', '<rect x="2.5" y="10" width="19" height="5" rx=".5"/><path d="M7 10v5M12 10v5M17 10v5" stroke-width="1"/><path d="m6.5 4 11 17M17.5 4l-11 17" stroke-width="1.9"/>'],
    'Desníveis': ['des', '<path d="M3 8h6v4h6v4h6"/><path d="M6 2.5v3.5M4.5 4 6 2.5 7.5 4"/><path d="M18 21.5V18M16.5 20 18 21.5l1.5-1.5"/>'],
    'Editar elevação': ['des', '<rect x="3" y="7" width="13" height="13"/><path d="M3 11.3h13M3 15.6h13M8 7v4.3M12 11.3v4.3M8 15.6V20" stroke-width="1"/><path d="M15 9.5 20 4.5l2 2-5 5-2.5.6z"/>'],
    'Paredes': ['des', '<rect x="2.5" y="4" width="19" height="16" rx="1"/><path d="M2.5 9.3h19M2.5 14.7h19M9 4v5.3M16 4v5.3M5.5 9.3v5.4M12.5 9.3v5.4M19 9.3v5.4M9 14.7V20M16 14.7V20" stroke-width="1.1"/>'],
    'Propor paredes': ['des', '<rect x="3" y="3" width="18" height="18" rx="1" stroke-dasharray="2.2 2" stroke-width="1.1"/><path d="M3 12h9V3" stroke-width="2.2"/><path d="M16 15.5l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" stroke-width="1.1"/>'],
    'Procurar portas e janelas': ['des', '<rect x="3" y="4" width="9" height="14" stroke-width="1.2"/><circle cx="15.5" cy="13.5" r="4.5"/><path d="m19 17 3 3"/>'],
    'Numerar paredes': ['des', '<rect x="2.5" y="14" width="19" height="5" rx=".5"/><path d="M6 3.5h1.5v7M5 10.5h4M12 5a2 2 0 1 1 3.4 1.4L12 10.5h4" stroke-width="1.3"/>'],
    'Internas / externas': ['des', '<rect x="3" y="3" width="18" height="18" rx=".8" stroke-width="2.4"/><path d="M12 3v18" stroke-width="1.1"/>'],
    'Cores': ['des', '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="10" cy="7" r="1.2" fill="currentColor"/><circle cx="15" cy="7" r="1.2" fill="currentColor"/>'],
    'Lista de paredes': ['des', '<path d="M8 6h13M8 12h13M8 18h13" stroke-width="1.3"/><rect x="3" y="4.5" width="3" height="3" rx=".4"/><rect x="3" y="10.5" width="3" height="3" rx=".4"/><rect x="3" y="16.5" width="3" height="3" rx=".4"/>'],
    'Parede pela lista': ['des', '<path d="M8 6h13M8 12h8" stroke-width="1.3"/><rect x="3" y="4.5" width="3" height="3" rx=".4"/><rect x="3" y="10.5" width="3" height="3" rx=".4"/><path d="M18 15v7M14.5 18.5h7"/>'],
    'Modulação': ['mod', '<rect x="2.5" y="5" width="19" height="14" rx="1"/><path d="M2.5 9.7h19M2.5 14.3h19M8 5v4.7M14.5 5v4.7M5 9.7v4.6M11.3 9.7v4.6M18 9.7v4.6M8 14.3V19M14.5 14.3V19" stroke-width="1.1"/>'],
    'Gerar modulação': ['mod', '<rect x="2.5" y="5" width="13" height="14" rx=".8"/><path d="M2.5 9.7h13M2.5 14.3h13M8 5v4.7M5 9.7v4.6M11 9.7v4.6M8 14.3V19" stroke-width="1.1"/><path d="m17.5 8.5 4 3.5-4 3.5z" fill="currentColor"/>'],
    '1ª / 2ª fiada': ['mod', '<rect x="2.5" y="4" width="8.5" height="16" rx=".6"/><rect x="13" y="4" width="8.5" height="16" rx=".6"/><path d="M2.5 9.5h8.5M5.5 4v5.5M13 14.5h8.5M18.5 14.5V20" stroke-width="1.1"/>'],
    'Elevações': ['mod', '<path d="M3 20.5h18"/><rect x="4.5" y="6" width="15" height="14.5"/><path d="M4.5 10.8h15M4.5 15.6h15M9.5 6v4.8M14.5 6v4.8M7 10.8v4.8M12 10.8v4.8M17 10.8v4.8M9.5 15.6v4.9M14.5 15.6v4.9" stroke-width="1"/>'],
    'Conferir': ['mod', '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/><path d="m7.5 10.5 2.2 2.2 4-4.2" stroke-width="1.5"/>'],
    'Corrigir todas': ['mod', '<path d="M14.5 3.5a5 5 0 0 0-5.7 6.6L3 15.9 5.1 18l2 2 5.8-5.8a5 5 0 0 0 6.6-5.7l-3 3-3-.6-.6-3z"/>'],
    'Destravar': ['mod', '<rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8.5 11V7.5a3.5 3.5 0 0 1 6.8-1.2"/>'],
    'Cotas': ['mod', '<path d="M3 6v12M21 6v12" stroke-width="1.2"/><path d="M3 12h18"/><path d="m6 9.5-3 2.5 3 2.5M18 9.5l3 2.5-3 2.5" stroke-width="1.3"/>'],
    'Diagnóstico': ['mod', '<path d="M3 12h4l2-6 4 12 2-6h6"/>'],
    'Armaduras': ['arm', '<rect x="5.6" y="2.6" width="12.8" height="18.8" rx="2.4"/><path d="M6.5 3.7 12 9.2M5.9 6.2 10.4 10.7" stroke-width="1.8"/>'],
    'Vergas': ['arm', '<path d="M2.5 21V9h19v12"/><path d="M2.5 9h19v-4h-19z"/><path d="M4.5 7.2h15" stroke-width="1.2" stroke-dasharray="2.2 1.4"/><rect x="8" y="13" width="8" height="8" stroke-width="1.1"/>'],
    'Reforço / Viga': ['arm', '<rect x="2.5" y="8" width="19" height="8" rx=".6"/><path d="M4.5 13.5h15M4.5 10.5h15" stroke-width="1.1" stroke-dasharray="2 1.3"/>'],
    'Negativo': ['arm', '<path d="M3 15h18" stroke-width="1.2"/><path d="M5 9h14M5 9v3M19 9v3" stroke-width="1.8"/>'],
    'Laje': ['car', '<path d="M2.5 14.5 8 9.5h13.5L16 14.5z"/><path d="M2.5 14.5v2.5H16l5.5-5v-2.5M16 14.5V17" stroke-width="1.2"/>'],
    'Linha divisória': ['car', '<path d="M2.5 14.5 8 9.5h13.5L16 14.5z" stroke-width="1.2"/><path d="m9 15 6-6" stroke-width="2"/>'],
    'Beiral': ['car', '<path d="M3 20V9h10v11" stroke-width="1.2"/><path d="M1.5 9h21" stroke-width="2.4"/><path d="M15 9v-.5" /><path d="M16.5 12h5" stroke-dasharray="1.6 1.4" stroke-width="1.1"/>'],
    'Editar / excluir': ['car', '<path d="M4 20h4L19.5 8.5l-4-4L4 16z"/><path d="m13.5 6.5 4 4" stroke-width="1.2"/>'],
    'Abertura na laje': ['car', '<path d="M2.5 14.5 8 9.5h13.5L16 14.5z"/><path d="m9 12.5 2-2h4l-2 2z" stroke-width="1.3"/>'],
    'Cargas': ['car', '<path d="M3 19.5h18"/><path d="M6 4v10M12 4v10M18 4v10" stroke-width="1.4"/><path d="m4 11.5 2 2.6 2-2.6M10 11.5l2 2.6 2-2.6M16 11.5l2 2.6 2-2.6"/>'],
    'Retângulo': ['car', '<rect x="3.5" y="6" width="17" height="12" rx=".5"/><path d="M8 3v5M12 3v5M16 3v5" stroke-width="1.1"/>'],
    'Polígono': ['car', '<path d="M4 9 11 3.5l9 4.5-2 11H6z"/>'],
    'Carga linear': ['car', '<path d="M3 18h18" stroke-width="2"/><path d="M6 5v9M12 5v9M18 5v9" stroke-width="1.2"/><path d="m4.5 12 1.5 2 1.5-2M10.5 12l1.5 2 1.5-2M16.5 12l1.5 2 1.5-2"/>'],
    'Concentrada': ['car', '<path d="M12 3v14"/><path d="m8.5 13.5 3.5 4 3.5-4"/><path d="M4 20.5h16" stroke-width="1.2"/>'],
    'Resistências': ['car', '<rect x="4" y="13" width="16" height="7" rx=".5"/><path d="M9.3 13v7M14.6 13v7" stroke-width="1"/><path d="M12 2.5v8M9 7.5l3 3 3-3"/>'],
    'Vento': ['car', '<path d="M2.5 8h11a3 3 0 1 0-3-3"/><path d="M2.5 12.5h16a3 3 0 1 1-3 3"/><path d="M2.5 17h7"/>'],
    'Pranchas': ['sai', '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M13 15.2h8M13 15.2V20M16.5 15.2V20" stroke-width="1.1"/><path d="M5.5 6.5h6v6h-6zM8.5 6.5v6" stroke-width="1"/>'],
    'Quantitativos': ['sai', '<path d="M3.5 20.5h17"/><rect x="5" y="12" width="3" height="8.5"/><rect x="10.5" y="7" width="3" height="13.5"/><rect x="16" y="3.5" width="3" height="17"/>'],
    'Excel': ['sai', '<rect x="3" y="3.5" width="18" height="17" rx="1"/><path d="M3 9h18M3 14.5h18M9 3.5v17" stroke-width="1.1"/>'],
    'Memorial': ['sai', '<path d="M5 2.8h10l4 4v14.4H5z"/><path d="M15 2.8v4h4"/><path d="M8 11h3M8 14.5h8M8 18h6" stroke-width="1.1"/><path d="M13 9.5l1.2 1.2 2.3-2.4" stroke-width="1.3"/>'],
    'Exportar DXF': ['sai', '<path d="M5 2.8h9l4 4v6"/><path d="M14 2.8v4h4"/><path d="M5 2.8v18.4h7"/><path d="M17 22v-7M14 18l3-3 3 3"/><path d="M8 9h5M8 12.5h3" stroke-width="1.1"/>'],
    'Tamanho dos textos': ['sai', '<path d="M3 19 8 5l5 14M5 14h6"/><path d="M15 19l3-8 3 8M16 16.5h4" stroke-width="1.3"/>'],
    'Encaixe': ['ver', '<rect x="8" y="8" width="8" height="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke-width="1.3"/>'],
    'Grade': ['ver', '<path d="M3 8h18M3 16h18M8 3v18M16 3v18" stroke-width="1.2"/>'],
    'Ver tudo': ['ver', '<path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5"/><rect x="7.5" y="7.5" width="9" height="9" rx=".6" stroke-width="1.2"/>'],
    'Visibilidade': ['ver', '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'],
    'Lajes e cargas': ['ver', '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" stroke-width="1.3"/><path d="m8 13.5 2.4-2.2h5.6l-2.4 2.2z" stroke-width="1.2"/>'],
    'Fantasma de baixo': ['ver', '<path d="M5 21V10a7 7 0 0 1 14 0v11l-2.3-1.8L14.3 21 12 19.2 9.7 21l-2.4-1.8z"/><circle cx="9.5" cy="10.5" r="1" fill="currentColor"/><circle cx="14.5" cy="10.5" r="1" fill="currentColor"/>'],
    '3D': ['ver', '<path d="M12 2.8 20 7.2v9.6L12 21.2 4 16.8V7.2z"/><path d="M4 7.2 12 11.6l8-4.4M12 11.6v9.6" stroke-width="1.2"/>'],
    'Importar IFC': ['ver', '<path d="M12 2.8 19 6.7v7.6L12 18.2 5 14.3V6.7z" stroke-width="1.3"/><path d="M5 6.7 12 10.6l7-3.9M12 10.6v7.6" stroke-width="1"/><path d="M17.5 18.5V23M15.5 21l2 2 2-2" stroke-width="1.3"/>'],
    'Limpar marcas': ['ver', '<path d="m14 4 6 6-9 9H6l-3-3z"/><path d="m9 9 6 6M3 20h18" stroke-width="1.2"/>'],
    'Trena': ['des', '<rect x="2.5" y="8" width="13" height="10" rx="5"/><circle cx="9" cy="13" r="2.2"/><path d="M15.5 15.5h6v2.5h-6" stroke-width="1.4"/><path d="M17.5 15.5v1.3M19.5 15.5v1.3" stroke-width="1"/>'],
    'Verificar geometria': ['des', '<rect x="2.5" y="13" width="12" height="5" rx=".5"/><path d="M2.5 13V6h5" stroke-width="1.2"/><circle cx="16" cy="9" r="4.6"/><path d="m19.4 12.4 3 3" stroke-width="2"/><path d="m13.9 9 1.5 1.5 2.8-3" stroke-width="1.4"/>'],
    'Separador': ['arq', '<path d="M12 3v18" stroke-width="2"/>'],
  };
  // nome da ferramenta no programa → ícone
  const ALIAS = {
    'Novo vão': 'Porta', 'Adicionar abertura': 'Janela', 'Unir': 'Unir canto', 'Apagar parede': 'Apagar', 'Desfazer exclusão': 'Desfazer',
    'Procurar portas/janelas': 'Procurar portas e janelas', 'Numerar': 'Numerar paredes', 'Renumerar': 'Numerar paredes', 'Fundo': 'Grade', 'Arquitetura': 'Importar planta',
    'Abrir PDF / DXF / IFC': 'Importar planta', 'Origem 0,0 do DXF': 'Ponto de origem', 'Conferir pontos': 'Conferir', 'Dados e níveis': 'Dados do projeto',
    'Gerar': 'Gerar modulação', 'Conferir antes': 'Conferir', 'Destravar todas': 'Destravar', 'Conferir projeto': 'Conferir', 'Diagnóstico (.txt)': 'Diagnóstico',
    'Ver elevações': 'Elevações', 'Editar armaduras': 'Armaduras', 'Resumo de aço': 'Quantitativos', 'Painel de laje': 'Laje', 'Beiral / balanço': 'Beiral',
    'Laje e ações do pavimento': 'Ajustes', 'Maciças · cálculo e armação': 'Laje', 'Planta de cargas': 'Cargas', 'Configurações': 'Ajustes', 'PDF': 'Pranchas',
    'DXF': 'Exportar DXF', 'Ver em 3D': '3D', 'Quantitat.': 'Quantitativos', 'Textos das pranchas': 'Tamanho dos textos', 'Exemplo didático': 'Exemplo',
    'Memorial de cálculo': 'Memorial', 'Vento e contraventamento': 'Vento', 'Fantasma do pavimento de baixo': 'Fantasma de baixo',
  };
  const svg = (l, px = 20) => {
    const it = I[l] || I[ALIAS[l]]; if (!it) return null;
    return `<svg width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="${FAM[it[0]]}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="color:${FAM[it[0]]}" aria-hidden="true">${it[1]}</svg>`;
  };
  const icone = (t, px) => svg(t.l, px) || `<span class="em109">${esc(t.ic || '•')}</span>`;

  // ---------- todas as ferramentas (as da tela anterior + algumas de arquivo e cálculo)
  const REG = new Map();
  const keyOf = t => t.l + '|' + (typeof t.t === 'string' ? t.t : 'fn');
  for (const [c, C] of Object.entries(U.CATS)) for (const g of C.groups) for (const t of g[1]) { const k = keyOf(t); if (!REG.has(k)) REG.set(k, { key: k, t, cat: c }); }
  const EXTRA = [
    ['Novo projeto', () => $('newProject')?.click()], ['Abrir projeto', () => $('restore')?.click()], ['Salvar', () => $('save')?.click()],
    ['Exemplo didático', () => $('example')?.click()], ['Desfazer', () => window.undo58?.undo?.()], ['Refazer', () => window.undo58?.redo?.()],
    ['Resistências', () => window.res96?.open()], ['Vento e contraventamento', () => window.vento109?.open()], ['Vergas', () => window.vergas109?.open()],
    ['Memorial de cálculo', () => window.memorial?.imprimir()], ['Visibilidade', () => $('vis87btn')?.click()],
    ['Verificar geometria', () => window.geo116?.abrir()], ['Trena', () => window.trena118?.ligar()], ['Renumerar', () => window.renum116?.()],
  ];
  for (const [l, f] of EXTRA) REG.set('x:' + l, { key: 'x:' + l, t: { l, ic: '', t: () => { f(); } }, cat: 'extra' });
  REG.set('sep', { key: 'sep', t: { l: 'Separador' } });
  REG.set('spacer', { key: 'spacer', t: { l: 'Espaço (empurra para o fim)' } });

  // ---------- barras (padrão e personalização)
  const PADRAO = {
    flow: ['x:Novo projeto', 'x:Abrir projeto', 'x:Salvar', 'sep', 'x:Desfazer', 'x:Refazer', 'sep',
      'Arquitetura|#arq', 'Paredes|#paredes', 'Gerar|gen85', 'x:Verificar geometria', 'Elevações|#elev', 'Armaduras|#arm', 'Laje|#laje', 'Cargas|#cargas', 'sep',
      'x:Resistências', 'x:Vento e contraventamento', 'x:Vergas', 'sep', 'Pranchas|#pranchas', 'Quantitat.|#quant', 'x:Memorial de cálculo', 'Ajustes|#ajustes'],
    left: ['Selecionar|sel', 'Nova parede|fn', 'Novo vão|newvao54', 'sep', 'Mover|fn', 'Aparar|trim88', 'Estender|extend88', 'Unir|join56', 'Mover p/ eixo|axis56', 'x:Trena',
      'Apagar parede|deleteWall', 'x:Renumerar', 'sep', 'Desníveis|dn87btn', 'Editar elevação|fn', 'spacer', 'x:Visibilidade', 'Ver tudo|fit88', 'Ver em 3D|v3d74btn'],
  };
  const PASSO = { 'Arquitetura|#arq': 1, 'Paredes|#paredes': 2, 'Gerar|gen85': 3, 'Elevações|#elev': 4, 'Armaduras|#arm': 5, 'Laje|#laje': 6, 'Cargas|#cargas': 7 };
  const NOME = { 'Arquitetura|#arq': 'Planta (abrir, calibrar, pavimentos)', 'Gerar|gen85': 'Gerar modulação', 'Quantitat.|#quant': 'Quantitativos' };
  let barras;
  try { barras = JSON.parse(LS('barras109') || 'null'); } catch { barras = null; }
  const limpa = l => (Array.isArray(l) ? l : []).filter(k => REG.has(k));
  barras = barras && barras.v === 1 ? { flow: limpa(barras.flow), left: limpa(barras.left) } : JSON.parse(JSON.stringify(PADRAO));
  const salvar = () => LS('barras109', JSON.stringify({ v: 1, ...barras }));
  // V116 — botões novos entram também em barras já personalizadas (uma vez só; se a pessoa tirar, não voltam)
  if (LS('barras116') !== '1') {
    const pos = (l, k, depois) => { if (l.includes(k)) return; const j = l.indexOf(depois); l.splice(j >= 0 ? j + 1 : l.length, 0, k); };
    pos(barras.flow, 'x:Verificar geometria', 'Gerar|gen85'); pos(barras.left, 'x:Renumerar', 'Apagar parede|deleteWall');
    LS('barras116', '1'); salvar();
  }
  if (LS('barras118') !== '1') {
    if (!barras.left.includes('x:Trena')) { const j = barras.left.indexOf('Mover p/ eixo|axis56'); barras.left.splice(j >= 0 ? j + 1 : barras.left.length, 0, 'x:Trena'); }
    LS('barras118', '1'); salvar();
  }

  // ---------- estrutura
  const E = (tag, id, cls) => { const e = document.createElement(tag); if (id) e.id = id; if (cls) e.className = cls; return e; };
  const mb = E('div', 'mb109', 'noPrint'), fl = E('div', 'fl109', 'noPrint'), lb = E('div', 'lb109', 'noPrint');
  document.body.append(mb, fl, lb);
  document.body.classList.add('cad109');
  const flowBar = E('div', 'flowBar109', 'bar109'); flowBar.dataset.bar = 'flow';
  const flowR = E('div', 'flowR109');
  fl.append(flowBar, flowR);
  const leftBar = E('div', 'leftBar109', 'bar109'); leftBar.dataset.bar = 'left'; lb.append(leftBar);
  // nível, escala, visibilidade e resultado vão para a direita da barra do fluxo (os mesmos controles)
  const top = $('top85');
  top?.querySelectorAll('.lv85').forEach(el => flowR.append(el));
  if ($('md94')) flowR.insertBefore($('md94'), flowR.children[1] || null);
  if ($('vis87btn')) { const v = $('vis87btn'); v.innerHTML = '<span class="e87v">' + svg('Visibilidade', 18) + '</span>'; v.title = 'Visibilidade (camadas)'; flowR.append(v); }
  if ($('diag85')) flowR.append($('diag85'));

  // ---------- desenhar as barras
  function botao(k, i) {
    if (k === 'sep') return `<div class="sp109" data-key="sep" data-i="${i}" title="Separador (arraste para mover ou tirar)"></div>`;
    if (k === 'spacer') return `<div class="spc109" data-key="spacer" data-i="${i}" title="Espaço (arraste para mover ou tirar)"></div>`;
    const R = REG.get(k); if (!R) return '';
    const nome = NOME[k] || R.t.l, n = PASSO[k];
    if (k === 'x:Verificar geometria') return `<button type="button" class="b109 geo109" data-key="${esc(k)}" data-i="${i}" title="Verificar a geometria do pavimento antes de gerar (paredes sobrepostas, folgas, ângulos, encontros, vigas)">${svg('Verificar geometria', 18)}<span class="gl109">Verificar geometria</span></button>`;
    if (k === 'Gerar|gen85') return `<button type="button" class="b109 gen109" data-key="${esc(k)}" data-i="${i}" title="${esc(nome)}">${svg('Gerar modulação', 18)}<span class="gl109">Gerar modulação</span>${n ? `<i class="n109">${n}</i>` : ''}</button>`;
    return `<button type="button" class="b109" data-key="${esc(k)}" data-i="${i}" title="${esc(nome)}">${icone(R.t, 20)}${n ? `<i class="n109">${n}</i>` : ''}</button>`;
  }
  function desenhar() {
    flowBar.innerHTML = barras.flow.map(botao).join('');
    leftBar.innerHTML = barras.left.map(botao).join('');
    espelharGerar(); marcar();
  }
  // o botão Gerar acompanha o original (vira "Cancelar" enquanto gera)
  function espelharGerar() {
    const o = $('gen85'), b = flowBar.querySelector('.gen109') || leftBar.querySelector('.gen109'); if (!o || !b) return;
    const busy = o.classList.contains('busy85'); b.classList.toggle('busy109', busy);
    const gl = b.querySelector('.gl109'); if (gl) gl.textContent = busy ? (o.textContent || '').replace(/^■\s*/, '') : 'Gerar modulação';
  }
  if ($('gen85')) new MutationObserver(espelharGerar).observe($('gen85'), { childList: true, characterData: true, subtree: true, attributes: true });
  // ferramenta ativa marcada nas barras
  function marcar() {
    const a = U.activeTool, cc = U.curCat;
    document.querySelectorAll('#fl109 .b109,#lb109 .b109').forEach(b => {
      const R = REG.get(b.dataset.key); if (!R) return;
      const t = R.t;
      b.classList.toggle('on', (!!a && t.l === a) || (t.t === 'sel' && !a) || (typeof t.t === 'string' && t.t === '#' + cc && cc !== 'main'));
    });
  }
  if ($('sT85')) new MutationObserver(marcar).observe($('sT85'), { childList: true, characterData: true, subtree: true });

  // ---------- executar
  function executar(k) {
    const R = REG.get(k); if (!R || k === 'sep' || k === 'spacer') return;
    fecharMenus();
    try { U.run(R.t); } catch (e) { console.error('V109', e); }
    marcar();
  }

  // ---------- arrastar e soltar (clique = executa; arrasto de mais de 6 px = move)
  let dr = null;
  const marca = E('div', 'drop109');
  function alvo(x, y) {
    for (const bar of [flowBar, leftBar]) {
      const r = bar.getBoundingClientRect(), pad = 14;
      if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) return bar;
    }
    return null;
  }
  function posicao(bar, x, y) {
    const vert = bar === leftBar, itens = [...bar.querySelectorAll('[data-key]')];
    for (let i = 0; i < itens.length; i++) {
      const r = itens[i].getBoundingClientRect();
      if (vert ? y < r.top + r.height / 2 : x < r.left + r.width / 2) return { i, el: itens[i] };
    }
    return { i: itens.length, el: null };
  }
  function iniciar(e) {
    const b = e.target.closest('[data-key]'); if (!b || e.button !== 0) return;
    const bar = b.closest('.bar109');
    dr = { key: b.dataset.key, de: bar ? bar.dataset.bar : 'pal', i: Number(b.dataset.i), x: e.clientX, y: e.clientY, el: b, on: false, pid: e.pointerId };
    if (bar) e.preventDefault();
  }
  addEventListener('pointerdown', iniciar, true);
  addEventListener('pointermove', e => {
    if (!dr) return;
    if (!dr.on) {
      if (Math.hypot(e.clientX - dr.x, e.clientY - dr.y) < 6) return;
      dr.on = true; fecharMenus();
      dr.fant = dr.el.cloneNode(true); dr.fant.id = 'ghost109'; dr.fant.classList.remove('on'); document.body.append(dr.fant);
      document.body.classList.add('drag109'); dr.el.classList.add('src109');
    }
    dr.fant.style.left = e.clientX + 8 + 'px'; dr.fant.style.top = e.clientY + 8 + 'px';
    const bar = alvo(e.clientX, e.clientY);
    marca.remove();
    if (bar) { const p = posicao(bar, e.clientX, e.clientY); marca.className = bar === leftBar ? 'drop109 v' : 'drop109 h'; bar.insertBefore(marca, p.el); dr.fant.classList.remove('fora109'); }
    else dr.fant.classList.toggle('fora109', dr.de !== 'pal');
  }, true);
  addEventListener('pointerup', e => {
    if (!dr) return;
    const d = dr; dr = null;
    if (!d.on) { if (d.de !== 'pal') { e.preventDefault(); executar(d.key); } return; }
    d.fant.remove(); marca.remove(); document.body.classList.remove('drag109'); d.el.classList.remove('src109');
    const bar = alvo(e.clientX, e.clientY);
    const origem = d.de === 'pal' ? null : barras[d.de];
    if (!bar) {
      if (origem) { origem.splice(d.i, 1); salvar(); desenhar(); msg('Ferramenta “' + (REG.get(d.key)?.t.l || '') + '” tirada da barra. Para pôr de volta: Ver → Personalizar barras.'); }
      return;
    }
    const dest = barras[bar.dataset.bar];
    let { i } = posicao(bar, e.clientX, e.clientY);
    if (origem) { origem.splice(d.i, 1); if (origem === dest && d.i < i) i--; }
    else if (d.key !== 'sep' && d.key !== 'spacer') { const j = dest.indexOf(d.key); if (j >= 0) { dest.splice(j, 1); if (j < i) i--; } }
    dest.splice(i, 0, d.key); salvar(); desenhar(); redraw();
  }, true);
  // teclado: Enter/Espaço nos botões das barras
  [flowBar, leftBar].forEach(bar => bar.addEventListener('click', e => { if (e.detail !== 0) return; const b = e.target.closest('[data-key]'); if (b) executar(b.dataset.key); }));

  // ---------- paleta (Ver → Personalizar barras)
  const pal = E('div', 'pal109', 'noPrint'); pal.hidden = true; document.body.append(pal);
  function abrirPaleta() {
    const grupos = [['Arquivo e cálculo', [...REG.values()].filter(r => r.cat === 'extra')]];
    for (const [c, C] of Object.entries(U.CATS)) {
      const it = []; for (const g of C.groups) for (const t of g[1]) { const k = keyOf(t); if (REG.get(k)?.cat === c && !it.some(x => x.key === k)) it.push(REG.get(k)); }
      if (it.length) grupos.push([U.CATNAME[c] || c, it]);
    }
    pal.innerHTML = `<div class="h109p"><b>Personalizar barras</b><span>Arraste uma ferramenta para a barra de cima ou para a da esquerda. Para tirar, arraste o ícone da barra para fora. Clique normal continua executando a ferramenta.</span><button type="button" class="x109p" title="Fechar">✕</button></div>
      <div class="b109p">${grupos.map(([n, it]) => `<h4>${esc(n)}</h4><div class="g109p">${it.map(r => `<div class="c109p" data-key="${esc(r.key)}" title="Arraste para uma barra">${icone(r.t, 20)}<span>${esc(NOME[r.key] || r.t.l)}</span></div>`).join('')}</div>`).join('')}
      <h4>Organização</h4><div class="g109p"><div class="c109p" data-key="sep">${svg('Separador', 20)}<span>Separador</span></div><div class="c109p" data-key="spacer"><span class="em109">⇕</span><span>Espaço (barra da esquerda)</span></div></div></div>
      <div class="f109p"><button type="button" class="r109p">↺ Restaurar o padrão</button><button type="button" class="ok109p">Pronto</button></div>`;
    pal.querySelector('.x109p').onclick = pal.querySelector('.ok109p').onclick = fecharPaleta;
    pal.querySelector('.r109p').onclick = restaurar;
    pal.hidden = false; document.body.classList.add('custom109');
  }
  function fecharPaleta() { pal.hidden = true; document.body.classList.remove('custom109'); }
  function restaurar() { barras = JSON.parse(JSON.stringify(PADRAO)); salvar(); desenhar(); redraw(); msg('Barras de volta ao padrão.'); }

  // ---------- fundo da área de desenho
  const temas = () => Object.entries(window.bg88?.THEMES || {});
  const temaAtual = () => window.bg88?.get?.().theme;
  const ORDEM_TEMA = ['escuro', 'preto', 'medio', 'claro', 'branco'];

  // ---------- menus
  const run = k => () => executar(k);
  const daCat = c => { const out = []; for (const g of U.CATS[c]?.groups || []) { if (!g[1].length) continue; out.push({ h: g[0] }); for (const t of g[1]) if (!String(t.t).startsWith('#')) out.push({ k: keyOf(t) }); } return out; };
  const ghostOn = () => LS('ghost74') === '1';
  const MENUS = [
    ['Arquivo', () => [{ k: 'x:Novo projeto' }, { k: 'x:Abrir projeto' }, { k: 'x:Salvar' }, { k: 'x:Exemplo didático' }, { s: 1 },
      { k: 'Conferir projeto|auditV48' }, { k: 'Diagnóstico (.txt)|downloadAuditV48' }, { s: 1 }, { k: 'x:Memorial de cálculo' }]],
    ['Editar', () => [{ k: 'x:Desfazer', d: 'Ctrl+Z' }, { k: 'x:Refazer', d: 'Ctrl+Y' }, { s: 1 }, { k: 'Selecionar|sel', d: 'Esc' }, { k: 'Apagar parede|deleteWall' }, { k: 'Desfazer exclusão|undoDelete' }]],
    ['Ver', () => [{ h: 'Vistas' }, ...Object.entries(U.VNAME).map(([v, n]) => ({ l: n, f: () => U.view(v), c: U.curView === v })), { s: 1 },
      { h: 'Fundo da área de desenho' }, ...temas().sort((a, b) => ORDEM_TEMA.indexOf(a[0]) - ORDEM_TEMA.indexOf(b[0])).map(([k, T]) => ({ l: T.nome, f: () => { window.bg88.set(k); toggles(); }, c: temaAtual() === k, sw: T.bg })),
      { s: 1 }, { l: 'Grade', f: () => { window.bg88.set(undefined, !window.bg88.get().grid); toggles(); }, c: !!window.bg88?.get?.().grid },
      { l: 'Traço fino', f: () => { window.fino108?.toggle(); toggles(); }, c: !!window.fino108?.on },
      { l: 'Fantasma do pavimento de baixo', f: () => { $('ghost74btn')?.click(); toggles(); }, c: ghostOn() },
      { k: 'x:Visibilidade' }, { k: 'Ver tudo|fit88' }, { l: 'Painel da direita', f: () => $('sideTg85')?.click(), c: !document.body.classList.contains('noside85') },
      { s: 1 }, { l: 'Personalizar barras…', f: abrirPaleta }, { l: 'Restaurar barras padrão', f: restaurar },
      { s: 1 }, { l: 'Voltar para a tela clássica', f: () => { LS('ui85', 'off'); location.reload(); } }]],
    ['Planta', () => daCat('arq')], ['Paredes', () => daCat('paredes')], ['Modulação', () => daCat('mod')], ['Elevações', () => daCat('elev')],
    ['Armaduras', () => [...daCat('arm'), { s: 1 }, { k: 'x:Vergas' }]], ['Laje', () => daCat('laje')], ['Cargas', () => daCat('cargas')],
    ['Cálculo', () => [{ k: 'x:Resistências' }, { k: 'x:Vento e contraventamento' }, { k: 'x:Vergas' }, { s: 1 }, { k: 'x:Memorial de cálculo' }]],
    ['Pranchas', () => daCat('pranchas')], ['3D', () => daCat('d3')], ['Quantitativos', () => daCat('quant')], ['Ajustes', () => daCat('ajustes')],
    ['Ajuda', () => [{ l: 'Como usar os resultados', f: () => U.view('help') }, { l: 'Personalizar barras…', f: abrirPaleta }]],
  ];
  mb.innerHTML = `<span class="logo109">ENGENHAR · <b>Alvenaria</b></span>${MENUS.map((m, i) => `<button type="button" class="m109" data-m="${i}">${m[0]}</button>`).join('')}
    <span class="proj109" id="proj109"></span><div class="dd109" id="dd109" hidden></div>`;
  const dd = $('dd109');
  let aberto = -1, itensMenu = [];
  function abrirMenu(i) {
    const btn = mb.querySelector(`[data-m="${i}"]`); if (!btn) return;
    aberto = i; mb.querySelectorAll('.m109').forEach(b => b.classList.toggle('on', b === btn));
    itensMenu = MENUS[i][1]();
    dd.innerHTML = itensMenu.map((it, j) => {
      if (it.s) return '<hr>';
      if (it.h) return `<div class="mh109">${esc(it.h)}</div>`;
      if (it.k) { const R = REG.get(it.k); if (!R) return ''; return `<button type="button" data-j="${j}">${icone(R.t, 16)}<span>${esc(NOME[it.k] || R.t.l)}</span>${it.d ? `<small>${it.d}</small>` : ''}</button>`; }
      return `<button type="button" data-j="${j}">${it.sw ? `<i class="sw109" style="background:${it.sw}"></i>` : `<span class="ck109">${it.c ? '✓' : ''}</span>`}<span>${esc(it.l)}</span>${it.sw && it.c ? '<small>✓</small>' : ''}</button>`;
    }).join('');
    const r = btn.getBoundingClientRect(); dd.style.left = Math.min(r.left, innerWidth - 300) + 'px'; dd.hidden = false;
  }
  function fecharMenus() { aberto = -1; dd.hidden = true; mb.querySelectorAll('.m109').forEach(b => b.classList.remove('on')); }
  mb.addEventListener('click', e => { const b = e.target.closest('.m109'); if (!b) return; const i = Number(b.dataset.m); if (aberto === i) fecharMenus(); else abrirMenu(i); });
  mb.addEventListener('mouseover', e => { const b = e.target.closest('.m109'); if (b && aberto >= 0 && Number(b.dataset.m) !== aberto) abrirMenu(Number(b.dataset.m)); });
  dd.addEventListener('click', e => { const b = e.target.closest('[data-j]'); if (!b) return; const it = itensMenu[Number(b.dataset.j)]; fecharMenus(); if (it.k) executar(it.k); else it.f?.(); });
  document.addEventListener('pointerdown', e => { if (aberto >= 0 && !e.target.closest('#mb109')) fecharMenus(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && aberto >= 0) fecharMenus(); });
  const nomeProj = () => { const p = ($('project')?.value || '').trim(); $('proj109').textContent = p || ''; };
  $('project')?.addEventListener('input', nomeProj); setInterval(nomeProj, 1500); nomeProj();

  // ---------- linha de comando: ferramenta, avisos da planta (antes por cima do desenho) e liga/desliga
  const st = $('stat85');
  if (st) {
    st.insertAdjacentHTML('afterbegin', '<span class="cmdL109">Comando ▸</span>');
    const hud = E('span', 'hudMsg109'); const sM = $('sMsg85'); st.insertBefore(hud, sM || null);
    // encaixe das pontas (V109): fica visível até a próxima geração
    const enc = E('span', 'enc109'); st.insertBefore(enc, sM || null);
    const mostrarEnc = () => { const e = state.enc109 || {}, a = e.ajustes || [], w = e.avisos || [];
      enc.textContent = a.length || w.length ? (a.length ? '⇥ ' + a.length + ' ponta(s) encaixada(s)' : '') + (a.length && w.length ? ' · ' : '') + (w.length ? '⚠ ' + w.length + ' parede(s) perto sem encostar' : '') : '';
      enc.title = [...a, ...w].join('\n'); enc.classList.toggle('w109', !!w.length); };
    window.addEventListener('encaixe109', mostrarEnc); mostrarEnc();
    enc.onclick = () => { const e = state.enc109 || {}; const l = [...(e.ajustes || []), ...(e.avisos || [])]; if (l.length) alert('Encaixe das pontas na última geração:\n\n' + l.join('\n')); };
    const tg = E('div', null, 'tg109'); st.append(tg);
    const copiar = () => { const h = document.querySelector('#hud88 .in88'); hud.textContent = h ? [...h.children].map(x => x.textContent.trim()).filter(Boolean).join(' · ') || h.textContent.trim() : ''; hud.title = hud.textContent; };
    const ligarHud = () => { const h = document.querySelector('#hud88 .in88'); if (!h) return false; new MutationObserver(copiar).observe(h, { childList: true, subtree: true, characterData: true }); copiar(); return true; };
    if (!ligarHud()) { const iv = setInterval(() => { if (ligarHud()) clearInterval(iv); }, 500); }
  }
  function toggles() {
    const t = $('stat85')?.querySelector('.tg109'); if (!t) return;
    const bg = window.bg88?.get?.() || {}, T = window.bg88?.THEMES?.[bg.theme];
    const B = [['ENCAIXE', $('snap')?.checked !== false, () => window.snap101?.toggle(), 'Encaixe nos pontos e nas paredes (F3)'],
      ['GRADE', !!bg.grid, () => window.bg88.set(undefined, !bg.grid), 'Grade da área de desenho'],
      ['TRAÇO FINO', !!window.fino108?.on, () => window.fino108?.toggle(), 'Linhas finas na planta'],
      ['FANTASMA', ghostOn(), () => $('ghost74btn')?.click(), 'Pavimento de baixo em fantasma']];
    const PM = { eixo: 'EIXO', faces: 'FACES', ambos: 'FACES + EIXO' }, pm = window.parede109?.get?.() || 'eixo';
    B.unshift(['PAREDE: ' + PM[pm], true, () => { const o = ['eixo', 'faces', 'ambos'], k = o[(o.indexOf(pm) + 1) % 3]; window.parede109?.set(k); }, 'Como a parede aparece na planta: só o eixo, as faces com hachura, ou os dois (clique para trocar)']);
    t.innerHTML = B.map((b, i) => `<button type="button" data-t="${i}" class="${b[1] ? 'on' : ''}" title="${b[3]}">${b[0]}</button>`).join('') +
      `<button type="button" class="fd109" title="Fundo da área de desenho">Fundo: ${esc(T?.nome || '—')} ▴</button>`;
    t.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { B[Number(b.dataset.t)][2](); setTimeout(toggles, 60); });
    t.querySelector('.fd109').onclick = e => { e.stopPropagation(); abrirMenu(2); dd.style.left = Math.max(0, innerWidth - 300) + 'px'; };
  }
  toggles(); setInterval(toggles, 2000);

  // ---------- faixa da categoria: só aparece quando uma categoria é aberta
  const rib = $('rib85');
  const ctx = () => { const on = U.curCat !== 'main'; if (document.body.classList.contains('ctx109') !== on) { document.body.classList.toggle('ctx109', on); setTimeout(redraw, 30); } marcar(); };
  if (rib) new MutationObserver(ctx).observe(rib, { childList: true });
  // resultado da modulação: o selo da barra abre o quadro (antes ficava fixo por cima)
  const dg = $('diag85');
  if (dg) dg.onclick = () => document.body.classList.toggle('prog109');

  // ---------- estilo
  const css = document.createElement('style');
  css.textContent = `
body.cad109{--t109:60px}body.cad109.ctx109{--t109:94px}
body.cad109 #top85{display:none!important}
#mb109{position:fixed;left:0;right:0;top:0;height:26px;z-index:72;display:flex;align-items:center;gap:1px;padding:0 6px;background:#102e4b;color:#dbe6f1;font:12.5px "Segoe UI",Arial,sans-serif}
#mb109 .logo109{font-weight:700;color:#fff;margin-right:12px;white-space:nowrap;letter-spacing:.3px}#mb109 .logo109 b{color:#f2b630}
#mb109 .m109{background:none;border:0;color:#dbe6f1;padding:3px 8px;border-radius:3px;font:inherit;cursor:pointer;margin:0;height:22px;box-shadow:none}
#mb109 .m109:hover,#mb109 .m109.on{background:#ffffff22;color:#fff}
#mb109 .proj109{margin-left:auto;padding-left:16px;color:#9fb6cc;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:0 1 auto}#mb109 .m109{flex:none}
#dd109{position:fixed;top:26px;min-width:260px;max-height:calc(100vh - 60px);overflow:auto;background:#fff;border:1px solid #b9c6d3;border-radius:0 0 7px 7px;box-shadow:0 10px 26px #0004;padding:4px;z-index:90;font:12.5px "Segoe UI",Arial,sans-serif}
#dd109[hidden]{display:none}#dd109 button{display:flex;align-items:center;gap:9px;width:100%;background:none;border:0;padding:5px 10px;border-radius:4px;text-align:left;color:#1b2b3a;cursor:pointer;margin:0;font:inherit;box-shadow:none;height:auto}
#dd109 button:hover{background:#e8f0f9}#dd109 button small{margin-left:auto;color:#8597aa;padding-left:18px}#dd109 hr{border:0;border-top:1px solid #e3e9ef;margin:4px 6px}
#dd109 .mh109{font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;color:#7b8ea3;padding:6px 10px 2px}#dd109 .ck109{width:16px;text-align:center;color:#1d8a4c;font-weight:700}
#dd109 .sw109{width:16px;height:12px;border-radius:2px;border:1px solid #9fb6cc;display:inline-block}#dd109 svg{flex:none}
#fl109{position:fixed;left:0;right:0;top:26px;height:34px;z-index:71;display:flex;align-items:center;gap:6px;padding:0 6px;background:#f7f9fb;border-bottom:1px solid #cfd8e2;font:12px "Segoe UI",Arial,sans-serif}
#flowBar109{display:flex;align-items:center;gap:1px;flex:1;min-width:0;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;height:34px}
#flowR109{display:flex;align-items:center;gap:6px;flex:none}
#flowR109 .lv85{display:flex;align-items:center;gap:4px;font-size:11.5px;color:#6b7f93;margin:0;white-space:nowrap}
#flowR109 select,#flowR109 input,#flowR109 button{height:24px;margin:0;padding:0 6px;border:1px solid #c2ced9;border-radius:4px;background:#fff;color:#1b2b3a;font:12px "Segoe UI",Arial,sans-serif;box-shadow:none}
#flowR109 select{max-width:200px}#flowR109 input#scale85{width:54px}#flowR109 #md94{border-color:#c2ced9;margin:0}#flowR109 #md94 button{background:#fff;color:#40566b;height:22px;border:0;border-radius:0}#flowR109 #md94 button.on,#flowR109 #md94 button[aria-pressed=true]{background:#1d8a4c!important;color:#fff!important;font-weight:700}#md94 button.on::before{content:'✓ '}#md94 button:not(.on):hover{background:#e3f1e7}#md94.busy94 button.on::after{content:' · trocando…';font-weight:400;opacity:.9}#md94.busy94{cursor:progress}
#flowR109 #vis87btn{width:28px;padding:0;display:grid;place-items:center}
#flowR109 #diag85{border-radius:12px;background:#e3f4ea;border-color:#9fd4b4;color:#17703d;font-weight:600;padding:0 10px}
#lb109{position:fixed;left:0;top:var(--t109);bottom:22px;width:38px;z-index:66;background:#f7f9fb;border-right:1px solid #cfd8e2}
#leftBar109{display:flex;flex-direction:column;align-items:center;gap:1px;padding:4px 0;height:100%;overflow-y:auto;overflow-x:hidden;scrollbar-width:none}
.b109{width:30px;height:30px;display:grid;place-items:center;border-radius:4px;position:relative;background:none;border:1px solid transparent;padding:0;margin:0;cursor:pointer;flex:none;touch-action:none;box-shadow:none}
.b109:hover{background:#e3ecf5;border-color:#c6d6e6}.b109.on{background:#d3e4f6;border-color:#8fb1d3}
.b109 .n109{position:absolute;top:0;left:2px;font-size:8.5px;font-style:normal;color:#7b8ea3;font-weight:700;line-height:1}
.b109 .em109,.c109p .em109{font-size:16px;line-height:1}
.gen109{width:auto;display:flex;gap:6px;padding:0 10px 0 6px;height:26px;background:#1d8a4c;border-color:#1d8a4c;color:#fff;font:600 12px "Segoe UI",Arial,sans-serif;margin:0 3px;white-space:nowrap}
.gen109 svg{stroke:#fff!important;color:#fff!important}.gen109:hover{background:#17703d;border-color:#17703d}.gen109.busy109{background:#a3361f;border-color:#a3361f}.gen109 .n109{color:#c8f0d6}
#lb109 .gen109 .gl109{display:none}#lb109 .gen109{width:30px;padding:0;justify-content:center;margin:0}
.geo109{width:auto;display:flex;gap:5px;padding:0 9px 0 5px;height:26px;background:#f2a516;border-color:#d58e0b;color:#1d1300;font:600 12px "Segoe UI",Arial,sans-serif;margin:0 3px;white-space:nowrap}.geo109 svg{stroke:#1d1300!important;color:#1d1300!important}.geo109:hover{background:#e09610!important;border-color:#b77908!important}.geo109.crit116{background:#c62828!important;border-color:#a01d1d!important;color:#fff}.geo109.crit116 svg{stroke:#fff!important}.geo109.ok116{background:#d7f0dd!important;border-color:#7cc08d!important}
#lb109 .geo109 .gl109{display:none}#lb109 .geo109{width:30px;padding:0;justify-content:center;margin:0}
.sp109{width:1px;height:20px;background:#cfd8e2;margin:0 4px;flex:none;touch-action:none;cursor:grab}#lb109 .sp109{width:22px;height:1px;margin:4px 0}
.spc109{flex:1;min-height:8px;min-width:8px;touch-action:none}
body.custom109 .bar109{outline:2px dashed #8fb1d3;outline-offset:-2px;background:#eef5fc}body.custom109 .spc109{background:repeating-linear-gradient(45deg,#d7e6f5 0 4px,transparent 4px 8px)}
body.custom109 .sp109{background:#7b8ea3}
.drop109.h{width:3px;height:26px;background:#f28c18;border-radius:2px;flex:none}.drop109.v{height:3px;width:28px;background:#f28c18;border-radius:2px;flex:none}
#ghost109{position:fixed;z-index:200;pointer-events:none;opacity:.9;box-shadow:0 4px 14px #0005;background:#fff;border-radius:5px;transition:transform .08s}
#ghost109.fora109{transform:scale(.85);opacity:.55;outline:2px solid #c4422b}
.src109{opacity:.35}body.drag109{cursor:grabbing!important;user-select:none}
#rib85{top:60px!important;height:34px!important;max-width:none!important;display:none!important;padding:0 6px!important;align-items:center!important;background:#eef3f8!important;border-bottom:1px solid #cfd8e2!important;z-index:65!important}
body.ctx109 #rib85{display:flex!important}
#rib85 .g85{flex-direction:row!important;align-items:center;padding:0 6px!important;gap:4px;border-right:1px solid #d5dee7}#rib85 .l85{display:none}
#rib85 .t85{align-items:center!important}#rib85 .tl85{width:auto!important;flex-direction:row!important;gap:5px!important;height:28px;padding:0 7px!important;font-size:11.5px!important;white-space:nowrap}
#rib85 .ic85{height:18px!important;line-height:18px!important;font-size:15px!important}#rib85 .ic85 svg{width:18px!important;height:18px!important}
#rib85 .back85{width:auto!important;background:#fff!important;border:1px solid #c2ced9!important}#rib85 .ctl85{flex-direction:row!important;gap:8px!important}#rib85 .ctl85 label{font-size:11px}#rib85 .ctl85 input,#rib85 .ctl85 select{height:24px!important}
#rib85 .note85{font-size:11px}
body.cad109 main{left:38px!important;right:var(--sw85)!important;top:var(--t109)!important;bottom:44px!important;border:0!important;border-radius:0!important}
#tabs85{top:auto!important;bottom:22px!important;left:38px!important;height:22px!important;padding:0!important;gap:0!important;background:#eef2f6!important;border-top:1px solid #cfd8e2;z-index:66!important}
#tabs85 button{height:22px!important;border:0!important;border-right:1px solid #d5dee7!important;border-radius:0!important;background:none!important;color:#4d6176!important;padding:0 12px!important;font-size:11.5px!important}
#tabs85 button.on{background:#212830!important;color:#fff!important;font-weight:600}#tabs85 #vtitle85{font-size:11px;color:#7b8ea3;padding:0 10px}#tabs85 #sideTg85{border-left:1px solid #d5dee7!important;width:30px!important}
#side85{top:var(--t109)!important;bottom:44px!important}
#stat85{height:22px!important;background:#fff!important;color:#24364a!important;border-top:1px solid #cfd8e2;gap:10px!important;padding:0 6px 0 10px!important;font:12px Consolas,"Courier New",monospace!important}
#stat85>span:has(#sLv85),#stat85>span:has(#sW85),#stat85>span:has(#sC85){display:none}
#stat85 .cmdL109{color:#1f6fc5;font-weight:700}#stat85 b{color:#102e4b!important}#stat85 #sT85{text-transform:uppercase}
#stat85>span{flex:none}#hudMsg109{color:#40566b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1 1 0!important}
#stat85 #sMsg85{margin-left:0!important;color:#a35a00!important;max-width:34vw;flex:0 1 auto!important;min-width:0;overflow:hidden;text-overflow:ellipsis}
#enc109{flex:none;color:#1d8a4c;cursor:pointer;font-weight:700}#enc109.w109{color:#c4422b}#enc109:empty{display:none}
#stat85 .tg109{display:flex;gap:3px;margin-left:auto;flex:none}#stat85 .tg109 button{height:17px;padding:0 7px;margin:0;border:0;border-radius:3px;background:#e6ecf2;color:#7b8ea3;font:700 10px Arial;letter-spacing:.4px;cursor:pointer;box-shadow:none}
#stat85 .tg109 button.on{background:#2a7fd4;color:#fff}#stat85 .tg109 .fd109{background:#fff;border:1px solid #9fb6cc;color:#174a78;margin-left:4px}
#hud88{display:none!important}
#progHost95{top:64px!important;display:none}body.prog109 #progHost95{display:block}
#card95{top:calc(var(--t109) + 8px)!important}
#pal109{position:fixed;left:50%;top:80px;transform:translateX(-50%);width:min(860px,calc(100vw - 40px));max-height:calc(100vh - 140px);display:flex;flex-direction:column;z-index:95;background:#fff;border:1px solid #b9c6d3;border-radius:10px;box-shadow:0 14px 36px #0005;font:12.5px "Segoe UI",Arial,sans-serif}
#pal109[hidden]{display:none}#pal109 .h109p{display:flex;gap:12px;align-items:flex-start;padding:10px 14px;background:#eef3f8;border-bottom:1px solid #d5dee7;border-radius:10px 10px 0 0}#pal109 .h109p b{font-size:14px;color:#102e4b;white-space:nowrap}
#pal109 .h109p span{color:#5b6f84;font-size:12px;flex:1}#pal109 .x109p{border:0;background:none;font-size:16px;cursor:pointer;margin:0;padding:0 4px;color:#40566b}
#pal109 .b109p{overflow:auto;padding:4px 14px 10px}#pal109 h4{margin:10px 0 5px;font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:#174a78}
#pal109 .g109p{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}#pal109 .c109p{display:flex;align-items:center;gap:8px;padding:5px 8px;border:1px solid #e3e9ef;border-radius:6px;background:#f7f9fb;cursor:grab;touch-action:none;user-select:none}
#pal109 .c109p:hover{border-color:#8fb1d3;background:#eef5fc}#pal109 .c109p svg{flex:none}
#pal109 .f109p{display:flex;justify-content:space-between;padding:8px 14px;border-top:1px solid #e3e9ef}#pal109 .f109p button{margin:0;height:28px;padding:0 14px;border-radius:5px;border:1px solid #c2ced9;background:#fff;color:#174a78;cursor:pointer}#pal109 .f109p .ok109p{background:#174a78;color:#fff;border-color:#174a78}
@media print{#mb109,#fl109,#lb109,#pal109,#dd109{display:none!important}}`;
  document.head.append(css);

  desenhar(); ctx();
  setTimeout(redraw, 120);
  window.cad109 = { barras: () => JSON.parse(JSON.stringify(barras)), padrao: PADRAO, restaurar, abrirPaleta, executar, REG };
})();
