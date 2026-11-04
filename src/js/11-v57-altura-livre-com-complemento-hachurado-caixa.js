// V57 — altura livre com complemento hachurado, caixa de resultado da modulação, arrastar a planta com a mão e vão de porta reconhecido na planta.
(function(){
'use strict';
const N=v=>Number(v);
const fmt57=v=>Number(v).toLocaleString('pt-BR',{maximumFractionDigits:1});

// ---------- 1. Altura que não fecha no módulo: modula as fiadas inteiras e deixa a sobra do topo como complemento
function gapOf(m,w){if(!m?.rows?.length||m.errors?.length)return 0;const step=N(m.step)||20,H=N(m.H)||N(w?.height),c=Math.floor((H+.01)/step),g=Math.round((H-c*step)*10)/10;return g>.05?g:0;}
function decorate(R){R=R||state.results;if(!Array.isArray(R))return;R.forEach((m,i)=>{const w=state.walls[i];if(!m||!w||!m.rows?.length||m.errors?.length)return;const step=N(m.step)||20,H=N(m.H)||N(w.height),c=Math.floor((H+.01)/step),gap=Math.round((H-c*step)*10)/10;
 if(gap>.05){m.topGap57=gap;const t='Altura '+fmt57(H)+' cm: '+c+' fiadas inteiras ('+fmt57(c*step)+' cm) + complemento de '+fmt57(gap)+' cm no topo (hachura) — definir em obra (bloco cortado, canaleta ou ajuste com a laje).';m.warnings??=[];if(!m.warnings.includes(t))m.warnings.push(t);}else delete m.topGap57;});}
// hachura do complemento nas elevações
const baseSvg=svgWall;
svgWall=function(w,m,which,...rest){const html=baseSvg(w,m,which,...rest);const gap=gapOf(m,w);if(which!=='elevation'||!(gap>0))return html;
 const box=document.createElement('div');box.innerHTML=html;const svg=box.querySelector('svg');if(!svg)return html;
 const rects=[...svg.querySelectorAll('rect[onclick^="selectPiece"]')];if(!rects.length)return html;
 const scale=10/Math.max(1,num($('scale').value)),top=Math.min(...rects.map(r=>N(r.getAttribute('y')))),x0=Math.min(...rects.map(r=>N(r.getAttribute('x')))),x1=Math.max(...rects.map(r=>N(r.getAttribute('x'))+N(r.getAttribute('width'))));
 const jv=N(m.jv)||0,gh=(gap+jv/2)*scale,y0=top-gh;if(!(gh>0))return html;
 const id='hatch57-'+(state.walls.indexOf(w)+1);
 let g=`<defs><pattern id="${id}" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="2" stroke="#b5651d" stroke-width=".25"/></pattern></defs>`;
 g+=`<g data-complement57="1"><rect x="${x0}" y="${y0}" width="${x1-x0}" height="${gh}" fill="url(#${id})" stroke="#b5651d" stroke-width=".2"/>`;
 const fs=Math.min(2.2,Math.max(1.3,gh*.55));g+=`<text x="${(x0+x1)/2}" y="${y0+gh/2+fs*.35}" text-anchor="middle" font-size="${fs}" fill="#7a3d0a" paint-order="stroke" stroke="#fff" stroke-width=".5">Complemento ${fmt57(gap)} cm — definir em obra</text></g>`;
 svg.insertAdjacentHTML('beforeend',g);return box.innerHTML;};

// ---------- 2. Caixa de resultado logo abaixo de "Gerar modulação"
function tips(msg,w,i,m){
 const step=20,H=N(w.height);
 if(/marque esta parede como conferida/.test(msg))return ['Parede ainda não conferida','Confira comprimento, altura e espessura na lista de paredes e marque “Conferida”. Toda vez que uma medida é alterada a parede volta a ficar não conferida.',true];
 if(/Cadastre blocos ativos com a espessura/.test(msg))return ['Sem bloco para essa espessura','A parede está com '+fmt57(w.width)+' cm de espessura e não há bloco ativo com essa medida. Corrija a espessura (ex.: 14) ou ative a família correspondente no catálogo.'];
 if(/Altura não fecha/.test(msg))return ['Altura não fecha nas fiadas','Altura '+fmt57(H)+' cm. Use múltiplos de '+step+' cm (ex.: '+Math.floor(H/step)*step+' ou '+Math.ceil(H/step)*step+' cm).'];
 if(/peitoril e topo precisam coincidir/.test(msg))return [msg.split(':')[0]+': peitoril ou altura fora das fiadas','Peitoril e topo da abertura precisam cair nas fiadas de '+step+' cm (ex.: porta peitoril 0 e altura 220; janela peitoril 100 e altura 120).'];
 if(/dimensões inválidas ou fora da parede/.test(msg))return [msg.split(':')[0]+': fora da parede','A abertura passa do fim da parede ou tem medida zerada. Confira a distância e a largura em “Editar abertura”.'];
 if(/Aberturas sobrepostas/.test(msg))return ['Aberturas sobrepostas','Duas aberturas ocupam o mesmo trecho. Apague ou corrija uma delas.'];
 if(/não fecha com as peças/.test(msg))return [msg.replace(/:.*$/,'')+': trecho não fecha com os blocos','Esse trecho não fecha com as peças cadastradas. Ajuste o comprimento da parede ou a posição/largura da abertura em poucos centímetros (posições em múltiplos de 5 cm costumam fechar) ou cadastre a peça complementar.'];
 if(/Limite desta versão/.test(msg))return ['Parede grande demais','Divida a parede em duas (até 50 m de comprimento e 40 m de altura).'];
 if(/precisão de 0,1 cm/.test(msg))return ['Medida com casas decimais demais','Arredonde comprimento, altura e espessura para no máximo uma casa decimal.'];
 if(/Número de fiadas/.test(msg))return ['Altura fora do limite','A altura precisa ter de 1 a 200 fiadas.'];
 if(/Dimensões ou juntas inválidas/.test(msg))return ['Medida inválida','Confira se comprimento, altura e espessura estão preenchidos com valores positivos e se as juntas estão corretas.'];
 if(/limites de junta|mesma altura/.test(msg))return ['Configuração geral',msg+' (vale para todas as paredes).'];
 if(/Parede ainda não calculada/.test(msg))return ['Ainda não calculada','Clique em “Gerar modulação” novamente.'];
 if(/amarra|defasagem|junta/i.test(msg))return ['Amarração não atendida',msg+' Ajuste o comprimento ou a abertura alguns centímetros, ou revise a defasagem mínima.'];
 return ['Não modulada',msg];
}
function report(){
 let box=$('genReport57');const anchor=$('generate')?.closest('.toolbar');if(!anchor)return;
 if(!box){box=document.createElement('div');box.id='genReport57';box.className='genReport57 noPrint';anchor.after(box);}
 const R=state.results;if(!R||!state.walls.length){box.style.display='none';return;}
 const ok=[],bad=[],pend=[],comp=[],noLine=[];
 state.walls.forEach((w,i)=>{const m=R[i];if(!w.line)noLine.push(i+1);
  if(!m){bad.push({i,w,items:[['Sem resultado','Clique em “Gerar modulação” novamente.']]});return;}
  const errs=m.errors?.length?m.errors:m.sourceErrors?.length?m.sourceErrors:null;
  if(errs){const own=errs.filter(e=>!/^Compatibiliza/.test(e));bad.push({i,w,old:!m.errors?.length,blocked:!own.length,items:own.map(e=>tips(e,w,i,m))});return;}
  if(m.pending){pend.push({i,w,msg:m.statusReason||'Pendente — revise o desenho.'});return;}
  ok.push(i+1);const g=gapOf(m,w);if(g>0)comp.push(i+1+' ('+fmt57(g)+' cm)');});
 const total=state.walls.length,roots=bad.filter(b=>!b.blocked),blocked=bad.filter(b=>b.blocked),unconf=roots.filter(b=>b.items.some(t=>t[2])).map(b=>b.i);
 let h='<div class="gr57head"><b>Resultado da modulação:</b> '+ok.length+' de '+total+' parede(s) modulada(s)'+(pend.length?' · '+pend.length+' com pendência':'')+(bad.length?' · '+bad.length+' sem resultado':'')+'<button type="button" class="secondary gr57close" title="Fechar">✕</button></div>';
 if(ok.length)h+='<p class="gr57ok">✔ Moduladas: Parede '+ok.join(', ')+'.</p>';
 const go=i=>' <button type="button" class="secondary gr57go" data-row="'+i+'">Ir para a parede</button>';
 if(roots.length){h+='<div class="gr57sec"><b>Resolva primeiro'+(blocked.length?' (estas travam as demais)':'')+':</b>';
  if(unconf.length)h+='<p class="gr57fix">'+(unconf.length===1?'1 parede está':unconf.length+' paredes estão')+' aguardando conferência. <button type="button" id="gr57confirm" class="secondary">Já conferi: marcar como conferida'+(unconf.length>1?'s':'')+' e gerar de novo</button></p>';
  h+='<ul>'+roots.map(b=>'<li><b>Parede '+(b.i+1)+'</b>'+(b.old?' <i>(mostrando o desenho anterior)</i>':'')+' — '+b.items.map(t=>'<span class="gr57why">'+esc(t[0])+'.</span> '+esc(t[1])).join('<br>')+go(b.i)+'</li>').join('')+'</ul></div>';}
 if(blocked.length)h+='<div class="gr57sec"><b>Sem resultado só por causa das paredes acima:</b> Parede '+blocked.map(b=>b.i+1).join(', ')+'. <span class="gr57note">Os encontros (L, T e X) são calculados em conjunto; quando uma parede tem erro, as ligadas a ela também param. Corrigindo '+(roots.length?'a'+(roots.length>1?'s':'')+' Parede'+(roots.length>1?'s':'')+' '+roots.map(b=>b.i+1).join(', '):'o problema indicado')+' e gerando de novo, estas voltam a modular.</span></div>';
 if(pend.length)h+='<div class="gr57sec"><b>Moduladas com pendência:</b><ul>'+pend.map(p=>'<li><b>Parede '+(p.i+1)+'</b> — '+esc(p.msg)+' <button type="button" class="secondary gr57see" data-row="'+p.i+'">Ver desenho</button></li>').join('')+'</ul></div>';
 if(comp.length)h+='<p class="gr57note">Complemento hachurado no topo (altura fora das fiadas de 20 cm): Parede '+comp.join(', ')+'.</p>';
 if(noLine.length)h+='<p class="gr57note">Sem posição na planta (aparecem só na elevação, não na planta conjunta): Parede '+noLine.join(', ')+'.</p>';
 box.className='genReport57 noPrint '+(bad.length?'bad':pend.length?'warn':'good');box.innerHTML=h;box.style.display='block';
 box.querySelector('.gr57close').onclick=()=>{box.style.display='none';};
 box.querySelectorAll('.gr57go').forEach(b=>b.onclick=()=>{const tr=$('walls').querySelectorAll('tr')[N(b.dataset.row)];if(tr){tr.scrollIntoView({behavior:'smooth',block:'center'});tr.classList.add('gr57flash');setTimeout(()=>tr.classList.remove('gr57flash'),2500);}});
 box.querySelectorAll('.gr57see').forEach(b=>b.onclick=()=>$('wall-result-'+b.dataset.row)?.scrollIntoView({behavior:'smooth',block:'start'}));
 const c=$('gr57confirm');if(c)c.onclick=()=>{for(const i of unconf)state.walls[i].confirmed=true;renderWalls();invalidate?.();$('generate').click();};
}
// ---------- mantém a tela no mesmo lugar quando o resultado é redesenhado
function anchor57(){const out=$('output');if(!out)return null;const r=out.getBoundingClientRect();if(r.top>innerHeight*.5||r.bottom<0)return {y:scrollY};
 const els=[...out.querySelectorAll('[id^="wall-result-"],.globalOverview,article.wallResult')];for(const[n,el]of els.entries()){const b=el.getBoundingClientRect();if(b.bottom>60)return {id:el.id,n,cls:el.className,top:b.top,y:scrollY};}return {y:scrollY};}
function restore57(a){if(!a)return;if(a.id||a.n!==undefined){const out=$('output'),el=a.id?$(a.id):[...out.querySelectorAll('[id^="wall-result-"],.globalOverview,article.wallResult')][a.n];if(el){const d=el.getBoundingClientRect().top-a.top;if(Math.abs(d)>2)scrollBy(0,d);return;}}if(Math.abs(scrollY-a.y)>2)scrollTo(scrollX,a.y);}
let depth57=0;const keep57=fn=>function(...a){const anc=depth57++?null:anchor57();try{return fn.apply(this,a);}finally{depth57--;if(anc){restore57(anc);requestAnimationFrame(()=>restore57(anc));}}};
const rr=renderResults;renderResults=function(...a){try{decorate(Array.isArray(a[1])?a[1]:null);decorate();}catch(e){console.error(e);}const r=rr.apply(this,a);try{report();}catch(e){console.error(e);}return r;};
renderResults=keep57(renderResults);{const rw=renderWalls;renderWalls=keep57(rw);}
const inv=invalidate;invalidate=function(...a){const r=inv.apply(this,a);const b=$('genReport57');if(b&&b.style.display!=='none'&&!b.querySelector('.gr57stale'))b.insertAdjacentHTML('afterbegin','<p class="gr57stale">As entradas mudaram depois deste resultado. Clique em “Gerar modulação” para atualizar.</p>');return r;};
{const iv=invalidate;invalidate=keep57(iv);}

// ---------- 3. Mãozinha: arrastar a planta com o mouse
{const wrap=$('planWrap');let down=null,panning=false,suppress=false;
 const idle=()=>!mode&&!document.body.classList.contains('tool56')&&!mark57;
 wrap.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==1)return;if(!image)return;down={x:e.clientX,y:e.clientY,l:wrap.scrollLeft,t:wrap.scrollTop,id:e.pointerId,btn:e.button};panning=false;if(e.button===1)e.preventDefault();});
 wrap.addEventListener('pointermove',e=>{if(!down){wrap.style.cursor=image&&idle()?'grab':'';return;}const dx=e.clientX-down.x,dy=e.clientY-down.y;if(!panning&&Math.hypot(dx,dy)>5){panning=true;try{wrap.setPointerCapture(down.id);}catch{}wrap.style.cursor='grabbing';}
  if(panning){wrap.scrollLeft=down.l-dx;wrap.scrollTop=down.t-dy;e.preventDefault();}});
 const end=()=>{if(panning)suppress=true;down=null;panning=false;wrap.style.cursor=image&&idle()?'grab':'';};
 wrap.addEventListener('pointerup',end);wrap.addEventListener('pointercancel',end);
 wrap.addEventListener('click',e=>{if(suppress){suppress=false;e.stopImmediatePropagation();e.preventDefault();}},true);
 wrap.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault();});
 wrap.addEventListener('dragstart',e=>e.preventDefault());
}

