// V85 — tela no padrão TQS / Eberick / CypeCAD: faixa fixa, barra principal com categorias, barra da categoria,
// área de desenho que não rola a página, painel de propriedades à direita e barra de status. Só interface: nenhum cálculo muda.
(function(){
'use strict';
const N=Number,E=(t,a={},h='')=>{const e=document.createElement(t);for(const[k,v]of Object.entries(a))e.setAttribute(k,v);if(h)e.innerHTML=h;return e;};
const main=document.querySelector('main');if(!main||!$('controls'))return;
let classic=false;try{classic=localStorage.getItem('ui85')==='off';}catch{}if(/classica/.test(location.hash)||window.__classic85)classic=true;
if(classic){const bx=document.querySelector('#v48ProjectPanel .toolbar')||$('v48ProjectPanel');if(bx){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='🖥 Usar a tela nova (V85)';b.onclick=()=>{try{localStorage.setItem('ui85','on');}catch{}location.hash='';location.reload();};bx.append(b);}return;}
const sec=[...$('controls').children].filter(e=>e.tagName==='SECTION');
const secBlocks=sec.find(s=>/Blocos/.test(s.querySelector('h2')?.textContent||'')),secWalls=sec.find(s=>/Paredes e aberturas/.test(s.querySelector('h2')?.textContent||''));
const secHelp=[...main.children].find(s=>s.tagName==='SECTION'&&/Como usar/.test(s.querySelector('h2')?.textContent||''));
const VIEWS={plan:$('projectSection37'),dados:$('projectSection37'),blocks:secBlocks,walls:secWalls,fiadas:$('output'),elev:$('output'),quant:$('output'),plot:$('plot26'),help:secHelp};
const VNAME={dados:'Dados do projeto',plan:'Planta',fiadas:'1ª / 2ª fiada',elev:'Elevações',quant:'Quantitativos',plot:'Pranchas',walls:'Lista de paredes',blocks:'Blocos e juntas'};
for(const v of new Set(Object.values(VIEWS)))if(v)v.classList.add('v85');

// ---------- estrutura
const top=E('div',{id:'top85',class:'noPrint'}),rib=E('div',{id:'rib85',class:'noPrint'}),tabs=E('div',{id:'tabs85',class:'noPrint'}),side=E('aside',{id:'side85',class:'noPrint'}),stat=E('div',{id:'stat85',class:'noPrint'});
document.body.prepend(top,rib,tabs);document.body.append(side,stat);document.body.classList.add('ui85');

// faixa fixa
top.innerHTML=`<span class="logo85">ENGENHAR <b>· Alvenaria</b> <small>V108.8</small></span>
<div class="menu85"><button type="button" id="pm85">☰ Projeto ▾</button><div id="pmList85" hidden></div></div>
<button type="button" id="save85" title="Salvar projeto (.json)">💾 Salvar</button><span class="sep85"></span>
<label class="lv85">Nível <span id="lvlHost85"></span><button type="button" id="lvUp85" title="Nível de cima">▲</button><button type="button" id="lvDn85" title="Nível de baixo">▼</button></label><span class="sep85"></span>
<label class="lv85" title="Escala de desenho das elevações e plantas">Escala 1: <span id="scHost85"></span></label><span class="sep85"></span>
<span id="genHost85"></span><span id="autoHost85"></span><button type="button" id="diag85" title="Ver o resultado da modulação e o que falta">📊 —</button>`;
{const o=$('lvlSel68'),px=E('select',{id:'lvl85'});$('lvlHost85').append(px);const sync=()=>{if(!o)return;px.innerHTML=o.innerHTML;px.selectedIndex=o.selectedIndex;};sync();if(o)new MutationObserver(sync).observe(o,{childList:true,subtree:true,attributes:true});o?.addEventListener('change',sync);px.onchange=()=>{if(!o)return;o.selectedIndex=px.selectedIndex;o.dispatchEvent(new Event('change',{bubbles:true}));upd();};window.lvlSync85=sync;}
{const o=$('scale'),px=E('input',{id:'scale85',type:'number',min:'1',step:'1'});$('scHost85').append(px);px.value=o?.value||'';px.onchange=()=>{if(!o)return;o.value=px.value;o.dispatchEvent(new Event('input',{bubbles:true}));o.dispatchEvent(new Event('change',{bubbles:true}));};setInterval(()=>{if(o&&document.activeElement!==px&&px.value!==o.value)px.value=o.value;},700);}
{const o=$('generate'),px=E('button',{type:'button',id:'gen85'});$('genHost85').append(px);const sync=()=>{const t=(o?.textContent||'').trim();px.textContent=/Cancelar/i.test(t)?'■ '+t:'▶ Gerar modulação';px.classList.toggle('busy85',/Cancelar/i.test(t));};sync();if(o)new MutationObserver(sync).observe(o,{childList:true,characterData:true,subtree:true});px.onclick=()=>o?.click();}if($('autoBadge71'))$('autoHost85').append($('autoBadge71'));
$('save85').onclick=()=>$('save').click();
const PM=[['＋ Começar meu projeto',()=>$('newProject').click()],['📂 Abrir projeto salvo',()=>$('restore').click()],['💾 Salvar projeto (.json)',()=>$('save').click()],['🎓 Exemplo didático',()=>$('example').click()],['🔎 Conferir projeto',()=>$('auditV48').click()],['⬇ Baixar diagnóstico',()=>$('downloadAuditV48').click()],['❔ Como usar os resultados',()=>view('help')],['🗔 Voltar para a tela clássica',()=>{try{localStorage.setItem('ui85','off');}catch{}location.reload();}]];
$('pmList85').innerHTML=PM.map((x,k)=>`<button type="button" data-k="${k}">${x[0]}</button>`).join('');
$('pmList85').onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;$('pmList85').hidden=true;PM[N(b.dataset.k)][1]();};
$('pm85').onclick=e=>{e.stopPropagation();$('pmList85').hidden=!$('pmList85').hidden;};document.addEventListener('click',e=>{if(!e.target.closest('.menu85'))$('pmList85').hidden=true;});
const lvStep=d=>{const s=$('lvlSel68');if(!s)return;const k=Math.max(0,Math.min(s.options.length-1,s.selectedIndex+d));if(k===s.selectedIndex)return;s.selectedIndex=k;s.dispatchEvent(new Event('change',{bubbles:true}));window.lvlSync85?.();upd();};
$('lvUp85').onclick=()=>lvStep(1);$('lvDn85').onclick=()=>lvStep(-1);
$('diag85').onclick=()=>{cat('mod');view('fiadas');side.querySelector('#genBox85')?.scrollIntoView({block:'start'});};

// ---------- ferramentas: cada botão aciona o botão original (a lógica continua a mesma)
const byText=(root,re)=>[...(root?.querySelectorAll('button')||[])].find(b=>re.test(b.textContent));
const grp77=document.querySelector('.grp77'),idf=(el,id)=>{if(el&&!el.id)el.id=id;return el?.id;};
idf(byText(grp77,/Laje e ações/),'ldCfg85');idf(byText(grp77,/Planta de cargas/),'ldMap85');idf(byText(grp77,/Lajes maciças/),'ldSlab85');idf(byText(grp77,/Configurações/),'ldSet85');
idf(byText(document.querySelector('.lvlGrp68'),/Limpar marcas/),'contClr85');
const ldT=t=>()=>document.querySelector('.grp77 [data-t="'+t+'"]'),stM=m=>()=>document.querySelector('#st83 [data-m="'+m+'"]')||document.querySelector('[data-m="'+m+'"]');
// [ícone, rótulo, alvo (id | função que devolve o elemento | ação), modo?, vista ao usar]
const T=(ic,l,t,o={})=>({ic,l,t,...o});
// V87.2 — olhinho: mostra / esconde lajes e cargas na planta (um clique)
const ldOn85=()=>{const c=$('ld77show');if(c)return !!c.checked;return !!state.loads77?.cfg?.show;};
function ldEye85(){const c=$('ld77show');if(c){c.click();}else{state.loads77??={};state.loads77.cfg??={};state.loads77.cfg.show=!state.loads77.cfg.show;try{drawPlan();}catch{}}
 const on=ldOn85();document.querySelectorAll('#rib85 .tl85[title="Lajes e cargas"]').forEach(b=>{b.classList.toggle('off85',!on);const ic=b.querySelector('.ic85');if(ic)ic.innerHTML=ICON85['Lajes e cargas'];});
 try{msg(on?'Lajes e cargas visíveis na planta.':'Lajes e cargas ocultas na planta (clique no olhinho para mostrar de novo).');}catch{}return undefined;}
window.ldEye85=ldEye85;
const CATS={
 main:{groups:[['Uso diário',[T('↖','Selecionar','sel'),T('👁','Lajes e cargas',ldEye85,{v:'plan'}),T('✏','Nova parede',()=>{window.wall101?.start();},{v:'plan'}),T('🧲','Encaixe',()=>{window.snap101?.toggle();}),T('▭','Novo vão','newvao54',{mode:1,v:'plan'}),T('⛶','Ver tudo','fit88',{v:'plan'})]],
  ['Categorias',[T('🧱','Paredes','#paredes'),T('📄','Arquitetura','#arq'),T('▤','Modulação','#mod'),T('▥','Elevações','#elev'),T('⫘','Armaduras','#arm'),T('▦','Laje','#laje'),T('⬇','Cargas','#cargas'),T('📐','Pranchas','#pranchas'),T('🧊','3D','#d3'),T('📊','Quantitat.','#quant'),T('⚙','Ajustes','#ajustes')]]]},
 paredes:{v:'plan',groups:[['Parede',[T('✏','Nova parede',()=>{window.wall101?.start();}),T('🧲','Encaixe',()=>{window.snap101?.toggle();}),T('▦','Propor paredes','detect'),T('⌐','Unir','join56',{mode:1}),T('✥','Mover',()=>{window.move108?.start();}),T('↔','Mover p/ eixo','axis56',{mode:1}),T('✂','Aparar','trim88',{mode:1}),T('⟷','Estender','extend88',{mode:1}),T('⇅','Desníveis','dn87btn',{mode:1}),T('✖','Apagar parede','deleteWall'),T('↶','Desfazer exclusão','undoDelete')]],
  ['Aberturas',[T('＋','Novo vão','newvao54',{mode:1}),T('▭','Adicionar abertura','openingBtn'),T('⌕','Procurar portas/janelas','rescan54')]],
  ['Conferência',[T('#','Numerar','numberWalls'),T('◧','Internas / externas','classifyWalls24'),T('🎨','Cores','color71'),T('▦','Fundo','bg88btn'),T('☰','Lista de paredes','@walls'),T('＋','Parede pela lista','addWall',{v:'walls'})]]]},
 arq:{v:'plan',groups:[['Planta',[T('📂','Abrir PDF / DXF / IFC','pdf'),T('📏','Calibrar escala','scaleBtn',{mode:1})]],['',[],['page','reference']],
  ['Pavimentos',[T('⌖','Ponto de origem','orig74btn',{mode:1}),T('⊙','Origem 0,0 do DXF','dxf00btn74'),T('⤢','Alinhar com o de baixo',()=>{window.align100?.start();}),T('✕','Apagar origem','origDel74'),T('◐','Fantasma de baixo','ghost74btn'),T('⇅','Conferir pontos','cont72btn'),T('✕','Limpar marcas','contClr85')]],
  ['Projeto',[T('🏷','Dados e níveis','@dados')]]]},
 mod:{v:'fiadas',groups:[['Modulação',[T('▶','Gerar','gen85'),T('🔎','Conferir antes','check71btn'),T('🛠','Corrigir todas',()=>window.fixAll84?.()),T('🔓','Destravar todas','unlockAll76')]],
  ['Ver',[T('▤','1ª / 2ª fiada','@fiadas'),T('▥','Elevações','@elev'),T('☰','Lista de paredes','@walls'),T('📐','Cotas','dimensionsSettings24')]],
  ['Projeto',[T('🔎','Conferir projeto','auditV48'),T('⬇','Diagnóstico (.txt)','downloadAuditV48')]]]},
 elev:{v:'elev',groups:[['Elevações',[T('✏','Editar elevação',()=>{const i=window.sel85?.();if(i>=0&&state.results?.[i]?.rows?.length){window.ed86?.open(i);}else{msg('Escolha a parede no painel da direita (ou clique nela na planta) e clique em ✏ Editar elevação.');}}),T('▥','Ver elevações','@elev'),T('▤','1ª / 2ª fiada','@fiadas'),T('📐','Cotas','dimensionsSettings24')]]]},
 arm:{v:'elev',groups:[['Armaduras',[T('✏','Editar armaduras',()=>{const i=window.sel85?.();if(i>=0&&state.results?.[i]?.rows?.length){window.st91?.open(i);}else{msg('Escolha a parede no painel da direita (ou clique nela na planta) e clique em ✏ Editar armaduras.');}})]],['Ver',[T('▥','Elevações','@elev'),T('📊','Resumo de aço','@quant')]]]},
 laje:{v:'plan',groups:[['Laje',[T('👁','Lajes e cargas',ldEye85),T('▦','Painel de laje',ldT('panel'),{mode:1}),T('╱','Linha divisória',ldT('div'),{mode:1}),T('⌒','Beiral / balanço',ldT('edge'),{mode:1}),T('✎','Editar / excluir',ldT('edit'),{mode:1})]],['',[],['ld77tgt']],
  ['Reforço',[T('┉','Reforço / Viga',()=>{window.el97?.open();}),T('⊠','Abertura na laje',()=>{window.el97?.open();window.el97?.start('hole');}),T('⊥','Negativo',()=>{window.arm106?.start();})]],
  ['Lajes',[T('⚙','Laje e ações do pavimento','ldCfg85'),T('▤','Maciças · cálculo e armação','ldSlab85')]]]},
 cargas:{v:'plan',groups:[['Ações',[T('👁','Lajes e cargas',ldEye85),T('▭','Retângulo',ldT('rect'),{mode:1}),T('⬠','Polígono',ldT('poly'),{mode:1}),T('━','Carga linear',ldT('line'),{mode:1}),T('●','Concentrada',ldT('point'),{mode:1}),T('✎','Editar / excluir',ldT('edit'),{mode:1})]],['',[],['ld77tgt']],
  ['Resultados',[T('📊','Planta de cargas','ldMap85'),T('🧱','Resistências',()=>{window.res96?.open();}),T('⚙','Configurações','ldSet85')]]],sideCtl:['ld77show','ld77infl']},
 pranchas:{v:'plot',groups:[['Pranchas',[T('🖨','PDF','plotPDF26'),T('📐','DXF','plotDXF36'),T('Aa','Tamanho dos textos',()=>{window.txt85open?.();})]]],note:'Formato, escalas e carimbo ficam no topo da área das pranchas.'},
 d3:{v:'plan',groups:[['3D e pavimentos',[T('🧊','Ver em 3D','v3d74btn'),T('◐','Fantasma de baixo','ghost74btn'),T('📥','Importar IFC','ifc74btn'),T('⇅','Conferir pontos','cont72btn')]]]},
 quant:{v:'quant',groups:[['Quantitativos',[T('📊','Excel','xlBtn73'),T('🧱','Resistências',()=>{window.res96?.open();})]],['',[],['lossB73','lossS73']]]},
 ajustes:{v:'blocks',groups:[['Ajustes',[T('🧱','Blocos e juntas','@blocks'),T('🏷','Dados do projeto','@dados'),T('Aa','Textos das pranchas',()=>{window.txt85open?.();})]]],sideCtl:['detectWidth','snapRadius','minimum','maxCut23','allowCuts23','snap']}};

// V86.2 — ícones de traço, todos no mesmo estilo (Armaduras = estribo com gancho)
const SV=d=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
const ESTRIBO=SV('<rect x="5.6" y="2.6" width="12.8" height="18.8" rx="2.4" stroke-width="1.6"/><rect x="7.2" y="4.2" width="9.6" height="15.6" rx="1.2" stroke-width=".9"/><path d="M6.5 3.7 12.2 9.4" stroke-width="2.3"/><path d="M6.5 3.7 12.2 9.4" stroke-width=".9" stroke="#fff"/><path d="M5.9 6.2 10.6 10.9" stroke-width="2.3"/><path d="M5.9 6.2 10.6 10.9" stroke-width=".9" stroke="#fff"/>');
const ICON85={
 'Desníveis':SV('<path d="M3 8h6v4h6v4h6"/><path d="M6 3v3M4.5 4.5 6 3l1.5 1.5"/><path d="M18 21v-3M16.5 19.5 18 21l1.5-1.5"/>'),
 'Selecionar':SV('<path d="M6 3.5 18 11l-5.6 1.4L10 18.2z"/><path d="M12.4 12.4 16.5 18"/>'),
 'Parede':SV('<rect x="2.5" y="9" width="19" height="6" rx=".6"/><path d="M6 9v6M10.5 9v6M15 9v6M19 9v6" stroke-width="1"/><path d="M15.5 3.5 19 7l-6 1z" stroke-width="1.3"/>'),
 'Novo vão':SV('<path d="M4 21V4h11v17"/><path d="M4 21h16"/><path d="M15 4a11 11 0 0 1 0 17" stroke-dasharray="2 2" stroke-width="1.2"/><circle cx="12.3" cy="12.6" r=".8" fill="currentColor"/>'),
 'Fundo':SV('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke-width=".9"/>'),
 'Ver tudo':SV('<path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5" stroke-width="1.8"/><rect x="7.5" y="7.5" width="9" height="9" rx=".8" stroke-width="1.2"/>'),
 'Aparar':SV('<path d="M6 3v18M18 3v18" stroke-width="1.4"/><path d="M2 12h4M18 12h4" stroke-width="3"/><path d="M7.5 12h9" stroke-width="1.6" stroke-dasharray="1.8 1.6" opacity=".55"/><path d="m10 8.5 4 7M14 8.5l-4 7" stroke-width="1.3"/>'),
 'Zoom +':SV('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M10.5 7.5v6M7.5 10.5h6"/>'),
 'Zoom −':SV('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M7.5 10.5h6"/>'),
 'Paredes':SV('<rect x="2.5" y="4" width="19" height="16" rx="1"/><path d="M2.5 9.3h19M2.5 14.7h19M9 4v5.3M16 4v5.3M5.5 9.3v5.4M12.5 9.3v5.4M19 9.3v5.4M9 14.7V20M16 14.7V20" stroke-width="1.2"/>'),
 'Arquitetura':SV('<path d="M5 2.8h10l4 4v14.4H5z"/><path d="M15 2.8v4h4"/><path d="M8 11h8v6.5H8zM12 11v6.5M8 14h4" stroke-width="1.2"/>'),
 'Modulação':SV('<rect x="2.5" y="5" width="19" height="14" rx="1"/><path d="M2.5 9.7h19M2.5 14.3h19" stroke-width="1.2"/><path d="M8 5v4.7M14.5 5v4.7M5 9.7v4.6M11.3 9.7v4.6M18 9.7v4.6M8 14.3V19M14.5 14.3V19" stroke-width="1.2"/>'),
 'Elevações':SV('<path d="M3 20.5h18"/><rect x="4.5" y="6" width="15" height="14.5"/><path d="M4.5 10.8h15M4.5 15.6h15M9.5 6v4.8M14.5 6v4.8M7 10.8v4.8M12 10.8v4.8M17 10.8v4.8M9.5 15.6v4.9M14.5 15.6v4.9" stroke-width="1.1"/><path d="M3 3.5h18" stroke-width="1.2" stroke-dasharray="1.5 1.8"/>'),
 'Armaduras':ESTRIBO,
 'Laje':SV('<path d="M2.5 14.5 8 9.5h13.5L16 14.5z"/><path d="M2.5 14.5v2.5H16l5.5-5v-2.5M16 14.5V17" stroke-width="1.3"/><path d="M6 12.4h12" stroke-width="1.1"/>'),
 'Cargas':SV('<path d="M3 19.5h18"/><path d="M6 4v10M12 4v10M18 4v10" stroke-width="1.5"/><path d="m4 11.5 2 2.6 2-2.6M10 11.5l2 2.6 2-2.6M16 11.5l2 2.6 2-2.6"/><path d="M4 4h16" stroke-width="1.2"/>'),
 'Pranchas':SV('<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M13 15.2h8M13 15.2V20M16.5 15.2V20" stroke-width="1.2"/><path d="M5.5 6.5h6v6h-6zM8.5 6.5v6" stroke-width="1.1"/>'),
 '3D':SV('<path d="M12 2.8 20 7.2v9.6L12 21.2 4 16.8V7.2z"/><path d="M4 7.2 12 11.6l8-4.4M12 11.6v9.6" stroke-width="1.3"/>'),
 'Quantitat.':SV('<path d="M3.5 20.5h17"/><rect x="5" y="12" width="3" height="8.5"/><rect x="10.5" y="7" width="3" height="13.5"/><rect x="16" y="3.5" width="3" height="17"/>'),
 'Ajustes':SV('<path d="M4 6.5h16M4 12h16M4 17.5h16" stroke-width="1.3"/><circle cx="9" cy="6.5" r="2" fill="#fff"/><circle cx="15.5" cy="12" r="2" fill="#fff"/><circle cx="7" cy="17.5" r="2" fill="#fff"/>')};
ICON85['Editar aço']=ESTRIBO;
// V87.1 — todos os ícones no mesmo traço fino + cor sutil por família
const WALLBAR='<rect x="2.5" y="10" width="19" height="5" rx=".6"/><path d="M7 10v5M12 10v5M17 10v5" stroke-width="1"/>';
Object.assign(ICON85,{
 'Nova parede':SV('<rect x="2.5" y="12" width="13" height="5" rx=".6"/><path d="M6.5 12v5M10.5 12v5" stroke-width="1"/><path d="M14 9.5 19.5 4l2 2-5.5 5.5-2.6.6z" stroke-width="1.4"/>'),
 'Propor paredes':SV('<rect x="3" y="3" width="18" height="18" rx="1" stroke-dasharray="2.2 2" stroke-width="1.2"/><path d="M3 12h9V3" stroke-width="2.2"/><path d="M16 15.5l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" stroke-width="1.1"/>'),
 'Unir':SV('<path d="M4 6v13h13" stroke-width="2.4"/><path d="M9 3.5v6M6 6.5h6" stroke-width="1.1"/><circle cx="4" cy="19" r="1.6" fill="currentColor"/>'),
 'Mover':SV('<path d="M12 3v18M3 12h18"/><path d="M9.5 5.5 12 3l2.5 2.5M9.5 18.5 12 21l2.5-2.5M5.5 9.5 3 12l2.5 2.5M18.5 9.5 21 12l-2.5 2.5"/>'),'Mover p/ eixo':SV('<rect x="3" y="4" width="18" height="5" rx=".6"/><path d="M3 16.5h18" stroke-dasharray="3 1.6 .6 1.6"/><path d="M12 10.5v4.5M10 13l2 2 2-2"/>'),
 'Estender':SV('<path d="M2.5 12h9" stroke-width="3"/><path d="M11.5 12h8" stroke-dasharray="1.8 1.6"/><path d="m17 9 3 3-3 3"/><path d="M21.5 6v12" stroke-width="1.2"/>'),
 'Apagar pedaço':SV('<path d="M2.5 12h5M16.5 12h5" stroke-width="3"/><path d="M8.5 12h7" stroke-dasharray="1.6 1.6"/><circle cx="9" cy="5.5" r="2"/><circle cx="15" cy="5.5" r="2"/><path d="M10.4 7 14 18.5M13.6 7 10 18.5" stroke-width="1.3"/>'),
 'Apagar parede':SV(WALLBAR+'<path d="m6 4 12 18M18 4 6 22" stroke-width="2"/>'),
 'Desfazer exclusão':SV('<path d="M8 7.5 4 11.5l4 4"/><path d="M4 11.5h10a5.5 5.5 0 0 1 0 11h-3" transform="translate(0 -3)"/>'),
 'Adicionar abertura':SV('<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 12h16M12 4v16" stroke-width="1.1"/><path d="M17 1.8v4.4M14.8 4h4.4" stroke-width="1.5"/>'),
 'Procurar portas/janelas':SV('<path d="M3 21V5h8v16" stroke-width="1.3"/><circle cx="15.5" cy="11.5" r="4.5"/><path d="m19 15 3 3"/>'),
 'Numerar':SV('<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M8 8.5 7 15.5M12.5 8.5l-1 7M6 10.5h7.5M5.5 13.5h7.5" stroke-width="1.2"/><path d="M16 9.5l1.8-1.3v7.3" stroke-width="1.3"/>'),
 'Internas / externas':SV('<rect x="3" y="3" width="18" height="18" rx="1" stroke-width="2.6"/><rect x="8" y="8" width="8" height="8" stroke-width="1.1" stroke-dasharray="1.6 1.4"/>'),
 'Cores':SV('<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2.2-.6-1.4.4-2.8 1.9-2.8H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3z"/><circle cx="7.5" cy="11" r="1.3"/><circle cx="10" cy="7" r="1.3"/><circle cx="15" cy="7.2" r="1.3"/>'),
 'Lista de paredes':SV('<path d="M9 6h12M9 12h12M9 18h12" stroke-width="1.5"/><rect x="3" y="4.5" width="3" height="3"/><rect x="3" y="10.5" width="3" height="3"/><rect x="3" y="16.5" width="3" height="3"/>'),
 'Parede pela lista':SV('<path d="M9 6h12M9 12h7M9 18h5" stroke-width="1.5"/><rect x="3" y="4.5" width="3" height="3"/><rect x="3" y="10.5" width="3" height="3"/><path d="M19 15v6M16 18h6"/>'),
 'Abrir PDF / DXF / IFC':SV('<path d="M3 19.5V6a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v2"/><path d="M3 19.5 6 11h16l-3 8.5z"/>'),
 'Calibrar escala':SV('<rect x="2" y="8" width="20" height="8" rx="1" transform="rotate(-20 12 12)"/><path d="m6.2 13.3-.8-2.2M9.6 12.1l-1.2-3.3M13 10.9l-.8-2.2M16.4 9.7l-1.2-3.3" stroke-width="1.1"/>'),
 'Ponto de origem':SV('<circle cx="12" cy="12" r="6"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>'),
 'Origem 0,0 do DXF':SV('<path d="M5 3v16h16" stroke-width="1.6"/><path d="M3 5l2-2 2 2M19 17l2 2-2 2" stroke-width="1.3"/><circle cx="5" cy="19" r="2" fill="currentColor"/>'),
 'Apagar origem':SV('<circle cx="10" cy="10" r="5"/><path d="M10 2v4M10 14v4M2 10h4M14 10h4" stroke-width="1.3"/><path d="m15 15 6 6M21 15l-6 6" stroke-width="1.8"/>'),
 'Fantasma de baixo':SV('<path d="M4 15.5 12 20l8-4.5" stroke-dasharray="2 1.6"/><path d="M4 9.5 12 14l8-4.5L12 5z"/>'),
 'Conferir pontos':SV('<path d="M4 18.5 12 22l8-3.5" stroke-dasharray="2 1.6" stroke-width="1.2"/><path d="M4 7.5 12 11l8-3.5L12 4z"/><path d="M12 11v8.5" stroke-dasharray="1.4 1.4" stroke-width="1.2"/><path d="m8.5 15.5 2 2 4-4.5" stroke-width="1.6"/>'),
 'Limpar marcas':SV('<path d="M14.5 3.5 20.5 9.5 11 19H5.5l-2-2z"/><path d="m9 9 6 6M5.5 19h15" stroke-width="1.3"/>'),
 'Dados e níveis':SV('<path d="M3 20h18"/><path d="M5 20v-5h5v-5h5V5h4" stroke-width="1.4"/><path d="m18 2.5 2.5 2.5L18 7.5" stroke-width="1.2"/>'),
 'Gerar':SV('<path d="M7 4.5v15l12-7.5z" fill="currentColor" fill-opacity=".14"/>'),
 'Conferir antes':SV('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/><path d="m7.6 10.7 2 2 3.6-4" stroke-width="1.5"/>'),
 'Corrigir todas':SV('<path d="M14.5 3.8a5 5 0 0 0-6.2 6.5L3 15.6 5.4 18l5.3-5.3a5 5 0 0 0 6.5-6.2l-3 3-2.4-.6-.6-2.4z"/><path d="m15 17 2 2 4-4.5" stroke-width="1.6"/>'),
 'Destravar todas':SV('<rect x="4" y="11" width="13" height="10" rx="1.5"/><path d="M8 11V7a4.5 4.5 0 0 1 8.7-1.6"/><circle cx="10.5" cy="16" r="1.2" fill="currentColor"/>'),
 '1ª / 2ª fiada':SV('<rect x="2.5" y="13" width="19" height="6" rx=".6"/><path d="M8 13v6M14.5 13v6" stroke-width="1"/><rect x="2.5" y="5" width="19" height="6" rx=".6"/><path d="M5 5v6M11 5v6M17.5 5v6" stroke-width="1"/>'),
 'Cotas':SV('<path d="M3 6v6M21 6v6M3 9h18"/><path d="m5.5 7.3-2.5 1.7 2.5 1.7M18.5 7.3 21 9l-2.5 1.7" stroke-width="1.2"/><path d="M8 17h8M12 15v4" stroke-width="1.1"/>'),
 'Conferir projeto':SV('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="m9 14 2.2 2.2 4.3-4.6" stroke-width="1.6"/>'),
 'Diagnóstico (.txt)':SV('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M12.5 10v7M9.5 14l3 3 3-3" stroke-width="1.4"/>'),
 'Editar elevação':SV('<rect x="2.5" y="8" width="15" height="12" rx=".6"/><path d="M2.5 12h15M2.5 16h15M8 8v4M13 8v4M5.5 12v4M10.5 12v4M15 12v4M8 16v4M13 16v4" stroke-width=".9"/><path d="M15.5 9.5 20.5 4.5l2 2-5 5-2.6.6z" stroke-width="1.4"/>'),
 'Ver elevações':ICON85['Elevações'],
 'Resumo de aço':SV('<path d="M3.5 20.5h17"/><path d="M6 17V8M10 17V5M14 17v-6M18 17V9" stroke-width="2.4"/>'),
 'Separar':SV('<path d="M2.5 12h6M15.5 12h6" stroke-width="2.4"/><circle cx="9" cy="5.5" r="2"/><circle cx="15" cy="5.5" r="2"/><path d="M10.4 7 14 18.5M13.6 7 10 18.5" stroke-width="1.3"/>'),
 'arm:Unir':SV('<path d="M2.5 9h9M12.5 15h9" stroke-width="2.4"/><path d="M11.5 9q3 0 1 6" stroke-width="1.3" stroke-dasharray="1.4 1.2"/>'),
 'Painel de laje':SV('<path d="M2.5 15 8 9.5h13.5L16 15z"/><path d="M2.5 15v2.5H16l5.5-5.5V9.5M16 15v2.5" stroke-width="1.2"/><circle cx="12" cy="12.3" r="1.4" fill="currentColor"/>'),
 'Linha divisória':SV('<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M12 4v16" stroke-dasharray="2.4 1.6" stroke-width="1.6"/>'),
 'Beiral / balanço':SV('<path d="M3 20V9h4"/><path d="M3 9h18v2.5H7" stroke-width="1.5"/><path d="M7 11.5V20" stroke-width="1.2"/><path d="m14 15 4 0M16.5 13.5 18 15l-1.5 1.5" stroke-width="1.1"/>'),
 'Editar / excluir':SV('<path d="M4 20h4.5L19.5 9 15 4.5 4 15.5z"/><path d="m13 6.5 4.5 4.5" stroke-width="1.2"/>'),
 'Laje e ações do pavimento':SV('<path d="M2.5 17 7 12.5h14.5L17 17z"/><path d="M8 3v6M12 3v6M16 3v6" stroke-width="1.3"/><path d="m6.5 7.5 1.5 1.8 1.5-1.8M10.5 7.5l1.5 1.8 1.5-1.8M14.5 7.5l1.5 1.8 1.5-1.8" stroke-width="1.2"/>'),
 'Maciças · cálculo e armação':SV('<path d="M2.5 14 7 9.5h14.5L17 14z"/><path d="M2.5 14v3H17l4.5-4.5v-3M17 14v3" stroke-width="1.2"/><path d="M6 11.8h12M9 10.2l-2.5 3M13 10.2l-2.5 3M17 10.2l-2.5 3" stroke-width="1"/>'),
 'Retângulo':SV('<rect x="4" y="6" width="16" height="12" rx=".8" fill="currentColor" fill-opacity=".12"/>'),
 'Polígono':SV('<path d="M12 3.5 20.5 9.5 17.5 20h-11L3.5 9.5z" fill="currentColor" fill-opacity=".12"/>'),
 'Carga linear':SV('<path d="M3 19h18" stroke-width="2.4"/><path d="M6 5v9M12 5v9M18 5v9" stroke-width="1.2"/><path d="m4.3 12 1.7 2.2L7.7 12M10.3 12l1.7 2.2 1.7-2.2M16.3 12l1.7 2.2 1.7-2.2" stroke-width="1.2"/>'),
 'Concentrada':SV('<path d="M12 3v13"/><path d="m8.5 12.5 3.5 4 3.5-4"/><circle cx="12" cy="19.5" r="1.8" fill="currentColor"/>'),
 'Reforço / Viga':SV('<path d="M3 9h18M3 15h18" stroke-width="1.4"/><circle cx="7" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="17" cy="12" r="1.2" fill="currentColor"/>'),
 'Negativo':SV('<path d="M4 9v3h16V9" stroke-width="1.7"/><path d="M12 14v7" stroke-dasharray="2 1.6"/>'),
 'Abertura na laje':SV('<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 4l16 16M20 4 4 20" stroke-width="1.1"/>'),
 'Alinhar com o de baixo':SV('<rect x="3" y="12" width="9" height="9" stroke-dasharray="2 1.5"/><rect x="12" y="3" width="9" height="9"/><path d="M7.5 16.5 16.5 7.5M12.5 7.5h4v4" stroke-width="1.4"/>'),
 'Encaixe':SV('<path d="M6 4v7a6 6 0 0 0 12 0V4h-4v7a2 2 0 0 1-4 0V4z" stroke-width="1.4"/><path d="M6 7h4M14 7h4" stroke-width="1.4"/>'),
 'Resistências':SV('<rect x="3" y="13" width="8" height="7" rx=".5"/><rect x="13" y="13" width="8" height="7" rx=".5"/><rect x="8" y="5" width="8" height="7" rx=".5"/><path d="M12 2v2.5" stroke-width="1.8"/>'),
 'Planta de cargas':SV('<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 12h18M12 3v18" stroke-width="1"/><path d="M6 9.5v-4M9 9.5V7M15 9.5V5M18 9.5V6.5" stroke-width="1.8"/>'),
 'Configurações':ICON85['Ajustes'],
 'PDF':SV('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M8.5 16.5v-5h1.8a1.4 1.4 0 0 1 0 2.8H8.5M13 11.5v5h1.2a2.5 2.5 0 0 0 0-5z" stroke-width="1.1"/>'),
 'DXF':SV('<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M6 16 10 8l4 5 4-3" stroke-width="1.3"/><circle cx="6" cy="16" r="1" fill="currentColor"/><circle cx="18" cy="10" r="1" fill="currentColor"/>'),
 'Tamanho dos textos':SV('<path d="m3 19 5.5-14L14 19M5 14h7"/><path d="m15 19 3-7.5 3 7.5M16 16.5h4" stroke-width="1.3"/>'),
 'Textos das pranchas':SV('<rect x="3" y="4" width="18" height="16" rx="1"/><path d="m6.5 15.5 2.8-7 2.8 7M7.6 13h3.4" stroke-width="1.3"/><path d="M14 9.5h4M14 12.5h4M14 15.5h3" stroke-width="1.1"/>'),
 'Ver em 3D':ICON85['3D'],
 'Importar IFC':SV('<path d="M12 2.8 20 7.2v9.6L12 21.2 4 16.8V7.2z" stroke-width="1.3"/><path d="M12 6.5v8M8.8 11.5l3.2 3.2 3.2-3.2" stroke-width="1.6"/>'),
 'Excel':SV('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M3 9h18M3 15h18M9 3v18" stroke-width="1"/><path d="m12 10.8 4.5 6M16.5 10.8l-4.5 6" stroke-width="1.6"/>'),
 'Blocos e juntas':SV('<rect x="2.5" y="6" width="9" height="5" rx=".5"/><rect x="12.5" y="6" width="9" height="5" rx=".5"/><rect x="7" y="13" width="9" height="5" rx=".5"/>'),
 'Dados do projeto':SV('<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5" stroke-width="1.3"/>'),
 'Principal':SV('<path d="M15 5 8 12l7 7" stroke-width="2.2"/>')});
ICON85['Nova parede (planta)']=ICON85['Nova parede'];
Object.defineProperty(ICON85,'Lajes e cargas',{get:()=>ldOn85()?SV('<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'):SV('<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" stroke-dasharray="2.6 1.8"/><circle cx="12" cy="12" r="3" stroke-dasharray="1.6 1.4"/><path d="M4 20 20 4" stroke-width="1.9"/>'),enumerable:true});
// cor sutil: uma por família; apagar em vermelho suave
const FAM85={paredes:'#2f6fae',arq:'#56677a',mod:'#2e8556',elev:'#2e8556',arm:'#ad5f1f',laje:'#7458ad',cargas:'#7458ad',pranchas:'#4a5a86',d3:'#13827f',quant:'#2e8556',ajustes:'#5f6b78'};
const CATCOL85={Paredes:'paredes',Arquitetura:'arq',Modulação:'mod',Elevações:'elev',Armaduras:'arm',Laje:'laje',Cargas:'cargas',Pranchas:'pranchas','3D':'d3','Quantitat.':'quant',Ajustes:'ajustes'};
function col85(c,t){const l=t.l;if(l==='Lajes e cargas')return FAM85.laje;if(/^Apagar|Limpar|Destravar|Editar \/ excluir/.test(l))return '#bf4d49';if(/^Desfazer/.test(l))return '#5f6b78';if(/Desníveis/.test(l))return '#c2410c';
 if(/vão|abertura|portas/i.test(l))return '#13827f';if(/^(Selecionar|Zoom)/.test(l))return '#4b5563';if(c==='main'){if(String(t.t).startsWith('#'))return FAM85[t.t.slice(1)];if(/parede/i.test(l))return FAM85.paredes;}
 return FAM85[c]||'#2b4257';}
window.col85=col85;

const CATNAME={main:'Principal',paredes:'Paredes',arq:'Arquitetura',mod:'Modulação',elev:'Elevações',arm:'Armaduras',laje:'Laje',cargas:'Cargas',pranchas:'Pranchas',d3:'3D',quant:'Quantitativos',ajustes:'Ajustes'};
// controles movidos temporariamente (voltam ao lugar original ao trocar de categoria)
const moved=[];const ctlBox=id=>{const el=$(id);if(!el)return null;return el.closest('label')||el;};
function borrow(id,host){const el=ctlBox(id);if(!el)return;moved.push({el,parent:el.parentNode,next:el.nextSibling});host.append(el);}
function giveBack(){while(moved.length){const m=moved.pop();try{m.parent.insertBefore(m.el,m.next&&m.next.parentNode===m.parent?m.next:null);}catch{}}}
let curCat='main',curView='plan',activeTool=null;
function target(t){if(typeof t==='function')return t();return $(t);}
// V108.4 — antes de qualquer ferramenta, solta todas as outras (o comando antigo não fica escondido pegando o clique)
function stopAll(){const W=window,call=f=>{try{f();}catch{}};
 call(()=>W.wall101?.active?.()&&W.wall101.stop());call(()=>W.cancelTool56?.());call(()=>W.trim88?.active?.()&&W.trim88.stop());call(()=>W.el97?.stop?.());call(()=>W.arm106?.stop?.());
 call(()=>W.move108?.stop?.());call(()=>W.dn87?.active?.()&&W.dn87.stop());call(()=>W.align100?.stop?.());call(()=>W.cancelPick74?.());call(()=>W.cancelNewVao54?.());call(()=>W.cancelTool77?.());
 call(()=>{if(typeof mode!=='undefined'&&mode){mode='';points=[];}});call(()=>{lastDrawingCommand='';});call(()=>W.closePop54?.());
 document.body.classList.remove('tool56','wall101','cad88','el97on','arm106on','mv108on','al100','pick74','ld77on','newvao54','dn87on','brush97');}
window.stopAll108=stopAll;
const DRAW108=new Set(['Nova parede','Novo vão','Unir','Mover','Mover p/ eixo','Aparar','Estender','Desníveis','Apagar parede','Adicionar abertura','Calibrar escala','Ponto de origem','Alinhar com o de baixo','Reforço / Viga','Abertura na laje','Negativo']);
function cat(c){if(!CATS[c])return;giveBack();curCat=c;const C=CATS[c];
 rib.innerHTML=(c!=='main'?'<div class="g85"><div class="t85"><button type="button" class="tl85 back85" data-act="back"><span class="ic85">'+ICON85.Principal+'</span>Principal</button></div><div class="l85">'+CATNAME[c]+'</div></div>':'')+
  C.groups.map((g,gi)=>'<div class="g85" data-g="'+gi+'"><div class="t85">'+g[1].map((t,k)=>'<button type="button" class="tl85'+(String(t.t).startsWith('#')?' cat85':'')+'" data-g="'+gi+'" data-k="'+k+'" title="'+t.l+'" style="--c85h:'+col85(c,t)+'"><span class="ic85" style="--c85:'+col85(c,t)+'">'+(ICON85[c+':'+t.l]||ICON85[t.l]||t.ic)+'</span>'+t.l+'</button>').join('')+'</div><div class="l85">'+(g[0]||'')+'</div></div>').join('')+(C.note?'<div class="note85">'+C.note+'</div>':'');
 C.groups.forEach((g,gi)=>{if(g[2]){const host=rib.querySelector('.g85[data-g="'+gi+'"] .t85');host.classList.add('ctl85');g[2].forEach(id=>borrow(id,host));}});
 const sx=$('sideCtl85');sx.innerHTML='';if(C.sideCtl){sx.innerHTML='<h4>'+CATNAME[c]+' · opções</h4>';C.sideCtl.forEach(id=>borrow(id,sx));}
 if(C.v)view(C.v);markTools();upd();}
rib.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.act==='back'){cat('main');return;}if(b.dataset.k===undefined)return;const t=CATS[curCat].groups[N(b.dataset.g)][1][N(b.dataset.k)];
 if(String(t.t).startsWith('#')){cat(t.t.slice(1));return;}if(String(t.t).startsWith('@')){view(t.t.slice(1));return;}
 if(t.t==='sel'){stopAll();try{$('cancel')?.click();}catch{}activeTool=null;markTools();upd();try{drawPlan();}catch{}return;}
 if(DRAW108.has(t.l))stopAll();
 if(t.v)view(t.v);let el;if(typeof t.t==='function'){const r=t.t();if(r===undefined){activeTool=null;markTools();upd();return;}el=r;}else el=$(t.t);if(!el){msg('Ferramenta indisponível neste projeto.');return;}if(el.disabled){activeTool=null;markTools();upd();msg('“'+t.l+'” indisponível agora: abra a planta e calibre a escala (Arquitetura → 📂 Abrir / 📏 Calibrar escala).');return;}
 activeTool=t.mode?t.l:null;el.click();markTools();upd();});
