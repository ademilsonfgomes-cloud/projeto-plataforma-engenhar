// V87 — desníveis: paredes com base/topo deslocados em fiadas inteiras.
// A amarração entre paredes passa a ser conferida pela fiada ABSOLUTA (altura real), não pelo número da fiada.
(function(root){
'use strict';
const N=Number;
const off=w=>!!(N(w?.base87)||N(w?.top87));
const stepOfM=m=>N(m?.step)||20;
const D87={
 off,
 any:walls=>Array.isArray(walls)&&walls.some(off),
 kb:(w,step)=>Math.round((N(w?.base87)||0)/(N(step)||20)),
 kbr:(w,m)=>Math.round((N(w?.base87)||0)/stepOfM(m)),
 // alturas compatíveis no encontro: iguais, ou paredes com desnível (a conferência passa a ser por fiada absoluta)
 hok:(a,b)=>N(a?.height)===N(b?.height)||off(a)||off(b),
 present(w,a,step){const k=D87.kb(w,step),C=Math.floor((N(w.height)+.01)/step);return a>=k&&a<k+C;},
 // encontro "T com a passante dividida": dois L na mesma ponta da parede X, um de cada lado (as fachadas de duas casas encontrando a divisória)
 partner(qs,q){if(q.type!=='L')return null;for(const q2 of qs||[]){if(q2===q||q2.type!=='L')continue;for(const s of ['a','b'])for(const s2 of ['a','b']){if(q[s].i!==q2[s2].i)continue;const t=s==='a'?q.ta:q.tb,t2=s2==='a'?q2.ta:q2.tb;if(Math.abs(t-t2)>1.1)continue;const X=q[s].i,Y=q[s==='a'?'b':'a'].i,Z=q2[s2==='a'?'b':'a'].i;if(Y===Z)continue;return {X,Y,Z,q2};}}return null;},
 // configuração da fiada r da parede i: paridade pela fiada absoluta; onde a vizinha não existe, o encontro vira peça contínua desta parede
 cfg(configs,i,r,walls,qs,step){const pair=configs.get(i);if(!D87.any(walls))return pair[r%2];
  const w=walls[i],k=D87.kb(w,step),a=r+k,p=((a%2)+2)%2;let cfg=pair[p];
  for(const q of qs||[]){if(q.a.i!==i&&q.b.i!==i)continue;const o=walls[q.a.i===i?q.b.i:q.a.i];if(!o)continue;
   const ko=D87.kb(o,step),Co=Math.floor((N(o.height)+.01)/step);if(a>=ko&&a<ko+Co)continue;// a vizinha existe nesta fiada
   if(cfg.car87?.[q.id])continue;// esta parede já é a portante aqui
   {const pt=D87.partner(qs,q);if(pt&&pt.X===i&&walls[pt.Z]&&D87.present(walls[pt.Z],a,step))continue;}// a outra casa ainda encosta aqui
   // vizinha ausente e esta parede não é a portante nesta paridade: o encontro some — ponta livre até a face externa
   const oth=cfg.oth87?.[q.id],j=N(oth?.j)||N(cfg.fixed[0]?.joint)||1,half=N(oth?.half)||N(o.width)/2||7;
   const span=f=>[N(f.x),N(f.x)+N(f.length)+N(f.joint??j)],same=(u,v)=>Math.abs(u[0]-v[0])<.02&&Math.abs(u[1]-v[1])<.02;
   let pass=cfg.cuts.filter(c=>!cfg.fixed.some(f=>same(span(f),c)));if(oth?.cut)pass=pass.filter(c=>!same(c,oth.cut));
   const fixed=cfg.fixed.filter(f=>f.junction!==q.id);let from=cfg.from,to=cfg.to;
   if(oth?.oep===0)from=-half-j/2;if(oth?.oep===1)to=N(w.length)+half+j/2;
   const o87={...(cfg.oth87||{})};delete o87[q.id];
   cfg={...cfg,from,to,fixed,cuts:[...fixed.map(span),...pass],oth87:o87,absent87:[...(cfg.absent87||[]),q.id]};}
  for(const q of qs||[]){if(q.type!=='L'||(q.a.i!==i&&q.b.i!==i)||!cfg.car87?.[q.id])continue;const pt=D87.partner(qs,q);if(!pt||pt.Y!==i||pt.Z<i)continue;// a de menor número fica com a peça de canto
   if(!walls[pt.Z]||!D87.present(walls[pt.Z],a,step))continue;const car=cfg.car87[q.id],j=N(car.j)||1,half=N(car.half)||7;
   const span=f=>[N(f.x),N(f.x)+N(f.length)+N(f.joint??j)],same=(u,v)=>Math.abs(u[0]-v[0])<.02&&Math.abs(u[1]-v[1])<.02;
   const pass=cfg.cuts.filter(c=>!cfg.fixed.some(f=>same(span(f),c))),fixed=cfg.fixed.filter(f=>f.junction!==q.id);let from=cfg.from,to=cfg.to;
   if(car.ep===0)from=half+j/2;else if(car.ep===1)to=N(walls[i].length)-half-j/2;const c87={...cfg.car87};delete c87[q.id];
   cfg={...cfg,from,to,fixed,cuts:[...fixed.map(span),...pass],car87:c87,yield87:[...(cfg.yield87||[]),q.id]};}
  // peça de canto repetida (os dois L da divisória pedem a mesma peça no mesmo lugar): fica uma só
  {const seen=[],dup=[];for(const f of cfg.fixed){if(seen.some(g=>Math.abs(N(g.x)-N(f.x))<.02&&Math.abs(N(g.length)-N(f.length))<.02))dup.push(f);else seen.push(f);}
   if(dup.length){const j=N(cfg.fixed[0]?.joint)||1,span=f=>[N(f.x),N(f.x)+N(f.length)+N(f.joint??j)],same=(u,v)=>Math.abs(u[0]-v[0])<.02&&Math.abs(u[1]-v[1])<.02,pass=cfg.cuts.filter(c=>!cfg.fixed.some(f=>same(span(f),c)));cfg={...cfg,fixed:seen,cuts:[...seen.map(span),...pass]};}}
  return cfg;},
 // conferência: no L sem peça contínua, vale a peça da parede colinear do outro lado (T com passante dividida)
 cover(walls,results,q,a){const qs=D87._qs(walls),pt=D87.partner(qs,qs.find(x=>x.a.i===q.a.i&&x.b.i===q.b.i)||q);if(!pt)return false;const Z=walls[pt.Z],m=results[pt.Z];if(!Z||!m?.rows)return false;
  const row=m.rows[a-D87.kbr(Z,m)];if(!row)return false;const q2=pt.q2,t=q2.a.i===pt.Z?q2.ta:q2.tb,half=N(Z.width)/2;
  return row.pieces.some(p=>!p.fill&&p.x+N(p.joint)/2<=t-half+.01&&p.x+N(p.joint)/2+N(p.length)>=t+half-.01);},
 _qs(walls){if(D87.__w===walls&&D87.__q)return D87.__q;D87.__w=walls;D87.__q=root.JunctionEngine.detect(walls);return D87.__q;}
};
root.D87=D87;
})(typeof globalThis!=='undefined'?globalThis:this);

(function(root){
'use strict';
// V53 — regra única de amarração e resolvedor de fiadas por varredura.
// Regra: defasagem mínima obrigatória entre juntas verticais de fiadas consecutivas
// (configurável, padrão 10 cm); meta = meia amarração (metade do módulo do bloco principal).
const N=Number,HARD=1e5,EPS=1e-6;
function bondMin(){const v=N(root.bondMin53);return Number.isFinite(v)&&v>=0?v:10;}
root.BondRule53={min:bondMin};

// Juntas de uma fiada montada: centro do vão entre peças consecutivas (vão até 6 cm).
function rowJoints(pieces){const ps=pieces.filter(p=>!p.fill&&!p.channel).slice().sort((a,b)=>a.x-b.x),out=[];
 for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i],end=N(a.x)+N(a.joint||0)/2+N(a.length),start=N(b.x)+N(b.joint||0)/2,gap=start-end;if(gap>-.01&&gap<=6.01)out.push((end+start)/2);}
 return out;}
// Bordas livres (ombreiras de aberturas) de uma fiada, longe das extremidades da parede.
function rowEdges(pieces,L){const ps=pieces.filter(p=>!p.channel).slice().sort((a,b)=>a.x-b.x),out=[];
 for(let i=0;i<ps.length;i++){const p=ps[i],s=N(p.x)+N(p.joint||0)/2,e=s+N(p.length),prev=ps[i-1],next=ps[i+1];
  if(prev&&s-(N(prev.x)+N(prev.joint||0)/2+N(prev.length))>6.01)out.push(s);
  if(next&&(N(next.x)+N(next.joint||0)/2)-e>6.01)out.push(e);}
 return out.filter(x=>x>12&&x<L-12);}

function makeContext(spec){
 const all=spec.all||spec.blocks,role=b=>b.role&&['Principal','Complementar','Encontro'].includes(b.role)?b.role:root.ModEngine.roleOf(b,all);
 const seen=new Map();
 const sorted=spec.blocks.filter(b=>b.type!=='Canaleta'&&N(b.length)>0).slice().sort((a,b)=>{const r=x=>role(x)==='Principal'?0:x.type==='Especial'?2:1;return r(a)-r(b);});
 for(const b of sorted){const k=N(b.length).toFixed(1);if(!seen.has(k))seen.set(k,b);} // peças de mesma medida (ex.: B29 / COMP29) contam uma vez
 const variant=N(spec.variant)||0,noise=code=>{if(!variant)return 0;let h=variant*2654435761>>>0;for(const c of String(code))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return (h%1000)/1000*25;};
 const blocks=[...seen.values()].map(b=>{const L=N(b.length),r=role(b);let cost=r==='Principal'?10:b.type==='Especial'||/^B(44|54)$/.test(String(b.code))?260:L<10?700:120;return {b,L,cost:cost+noise(b.code),principal:r==='Principal'};});
 const main=blocks.filter(x=>x.principal).sort((a,b)=>b.L-a.L)[0]||blocks.slice().sort((a,b)=>b.L-a.L)[0];
 const j=N(spec.j),ideal=main?(main.L+j)/2:20;
 return {blocks,main,j,ideal,min:bondMin(),Wb:40,flex:spec.flex&&Number.isFinite(N(spec.flex.min))&&Number.isFinite(N(spec.flex.max))&&N(spec.flex.max)>N(spec.flex.min)?{min:N(spec.flex.min),max:N(spec.flex.max)}:null,
  cut:root.cutOptions23?.enabled?Math.max(0,N(root.cutOptions23.max)||0):0,fillMax:Math.max(0,Math.min(4,N(root.fillMax53??4)||0)),h:N(spec.h),width:N(spec.width),L:N(spec.L),cache:new Map()};}

function penaltyOf(d,ctx){return d<ctx.min-.001?HARD:ctx.Wb*Math.max(0,ctx.ideal-d);}
// Penalidade de cada posição interna do trecho (mm) em função das juntas/bordas vizinhas.
function penaltyArray(X0,n,neighs,ctx){const pen=new Float64Array(n+1);
 for(const list of neighs){if(!list.length)continue;const xs=list.map(v=>Math.round(v*10)).sort((a,b)=>a-b);let at=0;
  for(let k=1;k<n;k++){const x=X0+k;while(at+1<xs.length&&Math.abs(xs[at+1]-x)<=Math.abs(xs[at]-x))at++;pen[k]+=penaltyOf(Math.abs(xs[at]-x)/10,ctx);}}
 return pen;}

