// V88 — como no AutoCAD: zoom pela rodinha no ponto do cursor (estável), duplo clique na rodinha = ver tudo,
// Aparar (TRIM) e Estender (EXTEND) de paredes. Sem janelas: Esc / Enter / botão direito encerram; Ctrl+Z desfaz.
(function(){
'use strict';
const wrap=$('planWrap'),cv=$('plan');if(!wrap||!cv)return;
const N=v=>Number(v)||0;
// ================= ZOOM =================
const ZMAX=12,STEP=1.25;           // cada "dente" da rodinha = 25% (igual aos botões antigos)
let pad={x:0,y:0},fitDone=null,redrawT=null;
function fitZoom(){const W=wrap.clientWidth,H=wrap.clientHeight;if(!W||!H||!cv.width||!cv.height)return 1;return Math.max(.02,Math.min((W-30)/cv.width,(H-30)/cv.height));}
const zMin=()=>Math.min(.25,fitZoom()*.5);
// margem em volta do desenho: deixa qualquer ponto ficar sob o cursor (como a área infinita do CAD)
function setPad(){const W=wrap.clientWidth,H=wrap.clientHeight;if(!W||!H)return false;const nx=Math.round(W*.6),ny=Math.round(H*.6);if(nx===pad.x&&ny===pad.y)return true;
 const dx=nx-pad.x,dy=ny-pad.y;cv.style.margin=ny+'px '+nx+'px';pad={x:nx,y:ny};wrap.scrollLeft+=dx;wrap.scrollTop+=dy;try{window.grid88upd?.();}catch{}return true;}
let myZoom=null;
function size(){myZoom=zoom;cv.style.width=(cv.width*zoom)+'px';cv.style.height=(cv.height*zoom)+'px';try{window.grid88upd?.();}catch{}}
function later(){if(redrawT)clearTimeout(redrawT);redrawT=setTimeout(()=>{redrawT=null;drawPlan();},140);}
function zoomAt(f,cx,cy){if(!image)return;const r=cv.getBoundingClientRect();if(!r.width)return;const u=(cx-r.left)/r.width,v=(cy-r.top)/r.height;
 const z=Math.max(zMin(),Math.min(ZMAX,zoom*f));if(Math.abs(z-zoom)<1e-9)return;zoom=z;size();
 const r2=cv.getBoundingClientRect();wrap.scrollLeft+=(r2.left+u*r2.width)-cx;wrap.scrollTop+=(r2.top+v*r2.height)-cy;later();}
function centerOn(px,py){/* px,py em pixels do desenho (sem origem) */wrap.scrollLeft=cv.offsetLeft+px*zoom-wrap.clientWidth/2;wrap.scrollTop=cv.offsetTop+py*zoom-wrap.clientHeight/2;}
let lastDim='';
function fit(){if(!image||!setPad())return false;zoom=fitZoom();size();centerOn(cv.width/2,cv.height/2);fitDone=image;later();return true;}
const centerZoom=f=>{const r=wrap.getBoundingClientRect();zoomAt(f,r.left+r.width/2,r.top+r.height/2);};
wrap.addEventListener('wheel',e=>{if(!image)return;e.preventDefault();
 let d=e.deltaY*(e.deltaMode===1?33:e.deltaMode===2?400:1);if(e.ctrlKey)d*=3; // pinça do touchpad
 d=Math.max(-240,Math.min(240,d));zoomAt(Math.pow(STEP,-d/100),e.clientX,e.clientY);},{passive:false});
// duplo clique na rodinha = ver tudo (ZOOM EXTENSÃO)
let lastMid=0;wrap.addEventListener('pointerdown',e=>{if(e.button!==1)return;const t=performance.now();if(t-lastMid<380){e.preventDefault();lastMid=0;fit();return;}lastMid=t;},true);
// botões antigos: zoom no centro da tela
{const zi=$('zoomIn'),zo=$('zoomOut');if(zi)zi.onclick=()=>centerZoom(STEP);if(zo)zo.onclick=()=>centerZoom(1/STEP);}
{const b=document.createElement('button');b.id='fit88';b.type='button';b.className='secondary';b.textContent='Ver tudo';b.title='Enquadra a planta inteira (ou duplo clique na rodinha do mouse).';b.onclick=()=>{fit();};($('zoomOut')||$('cancel'))?.after(b);}
// o redesenho mantém margem; planta nova (ou primeira vez visível) = ver tudo
{const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);try{const ok=setPad();const dim=cv.width+'x'+cv.height;
 if(ok&&image&&zoom===1&&myZoom!==null&&myZoom!==1){ // a planta foi recarregada (o programa volta o zoom a 1)
  if(dim===lastDim){zoom=myZoom;size();fitDone=image;}else fitDone=null;}
 if(ok&&image&&fitDone!==image){if(fitDone&&dim===lastDim){fitDone=image;}else requestAnimationFrame(()=>{if(fitDone!==image)fit();});}if(image)lastDim=cv.width+'x'+cv.height;}catch(e){}return r;};}
new ResizeObserver(()=>{if(setPad()&&image&&fitDone!==image)fit();}).observe(wrap);
window.zoom88={fit,zoomAt,centerOn,pad:()=>({...pad}),fitZ:fitZoom};

