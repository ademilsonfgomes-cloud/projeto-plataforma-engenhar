// V106 — Armaduras das lajes (detalhamento informado pelo projetista):
// • positivo: treliçada = tela soldada (Q61…Q196); maciça = Ø c/ s em X e em Y (barra reta, apoiada na parede inteira;
//   C = vão livre + espessura das duas paredes − 2 × cobrimento). Em branco na maciça = continua o cálculo da V82.
// • negativo: lançado no APOIO (clique na parede = de fora a fora; ou clique numa laje e na vizinha = só o trecho entre elas);
//   dobra = 4 cm na treliçada, altura − 4 cm na maciça; C = lado 1 + lado 2 + dobras.
// • prancha: logo depois da planta de lajes, a planta de armaduras e a tabela de aço/telas de cada laje.
(function(){
'use strict';
const N=Number,L7=()=>window.loads77;if(!L7()?.editCtx)return;
const S=()=>L7().S();
const f1=(v,d=1)=>(Number.isFinite(v)?v:0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const fd=d=>f1(d,N(d)%1?1:0),dTxt=d=>'Ø'+f1(N(d),1);
const DIAS=[5,6.3,8,10,12.5],KG={5:.154,6.3:.245,8:.395,10:.617,12.5:.963,16:1.578};
const TELAS={Q61:[3.4,15],Q75:[3.8,15],Q92:[4.2,15],Q113:[3.8,10],Q138:[4.2,10],Q159:[4.5,10],Q196:[5.0,10]};
const COB=2.5,TRH={tr8:12,tr12:16,tr16:20,tr20:25};
const isTR=t=>/^tr\d+$/.test(String(t||''));
function cfg(){const s=S();s.arm106cfg??={d:6.3,s:15};return s.arm106cfg;}
function negs(){const s=S();s.neg106??=[];return s.neg106;}
const hOf=p=>isTR(p?.type)?TRH[p.type]||12:N(p?.h)||10;
const hookOf=p=>!p||p.type==='sem'?4:isTR(p.type)||p.type==='alv'?4:Math.max(4,hOf(p)-4);
const up5=v=>Math.max(10,Math.ceil(v/5)*5);

// ---------- 1. janela da laje: parte “Armaduras”
function popHTML(p){const tp=p?.type||'tr8',a=p?.arm||{};if(tp==='sem')return '';
 if(isTR(tp))return '<div class="r"><span>Positivo</span><select data-arm="tela" style="width:auto;min-width:150px;display:inline-block;margin:0"><option value="">sem tela</option>'+Object.entries(TELAS).map(([k,[d,s]])=>'<option value="'+k+'"'+(a.tela===k?' selected':'')+'>'+k+' (Ø'+f1(d)+' c/'+s+')</option>').join('')+'</select></div><div class="ft">Positivo da treliçada: tela soldada antifissuração sobre as vigotas. Negativos: ferramenta ⊥ Negativo (clique no apoio).</div>';
 if(tp!=='mac')return '';
 const row=(k,t)=>{const v=a[k]||{};return '<div class="r"><span>'+t+'</span><select data-arm="'+k+'.d" style="width:auto;min-width:96px;display:inline-block;margin:0"><option value="">calcular</option>'+DIAS.map(d=>'<option value="'+d+'"'+(N(v.d)===d?' selected':'')+'>'+dTxt(d)+'</option>').join('')+'</select> c/ <input data-arm="'+k+'.s" type="number" min="5" max="40" step="0.5" value="'+(N(v.s)||15)+'" style="width:58px;display:inline-block;margin:0"> cm</div>';};
 return row('px','Positivo X ↔')+row('py','Positivo Y ↕')+'<div class="ft">Barra reta, sem dobra, até o fim das paredes (vão livre + paredes − 2×2,5 cm). “calcular” = cálculo automático da laje maciça. Negativos: ⊥ Negativo.</div>';}
function change(el,cur){const a=JSON.parse(JSON.stringify(cur||{})),k=el.dataset.arm;if(k==='tela'){a.tela=el.value||'';return a;}const[g,f]=k.split('.');a[g]??={};if(f==='d'){a[g].d=el.value?N(el.value):null;if(a[g].d&&!a[g].s)a[g].s=15;}else{const v=N(String(el.value).replace(',','.'));if(v>0)a[g].s=v;}return a;}

// ---------- 2. geometria sobre a laje em edição
const segD=(P,A,B)=>{const dx=B.x-A.x,dy=B.y-A.y,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((P.x-A.x)*dx+(P.y-A.y)*dy)/l));return Math.hypot(P.x-A.x-t*dx,P.y-A.y-t*dy);};
function compAt(v,P){const c=v.cell(P);return c>=0?v.comp[c]:-1;}
function spanOf(v,c,n){let lo=Infinity,hi=-Infinity;for(let i=0;i<v.n;i++){if(v.comp[i]!==c)continue;const p=v.cx(i)*n[0]+v.cy(i)*n[1];if(p<lo)lo=p;if(p>hi)hi=p;}return hi>lo?hi-lo+v.s0:0;}
function sideComps(v,O,u,n,t,lo,hi){const A=new Set(),B=new Set(),ok=[];for(let s=lo;s<=hi+1e-6;s+=5){const Q={x:O.x+u[0]*s,y:O.y+u[1]*s},d=t/2+12,a=compAt(v,{x:Q.x+n[0]*d,y:Q.y+n[1]*d}),b=compAt(v,{x:Q.x-n[0]*d,y:Q.y-n[1]*d}),ga=a>=0&&v.propOf(a).type!=='sem',gb=b>=0&&v.propOf(b).type!=='sem';if(ga)A.add(a);if(gb)B.add(b);if(ga||gb)ok.push(s);}return {A,B,ok};}
// V106.6 — balanço: do lado em balanço o negativo vai até a borda livre (− cobrimento); para dentro, 1,5 × o balanço
function cantDepth(v,O,u,n,lo,hi,sg,t){let best=0;for(const f of [.25,.5,.75]){const s0=lo+(hi-lo)*f,Q={x:O.x+u[0]*s0,y:O.y+u[1]*s0};let k0=-1,d=t/2+3,cant=false,last=0;for(;d<800;d+=4){const P={x:Q.x+n[0]*d*sg,y:Q.y+n[1]*d*sg},c=v.cell(P);if(c<0||!v.inside[c])break;if(v.cant?.[c])cant=true;last=d;}if(cant)best=Math.max(best,last);}return best;}
function mk(e,O,u,n,lo,hi,v,A,B,t){const c=cfg(),mx=[...A,...B].reduce((m,k)=>Math.max(m,spanOf(v,k,n)),0);let L0=up5(.25*mx);
 const ca=cantDepth(v,O,u,n,lo,hi,1,t),cb=cantDepth(v,O,u,n,lo,hi,-1,t);let laX=null,lbX=null;
 if(ca>0||cb>0){if(ca>0){laX=Math.max(10,Math.round((ca-COB)/5)*5);lbX=up5(1.5*(ca-t/2));}else{lbX=Math.max(10,Math.round((cb-COB)/5)*5);laX=up5(1.5*(cb-t/2));}}
 const it={id:'ng-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),kind:'neg106',page:e.pg,tgt:e.tgt,A:{x:O.x+u[0]*lo,y:O.y+u[1]*lo},B:{x:O.x+u[0]*hi,y:O.y+u[1]*hi},nrm:[n[0],n[1]],t,d:c.d,s:c.s,la:laX??(A.size?L0:Math.max(5,t-COB)),lb:lbX??(B.size?L0:Math.max(5,t-COB))};if(laX!=null)it.cant=ca>0?'a':'b';
 if(e.key!==L7().keyOfPage(e.pg))it.slab92=e.key;if(L7().isOwn?.(e.key,e.tgt,e.rj))it.rep102=e.rj;negs().push(it);renum();try{L7().touch();}catch{}try{window.undo58?.push?.();}catch{}return it;}
// clique no apoio: paredes alinhadas e seguidas (de fora a fora), só onde há laje de algum lado
function bySupport(e,v,x0){const u=x0.g.u,n=x0.n,O=x0.g.A,iv=[];for(const x of v.I){if(Math.abs(u[0]*x.g.u[1]-u[1]*x.g.u[0])>.03)continue;if(Math.abs((x.g.A.x-O.x)*n[0]+(x.g.A.y-O.y)*n[1])>4)continue;const a=(x.g.A.x-O.x)*u[0]+(x.g.A.y-O.y)*u[1],b=(x.g.B.x-O.x)*u[0]+(x.g.B.y-O.y)*u[1];iv.push([Math.min(a,b),Math.max(a,b),x.t]);}
 iv.sort((p,q)=>p[0]-q[0]);let lo=0,hi=x0.L,t=x0.t,ch=true;while(ch){ch=false;for(const q of iv){if(q[1]<lo-40||q[0]>hi+40)continue;if(q[0]<lo){lo=q[0];ch=true;}if(q[1]>hi){hi=q[1];ch=true;}t=Math.max(t,q[2]);}}
 const sc=sideComps(v,O,u,n,t,lo,hi);if(!sc.ok.length)return null;return mk(e,O,u,n,Math.min(...sc.ok),Math.max(...sc.ok),v,sc.A,sc.B,t);}
// clique numa laje e na vizinha: o trecho do apoio entre as duas
function byPair(e,v,c1,c2){let best=null;for(const x of v.I){let k=0;for(let s=0;s<=x.L;s+=5){const Q={x:x.g.A.x+x.g.u[0]*s,y:x.g.A.y+x.g.u[1]*s},d=x.t/2+12,a=compAt(v,{x:Q.x+x.n[0]*d,y:Q.y+x.n[1]*d}),b=compAt(v,{x:Q.x-x.n[0]*d,y:Q.y-x.n[1]*d});if((a===c1&&b===c2)||(a===c2&&b===c1))k++;}if(k&&(!best||k>best.k))best={x,k};}
 if(!best)return null;const x0=best.x,u=x0.g.u,n=x0.n,O=x0.g.A;const pos=[];let t=x0.t;
 for(const x of v.I){if(Math.abs(u[0]*x.g.u[1]-u[1]*x.g.u[0])>.03||Math.abs((x.g.A.x-O.x)*n[0]+(x.g.A.y-O.y)*n[1])>4)continue;for(let s=0;s<=x.L;s+=5){const Q={x:x.g.A.x+x.g.u[0]*s,y:x.g.A.y+x.g.u[1]*s},d=x.t/2+12,a=compAt(v,{x:Q.x+n[0]*d,y:Q.y+n[1]*d}),b=compAt(v,{x:Q.x-n[0]*d,y:Q.y-n[1]*d});if((a===c1&&b===c2)||(a===c2&&b===c1)){pos.push((Q.x-O.x)*u[0]+(Q.y-O.y)*u[1]);t=Math.max(t,x.t);}}}
 const A=new Set(),B=new Set();const mid=(Math.min(...pos)+Math.max(...pos))/2,Q={x:O.x+u[0]*mid,y:O.y+u[1]*mid},d=t/2+12,a=compAt(v,{x:Q.x+n[0]*d,y:Q.y+n[1]*d});if(a===c1){A.add(c1);B.add(c2);}else{A.add(c2);B.add(c1);}
 return mk(e,O,u,n,Math.min(...pos),Math.max(...pos),v,A,B,t);}
// numeração: de cima para baixo, da esquerda para a direita, por laje
function renum(){const G=new Map();for(const it of negs()){const k=L7().itemKey(it)+'|'+(it.tgt||'piso')+'|'+(it.rep102||0);if(!G.has(k))G.set(k,[]);G.get(k).push(it);}
 for(const list of G.values())list.map(it=>({it,x:(it.A.x+it.B.x)/2,y:(it.A.y+it.B.y)/2})).sort((a,b)=>Math.abs(a.y-b.y)>25?b.y-a.y:a.x-b.x).forEach((q,i)=>{q.it.name='N'+(i+1);});}
// dobra do negativo no desenho: barra deitada → para baixo; barra em pé → para a direita (y para baixo, como na tela e no papel)
function hookDir(dx,dy){const l=Math.hypot(dx,dy)||1;let px=-dy/l,py=dx/l;if(Math.abs(dx)>=Math.abs(dy)){if(py<0){px=-px;py=-py;}}else if(px<0){px=-px;py=-py;}return {x:px,y:py};}
const lenN=it=>Math.hypot(it.B.x-it.A.x,it.B.y-it.A.y);
const qtyN=it=>Math.floor(lenN(it)/(N(it.s)||15))+1;

// ---------- 3. ferramenta na planta
let tool=false,first=null,sel=null,raf=0;
const ctxE=()=>{try{return L7().editCtx();}catch{return null;}};
const mine=()=>{const e=ctxE();if(!e)return [];return negs().filter(it=>{try{return L7().vis(it,e);}catch{return false;}});};
function rawPoint(ev){const c=$('plan'),r=c.getBoundingClientRect();return {x:(ev.clientX-r.left)*c.width/r.width+(c.planOrigin25?.x||0),y:(ev.clientY-r.top)*c.height/r.height+(c.planOrigin25?.y||0)};}
function bar(t){let p=$('arm106bar');if(!p){p=document.createElement('div');p.id='arm106bar';p.className='walltool56 noPrint';$('planStatus').after(p);}p.textContent=t||'';p.style.display=t?'flex':'none';}
function start(){const e=ctxE();if(!e||e.ground||(!e.below&&e.tgt==='piso')){alert('Escolha um nível de laje (▲) para lançar os negativos.');return;}try{if(window.stopAll108)window.stopAll108();else{window.cancelTool56?.();window.el97?.stop?.();}}catch{}
 tool=true;first=null;document.body.classList.add('tool56','arm106on');bar('⊥ Negativo: clique no APOIO (parede) para lançar de fora a fora — ou clique numa laje e depois na vizinha (só o trecho entre elas). Esc solta a ferramenta. Para editar um negativo já lançado, clique em cima da barra dele; para mudar de lugar, arraste a barra ao longo do apoio.');try{drawPlan();}catch{}}
function stop(){tool=false;first=null;document.body.classList.remove('tool56','arm106on');bar('');try{drawPlan();}catch{}}
// V106.4 — arrastar o negativo ao longo do apoio (sem sair do eixo): clique e arraste a barra
let drag=null,noClick=false;
function grip(P){const z=(window.zoom88?.fitZ?.()||zoom||1),tol=10/z;let best=null,bd=tol;for(const it of mine()){const g=geomP(it);for(const[q,m]of [[g.P2,'la'],[g.P1,'lb']]){const d=Math.hypot(P.x-q.x,P.y-q.y);if(d<bd){bd=d;best={it,mode:m};}}}return best;}
document.addEventListener('pointerdown',ev=>{if(ev.button!==0||ev.target!==$('plan'))return;if(document.body.classList.contains('tool56')&&!tool)return;const P=rawPoint(ev),gp=grip(P);const it=gp?gp.it:hit(P,true);if(!it)return;drag={it,mode:gp?gp.mode:'pos',x:ev.clientX,y:ev.clientY,moved:false};ev.stopImmediatePropagation();ev.preventDefault();},true);
document.addEventListener('pointermove',ev=>{if(!drag)return;if(!drag.moved&&Math.hypot(ev.clientX-drag.x,ev.clientY-drag.y)<4)return;if(!drag.moved){drag.moved=true;if(tool)stop();box.hidden=true;}sel=drag.it.id;
 const P=rawPoint(ev);if(drag.mode!=='pos'){const g=geomP(drag.it),d=((P.x-g.M.x)*g.n.x+(P.y-g.M.y)*g.n.y)/g.k*(drag.mode==='la'?1:-1);drag.it[drag.mode]=Math.max(5,Math.round(d/5)*5);bar('↔ '+(drag.it.name||'N')+': lado '+(drag.mode==='la'?'1':'2')+' = '+f1(drag.it[drag.mode],0)+' cm · C = '+f1(calc(drag.it),0)+' cm');ev.stopImmediatePropagation();try{drawPlan();}catch{}return;}
 const A=toP(drag.it.A),B=toP(drag.it.B),dx=B.x-A.x,dy=B.y-A.y,l2=dx*dx+dy*dy||1;drag.it.pos=Math.max(0,Math.min(1,((P.x-A.x)*dx+(P.y-A.y)*dy)/l2));ev.stopImmediatePropagation();try{drawPlan();}catch{}},true);
document.addEventListener('pointerup',ev=>{if(!drag)return;const d=drag;drag=null;if(!d.moved)return;noClick=true;setTimeout(()=>{noClick=false;},50);try{L7().touch();}catch{}try{window.undo58?.push?.();}catch{}if(d.mode!=='pos')setTimeout(()=>bar(''),1500);$('planStatus').textContent=(d.it.name||'Negativo')+(d.mode==='pos'?' movido ao longo do apoio':' com lado '+(d.mode==='la'?'1':'2')+' = '+f1(d.it[d.mode],0)+' cm (C = '+f1(calc(d.it),0)+' cm)')+' (Ctrl+Z desfaz). Clique nele para editar.';},true);
document.addEventListener('click',ev=>{const c=$('plan');if(ev.target!==c)return;if(noClick){ev.stopImmediatePropagation();ev.preventDefault();return;}
 if(tool){ev.stopImmediatePropagation();ev.preventDefault();const P=rawPoint(ev);{const h=hit(P,true);if(h){stop();sel=h.id;open(h);drawPlan();return;}}let r;try{r=window.slab94.at(P);}catch{}const v=r?.v;if(!v||!r.e){bar('Clique dentro da laje deste nível.');return;}
  const W=window.world74(r.e.pg,P);let wb=null,bd=1e9;for(const x of v.I){const d=segD(W,x.g.A,x.g.B);if(d<=x.t/2+5&&d<bd){bd=d;wb=x;}}
  if(wb){first=null;const it=bySupport(r.e,v,wb);if(!it){bar('Esse apoio não tem laje de nenhum lado.');return;}sel=it.id;bar('✔ '+it.name+' · '+qtyN(it)+' '+dTxt(it.d)+' c/'+fd(it.s)+' ao longo de '+f1(lenN(it),0)+' cm. Clique em outro apoio, ou Esc. (Clique no negativo para mudar bitola, espaçamento e comprimentos.)');drawPlan();return;}
  const k=r.comp;if(k==null||k<0||r.outside){bar('Clique numa laje ou num apoio.');return;}
  if(first==null||first===k){first=k;bar('Laje marcada. Agora clique na laje vizinha (do outro lado do apoio).');drawPlan();return;}
  const it=byPair(r.e,v,first,k);first=null;if(!it){bar('Essas duas lajes não têm apoio em comum. Clique numa laje e depois na vizinha.');drawPlan();return;}
  sel=it.id;bar('✔ '+it.name+' entre as duas lajes · '+qtyN(it)+' '+dTxt(it.d)+' c/'+fd(it.s)+'. Continue, ou Esc.');drawPlan();return;}
 if(document.body.classList.contains('tool56')||(typeof mode!=='undefined'&&mode))return;
 const it=hit(rawPoint(ev));if(it){ev.stopImmediatePropagation();ev.preventDefault();sel=it.id;open(it);drawPlan();}},true);
document.addEventListener('keydown',ev=>{if(ev.target?.closest?.('input,textarea,select'))return;if(tool&&ev.key==='Escape'){stop();ev.preventDefault();return;}
 if(!tool&&ev.key==='Escape'&&!box.hidden){close();ev.preventDefault();return;}if(!tool&&(ev.key==='Delete')&&sel&&!box.hidden){const it=negs().find(x=>x.id===sel);if(it){del(it);ev.preventDefault();}}});
function pxPage(){const e=ctxE();return e?e.pg:N($('page').value)||1;}
const toP=W=>window.toPage74(pxPage(),W);
function geomP(it){const A=toP(it.A),B=toP(it.B),L=Math.hypot(B.x-A.x,B.y-A.y)||1,u={x:(B.x-A.x)/L,y:(B.y-A.y)/L},n0=toP({x:it.A.x+it.nrm[0]*100,y:it.A.y+it.nrm[1]*100}),k=Math.hypot(n0.x-A.x,n0.y-A.y)/100||1,n={x:(n0.x-A.x)/(k*100),y:(n0.y-A.y)/(k*100)},tp=it.pos!=null&&Number.isFinite(N(it.pos))?N(it.pos):.5,M={x:A.x+(B.x-A.x)*tp,y:A.y+(B.y-A.y)*tp};
 return {A,B,u,n,k,M,P1:{x:M.x-n.x*it.lb*k,y:M.y-n.y*it.lb*k},P2:{x:M.x+n.x*it.la*k,y:M.y+n.y*it.la*k}};}
function hit(P,barOnly){const z=(window.zoom88?.fitZ?.()||zoom||1),tol=12/z;let best=null,bd=tol;for(const it of mine()){const g=geomP(it);const d=barOnly?segD(P,g.P1,g.P2):Math.min(segD(P,g.A,g.B),segD(P,g.P1,g.P2));if(d<bd){bd=d;best=it;}}return best;}
function del(it){const a=negs(),i=a.indexOf(it);if(i<0)return;a.splice(i,1);renum();try{L7().touch();}catch{}try{window.undo58?.push?.();}catch{}close();drawPlan();$('planStatus').textContent=(it.name||'Negativo')+' apagado (Ctrl+Z desfaz).';}
{const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);try{if(image)draw();}catch(e){console.error('V106 planta',e);}return r;};}
function draw(){const list=mine();if(!list.length&&!tool)return;const c=$('plan'),ctx=c.getContext('2d'),o=c.planOrigin25||{x:0,y:0},z=(window.zoom88?.fitZ?.()||zoom||1);ctx.save();ctx.setTransform(1,0,0,1,-o.x,-o.y);ctx.font='bold 13px Arial';window.__txtFixed=true;
 try{for(const it of list){const g=geomP(it),on=it.id===sel,col=on?'#7c2d12':'#c1121f';ctx.strokeStyle=col;ctx.lineWidth=1.2/z;ctx.beginPath();ctx.moveTo(g.A.x,g.A.y);ctx.lineTo(g.B.x,g.B.y);ctx.stroke();
  const hk=8/z,hd=hookDir(g.P2.x-g.P1.x,g.P2.y-g.P1.y);ctx.lineWidth=(on?2.4:1.6)/z;ctx.setLineDash([9/z,5/z]);ctx.beginPath();ctx.moveTo(g.P1.x,g.P1.y);ctx.lineTo(g.P2.x,g.P2.y);ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.moveTo(g.P1.x,g.P1.y);ctx.lineTo(g.P1.x+hd.x*hk,g.P1.y+hd.y*hk);ctx.moveTo(g.P2.x,g.P2.y);ctx.lineTo(g.P2.x+hd.x*hk,g.P2.y+hd.y*hk);ctx.stroke();
  {const gs=(on?7:5)/z;ctx.fillStyle='#fff';ctx.strokeStyle=col;ctx.lineWidth=1.2/z;for(const q of [g.P1,g.P2]){ctx.fillRect(q.x-gs/2,q.y-gs/2,gs,gs);ctx.strokeRect(q.x-gs/2,q.y-gs/2,gs,gs);}}
  let ang=Math.atan2(g.P2.y-g.P1.y,g.P2.x-g.P1.x);if(ang>Math.PI/2)ang-=Math.PI;if(ang<-Math.PI/2)ang+=Math.PI;const Mx=(g.P1.x+g.P2.x)/2-hd.x*9/z,My=(g.P1.y+g.P2.y)/2-hd.y*9/z;
  const lab=qtyN(it)+' '+(it.name||'N')+' '+dTxt(it.d)+' c/'+fd(it.s)+' C='+f1(calc(it),0);
  ctx.save();ctx.translate(Mx,My);ctx.rotate(ang);ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.strokeStyle='#fff';ctx.lineWidth=3.5/z;ctx.strokeText(lab,0,0);ctx.fillStyle=col;ctx.fillText(lab,0,0);ctx.restore();ctx.textBaseline='alphabetic';}
  if(tool&&first!=null)ctx.fillStyle='#c1121f';}finally{window.__txtFixed=false;}ctx.textAlign='left';ctx.restore();}