// Varredura exata de um trecho [from,to]: menor custo de peças + penalidade de amarração.
function dp(from,to,neighs,ctx,stage){
 const X0=Math.round(from*10),n=Math.round(to*10)-X0;if(n<=0)return n===0?{cost:0,seq:[]}:null;
 const pen=penaltyArray(X0,n,neighs,ctx),results=[];
 const joints=[[ctx.j,0]];
 if(stage.flex&&ctx.flex){for(let v=Math.ceil(ctx.flex.min*10-EPS);v<=Math.floor(ctx.flex.max*10+EPS);v++){const jj=v/10;if(Math.abs(jj-ctx.j)>EPS)joints.push([jj,300+Math.abs(jj-ctx.j)*600]);}}
 for(const[jj,base]of joints){
  const edges=ctx.blocks.map(x=>({s:Math.round((x.L+jj)*10),cost:x.cost+(base?Math.abs(jj-ctx.j)*80:0),x,len:x.L,joint:jj}));
  if(stage.cut&&ctx.cut>0&&ctx.main){const m=ctx.main;for(let c=1;c<=Math.round(ctx.cut*10);c++){const len=Math.round((m.L-c/10)*10)/10;if(len>=Math.max(29,m.L*.7))edges.push({s:Math.round((len+jj)*10),cost:450+c,x:m,len,joint:jj,cut:true});}}
  if(stage.fill&&ctx.fillMax>0){for(let c=1;c<=Math.round(ctx.fillMax*10);c++)edges.push({s:c,cost:1500,x:null,len:c/10,joint:0,fill:true});}
  // Estado 0: livre; estado 1: acabou de usar peça pequena (< 10 cm). Peças pequenas entram em grupos de 1 a 3, nunca seguidos de outro grupo.
  const small=e=>!e.fill&&e.len<10-EPS,macro=[];for(const e of edges){if(!small(e))continue;for(let r=1;r<=3;r++)macro.push({s:e.s*r,cost:e.cost*r,run:r,e});}
  const big=edges.filter(e=>!small(e)),S=2,idx=(k,st)=>k*S+st;
  const cost=new Float64Array((n+1)*S).fill(Infinity),back=new Int32Array((n+1)*S).fill(-1),via=new Int32Array((n+1)*S).fill(-1);cost[idx(0,0)]=base;
  // Laço principal com vetores numéricos (mais rápido). A ordem das operações é a mesma
  // de antes, para o resultado ser idêntico — inclusive nos empates.
  const nb=big.length,bS=new Int32Array(nb),bC=new Float64Array(nb);for(let e=0;e<nb;e++){bS[e]=big[e].s;bC[e]=big[e].cost;}
  const nm=macro.length,mS=new Int32Array(nm),mC=new Float64Array(nm),mR=new Int32Array(nm),mE=new Int32Array(nm);for(let e=0;e<nm;e++){mS[e]=macro[e].s;mC[e]=macro[e].cost;mR[e]=macro[e].run;mE[e]=macro[e].e.s;}
  for(let k=0;k<n;k++)for(let st=0;st<S;st++){const from=k*S+st,c0=cost[from];if(c0===Infinity)continue;
   for(let e=0;e<nb;e++){const k2=k+bS[e];if(k2>n)continue;const c=c0+bC[e]+(k2<n?pen[k2]:0),t=k2*S;if(c<cost[t]-1e-9){cost[t]=c;back[t]=from;via[t]=e;}}
   if(st===0)for(let e=0;e<nm;e++){const k2=k+mS[e];if(k2>n)continue;let c=c0+mC[e];const es=mE[e],run=mR[e];for(let r=1;r<=run;r++){const kk=k+es*r;if(kk<n)c+=pen[kk];}const t=k2*S+1;if(c<cost[t]-1e-9){cost[t]=c;back[t]=from;via[t]=nb+e;}}}
  const endState=cost[idx(n,0)]<=cost[idx(n,1)]?0:1;if(cost[idx(n,endState)]===Infinity)continue;
  const seq=[];let t=idx(n,endState);while(t!==idx(0,0)){const v=via[t];if(v<big.length)seq.push(big[v]);else{const m=macro[v-big.length];for(let r=0;r<m.run;r++)seq.push(m.e);}t=back[t];}seq.reverse();
  results.push({cost:cost[idx(n,endState)],seq});}
 if(!results.length)return null;return results.sort((a,b)=>a.cost-b.cost)[0];}

function piecesOf(res,from,y,ctx){let x=from;return res.seq.map(e=>{let p;if(e.fill)p={code:'FILETE',x,y,length:e.len,height:ctx.h,width:ctx.width,joint:0,fill:true};
 else{const b=e.x.b;p={code:e.cut?(b.code+'_C'+e.len.toFixed(2)):b.code,x,y,length:e.len,height:ctx.h,width:ctx.width,joint:e.joint,fill:false};if(e.cut)Object.assign(p,{cut:true,sourceCode:b.code,sourceLength:N(b.length),cutAmount:Math.round((N(b.length)-e.len)*10)/10});}
 x=Math.round((x+e.len+(e.fill?0:e.joint))*10000)/10000;return p;});}

function fillSegment(from,to,neighs,ctx){
 const key=from.toFixed(2)+'|'+to.toFixed(2)+'|'+neighs.map(l=>l.filter(v=>v>from-30&&v<to+30).map(v=>v.toFixed(1)).join(',')).join('/');
 if(ctx.cache.has(key))return ctx.cache.get(key);
 let res=null;for(const stage of [{},{flex:true},{cut:true},{fill:true},{flex:true,cut:true,fill:true}]){const r=dp(from,to,neighs,ctx,stage);if(r&&(!res||r.cost<res.cost))res=r;if(res&&res.cost<HARD)break;}
 ctx.cache.set(key,res);return res;}

// Fechamento parcial quando nenhuma combinação fecha (mantém comportamento anterior: trecho pendente).
function partial(from,to,y,ctx){const out=[];let x=from,rem=to-from;const m=ctx.main;
 while(m&&m.L+ctx.j<=rem+.001){out.push({code:m.b.code,x,y,length:m.L,height:ctx.h,width:ctx.width,joint:ctx.j,fill:false});x+=m.L+ctx.j;rem-=m.L+ctx.j;}
 const last=ctx.blocks.filter(b=>b.L+ctx.j<=rem+.001).sort((a,b)=>b.L-a.L)[0];if(last)out.push({code:last.b.code,x,y,length:last.L,height:ctx.h,width:ctx.width,joint:ctx.j,fill:false});return out;}

function assemble(course,fills){return [...course.fixed.map(p=>({...p,y:course.y})),...fills.flat()].sort((a,b)=>a.x-b.x);}
function pieceCost(pieces,ctx){let c=0;for(const p of pieces){if(p.meeting)continue;if(p.fill){c+=1500;continue;}const k=ctx.blocks.find(b=>Math.abs(b.L-p.length)<.01);c+=p.cut?450:k?k.cost:200;if(Math.abs(N(p.joint)-ctx.j)>.001)c+=60;}return c;}
function pairStats(a,b,L,ctx){const ja=rowJoints(a),jb=rowJoints(b),ea=rowEdges(a,L),eb=rowEdges(b,L);let pen=0,min=Infinity,at=null,hard=0;
 const scan=(xs,ys)=>{if(!ys.length)return;for(const p of xs){let d=Infinity,q=null;for(const y of ys){const v=Math.abs(p-y);if(v<d){d=v;q=y;}}const f=penaltyOf(d,ctx);pen+=f;if(f>=HARD)hard++;if(d<min){min=d;at=p;}}};
 scan(ja,[...jb,...eb]);scan(jb,[...ja,...ea]);return {pen,min,at,hard};}

function solve(spec){
 const ctx=makeContext(spec),C=spec.courses,R=C.length,L=ctx.L;
 const fixedMarks=C.map(c=>{const out=[];for(const p of c.fixed){for(const x of [N(p.x),N(p.x)+N(p.length)+N(p.joint||0)])if(x>12&&x<L-12)out.push(x);}return out;});
 function neighFor(r,rows){const out=[];for(const k of [r-1,r+1]){if(k<0||k>=R)continue;out.push(rows[k]?[...rowJoints(rows[k]),...rowEdges(rows[k],L)]:fixedMarks[k]);}return out;}
 function total(rows){let c=0;for(const r of rows)c+=pieceCost(r,ctx);for(let r=1;r<R;r++)c+=pairStats(rows[r-1],rows[r],L,ctx).pen;return c;}
 function solveCourse(r,rows,fills,failed){const course=C[r],out=[];course.intervals.forEach(([a,b],k)=>{const res=fillSegment(a,b,neighFor(r,rows),ctx);if(res)out[k]=piecesOf(res,a,course.y,ctx);else{out[k]=partial(a,b,course.y,ctx);failed.add(r+':'+k);}});fills[r]=out;rows[r]=assemble(course,out);}
 function run(order){const rows=new Array(R),fills=new Array(R),failed=new Set();for(const r of order)solveCourse(r,rows,fills,failed);
  let best=total(rows);
  for(let pass=0;pass<6;pass++){let improved=false;const seq=pass%2?[...Array(R).keys()].reverse():[...Array(R).keys()];
   for(const r of seq){const oldRow=rows[r],oldFill=fills[r],f=new Set();solveCourse(r,rows,fills,f);const t=total(rows);if(t<best-1e-6){best=t;improved=true;}else{rows[r]=oldRow;fills[r]=oldFill;}}
   if(!improved)break;}
  return {rows,failed,score:best};}
 const idx=[...Array(R).keys()],orders=[idx,[...idx].reverse()];if(R>1)orders.push([1,0,...idx.slice(2)]);
 let best=null;for(const o of orders){const s=run(o);if(!best||s.score<best.score)best=s;}
 let min=Infinity,at=null,between=null,hard=0;for(let r=1;r<R;r++){const s=pairStats(best.rows[r-1],best.rows[r],L,ctx);hard+=s.hard;if(s.min<min){min=s.min;at=s.at;between=[r,r+1];}}
 const failed=[...best.failed].map(k=>{const[r,i]=k.split(':').map(Number);const[a,b]=C[r].intervals[i];return {r,from:a,to:b};});
 return {rows:best.rows.map((pieces,r)=>({index:r+1,pieces})),failed,stats:{minOffset:min,at,between,hard,ideal:ctx.ideal,min:ctx.min}};}

function note(stats){if(!stats||!Number.isFinite(stats.minOffset))return null;const m=Math.round(stats.minOffset*10)/10;
 if(m>=stats.ideal-.05)return 'Amarração: meia amarração em todas as juntas (defasagem ≥ '+String(Math.round(stats.ideal*10)/10).replace('.',',')+' cm).';
 return 'Amarração: menor defasagem '+String(m).replace('.',',')+' cm entre as fiadas '+stats.between.join(' / ')+' (x ≈ '+String(Math.round(stats.at)).replace('.',',')+' cm). Meta '+String(Math.round(stats.ideal*10)/10).replace('.',',')+' cm; mínimo aceito '+String(stats.min).replace('.',',')+' cm.'+(m<stats.min-.001?' Abaixo do mínimo — revisar.':'');}
root.WallSolver53={solve,rowJoints,rowEdges,note};
})(typeof globalThis!=='undefined'?globalThis:this);

// V54 — peças de encontro x aberturas próximas (portas/janelas a ~10–20 cm do encontro)
(function(root){
'use strict';
const N=Number;
root.fitOpenings53=function(fixed,cfg,ops,all,j,width,h,otherMarks=[]){
 const physHits=(x,len)=>ops.some(([a,b])=>Math.min(x+j/2+len,b)-Math.max(x+j/2,a)>.001);
 const sameSpan=(f,c)=>Math.abs(f.x-c[0])<.01&&Math.abs(f.x+f.length+j-c[1])<.01;
 const zones=cfg.cuts.filter(c=>!cfg.fixed.some(f=>sameSpan(f,c)));
 const edges=ops.flat(),minB=(root.BondRule53?.min?.()??10);
 const fam=[];for(const b of all){if(b.active===false||b.type==='Canaleta'||N(b.width)!==N(width)||N(b.height)!==N(h))continue;const L=N(b.length);if(L>0&&!fam.some(q=>Math.abs(q.L-L)<.01))fam.push({L,code:b.code});}
 fam.sort((a,b)=>b.L-a.L);let ok=true;const notes=[];
 // penalidade de amarração de uma junta em relação às juntas da fiada vizinha (bordas de vão não são juntas)
 const markPen=m=>{if(edges.some(e=>Math.abs(e-m)<.01)||m<=cfg.from+.01||m>=cfg.to-.01||!otherMarks.length)return 0;const d=Math.min(...otherMarks.map(o=>Math.abs(o-m)));return d<minB-.001?1000+(minB-d)*10:Math.max(0,20-d)*10;};
 for(const p of fixed.slice()){if(!physHits(p.x,N(p.length)))continue;const k=fixed.indexOf(p);
  if(!p.zone53){fixed.splice(k,1);notes.push('peça lateral '+p.code+' dispensada junto à abertura');continue;}
  const z=p.zone53,others=fixed.filter(q=>q!==p);let best=null,bestScore=Infinity;
  for(const f of fam){if(f.L<z[1]-z[0]-.01)continue;const lo=z[1]-f.L-j/2,hi=z[0]-j/2;if(hi<lo-1e-6)continue;
   const xs=p.end53===0?[hi]:p.end53===1?[lo]:[];if(!xs.length)for(let x=Math.ceil(lo*2)/2;x<=hi+1e-6;x+=.5)xs.push(x);
   for(const x of xs){if(physHits(x,f.L))continue;if(x<cfg.from-.01||x+f.L+j>cfg.to+.01)continue;if(others.some(o=>Math.min(o.x+N(o.length)+j,x+f.L+j)-Math.max(o.x,x)>.01))continue;
    // folga até a ombreira que não fecha com peça inteira também pesa
    const gapPen=ops.reduce((s,[a,b])=>{const g1=a-(x+f.L+j),g2=x-b;return s+((g1>.01&&g1<15)?300:0)+((g2>.01&&g2<15)?300:0);},0);
    const score=markPen(x)+markPen(x+f.L+j)+gapPen-f.L*.5+Math.abs(x-p.x)*.05;
    if(score<bestScore){bestScore=score;best={...p,x,length:f.L,code:f.code,adjusted53:true};}}}
  if(best){fixed[k]=best;if(best.code!==p.code||Math.abs(best.x-p.x)>.01)notes.push(p.code+' → '+best.code+' junto à abertura');}else ok=false;}
 return {ok,notes,cuts:[...fixed.map(f=>[f.x,f.x+N(f.length)+j]),...zones]};};
})(typeof globalThis!=='undefined'?globalThis:this);