// ================= APARAR / ESTENDER =================
const WT=()=>window.walltool56;
let T88=null; // {kind:'trim'|'extend', hover, fence}
const pg=()=>num($('page').value);
const onPage=w=>w?.line&&Number(w.page||1)===pg();
const kOf=w=>WT().kOf(w);
const nm=w=>'Parede '+(state.walls.indexOf(w)+1);
const fmt88=v=>(Math.round(v*10)/10).toLocaleString('pt-BR');
const cr=(ax,ay,bx,by)=>ax*by-ay*bx;
// pontos onde outras paredes cortam a parede W (cm desde o início de W). Toda parede é aresta de corte, como no AutoCAD.
function cuts(W){const[a,b]=W.line,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),L=N(W.length);if(len<1||!L)return [];const k=kOf(W),out=[];
 for(const O of state.walls){if(O===W||!onPage(O))continue;const[c,d]=O.line,ex=d.x-c.x,ey=d.y-c.y,l2=Math.hypot(ex,ey);if(l2<1)continue;
  const den=cr(dx,dy,ex,ey);if(Math.abs(den)/(len*l2)<.17)continue; // paralelas
  const t=cr(c.x-a.x,c.y-a.y,ex,ey)/den,u=cr(c.x-a.x,c.y-a.y,dx,dy)/den,tol=(N(W.width)*k*.65+2)/l2;
  if(u<-tol||u>1+tol)continue;const s=t*L;if(s>1&&s<L-1)out.push({s,O});}
 return out.sort((p,q)=>p.s-q.s);}
const sAt=(W,P)=>{const[a,b]=W.line,dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy||1;return Math.max(0,Math.min(1,((P.x-a.x)*dx+(P.y-a.y)*dy)/l2))*N(W.length);};
const ptAt=(W,s)=>{const[a,b]=W.line,t=s/N(W.length);return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};};
// trecho que sai ao aparar no ponto P
function trimPlan(W,P){const s0=sAt(W,P),L=N(W.length),cs=cuts(W);let lo=0,hi=L;for(const c of cs){if(c.s<s0)lo=c.s;else if(c.s>s0){hi=c.s;break;}}
 // vão desenhado na planta (porta/passagem sem parede) dentro do trecho: sai só o vão
 try{const g=window.detectGap57?.(W,P);if(g&&s0>=g.start-3&&s0<=g.start+g.width+3&&g.start>=lo-1&&g.start+g.width<=hi+1)return {W,lo:Math.max(lo,g.start),hi:Math.min(hi,g.start+g.width),gap:true};}catch{}
 return {W,lo,hi,all:lo<=0&&hi>=L};}
function doTrim(p){if(!p)return '';const{W,lo,hi}=p;if(p.all){const i=state.walls.indexOf(W);state.walls.splice(i,1);return nm0(i)+' apagada: não havia outra parede cortando (como no AutoCAD).';}
 const before=state.walls.indexOf(W);const msg=WT().cutWall(W,lo,hi);return p.gap?'Vão aberto na '+nm0(before)+': '+msg:msg;}
const nm0=i=>'Parede '+(i+1);
// estender: ponta mais perto do clique até a próxima parede na direção dela
function extendPlan(W,P){const[a,b]=W.line,len=Math.hypot(b.x-a.x,b.y-a.y);if(len<1)return null;const k=kOf(W);
 const idx=Math.hypot(P.x-a.x,P.y-a.y)<=Math.hypot(P.x-b.x,P.y-b.y)?0:1,E=W.line[idx],F=W.line[1-idx],ux=(E.x-F.x)/len,uy=(E.y-F.y)/len;
 let best=null;for(const O of state.walls){if(O===W||!onPage(O))continue;const[c,d]=O.line,ex=d.x-c.x,ey=d.y-c.y,l2=Math.hypot(ex,ey);if(l2<1)continue;
  const den=cr(ux,uy,ex,ey);if(Math.abs(den)/l2<.17)continue;const t=cr(c.x-E.x,c.y-E.y,ex,ey)/den,u=cr(c.x-E.x,c.y-E.y,ux,uy)/den,tol=(N(W.width)*k*.65+2)/l2;
  if(u<-tol||u>1+tol)continue;if(t<=.5*k)continue;if(!best||t<best.t)best={t,O,X:{x:E.x+ux*t,y:E.y+uy*t}};}
 return best?{W,idx,E,...best,cm:best.t/k}:{W,idx,E,none:true};}
function doExtend(p){if(!p)return '';if(p.none)return 'Nenhuma parede na direção dessa ponta da '+nm(p.W)+'. Estender vai só até outra parede.';
 const{W,idx,X,O}=p,before=N(W.length);WT().setEnd(W,idx,X);W.confirmed=false;delete W.manualRows;return nm(W)+' estendida até o eixo da '+nm(O)+' ('+fmt88(before)+' → '+fmt88(N(W.length))+' cm).';}