function markTools(){rib.querySelectorAll('.tl85').forEach(b=>{if(b.dataset.k===undefined)return;const t=CATS[curCat].groups[N(b.dataset.g)][1][N(b.dataset.k)];b.classList.toggle('on',(!!activeTool&&t.l===activeTool)||(t.t==='sel'&&!activeTool)||(String(t.t).startsWith('@')&&t.t.slice(1)===curView));});}

// ---------- vistas (uma de cada vez; as outras continuam montadas fora da tela para que pranchas e DXF meçam certo)
tabs.innerHTML=Object.entries(VNAME).map(([k,v])=>'<button type="button" data-v="'+k+'">'+v+'</button>').join('')+'<span id="vtitle85"></span>';
tabs.onclick=e=>{const b=e.target.closest('[data-v]');if(b)view(b.dataset.v);};
function view(v){if(!VIEWS[v])return;if(OUTV.has(v))flush85();curView=v;document.body.dataset.v85=v;for(const el of new Set(Object.values(VIEWS)))if(el)el.classList.toggle('on85',el===VIEWS[v]);
 tabs.querySelectorAll('[data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===v));if(v==='plan'){try{drawPlan();}catch{}}markTools();upd();
 try{localStorage.setItem('view85',v);}catch{}}
const viewOf=el=>{if(!el||!el.closest)return null;if(el.closest('#work62'))return 'plan';if(el.closest('#globalPlans'))return 'fiadas';if(el.closest('article[id^="wall-result-"]'))return 'elev';if(el.closest('#output'))return 'quant';if(el.closest('#plot26'))return 'plot';if(secWalls&&secWalls.contains(el))return 'walls';if(secBlocks&&secBlocks.contains(el))return 'blocks';if(el.closest('#projectSection37'))return 'dados';if(secHelp&&secHelp.contains(el))return 'help';return null;};
// quem pedir para “ir até” algo em outra vista troca de vista automaticamente
const siv=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=function(...a){try{if(document.body.classList.contains('ui85')){const v=viewOf(this);if(v&&VIEWS[v]&&VIEWS[v]!==VIEWS[curView])view(v);else if(v&&v!==curView&&['fiadas','elev','quant'].includes(v))view(v);}}catch{}return siv.apply(this,a);};

// ---------- painel de propriedades (parede selecionada)
side.innerHTML='<div id="prog86"></div><div id="wcard85"></div><div id="sideCtl85"></div><details id="genWrap85"><summary>Detalhes da modulação (lista completa)</summary><div id="genBox85"></div></details>';
if($('genReport57'))$('genBox85').append($('genReport57'));
let sel=-1;window.sel85=()=>sel;
const ws=()=>[...new Set([14,19,...state.blocks.filter(b=>b.active!==false&&b.type!=='Canaleta').map(b=>N(b.width))])].sort((a,b)=>a-b);
function card(){const box=$('wcard85');const w=state.walls?.[sel];
 const opts=(state.walls||[]).map((x,i)=>'<option value="'+i+'"'+(i===sel?' selected':'')+'>Parede '+(i+1)+' · '+fmt(x.length)+' cm</option>').join('');
 if(!w){box.innerHTML='<h3>Propriedades</h3><p class="hint85">Clique numa parede na planta (ferramenta ↖ Selecionar) ou escolha na lista.</p><select id="wsel85"><option value="-1">— escolher parede —</option>'+opts+'</select>';$('wsel85').onchange=e=>select(N(e.target.value));return;}
 const m=state.results?.[sel],st=!m?'Ainda não modulada':m.errors?.length?'⚠ '+esc(m.errors[0]).slice(0,140):m.pending?'⏳ '+esc(m.statusReason||'Pendente').slice(0,160):'✔ Modulada · amarração OK';
 const cls=!m?'':m.errors?.length?'bad85':m.pending?'pend85':'ok85';const segs=(()=>{try{return effectiveSegments24(w,sel).map(s=>s.channel||'U').join(' / ');}catch{return '';}})();
 const pcs=(m?.rows||[]).flatMap(r=>r.pieces||[]).filter(q=>!q.fill&&!q.channel),cuts=pcs.filter(q=>q.cut||/_C/.test(q.code)).length;
 box.innerHTML='<h3><select id="wsel85">'+opts+'</select></h3>'+
  '<div class="row85"><span>Comprimento</span><input id="wL85" type="number" step="0.1" value="'+w.length+'"> cm</div>'+
  '<div class="row85"><span>Altura</span><input id="wH85" type="number" step="0.1" value="'+w.height+'"> cm</div>'+
  '<div class="row85"><span>Espessura</span><select id="wW85">'+[...new Set([...ws(),N(w.width)])].map(v=>'<option'+(v===N(w.width)?' selected':'')+'>'+v+'</option>').join('')+'</select> cm</div>'+
  '<div class="row85"><span>Respaldo</span><b>'+(segs||'—')+'</b></div><div class="row85"><span>Aberturas</span><b>'+((w.openings||[]).length||'nenhuma')+'</b></div>'+
  '<div class="row85"><span>Conferida</span><input id="wC85" type="checkbox"'+(w.confirmed?' checked':'')+'></div>'+
  '<div class="st85 '+cls+'">'+st+(m?.rows?.length?'<br><small>Cortes: '+cuts+' · '+(m.rows.length)+' fiadas</small>':'')+'</div>'+
  '<div class="bt85"><button type="button" id="wFix85">🛠 Corrigir</button><button type="button" id="wOk85" class="g85b">✔ Parede OK</button></div>'+
  '<div class="bt85"><button type="button" id="wEd85" class="g85b" style="background:#174a78;border-color:#174a78">✏ Editar elevação</button></div>'+'<div class="bt85"><button type="button" id="wEl85">▥ Ver elevação</button><button type="button" id="wLk85">'+(w.locked76?'🔒 Travada':'🔓 Livre')+'</button></div>';
 $('wsel85').onchange=e=>select(N(e.target.value));
 const ed=(k,v)=>{try{editWall(sel,k,v);}catch(er){console.error(er);}card();};
 $('wL85').onchange=e=>ed('length',N(e.target.value));$('wH85').onchange=e=>ed('height',N(e.target.value));$('wW85').onchange=e=>ed('width',N(e.target.value));$('wC85').onchange=e=>ed('confirmed',e.target.checked);
 $('wFix85').onclick=()=>{try{window.openFix76?window.openFix76(sel):window.quickFix84?.(sel);}catch(er){console.error(er);}};
 $('wOk85').onclick=()=>{try{window.approveOK80?.(sel);}catch(er){console.error(er);}card();};
 $('wEd85').onclick=()=>{if(state.results?.[sel]?.rows?.length)window.ed86?.open(sel);else msg('Gere a modulação antes de editar a elevação.');};$('wEl85').onclick=()=>{view('elev');$('wall-result-'+sel)?.scrollIntoView({block:'start'});};
 $('wLk85').onclick=()=>{try{window.setLock76?.(sel,!w.locked76);}catch(er){console.error(er);}card();};}
const fmt=v=>Number(v).toLocaleString('pt-BR',{maximumFractionDigits:1});
function select(i){sel=i>=0&&i<(state.walls?.length||0)?i:-1;card();upd();try{drawPlan();}catch{}}
window.select85=select;
// clique na planta seleciona a parede mais próxima (não interfere nas ferramentas: só destaca)
$('plan')?.addEventListener('click',e=>{if(curView!=='plan'||activeTool)return;try{const c0=$('plan'),r0=c0.getBoundingClientRect(),P={x:(e.clientX-r0.left)*c0.width/r0.width+(c0.planOrigin25?.x||0),y:(e.clientY-r0.top)*c0.height/r0.height+(c0.planOrigin25?.y||0)},pg=num($('page').value);let best=-1,bd=1e9;
 state.walls.forEach((w,i)=>{if(!w.line||N(w.page||1)!==pg)return;const[a,b]=w.line,dx=b.x-a.x,dy=b.y-a.y,L2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((P.x-a.x)*dx+(P.y-a.y)*dy)/L2)),d=Math.hypot(a.x+t*dx-P.x,a.y+t*dy-P.y);if(d<bd){bd=d;best=i;}});
 const c=$('plan'),r=c.getBoundingClientRect(),tol=14*c.width/Math.max(1,r.width);select(bd<=tol?best:-1);}catch(er){}});
