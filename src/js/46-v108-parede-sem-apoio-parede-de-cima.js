// V108 — PAREDE SEM APOIO: parede de cima que nasce sobre a laje sem parede embaixo fica VERMELHA (trecho a trecho).
// Clicando no trecho vermelho o projetista é obrigado a escolher REFORÇO na laje ou VIGA; o programa lança o elemento
// (o mesmo do V97) embaixo do trecho. Enquanto houver trecho sem apoio: aviso no nível e faixa de PENDÊNCIA nas pranchas.
(function(){
'use strict';
const N=Number,L7=()=>window.loads77;if(!L7()?.editCtx)return;
const S=()=>L7().S();
const f1=(v,d=0)=>(Number.isFinite(v)?v:0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const DIAS=[5,6.3,8,10,12.5,16],SECS=[[14,30],[14,40],[15,30],[15,40],[15,50],[20,30],[20,40],[20,50]];
const STEP=5,MIN=20;// amostra a cada 5 cm; trecho < 20 cm é tolerância de encontro
const wName=w=>w.name||w.label||w.id||'Parede';

// ---------- varredura
function beamsOf(key){const out=[];for(const it of S().items||[]){if(it.kind!=='beam')continue;if(L7().itemKey(it)!==key||(it.tgt||'piso')!=='piso'||it.rep102!=null)continue;
 let P=[];try{P=window.beamEnds97?window.beamEnds97(it):[];}catch{}if(P.length<2)continue;const b=N(it.sub==='ref'?it.ref?.b:it.viga?.b)||14;out.push({A:P[0],B:P[1],b,it});}return out;}
function inRect(P,y,pad){const A=y.g.A,u=y.g.u,dx=P.x-A.x,dy=P.y-A.y,mu=dx*u[0]+dy*u[1],d=Math.abs(-dx*u[1]+dy*u[0]);return d<=y.t/2+pad&&mu>=-y.t/2-pad&&mu<=y.L+y.t/2+pad;}
function onBeam(P,bm,t){const dx=bm.B.x-bm.A.x,dy=bm.B.y-bm.A.y,l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l,px=P.x-bm.A.x,py=P.y-bm.A.y,mu=px*ux+py*uy,d=Math.abs(-px*uy+py*ux);return mu>=-2&&mu<=l+2&&d<=Math.max(bm.b,t)/2+2;}
let cache=null,cacheT=0;
function scan(){const now=Date.now();if(cache&&now-cacheT<400)return cache;let LV=[];try{LV=L7().levels();}catch{}const out=[];
 for(let i=1;i<LV.length;i++){const up=LV[i],low=LV[i-1].I||[],bms=beamsOf(up.key);
  for(const x of up.I||[]){const n=Math.max(1,Math.ceil(x.L/STEP)),runs=[];let a=-1,cov=-1;
   for(let k=0;k<=n;k++){const s=Math.min(x.L,k*STEP),P={x:x.g.A.x+x.g.u[0]*s,y:x.g.A.y+x.g.u[1]*s};
    const okW=low.some(y=>inRect(P,y,3)),okB=!okW&&bms.some(b=>onBeam(P,b,x.t));const free=!okW&&!okB;
    if(free){if(a<0)a=s;}else if(a>=0){runs.push([a,s]);a=-1;}}
   if(a>=0)runs.push([a,x.L]);
   for(const[s0,s1]of runs){if(s1-s0<MIN)continue;const A={x:x.g.A.x+x.g.u[0]*s0,y:x.g.A.y+x.g.u[1]*s0},B={x:x.g.A.x+x.g.u[0]*s1,y:x.g.A.y+x.g.u[1]*s1};
    out.push({i,key:up.key,lvName:up.name||up.key,x,w:x.w,name:wName(x.w),s0,s1,L:s1-s0,A,B,id:up.key+'|'+(x.w.uid||wName(x.w))+'|'+Math.round(s0)});}}}
 cache=out;cacheT=now;return out;}
window.sup108={scan,reset:()=>{cache=null;}};
// laje (paredes de baixo na tela): trechos da laje em trabalho; nas outras vistas: as paredes mostradas na tela
function here(){let e=null;try{e=L7().editCtx();}catch{}if(!e)return {e,list:[],lm:false};const lm=!!window.lvl92ctx&&e.tgt==='piso'&&e.idx>=1;let key=lm?e.key:null;if(!lm){try{key=L7().keyOfPage(e.pg);}catch{}}
 return {e,lm,list:key?scan().filter(q=>q.key===key):[]};}

// ---------- desenho
const pg=()=>N($('page')?.value)||1;
function pxPerCm(p){const a=window.toPage74(p,{x:0,y:0}),b=window.toPage74(p,{x:100,y:0});return Math.hypot(b.x-a.x,b.y-a.y)/100||1;}
const lajeMode=()=>here().lm;
function marker(Q0,Q1,z){const mx=(Q0.x+Q1.x)/2,my=(Q0.y+Q1.y)/2,dx=Q1.x-Q0.x,dy=Q1.y-Q0.y,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,off=26/z;return {x:mx+nx*off,y:my+ny*off,r:11/z};}
let selId=null;
{const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);try{draw();}catch(e){console.error('V108 planta',e);}return r;};}
function draw(){const c=$('plan');if(!c)return;const {e,list}=here();bar(e,list);if(!list.length)return;const ctx=c.getContext('2d'),o=c.planOrigin25||{x:0,y:0},z=(window.zoom88?.fitZ?.()||(typeof zoom!=='undefined'?zoom:1)||1),p=e.pg||pg(),k=pxPerCm(p);
 ctx.save();ctx.setTransform(1,0,0,1,-o.x,-o.y);
 for(const q of list){const Q0=window.toPage74(p,q.A),Q1=window.toPage74(p,q.B),dx=Q1.x-Q0.x,dy=Q1.y-Q0.y,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,hw=Math.max(q.x.t*k/2,3/z),on=q.id===selId;
  ctx.fillStyle=on?'rgba(220,38,38,.55)':'rgba(220,38,38,.32)';ctx.beginPath();ctx.moveTo(Q0.x+nx*hw,Q0.y+ny*hw);ctx.lineTo(Q1.x+nx*hw,Q1.y+ny*hw);ctx.lineTo(Q1.x-nx*hw,Q1.y-ny*hw);ctx.lineTo(Q0.x-nx*hw,Q0.y-ny*hw);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#dc2626';ctx.lineWidth=(on?3:2)/z;ctx.setLineDash([7/z,4/z]);ctx.stroke();ctx.setLineDash([]);
  const m=marker(Q0,Q1,z);ctx.fillStyle='#dc2626';ctx.beginPath();ctx.arc(m.x,m.y,m.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold '+(14/z)+'px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('!',m.x,m.y+.5/z);
  ctx.textAlign='left';ctx.textBaseline='alphabetic';}
 ctx.restore();}
function bar(e,list){let b=$('sup108bar');const all=scan();
 if(!b){b=document.createElement('div');b.id='sup108bar';b.className='noPrint';(($('el97bar')||$('planStatus'))).after(b);}
 if(!all.length){b.style.display='none';return;}
 const other=all.length-list.length,names=[...new Set(list.map(q=>q.name))];
 b.innerHTML='<b>⚠ Parede sem apoio</b> '+(list.length?list.length+' trecho(s) neste nível ('+esc(names.slice(0,6).join(', '))+(names.length>6?'…':'')+') — '+(lajeMode()?'clique no trecho vermelho':'clique no <span class="m108">!</span> vermelho')+' e escolha reforço ou viga.':'nenhum neste nível.')+(other?' <span class="o108">'+other+' trecho(s) em outro(s) nível(is): '+esc([...new Set(all.filter(q=>!list.includes(q)).map(q=>q.lvName))].join(', '))+'.</span>':'');
 b.style.display='flex';}

// ---------- clique
function rawPoint(ev){const c=$('plan'),r=c.getBoundingClientRect();return {x:(ev.clientX-r.left)*c.width/r.width+(c.planOrigin25?.x||0),y:(ev.clientY-r.top)*c.height/r.height+(c.planOrigin25?.y||0)};}
function segD(P,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((P.x-a.x)*dx+(P.y-a.y)*dy)/l));return Math.hypot(P.x-a.x-t*dx,P.y-a.y-t*dy);}
function hit(P){const {e,list}=here();if(!list.length)return null;const p=e.pg||pg(),k=pxPerCm(p),z=(window.zoom88?.fitZ?.()||(typeof zoom!=='undefined'?zoom:1)||1),lm=lajeMode();let best=null,bd=Infinity;
 for(const q of list){const Q0=window.toPage74(p,q.A),Q1=window.toPage74(p,q.B),m=marker(Q0,Q1,z);let d=Math.hypot(P.x-m.x,P.y-m.y)-m.r-3/z;
  if(lm)d=Math.min(d,segD(P,Q0,Q1)-Math.max(q.x.t*k/2,4/z));if(d<=6/z&&d<bd){bd=d;best=q;}}return best;}