// ---- clique / cerca
function wallAt(P){const i=WT().near56(P);return i>=0?state.walls[i]:null;}
function plan(kind,P){const W=wallAt(P);if(!W)return null;return kind==='trim'?trimPlan(W,P):extendPlan(W,P);}
function act(kind,P){if(kind==='trim'){try{const m=window.trimEdge97?.(P);if(m)return m;}catch(e){console.error('V97.1 aparar beiral',e);}}const p=plan(kind,P);if(!p)return null;return kind==='trim'?doTrim(p):doExtend(p);}
// cerca: paredes cruzadas pela linha arrastada
function fenceHits(A,B){const out=[];const dx=B.x-A.x,dy=B.y-A.y;for(const W of state.walls){if(!onPage(W))continue;const[a,b]=W.line,ex=b.x-a.x,ey=b.y-a.y,den=cr(dx,dy,ex,ey);if(Math.abs(den)<1e-9)continue;
 const t=cr(a.x-A.x,a.y-A.y,ex,ey)/den,u=cr(a.x-A.x,a.y-A.y,dx,dy)/den;if(t>=0&&t<=1&&u>=0&&u<=1)out.push({W,P:{x:a.x+ex*u,y:a.y+ey*u}});}return out;}
function runFence(kind,A,B){const hits=fenceHits(A,B);if(!hits.length)return 'A cerca não cruzou nenhuma parede.';const msgs=[];
 // planeja tudo antes (os índices mudam ao dividir)
 const plans=hits.map(h=>kind==='trim'?trimPlan(h.W,h.P):extendPlan(h.W,h.P)).filter(Boolean);
 for(const p of plans){if(!state.walls.includes(p.W))continue;msgs.push(kind==='trim'?doTrim(p):doExtend(p));}
 return (kind==='trim'?'Aparadas ':'Estendidas ')+plans.length+' parede(s). '+(msgs.length===1?msgs[0]:'');}
// ---- ferramenta
function status(t){$('planStatus').textContent=t;}
const help={trim:'Aparar: clique no pedaço da parede que deve sair (vai até as paredes que cruzam). Arraste para aparar várias. Shift+clique = estender. Esc ou Enter encerra.',
 extend:'Estender: clique perto da ponta da parede; ela vai até a próxima parede. Arraste para estender várias. Shift+clique = aparar. Esc ou Enter encerra.'};
function start(kind){if(!image){status('Carregue a planta primeiro.');return;}try{(window.stopAll108||window.cancelTool56)?.();}catch{}try{$('cancel')?.click();}catch{}mode='';points=[];
 T88={kind,hover:null,down:null,fence:null};document.body.classList.add('tool56','cad88');status(help[kind]);drawPlan();}
function stop(){if(!T88)return;T88=null;document.body.classList.remove('tool56','cad88');drawPlan();status('');}
window.trim88={start:()=>start('trim'),extend:()=>start('extend'),stop,active:()=>T88?.kind||null,trimAt:(P,shift)=>act(shift?'extend':'trim',P),extendAt:(P,shift)=>act(shift?'trim':'extend',P),fence:runFence,cuts};
for(const[id,k,lab]of [['trim88','trim','Aparar'],['extend88','extend','Estender']]){const b=document.createElement('button');b.id=id;b.type='button';b.className='secondary';b.textContent=lab;b.title=help[k];b.onclick=()=>start(k);($('cut56')||$('cancel'))?.after(b);}
const kindNow=e=>e.shiftKey?(T88.kind==='trim'?'extend':'trim'):T88.kind;
const raw=e=>WT().rawPoint(e);
cv.addEventListener('pointerdown',e=>{if(!T88||e.button!==0)return;e.preventDefault();e.stopImmediatePropagation();T88.down={P:raw(e),x:e.clientX,y:e.clientY,id:e.pointerId};try{cv.setPointerCapture(e.pointerId);}catch{}},true);
cv.addEventListener('pointermove',e=>{if(!T88)return;const P=raw(e);
 if(T88.down){if(T88.fence||Math.hypot(e.clientX-T88.down.x,e.clientY-T88.down.y)>6){T88.fence={A:T88.down.P,B:P};T88.hover=null;paint();}return;}
 const kind=kindNow(e),p=plan(kind,P),key=p?kind+(state.walls.indexOf(p.W))+':'+(p.lo??'')+':'+(p.hi??'')+':'+(p.idx??'')+':'+(p.t??''):'';if(key!==(T88.hoverKey||'')){T88.hover=p?{kind,p}:null;T88.hoverKey=key;paint();}},true);
cv.addEventListener('pointerup',e=>{if(!T88||!T88.down||e.button!==0)return;e.preventDefault();e.stopImmediatePropagation();const d=T88.down,kind=kindNow(e);T88.down=null;let msg;
 if(T88.fence){const f=T88.fence;T88.fence=null;msg=runFence(kind,f.A,f.B);}else{msg=act(kind,d.P);if(msg===null)msg='Nenhuma parede aqui. Clique sobre a linha da parede.';}
 T88.hover=null;T88.hoverKey='';WT().refresh(msg);status(msg+'  ·  '+(T88.kind==='trim'?'Aparar':'Estender')+' continua ativo (Esc encerra).');},true);
cv.addEventListener('click',e=>{if(!T88)return;e.preventDefault();e.stopImmediatePropagation();},true);
cv.addEventListener('contextmenu',e=>{if(!T88)return;e.preventDefault();stop();},true);
document.addEventListener('keydown',e=>{if(!T88)return;if(e.target.closest?.('input,textarea,select'))return;if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();stop();}
 if(e.key==='Shift'&&T88.hover){T88.hoverKey='';}});