try{const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);try{const w=state.walls?.[sel];if(w?.line&&N(w.page||1)===num($('page').value)){const c=$('plan'),ctx=c.getContext('2d'),o=c.planOrigin25||{x:0,y:0};ctx.save();ctx.setTransform(1,0,0,1,-o.x,-o.y);ctx.lineCap='round';ctx.strokeStyle='rgba(31,111,209,.85)';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(w.line[0].x,w.line[0].y);ctx.lineTo(w.line[1].x,w.line[1].y);ctx.stroke();ctx.restore();}}catch{}return r;};}catch{}

// ---------- barra de status e indicador
stat.innerHTML='<span>Pavimento: <b id="sLv85">—</b></span><span>Parede: <b id="sW85">—</b></span><span>Ferramenta: <b id="sT85">Selecionar</b></span><span>Categoria: <b id="sC85">Principal</b></span><span id="sMsg85"></span>';
const mirror=(id,fn)=>{const el=$(id);if(!el)return;new MutationObserver(fn).observe(el,{childList:true,characterData:true,subtree:true});};
const msg=t=>{const m=$('sMsg85');if(m){m.textContent=(t||'').trim();m.title=m.textContent;}};
mirror('planStatus',()=>msg($('planStatus').textContent));mirror('st83msg',()=>msg($('st83msg').textContent));mirror('calculationStatus',()=>msg($('calculationStatus').textContent));
// ---------- V86.1: progresso da modulação (pequeno, sempre visível, atualiza sozinho)
let progOpen='';
function progData(){const W=state.walls||[],R=state.results||[];const g={ok:[],pend:[],unc:[],none:[]};
 W.forEach((w,i)=>{const m=R[i];if(!w.confirmed){g.unc.push(i);return;}if(!m||!m.rows?.length){g.none.push(i);return;}if(m.errors?.length||m.pending)g.pend.push(i);else g.ok.push(i);});return g;}
