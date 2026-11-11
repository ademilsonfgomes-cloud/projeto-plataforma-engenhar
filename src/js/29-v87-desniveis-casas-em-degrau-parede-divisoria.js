// V87 — Desníveis: casas em degrau, parede divisória com base mais baixa, laje em outra cota.
// Clique na parede = a parede inteira sobe/desce · Shift+clique = só a base · clique dentro do ambiente = nível da laje.
// Valores sempre em fiadas inteiras (altura do bloco + junta). Sem janelas: Ctrl+Z desfaz.
(function(){
'use strict';
const N=Number,f0=v=>(v>0?'+':v<0?'−':'±')+Math.abs(Math.round(v)).toLocaleString('pt-BR');
function stepOf(w){const W=N(w?.width)||14,b=(state.blocks||[]).find(b=>b.active!==false&&b.type!=='Canaleta'&&N(b.width)===W&&N(b.height)>0)||(state.blocks||[]).find(b=>b.active!==false&&b.type!=='Canaleta'&&N(b.height)>0);return (N(b?.height)||19)+(num($('jv')?.value)||1);}
const base=w=>N(w.base87)||0,top=w=>N(w.top87)||0;
const COLS={'-6':'#7c3aed','-5':'#6d28d9','-4':'#2563eb','-3':'#0891b2','-2':'#0d9488','-1':'#16a34a','1':'#ca8a04','2':'#ea580c','3':'#dc2626','4':'#be123c'};
const colOf=(d,st)=>COLS[String(Math.max(-6,Math.min(4,Math.round(d/(st||20)))))]||'#475569';

// ---------- aplicar desnível
function setWall(w,d,baseOnly){const st=stepOf(w),dd=Math.round(d/st)*st;const b0=base(w),t0=top(w);
 let b1,t1;if(baseOnly){b1=dd;t1=t0;}else{t1=dd;b1=dd+(b0-t0);}
 const dH=(b0-b1)+(t1-t0),H1=N(w.height)+dH;if(H1<2*st-.01)return 'A '+name(w)+' ficaria com menos de duas fiadas.';
 const shift=(b0-b1)-(t0-t1);// aberturas acompanham o piso do lado de cima
 for(const o of w.openings||[]){if(N(o.bottom)+shift<-.01)return 'Uma abertura da '+name(w)+' ficaria abaixo da base. Desça a base menos ou confira a abertura.';}
 for(const o of w.openings||[])o.bottom=Math.round((N(o.bottom)+shift)*10)/10;
 w.height=Math.round(H1*10)/10;if(b1)w.base87=b1;else delete w.base87;if(t1)w.top87=t1;else delete w.top87;
 return '';}
const name=w=>'Parede '+(state.walls.indexOf(w)+1);
// trecho entre encontros (Ctrl+clique): a fachada é dividida nos encontros em T e só o trecho clicado muda de nível
function junctionsAlong(w){const i=state.walls.indexOf(w),out=[];try{for(const q of JunctionEngine.detect(state.walls)){if(q.a.i===i&&q.ae<0)out.push(q.ta);else if(q.b.i===i&&q.be<0)out.push(q.tb);}}catch{}return [...new Set(out.map(t=>Math.round(t*2)/2))].sort((a,b)=>a-b);}
function splitAt(W,cuts){const L=N(W.length),[a,b]=W.line,P=s=>({x:a.x+(b.x-a.x)*s/L,y:a.y+(b.y-a.y)*s/L}),k=N(W.planScale)||Math.hypot(b.x-a.x,b.y-a.y)/L;const xs=[0,...cuts.filter(c=>c>1&&c<L-1),L];if(xs.length<3)return [W];
 const ops=W.openings||[],sg=W.locationSegments24,parts=[];
 for(let n=0;n<xs.length-1;n++){const lo=xs[n],hi=xs[n+1],X=n===0?W:JSON.parse(JSON.stringify({...W,line:null,openings:[],locationSegments24:null}));
  if(n>0){X.uid='wall-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);delete X.labelPosition28;}
  X.line=[P(lo),P(hi)];X.length=Math.round((hi-lo)*2)/2;X.planScale??=k;delete X.manualRows;delete X.locked76;
  X.openings=ops.filter(o=>N(o.start)>=lo-.01&&N(o.start)+N(o.width)<=hi+.01).map(o=>({...o,start:Math.round((N(o.start)-lo)*10)/10}));
  if(Array.isArray(sg)&&sg.length){let v=sg.map(x=>({...x,start:Math.max(lo,N(x.start))-lo,end:Math.min(hi,N(x.end))-lo})).filter(x=>x.end>x.start+.5);if(!v.length)v=[{...sg[0],start:0,end:hi-lo}];v[0].start=0;v[v.length-1].end=hi-lo;X.locationSegments24=v;}else delete X.locationSegments24;
  parts.push(X);}
 const lost=ops.length-parts.reduce((n,p)=>n+p.openings.length,0);const g=W.group87||W.uid,s0=N(W.vaoStart87)||0;parts.forEach((p,n)=>{p.group87=g;p.vaoStart87=s0+xs[n];});state.walls.push(...parts.slice(1));try{window.splitProps54?.(W,parts,xs[1],xs[1]);}catch{}
 parts.lost87=lost;return parts;}
// vãos (como as vigas do CYPECAD/TQS): a parede é dividida em vãos em cada parede que chega ou cruza
function alongOf(w,P){const L=N(w.length),[a,b]=w.line,len=Math.hypot(b.x-a.x,b.y-a.y);return Math.max(0,Math.min(L,((P.x-a.x)*(b.x-a.x)+(P.y-a.y)*(b.y-a.y))/(len*len)*L));}
function vaoOf(w,s){const L=N(w.length),js=junctionsAlong(w);return {lo:Math.max(0,...js.filter(t=>t<=s)),hi:Math.min(L,...js.filter(t=>t>s)),js};}
function vaoLabels(){const out=new Map(),groups=new Map();state.walls.forEach((w,i)=>{if(w.group87){if(!groups.has(w.group87))groups.set(w.group87,[]);groups.get(w.group87).push(i);}});
 for(const ids of groups.values()){if(ids.length<2)continue;ids.sort((a,b)=>N(state.walls[a].vaoStart87)-N(state.walls[b].vaoStart87));const head=Math.min(...ids)+1;ids.forEach((i,k)=>out.set(i,{name:'P'+head+'·v'+(k+1),n:ids.length}));}
 return out;}
window.vao87=i=>vaoLabels().get(i)?.name||null;
function splitHere(w,P){const L=N(w.length),[a,b]=w.line,len=Math.hypot(b.x-a.x,b.y-a.y),s=Math.round(Math.max(0,Math.min(L,((P.x-a.x)*(b.x-a.x)+(P.y-a.y)*(b.y-a.y))/(len*len)*L))*2)/2;
 if(s<15||s>L-15)return '⚠ Muito perto da ponta da parede: clique mais para dentro (pelo menos 15 cm).';const parts=splitAt(w,[s]);
 return name(w)+' dividida a '+String(s).replace('.',',')+' cm: '+parts.map(p=>name(p)+' ('+p.length+' cm)').join(' e ')+'. Agora clique no pedaço que muda de nível.'+(parts.lost87?' ⚠ '+parts.lost87+' abertura(s) cruzavam o ponto e foram retiradas — confira.':'')+' Sem parede chegando no degrau, a junta fica a prumo: prever junta de controle ou grampo.';}
function sectionStep(w,P,d,baseOnly){const L=N(w.length),[a,b]=w.line,len=Math.hypot(b.x-a.x,b.y-a.y),s=Math.max(0,Math.min(L,((P.x-a.x)*(b.x-a.x)+(P.y-a.y)*(b.y-a.y))/(len*len)*L)),js=junctionsAlong(w);
 if(!js.length){const e=setWall(w,d,!!baseOnly);return e?'⚠ '+e:name(w)+': '+describe(w)+' (não há encontro no meio desta parede; para mudar só um pedaço, Alt+clique onde fica o degrau).';}
 const lo=Math.max(0,...js.filter(t=>t<=s)),hi=Math.min(L,...js.filter(t=>t>s));const parts=splitAt(w,[lo,hi]);const X=parts[lo>1&&parts.length>1?1:0];
 const e=setWall(X,d,!!baseOnly);if(e)return '⚠ '+e;return 'Trecho de '+Math.round(lo)+' a '+Math.round(hi)+' cm: '+describe(X)+'. A parede foi dividida nos encontros: '+parts.map(p=>name(p)).join(', ')+'.'+(parts.lost87?' ⚠ '+parts.lost87+' abertura(s) cruzavam a divisão e foram retiradas — confira.':'');}

function describe(w){const b=base(w),t=top(w);if(!b&&!t)return 'no nível do pavimento';if(b===t)return 'inteira em '+f0(b)+' cm';return 'base '+f0(b)+' cm · topo '+f0(t)+' cm ('+Math.round((t-b)/stepOf(w))+' fiada(s) a mais embaixo)';}

// ---------- marcas de laje (ficam junto das ações da laje, salvas no projeto)
function slabItems(){const s=state.loads77;return (s?.items||[]).filter(it=>it.kind==='dn87');}
function slabMark(P,d){state.loads77??={items:[]};state.loads77.items??=[];const pg=num($('page').value),items=state.loads77.items,z=zoom||1;
 const near=items.find(it=>it.kind==='dn87'&&N(it.page)===pg&&Math.hypot(it.pts[0].x-P.x,it.pts[0].y-P.y)<40/z);
 if(near){if(!d){items.splice(items.indexOf(near),1);return 'Desnível da laje retirado.';}near.d=d;return 'Laje neste ambiente: '+f0(d)+' cm.';}
 if(!d)return 'Clique numa parede, ou dentro de um ambiente para marcar a laje. (0 = volta ao nível do pavimento.)';
 items.push({kind:'dn87',page:pg,pts:[{x:P.x,y:P.y}],d,tgt:'piso'});return 'Laje neste ambiente: '+f0(d)+' cm. As paredes em volta mostram o apoio dela na elevação.';}
// paredes que cercam o ponto (raios em 24 direções)
function wallsAround(P,page){const hit=new Map();for(let a=0;a<24;a++){const ang=a*Math.PI/12,dx=Math.cos(ang),dy=Math.sin(ang);let best=1e9,bi=-1;
  state.walls.forEach((w,i)=>{if(!w.line||N(w.page||1)!==N(page))return;const[A,B]=w.line,ex=B.x-A.x,ey=B.y-A.y,den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)return;const t=((A.x-P.x)*ey-(A.y-P.y)*ex)/den,u=((A.x-P.x)*dy-(A.y-P.y)*dx)/den;if(t>0&&u>=-.02&&u<=1.02&&t<best){best=t;bi=i;}});
  if(bi>=0)hit.set(bi,(hit.get(bi)||0)+1);}return [...hit.entries()].filter(([,n])=>n>=1).map(([i])=>i);}
// apoios de laje no meio da parede (laje do ambiente vizinho em outra cota)
function supportsOf(i){const w=state.walls[i],out=[];if(!w)return out;for(const it of slabItems()){if(N(it.page)!==N(w.page||1))continue;if(!wallsAround(it.pts[0],it.page).includes(i))continue;
  const d=N(it.d)||0,yy=N(w.height)-(top(w)-d);if(yy>.5&&yy<N(w.height)-.5)out.push({d,yy});}return out;}
window.dn87={describe,supportsOf,setWall,stepOf,sectionStep,splitAt,junctionsAlong,splitHere};

// ---------- ferramenta na planta
let tool=null;const vals=st=>[-3,-2,-1,0,1,2,3].map(k=>k*st);const snapD=(v,st)=>Math.round((N(v)||0)/st)*st;
const bar=document.createElement('div');bar.id='dn87bar';bar.className='noPrint';bar.hidden=true;
function showBar(msg){if(!bar.isConnected)$('planStatus')?.after(bar);const st=stepOf(state.walls?.[0]);bar.hidden=!tool;if(!tool)return;
 bar.innerHTML='<b>⇅ Desníveis</b><span class="v87">'+vals(st).map(v=>'<button type="button" data-d="'+v+'" class="'+(v===tool.d?'on':'')+'" style="--c:'+(v?colOf(v,st):'#475569')+'">'+(v?f0(v):'0')+'</button>').join('')+'</span>'+
  '<label class="e87">valor <input type="number" id="dn87v" step="'+st+'" value="'+tool.d+'"> cm</label><span class="u87">de '+st+' em '+st+' (1 fiada)</span>'+
  '<span class="mo87">Aplicar em: <button type="button" data-m="trecho" class="'+(tool.mode==='trecho'?'on':'')+'">Trecho entre encontros</button><button type="button" data-m="inteira" class="'+(tool.mode==='inteira'?'on':'')+'">Parede inteira</button></span>'+
  '<span class="h87">Clique na parede: muda '+(tool.mode==='trecho'?'só o <b>trecho</b> entre as paredes que chegam nela':'a <b>parede inteira</b>')+' · <b>Shift</b>+clique: só a <b>base</b> (divisória) · <b>Alt</b>+clique: divide a parede no ponto do degrau · clique <b>dentro do ambiente</b>: laje · Ctrl+Z desfaz · Esc sai</span><button type="button" data-x="1" class="secondary">✕ Sair</button>'+
  (msg?'<div class="m87">'+esc(msg)+'</div>':'');}
bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.x){stop();return;}
 if(b.dataset.m){tool.mode=b.dataset.m;showBar(tool.mode==='trecho'?'Agora o clique muda só o trecho da parede entre os encontros (a parede é dividida ali sozinha).':'Agora o clique muda a parede inteira.');return;}
 tool.d=N(b.dataset.d);showBar('Valor escolhido: '+(tool.d?f0(tool.d)+' cm':'0 (volta ao nível do pavimento)')+'. Agora clique nas paredes ou dentro dos ambientes.');});