(function(root){
'use strict';
function n(v){return Number(v);}
function roleOf(b,all){
 if(['Principal','Complementar','Encontro'].includes(b.role))return b.role;
 if(b.type==='Especial'||n(b.length)===54)return 'Encontro';
 if(n(b.length)===39)return 'Principal';if(n(b.length)===19)return 'Complementar';
 const family=all.filter(q=>q.type!=='Canaleta'&&q.type!=='Especial'&&n(q.length)!==54&&n(q.width)===n(b.width)&&n(q.height)===n(b.height));
 return n(b.length)===Math.max(...family.map(q=>n(q.length)))?'Principal':'Complementar';
}
function solve(length,blocks,joint,starter,forbidden=[]){
 const target=Math.round(length*10); if(target<1||target>500000)return null;
 const sizes=blocks.map(b=>Math.round((n(b.length)+joint)*10));
 const cost=new Float64Array(target+1).fill(Infinity),pick=new Int16Array(target+1).fill(-1),blocked=new Set(forbidden);
 const start=starter===undefined?0:sizes[starter];if(start>target||(start<target&&blocked.has(start)))return null;cost[start]=0;
 for(let t=start+1;t<=target;t++){if(t!==target&&blocked.has(t))continue;for(let i=0;i<sizes.length;i++){
 if(sizes[i]<=t-start){const penalty=roleOf(blocks[i],blocks)==='Principal'?1:target+2,newCost=cost[t-sizes[i]]+penalty;
 if(newCost<cost[t]){cost[t]=newCost;pick[t]=i;}}}}
 let t=target,seq=[];if(!Number.isFinite(cost[t]))return null;
 while(t>start){let i=pick[t];if(i<0)return null;seq.push(i);t-=sizes[i];}seq.reverse();if(starter!==undefined)seq.unshift(starter);
 return seq.map(i=>blocks[i]);
}
function joints(seq,j){let x=0,out=[];seq.forEach((b,i)=>{x+=n(b.length)+j;if(i<seq.length-1)out.push(Math.round(x*10));});return out;}
function pair(length,blocks,j){return root.V7Rules.pair(length,blocks,j,j,j);}
function suggest(length,blocks,joint){
 const main=blocks.filter(b=>roleOf(b,blocks)==='Principal'),out=[];
 for(const b of main){const module=n(b.length)+joint;
 for(const c of [null,...blocks.filter(q=>roleOf(q,blocks)==='Complementar')]){
 const used=c?n(c.length)+joint:0,count=Math.floor((length-used-joint)/module);
 if(count<0)continue;
 const physical=Math.round((length-used-count*module-joint)*10)/10;
 if(physical<=0||physical>n(b.length)||blocks.some(q=>Math.abs(n(q.length)-physical)<.01))continue;
 if(!out.some(s=>s.length===physical))out.push({length:physical,height:n(b.height),width:n(b.width),joint,base:count+' × '+b.code+(c?' + 1 × '+c.code:'')});
 }}
 return out.sort((a,b)=>a.length-b.length).slice(0,2);
}
function model(w,all,jh,jv,options={}){
 let errors=[],warn=[],rows=[],quant={};const L=n(w.length),H=n(w.height),T=n(w.width);
 const blocks=all.filter(b=>b.active!==false&&b.type!=='Canaleta'&&(roleOf(b,all)!=='Encontro'||options.useMeetingComplements)&&n(b.width)===T&&n(b.length)>0&&n(b.height)>0).map(b=>options.useMeetingComplements&&roleOf(b,all)==='Encontro'?{...b,role:'Complementar'}:b);
 if(![L,H,T,jh,jv].every(Number.isFinite)||L<=0||H<=0||T<=0||jh<0||jv<0)return {errors:['Dimensões ou juntas inválidas.'],warnings:[],rows:[],quant:{}};
 if(options.flex&&(!Number.isFinite(options.min)||!Number.isFinite(options.max)||options.min<=0||options.max<options.min))return {errors:['Confira os limites de junta: mínimo positivo e máximo maior ou igual ao mínimo.'],warnings:[],rows:[],quant:{}};
 if([L,H,T,jh,jv].some(v=>Math.abs(v*10-Math.round(v*10))>.001))return {errors:['Use dimensões e juntas com precisão de 0,1 cm.'],warnings:[],rows:[],quant:{}};
 if(L>5000||H>4000)return {errors:['Limite desta versão: 50 m de comprimento e 40 m de altura.'],warnings:[],rows:[],quant:{}};
 if(!blocks.length)return {errors:['Cadastre blocos ativos com a espessura desta parede.'],warnings:[],rows:[],quant:{}};
 if(new Set(blocks.map(b=>n(b.height))).size!==1)return {errors:['Selecione uma família de blocos com a mesma altura.'],warnings:[],rows:[],quant:{}};
 const step=n(blocks[0].height)+jv, courses=Math.floor((H+.01)/step);
 if(courses<1)errors.push('Altura não fecha no módulo vertical. Ajuste a altura ou cadastre a peça adequada.');
 if(courses<1||courses>200)errors.push('Número de fiadas fora do intervalo de 1 a 200.');
 const openings=(w.openings||[]).map(o=>({start:n(o.start),width:n(o.width),bottom:n(o.bottom),height:n(o.height)})).sort((a,b)=>a.start-b.start);
 openings.forEach((o,i)=>{
 if(!Object.values(o).every(Number.isFinite)||o.start<0||o.width<=0||o.height<=0||o.bottom<0||o.start+o.width>L+.01||o.bottom+o.height>H+.01)errors.push('Abertura '+(i+1)+': dimensões inválidas ou fora da parede.');
 if(Math.abs(o.bottom/step-Math.round(o.bottom/step))>.001||Math.abs((o.bottom+o.height)/step-Math.round((o.bottom+o.height)/step))>.001)errors.push('Abertura '+(i+1)+': peitoril e topo precisam coincidir com limites de fiadas.');
 for(let k=0;k<i;k++){const p=openings[k];if(o.start<p.start+p.width&&o.start+o.width>p.start&&o.bottom<p.bottom+p.height&&o.bottom+o.height>p.bottom)errors.push('Aberturas sobrepostas.');}
 });
 if(errors.length)return {errors:[...new Set(errors)],warnings:[],rows:[],quant:{}};
 const suggestions=[],courseSpecs=[];
 for(let r=0;r<courses;r++){
 const gaps=openings.filter(o=>o.bottom<((r+1)*step)-.01&&o.bottom+o.height>r*step+.01);let cursor=0,segments=[];
 for(const gap of gaps){if(gap.start>cursor+.01)segments.push([cursor,gap.start]);cursor=Math.max(cursor,gap.start+gap.width);}if(cursor<L-.01)segments.push([cursor,L]);
 courseSpecs.push({fixed:[],intervals:segments,y:r*step});
 }
 const solved=root.WallSolver53.solve({courses:courseSpecs,blocks,all,j:jh,flex:options.flex?{min:options.min,max:options.max}:null,h:n(blocks[0].height),width:T,L,variant:options.variant});
 for(const f of solved.failed){errors.push('Fiada '+(f.r+1)+', trecho '+f.from.toFixed(2)+'–'+f.to.toFixed(2)+' cm: não fecha com as peças, juntas e cortes permitidos.');const j=options.flex?Math.min(options.max,Math.max(options.min,jh)):jh;for(const s of suggest(f.to-f.from,blocks,j))if(!suggestions.some(q=>q.length===s.length&&q.from===f.from))suggestions.push({...s,from:f.from,to:f.to});}
 for(const row of solved.rows){row.pieces.forEach(p=>{if(!p.fill)quant[p.code]=(quant[p.code]||0)+1;});rows.push(row);}
 const bondNote=root.WallSolver53.note(solved.stats);if(bondNote)warn.push(bondNote);
 const bondError=root.V7Rules.audit(rows);if(bondError)errors.push(bondError);
 if(openings.length)warn.push('Vergas, contravergas, canaletas e reforços das aberturas ainda não estão definidos; o quantitativo considera peças comuns nas demais áreas.');
  const applied=rows.flatMap(r=>r.pieces.filter(p=>!p.fill).map(p=>p.joint));const bondStats53=solved.stats;if(applied.some(j=>Math.abs(j-jh)>.0001))warn.push('Comprimento preservado por distribuição das juntas dentro dos limites informados. Conferir os valores aplicados e as peças pequenas com o fabricante e o projeto executivo.');
 warn.push('Extremidades e encontros em L, T ou cruzamento precisam de revisão conjunta.');
 if(errors.length)return {errors:[...new Set(errors)],warnings:[...new Set(warn)],suggestions,rows:[],quant:{}};
 return {errors:[],warnings:[...new Set(warn)],rows,quant,bondStats:bondStats53,step,L,H,jh,jv,jointMin:Math.min(...applied),jointMax:Math.max(...applied)};
}
root.ModEngine={solve,pair,model,roleOf,suggest};
if(typeof module!=='undefined')module.exports=root.ModEngine;
})(typeof globalThis!=='undefined'?globalThis:this);


