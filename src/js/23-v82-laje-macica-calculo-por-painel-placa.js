// V82 — laje maciça: cálculo por painel (placa, diferenças finitas), armação positiva e negativa, flecha, detalhamento e pranchas
// após as elevações de cada pavimento; escala própria para as elevações nas pranchas.
(function(){
'use strict';
const N=v=>Number(v),LD=()=>window.loads77,L68=()=>window.level68;
const fx=(v,d=2)=>(Number.isFinite(v)?v:0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const segD=(P,A,B)=>window.geo74.segDist(P,A,B);

// ---------- 1. Critérios (editáveis em Configurações das cargas)
const CDEF={fck:25,fyk:500,c:2.5,bars:'5;6,3;8;10;12,5',smin:10,psi2:0.3,af:1.32,nu:0.2,agg:1.0};
function C(){const s=LD().S();s.cfg.slab82??={};const o=s.cfg.slab82;for(const k in CDEF)if(o[k]===undefined)o[k]=CDEF[k];return o;}
const barsOf=()=>String(C().bars).split(/[;\s]+/).map(v=>N(v.replace(',','.'))).filter(v=>v>0).sort((a,b)=>a-b);
const KG={5:0.154,6.3:0.245,8:0.395,10:0.617,12.5:0.963,16:1.578};const kgm=d=>KG[d]||(Math.PI*(d/1000)**2/4*7850);
const fd=d=>fx(d,d%1?1:0);

// ---------- 2. Placa retangular por diferenças finitas (∇⁴w = p, D = 1) · bordas: 'S' apoiada, 'C' engastada
// lados: 0 = x mínimo (esquerda), 1 = x máximo, 2 = y mínimo, 3 = y máximo
function plate(lx,ly,bc,nu){const n=20,hx=lx/n,hy=ly/n,M=n-1,NN=M*M,A=new Float64Array(NN*NN),B=new Float64Array(NN).fill(1);
 const idx=(i,j)=>(j-1)*M+(i-1);
 const add=(r,i,j,v)=>{let s=1;if(i<0){if(bc[0]==='S')s=-s;i=-i;}else if(i>n){if(bc[1]==='S')s=-s;i=2*n-i;}if(j<0){if(bc[2]==='S')s=-s;j=-j;}else if(j>n){if(bc[3]==='S')s=-s;j=2*n-j;}if(i<=0||i>=n||j<=0||j>=n)return;A[r*NN+idx(i,j)]+=s*v;};
 const ax=1/hx**4,ay=1/hy**4,axy=2/(hx*hx*hy*hy);
 for(let j=1;j<n;j++)for(let i=1;i<n;i++){const r=idx(i,j);
  add(r,i-2,j,ax);add(r,i-1,j,-4*ax);add(r,i,j,6*ax);add(r,i+1,j,-4*ax);add(r,i+2,j,ax);
  add(r,i,j-2,ay);add(r,i,j-1,-4*ay);add(r,i,j,6*ay);add(r,i,j+1,-4*ay);add(r,i,j+2,ay);
  for(const[di,dj,v]of[[1,1,1],[0,1,-2],[-1,1,1],[1,0,-2],[0,0,4],[-1,0,-2],[1,-1,1],[0,-1,-2],[-1,-1,1]])add(r,i+di,j+dj,axy*v);}
 // eliminação de Gauss (banda)
 const bw=2*M+2;for(let k=0;k<NN;k++){const pk=A[k*NN+k];for(let r=k+1;r<Math.min(NN,k+bw+1);r++){const f=A[r*NN+k]/pk;if(!f)continue;for(let c=k;c<Math.min(NN,k+bw+1);c++)A[r*NN+c]-=f*A[k*NN+c];B[r]-=f*B[k];}}
 const W=new Float64Array(NN);for(let k=NN-1;k>=0;k--){let s=B[k];for(let c=k+1;c<Math.min(NN,k+bw+1);c++)s-=A[k*NN+c]*W[c];W[k]=s/A[k*NN+k];}
 const w=(i,j)=>{let s=1;if(i<0){if(bc[0]==='S')s=-s;i=-i;}else if(i>n){if(bc[1]==='S')s=-s;i=2*n-i;}if(j<0){if(bc[2]==='S')s=-s;j=-j;}else if(j>n){if(bc[3]==='S')s=-s;j=2*n-j;}if(i<=0||i>=n||j<=0||j>=n)return 0;return s*W[idx(i,j)];};
 let mx=0,my=0,wm=0;for(let j=1;j<n;j++)for(let i=1;i<n;i++){const wxx=(w(i-1,j)-2*w(i,j)+w(i+1,j))/hx/hx,wyy=(w(i,j-1)-2*w(i,j)+w(i,j+1))/hy/hy;mx=Math.max(mx,-(wxx+nu*wyy));my=Math.max(my,-(wyy+nu*wxx));wm=Math.max(wm,w(i,j));}
 // negativos nas bordas engastadas (maior valor ao longo da borda)
 const neg=[0,0,0,0];for(let k=1;k<n;k++){if(bc[0]==='C')neg[0]=Math.max(neg[0],2*w(1,k)/hx/hx);if(bc[1]==='C')neg[1]=Math.max(neg[1],2*w(n-1,k)/hx/hx);if(bc[2]==='C')neg[2]=Math.max(neg[2],2*w(k,1)/hy/hy);if(bc[3]==='C')neg[3]=Math.max(neg[3],2*w(k,n-1)/hy/hy);}
 return {mx,my,neg,w:wm};}// por unidade de carga (p = 1): momentos × p, flecha × p/D
const plateCache=new Map();function plateU(lx,ly,bc){const k=[lx.toFixed(2),ly.toFixed(2),bc.join('')].join('|');if(!plateCache.has(k))plateCache.set(k,plate(lx,ly,bc,N(C().nu)||0.2));return plateCache.get(k);}

// ---------- 3. Dimensionamento à flexão (b = 1 m) e escolha das barras
function asReq(Md,dcm){const c=C(),fcd=N(c.fck)/1.4*1000,fyd=N(c.fyk)/1.15*1000,d=dcm/100;if(Md<=0)return {as:0,ok:true};const k=1-Md/(0.425*d*d*fcd);if(k<0)return {as:NaN,ok:false};const x=1.25*d*(1-Math.sqrt(k));return {as:Md/(fyd*(d-0.4*x))*1e4,ok:x/d<=0.45,xd:x/d};}
const rhoMin=()=>{const f=N(C().fck);return f<=30?0.0015:f<=35?0.00164:f<=40?0.00179:f<=45?0.00194:0.00208;};
function choose(as,hcm){const c=C(),smax=Math.min(2*hcm,20),bars=barsOf().filter(b=>b<=hcm*10/8+.01);let best=null;
 for(const d of bars){const a1=Math.PI*(d/10)**2/4;let s=Math.floor(a1/as*100/2.5)*2.5;s=Math.min(s,smax);if(s<N(c.smin))continue;const pr={d,s,as:a1*100/s};if(!best||pr.as<best.as-1e-9)best=pr;}
 if(!best){const d=bars.at(-1)||10,a1=Math.PI*(d/10)**2/4,s=Math.max(5,Math.floor(a1/as*100/2.5)*2.5);best={d,s,as:a1*100/s,tight:true};}return best;}

// ---------- 4. Painéis maciços de uma laje
function panelsOf(sl,R){const v=sl.ctx;if(!v)return [];const LV=R.LV,sup=LV[sl.sup];if(!sup)return [];const I=v.I,out=[];
 for(let c=0;c<v.nc;c++){const p=v.propOf(c);if(p.type!=='mac')continue;if(p.arm&&(N(p.arm.px?.d)>0||N(p.arm.py?.d)>0))continue;let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity,k=0,kc=0,G=0,Q=0;
  for(let i=0;i<v.n;i++){if(v.comp[i]!==c)continue;k++;if(v.cant[i]){kc++;continue;}const X=v.cx(i),Y=v.cy(i);x0=Math.min(x0,X-v.s0/2);x1=Math.max(x1,X+v.s0/2);y0=Math.min(y0,Y-v.s0/2);y1=Math.max(y1,Y+v.s0/2);const gq=v.cellGQ(i);G+=gq.g;Q+=gq.q;}
  if(k<20||kc>k/2)continue;const n0=k-kc,area=(x1-x0)*(y1-y0)/1e4;
  // apoio em cada lado: parede paralela ao lado, logo além da borda
  const sides=[{n:[-1,0],a:{x:x0,y:y0},b:{x:x0,y:y1}},{n:[1,0],a:{x:x1,y:y0},b:{x:x1,y:y1}},{n:[0,-1],a:{x:x0,y:y0},b:{x:x1,y:y0}},{n:[0,1],a:{x:x0,y:y1},b:{x:x1,y:y1}}].map((sd,si)=>{
   const M={x:(sd.a.x+sd.b.x)/2,y:(sd.a.y+sd.b.y)/2};let wall=null,bd=Infinity;I.forEach((x,j)=>{const par=Math.abs(x.g.u[0]*(sd.b.x-sd.a.x)+x.g.u[1]*(sd.b.y-sd.a.y))/Math.hypot(sd.b.x-sd.a.x,sd.b.y-sd.a.y)>.9;if(!par)return;const d=segD({x:M.x+sd.n[0]*x.t/2,y:M.y+sd.n[1]*x.t/2},x.g.A,x.g.B);if(d<=x.t/2+8&&d<bd){bd=d;wall=j;}});
   const t=wall!=null?I[wall].t:0;// o que há além da parede
   const probe=f=>{const P={x:sd.a.x+(sd.b.x-sd.a.x)*f+sd.n[0]*(t+15),y:sd.a.y+(sd.b.y-sd.a.y)*f+sd.n[1]*(t+15)},ci=v.cell(P);if(ci<0||!v.inside[ci])return 'out';if(v.cant[ci])return 'cant';const cc=v.comp[ci];return cc>=0&&cc!==c?'slab':'out';};
   const pr=[.25,.5,.75].map(probe),cnt=k2=>pr.filter(x=>x===k2).length;const beyond=cnt('cant')>=2?'cant':cnt('slab')>=2?'slab':'out';
   const nb=beyond==='slab'?(()=>{const P={x:M.x+sd.n[0]*(t+15),y:M.y+sd.n[1]*(t+15)},ci=v.cell(P);return ci>=0?v.comp[ci]:-1;})():-1;
   return {...sd,si,wall,t,beyond,nb};});
  const free=sides.filter(s=>s.wall==null&&s.beyond==='out');
  const edgeMode=p.edge||'auto',bc=sides.map(s=>edgeMode!=='apoiada'&&(s.beyond==='slab'||s.beyond==='cant')?'C':'S');
  // vãos teóricos: entre eixos das paredes
  const lxw=(x1-x0)+sides[0].t/2+sides[1].t/2,lyw=(y1-y0)+sides[2].t/2+sides[3].t/2;
  // cargas lineares e concentradas dentro do painel: convertidas em carga distribuída equivalente
  let eqG=0,eqQ=0;for(const it of v.items||[]){const pts=(it.pts||[]).map(P=>window.world74(N(it.page),P));const inP=P=>P.x>x0&&P.x<x1&&P.y>y0&&P.y<y1;
   if(it.kind==='line')for(let k2=0;k2+1<pts.length;k2++){const a=pts[k2],b=pts[k2+1],m=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/5)),dl=Math.hypot(b.x-a.x,b.y-a.y)/m/100;for(let t2=0;t2<m;t2++){const P={x:a.x+(b.x-a.x)*(t2+.5)/m,y:a.y+(b.y-a.y)*(t2+.5)/m};if(inP(P)){eqG+=(N(it.g)||0)*dl;eqQ+=(N(it.q)||0)*dl;}}}
   else if(it.kind==='point'&&pts[0]&&inP(pts[0])){eqG+=N(it.g)||0;eqQ+=N(it.q)||0;}}
  const gk=G/n0+eqG/area,qk=Q/n0+eqQ/area;
  out.push({c,p,h:N(p.h)||10,x0,x1,y0,y1,lxw,lyw,sides,bc,gk,qk,eq:eqG+eqQ>0,free:free.length>0,area});}
 return out;}

// ---------- 5. Cálculo de uma laje (todos os painéis maciços) + negativos compatibilizados + detalhamento
function designSlab(sl,R){const cfg=C(),c=N(cfg.c),panels=panelsOf(sl,R);if(!panels.length)return null;const warn=[];
 panels.forEach((P,k)=>{P.name='L'+(k+1);const sw=P.lxw>P.lyw;// lx = vão menor
  const lx=Math.min(P.lxw,P.lyw)/100,ly=Math.max(P.lxw,P.lyw)/100,lam=ly/lx;P.lx=lx;P.ly=ly;P.lam=lam;P.swap=sw;
  // na placa: eixo x da placa = direção do menor vão
  const bc=sw?[P.bc[2],P.bc[3],P.bc[0],P.bc[1]]:P.bc;const u=plateU(lx,ly,bc);P.u=u;
  const pd=1.4*P.gk+1.4*P.qk,pqp=P.gk+N(cfg.psi2)*P.qk;P.pd=pd;P.pqp=pqp;
  P.mxd=u.mx*pd;P.myd=u.my*pd;// por metro, em kN·m/m (mx: direção do menor vão)
  // negativos próprios por lado (em coordenadas do mundo: 0 esq, 1 dir, 2 baixo, 3 cima)
  const negPl=u.neg.map(v=>v*pd);P.negOwn=sw?[negPl[2],negPl[3],negPl[0],negPl[1]]:negPl;
  if(P.free)warn.push(P.name+': borda sem parede de apoio (borda livre) — painel calculado como apoiado nessa borda; confira.');
  if(P.eq)warn.push(P.name+': carga linear/concentrada sobre a laje convertida em carga distribuída equivalente no painel — confira localmente.');
  if(lam>2)P.oneWay=true;});
 // compatibilização dos negativos entre painéis vizinhos
 const edges=[];panels.forEach(P=>P.sides.forEach(s=>{if(P.bc[s.si]!=='C')return;if(s.beyond==='slab'){const Q=panels.find(q=>q.c===s.nb);const key=[Math.min(P.c,s.nb),Math.max(P.c,s.nb),s.wall].join('|');if(edges.some(e=>e.key===key))return;const mq=Q?Q.negOwn[Q.sides.findIndex(t=>t.nb===P.c&&t.wall===s.wall)]||0:0;const m1=P.negOwn[s.si],m=Q?Math.max((m1+mq)/2,0.8*Math.max(m1,mq)):m1;edges.push({key,P,Q,s,m,kind:'cont'});
   if(m<m1)P['add'+(s.si<2?'x':'y')]=Math.max(P['add'+(s.si<2?'x':'y')]||0,(m1-m)/2);if(Q){const qi=Q.sides.findIndex(t=>t.nb===P.c&&t.wall===s.wall);if(qi>=0&&m<mq)Q['add'+(qi<2?'x':'y')]=Math.max(Q['add'+(qi<2?'x':'y')]||0,(mq-m)/2);}}
  else if(s.beyond==='cant'){const mm=R.moments.find(z=>z.sup===sl.sup&&z.j===s.wall&&z.slab===sl.name);const mb=mm?1.4*(mm.mg+mm.mq):0;edges.push({key:P.c+'|cant|'+s.wall,P,s,m:Math.max(P.negOwn[s.si],mb),mb,kind:'cant',mom:mm});}}));
 // momentos positivos finais por direção do mundo (x = horizontal, y = vertical)
 panels.forEach(P=>{const mW=P.swap?{x:P.myd,y:P.mxd}:{x:P.mxd,y:P.myd};P.mpx=mW.x+(P.addx||0);P.mpy=mW.y+(P.addy||0);});
 // armaduras
 const h=P=>P.h,rm=rhoMin(),bars=[];let maxPhi=8;
 const addBar=(o)=>{bars.push(o);return o;};
 panels.forEach(P=>{const H=h(P),dx0=H-c-0.4,dy0=H-c-0.4-0.8;// camada inferior: direção do menor vão
  const lowerIsX=!P.swap;// menor vão na direção x do mundo?
  const dX=lowerIsX?dx0:dy0,dY=lowerIsX?dy0:dx0,amin=(P.oneWay?1:0.67)*rm*100*H;// cm²/m (b=100 cm)
  const rx=asReq(P.mpx,dX),ry=asReq(P.mpy,dY);if(!rx.ok||!ry.ok)warn.push(P.name+': seção insuficiente ou x/d > 0,45 — aumente a espessura.');
  let asx=Math.max(rx.as||0,amin),asy=Math.max(ry.as||0,amin);
  if(P.oneWay){if(lowerIsX)asy=Math.max(asy,0.2*asx,0.9,0.5*rm*100*H);else asx=Math.max(asx,0.2*asy,0.9,0.5*rm*100*H);}
  P.asx=asx;P.asy=asy;P.bx=choose(asx,H);P.by=choose(asy,H);
  // comprimentos: reto, de extremidade a extremidade das paredes, menos o cobrimento
  const tL=P.sides[0].t,tR=P.sides[1].t,tB=P.sides[2].t,tT=P.sides[3].t;
  P.Cx=Math.round((P.x1-P.x0)+tL+tR-2*c);P.Cy=Math.round((P.y1-P.y0)+tB+tT-2*c);
  P.nx=Math.floor((P.y1-P.y0)/P.bx.s)+1;P.ny=Math.floor((P.x1-P.x0)/P.by.s)+1;
  P.barX=addBar({kind:'pos',d:P.bx.d,s:P.bx.s,C:P.Cx,n:P.nx,where:P.name+' · positiva horizontal',P,dir:'x'});P.barY=addBar({kind:'pos',d:P.by.d,s:P.by.s,C:P.Cy,n:P.ny,where:P.name+' · positiva vertical',P,dir:'y'});
  // flecha (quase permanente), com fissuração (Branson) e fluência
  const Ecs=(0.8+0.2*N(cfg.fck)/80)*N(cfg.agg)*5600*Math.sqrt(N(cfg.fck))*1000,Hm=H/100,Ic=Hm**3/12,D=Ecs*Hm**3/(12*(1-(N(cfg.nu)||.2)**2));let ai=P.u.w*P.pqp/D;
  const Ma=Math.max(P.u.mx,P.u.my)*P.pqp,fct=0.3*Math.pow(N(cfg.fck),2/3)*1000,Mr=1.5*fct*Ic/(Hm/2);let Ie=Ic;
  if(Ma>Mr){const Es=210e6,ae=Es/Ecs,shortAs=lowerIsX?P.bx.as:P.by.as,longAs=lowerIsX?P.by.as:P.bx.as,gov=P.u.mx>=P.u.my,As=(gov?shortAs:longAs)/1e4,d=(gov?dx0:dy0)/100;const a=0.5,b2=ae*As,c2=-ae*As*d,x=(-b2+Math.sqrt(b2*b2-4*a*c2))/(2*a),I2=x**3/3+ae*As*(d-x)**2,r3=(Mr/Ma)**3;Ie=Math.min(Ic,r3*Ic+(1-r3)*I2);}
  ai*=Ic/Ie;P.flecha=ai*(1+N(cfg.af))*100;P.flim=P.lx*100/250;P.cracked=Ma>Mr;
  const hmin=sl.kind==='cob'?7:8;if(H<hmin)warn.push(P.name+': espessura '+fd(H)+' cm menor que o mínimo da NBR 6118 ('+hmin+' cm).');
  if(P.flecha>P.flim)warn.push(P.name+': flecha '+fx(P.flecha)+' cm acima do limite l/250 = '+fx(P.flim)+' cm — aumente a espessura.');});
 // negativos
 const hk=P=>Math.max(5,Math.round(h(P)-2*c));
 edges.forEach(e=>{const P=e.P,s=e.s,H=Math.min(h(P),e.Q?h(e.Q):h(P)),d=H-c-0.4,amin=rm*100*H,r=asReq(e.m,d);if(!r.ok)warn.push(P.name+': negativo insuficiente — aumente a espessura.');e.as=Math.max(r.as||0,amin);e.b=choose(e.as,H);
  const along=s.si<2?(P.y1-P.y0):(P.x1-P.x0);let ext;
  if(e.kind==='cont'){const lref=Math.max(P.lx,e.Q?e.Q.lx:0)*100;ext=Math.ceil(0.25*lref/5)*5;e.Ch=2*ext;}
  else{const v=sl.ctx;let depth=0;for(let i=0;i<v.n;i++){if(!v.cant[i]||v.assign[i]!==s.wall)continue;const X=v.cx(i),Y=v.cy(i);const dd=Math.abs((s.si<2?X-(s.si===0?P.x0:P.x1):Y-(s.si===2?P.y0:P.y1)));depth=Math.max(depth,dd+v.s0/2-s.t);}e.depth=Math.round(Math.max(0,depth));ext=Math.ceil(Math.max(1.5*e.depth,0.25*P.lx*100)/5)*5;e.Ch=Math.round(e.depth+s.t+ext-c);}
  e.leg=hk(P);e.C=e.Ch+2*e.leg;e.n=Math.floor(along/e.b.s)+1;e.ext=ext;e.along=along;
  e.bar=addBar({kind:'neg',d:e.b.d,s:e.b.s,C:e.C,Ch:e.Ch,leg:e.leg,n:e.n,where:e.kind==='cont'?'negativo '+P.name+'–'+(e.Q?.name||''):'negativo do balanço ('+P.name+')',e});});
 // armadura negativa de borda (bordas apoiadas com parede): ρ ≥ 0,67 ρmín, 0,15·lx para dentro
 panels.forEach(P=>P.sides.forEach(s=>{if(P.bc[s.si]!=='S'||s.wall==null)return;const H=h(P),as=0.67*rm*100*H,b=choose(as,H);const along=s.si<2?(P.y1-P.y0):(P.x1-P.x0),Ch=Math.round(s.t-c+Math.ceil(0.15*P.lx*100/5)*5),leg=hk(P);
  addBar({kind:'edge',d:b.d,s:b.s,C:Ch+2*leg,Ch,leg,n:Math.floor(along/b.s)+1,where:'borda '+P.name,P,side:s,b});}));
 // numeração N (barras iguais = mesma posição)
 const marks=new Map();let nn=1;for(const b of bars){const key=b.kind[0]+'|'+b.d+'|'+b.C;if(!marks.has(key))marks.set(key,'N'+nn++);b.N=marks.get(key);}
 const rows=[...marks.entries()].map(([key,N2])=>{const list=bars.filter(b=>b.N===N2);const n=list.reduce((a,b)=>a+b.n,0),b0=list[0];return {N:N2,d:b0.d,n,C:b0.C,tot:n*b0.C/100,kind:b0.kind,where:[...new Set(list.map(b=>b.where))].join('; ')};});
 const byD=new Map();rows.forEach(r=>byD.set(r.d,(byD.get(r.d)||0)+r.tot));
 return {sl,panels,edges,bars,rows,byD,warn};}
function designAll(){const R=LD().compute({});const out=[];for(const sl of R.slabs){if(sl.times)continue;try{const d=designSlab(sl,R);if(d)out.push(d);}catch(e){console.error('V82 laje',e);}}return {R,list:out};}
window.slab82={designAll,plate,asReq};

// ---------- 6. Desenho (SVG em cm do mundo; escala por mm)
function slabSVG(D,which,k){// k: mm por cm (desenho na escala da folha)
 const R=D.sl,LV=LD().compute({}).LV,sup=LV[R.sup],I=sup.I;let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
 const ext=(x,y)=>{x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);};I.forEach(x=>{ext(x.g.A.x,x.g.A.y);ext(x.g.B.x,x.g.B.y);});
 const v=R.ctx;for(let i=0;i<v.n;i++)if(v.cant[i])ext(v.cx(i),v.cy(i));
 const fs=2.3/k,pad=fs*8,W=x1-x0+2*pad,H=y1-y0+2*pad,T=P=>[P.x-x0+pad,y1-P.y+pad],r1=n=>Number(n).toFixed(1);
 let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r1(W)} ${r1(H)}" width="${r1(W*k)}mm" height="${r1(H*k)}mm" font-family="Arial">`;
 // beiral
 {let any=false,bx0=Infinity,bx1=-Infinity,by0=Infinity,by1=-Infinity;for(let i=0;i<v.n;i++)if(v.cant[i]){any=true;bx0=Math.min(bx0,v.cx(i)-v.s0/2);bx1=Math.max(bx1,v.cx(i)+v.s0/2);by0=Math.min(by0,v.cy(i)-v.s0/2);by1=Math.max(by1,v.cy(i)+v.s0/2);}
  if(any){const a=T({x:bx0,y:by1}),b=T({x:bx1,y:by0});s+=`<rect x="${r1(a[0])}" y="${r1(a[1])}" width="${r1(b[0]-a[0])}" height="${r1(b[1]-a[1])}" fill="#d9f2f2" stroke="#008a8a" stroke-width="${r1(.3/k)}" stroke-dasharray="${r1(2/k)} ${r1(1/k)}"/>`;}}
 // paredes
 I.forEach(x=>{const n=x.n,h=x.t/2,P=[[x.g.A.x+n[0]*h-x.g.u[0]*h,x.g.A.y+n[1]*h-x.g.u[1]*h],[x.g.B.x+n[0]*h+x.g.u[0]*h,x.g.B.y+n[1]*h+x.g.u[1]*h],[x.g.B.x-n[0]*h+x.g.u[0]*h,x.g.B.y-n[1]*h+x.g.u[1]*h],[x.g.A.x-n[0]*h-x.g.u[0]*h,x.g.A.y-n[1]*h-x.g.u[1]*h]].map(q=>T({x:q[0],y:q[1]}).map(r1).join(',')).join(' ');s+=`<polygon points="${P}" fill="#e6ebf1" stroke="#33414f" stroke-width="${r1(.25/k)}"/>`;});
 const txt=(x,y,t,o={})=>`<text x="${r1(x)}" y="${r1(y)}" font-size="${r1((o.fs||1)*fs)}" font-weight="${o.w||700}" fill="${o.c||'#102e4b'}" text-anchor="${o.a||'middle'}"${o.rot?` transform="rotate(-90 ${r1(x)} ${r1(y)})"`:''}>${esc(t)}</text>`;
 const lbl=b=>b.N+' · '+b.n+' Ø'+fd(b.d)+' c/ '+fd(b.s)+' · C = '+b.C;
 const pos='#c2410c',neg='#1d4ed8',sw=r1(.45/k);
 D.panels.forEach(P=>{const C0=T({x:P.x0+(P.x1-P.x0)*.3,y:P.y0+(P.y1-P.y0)*.72});
  if(which==='pos'){s+=txt(C0[0],C0[1]-fs*3.2,P.name,{fs:1.5,c:'#174a78'})+txt(C0[0],C0[1]-fs*1.8,'h='+fd(P.h)+' · '+fx(P.lxw/100)+' × '+fx(P.lyw/100)+' m',{w:400,c:'#5b6b7b',fs:.85});
   // barra horizontal (reta, de extremidade a extremidade menos cobrimento)
   const yb=P.y0+(P.y1-P.y0)*.38,xa=P.x0-P.sides[0].t+N(C().c),xb=P.x1+P.sides[1].t-N(C().c),A=T({x:xa,y:yb}),B=T({x:xb,y:yb});
   s+=`<line x1="${r1(A[0])}" y1="${r1(A[1])}" x2="${r1(B[0])}" y2="${r1(B[1])}" stroke="${pos}" stroke-width="${sw}"/>`+txt(A[0]+(B[0]-A[0])*.3,A[1]-fs*.5,lbl(P.barX));
   const xc=P.x0+(P.x1-P.x0)*.62,ya=P.y0-P.sides[2].t+N(C().c),yb2=P.y1+P.sides[3].t-N(C().c),A2=T({x:xc,y:ya}),B2=T({x:xc,y:yb2});
   s+=`<line x1="${r1(A2[0])}" y1="${r1(A2[1])}" x2="${r1(B2[0])}" y2="${r1(B2[1])}" stroke="${pos}" stroke-width="${sw}"/>`+txt(A2[0]-fs*.5,A2[1]+(B2[1]-A2[1])*.25,lbl(P.barY),{rot:1});
   // faixas de distribuição
   const D1=T({x:P.x0+(P.x1-P.x0)*.15,y:P.y0+4}),D2=T({x:P.x0+(P.x1-P.x0)*.15,y:P.y1-4});s+=`<line x1="${r1(D1[0])}" y1="${r1(D1[1])}" x2="${r1(D2[0])}" y2="${r1(D2[1])}" stroke="${pos}" stroke-width="${r1(.18/k)}" stroke-dasharray="${r1(1/k)} ${r1(.8/k)}"/>`;
   const E1=T({x:P.x0+4,y:P.y0+(P.y1-P.y0)*.15}),E2=T({x:P.x1-4,y:P.y0+(P.y1-P.y0)*.15});s+=`<line x1="${r1(E1[0])}" y1="${r1(E1[1])}" x2="${r1(E2[0])}" y2="${r1(E2[1])}" stroke="${pos}" stroke-width="${r1(.18/k)}" stroke-dasharray="${r1(1/k)} ${r1(.8/k)}"/>`;}
  else s+=txt(C0[0],C0[1],P.name,{fs:1.5,c:'#c9d3dd'});});
 if(which==='neg'){const leg=b=>Math.max(b.leg,4);
  D.bars.filter(b=>b.kind==='neg'||b.kind==='edge').forEach((b,idx)=>{const e=b.e||b,P=b.kind==='neg'?e.P:b.P,sd=b.kind==='neg'?e.s:b.side,c=N(C().c),horiz=sd.si>=2;// barra perpendicular à parede
   const frac=b.kind==='neg'?(e.kind==='cant'?.3:.5):.5,along=horiz?P.x0+(P.x1-P.x0)*frac:P.y0+(P.y1-P.y0)*frac;
   // eixo da parede
   const wx=sd.si===0?P.x0-sd.t/2:sd.si===1?P.x1+sd.t/2:null,wy=sd.si===2?P.y0-sd.t/2:sd.si===3?P.y1+sd.t/2:null,dirIn=sd.si===0?1:sd.si===1?-1:sd.si===2?1:-1;
   let a,bb;if(b.kind==='neg'&&e.kind==='cont'){a=(horiz?wy:wx)-e.ext;bb=(horiz?wy:wx)+e.ext;}else if(b.kind==='neg'){const outer=(horiz?wy:wx)-dirIn*(sd.t/2+e.depth-c);a=outer;bb=outer+dirIn*b.Ch;}else{const outer=(horiz?wy:wx)-dirIn*(sd.t/2-c);a=outer;bb=outer+dirIn*b.Ch;}
   const p1=horiz?T({x:along,y:a}):T({x:a,y:along}),p2=horiz?T({x:along,y:bb}):T({x:bb,y:along}),L=leg(b)*(horiz?1:1),off=horiz?[L,0]:[0,L];
   s+=`<path d="M${r1(p1[0]+off[0])},${r1(p1[1]+off[1])} L${r1(p1[0])},${r1(p1[1])} L${r1(p2[0])},${r1(p2[1])} L${r1(p2[0]+off[0])},${r1(p2[1]+off[1])}" fill="none" stroke="${b.kind==='edge'?'#0f766e':neg}" stroke-width="${sw}"/>`;
   const mx=(p1[0]+p2[0])/2,my=(p1[1]+p2[1])/2;s+=horiz?txt(mx-fs*.6,my,lbl(b),{rot:1,fs:.9,c:b.kind==='edge'?'#0f766e':'#102e4b'}):txt(mx,my-fs*.6,lbl(b),{fs:.9,c:b.kind==='edge'?'#0f766e':'#102e4b'});});}
 s+=txt(pad*.2,H-fs*.6,which==='pos'?'Barras positivas retas, de extremidade a extremidade das paredes de apoio, descontado o cobrimento · medidas em cm':'Negativos com ganchos (dobra = h − 2c) · comprimento a partir do eixo da parede ≈ 0,25 do maior vão · balanço: ≥ 1,5 × balanço para dentro',{a:'start',w:400,c:'#5b6b7b',fs:.8});
 return s+'</svg>';}