// ---------- 4. Vão da porta/janela reconhecido na planta
let mark57=null;Object.defineProperty(window,'mark57on',{get:()=>!!mark57,configurable:true});
const kOf=w=>{const[a,b]=w.line,len=Math.hypot(b.x-a.x,b.y-a.y);return N(scaleForWall23?.(w))||N(w.planScale)||(len/N(w.length))||pxCm||1;};
const snapW=v=>{const r=Math.round(v/5)*5;return Math.abs(r-v)<=2?r:Math.round(v*2)/2;};
const snapS=v=>{const r=Math.round(v/2.5)*2.5;return Math.abs(r-v)<=1.5?r:Math.round(v*2)/2;};
function pixels(){if(!image)return null;let cv=image;if(!(cv instanceof HTMLCanvasElement)){if(!image.width)return null;cv=document.createElement('canvas');cv.width=image.width;cv.height=image.height;try{cv.getContext('2d').drawImage(image,0,0);}catch{return null;}}
 try{return {ctx:cv.getContext('2d',{willReadFrequently:true}),W:cv.width,H:cv.height};}catch{return null;}}
// procura, ao longo da parede, o trecho em que as linhas das faces desaparecem
function detectGap(w,pClick){if(!w?.line)return null;const px=pixels();if(!px)return null;const[a,b]=w.line,len=Math.hypot(b.x-a.x,b.y-a.y);if(len<5)return null;
 const k=kOf(w),ux=(b.x-a.x)/len,uy=(b.y-a.y)/len,nx=-uy,ny=ux,half=N(w.width)*k/2;if(!(half>=1.5))return null;
 const pad=Math.ceil(half*1.6+3),x0=Math.max(0,Math.floor(Math.min(a.x,b.x)-pad)),y0=Math.max(0,Math.floor(Math.min(a.y,b.y)-pad)),x1=Math.min(px.W,Math.ceil(Math.max(a.x,b.x)+pad)),y1=Math.min(px.H,Math.ceil(Math.max(a.y,b.y)+pad));if(x1<=x0||y1<=y0)return null;
 let data;try{data=px.ctx.getImageData(x0,y0,x1-x0,y1-y0).data;}catch{return null;}const IW=x1-x0;
 const dark=(x,y)=>{x=Math.round(x)-x0;y=Math.round(y)-y0;if(x<0||y<0||x>=IW||y>=y1-y0)return false;const o=(y*IW+x)*4;return data[o+3]>40&&(data[o]*.3+data[o+1]*.59+data[o+2]*.11)<215;};
 const t0=Math.max(1,half*.55),t1=half*1.45+1.5,steps=Math.ceil(len),solid=new Uint8Array(steps+1);
 for(let s=0;s<=steps;s++){const cx=a.x+ux*s,cy=a.y+uy*s;let A=false,B=false;for(let t=t0;t<=t1&&!(A&&B);t+=.7){if(!A&&dark(cx+nx*t,cy+ny*t))A=true;if(!B&&dark(cx-nx*t,cy-ny*t))B=true;}solid[s]=A&&B?1:0;}
 const runs=[];let s=0;while(s<=steps){if(solid[s]){s++;continue;}let e=s;while(e<=steps&&!solid[e])e++;runs.push([s,e-1]);s=e;}
 const L=N(w.length),sc=len/L,minPx=40*sc,maxPx=400*sc;
 const cand=runs.filter(([s,e])=>s>0&&e<steps&&(e-s+1)>=minPx&&(e-s+1)<=maxPx);if(!cand.length)return null;
 const sc0=pClick?Math.max(0,Math.min(len,(pClick.x-a.x)*ux+(pClick.y-a.y)*uy)):len/2;
 cand.sort((r1,r2)=>{const d=r=>sc0<r[0]?r[0]-sc0:sc0>r[1]?sc0-r[1]:0;return d(r1)-d(r2);});
 const[g0,g1]=cand[0],dist=sc0<g0?g0-sc0:sc0>g1?sc0-g1:0;if(dist>60*sc)return null;
 let r0=g0/sc,r1=(g1+1)/sc;if(window.clipGap58)[r0,r1]=window.clipGap58(w,r0,r1);if(r1-r0<30)return null;const start=snapS(r0),width=snapW(r1-r0);return {start,width,raw:[r0,r1]};}