(function(root){
const small=b=>Math.abs(Number(b.length)-5)<.01;
function runOK(seq){let run=0;for(const b of seq){run=small(b)?run+1:0;if(run>3)return false;}return true;}
function rank(seq,j,nominal){
 const principal=seq.filter(b=>root.ModEngine.roleOf(b,seq)==='Principal').length;
 const fills=seq.filter(small).length+seq.filter(b=>b.fill).length*2;
 const complements=seq.filter(b=>!b.fill&&root.ModEngine.roleOf(b,seq)!=='Principal').length;
 const cuts=seq.filter(b=>b.cut).length;
 // V50: ainda favorece o bloco principal, mas sem esmagar soluções de melhor amarração.
 return -principal*10000+fills*900+complements*80+cuts*350+Math.abs(j-nominal)*120;
}
const candidateCache=new Map();let fillLimit=4;
function candidates(L,blocks,nominal,min,max){
 const fillMax=max>min?fillLimit:0,key=JSON.stringify([L,blocks,nominal,min,max,fillMax,requestedVariant,root.cutOptions23,'V50']);if(candidateCache.has(key))return candidateCache.get(key);
 if(L<.01)return [{seq:[],joint:nominal,score:0}];
 const mains=blocks.filter(b=>root.ModEngine.roleOf(b,blocks)==='Principal'),comps=blocks.filter(b=>root.ModEngine.roleOf(b,blocks)==='Complementar').sort((a,b)=>Number(b.length)-Number(a.length)),out=[],seen=new Set();
 // V50: testa a junta nominal e também a faixa permitida em passos de 0,1 cm.
 const joints=[];const addJoint=v=>{v=Math.round(Number(v)*10)/10;if(Number.isFinite(v)&&v>=min-1e-6&&v<=max+1e-6&&!joints.some(q=>Math.abs(q-v)<1e-6))joints.push(v);};
 addJoint(nominal);for(let v=Math.ceil(min*10)/10;v<=max+1e-6;v+=.1)addJoint(v);joints.sort((a,b)=>Math.abs(a-nominal)-Math.abs(b-nominal));
 const add=(seq,j,extra)=>{if(!runOK(seq))return;const id=j.toFixed(2)+'|'+seq.map(b=>b.code+':'+Number(b.length).toFixed(3)+(b.fill?':F':'')).join('|');if(seen.has(id))return;seen.add(id);out.push({seq,joint:j,score:rank(seq,j,nominal)+extra*30});};
 for(const j of joints)for(const main of mains){const limit=Math.floor((L+(root.cutOptions23?.enabled?root.cutOptions23.max:0))/(Number(main.length)+j));for(let count=limit;count>=Math.max(0,limit-6);count--){
  function build(items,index){const base=count*(Number(main.length)+j)+items.reduce((n,q)=>n+Number(q.length)+j,0),extra=L-base;
   if(extra>=-1e-6&&extra<=fillMax+1e-6&&count+items.length){const perms=[];function perm(a,left){if(perms.length>=24)return;if(!left.length){perms.push(a);return;}const used=new Set();for(let z=0;z<left.length;z++){const u=left[z].code+':'+left[z].length;if(used.has(u))continue;used.add(u);perm([...a,left[z]],[...left.slice(0,z),...left.slice(z+1)]);}}perm([],items);
    for(const p of perms){const slots=[0,Math.floor(p.length/2),p.length];for(const split of [...new Set(slots)]){const seq=[...p.slice(0,split),...Array(count).fill(main),...p.slice(split)];if(extra<1e-6)add(seq,j,0);else for(const at of [...new Set([0,Math.floor(seq.length/2),seq.length])]){const g={code:'FILETE',length:extra,height:Number(main.height),width:Number(main.width),fill:true,role:'Fechamento'};add([...seq.slice(0,at),g,...seq.slice(at)],j,extra);}}}}
   if(root.cutOptions23?.enabled&&main.code==='B39'&&count>0&&extra<-.001&&extra>=-root.cutOptions23.max-.001){const length=Math.round((39+extra)*10000)/10000;if(length>=29){const cut={...main,code:'B39_C'+length.toFixed(2),length,cut:true,sourceCode:'B39',sourceLength:39,cutAmount:39-length};for(const at of [...new Set([0,Math.floor((count-1)/2),count-1])]){const seq=[...items,...Array(count).fill(main)];seq[items.length+at]=cut;add(seq,j,0);add(seq.slice().reverse(),j,0);}}}
   if(items.length>=5||base>L+Math.max(fillMax,root.cutOptions23?.max||0)+1e-6||out.length>12000)return;for(let z=index;z<comps.length;z++)build([...items,comps[z]],z);
  }
  build([],0);
 }}
 const sorted=out.sort((a,b)=>a.score-b.score),groups=new Map();for(const c of sorted){const count=c.seq.filter(b=>root.ModEngine.roleOf(b,c.seq)==='Principal').length,signature=c.seq.map(b=>b.code+':'+b.length).sort().join('|');const groupKey=count+'@'+c.joint.toFixed(1);if(!groups.has(groupKey))groups.set(groupKey,new Map());const g=groups.get(groupKey),set=g.get(signature)||[];if(set.length<18)set.push(c);g.set(signature,set);}
 const result=[];for(const g of groups.values()){const sets=[...g.values()],offset=(requestedVariant*5)%Math.max(1,sets.length),ordered=[...sets.slice(offset),...sets.slice(0,offset)];for(const set of ordered.slice(0,24)){const k=requestedVariant%set.length;result.push(set[k]);if(set.length>1)result.push(set[(k+1)%set.length]);if(set.length>2)result.push(set[(k+2)%set.length]);}}
 result.sort((a,b)=>a.score-b.score);result.splice(240);
 if(candidateCache.size>2000)candidateCache.clear();candidateCache.set(key,result);return result;
}
function joints(seq,j){let x=0,out=[];for(let i=0;i<seq.length;i++){x+=Number(seq[i].length)+(seq[i].fill?0:j);if(i<seq.length-1)out.push({x:x-j/2,min:Math.max(Number(seq[i].length),Number(seq[i+1].length))/2});}return out;}
function compatible(a,ja,b,jb){let x=0;const row=(seq,j)=>{x=0;return seq.map(b=>{const p={...b,length:Number(b.length),x,joint:b.fill?0:j};x+=p.length+p.joint;return p;});};return !audit([{index:1,pieces:row(a,ja)},{index:2,pieces:row(b,jb)}]);}
let requestedVariant=0;

// V25: half-module preference over a bounded set; existing admissibility rules stay in force.
let bondJointCache22=new WeakMap(),bondPairCache22=new Map();
function bondJoints22(pieces){let cached=bondJointCache22.get(pieces);if(cached)return cached;const ps=pieces.filter(p=>!p.fill&&!p.channel).slice().sort((a,b)=>a.x-b.x),out=[];for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i],end=Number(a.x)+Number(a.joint||0)/2+Number(a.length),start=Number(b.x)+Number(b.joint||0)/2,gap=start-end;if(gap>0&&gap<=6.01)out.push({x:(end+start)/2,target:(Math.max(Number(a.length),Number(b.length))+Number(b.joint||0))/2,min:Math.max(Number(a.length),Number(b.length))/2});}out.key=out.map(p=>[p.x,p.target,p.min].join(",")).join(";");bondJointCache22.set(pieces,out);return out;}
function bondMetric22(a,b){const aa=bondJoints22(a),bb=bondJoints22(b),key=aa.key+"|"+bb.key;if(bondPairCache22.has(key))return bondPairCache22.get(key);let sum=0,count=0,valid=true;const scan=(xs,ys)=>{if(!ys.length)return;let at=0;for(const p of xs){while(at+1<ys.length&&Math.abs(ys[at+1].x-p.x)<Math.abs(ys[at].x-p.x))at++;const q=ys[at],distance=Math.abs(p.x-q.x);if(distance<root.BondRule53.min()-.001)valid=false;sum+=Math.max(0,1-distance/Math.max(.001,p.target));count++;}};scan(aa,bb);scan(bb,aa);const result={valid,penalty:count?sum/count:0};if(bondPairCache22.size>20000)bondPairCache22.clear();bondPairCache22.set(key,result);return result;}

function pair(L,blocks,nominal,min,max){const cs=candidates(L,blocks,nominal,min,max);let best=null,bestPenalty=Infinity,score=Infinity,alternatives=[];
 const layouts=cs.map(c=>{let x=0;return c.seq.map(b=>{const p={...b,x,length:Number(b.length),joint:b.fill?0:c.joint};x+=p.length+p.joint;return p;});});
 for(let ai=0;ai<cs.length;ai++)for(let bi=0;bi<cs.length;bi++){const a=cs[ai],b=cs[bi],metric=bondMetric22(layouts[ai],layouts[bi]);if(!metric.valid)continue;const penalty=Math.round(metric.penalty*1e6),cost=a.score+b.score;if(!requestedVariant&&(penalty>bestPenalty||penalty===bestPenalty&&cost>=score))continue;
 const result={a:a.seq,b:b.seq,ja:a.joint,jb:b.joint,aligned:0,flexible:true};if(!requestedVariant&&penalty===0)return result;if(requestedVariant)alternatives.push({...result,score:cost,penalty});if(penalty<bestPenalty||penalty===bestPenalty&&cost<score){best=result;bestPenalty=penalty;score=cost;}}
 if(requestedVariant&&alternatives.length){alternatives.sort((a,b)=>a.penalty-b.penalty||a.score-b.score);best=alternatives[requestedVariant%Math.min(12,alternatives.length)];}
 return best||{error:'A busca limitada não encontrou arranjo com amarração admissível. Revise o comprimento, as juntas ou as peças disponíveis.'};}
function audit(rows){for(const row of rows){let run=0,previous=null;for(const p of row.pieces.filter(p=>!p.fill&&!p.channel).slice().sort((a,b)=>a.x-b.x)){const contiguous=previous&&Math.abs(p.x-previous.x-previous.length-previous.joint)<.01;run=small(p)?(contiguous?run+1:1):0;if(run>3)return 'Mais de 3 filetes consecutivos na fiada '+row.index+'.';previous=p;}}
 for(let r=1;r<rows.length;r++){const get=row=>row.pieces.filter(p=>!p.fill&&!p.channel).slice().sort((a,b)=>a.x-b.x).flatMap((q,i,ps)=>{if(!i)return [];const p=ps[i-1],end=p.x+p.joint/2+p.length,start=q.x+q.joint/2;return start-end>0&&start-end<=6.01?[{x:(start+end)/2,min:Math.max(p.length,q.length)/2}]:[];});const previousJoints=get(rows[r-1]),nextJoints=get(rows[r]);if(previousJoints.some(p=>nextJoints.some(q=>Math.abs(p.x-q.x)<root.BondRule53.min()-.001)))return 'Amarração insuficiente entre as fiadas '+r+' e '+(r+1)+'.';}return null;}
root.V7Rules={candidates,pair,runOK,audit,bondMetric:bondMetric22,configure:(max,variant=0)=>{fillLimit=max;root.fillMax53=max;root.variant53=variant;requestedVariant=variant;candidateCache.clear();bondJointCache22=new WeakMap();bondPairCache22.clear();},clear:()=>candidateCache.clear()};
})(globalThis);
(function(root){
function rich(seq,j){let x=0,out=[];for(let i=0;i<seq.length;i++){x+=Number(seq[i].length)+(seq[i].fill?0:j);if(i<seq.length-1)out.push({x,min:Math.min(Number(seq[i].length),Number(seq[i+1].length))/2});}return out;}
function compatible(a,ja,b,jb){let x=rich(a,ja),y=rich(b,jb);return !x.some(p=>y.some(q=>Math.abs(p.x-q.x)<root.BondRule53.min()-.0001));}
function flexPair(L,blocks,nominal,min,max){return root.V7Rules.pair(L,blocks,nominal,min,max);}
root.FlexEngine={pair:flexPair,rich,compatible};
})(typeof globalThis!=='undefined'?globalThis:this);

(function(root){
function mul(a,b){return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];}
function extract(ops,viewport,OPS){let ctm=[1,0,0,1,0,0],stack=[],points=[],edges=[],seen=new Set();
function point(x,y){const m=mul(viewport.transform,ctm),p={x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5]};const key=p.x.toFixed(2)+','+p.y.toFixed(2);if(!seen.has(key)&&points.length<20000){seen.add(key);points.push(p);}return p;}
for(let z=0;z<ops.fnArray.length;z++){const op=ops.fnArray[z],args=ops.argsArray[z];if(op===OPS.save)stack.push(ctm.slice());else if(op===OPS.restore)ctm=stack.pop()||[1,0,0,1,0,0];else if(op===OPS.transform)ctm=mul(ctm,args);else if(op===OPS.constructPath&&typeof args[0]==='number'&&Array.isArray(args[1]))for(const packed of args[1]){let prev=null,start=null;for(let i=0;i<packed.length;){const cmd=packed[i++];if(cmd===0||cmd===1){const p=point(packed[i++],packed[i++]);if(cmd===0)start=p;else if(prev)edges.push([prev,p]);prev=p;}else if(cmd===2){i+=4;prev=point(packed[i++],packed[i++]);}else if(cmd===3){i+=2;prev=point(packed[i++],packed[i++]);}else if(cmd===4){if(prev&&start)edges.push([prev,start]);prev=start;}else break;}}}
const horizontal=edges.filter(([a,b])=>Math.abs(a.y-b.y)<.1).slice(0,2000),vertical=edges.filter(([a,b])=>Math.abs(a.x-b.x)<.1).slice(0,2000);
for(const [a,b]of horizontal)for(const [c,d]of vertical){const x=c.x,y=a.y;if(x>=Math.min(a.x,b.x)-.1&&x<=Math.max(a.x,b.x)+.1&&y>=Math.min(c.y,d.y)-.1&&y<=Math.max(c.y,d.y)+.1){const key=x.toFixed(2)+','+y.toFixed(2);if(!seen.has(key)&&points.length<20000){seen.add(key);points.push({x,y});}}}
return points;
}
function nearest(p,points,tolerance){let best=null,d=tolerance;for(const q of points){const v=Math.hypot(q.x-p.x,q.y-p.y);if(v<=d){best=q;d=v;}}return best;}
function order(walls){
 const placed=w=>Array.isArray(w.line)&&w.line.length===2&&w.line.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
 const key=w=>{const [a,b]=w.line,horizontal=Math.abs(b.x-a.x)>=Math.abs(b.y-a.y);return {group:horizontal?0:1,primary:horizontal?(a.y+b.y)/2:(a.x+b.x)/2,secondary:horizontal?Math.min(a.x,b.x):Math.min(a.y,b.y)};};
 return walls.map((w,i)=>({w,i})).sort((a,b)=>{
 const pa=placed(a.w),pb=placed(b.w);if(!pa||!pb)return pa?-1:pb?1:a.i-b.i;
 const ka=key(a.w),kb=key(b.w);
 return (Number(a.w.page)||1)-(Number(b.w.page)||1)||ka.group-kb.group||ka.primary-kb.primary||ka.secondary-kb.secondary||a.i-b.i;
 }).map(v=>v.w);
}
root.SnapEngine={extract,nearest,order};
})(typeof globalThis!=='undefined'?globalThis:this);