bar.addEventListener('change',e=>{if(e.target.id!=='dn87v')return;const st=stepOf(state.walls?.[0]),v=snapD(e.target.value,st);tool.d=v;showBar('Valor: '+(v?f0(v)+' cm':'0')+(Math.abs(N(e.target.value)-v)>.01?' (arredondado para fiada inteira de '+st+' cm)':'')+'. Agora clique nas paredes.');});
bar.addEventListener('keydown',e=>{if(e.target.id==='dn87v'&&e.key==='Enter'){e.preventDefault();e.target.blur();}e.stopPropagation();});
function start(){if(typeof image==='undefined'||!image){$('planStatus').textContent='Abra a planta primeiro (Arquitetura → Abrir PDF / DXF).';return;}try{window.cancelTool56?.();}catch{}tool={d:tool?.d??-stepOf(state.walls?.[0])*3,mode:tool?.mode||'trecho'};document.body.classList.add('dn87on');showBar('Escolha o valor (ou digite outro) e clique nas paredes. Na fachada contínua, o clique muda só o trecho daquela casa; na divisória, Shift+clique desce só a base.');drawPlan();}
function stop(){tool=null;document.body.classList.remove('dn87on');showBar('');drawPlan();}
window.dn87.start=start;window.dn87.stop=stop;window.dn87.active=()=>!!tool;
const btn=document.createElement('button');btn.type='button';btn.id='dn87btn';btn.hidden=true;btn.onclick=()=>tool?stop():start();document.body.append(btn);
function rawPoint(e){const c=$('plan'),r=c.getBoundingClientRect();return {x:(e.clientX-r.left)*c.width/r.width+(c.planOrigin25?.x||0),y:(e.clientY-r.top)*c.height/r.height+(c.planOrigin25?.y||0)};}
function near(P){let i=wallNear(P);if(i>=0)return i;let bd=1e9;state.walls.forEach((w,j)=>{if(!w.line||N(w.page||1)!==num($('page').value))return;const[a,b]=w.line,dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;if(!den)return;const t=Math.max(0,Math.min(1,((P.x-a.x)*dx+(P.y-a.y)*dy)/den)),d=Math.hypot(P.x-a.x-t*dx,P.y-a.y-t*dy),k=N(w.planScale)||Math.sqrt(den)/N(w.length)||1,lim=N(w.width)*k/2+8/(zoom||1);if(d<=lim&&d<bd){bd=d;i=j;}});return i;}
$('plan')?.addEventListener('click',e=>{if(!tool)return;e.stopImmediatePropagation();e.preventDefault();const P=rawPoint(e),i=near(P);
 if(i<0){const m=slabMark(P,tool.d);invalidate();renderWalls();drawPlan();showBar(m);return;}
 const w=state.walls[i];if(e.altKey){const m=splitHere(w,P);invalidate();renderWalls();drawPlan();showBar(m);return;}if(tool.mode==='trecho'&&!(e.ctrlKey||e.metaKey)){const m=sectionStep(w,P,tool.d,e.shiftKey);invalidate();renderWalls();drawPlan();showBar(m);return;}const err=setWall(w,tool.d,e.shiftKey);if(err){showBar('⚠ '+err);return;}
 invalidate();renderWalls();drawPlan();showBar(name(w)+': '+describe(w)+'. Gere a modulação de novo para atualizar as fiadas.');},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&tool)stop();});