window.detectGap57=detectGap;
// todos os vãos ao longo da parede (planta em PDF/imagem)
window.detectGapsAll57=function(w){if(!w?.line)return [];const[a,b]=w.line,len=Math.hypot(b.x-a.x,b.y-a.y),L=N(w.length),sc=len/L,res=[];let from=0,guard=0;
 while(from<len&&guard++<40){const t=(from+60*sc)/len,P={x:a.x+(b.x-a.x)*Math.min(1,t),y:a.y+(b.y-a.y)*Math.min(1,t)};const g=detectGap(w,P);if(!g||g.raw[1]*sc<=from+1){from+=60*sc;continue;}if(!res.some(r=>Math.abs(r.start-g.start)<2))res.push(g);from=g.raw[1]*sc+1;}
 return res;};
const sel57=()=>{const s=openingSelection;if(!s)return null;const i=Number.isInteger(s.index)?s.index:state.walls.findIndex(w=>w.uid===s.uid);return i>=0?{i,w:state.walls[i],info:s.info,k:s.k}:null;};
function applyGap(start,width,source){const s=sel57();if(!s||!s.info)return false;const info=s.info;
 if(start<info.spanStart-.01||start+width>info.spanEnd+.01){note('O vão marcado ('+fmt57(start)+' a '+fmt57(start+width)+' cm) sai do trecho selecionado. Confira ou digite as medidas.',true);return false;}
 const d=info.fromLow?start-info.spanStart:info.spanEnd-(start+width);
 const di=$('openingDistance40'),wi=$('openingWidth');if(!di||!wi)return false;di.value=(Math.round(d*10)/10).toFixed(1);wi.value=fmt57(width).replace(',','.');
 const tp=$('openingType40');if(tp&&!s.k?.toString().match(/^\d+$/)||tp&&s.k<0){/* mantém o tipo escolhido */}
 note(source+': início a '+fmt57(start)+' cm do começo da parede, largura '+fmt57(width)+' cm. Confira tipo, altura e peitoril e clique em “Criar”.');return true;}