// outra ferramenta escolhida = encerra
document.addEventListener('click',e=>{if(!T88)return;const b=e.target.closest?.('button');if(!b||b.id==='trim88'||b.id==='extend88')return;if(b.classList.contains('tl85')&&/^(Aparar|Estender)$/.test(b.title))return;if(b.classList.contains('tl85')||b.closest('#controls'))stop();},true);
// desenho da prévia: trecho que sai (vermelho tracejado), extensão (verde tracejado), cerca
let raf=0;function paint(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;drawPlan();});}
{const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);if(!T88||!image)return r;try{const ctx=cv.getContext('2d'),o=cv.planOrigin25||{x:0,y:0},lw=Math.max(2,3/zoom);ctx.save();ctx.setTransform(1,0,0,1,-o.x,-o.y);ctx.lineCap='round';
 const h=T88.hover;if(h){const p=h.p;if(h.kind==='trim'){const A=ptAt(p.W,p.lo),B=ptAt(p.W,p.hi),k=kOf(p.W),wd=N(p.W.width)*k;ctx.strokeStyle='rgba(200,40,30,.28)';ctx.lineWidth=wd+4/zoom;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();ctx.strokeStyle='#c8281e';ctx.lineWidth=lw;ctx.setLineDash([8/zoom,6/zoom]);ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();}
  else if(!p.none){const k=kOf(p.W),wd=N(p.W.width)*k;ctx.strokeStyle='rgba(30,140,80,.25)';ctx.lineWidth=wd;ctx.beginPath();ctx.moveTo(p.E.x,p.E.y);ctx.lineTo(p.X.x,p.X.y);ctx.stroke();ctx.strokeStyle='#1e8c50';ctx.lineWidth=lw;ctx.setLineDash([8/zoom,6/zoom]);ctx.beginPath();ctx.moveTo(p.E.x,p.E.y);ctx.lineTo(p.X.x,p.X.y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#1e8c50';ctx.beginPath();ctx.arc(p.X.x,p.X.y,5/zoom,0,7);ctx.fill();}
  else{ctx.fillStyle='#c8281e';ctx.beginPath();ctx.arc(p.E.x,p.E.y,6/zoom,0,7);ctx.fill();}}
 const f=T88.fence;if(f){ctx.setLineDash([6/zoom,4/zoom]);ctx.strokeStyle='#1769c2';ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(f.A.x,f.A.y);ctx.lineTo(f.B.x,f.B.y);ctx.stroke();
  ctx.setLineDash([]);ctx.fillStyle=T88.kind==='trim'?'#c8281e':'#1e8c50';for(const hh of fenceHits(f.A,f.B)){ctx.beginPath();ctx.arc(hh.P.x,hh.P.y,5/zoom,0,7);ctx.fill();}}
 ctx.restore();}catch(e){console.error(e);}return r;};}
const css=document.createElement('style');css.textContent='body.cad88 #plan{cursor:crosshair!important}';document.head.append(css);
})();
// V88.1 — (1) avisos da planta (fantasma, cargas) num cantinho fixo, fora do desenho; (2) fundo quadriculado como no AutoCAD,
// com cor escolhida (branco, cinza claro, cinza escuro, escuro do CAD); (3) zoom pela rodinha também nas elevações e no editor.
(function(){
'use strict';
const wrap=$('planWrap'),cv=$('plan');if(!wrap||!cv)return;
const LS=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch{}return null;};
// ---------- (1) cantinho de avisos
const hud=document.createElement('div');hud.id='hud88';hud.className='noPrint';const hudIn=document.createElement('div');hudIn.className='in88';hud.append(hudIn);wrap.prepend(hud);
function showHud(list){const seen=new Set(),items=(list||[]).filter(x=>x&&x.t&&!seen.has(x.t)&&seen.add(x.t));hudIn.innerHTML=items.map(x=>'<div style="color:'+x.c+'">'+String(x.t).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))+'</div>').join('');hud.style.display=items.length&&image?'':'none';}
// ---------- (2) fundo e quadriculado
const THEMES={branco:{bg:'#ffffff',mi:'#eef1f5',ma:'#d9e0e8',dark:false,nome:'Branco'},claro:{bg:'#eef1f4',mi:'#e1e6eb',ma:'#cbd3dc',dark:false,nome:'Cinza claro'},
 medio:{bg:'#d5dbe1',mi:'#c8cfd7',ma:'#b3bcc6',dark:false,nome:'Cinza médio'},escuro:{bg:'#212830',mi:'#2e3742',ma:'#41505f',dark:true,nome:'Escuro (CAD)'},
 preto:{bg:'#000000',mi:'#151a20',ma:'#262e38',dark:true,nome:'Preto'}};