function prog(){const box=$('prog86');if(!box)return;const W=state.walls||[];if(!W.length||!Array.isArray(state.results)){box.innerHTML='<div class="pg86"><b>📊 Resultado da modulação</b><div class="pgN86">Gere a modulação para ver o progresso.</div></div>';return;}
 const g=progData(),n=W.length,ok=g.ok.length,pct=Math.round(ok/n*100),todo=[...g.pend,...g.none,...g.unc].sort((a,b)=>a-b);
 const chips=list=>'<div class="pgL86">'+list.map(i=>'<button type="button" data-go="'+i+'">P'+(i+1)+'</button>').join('')+'</div>';
 box.innerHTML='<div class="pg86'+(ok===n?' done86':'')+'"><div class="pgT86"><b>📊 Resultado da modulação</b>'+(todo.length?'<span class="pgNav86"><button type="button" data-nav="-1" title="Parede pendente anterior">‹</button><button type="button" data-nav="1" title="Próxima parede pendente: abre o editor">próxima ›</button></span>':'')+'</div>'+
  '<div class="pgBar86"><i style="width:'+pct+'%"></i></div><div class="pgN86"><b>'+ok+' / '+n+'</b> paredes OK ('+pct+'%)</div>'+
  (ok===n?'<div class="pgDone86">✔ Todas as paredes OK — pronto para as pranchas.</div>':
  '<div class="pgR86"><button type="button" data-open="pend" class="'+(progOpen==='pend'?'on':'')+'">⏳ Pendentes <b>'+(g.pend.length+g.none.length)+'</b></button>'+(g.unc.length?'<button type="button" data-open="unc" class="'+(progOpen==='unc'?'on':'')+'">⚠ Não conferidas <b>'+g.unc.length+'</b></button>':'')+'</div>'+
  (progOpen==='pend'&&(g.pend.length+g.none.length)?chips([...g.pend,...g.none].sort((a,b)=>a-b)):'')+(progOpen==='unc'&&g.unc.length?chips(g.unc):'')+
  '<div class="pgA86">'+(g.pend.length?'<button type="button" data-act="fixall">🛠 Corrigir todas</button>':'')+(g.unc.length?'<button type="button" data-act="conf">✔ Já conferi as '+g.unc.length+'</button>':'')+'</div>')+'</div>';}