function note(t,warn){const p=$('openings');if(!p)return;let n=p.querySelector('.gap57note');if(!n){n=document.createElement('p');n.className='note gap57note';p.querySelector('.openingGrid42')?.before(n);}n.textContent=t;n.style.color=warn?'#a3361f':'#1d6b3a';}
function addMarkButton(){const p=$('openings');if(!p||p.classList.contains('hidden'))return;const bar=p.querySelector('.toolbar');if(!bar||bar.querySelector('.mark57'))return;const s=sel57();if(!s?.info)return;
 const b=document.createElement('button');b.type='button';b.className='secondary mark57';b.textContent='Marcar vão na planta (2 cliques)';b.title='Clique no começo e no fim do vão no desenho; distância e largura são preenchidas sozinhas.';b.onclick=()=>{mark57={i:s.i,uid:s.w.uid,pts:[]};$('planStatus').textContent='Marcar vão da Parede '+(s.i+1)+': clique no começo do vão no desenho (Esc cancela).';$('plan').scrollIntoView?.({block:'nearest'});};bar.insertBefore(b,bar.children[1]||null);}
new MutationObserver(()=>addMarkButton()).observe($('openings'),{childList:true});
const ooe=openOpeningEditor;openOpeningEditor=function(i,p,k=-1){const r=ooe.call(this,i,p,k);try{if(k<0&&p&&typeof p==='object'){const g=detectGap(state.walls[i],p);addMarkButton();if(g)applyGap(g.start,g.width,'Vão reconhecido na planta');else note('Não encontrei o vão no desenho perto do clique. Use “Marcar vão na planta (2 cliques)” ou digite a distância.',true);}}catch(e){console.error(e);}return r;};
function raw57(e){const c=$('plan'),r=c.getBoundingClientRect();return {x:(e.clientX-r.left)*c.width/r.width+(c.planOrigin25?.x||0),y:(e.clientY-r.top)*c.height/r.height+(c.planOrigin25?.y||0)};}
$('plan').addEventListener('click',e=>{if(!mark57)return;e.stopImmediatePropagation();e.preventDefault();const w=state.walls.find(x=>x.uid===mark57.uid);if(!w?.line){mark57=null;return;}
 const p=raw57(e),[a,b]=w.line,len=Math.hypot(b.x-a.x,b.y-a.y),t=Math.max(0,Math.min(1,((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/(len*len)));mark57.pts.push(t*N(w.length));
 if(mark57.pts.length<2){$('planStatus').textContent='Agora clique no fim do vão.';drawPlan();return;}
 const[s1,s2]=mark57.pts,start=snapS(Math.min(s1,s2)),width=snapW(Math.abs(s2-s1));mark57=null;drawPlan();
 if(width<10){$('planStatus').textContent='Vão muito pequeno. Clique de novo em “Marcar vão na planta”.';return;}
 $('planStatus').textContent='Vão marcado: '+fmt57(width)+' cm.';applyGap(start,width,'Vão marcado na planta');$('openings')?.scrollIntoView?.({behavior:'smooth',block:'nearest'});},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mark57){mark57=null;$('planStatus').textContent='Marcação do vão cancelada.';drawPlan();}});