let theme=LS('bg88')in THEMES?LS('bg88'):'escuro',grid=LS('grid88')!=='0';
// o desenho de fundo vira "tinta sobre transparente": o branco do DXF/PDF some e o quadriculado da tela inteira aparece por baixo
const cache=new WeakMap();
function ink(img,dark){const key=dark?'d':'l';let c=cache.get(img);if(!c||c.w!==img.width||c.h!==img.height){c={w:img.width,h:img.height};cache.set(img,c);}if(c[key]!==undefined)return c[key];
 try{const W=img.width,H=img.height;if(!W||!H)throw 0;const k=document.createElement('canvas');k.width=W;k.height=H;const x=k.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);const d=x.getImageData(0,0,W,H),p=d.data;
  for(let i=0;i<p.length;i+=4){const r=p[i],g=p[i+1],b=p[i+2],a0=p[i+3]/255;const a=Math.max(255-r,255-g,255-b)/255;if(a<=0.004){p[i+3]=0;continue;}
   let R=255-(255-r)/a,G=255-(255-g)/a,B=255-(255-b)/a;if(dark){const R2=255-R,G2=255-G,B2=255-B,mx=Math.max(R2,G2,B2),mn=Math.min(R2,G2,B2),s=mx+mn;R=s-R2;G=s-G2;B=s-B2;} // inverte a claridade e mantém a cor
   p[i]=R;p[i+1]=G;p[i+2]=B;p[i+3]=Math.round(a*a0*255);}
  x.putImageData(d,0,0);c[key]=k;}catch(e){c[key]=null;}return c[key];}
function steps(){const z=typeof zoom==='number'&&zoom>0?zoom:1,pc=typeof pxCm==='number'&&pxCm>0?pxCm:1;let mi=20,ma=100;const px=c=>c*pc*z;if(px(mi)<7){mi=100;ma=500;}if(px(mi)<7){mi=500;ma=2500;}if(px(mi)<7){mi=2500;ma=12500;}return {mi:mi*pc*z,ma:ma*pc*z};}
// quadriculado na tela toda (fundo da área da planta), preso às coordenadas do desenho: anda junto ao arrastar e aproximar
function gridUpd(){const T=THEMES[theme];wrap.style.backgroundColor=T.bg;if(!grid||!image){wrap.style.backgroundImage='none';return;}
 const {mi,ma}=steps(),o=cv.planOrigin25||{x:0,y:0},z=typeof zoom==='number'&&zoom>0?zoom:1,x0=cv.offsetLeft-o.x*z,y0=cv.offsetTop-o.y*z;
 const L=(c,dir)=>'linear-gradient('+dir+','+c+' 1px,transparent 1px)';
 wrap.style.backgroundImage=[L(T.ma,'to right'),L(T.ma,'to bottom'),L(T.mi,'to right'),L(T.mi,'to bottom')].join(',');
 wrap.style.backgroundSize=[ma,ma,ma,ma,mi,mi,mi,mi].reduce((a,v,i)=>i%2?a:a.concat(v+'px '+[ma,ma,ma,ma,mi,mi,mi,mi][i+1]+'px'),[]).join(',');
 const pos=s=>(((x0%s)+s)%s)+'px '+(((y0%s)+s)%s)+'px';wrap.style.backgroundPosition=[pos(ma),pos(ma),pos(mi),pos(mi)].join(',');wrap.style.backgroundAttachment='local';}
window.grid88upd=()=>{gridUpd();try{txtPos();}catch{}};
function under(ctx){/* fundo agora é a própria tela quadriculada: aqui não pinta nada */}
window.under88=under;
function drawImg(ctx,img,args,di){const T=THEMES[theme],k=ink(img,T.dark);if(k)return di.call(ctx,k,...args);
 // se a imagem não puder ser lida, volta ao jeito antigo (folha pintada)
 const o=cv.planOrigin25||{x:0,y:0};ctx.save();ctx.fillStyle=T.bg;ctx.fillRect(o.x,o.y,cv.width,cv.height);ctx.globalCompositeOperation=T.dark?'difference':'multiply';di.call(ctx,img,...args);ctx.restore();}