function goWall(i){select(i);const m=state.results?.[i];if(m?.rows?.length&&state.walls[i].confirmed){view('elev');window.ed86?.open(i);}else{view('walls');try{document.querySelector('#walls tr:nth-child('+(i+1)+')')?.scrollIntoView({block:'center'});}catch{}msg(state.walls[i].confirmed?'Parede '+(i+1)+' sem desenho: confira as medidas e gere de novo.':'Parede '+(i+1)+' não conferida: confira comprimento, altura e espessura e marque “Conferida”.');}}
$('prog86')?.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.open){progOpen=progOpen===b.dataset.open?'':b.dataset.open;prog();return;}
 if(b.dataset.go!==undefined){goWall(N(b.dataset.go));return;}
 if(b.dataset.nav){const g=progData(),todo=[...g.pend,...g.none,...g.unc].sort((a,b)=>a-b);if(!todo.length)return;const cur=window.ed86?.isOpen?.()?sel:sel;const d=N(b.dataset.nav);let k=d>0?todo.find(i=>i>cur):[...todo].reverse().find(i=>i<cur);if(k===undefined)k=d>0?todo[0]:todo.at(-1);try{window.ed86?.close?.(true);}catch{}goWall(k);return;}
 if(b.dataset.act==='fixall'){try{window.fixAll84?.();}catch(er){console.error(er);}prog();return;}
 if(b.dataset.act==='conf'){const g=progData();for(const i of g.unc)state.walls[i].confirmed=true;try{renderWalls();}catch{}const pv=window.__noCheck71;window.__noCheck71=true;try{$('generate').click();}finally{window.__noCheck71=pv;}msg(g.unc.length+' parede(s) marcada(s) como conferida(s); gerando de novo.');}});