document.addEventListener('click',ev=>{const c=$('plan');if(ev.target!==c)return;const B=document.body.classList;if(B.contains('tool56')||B.contains('el97on')||B.contains('brush97')||B.contains('arm106on'))return;try{if(typeof mode!=='undefined'&&mode)return;}catch{}
 const q=hit(rawPoint(ev));if(!q)return;ev.stopImmediatePropagation();ev.preventDefault();selId=q.id;open(q,ev);try{drawPlan();}catch{}},true);

// ---------- janelinha: reforço ou viga (obrigatório)
const box=document.createElement('div');box.id='sup108';box.className='noPrint';box.hidden=true;document.body.append(box);
function cfg(){const s=S();const c=s.el97cfg||{};return {ref:{n:3,d:10,...(c.ref||{})},viga:{b:15,h:40,ni:3,di:10,ns:2,ds:8,de:5,s:15,...(c.viga||{})},c:N(c.c)||2.5};}
function open(q,ev){const c=cfg(),t=Math.round(q.x.t),secs=[...new Set([[t,30],[t,40],...SECS].map(s=>s.join('×')))];
 box.innerHTML='<div class="h108"><b>⚠ '+esc(q.name)+' · sem parede embaixo</b><button type="button" class="x108" title="Fechar">✕</button></div>'+
 '<p class="t108">Trecho de <b>'+f1(q.L)+' cm</b> desta parede nasce sobre a laje ('+esc(q.lvName)+'). Para tirar a pendência é obrigatório apoiar: escolha <b>reforço na laje</b> ou <b>viga</b>.</p>'+
 '<label class="r108"><input type="radio" name="k108" value="ref" checked> <b>Reforço</b> na laje (barras na faixa da parede)</label>'+
 '<div class="f108" data-f="ref">Barras <select id="n108">'+[2,3,4,5,6].map(n=>'<option'+(n===N(c.ref.n)?' selected':'')+'>'+n+'</option>').join('')+'</select> Ø <select id="d108">'+DIAS.map(d=>'<option value="'+d+'"'+(d===N(c.ref.d)?' selected':'')+'>'+f1(d,d%1?1:0)+'</option>').join('')+'</select> faixa '+t+' cm</div>'+
 '<label class="r108"><input type="radio" name="k108" value="viga"> <b>Viga</b> embaixo da parede</label>'+
 '<div class="f108" data-f="viga" hidden>Seção <select id="s108">'+secs.map(s=>'<option'+(s===N(c.viga.b)+'×'+N(c.viga.h)?' selected':'')+'>'+s+'</option>').join('')+'</select> cm · barras e estribos como a última viga (edite clicando na viga depois)</div>'+
 '<div class="a108"><button type="button" id="go108">✔ Lançar embaixo do trecho</button></div><p class="n108">O elemento apoia sozinho nas paredes das pontas (perpendicular = espessura toda; alinhada = entra 30 cm). Ctrl+Z desfaz.</p>';
 const W=360,x=Math.max(8,Math.min(innerWidth-W-8,(ev?.clientX||200)+14)),y=Math.max(8,Math.min(innerHeight-300,(ev?.clientY||200)-20));box.style.left=x+'px';box.style.top=y+'px';box.hidden=false;
 box.querySelector('.x108').onclick=close;
 box.querySelectorAll('[name=k108]').forEach(r=>r.onchange=()=>{const k=box.querySelector('[name=k108]:checked').value;box.querySelectorAll('[data-f]').forEach(f=>f.hidden=f.dataset.f!==k);});
 $('go108').onclick=()=>{const k=box.querySelector('[name=k108]:checked').value;create(q,k,{n:N($('n108').value),d:N($('d108').value),sec:$('s108').value.split('×').map(Number)});};}