// ---------- 4. janelinha do negativo
const box=document.createElement('div');box.id='arm106';box.className='noPrint';box.hidden=true;document.body.append(box);
function close(){box.hidden=true;sel=null;try{drawPlan();}catch{}}
function open(it){const C=calc(it,null);box.innerHTML='<div class="h106"><b>'+esc(it.name||'Negativo')+' · negativo</b><button type="button" class="x106" title="Fechar (Esc)">✕</button></div><div class="b106">'+
 '<div class="g106"><label>Bitola<select data-k="d">'+DIAS.map(d=>'<option value="'+d+'"'+(N(it.d)===d?' selected':'')+'>'+dTxt(d)+'</option>').join('')+'</select></label><label>Espaçamento (cm)<input data-k="s" type="number" min="5" max="40" step="0.5" value="'+fd(it.s)+'"></label></div>'+
 '<div class="g106"><label>Lado 1 (cm)<input data-k="la" type="number" min="5" step="5" value="'+f1(it.la,0)+'"></label><label>Lado 2 (cm)<input data-k="lb" type="number" min="5" step="5" value="'+f1(it.lb,0)+'"></label></div>'+
 '<p class="n106">Ao longo do apoio: '+f1(lenN(it),0)+' cm → <b>'+qtyN(it)+' barras</b>. Comprimento = lado 1 + lado 2 + dobras (4 cm na treliçada; altura − 4 cm na maciça) — C ≈ '+f1(C,0)+' cm.</p>'+
 '<div class="a106"><button type="button" data-a="ok">✔ Confirmar</button><button type="button" data-a="del" class="secondary">🗑 Apagar</button></div></div>';
 box.hidden=false;box.querySelector('.x106').onclick=close;box.querySelector('[data-a=ok]').onclick=()=>{const c=cfg();c.d=it.d;c.s=it.s;close();};box.querySelector('[data-a=del]').onclick=()=>del(it);
 box.querySelectorAll('[data-k]').forEach(i=>i.onchange=()=>{const v=N(String(i.value).replace(',','.'));if(!(v>0))return;it[i.dataset.k]=v;try{L7().touch();}catch{}try{window.undo58?.push?.();}catch{}open(it);drawPlan();});}