setInterval(()=>{try{if(document.visibilityState==='visible'){prog();badge();}}catch{}},2500);
function upd(){try{prog();}catch{}const s=$('lvl92')||$('lvlSel68');$('sLv85').textContent=s?.selectedOptions?.[0]?.textContent||'—';$('sW85').textContent=sel>=0?'Parede '+(sel+1):'—';$('sT85').textContent=activeTool||'Selecionar';$('sC85').textContent=CATNAME[curCat];$('vtitle85').textContent='';
 badge();}
function badge(){// V108.3: contagem ao vivo, igual ao quadro “Resultado da modulação” (antes ficava presa no diagnóstico do último Gerar)
 const R=state.results;let ok=0,n=0;if(Array.isArray(R)&&(state.walls||[]).length){const g=progData();n=state.walls.length;ok=g.ok.length;}
 const b=$('diag85');if(b){b.innerHTML=n?'📊 <i class="'+(ok===n?'ok':'pend')+'">'+ok+'/'+n+'</i> paredes OK':'📊 sem modulação';}}
// V85.1 — edição rápida: depois de editar, o desenho dos resultados (elevações, fiadas, quantitativos) só é refeito quando uma aba que o mostra é aberta
let inInv=false,lazyArgs=null;const OUTV=new Set(['fiadas','elev','quant','plot']);
try{const iv=invalidate;invalidate=function(...a){inInv=true;try{return iv.apply(this,a);}finally{inInv=false;}};}catch{}
const flush85=()=>{if(!lazyArgs)return;const a=lazyArgs;lazyArgs=null;try{renderResults(...a);}catch(e){console.error('V85 flush',e);}};window.flush85=flush85;
try{const rr=renderResults;renderResults=function(...a){if(inInv&&!OUTV.has(curView)&&Array.isArray(state.results)&&$('output')?.querySelector('article[id^="wall-result-"]')){lazyArgs=a;try{card();upd();const g=$('genReport57');if(g&&g.style.display!=='none'&&!g.querySelector('.gr57stale'))g.insertAdjacentHTML('afterbegin','<p class="gr57stale">As entradas mudaram: gere a modulação de novo.</p>');}catch{}return;}lazyArgs=null;const r=rr.apply(this,a);try{if($('genReport57')&&!$('genBox85').contains($('genReport57')))$('genBox85').append($('genReport57'));card();upd();}catch{}return r;};}catch{}
try{const rw=renderWalls;renderWalls=function(...a){const r=rw.apply(this,a);try{if(sel>=(state.walls?.length||0))sel=-1;card();upd();}catch{}return r;};}catch{}
$('lvlSel68')?.addEventListener('change',()=>setTimeout(upd,0));
document.addEventListener('keydown',e=>{if(e.key!=='Escape'||e.target.closest?.('input,textarea,select,dialog'))return;if(activeTool){activeTool=null;markTools();upd();return;}if(curCat!=='main')cat('main');});
// largura da área de desenho (as vistas fora da tela usam a mesma largura)
const setW=()=>document.documentElement.style.setProperty('--w85',(main.clientWidth||window.innerWidth-340)+'px');new ResizeObserver(setW).observe(main);setW();
// recolher o painel lateral
const tg=E('button',{type:'button',id:'sideTg85',title:'Recolher / mostrar o painel'},'⟩');tabs.append(tg);tg.onclick=()=>{document.body.classList.toggle('noside85');tg.textContent=document.body.classList.contains('noside85')?'⟨':'⟩';setTimeout(()=>{setW();try{drawPlan();}catch{}},50);};