function close(){box.hidden=true;selId=null;try{drawPlan();}catch{}}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!box.hidden){close();e.preventDefault();}});
function create(q,k,v){const e=L7().editCtx(),c=cfg(),p=e.pg,it={id:'el-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),kind:'beam',sub:k,page:p,tgt:'piso',g:0,q:0,c:c.c,sup108:q.name};
 if(e.key!==L7().keyOfPage(p))it.slab92=e.key;if(L7().isOwn(e.key,'piso',e.rj))it.rep102=e.rj;
 it.pts=[window.toPage74(p,q.A),window.toPage74(p,q.B)].map(P=>({x:P.x,y:P.y}));
 if(k==='ref')it.ref={n:v.n,d:v.d,b:Math.round(q.x.t)};else it.viga={...c.viga,b:v.sec[0],h:v.sec[1]};
 it.name=k==='ref'?'R':'V';S().items.push(it);try{window.renum97?.();}catch{}cache=null;L7().touch();try{window.undo58?.push?.();}catch{}
 box.hidden=true;selId=null;try{drawPlan();}catch{}
 const left=here().list.length;$('planStatus').textContent='✔ '+it.name+' · '+(k==='ref'?'Reforço '+v.n+' Ø'+f1(v.d,v.d%1?1:0):'Viga '+v.sec.join('×'))+' lançado embaixo da '+q.name+' ('+f1(q.L)+' cm). '+(left?left+' trecho(s) sem apoio ainda neste nível.':'Nível sem pendência de apoio.');}

// ---------- pranchas: faixa de pendência
if(typeof plotSheetHTML26==='function'){const base=plotSheetHTML26;plotSheetHTML26=function(sheet,index,total,...a){let html=base.call(this,sheet,index,total,...a);try{cache=null;const all=scan();if(!all.length)return html;
 const by=new Map();for(const q of all){if(!by.has(q.lvName))by.set(q.lvName,new Set());by.get(q.lvName).add(q.name);}
 const txt='PENDÊNCIA · parede(s) sem apoio embaixo (sem reforço nem viga): '+[...by].map(([n,s])=>n+': '+[...s].join(', ')).join(' · ');
 const i=html.indexOf('>');if(i<0)return html;html=html.slice(0,i+1)+'<div class="sp108">'+esc(txt)+'</div>'+html.slice(i+1);}catch(e){console.error('V108 prancha',e);}return html;};}
// diagnóstico (Conferir projeto)
{const f=window.auditV48;if(typeof f==='function'){window.auditV48=function(...a){const r=f.apply(this,a);try{const all=scan();if(all.length){const p=$('planStatus');if(p)p.textContent='⚠ Pendência: '+all.length+' trecho(s) de parede sem apoio embaixo — '+[...new Set(all.map(q=>q.lvName+' '+q.name))].slice(0,8).join(', ')+'. Lance reforço ou viga (clique no trecho vermelho).';}}catch{}return r;};}}

const css=document.createElement('style');css.textContent=
'#sup108bar{display:none;align-items:center;gap:6px;flex-wrap:wrap;background:#fef2f2;border:1px solid #fca5a5;color:#991b1b;border-radius:6px;padding:4px 10px;font-size:12.5px;margin:4px 0}#sup108bar .o108{color:#7f1d1d;opacity:.8}#sup108bar .m108{display:inline-block;width:15px;height:15px;border-radius:50%;background:#dc2626;color:#fff;text-align:center;font-weight:700;line-height:15px;font-size:11px}'+
'#sup108{position:fixed;z-index:9999;width:360px;background:#fff;border:1px solid #dc2626;border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,.25);font-size:13px;padding:0 0 8px}#sup108 .h108{display:flex;justify-content:space-between;align-items:center;background:#dc2626;color:#fff;padding:6px 10px;border-radius:7px 7px 0 0}#sup108 .x108{background:none;border:0;color:#fff;font-size:15px;cursor:pointer}'+
'#sup108 .t108{margin:8px 10px;line-height:1.35}#sup108 .r108{display:block;margin:6px 10px 2px}#sup108 .f108{margin:0 10px 4px 30px;color:#334155}#sup108 select{font-size:13px}#sup108 .a108{margin:10px 10px 0}#sup108 #go108{background:#dc2626;color:#fff;border:0;border-radius:6px;padding:6px 12px;font-weight:700;cursor:pointer}#sup108 .r108{display:flex!important;align-items:center;gap:6px;font-weight:400}#sup108 .r108 input{width:auto!important;margin:0;height:auto}#sup108 .f108 select{width:auto!important;display:inline-block!important;min-width:64px;height:28px;padding:2px 6px;margin:0 6px}#sup108 .f108{display:flex;align-items:center;flex-wrap:wrap}#sup108 .f108[hidden]{display:none}#sup108 .n108{margin:6px 10px 0;color:#64748b;font-size:11.5px}'+
'.sp108{position:absolute;left:10mm;top:3.2mm;right:10mm;height:5.4mm;line-height:5.4mm;background:#fee2e2;border:.35mm solid #dc2626;color:#991b1b;font:bold 2.6mm Arial,sans-serif;padding:0 2mm;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;z-index:5}@media print{.sp108{-webkit-print-color-adjust:exact;print-color-adjust:exact}}';
document.head.append(css);
})();