let raf=0;$('plan')?.addEventListener('mousemove',e=>{if(!tool)return;const P=rawPoint(e),i=near(P);let h=null;if(i>=0){const w=state.walls[i];if(e.altKey)h={i,pt:alongOf(w,P)};else if(tool.mode==='trecho'){const v=vaoOf(w,alongOf(w,P));h={i,lo:v.lo,hi:v.hi};}else h={i,lo:0,hi:N(w.length)};}
 const k=JSON.stringify(h);if(k===tool.hk)return;tool.hk=k;tool.hover=h;if(!raf)raf=requestAnimationFrame(()=>{raf=0;drawPlan();});});
$('plan')?.addEventListener('mouseleave',()=>{if(tool?.hover){tool.hover=null;tool.hk='';drawPlan();}});
$('cancel')?.addEventListener('click',()=>{if(tool)stop();});

// ---------- desenho na planta: etiqueta de nível em cada parede com desnível e nas lajes
try{const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);try{if(typeof image==='undefined'||!image)return r;const pg=num($('page').value),ws=(state.walls||[]).filter(w=>w.line&&N(w.page||1)===pg),items=slabItems().filter(it=>N(it.page)===pg);
  if(!tool&&(window.dn87hide||(!ws.some(D87.off)&&!items.length)))return r;const c=$('plan'),ctx=c.getContext('2d'),o=c.planOrigin25||{x:0,y:0},z=zoom||1;ctx.save();ctx.setTransform(1,0,0,1,-o.x,-o.y);
  const tag=(x,y,t,col)=>{ctx.font='600 '+Math.max(10,12/z)+'px Segoe UI, Arial';const tw=ctx.measureText(t).width+8/z,th=16/z;ctx.fillStyle='#fff';ctx.strokeStyle=col;ctx.lineWidth=1.4/z;ctx.beginPath();ctx.rect(x-tw/2,y-th/2,tw,th);ctx.fill();ctx.stroke();ctx.fillStyle=col;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(t,x,y+.5/z);};
  for(const w of ws){if(!D87.off(w))continue;const st=stepOf(w),b=base(w),t=top(w),col=colOf(b===t?b:b,st),[A,B]=w.line;ctx.strokeStyle=col;ctx.globalAlpha=.55;ctx.lineWidth=Math.max(5,8/z);ctx.lineCap='round';ctx.setLineDash(b!==t?[10/z,6/z]:[]);ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
   tag((A.x+B.x)/2,(A.y+B.y)/2,b===t?f0(b):'base '+f0(b)+(t?' / topo '+f0(t):''),col);}
  for(const it of items){const P=it.pts[0],col=colOf(N(it.d),20);tag(P.x,P.y,'laje '+f0(N(it.d)),col);}
  if(tool){const labels=vaoLabels(),at=(w,s)=>{const[A,B]=w.line,L=N(w.length);return {x:A.x+(B.x-A.x)*s/L,y:A.y+(B.y-A.y)*s/L};};
   for(const w of ws){const i=state.walls.indexOf(w),[A,B]=w.line,len=Math.hypot(B.x-A.x,B.y-A.y)||1,nx=-(B.y-A.y)/len,ny=(B.x-A.x)/len,k=N(w.planScale)||len/N(w.length),hw=N(w.width)*k*.9+4/z;
    const js=junctionsAlong(w);ctx.strokeStyle='#c2410c';ctx.lineWidth=2/z;for(const t of js){const P=at(w,t);ctx.beginPath();ctx.moveTo(P.x-nx*hw,P.y-ny*hw);ctx.lineTo(P.x+nx*hw,P.y+ny*hw);ctx.stroke();}
    const lb=labels.get(i),xs=[0,...js,N(w.length)];ctx.font='600 '+Math.max(9,10.5/z)+'px Segoe UI, Arial';ctx.fillStyle='#9a3412';ctx.textAlign='center';ctx.textBaseline='middle';
    if(lb){const P=at(w,N(w.length)/2);ctx.fillText(lb.name,P.x+nx*(hw+9/z),P.y+ny*(hw+9/z));}
    else if(js.length)for(let n=0;n+1<xs.length;n++){const P=at(w,(xs[n]+xs[n+1])/2);ctx.fillText('P'+(i+1)+'·v'+(n+1),P.x+nx*(hw+9/z),P.y+ny*(hw+9/z));}}
   const h=tool.hover,w=h&&state.walls[h.i];if(w?.line&&N(w.page||1)===pg){if(h.pt!=null){const P=at(w,h.pt),[A,B]=w.line,len=Math.hypot(B.x-A.x,B.y-A.y)||1,nx=-(B.y-A.y)/len,ny=(B.x-A.x)/len,r=18/z;ctx.strokeStyle='#c2410c';ctx.lineWidth=3/z;ctx.beginPath();ctx.moveTo(P.x-nx*r,P.y-ny*r);ctx.lineTo(P.x+nx*r,P.y+ny*r);ctx.stroke();tag(P.x+nx*(r+12/z),P.y+ny*(r+12/z),'degrau aqui ('+Math.round(h.pt)+' cm)','#c2410c');}
    else{const P0=at(w,h.lo),P1=at(w,h.hi);ctx.strokeStyle='rgba(234,88,12,.55)';ctx.lineWidth=Math.max(9,14/z);ctx.lineCap='butt';ctx.beginPath();ctx.moveTo(P0.x,P0.y);ctx.lineTo(P1.x,P1.y);ctx.stroke();
     tag((P0.x+P1.x)/2,(P0.y+P1.y)/2,(tool.d?f0(tool.d):'0')+' · '+Math.round(h.hi-h.lo)+' cm','#c2410c');}}}
  ctx.restore();}catch(e){console.error('V87 planta',e);}return r;};}catch(e){console.error('V87',e);}