(function(root){
function intersects(a,b){for(const poly of [a,b])for(let i=0;i<2;i++){const p=poly[i],q=poly[i+1],nx=-(q.y-p.y),ny=q.x-p.x,va=a.map(r=>r.x*nx+r.y*ny),vb=b.map(r=>r.x*nx+r.y*ny);if(Math.min(...va)>=Math.max(...vb)-1e-6||Math.min(...vb)>=Math.max(...va)-1e-6)return false;}return true;}
function labels(walls,page,bounds){const located=walls.map((w,i)=>{if(!w.line||Number(w.page||1)!==Number(page))return null;const[a,b]=w.line,d=Math.hypot(b.x-a.x,b.y-a.y);if(!d)return null;const u={x:(b.x-a.x)/d,y:(b.y-a.y)/d},half=Number(w.width)*d/Number(w.length)/2,at=(x,t)=>({x:a.x+u.x*x-u.y*t,y:a.y+u.y*x+u.x*t});return {i,a,b,d,u,half,at,polygon:[at(0,-half-3),at(d,-half-3),at(d,half+3),at(0,half+3)]};}).filter(Boolean),accepted=[],out=[];
for(const w of located){const text='Parede '+(w.i+1),width=text.length*8+8,height=24;let chosen;
search: for(let extra=0;extra<=220;extra+=20)for(const fraction of [.5,.35,.65,.2,.8])for(const side of [1,-1]){const center=w.at(w.d*fraction,side*(w.half+height/2+8+extra)),box=rectangle(center,w.u,width,height);if(bounds&&box.some(p=>p.x<8||p.y<8||p.x>bounds.width-8||p.y>bounds.height-8))continue;if(located.some(q=>intersects(box,q.polygon))||accepted.some(q=>intersects(box,q)))continue;chosen={wall:w.i+1,x:center.x,y:center.y,angle:Math.atan2(w.u.y,w.u.x)*180/Math.PI,box};break search;}
if(!chosen){const maxX=Math.max(...located.flatMap(q=>q.polygon.map(p=>p.x))),maxY=Math.max(...located.flatMap(q=>q.polygon.map(p=>p.y)));let c={x:(w.a.x+w.b.x)/2,y:(w.a.y+w.b.y)/2},box;for(let extra=40;;extra+=30){if(Math.abs(w.u.x)>=Math.abs(w.u.y))c.y=maxY+extra;else c.x=maxX+extra;box=rectangle(c,w.u,width,height);if(!located.some(q=>intersects(box,q.polygon))&&!accepted.some(q=>intersects(box,q)))break;}chosen={wall:w.i+1,x:c.x,y:c.y,angle:Math.atan2(w.u.y,w.u.x)*180/Math.PI,box,outside:true};}accepted.push(chosen.box);out.push(chosen);
}return out;}
function rectangle(c,u,W,H){return [[-W/2,-H/2],[W/2,-H/2],[W/2,H/2],[-W/2,H/2]].map(([s,t])=>({x:c.x+u.x*s-u.y*t,y:c.y+u.y*s+u.x*t}));}
function geometry(walls,results,page,course){
 const pieces=[],omitted=[];
 walls.forEach((w,i)=>{if(!w.line||Number(w.page||1)!==Number(page)){if(!w.line)omitted.push(i+1);return;}
 const [a,b]=w.line,dist=Math.hypot(b.x-a.x,b.y-a.y),L=Number(w.length),m=results[i];
 if(!(dist>0&&L>0)){omitted.push(i+1);return;}
 const ux=(b.x-a.x)/dist,uy=(b.y-a.y)/dist,k=Number(w.planScale)||dist/L,half=Number(w.width)*k/2;
 if(!m||m.errors.length||!m.rows[course]){omitted.push(i+1);return;}
 for(const [pieceIndex,p] of m.rows[course].pieces.entries()){const start=(p.x+p.joint/2)*k,end=start+p.length*k;
 const at=(s,t)=>({x:a.x+ux*s-uy*t,y:a.y+uy*s+ux*t});
 const polygon=[at(start,-half),at(end,-half),at(end,half),at(start,half)];
 pieces.push({pieceIndex,course,wall:i+1,cut:p.cut,sourceCode:p.sourceCode,code:p.code,conflict:!!p.draftConflict,polygon,center:at((start+end)/2,0),length:p.length,width:Number(w.width),angle:Math.atan2(uy,ux)*180/Math.PI,displayLength:p.length*k,displayWidth:half*2});
 }});
 const bounds=p=>({x0:Math.min(...p.polygon.map(q=>q.x)),x1:Math.max(...p.polygon.map(q=>q.x)),y0:Math.min(...p.polygon.map(q=>q.y)),y1:Math.max(...p.polygon.map(q=>q.y))});
 function intersect(a,b){for(const poly of [a.polygon,b.polygon])for(let i=0;i<2;i++){const p=poly[i],q=poly[i+1],nx=-(q.y-p.y),ny=q.x-p.x,project=r=>r.x*nx+r.y*ny,va=a.polygon.map(project),vb=b.polygon.map(project);if(Math.min(...va)>=Math.max(...vb)-1e-6||Math.min(...vb)>=Math.max(...va)-1e-6)return false;}return true;}
 const grid=new Map(),tested=new Set(),pairs=new Set();
 pieces.forEach((p,i)=>{const box=bounds(p),x0=Math.floor(box.x0/64),x1=Math.floor(box.x1/64),y0=Math.floor(box.y0/64),y1=Math.floor(box.y1/64);for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){const key=x+','+y,bucket=grid.get(key)||[];for(const j of bucket){const q=pieces[j],id=j+','+i;if(q.wall===p.wall||tested.has(id))continue;tested.add(id);if(intersect(p,q)){p.conflict=q.conflict=true;pairs.add([p.wall,q.wall].sort((a,b)=>a-b).join(' × '));}}bucket.push(i);grid.set(key,bucket);}});
 return {pieces,labels:labels(walls,page),omitted,pairs:[...pairs]};
}
root.PlanEngine={geometry,labels,intersects,rectangle};if(typeof module!=='undefined')module.exports=root.PlanEngine;
})(typeof globalThis!=='undefined'?globalThis:this);