const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);if(!mark57?.pts?.length||!image)return r;const w=state.walls.find(x=>x.uid===mark57.uid);if(!w?.line)return r;const c=$('plan'),ctx=c.getContext('2d'),o=c.planOrigin25||{x:0,y:0},[A,B]=w.line,len=Math.hypot(B.x-A.x,B.y-A.y),t=mark57.pts[0]/N(w.length),P={x:A.x+(B.x-A.x)*t,y:A.y+(B.y-A.y)*t},hw=N(w.width)*kOf(w);ctx.save();ctx.setTransform(1,0,0,1,-o.x,-o.y);ctx.strokeStyle='#d1462f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(P.x-(B.y-A.y)/len*hw,P.y+(B.x-A.x)/len*hw);ctx.lineTo(P.x+(B.y-A.y)/len*hw,P.y-(B.x-A.x)/len*hw);ctx.stroke();ctx.restore();return r;};

const css=document.createElement('style');css.textContent=`
#planWrap{touch-action:none}
.genReport57{display:none;margin:10px 0;padding:10px 14px;border-radius:8px;border:2px solid #8fb3d6;background:#f3f8fd;color:#102e4b;font-size:14px;line-height:1.45}
.genReport57.good{border-color:#5aa36f;background:#f1faf3}.genReport57.warn{border-color:#e0a23a;background:#fff9ec}.genReport57.bad{border-color:#d1462f;background:#fff4f1}
.gr57head{display:flex;gap:8px;align-items:center;justify-content:space-between}.gr57close{padding:2px 8px}
.genReport57 ul{margin:4px 0 6px 18px;padding:0}.genReport57 li{margin:4px 0}.gr57why{font-weight:600;color:#a3361f}
.gr57ok{color:#1d6b3a;margin:6px 0}.gr57note{color:#586c7c;margin:4px 0}.gr57stale{color:#a3361f;font-weight:600;margin:0 0 6px}
.genReport57 button.secondary{padding:2px 8px;font-size:12px;margin-left:6px}
#walls tr.gr57flash td{background:#ffe9a8!important;transition:background .3s}`;
document.head.append(css);
})();
// V70 — parede sem posição (interna/externa) definida: respaldo em canaleta U por padrão, com aviso (antes ficava sem canaleta e sem aço no topo)
(function(){
const okLoc=l=>['Interna','Externa','Mista'].includes(l);
const base=ChannelEngine.apply;
ChannelEngine.apply=function(walls,results,blocks,settings){const fixed=walls.map(w=>{if(!w||okLoc(w.location))return w;const L=Number(w.length)||0;return {...w,location:'Interna',locationSegments24:[{start:0,end:L,location:'Interna',channel:'U'}],locationAssumed70:true};});
 const out=base.call(this,fixed,results,blocks,settings);
 out.forEach((m,i)=>{if(m&&fixed[i]?.locationAssumed70&&!m.errors?.length){const t='Posição da parede (interna/externa) não definida: última fiada lançada em canaleta U por padrão. Confira a “Posição da parede” na lista da seção 3 (externa usa canaleta J).';m.warnings??=[];if(!m.warnings.includes(t))m.warnings.unshift(t);}});
 return out;};
})();