// ---------- elevação: linha do piso do lado alto, apoio de laje intermediário e nota do desnível
function annot(w,m,html){const i=state.walls.indexOf(w),b=base(w),t=top(w),sup=supportsOf(i);if(!D87.off(w)&&!sup.length)return html;
 const denom=Math.max(1,num($('scale').value)),scale=10/denom,pad=26+Math.max(0,(state.steel?.[i]?.horizontals?.length||1)-1)*6,from=m.manual?Math.min(m.drawFrom??0,...m.rows.flatMap(r=>r.pieces.map(p=>p.x))):m.drawFrom??0,to=m.manual?Math.max(m.drawTo??m.L,...m.rows.flatMap(r=>r.pieces.map(p=>p.x+p.length+p.joint))):m.drawTo??m.L;
 const x0=pad,x1=pad+(to-from)*scale,Y=yy=>pad+(N(m.H)-yy)*scale;let s='<g class="dn87el">';const st=stepOf(w);
 if(b!==t){const yy=t-b;if(yy>0&&yy<N(m.H)){s+='<line x1="'+(x0-6)+'" y1="'+Y(yy)+'" x2="'+(x1+4)+'" y2="'+Y(yy)+'" stroke="#c2410c" stroke-width=".35" stroke-dasharray="2 1"/>';}}
 for(const p of sup){s+='<line x1="'+(x0-6)+'" y1="'+Y(p.yy)+'" x2="'+(x1+4)+'" y2="'+Y(p.yy)+'" stroke="#7c3aed" stroke-width=".35" stroke-dasharray="3 1.2"/><text x="'+(x1+4)+'" y="'+(Y(p.yy)-1)+'" font-size="2.5" fill="#7c3aed" text-anchor="end">apoio da laje '+f0(p.d)+' cm: prever canaleta / cinta nesta fiada</text>';}
 s+='<text x="'+(x0-6)+'" y="'+(Y(0)+pad+15)+'" font-size="2.5" fill="#334155">⇅ Desnível: '+esc(describe(w))+'</text>'+(b!==t?'<text x="'+(x0-6)+'" y="'+(Y(0)+pad+19)+'" font-size="2.5" fill="#c2410c">'+Math.round((t-b)/st)+' fiada(s) abaixo do piso do lado alto: embasamento junto ao aterro — verificar contenção (graute/armadura)</text>':'')+'</g>';
 return html.replace('</svg>',s+'</svg>');}