(function(root){
const N=Number,E=()=>root.ModEngine;
function detect(walls){const located=walls.map((w,i)=>{if(!w.line||w.line.length!==2)return null;const[a,b]=w.line,len=Math.hypot(b.x-a.x,b.y-a.y),k=N(w.planScale)||len/N(w.length);if(!(len>0&&k>0))return null;return {w,i,a,b,k,u:{x:(b.x-a.x)/len,y:(b.y-a.y)/len}};}).filter(Boolean),out=[];
for(let i=0;i<located.length;i++)for(let j=i+1;j<located.length;j++){const a=located[i],b=located[j];if(N(a.w.page||1)!==N(b.w.page||1))continue;if(Math.abs(a.u.x*b.u.x+a.u.y*b.u.y)>.005)continue;
const vx=b.a.x-a.a.x,vy=b.a.y-a.a.y,cross=a.u.x*b.u.y-a.u.y*b.u.x,ta=(vx*b.u.y-vy*b.u.x)/cross/a.k,tb=(vx*a.u.y-vy*a.u.x)/cross/b.k;
// V109 — a ponta que fica DENTRO do corpo da outra parede (até meia espessura + 0,5 cm) também é encontro.
// Antes só valia até 1,1 cm: uma parede desenhada 3 cm curta ou longa (comum em planta importada)
// ficava sem encontro, os blocos das duas se sobrepunham e a amarração dos cantos se perdia (vãos nas fiadas).
const tolA=Math.max(1.1,N(b.w.width)/2+.5),tolB=Math.max(1.1,N(a.w.width)/2+.5);
if(ta<-tolA||tb<-tolB||ta>N(a.w.length)+tolA||tb>N(b.w.length)+tolB)continue;
const end=(t,L,tol)=>Math.abs(t)<=tol?0:Math.abs(t-L)<=tol?1:-1,ae=end(ta,N(a.w.length),tolA),be=end(tb,N(b.w.length),tolB);
out.push({a,b,ta:ae===0?0:ae===1?N(a.w.length):ta,tb:be===0?0:be===1?N(b.w.length):tb,ae,be,type:ae>=0&&be>=0?'L':ae>=0||be>=0?'T':'X',id:'Parede '+(a.i+1)+' × Parede '+(b.i+1)});
}return out;}
function candidates(L,blocks,j,min,max,flex){return root.V7Rules.candidates(L,blocks,j,flex?min:j,flex?max:j);}
function subtract(segments,cuts){let out=segments;for(const[a,b]of cuts){const next=[];for(const[x,y]of out){if(b<=x||a>=y)next.push([x,y]);else {if(a>x+.001)next.push([x,a]);if(b<y-.001)next.push([b,y]);}}out=next;}return out;}
let compatibilityRows=new WeakMap();
function compatible(a,b,strict=false){const joints=row=>{let cached=compatibilityRows.get(row);if(!cached){const sorted=row.slice().sort((a,b)=>a.x-b.x);cached=[];for(let i=1;i<sorted.length;i++){const p=sorted[i-1],q=sorted[i],end=p.x+p.joint/2+p.length,start=q.x+q.joint/2,gap=start-end;if(gap>0&&gap<=6)cached.push({x:(end+start)/2,strict:root.BondRule53.min(),loose:Math.min(root.BondRule53.min(),Math.max(1,Math.min(p.length,q.length)/4))});}compatibilityRows.set(row,cached);}return cached;};const aa=joints(a),bb=joints(b),field=strict?'strict':'loose';for(const p of aa){for(const q of bb){if(Math.abs(p.x-q.x)<Math.max(p[field],q[field])-.001)return false;}}return true;}
function courseLayoutKey(pieces){return pieces.slice().sort((a,b)=>a.x-b.x).map(p=>[p.code,p.x,p.length,p.joint,p.fill]).join(';');}

function layouts(walls,all,j,options={}){const qs=detect(walls),configs=new Map(),fail=[];for(let i=0;i<walls.length;i++)configs.set(i,[0,1].map(()=>({from:0,to:N(walls[i].length),cuts:[],fixed:[]})));
for(const q of qs){const {a,b}=q;if(!a.w.confirmed||!b.w.confirmed){fail.push(q.id+': confira as paredes.');continue;}
if(Math.abs(a.k/b.k-1)>.005||N(a.w.width)!==N(b.w.width)||!D87.hok(a.w,b.w)){fail.push(q.id+': confira '+(Math.abs(a.k/b.k-1)>.005?'a escala da marcação; ':'')+(N(a.w.width)!==N(b.w.width)?'espessuras '+N(a.w.width)+' / '+N(b.w.width)+' cm; ':'')+(N(a.w.height)!==N(b.w.height)?'alturas '+N(a.w.height)+' / '+N(b.w.height)+' cm.':''));continue;}
const family=all.filter(p=>p.active!==false&&p.type!=='Canaleta'&&N(p.width)===N(a.w.width)),height=family.filter(p=>E().roleOf(p,all)==='Principal').map(p=>N(p.height));if(!height.length){fail.push(q.id+': falta bloco principal.');continue;}
const h=height[0],primary=family.filter(p=>N(p.height)===h&&E().roleOf(p,all)==='Principal').sort((a,b)=>N(b.length)-N(a.length))[0],meet=family.filter(p=>N(p.height)===h&&E().roleOf(p,all)==='Encontro'),half=N(a.w.width)/2,expectedL=(N(primary.length)+j)/2+N(a.w.width),expectedT=N(primary.length)+N(a.w.width)+j;
const choices=(kind,target)=>family.filter(p=>N(p.height)===h&&Math.abs(N(p.length)-target)<.01&&(!p.meeting||p.meeting==='Auto'||p.meeting===kind)).sort((x,y)=>String(x.code).localeCompare(String(y.code)));
// V50 — encontros primeiro. Para a família clássica 14/39 com junta de 1 cm,
// usa como referência os arranjos de amarração fornecidos pelo projetista:
// canto L alterna B29/B44; T reserva B29 no ramo e admite B54/B44 no atravessamento.
// Fora desta família, permanece a regra geométrica genérica já existente.
const b29=family.find(p=>N(p.height)===h&&Math.abs(N(p.length)-29)<.01),
      b39=family.find(p=>N(p.height)===h&&Math.abs(N(p.length)-39)<.01),
      b44=family.find(p=>N(p.height)===h&&Math.abs(N(p.length)-44)<.01),
      b54=family.find(p=>N(p.height)===h&&Math.abs(N(p.length)-54)<.01),
      canonical14=Math.abs(N(primary.length)-39)<.01&&Math.abs(N(a.w.width)-14)<.01&&Math.abs(j-1)<.01;
const ls=choices('L',expectedL),ts=choices('T',expectedT),
      l=ls[(options.lChoice||0)%Math.max(1,ls.length)],
      alternate44=q.type==='T'&&canonical14?b44:null,
      t=canonical14&&b54?b54:(alternate44&&((options.variant||0)%4>=2||!ts.length)?alternate44:ts[(options.tChoice||0)%Math.max(1,ts.length)]),
      t29=b29,tTemplate=q.type==='T'&&canonical14&&t29&&t,
      lTemplate=q.type==='L'&&canonical14&&b29&&b44,
      xTemplate=q.type==='X'&&canonical14&&(b44||b54);
if((q.type==='L'&&!l&&!lTemplate)||(q.type==='T'&&!(tTemplate||(l&&t)))||(q.type==='X'&&!t&&!xTemplate)){fail.push(q.id+': cadastre peças de encontro compatíveis. Referência desta família: L com alternância 29/44 cm; T com 29 cm no ramo e peça contínua 54/44 cm no atravessamento. Fora da família 14/39, confira o catálogo do fabricante.');continue;}

for(let r=0;r<2;r++){let lockedCarrier=null,lockedPiece=null;for(const side of[a,b]){const at=side===a?q.ta:q.tb,old=options.stableModels?.[side.i]?.rows?.[r]?.pieces?.find(p=>p.junction===q.id&&p.x+p.joint/2<=at-half+.01&&p.x+p.joint/2+p.length>=at+half-.01);if(old){lockedCarrier=side;lockedPiece=old;break;}}let carrier;if(q.type==='T'){const through=q.ae<0?a:b;carrier=(r+(options.phase||0))%2===0?(through===a?b:a):through;}else {const horiz=Math.abs(a.u.x)>Math.abs(a.u.y)?a:b;carrier=(r+(options.phase||0))%2===0?horiz:(horiz===a?b:a);}
if(lockedCarrier)carrier=lockedCarrier;const other=carrier===a?b:a,position=carrier===a?q.ta:q.tb,ep=carrier===a?q.ae:q.be,op=other===a?q.ta:q.tb,oep=other===a?q.ae:q.be;
let piece;
if(q.type==='L'&&lTemplate)piece=(r+(options.phase||0))%2===0?b29:b44;
else if(q.type==='T'&&tTemplate&&ep>=0)piece=t29;
else if(q.type==='X'&&xTemplate)piece=b54||b44;
else piece=ep>=0?l:t;
const c=configs.get(carrier.i)[r],oc=configs.get(other.i)[r];
let start;if(ep===0){start=-half;c.from=-half-j/2;}else if(ep===1){start=N(carrier.w.length)+half-N(piece.length);c.to=N(carrier.w.length)+half+j/2;}else start=position-N(piece.length)/2+(options.offset||0)*(N(primary.length)+j)/4;(c.car87??={})[q.id]={ep,from:ep===0?c.from:null,to:ep===1?c.to:null,half,j};
if(lockedPiece)start=lockedPiece.x+lockedPiece.joint/2;const fixed={code:piece.code,x:start-j/2,length:N(piece.length),height:h,width:N(carrier.w.width),joint:j,meeting:true,junction:q.id,span:ep<0&&!lockedPiece?[position-half,position+half]:null,zone53:ep===0?[-half,half]:ep===1?[N(carrier.w.length)-half,N(carrier.w.length)+half]:[position-half,position+half],end53:ep};c.fixed.push(fixed);c.cuts.push([fixed.x,fixed.x+fixed.length+j]);
if(oep===0)oc.from=half+j/2;else if(oep===1)oc.to=N(other.w.length)-half-j/2;else {oc.cuts.push([op-half-j/2,op+half+j/2]);}(oc.oth87??={})[q.id]={oep,cut:oep<0?[op-half-j/2,op+half+j/2]:null,half,j};
if(tTemplate){const add=(cfg,block,x,width)=>{const p={code:block.code,x,length:N(block.length),height:h,width,joint:j,meeting:true,junction:q.id,tTemplate:true};cfg.fixed.push(p);cfg.cuts.push([x,x+p.length+j]);};if(ep>=0){add(oc,t29,op-half-j/2-N(t29.length)-j,N(other.w.width));add(oc,t29,op+half+j/2,N(other.w.width));}else{const companion=N(t.length)===44?t29:primary;add(oc,companion,oep===0?oc.from:oc.to-N(companion.length)-j,N(other.w.width));}}

}}

// V53: encontros próximos — vãos entre peças fixas que nenhuma combinação de peças inteiras fecha.
{const closableCache=new Map();
 for(const[i,pair]of configs){const w=walls[i],fam=all.filter(b=>b.active!==false&&b.type!=='Canaleta'&&N(b.width)===N(w.width)&&(E().roleOf(b,all)!=='Encontro'||options.useMeetingComplements)),lens=[...new Set(fam.map(b=>N(b.length)).filter(l=>l>=10))],joints=[j];
  if(options.flex&&Number.isFinite(N(options.min))&&N(options.max)>N(options.min))for(let v=Math.ceil(N(options.min)*10);v<=Math.floor(N(options.max)*10);v++)if(Math.abs(v/10-j)>1e-6)joints.push(v/10);
  const closable=g=>{if(g<-.01)return false;if(g<.01||g>300)return true;const key=lens.join(',')+'|'+joints.join(',')+'|'+g.toFixed(1);if(closableCache.has(key))return closableCache.get(key);let ok=false;const n=Math.round(g*10);for(const jj of joints){const steps=lens.map(l=>Math.round((l+jj)*10)),reach=new Uint8Array(n+1);reach[0]=1;for(let k=0;k<n;k++)if(reach[k])for(const s of steps)if(k+s<=n)reach[k+s]=1;if(reach[n]){ok=true;break;}}closableCache.set(key,ok);return ok;};
  for(const c of pair){const span=p=>[p.x,p.x+p.length+j],same=(u,v)=>Math.abs(u[0]-v[0])<.01&&Math.abs(u[1]-v[1])<.01;
   const zones=c.cuts.filter(cut=>!c.fixed.some(p=>same(span(p),cut)));
   const blocksAll=()=>[...c.fixed.map(p=>({p,s:span(p)})),...zones.map(z=>({p:null,s:z}))].sort((u,v)=>u.s[0]-v.s[0]);
   const bad=()=>{const out=[];let prev=c.from,prevPiece=null;for(const o of blocksAll()){const g=o.s[0]-prev;if(g>.01&&!closable(g))out.push({a:prevPiece,b:o.p});if(g<-.01)out.push({a:prevPiece,b:o.p,overlap:true});prev=Math.max(prev,o.s[1]);prevPiece=o.p;}const g=c.to-prev;if(g>.01&&!closable(g))out.push({a:prevPiece,b:null});return out;};
   let changed=false;
   for(let guard=0;guard<6;guard++){const list=bad();if(!list.length)break;const {a,b}=list[0];let fixed=false;
    // 1) desloca a peça passante dentro do trecho em que ela ainda cobre o ramo
    for(const p of [b,a].filter(p=>p&&p.span)){const lo=p.span[1]-p.length-j/2,hi=p.span[0]-j/2,orig=p.x,tries=[];for(let d=0;d<=Math.round((hi-lo)*2);d++)tries.push(Math.round((lo+d/2)*100)/100);tries.sort((u,v)=>Math.abs(u-orig)-Math.abs(v-orig));
     for(const x of tries){p.x=x;if(bad().length<list.length&&!bad().some(e=>e.overlap)){fixed=true;break;}}
     if(fixed)break;p.x=orig;}
    // 2) dispensa um B29 lateral de gabarito T que sobra entre dois encontros
    if(!fixed)for(const p of [b,a].filter(p=>p&&p.tTemplate)){const k=c.fixed.indexOf(p);c.fixed.splice(k,1);if(bad().length<list.length){fixed=true;break;}c.fixed.splice(k,0,p);}
    if(!fixed)break;changed=true;}
   if(changed)c.cuts=[...c.fixed.map(span),...zones];}
 }}
return {configs,errors:fail};}

function segmentPieces(seq,from,to,y,h,width,j,all,course=0,arrangement=0){
 let mains=seq.filter(b=>!b.fill&&E().roleOf(b,all)==='Principal'),comps=seq.filter(b=>b.fill||E().roleOf(b,all)!=='Principal');
 if(course%2){const half=all.find(b=>b.active!==false&&b.type!=='Canaleta'&&N(b.width)===width&&N(b.height)===h&&N(b.length)===19);if(half&&!comps.some(b=>N(b.length)===19)){const k=mains.findIndex(b=>Math.abs(N(b.length)+j-2*(N(half.length)+j))<.01);if(k>=0){mains.splice(k,1);comps.push(half,half);}}}
 if(arrangement%3===1)comps.reverse();
 // Protected corner pieces are outside this free interval. Put complements
 // immediately next to that corner; prefer the opposite side in the next course.
 const right=!!((course+Math.floor(arrangement/3))%2),packed=[];let small=0;
 for(const b of comps){if(!b.fill&&Math.abs(N(b.length)-5)<.01){if(small===3&&mains.length){packed.push(mains.pop());small=0;}small++;}else small=0;packed.push(b);}
 let ordered=right?[...mains,...packed]:[...packed,...mains];
 if(arrangement%3===2&&packed.length>1){const first=packed.shift();ordered=right?[first,...mains,...packed]:[...packed,...mains,first];}
 const used=ordered.reduce((sum,b)=>sum+N(b.length)+(b.fill?0:j),0),gap=Math.max(0,to-from-used);let x=from+(right?gap:0);
 return ordered.map(b=>{const piece={cut:b.cut,sourceCode:b.sourceCode,sourceLength:b.sourceLength,cutAmount:b.cutAmount,code:b.code,x,y,length:N(b.length),height:h,width,joint:b.fill?0:j,fill:!!b.fill};x+=piece.length+piece.joint;return piece;});
}

function resolveAttempt(walls,base,all,j,jv,options){
compatibilityRows=new WeakMap();const joints=detect(walls),results=base.map(m=>({...m})),reports=[];if(!joints.length)return {results,reports,joints};
const graph=new Map();for(const q of joints){for(const [a,b]of [[q.a.i,q.b.i],[q.b.i,q.a.i]]){if(!graph.has(a))graph.set(a,new Set());graph.get(a).add(b);}}
const components=[],seen=new Set();for(const i of graph.keys())if(!seen.has(i)){const ids=[],queue=[i];while(queue.length){const k=queue.pop();if(seen.has(k))continue;seen.add(k);ids.push(k);queue.push(...graph.get(k));}components.push(ids);}
const preparedAll=layouts(walls,all,j,options);for(const ids of components){const qs=joints.filter(q=>ids.includes(q.a.i)),configs=new Map(),fail=[];for(const i of ids)configs.set(i,[0,1].map(()=>({from:0,to:N(walls[i].length),cuts:[],fixed:[]})));
const prepared=preparedAll;fail.push(...prepared.errors.filter(message=>qs.some(q=>message.startsWith(q.id))));for(const i of ids)configs.set(i,prepared.configs.get(i));
if(fail.length){reports.push(...fail.map(message=>({ok:false,message})));for(const i of ids)results[i]={...results[i],errors:[...(results[i].errors||[]),'Compatibilização deste conjunto pendente. '+fail.join(' ')],rows:[],quant:{},blockedJunction:true};continue;}
const made=new Map(),cache=new Map();
for(const i of ids){options.progress?.({stage:'encontros',wall:i+1,total:walls.length,attempt:options.attempt||1});const stable=options.stableModels?.[i];if(stable?.rows?.length&&[0,1].every(r=>configs.get(i)[r].fixed.every(p=>stable.rows[r]?.pieces.some(q=>q.code===p.code&&Math.abs(q.x-p.x)<.01&&Math.abs(q.length-p.length)<.01)))){made.set(i,JSON.parse(JSON.stringify(stable)));continue;}const w=walls[i],available=all.filter(b=>b.active!==false&&b.type!=='Canaleta'&&(E().roleOf(b,all)!=='Encontro'||options.useMeetingComplements)&&N(b.width)===N(w.width)).map(b=>options.useMeetingComplements&&E().roleOf(b,all)==='Encontro'?{...b,role:'Complementar'}:b),heights=[...new Set(available.map(b=>N(b.height)))];if(heights.length!==1){fail.push('Parede '+(i+1)+': confira a altura da família.');break;}
const h=heights[0],step=h+jv,courses=Math.floor((N(w.height)+.01)/step);if(courses<2||courses>200||N(w.length)>5000||N(w.height)>4000){fail.push('Parede '+(i+1)+': altura deve fechar em ao menos duas fiadas.');break;}
if((w.openings||[]).some(o=>![o.start,o.width,o.bottom,o.height].every(v=>Number.isFinite(N(v)))||N(o.start)<0||N(o.width)<=0||N(o.bottom)<0||N(o.height)<=0||N(o.start)+N(o.width)>N(w.length)+.01||N(o.bottom)+N(o.height)>N(w.height)+.01||Math.abs(N(o.bottom)/step-Math.round(N(o.bottom)/step))>.001||Math.abs((N(o.bottom)+N(o.height))/step-Math.round((N(o.bottom)+N(o.height))/step))>.001)){fail.push('Parede '+(i+1)+': confira dimensões e limites de fiadas das aberturas.');break;}const rows=[],courseSpecs=[];let closurePending=false,bondPending=false,bondStats53=null;for(let r=0;r<courses;r++){const cfg=D87.cfg(configs,i,r,walls,qs,step),fixed=cfg.fixed.map(p=>({...p,y:r*step})),cuts=[...cfg.cuts,...(w.openings||[]).filter(o=>N(o.bottom)<(r+1)*step-.01&&N(o.bottom)+N(o.height)>r*step+.01).map(o=>[N(o.start),N(o.start)+N(o.width)])];
{const ops=(w.openings||[]).filter(o=>N(o.bottom)<(r+1)*step-.01&&N(o.bottom)+N(o.height)>r*step+.01).map(o=>[N(o.start),N(o.start)+N(o.width)]);if(ops.length){const fit=root.fitOpenings53(fixed,cfg,ops,all,j,N(w.width),h,D87.cfg(configs,i,r+1,walls,qs,step).fixed.flatMap(q=>[q.x,q.x+N(q.length)+j]));if(!fit.ok){fail.push('Parede '+(i+1)+', fiada '+(r+1)+': a abertura fica sobre o encontro e nenhuma peça cadastrada cabe entre o encontro e a ombreira. Confira a posição da abertura.');break;}cuts.length=0;cuts.push(...fit.cuts,...ops);for(const n of fit.notes)(w.__notes53??=new Set()).add(n);}}
if(cfg.to<=cfg.from||fixed.some(p=>p.x<cfg.from-.01||p.x+p.length+j>cfg.to+.01)||fixed.some((p,k)=>fixed.some((q,z)=>z!==k&&Math.min(p.x+p.length+j,q.x+q.length+j)-Math.max(p.x,q.x)>.01))){fail.push('Parede '+(i+1)+': encontros muito próximos.');break;}
courseSpecs.push({fixed,intervals:subtract([[cfg.from,cfg.to]],cuts),y:r*step});
}if(fail.length)break;{const solved=root.WallSolver53.solve({courses:courseSpecs,blocks:available,all,j,flex:options.flex?{min:options.min,max:options.max}:null,h,width:N(w.width),L:N(w.length),variant:options.variant});closurePending=solved.failed.length>0;bondStats53=solved.stats;for(const row of solved.rows)rows.push({index:row.index,pieces:row.pieces.sort((a,b)=>a.x-b.x)});}if(fail.length)break;const quant={};for(const row of rows)for(const p of row.pieces)if(!p.fill)quant[p.sourceCode==='B39'?'B39':p.code]=(quant[p.sourceCode==='B39'?'B39':p.code]||0)+1;const js=rows.flatMap(row=>row.pieces.filter(p=>!p.fill).map(p=>p.joint));const bondIssues=bondAudit(rows);bondPending=bondIssues.length>0;const ruleError=root.V7Rules.audit(rows);if(ruleError&&!ruleError.startsWith('Amarração insuficiente')){fail.push('Parede '+(i+1)+': '+ruleError);break;}made.set(i,{pending:closurePending||bondPending||bondIssues.length>0,closurePending,bondPending,statusReason:closurePending?'Fechamento parcial fora dos encontros — amarração dos encontros preservada. Complete os trechos livres.':bondPending||bondIssues.length?'Amarração dos encontros preservada; revisar a defasagem das juntas nos demais trechos.':'',bondIssues,errors:[],bondStats:bondStats53,warnings:['Encontros ajustados geometricamente com peças cadastradas. Conferir células, graute, armaduras e detalhe do fabricante.',...(root.WallSolver53.note(bondStats53)?[root.WallSolver53.note(bondStats53)]:[]),...(bondIssues.length?['Revisão de amarração: '+bondIssues.length+' pares de fiadas têm defasagem menor que '+String(root.BondRule53.min()).replace('.',',')+' cm (mínimo adotado). A geometria sem sobreposição não está aprovada para execução.']:[])],rows,quant,step,L:N(w.length),H:N(w.height),jh:j,jv,jointMin:Math.min(...js),jointMax:Math.max(...js),drawFrom:Math.min(...rows.flatMap(row=>row.pieces.map(p=>p.x))),drawTo:Math.max(...rows.flatMap(row=>row.pieces.map(p=>p.x+p.length+p.joint))),jointResolved:true});
}
if(!fail.length){const tentative=results.map((m,i)=>made.get(i)||m);for(const check of auditMeetings(walls,tentative,all,j)){if(!check.ok&&check.walls.some(i=>ids.includes(i)))fail.push(check.message);}const checkedGeometry=new Set();for(let r=0;r<Math.max(...[...made.values()].map(m=>m.rows.length));r++){const signature=JSON.stringify([...made.values()].map(m=>m.rows[r]?.pieces.map(p=>[p.x,p.length,p.joint])));if(checkedGeometry.has(signature))continue;checkedGeometry.add(signature);const pages=[...new Set(ids.map(i=>N(walls[i].page||1)))];for(const page of pages){const geo=root.PlanEngine.geometry(walls,tentative,page,r,'abs87');if(geo.pieces.some(p=>p.conflict&&ids.includes(p.wall-1))){const cw84=[...new Set(geo.pieces.filter(p=>p.conflict&&ids.includes(p.wall-1)).map(p=>p.wall))].sort((a,b)=>a-b);fail.push('Persistiu sobreposição de blocos na fiada '+(r+1)+' (Parede '+cw84.join(', Parede ')+').');}}}}
if(fail.length){reports.push(...[...new Set(fail)].map(message=>({ok:false,message})));for(const i of ids)results[i]={...results[i],errors:[...(results[i].errors||[]),'Compatibilização pendente: este conjunto não foi liberado. '+[...new Set(fail)].join(' ')],rows:[],quant:{},blockedJunction:true};}else {for(const[i,m]of made)results[i]=m;reports.push(...qs.map(q=>({ok:true,message:q.id+' — '+q.type+': sequência conjunta ajustada nas duas fiadas, sem sobreposição geométrica.'})));}
}return {results,reports,joints};
}
function bondAudit(rows){const out=[];const joints=row=>row.pieces.filter(p=>!p.fill&&!p.channel).slice().sort((a,b)=>a.x-b.x).flatMap((q,i,ps)=>{if(!i)return [];const p=ps[i-1],end=p.x+p.joint/2+p.length,start=q.x+q.joint/2;return start-end<=6.01?[{x:(start+end)/2,length:Math.max(p.length,q.length)}]:[];});for(let r=1;r<rows.length;r++){const a=joints(rows[r-1]),b=joints(rows[r]);if(a.some(p=>b.some(q=>Math.abs(p.x-q.x)<root.BondRule53.min()-.001)))out.push(r+' / '+(r+1));}return out;}
function verify(walls,input){
 const results=input.results.slice(),bad=new Set(),details=new Set();const pages=[...new Set(walls.filter(w=>w.line).map(w=>N(w.page||1)))],courses=Math.max(0,...results.map(m=>m.rows?.length||0));
 const checkedRows=new Set();for(let r=0;r<courses;r++){const signature=JSON.stringify(results.map(m=>m.rows?.[r]?.pieces.map(p=>[p.x,p.length,p.joint])));if(checkedRows.has(signature))continue;checkedRows.add(signature);for(const page of pages){const g=root.PlanEngine.geometry(walls,results,page,r,'abs87');for(const p of g.pieces)if(p.conflict){bad.add(p.wall-1);const rr87=results[p.wall-1].rows[r+(p.rowShift87||0)];if(rr87?.pieces?.[p.pieceIndex])rr87.pieces[p.pieceIndex].draftConflict=true;}for(const pair of g.pairs)details.add('Fiada '+(r+1)+': Parede '+pair.replace(' × ',' × Parede '));}}
 // A failed connected component is withheld as a whole; no partial meeting is presented as complete.
 const graph=new Map();for(const q of detect(walls)){for(const[a,b]of [[q.a.i,q.b.i],[q.b.i,q.a.i]]){if(!graph.has(a))graph.set(a,new Set());graph.get(a).add(b);}}
 const queue=[...bad];while(queue.length){const i=queue.pop();for(const k of graph.get(i)||[])if(!bad.has(k)){bad.add(k);queue.push(k);}}
 for(const i of bad)results[i]={...results[i],errors:[...(results[i].errors||[]),'Encaixe não resolvido com as peças, juntas e posições informadas. A modulação deste conjunto foi bloqueada para impedir blocos sobrepostos. Confira as mensagens dos encontros.'],rows:[],quant:{},jointResolved:false,blockedJunction:true};
 const reports=input.reports.map(r=>({...r}));if(bad.size)reports.push({ok:false,message:'Conjunto pendente — paredes '+[...bad].sort((a,b)=>a-b).map(i=>i+1).join(', ')+'. Nenhum bloco sobreposto foi liberado. '+[...details].slice(0,8).join('; ')});
 return {...input,results,reports};
}
function resolve(walls,base,all,j,jv,options){
 if(!Number.isFinite(j)||!Number.isFinite(jv)||j<0||jv<0||options.flex&&(!Number.isFinite(options.min)||!Number.isFinite(options.max)||options.min<=0||options.max<options.min))return verify(walls,{results:base,reports:[{ok:false,message:'Confira as juntas e os limites antes de compatibilizar encontros.'}],joints:[]});
 let best,bestScore=-Infinity,tries=0;const count=1;
 search:for(let lChoice=0;lChoice<count;lChoice++)for(let tChoice=0;tChoice<count;tChoice++)for(const phase of (options.variant%2?[1,0]:[0,1]))for(const offset of ([0,-1,1].slice(Math.floor((options.variant||0)/2)%3).concat([0,-1,1].slice(0,Math.floor((options.variant||0)/2)%3)))){
 if(best&&Number.isFinite(options.deadline)&&Date.now()>=options.deadline)break search;if(++tries>24)break;
 const r=resolveAttempt(walls,base,all,j,jv,{...options,offset,lChoice,tChoice,phase,attempt:tries}),score=r.results.filter(m=>m.rows?.length&&!m.errors?.length&&!m.pending).length*1000+r.reports.filter(p=>p.ok).length-r.results.reduce((sum,m)=>sum+(m.bondIssues?.length||0),0)*35-r.results.reduce((sum,m)=>sum+(m.rows||[]).slice(1).reduce((n,row,i)=>n+root.V7Rules.bondMetric(m.rows[i].pieces,row.pieces).penalty,0),0)*2;
 if(!best||score>bestScore){best=r;bestScore=score;}options.progress?.({stage:'tentativa',attempt:tries,totalAttempts:6,checkpoint:verify(walls,JSON.parse(JSON.stringify(best)))});
 if(r.reports.every(p=>p.ok)&&r.results.every(m=>!m.pending&&!m.errors?.length))return verify(walls,r);
 }
 return verify(walls,best||{results:base,reports:[],joints:[]});
}

function auditMeetings(walls,results,all,j){const out=[];for(const q of detect(walls)){const primary=all.filter(p=>p.active!==false&&p.type!=='Canaleta'&&N(p.width)===N(q.a.w.width)&&E().roleOf(p,all)==='Principal').sort((a,b)=>N(b.length)-N(a.length))[0];const fail=[];if(!primary){fail.push('falta bloco principal');}else if(Math.abs(q.a.k/q.b.k-1)>.005||N(q.a.w.width)!==N(q.b.w.width)||!D87.hok(q.a.w,q.b.w)){fail.push('escala, espessura ou altura incompatível');}else{const half=N(q.a.w.width)/2,expectedL=(N(primary.length)+j)/2+N(q.a.w.width),expectedT=N(primary.length)+N(q.a.w.width)+j,carriers=[];const ka87=D87.kbr(q.a.w,results[q.a.i]),kb87=D87.kbr(q.b.w,results[q.b.i]),on87=D87.off(q.a.w)||D87.off(q.b.w),lo87=on87?Math.max(ka87,kb87):0,n=on87?Math.min(ka87+(results[q.a.i]?.rows?.length||0),kb87+(results[q.b.i]?.rows?.length||0))-lo87:Math.max(results[q.a.i]?.rows?.length||0,results[q.b.i]?.rows?.length||0);for(let r=0;r<n;r++){const R87=s=>results[s.i]?.rows?.[r+lo87-(s===q.a?ka87:kb87)];const channelMeeting=['a','b'].some(side=>{const w=q[side],at=side==='a'?q.ta:q.tb;return R87(w)?.pieces?.some(p=>p.channel&&p.x+N(p.joint)/2<at+half-.001&&p.x+N(p.joint)/2+N(p.length)>at-half+.001);});if(channelMeeting)continue;const hits=[];for(const side of ['a','b']){const w=q[side],t=side==='a'?q.ta:q.tb,ep=side==='a'?q.ae:q.be,expected=ep>=0?(q.type==='T'&&Math.abs(N(primary.length)-39)<.01&&Math.abs(N(w.w.width)-14)<.01&&Math.abs(j-1)<.01?29:expectedL):expectedT,row=R87(w);if(!row){fail.push('fiada '+(r+1)+' sem arranjo das duas paredes');continue;}const ps=row.pieces.filter(p=>!p.fill&&p.x+N(p.joint)/2<=t-half+.01&&p.x+N(p.joint)/2+N(p.length)>=t+half-.01);for(const p of ps){const canonical14=Math.abs(N(primary.length)-39)<.01&&Math.abs(N(w.w.width)-14)<.01&&Math.abs(j-1)<.01;
const canonicalMeeting=canonical14&&p.meeting&&(
 (q.type==='L'&&(Math.abs(N(p.length)-29)<.01||Math.abs(N(p.length)-44)<.01))||
 (q.type==='T'&&ep>=0&&Math.abs(N(p.length)-29)<.01)||
 (q.type==='T'&&ep<0&&(Math.abs(N(p.length)-54)<.01||Math.abs(N(p.length)-44)<.01))||
 (q.type==='X'&&(Math.abs(N(p.length)-29)<.01||Math.abs(N(p.length)-44)<.01||Math.abs(N(p.length)-54)<.01))
);
if(Math.abs(N(p.length)-expected)<.01||canonicalMeeting||p.adjusted53)hits.push({i:w.i,p});else fail.push('fiada '+(r+1)+': peça '+p.code+' atravessa o encontro; combinação não corresponde ao gabarito de amarração desta família');}}
 if(hits.length===0&&on87&&D87.cover(walls,results,q,r+lo87)){}else if(hits.length!==1){fail.push('fiada '+(r+1)+': precisa de uma peça contínua atravessando o encontro');}else{carriers[r]=hits[0].i;if(r&&carriers[r]===carriers[r-1])fail.push('fiadas '+r+' / '+(r+1)+': falta alternar a direção da peça de encontro');}}
 if(n<2)fail.push('faltam as duas fiadas para conferir');}
 out.push({ok:!fail.length,walls:[q.a.i,q.b.i],type:q.type,message:q.id+' — '+q.type+': '+(fail.length?[...new Set(fail)].slice(0,4).join('; '):'peças de encontro e direção alternada conferidas geometricamente; verificar células no catálogo.')});}return out;}

root.JunctionEngine={detect,resolve,candidates,verify,auditMeetings,layouts,segmentPieces,bondAudit};if(typeof module!=='undefined')module.exports=root.JunctionEngine;
})(typeof globalThis!=='undefined'?globalThis:this);