const css=E('style');css.textContent=`
body.ui85{overflow:hidden;height:100vh;margin:0;background:#e9edf2}
body.ui85>header,body.ui85 #v48ProjectPanel,body.ui85 #tools62,body.ui85 #split78,body.ui85 #st83{display:none!important}
#top85{position:fixed;left:0;right:0;top:0;height:46px;z-index:60;display:flex;align-items:center;gap:8px;padding:0 10px;background:#0f2f4f;color:#fff;font:13px "Segoe UI",Arial,sans-serif}
#top85 .logo85{font-weight:700;letter-spacing:.3px;margin-right:4px;white-space:nowrap}#top85 .logo85 b{color:#f2b705}#top85 .logo85 small{opacity:.6;font-weight:400}
#top85 button,#top85 select,#top85 input{background:#1c4670;color:#fff;border:1px solid #2e5f8f;border-radius:6px;padding:5px 9px;font:inherit;height:32px;margin:0}
#top85 input#scale85{width:64px}#top85 select#lvl85{max-width:190px}#top85 select#lvl92{max-width:330px}#top85 .lv85{display:flex;align-items:center;gap:5px;font-size:12px;color:#cfe0f0;margin:0}
#top85 .sep85{width:1px;height:26px;background:#2e5f8f}#top85 #gen85{background:#1d7a3a;border-color:#2a9a4c;font-weight:700;padding:5px 14px}#top85 #gen85.busy85{background:#a3361f;border-color:#c0492e}
#top85 #diag85{margin-left:auto;border-radius:16px;background:#123e66;font-weight:600}#top85 #diag85 i{font-style:normal}#top85 #diag85 i.ok{color:#7be08f}#top85 #diag85 i.pend{color:#ffd166}
#top85 .menu85{position:relative}#pmList85{position:absolute;top:36px;left:0;background:#fff;border:1px solid #c9d3de;border-radius:8px;box-shadow:0 6px 18px #0003;padding:6px;display:flex;flex-direction:column;min-width:230px;z-index:80}
#pmList85[hidden]{display:none}#pmList85 button{background:#fff!important;color:#1b2b3a!important;border:0!important;text-align:left;height:auto!important;padding:8px 10px!important}#pmList85 button:hover{background:#eef4fb!important}
#top85 #autoBadge71{font-size:11px;opacity:.75}
#rib85{position:fixed;left:0;right:0;top:46px;height:86px;z-index:59;display:flex;align-items:stretch;background:#fff;border-bottom:1px solid #c9d3de;padding:0 4px;overflow-x:auto;overflow-y:hidden;font:12px "Segoe UI",Arial,sans-serif}
#rib85 .g85{display:flex;flex-direction:column;border-right:1px solid #e1e7ee;padding:4px 4px 2px;flex-shrink:0}#rib85 .t85{display:flex;gap:2px;flex:1;align-items:stretch}
#rib85 .l85{font-size:10px;color:#6b7c8d;text-align:center;letter-spacing:.3px;text-transform:uppercase;white-space:nowrap}
#rib85 .tl85{width:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:6px;font-size:11px;line-height:1.1;text-align:center;color:#1b2b3a;background:transparent;border:1px solid transparent;padding:2px;margin:0;cursor:pointer;box-shadow:none}
#rib85 .tl85:hover{background:#eef4fb;border-color:#cfe0f0}#rib85 .tl85.on{background:#dcebfa;border-color:#8db8e4}
#rib85 .ic85{font-size:21px;height:25px;line-height:25px}#rib85 .ic85 svg{width:26px;height:26px;display:block;margin:0 auto}#rib85 .tl85 .ic85{color:var(--c85,#2b4257)}#rib85 .tl85:hover{background:color-mix(in srgb,var(--c85h,#1f6fd1) 8%,#fff);border-color:color-mix(in srgb,var(--c85h,#1f6fd1) 22%,#fff)}#rib85 .tl85.on{background:color-mix(in srgb,var(--c85h,#1f6fd1) 13%,#fff);border-color:color-mix(in srgb,var(--c85h,#1f6fd1) 40%,#fff)}#rib85 .back85 .ic85{color:#174a78}#rib85 .tl85.off85{opacity:.62}#rib85 .back85{width:74px;background:#f2f5f8;color:#174a78;font-weight:600}
#rib85 .ctl85{flex-direction:column;justify-content:center;gap:3px;padding:0 6px}#rib85 .ctl85 label{display:flex;align-items:center;gap:6px;font-size:11.5px;margin:0;white-space:nowrap}
#rib85 .ctl85 input,#rib85 .ctl85 select{height:26px;padding:2px 6px;font-size:12px;max-width:170px;margin:0}#rib85 .ctl85 .note,#rib85 .ctl85 small{display:none}
#rib85 .note85{align-self:center;color:#6b7c8d;font-size:12px;padding:0 12px;max-width:340px}
#tabs85{position:fixed;left:0;right:var(--sw85,340px);top:132px;height:34px;z-index:58;display:flex;align-items:center;gap:4px;padding:0 10px;background:#e9edf2;font:12px "Segoe UI",Arial,sans-serif}
#tabs85 button{background:#fff;border:1px solid #cdd7e1;border-radius:6px;padding:4px 10px;color:#1b2b3a;font-size:12px;height:26px;margin:0;box-shadow:none}#tabs85 button.on{background:#174a78;color:#fff;border-color:#174a78}
#tabs85 #sideTg85{margin-left:auto;width:30px;padding:0}
body.ui85{--sw85:340px}body.ui85.noside85{--sw85:0px}body.ui85.noside85 #side85{display:none}
body.ui85 main{position:fixed!important;left:8px;right:calc(var(--sw85) + 8px);top:166px;bottom:34px;max-width:none!important;margin:0!important;padding:0!important;overflow:hidden;background:#fbfcfd;border:1px solid #c9d3de;border-radius:6px}
body.ui85 #controls{display:contents}
body.ui85 .v85{position:fixed!important;left:-400vw!important;top:0!important;width:var(--w85,1000px)!important;height:100vh!important;overflow:hidden!important;pointer-events:none;margin:0!important;box-sizing:border-box}
body.ui85 .v85.on85{position:absolute!important;left:0!important;top:0!important;right:0;bottom:0;width:auto!important;height:auto!important;overflow:auto!important;pointer-events:auto;border-radius:0;box-shadow:none}
body.ui85[data-v85=plan] #projectSection37>:not(#work62){display:none!important}
body.ui85[data-v85=plan] #projectSection37{padding:0!important;overflow:hidden!important}
body.ui85[data-v85=plan] #work62{display:block!important;height:100%!important;margin:0!important;border:0!important}
body.ui85[data-v85=plan] #work62>*:not(#tools62):not(#split78){height:100%!important;width:100%!important;max-width:none!important;display:flex;flex-direction:column}
body.ui85[data-v85=plan] #planStatus{display:none!important}
body.ui85[data-v85=plan] #planWrap{flex:1;height:auto!important;max-height:none!important;min-height:0}
body.ui85[data-v85=dados] #projectSection37>#work62{display:none!important}
body.ui85[data-v85=fiadas] #output>:not(#globalPlans):not(#calculationStatus):not(h2){display:none!important}
body.ui85[data-v85=elev] #output>:not(article[id^="wall-result-"]):not(#calculationStatus){display:none!important}
body.ui85[data-v85=quant] #output>#globalPlans,body.ui85[data-v85=quant] #output>article[id^="wall-result-"]{display:none!important}
#side85{position:fixed;right:0;top:132px;bottom:26px;width:340px;z-index:57;background:#fff;border-left:1px solid #c9d3de;overflow:auto;padding:10px 12px;box-sizing:border-box;font:13px "Segoe UI",Arial,sans-serif}
#side85 h3{margin:2px 0 8px;font-size:15px;color:#174a78}#side85 h3 select,#wsel85{font-size:14px;font-weight:600;color:#174a78;border:1px solid #c9d3de;border-radius:5px;padding:3px 6px;max-width:100%}
#side85 .row85{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #eef2f6}#side85 .row85 span{flex:1;color:#40566b}
#side85 .row85 input[type=number]{width:84px;padding:3px 6px;border:1px solid #c9d3de;border-radius:4px;margin:0}#side85 .row85 select{padding:3px 6px;margin:0}
#side85 .st85{margin:8px 0;border-radius:6px;padding:7px 9px;font-size:12.5px;background:#f4f6f8;border:1px solid #dde4ea}#side85 .st85.ok85{background:#ecf8ef;border-color:#9fd4ad}#side85 .st85.pend85{background:#fff7e6;border-color:#f2c86b}#side85 .st85.bad85{background:#fdecec;border-color:#e8a3a3}
#side85 .bt85{display:flex;gap:6px;margin-top:6px}#side85 .bt85 button{flex:1;padding:6px;border-radius:5px;background:#eef2f6;border:1px solid #cdd7e1;color:#1b2b3a;font-size:12px;margin:0}#side85 .bt85 .g85b{background:#1d7a3a;color:#fff;border-color:#1d7a3a}
#side85 .hint85{color:#6b7c8d;font-size:12.5px}#side85 #sideCtl85:not(:empty){margin-top:12px;border-top:2px solid #e1e7ee;padding-top:8px}#side85 #sideCtl85 h4{margin:0 0 6px;color:#174a78;font-size:13px}
#side85 #sideCtl85 label{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12.5px;margin:4px 0}#side85 #sideCtl85 input[type=number]{width:80px}#side85 #sideCtl85 label:has(input[type=checkbox]){justify-content:flex-start;flex-direction:row-reverse}#side85 #sideCtl85 label input[type=checkbox]{margin:0}
#prog86{position:sticky;top:-10px;z-index:3;margin:-10px -12px 10px;padding:8px 12px 6px;background:#fff;border-bottom:2px solid #e1e7ee}
#prog86 .pg86{font-size:12.5px}#prog86 .pgT86{display:flex;align-items:center;justify-content:space-between;gap:6px}#prog86 .pgT86 b{color:#174a78;font-size:13.5px}
#prog86 .pgNav86 button{padding:2px 8px;margin:0 0 0 3px;font-size:12px;border-radius:5px;border:1px solid #9fb6cf;background:#eef4fb;color:#174a78;cursor:pointer}
#prog86 .pgBar86{height:9px;background:#e9edf2;border-radius:5px;overflow:hidden;margin:6px 0 3px}#prog86 .pgBar86 i{display:block;height:100%;background:linear-gradient(90deg,#f2b705,#1d9a4a);transition:width .4s}
#prog86 .done86 .pgBar86 i{background:#1d9a4a}#prog86 .pgN86{color:#40566b}#prog86 .pgN86 b{color:#0f2f4f;font-size:14px}#prog86 .pgDone86{color:#1d7a3a;font-weight:700;margin-top:4px}
#prog86 .pgR86{display:flex;gap:6px;margin-top:5px;flex-wrap:wrap}#prog86 .pgR86 button{padding:3px 8px;margin:0;font-size:12px;border-radius:12px;border:1px solid #f2c86b;background:#fff7e6;color:#7a4b00;cursor:pointer}#prog86 .pgR86 button.on{background:#f2b705;color:#1b2b3a}
#prog86 .pgL86{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}#prog86 .pgL86 button{padding:2px 8px;margin:0;font-size:12px;font-weight:600;border-radius:4px;border:1px solid #9fb6cf;background:#eef4fb;color:#174a78!important;cursor:pointer;min-width:0;height:auto;line-height:1.3}
#prog86 .pgA86{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}#prog86 .pgA86:empty{display:none}#prog86 .pgA86 button{padding:4px 9px;margin:0;font-size:12px;border-radius:5px;border:0;background:#1d7a3a;color:#fff;cursor:pointer}
#side85 details#genWrap85{margin-top:12px;border-top:2px solid #e1e7ee;padding-top:6px}#side85 details#genWrap85>summary{font-weight:700;color:#174a78;cursor:pointer;margin-bottom:6px}
#side85 #genReport57{font-size:12px;margin:0;max-width:none}#side85 #genReport57 button{font-size:11.5px}
#stat85{position:fixed;left:0;right:0;bottom:0;height:26px;z-index:60;display:flex;gap:16px;align-items:center;padding:0 12px;background:#0f2f4f;color:#cfe0f0;font:12px "Segoe UI",Arial,sans-serif;white-space:nowrap;overflow:hidden}
#stat85 b{color:#fff}#stat85 #sMsg85{margin-left:auto;overflow:hidden;text-overflow:ellipsis;max-width:55vw;color:#ffe9a8}
body.ui85 dialog{z-index:100}
@media print{#top85,#rib85,#tabs85,#side85,#stat85{display:none!important}body.ui85{overflow:visible!important;height:auto!important}
 body.ui85 main{position:static!important;border:0!important;overflow:visible!important}body.ui85 .v85,body.ui85 .v85.on85{position:static!important;left:auto!important;width:auto!important;height:auto!important;overflow:visible!important}}`;
document.head.append(css);
// início
let v0='plan';try{v0=localStorage.getItem('view85')||'plan';}catch{}
cat('main');view(VIEWS[v0]?v0:'plan');card();upd();setTimeout(()=>{setW();try{drawPlan();}catch{}},300);
})();
