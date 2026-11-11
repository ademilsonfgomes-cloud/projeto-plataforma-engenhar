// V85.3 — tamanho dos textos em mm no papel (altura da letra maiúscula), igual em qualquer escala, no padrão TQS (“cm plotado”) / CYPE (mm).
// Vale para as pranchas, o PDF e o DXF (com uma layer por tipo de texto). Nenhum cálculo muda.
(function(){
'use strict';
const N=Number,CAP=0.716;// altura da maiúscula ÷ corpo da fonte (Arial)
const DEF={titulo:6.0,subtitulo:4.5,escala:3.0,tabelaTitulo:3.0,parede:3.0,cota:2.5,aco:2.5,nota:2.5,aberturaPlanta:2.0,aberturaElev:2.5,blocoElev:2.1,blocoPlanta:1.8,carga:2.0,tabela:2.2,minBloco:1.2,fator:1.0};
const ROWS=[['titulo','Título de cada desenho (Primeira fiada…, Parede 12…)'],['subtitulo','Subtítulo dentro do detalhe (Elevação, Corte A–A, 1ª/2ª fiada)'],['escala','“Escala 1:50” e marca de corte (A)'],['parede','Nome da parede (planta e elevação)'],['cota','Cotas, níveis e nº das fiadas'],['aco','Aço: N4 na planta e rótulo N23 · Ø · C='],['aberturaPlanta','Aberturas na planta'],['aberturaElev','Aberturas na elevação'],['blocoElev','Código do bloco na elevação'],['blocoPlanta','Código do bloco na planta'],['minBloco','Menor código de bloco legível (abaixo disso some)'],['nota','Notas no desenho (Apoio em viga…)'],['carga','Valores do mapa de cargas'],['tabela','Tabelas · corpo'],['tabelaTitulo','Tabelas · título']];
const LAYER={titulo:'TXT-TITULO',subtitulo:'TXT-TITULO',escala:'TXT-TITULO',parede:'TXT-PAREDE',cota:'TXT-COTA',aco:'TXT-ACO',aberturaPlanta:'TXT-ABERTURA',aberturaElev:'TXT-ABERTURA',blocoElev:'TXT-BLOCO',blocoPlanta:'TXT-BLOCO',nota:'TXT-NOTA',carga:'TXT-CARGA'};
const LAYERS=['TXT-TITULO','TXT-PAREDE','TXT-COTA','TXT-ACO','TXT-ABERTURA','TXT-BLOCO','TXT-NOTA','TXT-CARGA','TXT-TABELA','TXT-CARIMBO'];
const load=()=>{let o={};try{o=JSON.parse(localStorage.getItem('txt85')||'{}')||{};}catch{}return {...DEF,...o};};
let C=load();window.txt85=()=>C;
const mm=k=>N(C[k])*(k==='minBloco'||k==='fator'?1:N(C.fator)||1);
window.__cap85=CAP;

// ---------- CSS das pranchas (títulos, escala, subtítulos, tabelas) — também vale na medição, então a montagem já reserva o espaço
const css=document.createElement('style');document.head.append(css);
const lh=k=>mm(k)/CAP*1.22;
function applyCSS(){const f=k=>(mm(k)/CAP).toFixed(3)+'mm';
 css.textContent=`.plotSheet26 .plotItemTitle26{font:bold ${f('titulo')}/${lh('titulo').toFixed(2)}mm Arial!important;height:${lh('titulo').toFixed(2)}mm!important;white-space:nowrap;overflow:visible}
.plotSheet26 .drawingScale29,.plotMeasure26 .drawingScale29{font:${f('escala')}/1.2 Arial!important}
.plotItem26 h3:not(.plotItemTitle26),.plotMeasure26 h3{font:bold ${f('tabelaTitulo')}/${lh('tabelaTitulo').toFixed(2)}mm Arial!important}
.plotItem26 .plotWallStack28 h3,.plotMeasure26 .plotWallStack28 h3,.plotItem26 .plotWallStack28 h4,.plotMeasure26 .plotWallStack28 h4{font:bold ${f('subtitulo')}/${lh('subtitulo').toFixed(2)}mm Arial!important;white-space:nowrap}
.plotItem26 table,.plotItem26 th,.plotItem26 td,.plotMeasure26 table,.plotMeasure26 th,.plotMeasure26 td{font-size:${f('tabela')}!important;line-height:1.25!important}
.plotItem26 svg,.plotMeasure26 svg{overflow:visible}`;}
applyCSS();

// ---------- classificação de cada texto dos desenhos
function kindOf(t,plan){const tx=(t.textContent||'').trim();if(!tx)return null;
 if(t.hasAttribute('data-block-label37'))return plan?'blocoPlanta':'blocoElev';
 if(/^Parede \d+$/.test(tx)||/^L\d+$/.test(tx))return 'parede';
 if(/^N\d+(\s*·|$)/.test(tx)||/Ø/.test(tx))return 'aco';
 if(/^(J|P|PJ)\s*\d+\s*[×x]\s*\d+/.test(tx)||/^(Janela|Porta|Vão)\b/.test(tx))return plan?'aberturaPlanta':'aberturaElev';
 if(/^P\d+\s*·/.test(tx)||/kN\/m|tf\/m/.test(tx))return 'carga';
 if(/^[+−-]?\d+([,.]\d+)?(\s?(cm|m))?$/.test(tx))return 'cota';
 if(/^\d+([,.]\d+)?\s*[×x]\s*\d+([,.]\d+)?(\s?(cm|m))?$/.test(tx))return 'cota';
 if(/^[A-Z]$/.test(tx))return 'escala';
 if(/^(Apoio|Comprimento cadastrado|LAJE|Laje)/.test(tx))return 'nota';
 return null;}
function procSVG(svg,itemTitle){const plan=/Modulação conjunta/.test(svg.getAttribute('aria-label')||'')||/^(Primeira|Segunda) fiada/i.test(svg.closest('[data-sub85]')?.dataset.sub85||'');
 svg.style.overflow='visible';let hid=0,set=0;
 for(const t of [...svg.querySelectorAll('text')]){const k=kindOf(t,plan);if(!k)continue;const m=t.getScreenCTM();if(!m)continue;const mmPerLocal=Math.hypot(m.a,m.b)*25.4/96;if(!(mmPerLocal>0))continue;
  t.setAttribute('data-l85',LAYER[k]||'TEXTOS');t.style.removeProperty('font-size');t.querySelectorAll('tspan[font-size]').forEach(s=>s.removeAttribute('font-size'));
  let f=mm(k)/CAP/mmPerLocal;
  if(k==='blocoPlanta'||k==='blocoElev'){const prev=t.previousElementSibling;if(prev&&/^(rect|polygon|path)$/.test(prev.tagName)){let bb;try{bb=prev.getBBox();}catch{}
    if(bb&&bb.width>0&&bb.height>0){const L=Math.max(bb.width,bb.height),S=Math.min(bb.width,bb.height);t.setAttribute('font-size',f);let len=0;try{len=t.getComputedTextLength();}catch{}
     const fw=len>0?0.9*L/len:1,fh=0.62*S/(f*CAP);f=f*Math.min(1,fw,fh);
     if(f*CAP*mmPerLocal<N(C.minBloco)-1e-6){t.remove();hid++;continue;}
     if(!t.getAttribute('dominant-baseline')&&!t.getAttribute('transform')){t.setAttribute('dominant-baseline','central');t.setAttribute('y',(bb.y+bb.height/2).toFixed(3));}}}}
  t.setAttribute('font-size',f.toFixed(4));set++;
  // não deixa o texto sair da largura do desenho (ex.: rótulo do aço invadindo o corte): reduz até 1,8 mm
  if(!plan&&k!=='blocoElev'){try{const R=svg.getBoundingClientRect(),r=t.getBoundingClientRect(),anc=t.getAttribute('text-anchor')||getComputedStyle(t).textAnchor;if(r.width>0&&!t.getAttribute('transform')){let avail;
   if(anc==='middle'){const cx=(r.left+r.right)/2;avail=2*Math.min(cx-R.left,R.right-cx);}else if(anc==='end')avail=r.right-R.left;else avail=R.right-r.left;
   if(avail>0&&r.width>avail){const minF=Math.min(mm(k),1.8)/CAP/mmPerLocal;const nf=Math.max(minF,f*avail/r.width*0.98);if(nf<f)t.setAttribute('font-size',nf.toFixed(4));}}}catch{}}}
 // nota “Comprimento cadastrado” não pode encostar na cota de cima/baixo: sobe o necessário
 {const all=[...svg.querySelectorAll('text[data-l85]')];for(const t of all){if(!/^Comprimento cadastrado/.test(t.textContent.trim())||t.getAttribute('transform'))continue;const r=t.getBoundingClientRect(),m=t.getScreenCTM(),k2=m?Math.hypot(m.a,m.b):0;if(!k2)continue;
  for(const o of all){if(o===t)continue;const q=o.getBoundingClientRect();const ov=Math.min(r.bottom,q.bottom)-Math.max(r.top,q.top),oh=Math.min(r.right,q.right)-Math.max(r.left,q.left);if(ov>0&&oh>0){const y=N(t.getAttribute('y'))||0;t.setAttribute('y',(y-(r.bottom-q.top+1)/k2).toFixed(3));break;}}}}
 return {set,hid};}
// marca as vistas pequenas de 1ª/2ª fiada dentro do conjunto de cada parede (são plantas)
function markSubs(root){root.querySelectorAll('h3,h4').forEach(h=>{const tx=h.textContent||'';let n=h.nextElementSibling;for(let g=0;g<3&&n;g++,n=n.nextElementSibling){if(n.tagName==='svg'||n.querySelector?.('svg')){(n.tagName==='svg'?n:n.querySelector('svg')).closest('*').setAttribute('data-sub85',tx);break;}}});}

// ---------- aplica em cada item das pranchas (antes de montar as folhas)
const cache85=new Map();
try{const cp=collectPlot26;collectPlot26=function(...a){applyCSS();const d=cp.apply(this,a);try{
 const host=document.createElement('div');host.style.cssText='position:absolute;left:-100000px;top:0;';document.body.append(host);
 const tOld=5,tNew=lh('titulo'),sOld=2.3*1.2+2,sNew=mm('escala')/CAP*1.2+2;let tot=0,hid=0;
 for(const it of d.items||[]){it.h=(N(it.h)||0)+Math.max(0,tNew-tOld)+(/^(Parede |Primeira fiada|Segunda fiada)/.test(it.title||'')?Math.max(0,sNew-sOld):0);
  if(!it.html||!/<svg/i.test(it.html))continue;
  // V124 — mesmo quadro (desenho, largura, título) com os mesmos tamanhos de texto: reaproveita o resultado
  const kk=window.medir124?(window.medir124.dig(it.html)+'|'+it.w+'|'+it.title+'|'+JSON.stringify(C)+'|'+window.medir124.versao()):null,hit=kk&&cache85.get(kk);
  if(hit&&!window.__v124off){it.html=hit.html;tot+=hit.set;hid+=hit.hid;continue;}
  host.style.width=it.w+'mm';host.innerHTML='<div class="plotItem26" style="position:static;width:'+it.w+'mm">'+it.html+'</div>';markSubs(host);let s1=0,h1=0;
  for(const svg of host.querySelectorAll('svg')){const r=procSVG(svg,it.title);s1+=r.set;h1+=r.hid;}tot+=s1;hid+=h1;
  host.querySelectorAll('[data-sub85]').forEach(n=>n.removeAttribute('data-sub85'));it.html=host.firstElementChild.innerHTML;if(kk){if(cache85.size>3000)cache85.clear();cache85.set(kk,{html:it.html,set:s1,hid:h1});}}
 host.remove();d.txt85={tot,hid};}catch(e){console.error('V85 textos',e);}return d;};}catch(e){console.error('V85 textos',e);}

// ---------- DXF: layers por tipo de texto
window.layers85=h=>{try{const i=h.indexOf('2\r\nLAYER\r\n');if(i<0)return h;const j=h.indexOf('0\r\nENDTAB',i);const m=h.slice(i).match(/^2\r\nLAYER\r\n70\r\n(\d+)/);const have=new Set([...h.slice(i,j).matchAll(/0\r\nLAYER\r\n2\r\n([^\r]+)/g)].map(x=>x[1]));const add=LAYERS.filter(l=>!have.has(l));if(!add.length)return h;
 const rec=add.map((l,k)=>'0\r\nLAYER\r\n2\r\n'+l+'\r\n70\r\n0\r\n62\r\n'+[7,2,3,1,4,8,9,6,7,5][k%10]+'\r\n6\r\nCONTINUOUS\r\n').join('');let out=h.slice(0,j)+rec+h.slice(j);if(m)out=out.slice(0,i)+out.slice(i).replace(/^2\r\nLAYER\r\n70\r\n\d+/,'2\r\nLAYER\r\n70\r\n'+(N(m[1])+add.length));return out;}catch{return h;}};

// DXF 2010 (o exportador em uso): cria as layers de texto com handles novos
window.layers85b=d=>{try{const NL='\r\n';const re=/  0\r\nLAYER\r\n  5\r\n([0-9A-F]+)\r\n330\r\n([0-9A-F]+)\r\n100\r\nAcDbSymbolTableRecord\r\n100\r\nAcDbLayerTableRecord\r\n  2\r\nTEXTOS\r\n[\s\S]*?(?=\r\n  0\r\n)/;const m=d.match(re);if(!m)return d;
 const have=new Set([...d.matchAll(/AcDbLayerTableRecord\r\n  2\r\n([^\r]+)/g)].map(x=>x[1]));const add=LAYERS.filter(l=>!have.has(l));if(!add.length)return d;
 let mx=0;for(const x of d.matchAll(/\r\n *(?:5|105)\r\n([0-9A-F]{1,8})\r\n/g)){const v=parseInt(x[1],16);if(v>mx)mx=v;}const hs=d.match(/\$HANDSEED\r\n *5\r\n([0-9A-F]+)/);if(hs)mx=Math.max(mx,parseInt(hs[1],16));
 const cols=[7,2,3,1,4,8,9,6,7,5];let h=mx+1;const recs=add.map((l,k)=>m[0].replace(/(  5\r\n)[0-9A-F]+/,'$1'+(h++).toString(16).toUpperCase()).replace(/(  2\r\n)TEXTOS/,'$1'+l).replace(/( 62\r\n)\d+/,'$1'+cols[k%10])).join(NL);
 let out=d.replace(m[0],m[0]+NL+recs);out=out.replace(/(  2\r\nLAYER\r\n  5\r\n[0-9A-F]+\r\n330\r\n0\r\n100\r\nAcDbSymbolTable\r\n 70\r\n)(\d+)/,(a,p1,n)=>p1+(Number(n)+add.length));
 if(hs)out=out.replace(/(\$HANDSEED\r\n *5\r\n)[0-9A-F]+/,'$1'+(h+1).toString(16).toUpperCase());return out;}catch(e){console.error('V85 layers',e);return d;}};
// ---------- quadro “Tamanho dos textos” (mm no papel)
const dlg=document.createElement('dialog');dlg.id='txt85dlg';document.body.append(dlg);
function open(){C=load();dlg.innerHTML='<form method="dialog" class="t85"><h3>Aa · Tamanho dos textos nas pranchas</h3><p class="note">Altura da letra maiúscula <b>em mm no papel</b>, igual em qualquer escala (como o “cm plotado” do TQS). Vale para as pranchas, o PDF e o DXF. Fica salvo neste computador como padrão do escritório.</p><table>'+ROWS.map(([k,l])=>'<tr><td>'+l+'</td><td><input type="number" step="0.1" min="0.5" max="15" data-k="'+k+'" value="'+C[k]+'"> mm</td><td class="d85">padrão '+String(DEF[k]).replace('.',',')+'</td></tr>').join('')+'<tr><td><b>Fator geral</b> (1,0 = normal; 1,2 = tudo 20% maior)</td><td><input type="number" step="0.05" min="0.5" max="3" data-k="fator" value="'+C.fator+'"></td><td class="d85">padrão 1,0</td></tr></table><div class="b85"><button value="ok" id="t85ok">Salvar e montar as pranchas</button><button type="button" id="t85def" class="secondary">Restaurar o padrão</button><button value="cancel" class="secondary">Fechar</button></div></form>';
 dlg.querySelector('#t85def').onclick=()=>dlg.querySelectorAll('input[data-k]').forEach(i=>i.value=DEF[i.dataset.k]);
 dlg.querySelector('#t85ok').onclick=e=>{const o={};dlg.querySelectorAll('input[data-k]').forEach(i=>{const v=N(String(i.value).replace(',','.'));o[i.dataset.k]=v>0?v:DEF[i.dataset.k];});C={...DEF,...o};try{localStorage.setItem('txt85',JSON.stringify(C));}catch{}applyCSS();
  try{if(window.plotSheets26?.length||$('plotPreview26')?.children.length){const b=[...document.querySelectorAll('#plot26 button')].find(x=>/Montar/.test(x.textContent));b?.click();}}catch{}
  const st=$('plotStatus26');if(st)st.textContent='Tamanhos dos textos atualizados.';};
 dlg.showModal();}
window.txt85open=open;
// botão na área das pranchas
{const anchor=document.querySelector('#plot26 button');if(anchor){const b=document.createElement('button');b.type='button';b.className='secondary';b.id='txt85btn';b.textContent='Aa Tamanho dos textos';b.onclick=open;anchor.parentElement.insertBefore(b,anchor);}}
const st=document.createElement('style');st.textContent='#txt85dlg{max-width:760px;border:0;border-radius:10px;padding:0;box-shadow:0 10px 40px #0005}#txt85dlg .t85{padding:16px 18px}#txt85dlg h3{margin:0 0 6px;color:#174a78}#txt85dlg table{width:100%;border-collapse:collapse;font-size:13.5px;margin:8px 0}#txt85dlg td{padding:4px 6px;border-bottom:1px solid #e1e7ee}#txt85dlg input{width:72px;padding:3px 6px}#txt85dlg .d85{color:#6b7c8d;font-size:12px;white-space:nowrap}#txt85dlg .b85{display:flex;gap:8px;justify-content:flex-end}';document.head.append(st);
})();