(function(root){
function tile(from,to,base,y,kind,j){const out=[],L=to-from,unit=Number(base.length),module=unit+j;if(!(L>.001&&module>0))return out;let count=Math.floor((L+1e-7)/module),rest=L-count*module;
// When less than one joint remains, reduce the last full piece so the cut is positive.
const splitTail=rest>.001&&rest<=j+.001&&count>0;if(splitTail){count--;rest+=module;}
let x=from;for(let n=0;n<count;n++){out.push(piece(x,unit,false));x+=module;}
if(splitTail){const available=rest-2*j,last=Math.min(1,available/2);out.push(piece(x,available-last,true));x+=available-last+j;out.push(piece(x,last,true));}
else if(rest>.001){const length=rest-j;if(length>.001)out.push(piece(x,length,true));else out.push({...piece(x,rest,true),joint:0,terminalNoJoint:true});}
function piece(x,length,cut){return {code:base.code,x,y,length,height:Number(base.height),highHeight:base.channel==='J'?Number(base.highHeight):undefined,width:Number(base.width),joint:j,channel:base.channel,channelUse:kind,cut:cut&&Math.abs(length-unit)>.001,sourceCode:base.code,sourceLength:unit};}return out;}
function apply(walls,results,blocks,settings={}){return results.map((m,i)=>{if(m.errors.length||!m.rows.length)return m;const w=walls[i],shape=w.location==='Interna'?'U':w.location==='Externa'?'J':null;if(!shape)return {...m,pending:true,statusReason:'Defina a parede como Interna ou Externa.'};
const rows=m.rows.map(r=>({...r,pieces:r.pieces.map(p=>({...p}))})),warnings=[];
function convert(row,a,b,kind,channel){const base=blocks.find(p=>p.type==='Canaleta'&&p.channel===channel&&Number(p.width)===Number(w.width)&&Number(p.height)===Number(row.pieces.find(p=>!p.fill)?.height||m.step-m.jv));if(!base){warnings.push('Falta perfil '+channel+' compatível com esta parede.');return;}const selected=row.pieces.filter(p=>p.x+p.length+p.joint>a+.001&&p.x<b-.001&&(true));if(!selected.length)return;const groups=[];for(const p of selected.slice().sort((a,b)=>a.x-b.x)){const g=groups.at(-1);if(g&&Math.abs(g.at(-1).x+g.at(-1).length+g.at(-1).joint-p.x)<.02)g.push(p);else groups.push([p]);}
for(const g of groups){const from=g[0].x,to=g.at(-1).x+g.at(-1).length+g.at(-1).joint,ps=tile(from,to,base,g[0].y,kind,Number(m.jh));const remove=new Set(g);row.pieces=[...row.pieces.filter(p=>!remove.has(p)),...ps].sort((a,b)=>a.x-b.x);}}
const last=rows.at(-1);convert(last,-Infinity,Infinity,'Respaldo',shape);
for(const o of w.openings||[]){const bearing=Number(settings.bearing??30),a=Math.max(0,Number(o.start)-bearing),b=Math.min(Number(w.length),Number(o.start)+Number(o.width)+bearing),top=Math.round((Number(o.bottom)+Number(o.height))/m.step),bottom=Math.round(Number(o.bottom)/m.step)-1;for(const[r,kind]of [[top,'Verga'],...(Number(o.bottom)>0?[[bottom,'Contraverga']]:[])]){if(rows[r])convert(rows[r],a,b,kind,'U');else if(!(kind==='Verga'&&r>=rows.length))warnings.push(kind+': não há fiada disponível.');}}
const quant={};for(const r of rows)for(const p of r.pieces)if(!p.fill)quant[p.sourceCode==='B39'?'B39':p.code]=(quant[p.sourceCode==='B39'?'B39':p.code]||0)+1;
const old=(m.warnings||[]).filter(t=>!t.startsWith('Canaletas')&&!t.includes('cm livres para revisão')&&!t.includes('canaletas e reforços das aberturas ainda'));
return {...m,rows,quant,topChannel:shape,topPending:!!warnings.length,warnings:[...new Set([...old,...warnings,'Canaletas automáticas: U nas vergas/contravergas; respaldo J externo/U interno. Cortes de canaletas e B39 são usados quando necessários ao fechamento.'])],...(warnings.length?{pending:true,statusReason:'Perfis de canaleta pendentes de revisão.'}:{})};});}
root.ChannelEngine={apply,tile};
})(typeof globalThis!=='undefined'?globalThis:this);