function tableQuadro(D){const t=['Laje','l<sub>x</sub> × l<sub>y</sub> (m)','λ','Bordas esq. · dir. · inf. · sup.','g<sub>k</sub> / q<sub>k</sub> (kN/m²)','p<sub>d</sub>','m<sub>x</sub> (horiz.)','m<sub>y</sub> (vert.)','Flecha / limite (cm)'];
 const rows=D.panels.map(P=>[P.name+' · h'+fd(P.h),fx(P.lxw/100)+' × '+fx(P.lyw/100),fx(P.lam),P.bc.map(b=>b==='C'?'eng':'ap').join(' · ')+(P.oneWay?' · 1 dir.':''),fx(P.gk)+' / '+fx(P.qk),fx(P.pd),fx(P.mpx),fx(P.mpy),fx(P.flecha)+' / '+fx(P.flim)+(P.flecha<=P.flim?' ✔':' ✖')]);
 const neg=D.edges.map(e=>[e.kind==='cont'?'Negativo '+e.P.name+'–'+(e.Q?.name||''):'Balanço '+e.P.name+(e.depth?' ('+e.depth+' cm)':''),fx(e.m)+' kN·m/m',e.bar?e.bar.N+' Ø'+fd(e.b.d)+' c/'+fd(e.b.s):'']);
 return '<table><thead><tr>'+t.map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(v=>'<td>'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table>'+
  (neg.length?'<table style="margin-top:2mm"><thead><tr><th>Negativo (compatibilizado)</th><th>m′<sub>d</sub></th><th>Armadura</th></tr></thead><tbody>'+neg.map(r=>'<tr>'+r.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table>':'')+
  '<p>Momentos de cálculo em kN·m/m, p<sub>d</sub> = 1,4·g<sub>k</sub> + 1,4·q<sub>k</sub>; placa por diferenças finitas (ν = '+fx(N(C().nu),1)+'), bordas eng = engastada (laje contínua ou balanço), ap = apoiada. Negativos compatibilizados: maior entre a média e 0,8 do maior; positivos corrigidos. Flecha: combinação quase permanente (ψ₂ = '+fx(N(C().psi2),1)+'), Branson e fluência (α<sub>f</sub> = '+fx(N(C().af))+'), limite l/250. fck '+fd(N(C().fck))+' MPa · CA-'+N(C().fyk)/10+' · cobrimento '+fd(N(C().c))+' cm.</p>'+(D.warn.length?'<p>'+D.warn.map(w=>'⚠ '+esc(w)).join('<br>')+'</p>':'');}
function tableAco(D){return '<table><thead><tr><th>N</th><th>Ø (mm)</th><th>Quant.</th><th>C unit. (cm)</th><th>C total (m)</th><th>Onde</th></tr></thead><tbody>'+D.rows.map(r=>`<tr><td>${r.N}</td><td>${fd(r.d)}</td><td>${r.n}</td><td>${r.C}</td><td>${fx(r.tot)}</td><td style="text-align:left">${esc(r.where)}</td></tr>`).join('')+'</tbody></table>'+
 '<table style="margin-top:2mm"><thead><tr><th>Bitola</th><th>Comp. (m)</th><th>Barras 12 m</th><th>Peso (kg)</th></tr></thead><tbody>'+[...D.byD].sort((a,b)=>a[0]-b[0]).map(([d,l])=>`<tr><td>Ø${fd(d)}</td><td>${fx(l)}</td><td>${Math.ceil(l/12)}</td><td>${fx(l*kgm(d))}</td></tr>`).join('')+'</tbody></table><p>Sem perdas. Positivos retos (sem dobra); negativos com ganchos.</p>';}

// ---------- 7. Pranchas: laje depois das elevações do pavimento que a apoia · escala própria das elevações
function levelGi(key){let gs=[];try{gs=window.levelGroups54?.()||[];}catch{}if(gs.length<2)return null;const i=gs.findIndex(g=>Number(g.value).toFixed(3)+'|'+(g.label||'')===key);return i>=0?i:null;}
function slabItems(availW,availH){let A;try{A=designAll();}catch(e){console.error('V82',e);return [];}const items=[],sc=N(plotSettings26().scale)||50,k=10/sc;
 for(const D of A.list){const key=A.R.LV[D.sl.sup].key,gi=levelGi(key)??D.sl.sup,nm='Laje maciça · '+D.sl.name;
  const p1=svgPanel26(nm+' · armação positiva',slabSVG(D,'pos',k)),p2=svgPanel26(nm+' · armação negativa',slabSVG(D,'neg',k));
  for(const p of [p1,p2])if(p){p.slab82=true;p.lv77=gi;items.push(p);}
  const tw=Math.min(availW,170);for(const[t,html]of[['Quadro das lajes · '+D.sl.name,'<h3>Quadro das lajes · '+esc(D.sl.name)+'</h3>'+tableQuadro(D)],['Tabela de aço da laje · '+D.sl.name,'<h3>Tabela de aço da laje · '+esc(D.sl.name)+'</h3>'+tableAco(D)]])items.push({title:t,w:tw,h:measureHTML26(html,tw-4)+13,html,slab82:true,lv77:gi});}
 return items;}
// escala das elevações: as paredes vêm de uma segunda montagem com a escala própria
function elevScale(){const v=N($('plotElevScale82')?.value);return v>0?v:0;}
try{const cp=collectPlot26;collectPlot26=function(...a){const es=elevScale(),ps=N($('plotScale26')?.value);let d;
 if(es&&ps&&es!==ps){d=cp.apply(this,a);const keep=d.items.filter(q=>!/^Parede \d+/.test(q.title||''));const inp=$('plotScale26'),old=inp.value;let walls=[];try{inp.value=es;const d2=cp.apply(this,a);walls=d2.items.filter(q=>/^Parede \d+/.test(q.title||''));walls.forEach(q=>q.scale82=es);}finally{inp.value=old;}
  // mantém a ordem: plantas e demais quadros, paredes no lugar das originais
  const first=d.items.findIndex(q=>/^Parede \d+/.test(q.title||''));const before=keep.slice(0,first<0?keep.length:first),after=first<0?[]:keep.slice(first);d.items=[...before,...walls,...after];}
 else d=cp.apply(this,a);
 try{const it=slabItems(d.availW,d.availH);if(it.length)d.items.push(...it);}catch(e){console.error('V82 pranchas de laje',e);}return d;};}catch(e){console.error('V82',e);}
try{const sh=plotSheetHTML26;plotSheetHTML26=function(sheet,...a){let html=sh.call(this,sheet,...a);const es=elevScale();if(es&&sheet?.items?.some(q=>q.scale82))html=html.replace(/(<h3 class="plotItemTitle26">Parede [^<]*<\/h3><p class="drawingScale29">Escala 1:)(\d+(?:[.,]\d+)?)/g,'$1'+es);return html;};}catch(e){console.error('V82',e);}
// campo na tela de pranchas e gravação junto com as configurações das pranchas
{const ps=$('plotScale26');if(ps&&!$('plotElevScale82')){const lab=document.createElement('label');lab.innerHTML='Escala das elevações 1:<input id="plotElevScale82" type="number" min="1" max="1000" placeholder="igual">';lab.title='Só as elevações das paredes. Vazio = mesma escala da planta (ex.: 75 para caber mais elevações por prancha).';ps.closest('label').after(lab);}}
try{const pset=plotSettings26;plotSettings26=function(...a){const s=pset.apply(this,a);s.elevScale=elevScale()||null;return s;};const rps=restorePlotSettings26;restorePlotSettings26=function(...a){const r=rps.apply(this,a);try{const v=state.plot26?.elevScale;if($('plotElevScale82'))$('plotElevScale82').value=v||'';}catch{}return r;};}catch(e){console.error('V82',e);}
try{const fp=plotFingerprint26;plotFingerprint26=function(...a){return fp.apply(this,a)+'|e'+elevScale()+'|l'+JSON.stringify(LD().S().cfg.slab82||{})+'|'+JSON.stringify(LD().S().lv)+JSON.stringify(LD().S().roof)+LD().S().items.length;};}catch{}

// ---------- 8. Janela “Lajes maciças” e critérios
function openSlabDlg(){let d=$('sl82dlg');if(!d){d=document.createElement('div');d.id='sl82dlg';d.className='noPrint';document.body.append(d);}d.style.display='flex';renderSlabDlg();}
function renderSlabDlg(){const d=$('sl82dlg');let A;try{A=designAll();}catch(e){d.innerHTML='<div class="bar77"><b>Lajes maciças</b><span class="sp77"></span><button type="button" id="sl82x">Fechar</button></div><p class="warn74">'+esc(e.message)+'</p>';$('sl82x').onclick=()=>d.style.display='none';return;}
 const body=A.list.length?A.list.map(D=>`<section class="sl82s"><h3>${esc(D.sl.name)}</h3><div class="sl82g"><div><h4>Armação positiva</h4>${slabSVG(D,'pos',0.18)}</div><div><h4>Armação negativa</h4>${slabSVG(D,'neg',0.18)}</div></div><div class="sl82g"><div><h4>Quadro das lajes</h4>${tableQuadro(D)}</div><div><h4>Tabela de aço</h4>${tableAco(D)}</div></div></section>`).join(''):'<p class="note" style="padding:20px">Nenhum painel de laje maciça. Em “Cargas (ações) → Laje e ações do pavimento” (ou num painel), escolha <b>Maciça</b> e informe a espessura.</p>';
 const c=C();d.innerHTML=`<div class="bar77"><b>Lajes maciças · cálculo e detalhamento</b><span class="note">por painel · NBR 6118 · para conferência do projetista</span><span class="sp77"></span><button type="button" id="sl82x">Fechar</button></div>
 <div class="sl82b"><aside class="sl82side"><h4>Critérios</h4>
 <label>fck (MPa)<input data-k="fck" value="${fd(c.fck)}"></label><label>Aço CA-<select data-k="fyk"><option value="500" ${N(c.fyk)===500?'selected':''}>50</option><option value="600" ${N(c.fyk)===600?'selected':''}>60</option></select></label>
 <label>Cobrimento (cm)<input data-k="c" value="${fd(c.c)}"></label><label>Bitolas (mm)<input data-k="bars" value="${esc(c.bars)}"></label><label>Espaçamento mínimo (cm)<input data-k="smin" value="${fd(c.smin)}"></label>
 <label><span>ψ₂ (flecha)</span><input data-k="psi2" value="${fx(c.psi2,1)}"></label><label><span>α<sub>f</sub> (fluência)</span><input data-k="af" value="${fx(c.af)}"></label>
 <button type="button" id="sl82ok">Recalcular</button><p class="note">As lajes maciças saem nas pranchas logo depois das elevações do pavimento que as apoia.</p></aside><div class="sl82main">${body}</div></div>`;
 $('sl82x').onclick=()=>d.style.display='none';$('sl82ok').onclick=()=>{d.querySelectorAll('[data-k]').forEach(el=>{const k=el.dataset.k;c[k]=k==='bars'?el.value:N(String(el.value).replace(',','.'));});plateCache.clear();LD().touch();renderSlabDlg();};}
{const box=$('ld77side');if(box){const b=document.createElement('button');b.type='button';b.className='';b.innerHTML='<span class="ico62">▤</span><span>Lajes maciças · cálculo e armação</span>';b.onclick=openSlabDlg;const pl=[...box.querySelectorAll('button')].find(x=>/Planta de cargas/.test(x.textContent));if(pl)pl.after(b);else box.append(b);}}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('sl82dlg')?.style.display==='flex')$('sl82dlg').style.display='none';});
const st=document.createElement('style');st.textContent=`#sl82dlg{position:fixed;inset:0;z-index:10040;background:#eef3f8;display:none;flex-direction:column}
#sl82dlg .bar77{display:flex;gap:10px;align-items:center;padding:10px 14px;background:#102e4b;color:#fff}#sl82dlg .bar77 .note{color:#c9dcef}#sl82dlg .sp77{flex:1}
#sl82dlg .sl82b{flex:1;display:grid;grid-template-columns:230px minmax(0,1fr);gap:12px;padding:12px;min-height:0}
#sl82dlg .sl82side{background:#fff;border:1px solid #cfdceb;border-radius:12px;padding:10px;overflow:auto;font-size:13px}#sl82dlg .sl82side label{display:flex;flex-direction:column;gap:2px;font-weight:600;margin:6px 0}
#sl82dlg .sl82main{overflow:auto}#sl82dlg .sl82s{background:#fff;border:1px solid #cfdceb;border-radius:12px;padding:10px 14px;margin-bottom:12px}
#sl82dlg .sl82g{display:grid;grid-template-columns:1fr 1fr;gap:14px}#sl82dlg svg{width:100%;height:auto;max-height:60vh}
#sl82dlg table{border-collapse:collapse;font-size:12px;width:100%}#sl82dlg th{background:#174a78;color:#fff;padding:4px}#sl82dlg td{border:1px solid #d5e1ec;padding:3px 5px;text-align:center}
#sl82dlg h4{margin:6px 0;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#102e4b}#sl82dlg p{font-size:12px;color:#33414f}
@media(max-width:900px){#sl82dlg .sl82g,#sl82dlg .sl82b{grid-template-columns:1fr}}`;document.head.append(st);
})();