box.addEventListener('pointerdown',e=>e.stopPropagation());box.addEventListener('click',e=>e.stopPropagation());
// comprimento com as dobras: tipo de laje de cada lado (no meio do trecho)
function calc(it,v){let ha=4,hb=4;try{v=v||window.slab94?.at?.(toP({x:(it.A.x+it.B.x)/2,y:(it.A.y+it.B.y)/2}))?.v;if(v){const M={x:(it.A.x+it.B.x)/2,y:(it.A.y+it.B.y)/2},d=(N(it.t)||14)/2+12,a=compAt(v,{x:M.x+it.nrm[0]*d,y:M.y+it.nrm[1]*d}),b=compAt(v,{x:M.x-it.nrm[0]*d,y:M.y-it.nrm[1]*d});ha=hookOf(a>=0?v.propOf(a):null);hb=hookOf(b>=0?v.propOf(b):null);}}catch{}return N(it.la)+N(it.lb)+ha+hb;}

// ---------- 5. prancha: planta de armaduras + tabela, logo depois da planta de lajes
function items(L,c,availW,availH){const NG=negs().filter(it=>{try{return L7().itemKey(it)===L.key&&(it.tgt||'piso')===L.tgt&&(N(it.rep102)||0)===(N(L.rj)||0);}catch{return false;}});
 const cen=new Map();for(let i=0;i<c.n;i++){if(!c.inside[i])continue;const cp=c.comp[i];if(cp<0)continue;const m=cen.get(cp)||{x:0,y:0,n:0,x0:Infinity,x1:-Infinity,y0:Infinity,y1:-Infinity};const X=c.cx(i),Y=c.cy(i);m.x+=X;m.y+=Y;m.n++;m.x0=Math.min(m.x0,X);m.x1=Math.max(m.x1,X);m.y0=Math.min(m.y0,Y);m.y1=Math.max(m.y1,Y);cen.set(cp,m);}
 const comps=[...cen.entries()].map(([cp,m])=>({cp,x:m.x/m.n,y:m.y/m.n,n:m.n,m})).filter(q=>q.n*c.s0*c.s0>=2500).sort((a,b)=>(b.y-a.y)>30?1:(a.y-b.y)>30?-1:a.x-b.x);
 comps.forEach((q,j)=>{q.name='L'+(j+1);q.pr=c.props[q.cp]||c.def;});
 const man=q=>q.pr.type==='mac'&&q.pr.arm&&(N(q.pr.arm.px?.d)>0||N(q.pr.arm.py?.d)>0),tel=q=>isTR(q.pr.type)&&q.pr.arm?.tela;
 if(!NG.length&&!comps.some(q=>man(q)||tel(q)))return [];
 const sc=N(plotSettings26().scale)||50,k=10/sc,fs=2.5/k;
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(let i=0;i<c.n;i++){if(!c.inside[i])continue;const X=c.cx(i),Y=c.cy(i);x0=Math.min(x0,X);x1=Math.max(x1,X);y0=Math.min(y0,Y);y1=Math.max(y1,Y);}
 c.I.forEach(x=>{for(const P of [x.g.A,x.g.B]){x0=Math.min(x0,P.x);x1=Math.max(x1,P.x);y0=Math.min(y0,P.y);y1=Math.max(y1,P.y);}});if(!isFinite(x0))return [];
 const pad=fs*4,W=x1-x0+2*pad,legH=fs*3.4,H=y1-y0+2*pad+legH,T=P=>[P.x-x0+pad,y1-P.y+pad],r1=v=>v.toFixed(2);
 const tw=(()=>{const a=c.I.map(x=>N(x.t)||14).sort((p,q)=>p-q);return a.length?a[a.length>>1]:14;})();
 // fundo: painéis bem claros
 const cv=document.createElement('canvas');cv.width=c.nx;cv.height=c.ny;const g2=cv.getContext('2d'),im=g2.createImageData(c.nx,c.ny);
 for(let i=0;i<c.n;i++){if(!c.inside[i])continue;const cp=c.comp[i],pr=cp>=0?(c.props[cp]||c.def):c.def;if(pr.type==='sem')continue;const col=c.cant[i]?[254,243,199]:pr.type==='mac'?[250,244,233]:[238,244,251];const x=i%c.nx,y=(i-x)/c.nx,o=((c.ny-1-y)*c.nx+x)*4;im.data[o]=col[0];im.data[o+1]=col[1];im.data[o+2]=col[2];im.data[o+3]=255;}
 g2.putImageData(im,0,0);const XA=c.cx(0)-c.s0/2,YT=c.cy((c.ny-1)*c.nx)+c.s0/2,P0=T({x:XA,y:YT});
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r1(W)} ${r1(H)}" width="${r1(W*k)}mm" height="${r1(H*k)}mm" font-family="Arial"><image x="${r1(P0[0])}" y="${r1(P0[1])}" width="${r1(c.nx*c.s0)}" height="${r1(c.ny*c.s0)}" preserveAspectRatio="none" style="image-rendering:pixelated" href="${cv.toDataURL('image/png')}"/>`;
 c.I.forEach(x=>{const n=x.n,h=Math.max(x.t,8)/2,u=x.g.u,A={x:x.g.A.x-u[0]*h,y:x.g.A.y-u[1]*h},B={x:x.g.B.x+u[0]*h,y:x.g.B.y+u[1]*h},P=[[A.x+n[0]*h,A.y+n[1]*h],[B.x+n[0]*h,B.y+n[1]*h],[B.x-n[0]*h,B.y-n[1]*h],[A.x-n[0]*h,A.y-n[1]*h]].map(q=>T({x:q[0],y:q[1]}).map(r1).join(',')).join(' ');svg+=`<polygon points="${P}" fill="#c9ced6" stroke="#7d8794" stroke-width="${r1(.2/k)}"/>`;});
 const rows=[],tel2=new Map();let nN=NG.length;
 const obs=[],addSeg=(A,B,r)=>{const L=Math.hypot(B.x-A.x,B.y-A.y),k=Math.max(1,Math.ceil(L/(fs*.7)));for(let i=0;i<=k;i++)obs.push({x:A.x+(B.x-A.x)*i/k,y:A.y+(B.y-A.y)*i/k,r});};
 const txt=(P,t,o={})=>{{const sc=o.s||1,w=String(t).length*fs*sc*.56,y=P.y-(o.dy||0),x0=o.a==='start'?P.x+(o.dx||0):P.x+(o.dx||0)-w/2;addSeg({x:x0,y},{x:x0+w,y},fs*sc*.6);}const p=T(P),a=o.rot?` transform="rotate(${r1(o.rot)} ${r1(p[0]+(o.dx||0))} ${r1(p[1]+(o.dy||0))})"`:'';return `<text x="${r1(p[0]+(o.dx||0))}" y="${r1(p[1]+(o.dy||0))}" font-size="${r1(fs*(o.s||1))}" text-anchor="${o.a||'middle'}" fill="${o.c||'#111'}"${o.b?' font-weight="700"':''}${a}>${esc(t)}</text>`;};
 const ln=(A,B,col,w,dash)=>{const a=T(A),b=T(B);return `<path d="M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}" stroke="${col}" stroke-width="${r1(fs*w)}" fill="none"${dash?` stroke-dasharray="${r1(fs*.7)} ${r1(fs*.35)}"`:''}/>`;};
 const ticks=(A,B,col)=>{const dx=B.x-A.x,dy=B.y-A.y,l=Math.hypot(dx,dy)||1,px=-dy/l,py=dx/l,t=fs*.5;return ln({x:A.x-px*t,y:A.y-py*t},{x:A.x+px*t,y:A.y+py*t},col,.1)+ln({x:B.x-px*t,y:B.y-py*t},{x:B.x+px*t,y:B.y+py*t},col,.1);};
 // painéis: nome, tipo e positivo
 for(const q of comps){const pr=q.pr,m=q.m,C0={x:(m.x0+m.x1)/2,y:m.y0+(m.y1-m.y0)*.8};const tt=pr.type==='sem'?'sem laje':isTR(pr.type)?q.name+' · '+String(pr.type).toUpperCase()+' (h='+hOf(pr)+')':pr.type==='mac'?q.name+' · MACIÇA h='+hOf(pr):q.name;
  if(pr.type==='sem'){svg+=txt(C0,q.name+' · sem laje',{c:'#666'});continue;}
  if(isTR(pr.type)||pr.type==='alv'){const tl=pr.arm?.tela;svg+=txt(C0,tt,{b:1,c:'#1d4f86',s:1.15,dy:-fs*.7})+txt(C0,tl?'POSITIVO: TELA '+tl:'sem tela',{b:1,c:'#1d4f86',dy:fs*.7});
   if(tl){const ar=q.n*c.s0*c.s0/1e4;const t2=tel2.get(tl)||{a:0,L:[]};t2.a+=ar;t2.L.push(q.name);tel2.set(tl,t2);}continue;}
  // maciça
  const fx=(m.x1-m.x0)+c.s0,fy=(m.y1-m.y0)+c.s0,ax=m.x0-c.s0/2,bx=m.x1+c.s0/2,ay=m.y0-c.s0/2,by=m.y1+c.s0/2;
  svg+=txt({x:ax,y:by},tt,{b:1,c:'#7a4b00',s:1.1,a:'start',dx:fs*.6,dy:fs*1.4});
  const a=pr.arm||{};if(!man(q)){svg+=txt(C0,'positivo calculado — ver prancha da laje maciça',{c:'#7a4b00',s:.85});continue;}
  if(N(a.px?.d)>0){const s=N(a.px.s)||15,C=fx+2*tw-2*COB,n=Math.floor(fy/s)+1,y=ay+fy*.68,P1={x:ax-tw+COB,y},P2={x:bx+tw-COB,y},id='N'+(++nN);
   addSeg(P1,P2,fs*.4);svg+=ln(P1,P2,'#b45309',.22)+txt({x:(ax+bx)/2,y},n+' '+id+' '+dTxt(a.px.d)+' c/'+fd(s)+' C='+f1(C,0),{b:1,c:'#b45309',s:.9,dy:-fs*.35});
   const dx=ax+fx*.18;svg+=ln({x:dx,y:ay+2},{x:dx,y:by-2},'#b45309',.07)+ticks({x:dx,y:ay+2},{x:dx,y:by-2},'#b45309')+txt({x:dx,y:ay+fy*.4},n+' barras',{c:'#b45309',s:.75,a:'start',dx:fs*.4});
   rows.push({N:id,d:N(a.px.d),n,C,onde:'positivo '+q.name+' (X)'});}
  if(N(a.py?.d)>0){const s=N(a.py.s)||15,C=fy+2*tw-2*COB,n=Math.floor(fx/s)+1,x=ax+fx*.8,P1={x,y:ay-tw+COB},P2={x,y:by+tw-COB},id='N'+(++nN);
   addSeg(P1,P2,fs*.4);{const w=24*fs*.9*.56;addSeg({x:x+fs*.35,y:(ay+by)/2-w/2},{x:x+fs*.35,y:(ay+by)/2+w/2},fs*.55);}svg+=ln(P1,P2,'#b45309',.22);{const p=T({x,y:(ay+by)/2});svg+=`<text x="${r1(p[0]-fs*.35)}" y="${r1(p[1])}" font-size="${r1(fs*.9)}" text-anchor="middle" fill="#b45309" font-weight="700" transform="rotate(-90 ${r1(p[0]-fs*.35)} ${r1(p[1])})">${esc(n+' '+id+' '+dTxt(a.py.d)+' c/'+fd(s)+' C='+f1(C,0))}</text>`;}
   const dy=ay+fy*.2;svg+=ln({x:ax+2,y:dy},{x:bx-2,y:dy},'#b45309',.07)+ticks({x:ax+2,y:dy},{x:bx-2,y:dy},'#b45309')+txt({x:ax+fx*.3,y:dy},n+' barras',{c:'#b45309',s:.75,dy:fs*1});
   rows.push({N:id,d:N(a.py.d),n,C,onde:'positivo '+q.name+' (Y)'});}}
 // negativos
 const nameOf=cp=>comps.find(q=>q.cp===cp)?.name||'';
 NG.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt',{numeric:true})).forEach((it,ix)=>{const L=lenN(it),u={x:(it.B.x-it.A.x)/(L||1),y:(it.B.y-it.A.y)/(L||1)},nv={x:it.nrm[0],y:it.nrm[1]},__auto=(()=>{if(it.pos!=null&&Number.isFinite(N(it.pos)))return;const lw=24*fs*.9*.56;let best=.5,bv=-Infinity;for(let t=.08;t<=.921;t+=.02){const M={x:it.A.x+u.x*L*t,y:it.A.y+u.y*L*t},P1={x:M.x+nv.x*it.la,y:M.y+nv.y*it.la},P2={x:M.x-nv.x*it.lb,y:M.y-nv.y*it.lb},bl=Math.hypot(P2.x-P1.x,P2.y-P1.y)||1,ex=Math.max(0,(lw-bl)/2),dx=(P2.x-P1.x)/bl,dy=(P2.y-P1.y)/bl,Q1={x:P1.x-dx*ex,y:P1.y-dy*ex},Q2={x:P2.x+dx*ex,y:P2.y+dy*ex};let v=Infinity;const k=Math.max(2,Math.ceil((bl+2*ex)/(fs*.7)));for(let i=0;i<=k;i++){for(const off of [-1,0,1]){const X=Q1.x+(Q2.x-Q1.x)*i/k+u.x*off*fs*.7,Y=Q1.y+(Q2.y-Q1.y)*i/k+u.y*off*fs*.7;for(const o of obs){const d=Math.hypot(o.x-X,o.y-Y)-o.r;if(d<v)v=d;}}}v-=Math.abs(t-.5)*fs*.3;if(v>bv+1e-6){bv=v;best=t;}}it.pos=Math.round(best*1000)/1000;})(),tt=Number.isFinite(N(it.pos))&&it.pos!=null?N(it.pos):[.5,.3,.7][ix%3],M={x:it.A.x+u.x*L*tt,y:it.A.y+u.y*L*tt};
  const d=(N(it.t)||tw)/2+12,ca=compAt(c,{x:M.x+nv.x*d,y:M.y+nv.y*d}),cb=compAt(c,{x:M.x-nv.x*d,y:M.y-nv.y*d}),ha=hookOf(ca>=0?c.propOf(ca):null),hb=hookOf(cb>=0?c.propOf(cb):null),C=N(it.la)+N(it.lb)+ha+hb,n=qtyN(it);
  const P1={x:M.x+nv.x*it.la,y:M.y+nv.y*it.la},P2={x:M.x-nv.x*it.lb,y:M.y-nv.y*it.lb};
  svg+=ln(it.A,it.B,'#c1121f',.07)+ticks(it.A,it.B,'#c1121f');
  {const bl=Math.hypot(P2.x-P1.x,P2.y-P1.y)||1,lw=24*fs*.9*.56,ex=Math.max(0,(lw-bl)/2),dx=(P2.x-P1.x)/bl,dy=(P2.y-P1.y)/bl;addSeg({x:P1.x-dx*ex,y:P1.y-dy*ex},{x:P2.x+dx*ex,y:P2.y+dy*ex},fs*1.1);}
  const a1=T(P1),b1=T(P2),bl=Math.hypot(b1[0]-a1[0],b1[1]-a1[1])||1,ux=(b1[0]-a1[0])/bl,uy=(b1[1]-a1[1])/bl,hd=hookDir(b1[0]-a1[0],b1[1]-a1[1]),h=fs*.8,sw=r1(fs*.15);
  // barra tracejada fina + dobras cheias nas duas pontas
  svg+=`<path d="M${r1(a1[0])} ${r1(a1[1])}L${r1(b1[0])} ${r1(b1[1])}" stroke="#c1121f" stroke-width="${sw}" fill="none" stroke-dasharray="${r1(fs*.8)} ${r1(fs*.4)}"/><path d="M${r1(a1[0])} ${r1(a1[1])}l${r1(hd.x*h)} ${r1(hd.y*h)}M${r1(b1[0])} ${r1(b1[1])}l${r1(hd.x*h)} ${r1(hd.y*h)}" stroke="#c1121f" stroke-width="${sw}" fill="none"/>`;
  let ang=Math.atan2(uy,ux)*180/Math.PI;if(ang>90)ang-=180;if(ang<=-90)ang+=180;{const ra=ang*Math.PI/180;if(Math.sin(ra)*hd.x-Math.cos(ra)*hd.y>0)ang+=ang>0?-180:180;}
  const lab=n+' '+it.name+' '+dTxt(it.d)+' c/'+fd(it.s)+' C='+f1(C,0),lw=lab.length*fs*.9*.56,sh=lw>bl?(lw-bl)/2*(N(it.la)>=N(it.lb)?-1:1):0;
  const mx0=(a1[0]+b1[0])/2,my0=(a1[1]+b1[1])/2,tl=(x,y,t,sz,b)=>`<text x="${r1(x)}" y="${r1(y)}" font-size="${r1(fs*sz)}" text-anchor="middle" fill="#c1121f"${b?' font-weight="700"':''} transform="rotate(${r1(ang)} ${r1(x)} ${r1(y)})">${esc(t)}</text>`;
  // texto do lado oposto às dobras: 30 N1 Ø6,3 c/15 C=218 ; do lado das dobras: o trecho reto e as dobras
  svg+=tl(mx0+ux*sh-hd.x*fs*.4,my0+uy*sh-hd.y*fs*.4,lab,.9,1);
  svg+=tl(mx0+hd.x*fs*1.25,my0+hd.y*fs*1.25,f1(N(it.la)+N(it.lb),0),.7);
  svg+=tl(a1[0]+hd.x*h*.55-ux*fs*.6,a1[1]+hd.y*h*.55-uy*fs*.6,f1(ha,0),.6)+tl(b1[0]+hd.x*h*.55+ux*fs*.6,b1[1]+hd.y*h*.55+uy*fs*.6,f1(hb,0),.6);
  const on=[nameOf(ca),nameOf(cb)].filter(Boolean).join(' | ');rows.unshift({N:it.name,d:N(it.d),n,C,onde:(it.cant?'balanço ':'negativo ')+(on||'apoio'),neg:1});});
 rows.sort((a,b)=>String(a.N).localeCompare(String(b.N),'pt',{numeric:true}));
 // legenda
 const ly=H-legH*.45;let lx=pad*.5;for(const[t,col,dash]of [['Negativo (tracejado, sobre o apoio)','#c1121f',2],['Faixa de distribuição','#c1121f',3],['Positivo (maciça)','#b45309']]){svg+=`<path d="M${r1(lx)} ${r1(ly-fs*.35)}h${r1(fs*1.6)}" stroke="${col}" stroke-width="${r1(fs*(dash===3?.07:.26))}"${dash===2?` stroke-dasharray="${r1(fs*.5)} ${r1(fs*.25)}"`:''}/><text x="${r1(lx+fs*2)}" y="${r1(ly)}" font-size="${r1(fs*.85)}" fill="#33414f">${t}</text>`;lx+=fs*(t.length*.55+3.5);}
 svg+=`<text x="${r1(W-pad*.5)}" y="${r1(ly)}" font-size="${r1(fs*.85)}" fill="#33414f" text-anchor="end">medidas em cm · cobrimento ${f1(COB)} cm</text></svg>`;
 const out=[];const it1=svgPanel26('Armaduras das lajes (negativos e positivos) · '+L.name,svg);if(it1){it1.slab95=true;it1.arm106=true;if(it1.w<=availW+.01&&it1.h<=availH+.01)out.push(it1);}
 // tabela de aço e telas
 if(rows.length||tel2.size){let html='';const tot=new Map();
  if(rows.length){html+='<h3>Tabela de aço — lajes</h3>'+plotTable26(['N','Ø (mm)','Qtde.','C unit. (cm)','C total (m)','Onde'],rows.map(r=>{const t=r.n*r.C/100;tot.set(r.d,(tot.get(r.d)||0)+t);return [r.N,f1(r.d,1),r.n,f1(r.C,0),f1(t,2),r.onde];}));
   html+='<h3>Resumo por bitola (barras de 12 m)</h3>'+plotTable26(['Bitola','Total (m)','Barras 12 m','Peso (kg)'],[...tot].sort((a,b)=>a[0]-b[0]).map(([d,t])=>[dTxt(d),f1(t,2),f1(t/12,1),f1(t*(KG[d]||0),1)]).concat([['Total','','',f1([...tot].reduce((s,[d,t])=>s+t*(KG[d]||0),0),1)]]));}
  if(tel2.size)html+='<h3>Resumo de telas soldadas</h3>'+plotTable26(['Tela','Malha','Lajes','Área (m²)','Área + 10% transpasse','Painéis 2,45 × 6,00'],[...tel2].map(([k,t])=>[k,'Ø'+f1(TELAS[k][0])+' c/'+TELAS[k][1]+'×'+TELAS[k][1],t.L.join(', '),f1(t.a,2),f1(t.a*1.1,2),String(Math.ceil(t.a*1.1/14.7))]));
  html+='<p>Detalhamento informado pelo projetista. Cobrimento '+f1(COB)+' cm. Negativos com dobra de 4 cm na treliçada e altura − 4 cm na maciça. Positivo da maciça reto, sem dobra, até o fim das paredes. Aço CA-50 (CA-60 no Ø5,0).</p>';
  const Wd=Math.min(availW,240),h=measureHTML26(html,Wd-4)+13;if(h<=availH)out.push({title:'Tabela de aço das lajes · '+L.name,w:Wd,h,html,slab95:true,arm106:true});}
 return out;}