// V93 — textos da planta numa camada de vetor por cima do desenho: nítidos em qualquer zoom, sem caixa branca (contorno no lugar)
const tsv=document.createElementNS('http://www.w3.org/2000/svg','svg');tsv.id='txt93';tsv.setAttribute('aria-hidden','true');wrap.append(tsv);let texts=[];
function txtPos(){tsv.style.left=cv.offsetLeft+'px';tsv.style.top=cv.offsetTop+'px';tsv.style.width=cv.style.width;tsv.style.height=cv.style.height;tsv.setAttribute('viewBox','0 0 '+cv.width+' '+cv.height);}
const escX=t=>String(t).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
function txtDraw(){txtPos();let zRef=1;try{zRef=window.zoom88?.fitZ?.()||1;}catch{}if(!(zRef>0))zRef=1;const T=THEMES[theme],halo=T.dark?'rgba(22,27,33,.92)':'rgba(255,255,255,.95)';let h='';
 for(const q of texts){const mm=/(bold|[6-9]00)?[^\d]*?([\d.]+)px\s*(.*)$/i.exec(q.font||'')||[];let fs=Number(mm[2])||10;const fam=(mm[3]||'Arial').replace(/"/g,"'");const big=/^Parede \d+$/.test(q.t);if(big)fs*=(window.lbl118?.fator||1.8);else if(!q.fx&&!/✓|×/.test(q.t)){fs=fs*q.z/zRef;} // V94.1: todos os textos com tamanho fixo no desenho (acompanham o zoom, como SALA/COZINHA)
  const anc=q.align==='center'?'middle':q.align==='right'||q.align==='end'?'end':'start',bl=q.base==='middle'?'middle':q.base==='top'||q.base==='hanging'?'hanging':q.base==='bottom'?'text-after-edge':'auto';
  let fill=typeof q.fill==='string'?q.fill:'#102e4b';if(T.dark&&/^#(1|0|2[0-9a-f])/i.test(fill))fill='#d6e4f2';
  h+='<text transform="matrix('+q.M.join(' ')+')" x="'+q.x+'" y="'+q.y+'" font-size="'+fs+'" font-family="'+fam+'" font-weight="'+(window.fino108?.on?'400':(mm[1]||big?'700':'400'))+'" text-anchor="'+anc+'" dominant-baseline="'+bl+'" fill="'+fill+'"'+(q.a<1?' opacity="'+q.a+'"':'')+' stroke="'+halo+'" stroke-width="'+(fs*(window.fino108?.on?.18:.28))+'" stroke-linejoin="round" paint-order="stroke">'+escX(q.t)+'</text>';}
 tsv.innerHTML=h;}
window.txt93={count:()=>texts.length};
{const dp=drawPlan;drawPlan=function(...a){window.hud88=[];const P=CanvasRenderingContext2D.prototype,di=P.drawImage,ft=P.fillText,st=P.strokeText;const img=typeof image!=='undefined'?image:null;texts=[];
 P.drawImage=function(x,...r){if(img&&x===img&&this.canvas===cv)return drawImg(this,x,r,di);return di.call(this,x,...r);};
 P.fillText=function(t,x,y,...r){if(this.canvas!==cv)return ft.call(this,t,x,y,...r);try{const m=this.getTransform();texts.push({t,x,y,fx:!!window.__txtFixed,z:(typeof zoom==='number'&&zoom>0?zoom:1),M:[m.a,m.b,m.c,m.d,m.e,m.f],font:this.font,fill:this.fillStyle,align:this.textAlign,base:this.textBaseline,a:this.globalAlpha});}catch{return ft.call(this,t,x,y,...r);}};
 P.strokeText=function(...r){if(this.canvas!==cv)return st.apply(this,r);};
 let r;try{r=dp.apply(this,a);}finally{P.drawImage=di;P.fillText=ft;P.strokeText=st;const l=window.hud88;window.hud88=null;try{showHud(l);}catch{}try{txtDraw();}catch(e){console.error('V93 textos',e);}}
 try{gridUpd();}catch{}return r;};}
// painel de fundo (abre pela faixa "Fundo" e pelo painel Visibilidade)
const pop=document.createElement('div');pop.id='bg88pop';pop.className='noPrint';pop.hidden=true;document.body.append(pop);
function render(){pop.innerHTML='<div class="t88">Fundo da planta</div><div class="sw88">'+Object.entries(THEMES).map(([k,T])=>'<button type="button" data-t="'+k+'" class="'+(k===theme?'on':'')+'"><i style="background:'+T.bg+';background-image:linear-gradient('+T.ma+' 1px,transparent 1px),linear-gradient(90deg,'+T.ma+' 1px,transparent 1px);background-size:9px 9px"></i>'+T.nome+'</button>').join('')+'</div>'+
 '<label class="g88"><input type="checkbox" '+(grid?'checked':'')+'> Quadriculado (linhas a cada 20 cm, mais fortes a cada 1 m)</label><div class="n88">Só a tela: pranchas e DXF não mudam.</div>';}
function openAt(el){render();const r=(el||$('vis87btn')||wrap).getBoundingClientRect();pop.style.left=Math.max(8,Math.min(innerWidth-300,r.left))+'px';pop.style.top=(r.bottom+4)+'px';pop.hidden=false;}
pop.addEventListener('click',e=>{e.stopPropagation();const b=e.target.closest('button[data-t]');if(b){theme=b.dataset.t;LS('bg88',theme);render();drawPlan();}});
pop.addEventListener('change',e=>{if(e.target.type==='checkbox'){grid=e.target.checked;LS('grid88',grid?'1':'0');drawPlan();}});
document.addEventListener('click',e=>{if(!pop.hidden&&!pop.contains(e.target)&&!e.target.closest?.('#bg88btn,[title="Fundo"]'))pop.hidden=true;});
document.addEventListener('keydown',e=>{if(e.key==='Escape')pop.hidden=true;});
{const b=document.createElement('button');b.id='bg88btn';b.type='button';b.className='secondary';b.textContent='Fundo da planta';b.style.display='none';b.onclick=e=>{e.stopPropagation();const rb=document.querySelector('#rib85 .tl85[title="Fundo"]');openAt(rb&&rb.offsetParent?rb:null);};document.body.append(b);}
// atalho dentro do painel Visibilidade
{const vp=$('vis87pop');if(vp)new MutationObserver(()=>{if(vp.hidden||vp.querySelector('.bg88lnk'))return;const f=vp.querySelector('.f87v');if(!f)return;const a=document.createElement('button');a.type='button';a.className='bg88lnk';a.textContent='▦ Fundo e quadriculado…';a.onclick=e=>{e.stopPropagation();vp.hidden=true;openAt($('vis87btn'));};f.before(a);}).observe(vp,{childList:true,attributes:true});}
window.bg88={THEMES,set:(t,g)=>{if(t in THEMES){theme=t;LS('bg88',t);}if(g!==undefined){grid=!!g;LS('grid88',grid?'1':'0');}drawPlan();},get:()=>({theme,grid}),open:openAt};

// ---------- (3) zoom nas elevações e no editor (rodinha no cursor, rodinha apertada arrasta, duplo clique na rodinha volta)
const ZMAX=8,STEP=1.25;let lastPass=0;
// elevações: o conteúdo de cada .wallViews ganha um "palco" que escala
function stage(v){let s=v.querySelector(':scope>.s88');if(s)return s;const cs=getComputedStyle(v),W=v.scrollWidth,H=v.scrollHeight,h0=v.clientHeight;
 s=document.createElement('div');s.className='s88';const z=document.createElement('div');z.className='z88';
 for(const k of ['display','flexDirection','flexWrap','alignItems','justifyContent','gap','rowGap','columnGap','gridTemplateColumns','gridTemplateRows','gridAutoFlow'])z.style[k]=cs[k];
 z.style.position='relative';z.style.width=W+'px';z.style.height=H+'px';z.style.transformOrigin='0 0';while(v.firstChild)z.append(v.firstChild);s.append(z);v.append(s);
 s.style.width=W+'px';s.style.height=H+'px';s.dataset.w=W;s.dataset.h=H;s.dataset.z='1';v.style.height=h0+'px';v.style.display='block';v.classList.add('zoom88');return s;}
function setZ(v,z,cx,cy){const s=stage(v),zz=s.firstChild,old=+s.dataset.z||1;z=Math.max(1,Math.min(ZMAX,z));if(Math.abs(z-old)<1e-9)return false;
 const r=v.getBoundingClientRect(),ux=(v.scrollLeft+cx-r.left)/old,uy=(v.scrollTop+cy-r.top)/old;
 s.dataset.z=z;zz.style.transform=z===1?'':'scale('+z+')';s.style.width=(+s.dataset.w*z)+'px';s.style.height=(+s.dataset.h*z)+'px';
 v.scrollLeft=ux*z-(cx-r.left);v.scrollTop=uy*z-(cy-r.top);return true;}
const zOf=v=>+(v.querySelector(':scope>.s88')?.dataset.z||1);
const LISTZOOM=false; // V91: na lista de elevações a rodinha só rola a página; o zoom fica no Editar elevação
document.addEventListener('wheel',e=>{if(!LISTZOOM)return;const v=e.target.closest?.('#output .wallViews');if(!v||e.ctrlKey&&!e.deltaY)return;const now=performance.now(),z=zOf(v);
 // rolando a lista: enquanto a página está rolando, a rodinha continua rolando a página
 if(z<=1&&(e.deltaY>0||now-lastPass<650)){lastPass=now;return;}
 e.preventDefault();let d=e.deltaY*(e.deltaMode===1?33:e.deltaMode===2?400:1);d=Math.max(-240,Math.min(240,d));setZ(v,z*Math.pow(STEP,-d/100),e.clientX,e.clientY);},{passive:false});
document.addEventListener('scroll',()=>{lastPass=performance.now();},true);
// editor da elevação: o próprio desenho (svg) muda de tamanho dentro da área com rolagem
let edZ=1,edNat=null;
function edSvg(){return document.querySelector('#ed86 #ed86svg');}
function edApply(){const s=edSvg();if(!s)return;if(!edNat||edNat.svg!==s){s.style.width='';s.style.height='';const r=s.getBoundingClientRect();edNat={svg:s,w:r.width,h:r.height};}if(edZ!==1){s.style.width=(edNat.w*edZ)+'px';s.style.height=(edNat.h*edZ)+'px';s.style.maxWidth='none';}}
document.addEventListener('wheel',e=>{const cvv=e.target.closest?.('#ed86 .cv86');if(!cvv)return;const s=edSvg();if(!s)return;e.preventDefault();edApply();
 let d=e.deltaY*(e.deltaMode===1?33:e.deltaMode===2?400:1);d=Math.max(-240,Math.min(240,d));const old=edZ,z=Math.max(.5,Math.min(ZMAX,old*Math.pow(STEP,-d/100)));if(Math.abs(z-old)<1e-9)return;
 const r=s.getBoundingClientRect(),u=(e.clientX-r.left)/r.width,w=(e.clientY-r.top)/r.height;edZ=z;s.style.width=(edNat.w*z)+'px';s.style.height=(edNat.h*z)+'px';s.style.maxWidth='none';
 const r2=s.getBoundingClientRect();cvv.scrollLeft+=r2.left+u*r2.width-e.clientX;cvv.scrollTop+=r2.top+w*r2.height-e.clientY;},{passive:false});
{const box=$('ed86');if(box)new MutationObserver(()=>{const s=edSvg();if(s&&edNat&&edNat.svg!==s){const keep=edZ;edNat=null;edZ=1;edApply();edZ=keep;edApply();}if(box.hidden){edZ=1;edNat=null;}}).observe(box,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});}
// rodinha apertada: arrasta; duplo clique na rodinha: volta ao tamanho normal
let drag=null,lastMid=0;
document.addEventListener('pointerdown',e=>{if(e.button!==1)return;const v=e.target.closest?.(LISTZOOM?'#output .wallViews,#ed86 .cv86':'#ed86 .cv86');if(!v)return;e.preventDefault();const t=performance.now();
 if(t-lastMid<380){lastMid=0;if(v.classList.contains('cv86')){edZ=1;const s=edSvg();if(s){s.style.width='';s.style.height='';s.style.maxWidth='';}edNat=null;}else{const r=v.getBoundingClientRect();setZ(v,1,r.left,r.top);v.scrollLeft=0;v.scrollTop=0;}return;}
 lastMid=t;drag={v,x:e.clientX,y:e.clientY,l:v.scrollLeft,tp:v.scrollTop};v.style.cursor='grabbing';},true);
document.addEventListener('pointermove',e=>{if(!drag)return;drag.v.scrollLeft=drag.l-(e.clientX-drag.x);drag.v.scrollTop=drag.tp-(e.clientY-drag.y);},true);
document.addEventListener('pointerup',e=>{if(!drag)return;drag.v.style.cursor='';drag=null;},true);
document.addEventListener('auxclick',e=>{if(e.button===1&&e.target.closest?.('#output .wallViews,#ed86 .cv86'))e.preventDefault();},true);
// V89.1 — mãozinha: clicar e arrastar move a elevação aproximada (cliques curtos continuam valendo para o aço e os blocos)
let hand=null,handSup=false;
const busy=()=>document.body.classList.contains('addSteel53')||document.body.classList.contains('st83on');
const onSteel=t=>t.closest?.('g[data-man53],[data-hit],[data-steel-kind],button,input,select,a,#st83pop');
document.addEventListener('pointerdown',e=>{if(!LISTZOOM||e.button!==0||busy())return;const v=e.target.closest?.('#output .wallViews');if(!v||zOf(v)<=1||onSteel(e.target))return;
 hand={v,x:e.clientX,y:e.clientY,l:v.scrollLeft,tp:v.scrollTop,id:e.pointerId,on:false};},true);
document.addEventListener('pointermove',e=>{const v=LISTZOOM?e.target.closest?.('#output .wallViews'):null;
 if(!hand){if(v)v.style.cursor=zOf(v)>1&&!busy()&&!onSteel(e.target)?'grab':'';return;}
 const dx=e.clientX-hand.x,dy=e.clientY-hand.y;if(!hand.on&&Math.hypot(dx,dy)>5){hand.on=true;try{hand.v.setPointerCapture(hand.id);}catch{}hand.v.style.cursor='grabbing';document.body.style.userSelect='none';}
 if(hand.on){hand.v.scrollLeft=hand.l-dx;hand.v.scrollTop=hand.tp-dy;e.preventDefault();}},true);
const handEnd=()=>{if(!hand)return;if(hand.on){handSup=true;setTimeout(()=>{handSup=false;},0);hand.v.style.cursor='grab';document.body.style.userSelect='';}hand=null;};
document.addEventListener('pointerup',handEnd,true);document.addEventListener('pointercancel',handEnd,true);
document.addEventListener('click',e=>{if(handSup){handSup=false;e.stopImmediatePropagation();e.preventDefault();}},true);
window.zoomElev88={setZ,zOf,ed:()=>edZ};
const css=document.createElement('style');css.textContent=
'#txt93{position:absolute;pointer-events:none;z-index:3;overflow:visible}#hud88{position:sticky;top:0;left:0;width:0;height:0;z-index:6;pointer-events:none}#hud88 .in88{position:absolute;top:8px;left:10px;width:max-content;max-width:min(70vw,900px);background:rgba(255,255,255,.92);border:1px solid #c9d3de;border-radius:6px;padding:4px 9px;font:600 12px/1.45 Arial,sans-serif;box-shadow:0 1px 4px rgba(16,46,75,.12)}'+
'#bg88pop{position:fixed;z-index:9999;background:#fff;border:1px solid #b9c6d3;border-radius:8px;box-shadow:0 8px 24px rgba(16,46,75,.18);padding:10px 12px;width:280px;font-size:13px;color:#102e4b}#bg88pop .t88{font-weight:700;margin-bottom:8px}'+
'#bg88pop .sw88{display:grid;grid-template-columns:1fr 1fr;gap:6px}#bg88pop .sw88 button{display:flex;align-items:center;gap:7px;padding:6px 7px;border:1px solid #c9d3de;border-radius:6px;background:#fff;color:#102e4b;font-size:12.5px;cursor:pointer;margin:0}#bg88pop .sw88 button.on{border-color:#1769c2;box-shadow:0 0 0 2px #1769c233}#bg88pop .sw88 i{width:22px;height:18px;border-radius:3px;border:1px solid #9aa7b4;flex:none}'+
'#bg88pop .g88{display:flex;gap:6px;align-items:flex-start;margin:10px 0 4px;font-size:12.5px;line-height:1.3}#bg88pop .n88{color:#5b6d7f;font-size:11.5px}.bg88lnk{display:block;width:100%;text-align:left;margin:6px 0 0;padding:6px 8px;border:1px dashed #b9c6d3;border-radius:6px;background:#f5f8fb;color:#174a78;cursor:pointer;font-size:12.5px}'+
'.wallViews.zoom88{overflow:auto!important}';document.head.append(css);
})();