try{const sw=svgWall;svgWall=function(w,m,which,...x){const html=sw.call(this,w,m,which,...x);if(which!=='elevation'||!w||!m)return html;try{return annot(w,m,html);}catch(e){console.error('V87 elevação',e);return html;}};}catch(e){console.error('V87',e);}

// cota da base na elevação: o símbolo de nível mostra a base real, o piso do lado alto e o topo real
try{const lm=levelMarks23;levelMarks23=function(pad,bottom,height,k,...x){const w=window.currentWall53?.(),b=N(w?.base87)||0,t=N(w?.top87)||0;if(!w||(!b&&!t))return lm.call(this,pad,bottom,height,k,...x);
 let L={value:0,label:''};try{L=window.levelFor53?.(w)||L;}catch{}const lv=Number.isFinite(N(L.value))?N(L.value):0,f=v=>(v>=0?'+':'−')+Math.abs(v).toFixed(2).replace('.',',')+' m',top=bottom-height*k;
 const mk=(y,v,l,c)=>`<path d="M${pad-3},${y} l-2,-2 h4 z M${pad-5},${y} h-9" stroke="${c}" fill="none" stroke-width=".22"/><text x="${pad-21}" y="${y-2.7}" font-size="2" fill="${c}">${f(v)}</text>`+(l?`<text x="${pad-5}" y="${y+2.6}" font-size="1.8" text-anchor="end" fill="${c}">${esc(l)}</text>`:'');
 let out=mk(bottom,lv+b/100,L.label,'#174a78')+mk(top,lv+b/100+height/100,'','#174a78');if(b!==t&&t-b>0&&t-b<height)out+=mk(bottom-(t-b)*k,lv+t/100,'piso lado alto','#c2410c');return out;};}catch(e){console.error('V87 nível',e);}