window.arm106={popHTML,change,start,stop,items,renum,list:negs,calc};
const css=document.createElement('style');css.textContent='#arm106{position:fixed;top:140px;right:24px;width:300px;z-index:64;background:#fff;border:1px solid #b9c6d3;border-radius:9px;box-shadow:0 10px 28px rgba(16,46,75,.22);font-size:12.5px}#arm106[hidden]{display:none}#arm106 .h106{display:flex;align-items:center;gap:8px;padding:7px 10px;background:#fdecea;border-bottom:1px solid #f0c4c0}#arm106 .h106 b{flex:1;color:#7f1d1d}#arm106 .x106{border:1px solid #e3b4ad;background:#fff;color:#b42318;font-weight:700;margin:0;padding:2px 8px;border-radius:6px;cursor:pointer}#arm106 .b106{padding:8px 10px}#arm106 .g106{display:flex;gap:8px;margin:4px 0}#arm106 .g106 label{display:flex;flex-direction:column;font-size:11px;color:#40566b}#arm106 .g106 input,#arm106 .g106 select{margin:0;width:110px}#arm106 .n106{color:#5b6d7f;font-size:11px;margin:6px 0}#arm106 .a106{display:flex;gap:6px}#arm106 .a106 button{margin:0}body.arm106on #plan{cursor:crosshair}';document.head.append(css);
})();