// V84 — liberação por partes: um encontro que não fecha segura só as paredes ligadas a ele (roda dentro do motor e do Worker).
;(function(root){try{const JE=root.JunctionEngine;if(!JE||JE.__rel84)return;JE.__rel84=true;const orig=JE.resolve;
 JE.resolve=function(walls,base,blocks,j,jv,opts){let res=orig.call(this,walls,base,blocks,j,jv,opts);if(!opts||!opts.release84)return res;
  const gap=()=>walls.forEach((w,i)=>{if(w.gap84&&res.results[i])res.results[i]=Object.assign({},res.results[i],{rows:[],errors:[],pending:true,gap84:true,blockedJunction:false});});
  const excl=new Set(),why=new Map();let fresh=res.reports||[];
  for(let loop=0;loop<(opts.relLoops84||5);loop++){gap();const blocked=new Set(res.results.map((m,i)=>m&&m.blockedJunction&&!m.gap84?i:-1).filter(i=>i>=0));if(!blocked.size)break;
   const culprits=new Set();
   for(const r of fresh){if(r.ok!==false)continue;const msg=String(r.message||'');let hit=false;const pair=/^Parede \d+ × Parede \d+/.test(msg);
    if(!pair)for(const mm of msg.matchAll(/Parede (\d+)\b(?!\s*×)/g)){const k=Number(mm[1])-1;if(blocked.has(k)&&!excl.has(k)){culprits.add(k);if(!why.has(k))why.set(k,msg);hit=true;}}
    if(!hit){const m2=msg.match(/^Parede (\d+) × Parede (\d+)/);if(m2){const ks=[Number(m2[1])-1,Number(m2[2])-1].filter(k=>blocked.has(k)&&!excl.has(k)).sort((x,y)=>Number(walls[x].length)-Number(walls[y].length));if(ks.length){const k=ks[0];culprits.add(k);if(!why.has(k))why.set(k,msg);}}}}
   if(!culprits.size)break;culprits.forEach(k=>excl.add(k));
   const w2=walls.map((w,i)=>excl.has(i)?Object.assign({},w,{page:900000+i}):w);
   const res2=orig.call(this,w2,base,blocks,j,jv,opts);fresh=res2.reports||[];
   // paredes ligadas às isoladas: ficam com o desenho, mas pendentes no encontro com a isolada
   const qs=JE.detect(walls),partners=new Map();for(const q of qs){if(excl.has(q.a.i)&&!excl.has(q.b.i))partners.set(q.b.i,(partners.get(q.b.i)||[]).concat(q.a.i));if(excl.has(q.b.i)&&!excl.has(q.a.i))partners.set(q.a.i,(partners.get(q.a.i)||[]).concat(q.b.i));}
   for(const k of excl){const m=res2.results[k]||base[k]||{};res2.results[k]=Object.assign({},m,{pending:true,isolated84:true,statusReason:'Encontro não resolvido — desenho provisório desta parede (liberada à parte).',sourceErrors:[why.get(k)||'Encontro não resolvido.']});}
   for(const[k,list]of partners){const m=res2.results[k];if(!m||!m.rows||!m.rows.length)continue;res2.results[k]=Object.assign({},m,{pending:true,partner84:list,statusReason:'Encontro com a Parede '+list.map(x=>x+1).join(', ')+' pendente (aquela parede ainda não fecha).'});}
   res2.reports=(res2.reports||[]).concat([{ok:false,message:'Liberação por partes: Parede '+[...excl].map(x=>x+1).join(', ')+' calculada à parte; o restante do conjunto foi liberado.'}],[...why.values()].map(m=>({ok:false,message:m})));
   res=res2;}
  gap();return res;};
}catch(e){}})(typeof window!=='undefined'?window:globalThis);


(function(root){
'use strict';const N=Number;
// ---------- geometria em planta: cada parede na sua fiada; conferência entre paredes pela fiada absoluta
try{const g0=root.PlanEngine.geometry;root.PlanEngine.geometry=function(walls,results,page,course,mode){
 if(!D87.any(walls))return g0.call(this,walls,results,page,course);
 if(mode==='abs87'){const ks=walls.map((w,i)=>D87.kbr(w,results[i])),minK=Math.min(0,...ks);
  const shim=results.map((m,i)=>{if(!m)return m;const rows=[];rows[course]=m.rows?.[course+minK-ks[i]];return {...m,rows};});
  const g=g0.call(this,walls,shim,page,course);for(const p of g.pieces)p.rowShift87=minK-ks[p.wall-1];return g;}
 // desenho (1ª/2ª fiada): cada parede mostra a própria fiada; só confere sobreposição entre paredes da mesma cota de base
 const groups=new Map();walls.forEach((w,i)=>{const k=D87.kbr(w,results[i]);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(i);});
 let out=null;const omitted=new Set();
 for(const ids of groups.values()){const set=new Set(ids),shim=results.map((m,i)=>set.has(i)?m:null),g=g0.call(this,walls,shim,page,course);
  for(const o of g.omitted)if(set.has(o-1))omitted.add(o);
  if(!out)out={...g,pieces:[...g.pieces],pairs:[...g.pairs]};else{out.pieces.push(...g.pieces);out.pairs.push(...g.pairs);}}
 out.omitted=[...omitted];out.pairs=[...new Set(out.pairs)];return out;};}catch(e){}

})(typeof globalThis!=='undefined'?globalThis:this);