// ---------- aviso no resultado: paredes com desnível
try{const rr=renderResults;renderResults=function(...a){const r=rr.apply(this,a);try{(state.results||[]).forEach((m,i)=>{const w=state.walls[i];if(!w||!m?.rows?.length)return;const art=$('wall-result-'+i);if(!art||art.querySelector('.dn87note'))return;const sup=supportsOf(i);if(!D87.off(w)&&!sup.length)return;
  const p=document.createElement('p');p.className='note dn87note';p.innerHTML='⇅ <b>Desnível</b>: '+esc(describe(w))+(sup.length?' · apoio de laje em outra cota: '+sup.map(s=>f0(s.d)+' cm (a '+Math.round(s.yy)+' cm da base)').join(', ')+' — prever canaleta/cinta nessa fiada':'')+(base(w)!==top(w)?' · o trecho abaixo do piso do lado alto fica em contato com aterro: confirmar com o projetista a contenção (graute e armadura ou concreto).':'');const h=art.querySelector('h3');if(h)h.after(p);else art.prepend(p);});}catch(e){console.error('V87 resultado',e);}return r;};}catch(e){console.error('V87',e);}

const css=document.createElement('style');css.textContent=`#dn87bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:6px 0;padding:7px 10px;background:#fff7ed;border:1px solid #fdba74;border-radius:8px;font:13px "Segoe UI",Arial,sans-serif;color:#7c2d12}
#dn87bar[hidden]{display:none}#dn87bar .v87{display:inline-flex;gap:3px}#dn87bar .v87 button{min-width:42px;padding:4px 7px;margin:0;border-radius:6px;border:1.5px solid var(--c);background:#fff;color:var(--c);font-weight:700;cursor:pointer}
#dn87bar .v87 button.on{background:var(--c);color:#fff}#dn87bar .e87{display:inline-flex;align-items:center;gap:4px;margin:0;font-size:12px}#dn87bar .e87 input{width:72px;height:28px;padding:2px 6px;margin:0;font-weight:700}#dn87bar .mo87{display:inline-flex;align-items:center;gap:3px;font-size:12px}#dn87bar .mo87 button{padding:4px 8px;margin:0;border-radius:6px;border:1px solid #fdba74;background:#fff;color:#7c2d12;cursor:pointer;font-size:12px}#dn87bar .mo87 button.on{background:#ea580c;color:#fff;border-color:#ea580c}#dn87bar .u87{font-size:12px;color:#9a3412}#dn87bar .h87{font-size:12px;color:#6b4423;flex:1 1 420px}#dn87bar .m87{flex-basis:100%;font-weight:600;color:#7c2d12}
body.dn87on #plan{cursor:crosshair}.dn87note{background:#fff7ed;border-left:3px solid #ea580c;padding:5px 8px}`;document.head.append(css);
})();
