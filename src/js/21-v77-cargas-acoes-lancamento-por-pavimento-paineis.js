// V77 — Cargas (ações): lançamento por pavimento, painéis de laje (treliçada, maciça, alveolar), peso próprio das paredes,
// distribuição da laje para as paredes e planta de cargas acumulada na base. Nomenclatura NBR 8681 / NBR 6120:2019.
(function(){
'use strict';
const N=v=>Number(v),L68=()=>window.level68,GEO=()=>window.geo74;
const curPage=()=>num($('page').value)||1;
const fx=(v,d=2)=>(Number.isFinite(v)?v:0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const pnum=v=>{if(v===''||v==null)return NaN;return N(String(v).replace(',','.'));};
const valOfKey=k=>Number(String(k).split('|')[0])||0;

// ---------- 1. Dados
const DEF={cfg:{unit:'kN',tf:9.80665,gG:1.4,gQ:1.4,mode:'iso',mat:'concreto',wpm:{},rev:1.5,gRev:19,grout:true,gGr:22,strip:0,plot:true,show:true,infl:true,tgt:'piso'},
 lv:{},roof:{on:true,type:'tr8',h:12,pp:null,dir:'auto',edge:'auto',g:1.0,q:1.0},items:[]};
const LVDEF={type:'tr8',h:12,pp:null,dir:'auto',edge:'auto',g:1.0,q:1.5};
function S(){state.loads77??=JSON.parse(JSON.stringify(DEF));const s=state.loads77;s.cfg??={};for(const k in DEF.cfg)if(s.cfg[k]===undefined)s.cfg[k]=JSON.parse(JSON.stringify(DEF.cfg[k]));s.lv??={};s.roof??={};for(const k in DEF.roof)if(s.roof[k]===undefined)s.roof[k]=DEF.roof[k];s.items??=[];if(!s._mig81){migType(s.roof);for(const k in s.lv)migType(s.lv[k]);for(const it of s.items)if(it.kind==='panel')migType(it);s._mig81=1;}if(!s._mig95){if(N(s.roof.dir)===0)s.roof.dir='auto';for(const k in s.lv)if(s.lv[k]&&N(s.lv[k].dir)===0)s.lv[k].dir='auto';s._mig95=1;}return s;}
let pkHook=null;let dirty=1;const touch=()=>{try{cowCheck();}catch(e){console.error('V102',e);}try{baseCheck();}catch(e){console.error('V103',e);}dirty++;cache.clear();};const cache=new Map();
window.loads77touch=touch;

// tipos de laje · peso próprio típico (kN/m²) — editável; confira com o fabricante
// treliçada: TR = altura da treliça; h = altura total da laje (treliça + capa); peso próprio típico com enchimento cerâmico
const TYPES={mac:{n:'Maciça'},tr8:{n:'Treliçada TR8',h:12,pp:1.6},tr12:{n:'Treliçada TR12',h:16,pp:2.0},tr16:{n:'Treliçada TR16',h:20,pp:2.4},tr20:{n:'Treliçada TR20',h:25,pp:2.9},
 sem:{n:'Sem laje / vão aberto'},alv:{n:'Alveolar (protendida)',tab:[[12,2.0],[15,2.4],[20,2.9],[26.5,3.6],[32,4.2]]}};
const isTR=t=>/^tr\d+$/.test(t||'');
const uniOf=p=>p.type==='alv'||(isTR(p.type)&&!p.bi);
const hOf=p=>isTR(p.type)?TYPES[p.type].h:N(p.h);
function ppDefault(type,h,bi){if(type==='sem')return 0;if(type==='mac')return 25*(N(h)||10)/100;if(isTR(type))return TYPES[type].pp*(bi?1.1:1);h=N(h)||15;const t=TYPES.alv.tab;if(h<=t[0][0])return t[0][1]*h/t[0][0];for(let i=1;i<t.length;i++)if(h<=t[i][0]){const[a,pa]=t[i-1],[b,pb]=t[i];return pa+(pb-pa)*(h-a)/(b-a);}const[a,pa]=t.at(-1);return pa*h/a;}
const ppOf=p=>Number.isFinite(N(p.pp))&&p.pp!==null&&p.pp!==''&&N(p.pp)>0?N(p.pp):ppDefault(p.type,p.h,p.bi);
const typeTxt=p=>isTR(p.type)?TYPES[p.type].n+' (h='+TYPES[p.type].h+' cm)'+(p.bi?' bidirecional':''):(TYPES[p.type]?.n||p.type)+' h='+fx(N(p.h),0)+' cm';
const shortTxt=p=>p.type==='sem'?'Vão aberto':isTR(p.type)?TYPES[p.type].n.replace('Treliçada ','')+(p.bi?' bidir.':''):(TYPES[p.type]?.n||'').replace(' (protendida)','')+' h'+fx(N(p.h),0);
// projetos da V77–V80: treliçada por altura → TR
function migType(o){if(!o||(o.type!=='tre'&&o.type!=='treb'))return;const h=N(o.h)||12;o.bi=o.type==='treb'||!!o.bi;o.type=h<=13?'tr8':h<=17?'tr12':h<=22?'tr16':'tr20';o.h=TYPES[o.type].h;}

// peso das paredes (bloco + argamassa de assentamento), kN/m² de parede
const WPM={concreto:{9:1.2,11.5:1.4,14:1.65,19:2.1},ceramico:{9:0.95,11.5:1.1,14:1.35,19:1.75}};
function wpm(t){const c=S().cfg,o=N(c.wpm?.[t]);if(o>0)return o;const tab=WPM[c.mat]||WPM.concreto;if(tab[t])return tab[t];return tab[14]*t/14;}
const cellA=t=>t>=17?0.021:t>=12?0.013:0.009;   // m² de furo grauteado
const chanA=t=>t>=17?0.014:t>=12?0.0095:0.006;   // m² de graute da canaleta
const revPM=()=>{const c=S().cfg;return 2*N(c.rev)*N(c.gRev)/100;};

// unidades
const U={get tf(){return S().cfg.unit==='tf';},f:v=>U.tf?v/S().cfg.tf:v,b:v=>U.tf?v*S().cfg.tf:v,
 F:()=>U.tf?'tf':'kN',L:()=>U.tf?'tf/m':'kN/m',A:()=>U.tf?'tf/m²':'kN/m²'};

// ---------- 2. Geometria por nível
function lvDef(key){const s=S();return {...LVDEF,...(s.lv[key]||{})};}
// laje do piso térreo (pavimento mais baixo): radier ou contrapiso sobre o solo
function gDef(key){const s=S();return {...LVDEF,type:'mac',h:15,base:'sem',g:1.0,q:1.5,...(s.lv[key]||{})};}
const f2v=v=>(v>=0?'+':'')+Number(v).toFixed(2).replace('.',',')+' m';
// V103 — a laje leva o nome da cota dela e de qual pavimento ela é o topo (ex.: Laje +2,90 m · topo do Térreo)
function slabName(key){const[v,l]=String(key).split('|');let bl='';try{const ks=L68()?.levelKeys?.()||[],i=ks.indexOf(key);if(i>0){const[bv,bb]=ks[i-1].split('|');bl=bb||('nível '+f2v(Number(bv)));}}catch{}return 'Laje '+f2v(Number(v))+(bl?' · topo do '+bl:'')+(l?' (piso do '+l+')':'');}
function roofName(l){if(!l)return 'Laje de cobertura';const t=N(GEO()?.opt3?.t)||10,rep=Math.max(1,N(l.rep)||1),top=valOfKey(l.key)+rep*(N(l.H)+t)/100;return 'Laje de cobertura ('+f2v(top)+')';}
const baseTxt=b=>b==='radier'?'radier':b==='sem'?'sem laje (só o piso)':'contrapiso sobre o solo';
function wInfo(w){const g=GEO().wallWorld(w),t=N(w.width)||14,L=g.L,nb=Math.max(1,Math.ceil(L/5)),db=L/nb,k=N(w.length)>0?L/N(w.length):1;
 const ops=(w.openings||[]).map(o=>{const r=o.real73||o;return {a:N(o.start)*k,b:(N(o.start)+N(o.width))*k,bot:N(r.bottom??o.bottom)||0,h:N(r.height??o.height)||0};}).filter(o=>o.b>o.a+.5);
 const solid=new Uint8Array(nb);for(let b=0;b<nb;b++){const s=(b+.5)*db;solid[b]=ops.some(o=>s>o.a&&s<o.b)?0:1;}
 return {w,g,t,L,nb,db,ops,solid,H:N(w.height)||280,n:[-g.u[1],g.u[0]]};}
function levels(){const g=GEO();if(!g)return [];const lv=g.levelsData();return lv.map((l,i)=>({...l,i,I:l.walls.map(wInfo)}));}
const zeros=I=>I.map(x=>({g:new Float64Array(x.nb),q:new Float64Array(x.nb)}));
const add2=(A,B)=>A.forEach((a,j)=>{for(let b=0;b<a.g.length;b++){a.g[b]+=B[j].g[b];a.q[b]+=B[j].q[b];}});
const binOf=(I,s)=>Math.max(0,Math.min(I.nb-1,Math.floor(s/I.db)));
const proj=(I,P)=>(P.x-I.g.A.x)*I.g.u[0]+(P.y-I.g.A.y)*I.g.u[1];
const segD=(P,A,B)=>GEO().segDist(P,A,B);
function pageDir(pg,dir){const W=window.world74,a=W(pg,{x:0,y:0}),b=W(pg,dir===90?{x:0,y:1000}:{x:1000,y:0});const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1;return {x:dx/l,y:dy/l};}
const worldPts=it=>(it.pts||[]).map(P=>window.world74(N(it.page),P));
function polyOf(it){const P=worldPts(it);if(it.kind==='rect'&&P.length===2){const a=it.pts[0],b=it.pts[1];return [a,{x:b.x,y:a.y},b,{x:a.x,y:b.y}].map(Q=>window.world74(N(it.page),Q));}return P;}
function inPoly(P,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>P.y)!==(b.y>P.y)&&P.x<(b.x-a.x)*(P.y-a.y)/((b.y-a.y)||1e-9)+a.x)c=!c;}return c;}
const keyOfPage=pg=>L68()?.keyOf?L68().keyOf(N(pg)):'0.000|';
// V92: a ação pode ser lançada vendo as paredes de baixo e pertencer à laje do nível de cima
const itemKey=it=>it.slab92||keyOfPage(it.page);
function itemsOf(key,tgt){return S().items.filter(it=>itemKey(it)===key&&(it.tgt||'piso')===tgt&&it.rep102==null);}
// V102 — laje própria por repetição do pavimento-tipo: rep102 = nº do pavimento (2…R); sem rep102 = igual ao tipo
const ownId=(key,tgt,j)=>key+'|'+tgt+'|'+j;
function isOwn(key,tgt,j){return !!(j&&S().own102?.[ownId(key,tgt,j)]);}
function ownItems(key,tgt,j){return S().items.filter(it=>itemKey(it)===key&&(it.tgt||'piso')===tgt&&it.rep102===j);}
function itemsRep(key,tgt,j){return isOwn(key,tgt,j)?ownItems(key,tgt,j):itemsOf(key,tgt);}
function ownList(key,tgt){const o=S().own102||{},pre=key+'|'+tgt+'|';return Object.keys(o).filter(k=>o[k]&&k.startsWith(pre)).map(k=>N(k.slice(pre.length))).filter(Boolean).sort((a,b)=>a-b);}

// ---------- 3. Laje: painéis e distribuição para as paredes de apoio
// supp: nível cujas paredes apoiam a laje · def: laje padrão · items: ações e painéis lançados · pg: planta de referência (direção das vigotas)
function prepSlab(supp,def,items,pg){const geo=GEO();if(!supp||!supp.walls.length)return null;
 // V99 — vigas: fecham o contorno da laje, recebem a carga do painel e passam para as paredes onde apoiam
 const BMi=items.filter(it=>it.kind==='beam'&&it.sub==='viga'&&(it.pts||[]).length>=2);
 const Sx=geo.slabCells([...supp.walls,...BMi.map(it=>({line:it.pts,page:it.page,width:N(it.viga?.b)||15,length:1}))]);if(!Sx)return null;
 const edges=items.filter(it=>it.kind==='edge').map(polyOf).filter(p=>p.length>=3);
 let bx0=Sx.minX,by0=Sx.minY,bx1=Sx.minX+Sx.nx*Sx.C,by1=Sx.minY+Sx.ny*Sx.C;for(const pl of edges)for(const P of pl){bx0=Math.min(bx0,P.x-20);by0=Math.min(by0,P.y-20);bx1=Math.max(bx1,P.x+20);by1=Math.max(by1,P.y+20);}
 const I=supp.I,s0=10,X0=bx0,Y0=by0,nx=Math.ceil((bx1-bx0)/s0),ny=Math.ceil((by1-by0)/s0),n=nx*ny;if(n>3e6)return null;
 const inS=(x,y)=>{const ix=Math.floor((x-X0)/Sx.C),iy=Math.floor((y-Y0)/Sx.C);return ix>=0&&iy>=0&&ix<Sx.nx&&iy<Sx.ny&&Sx.in(iy*Sx.nx+ix);};
 const cx=i=>X0+(i%nx+.5)*s0,cy=i=>Y0+(Math.floor(i/nx)+.5)*s0,cell=P=>{const ix=Math.floor((P.x-X0)/s0),iy=Math.floor((P.y-Y0)/s0);return ix>=0&&iy>=0&&ix<nx&&iy<ny?iy*nx+ix:-1;};
 const inside=new Uint8Array(n),bar=new Int32Array(n),bd=new Float32Array(n).fill(1e9);const cant=new Uint8Array(n);for(let i=0;i<n;i++){inside[i]=inS(cx(i),cy(i))?1:0;if(!inside[i]&&edges.length){const P={x:cx(i),y:cy(i)};if(edges.some(pl=>inPoly(P,pl))){inside[i]=1;cant[i]=1;}}}
 // V97 — aberturas na laje (escada, alçapão, shaft): sem laje e sem carga de laje
 {const holes=items.filter(it=>it.kind==='hole').map(polyOf).filter(p=>p.length>=3);if(holes.length)for(let i=0;i<n;i++)if(inside[i]){const P={x:cx(i),y:cy(i)};if(holes.some(pl=>inPoly(P,pl)))inside[i]=0;}}
 const raster=(A,B,hw,ext,val)=>{const L=Math.hypot(B.x-A.x,B.y-A.y)||1e-9,u={x:(B.x-A.x)/L,y:(B.y-A.y)/L},m=hw+ext;
  const x0=Math.max(0,Math.floor((Math.min(A.x,B.x)-m-X0)/s0)),x1=Math.min(nx-1,Math.floor((Math.max(A.x,B.x)+m-X0)/s0)),y0=Math.max(0,Math.floor((Math.min(A.y,B.y)-m-Y0)/s0)),y1=Math.min(ny-1,Math.floor((Math.max(A.y,B.y)+m-Y0)/s0));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*nx+x,px=cx(i)-A.x,py=cy(i)-A.y,s=px*u.x+py*u.y,q=Math.abs(-px*u.y+py*u.x);if(s<-ext||s>L+ext||q>hw)continue;
   if(val>0){if(q<bd[i]){bd[i]=q;bar[i]=val;}}else if(bar[i]===0)bar[i]=val;}};
 I.forEach((x,j)=>raster(x.g.A,x.g.B,Math.max(x.t/2,s0*.75),x.t/2,j+1));
 for(const it of items.filter(it=>it.kind==='div')){const P=worldPts(it);for(let k=0;k+1<P.length;k++)raster(P[k],P[k+1],s0*.75,s0,-1);}
 const BM=BMi.map(it=>{let P;try{P=window.beamEnds97?window.beamEnds97(it,I):null;}catch{}P=P||worldPts(it);const A=P[0],B=P[1],L=Math.hypot(B.x-A.x,B.y-A.y)||1,u={x:(B.x-A.x)/L,y:(B.y-A.y)/L},t=N(it.viga?.b)||15;
  const near=Q=>{let bj=-1,bv=Infinity;I.forEach((x,j)=>{const d=segD(Q,x.g.A,x.g.B)-x.t/2;if(d<bv){bv=d;bj=j;}});return bj;};return {it,A,B,L,u,t,eA:near(A),eB:near(B)};});
 BM.forEach(b=>raster(b.A,b.B,Math.max(b.t/2,s0*.75),0,-1));
 // painéis = regiões contínuas da laje limitadas por paredes e linhas divisórias
 const comp=new Int32Array(n).fill(-1);let nc=0;const cw=[];
 for(let i=0;i<n;i++){if(!inside[i]||bar[i]!==0||comp[i]>=0)continue;const id=nc++,st=[i];comp[i]=id;const ws=new Set();
  while(st.length){const k=st.pop(),x=k%nx,y=(k-x)/nx;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=nx||Y>=ny)continue;const m=Y*nx+X;if(bar[m]>0)ws.add(bar[m]-1);if(!inside[m]||bar[m]!==0||comp[m]>=0)continue;comp[m]=id;st.push(m);}}
  cw.push([...ws]);}
 // continuidade (laje dos dois lados da parede) → borda engastada na maciça
 const cont=I.map(x=>{let both=0,k=0;for(const f of [.25,.5,.75]){const M={x:x.g.A.x+x.g.u[0]*x.L*f,y:x.g.A.y+x.g.u[1]*x.L*f},d=x.t/2+25;const a=cell({x:M.x+x.n[0]*d,y:M.y+x.n[1]*d}),b=cell({x:M.x-x.n[0]*d,y:M.y-x.n[1]*d});k++;if(a>=0&&b>=0&&comp[a]>=0&&comp[b]>=0)both++;}return both>=2;});
 // propriedades por painel
 const props=new Array(nc).fill(null),seeds=new Array(nc).fill(null);
 const findComp=P=>{let c=cell(P);if(c>=0&&comp[c]>=0)return comp[c];const x0=Math.floor((P.x-X0)/s0),y0=Math.floor((P.y-Y0)/s0);for(let r=1;r<=4;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const X=x0+dx,Y=y0+dy;if(X<0||Y<0||X>=nx||Y>=ny)continue;const m=Y*nx+X;if(comp[m]>=0)return comp[m];}return -1;};
 for(const it of items.filter(it=>it.kind==='panel')){const P=worldPts(it)[0];if(!P)continue;const c=findComp(P);if(c<0){it._miss=true;continue;}it._miss=false;const o={};for(const k of ['type','h','pp','dir','edge','g','q','bi','arm'])if(it[k]!==null&&it[k]!==undefined&&it[k]!==''&&it[k]!=='inherit')o[k]=it[k];
  if(o.type&&o.type!==def.type&&o.pp===undefined)o.pp=null;if(o.type&&!isTR(o.type)&&o.h===undefined)o.h=def.type==='mac'?def.h:10;const pr={...def,...o,item:it};if(isTR(pr.type))pr.h=TYPES[pr.type].h;if(o.type&&isTR(o.type)&&o.bi===undefined)pr.bi=false;props[c]=pr;seeds[c]=P;}
 const dirs={0:pageDir(pg,0),90:pageDir(pg,90)};
 // V95.1 — vigotas no vão menor de cada painel (automático), a não ser que o projetista escolha ↔ ou ↕
 {const isA=v=>v==null||v===''||v==='auto';const ext=new Map();for(let i=0;i<n;i++){const c=comp[i];if(c<0)continue;const X=cx(i),Y=cy(i),a=X*dirs[0].x+Y*dirs[0].y,b=X*dirs[90].x+Y*dirs[90].y;let e=ext.get(c);if(!e){e=[a,a,b,b];ext.set(c,e);}if(a<e[0])e[0]=a;if(a>e[1])e[1]=a;if(b<e[2])e[2]=b;if(b>e[3])e[3]=b;}
  for(let c=0;c<nc;c++){const pr=props[c],base=pr||def;if(!uniOf(base))continue;const it=pr?.item;const auto=it?(it.dir==='auto'||(isA(it.dir)&&isA(def.dir))):isA(def.dir);if(!auto)continue;const e=ext.get(c);if(!e)continue;props[c]={...base,dir:(e[1]-e[0])<=(e[3]-e[2])?0:90,dirAuto:true};}}
 const propOf=c=>c>=0&&props[c]?props[c]:def;
 // regra de destino de cada ponto da laje
 function nearest(P,cands,wt,nb){let best=-1,bv=Infinity;for(const j of cands){const x=I[j];const d=segD(P,x.g.A,x.g.B)/(wt?wt(j):1);if(d<bv){bv=d;best=j;}}if(!nb)BM.forEach((b,k)=>{const d=segD(P,b.A,b.B);if(d<bv){bv=d;best=-10-k;}});return best;}
 const all=I.map((_,j)=>j);
 function pick(P,c,cn){const p=propOf(c),cands=c>=0&&cw[c]?.length?cw[c]:all;
  if(cn)return nearest(P,cands,null,true);// balanço: vai para a parede onde engasta
  if(uniOf(p)){const d=dirs[N(p.dir)===90?90:0];const strip=N(S().cfg.strip)||0;
   if(strip>0){let bj=-1,bv=Infinity;for(const j of cands){const x=I[j];if(Math.abs(x.g.u[0]*d.y-x.g.u[1]*d.x)>.3)continue;const dd=segD(P,x.g.A,x.g.B)-x.t/2;if(dd<=strip&&dd<bv){bv=dd;bj=j;}}if(bj>=0)return bj;}
   let lp=Infinity,ln=Infinity,jp=-1,jn=-1;
   for(const j of cands){const x=I[j],u={x:x.g.u[0],y:x.g.u[1]},den=d.x*u.y-d.y*u.x;if(Math.abs(den)<.25)continue;const wx=x.g.A.x-P.x,wy=x.g.A.y-P.y,lam=(wx*u.y-wy*u.x)/den,mu=(wx*d.y-wy*d.x)/den;if(mu<-x.t/2-2||mu>x.L+x.t/2+2)continue;if(lam>0&&lam<lp){lp=lam;jp=j;}if(lam<0&&-lam<ln){ln=-lam;jn=j;}}
   BM.forEach((b,k)=>{const den=d.x*b.u.y-d.y*b.u.x;if(Math.abs(den)<.25)return;const wx=b.A.x-P.x,wy=b.A.y-P.y,lam=(wx*b.u.y-wy*b.u.x)/den,mu=(wx*d.y-wy*d.x)/den;if(mu<-2||mu>b.L+2)return;if(lam>0&&lam<lp){lp=lam;jp=-10-k;}if(lam<0&&-lam<ln){ln=-lam;jn=-10-k;}});
   if(jp!==-1||jn!==-1)return lp<=ln?jp:jn;return nearest(P,cands);}
  const eng=p.type==='mac'&&p.edge!=='apoiada';return nearest(P,cands,eng?(j=>cont[j]?1.732:1):null);}
 const assign=new Int32Array(n).fill(-1);
 for(let i=0;i<n;i++){if(!inside[i])continue;if(bar[i]>0){assign[i]=bar[i]-1;continue;}if(comp[i]>=0&&propOf(comp[i]).type==='sem')continue;const P={x:cx(i),y:cy(i)};assign[i]=pick(P,comp[i],cant[i]);}
 const regions=items.filter(it=>it.kind==='rect'||it.kind==='poly').map(it=>({it,poly:polyOf(it)})).filter(r=>r.poly.length>=3);
 function pointTo(P){const c=cell(P);for(let j=0;j<I.length;j++){const x=I[j];if(segD(P,x.g.A,x.g.B)<=x.t/2+2)return j;}for(let k=0;k<BM.length;k++){const b=BM[k];if(segD(P,b.A,b.B)<=b.t/2+2)return -10-k;}return pick(P,c>=0?comp[c]:findComp(P),(c>=0&&cant[c])||cantAt(P));}
 // momento no engaste do balanço: força × distância até a face da parede
 const cantAt=P=>{if(!edges.length||inS(P.x,P.y))return false;return edges.some(pl=>inPoly(P,pl)||pl.some((a,k)=>segD(P,a,pl[(k+1)%pl.length])<=6));};
 const arm=(j,P)=>{const x=I[j];return Math.max(0,segD(P,x.g.A,x.g.B)-x.t/2)/100;};
 // distribui: add(j,s,G,Q)
 // código ≤ -10 = viga k: divide entre as paredes das duas pontas (alavanca)
 function split(code,P){if(code>=0)return [[code,1,P]];const b=BM[-10-code];if(!b)return [];const s=Math.max(0,Math.min(b.L,(P.x-b.A.x)*b.u.x+(P.y-b.A.y)*b.u.y)),f=s/b.L,out=[];if(b.eA>=0)out.push([b.eA,1-f,b.A]);if(b.eB>=0)out.push([b.eB,f,b.B]);return out;}
 function load(add,opt={}){const A=s0*s0/1e4,st={area:0,G:0,Q:0,cant:0,mom:new Map(),beam:BM.map(()=>({G:0,Q:0}))};
  const put=(code,P,G,Q)=>{if(code<=-10&&st.beam[-10-code]){st.beam[-10-code].G+=G;st.beam[-10-code].Q+=Q;}for(const[j,f,R]of split(code,P))if(f>0)add(j,proj(I[j],R),G*f,Q*f);};
  const mom=(j,P,G,Q)=>{const d=arm(j,P);let m=st.mom.get(j);if(!m){m={G:0,Q:0,s0:Infinity,s1:-Infinity,area:0};st.mom.set(j,m);}m.G+=G*d;m.Q+=Q*d;const s=proj(I[j],P);m.s0=Math.min(m.s0,s);m.s1=Math.max(m.s1,s);};
  if(!opt.itemsOnly)for(let i=0;i<n;i++){if(!inside[i]||assign[i]===-1)continue;const P={x:cx(i),y:cy(i)},p=propOf(comp[i]);let pp=p.base==='solo'?0:ppOf(p),g=N(p.g)||0,q=N(p.q)||0;
   for(const r of regions){if(!inPoly(P,r.poly))continue;const rg=N(r.it.g)||0,rq=N(r.it.q)||0;if(r.it.mode==='add'){g+=rg;q+=rq;}else{g=rg;q=rq;}}
   const j=assign[i],G=(pp+g)*A,Q=q*A;st.area+=A;st.G+=G;st.Q+=Q;if(j<0){put(j,P,G,Q);continue;}add(j,proj(I[j],P),G,Q);if(cant[i]){st.cant+=A;mom(j,P,G,Q);st.mom.get(j).area+=A;}}
  for(const it of items){if(it.kind==='line'){const P=worldPts(it);for(let k=0;k+1<P.length;k++){const a=P[k],b=P[k+1],L=Math.hypot(b.x-a.x,b.y-a.y),m=Math.max(1,Math.ceil(L/5)),dl=L/m/100;for(let t=0;t<m;t++){const Q={x:a.x+(b.x-a.x)*(t+.5)/m,y:a.y+(b.y-a.y)*(t+.5)/m},j=pointTo(Q);if(j===-1)continue;if(j<0){put(j,Q,(N(it.g)||0)*dl,(N(it.q)||0)*dl);st.G+=(N(it.g)||0)*dl;st.Q+=(N(it.q)||0)*dl;continue;}add(j,proj(I[j],Q),(N(it.g)||0)*dl,(N(it.q)||0)*dl);{if(cantAt(Q))mom(j,Q,(N(it.g)||0)*dl,(N(it.q)||0)*dl);}st.G+=(N(it.g)||0)*dl;st.Q+=(N(it.q)||0)*dl;}}}
   else if(it.kind==='point'){const P=worldPts(it)[0];if(!P)continue;const j=pointTo(P);if(j===-1)continue;if(j<0){put(j,P,N(it.g)||0,N(it.q)||0);st.G+=N(it.g)||0;st.Q+=N(it.q)||0;continue;}add(j,proj(I[j],P),N(it.g)||0,N(it.q)||0);{if(cantAt(P))mom(j,P,N(it.g)||0,N(it.q)||0);}st.G+=N(it.g)||0;st.Q+=N(it.q)||0;}}
  return st;}
 // carga por m² de uma célula (para o cálculo das lajes): gₖ inclui o peso próprio
 function cellGQ(i){const P={x:cx(i),y:cy(i)},p=propOf(comp[i]);let pp=p.base==='solo'?0:ppOf(p),g=N(p.g)||0,q=N(p.q)||0;for(const r of regions){if(!inPoly(P,r.poly))continue;const rg=N(r.it.g)||0,rq=N(r.it.q)||0;if(r.it.mode==='add'){g+=rg;q+=rq;}else{g=rg;q=rq;}}return {g:pp+g,q};}
 return {I,s0,nx,ny,n,cx,cy,inside,assign,comp,props,seeds,cont,def,dirs,load,pointTo,split,BM,nc,cant,cw,cellGQ,cell,items,propOf,bar,X0,Y0};}

// ---------- 4. Acúmulo de cima para baixo
function ownLoad(x,arr,f){if(!f)return;const c=S().cfg,pm=wpm(x.t)+revPM();
 for(let b=0;b<x.nb;b++){const s=(b+.5)*x.db;let h=x.H;for(const o of x.ops)if(s>o.a&&s<o.b)h-=Math.min(o.h,x.H);arr.g[b]+=Math.max(0,h)/100*x.db/100*pm*f;}
 if(c.grout){const gg=N(c.gGr)||22,ca=cellA(x.t),ch=chanA(x.t);for(const s of [0,x.L,...x.ops.flatMap(o=>[o.a,o.b])])arr.g[binOf(x,s)]+=ca*x.H/100*gg*f;
  for(let b=0;b<x.nb;b++)arr.g[b]+=ch*x.db/100*gg*f;
  for(const o of x.ops){const k=o.bot>1?2:1;for(let b=0;b<x.nb;b++){const s=(b+.5)*x.db;if(s>o.a-30&&s<o.b+30)arr.g[b]+=ch*x.db/100*gg*k*f;}}}}
function ownParts(x){const c=S().cfg;let area=0;for(let b=0;b<x.nb;b++){const s=(b+.5)*x.db;let h=x.H;for(const o of x.ops)if(s>o.a&&s<o.b)h-=Math.min(o.h,x.H);area+=Math.max(0,h)/100*x.db/100;}
 let gr=0;if(c.grout){const gg=N(c.gGr)||22;gr=(2+2*x.ops.length)*cellA(x.t)*x.H/100*gg+chanA(x.t)*x.L/100*gg+x.ops.reduce((s,o)=>s+chanA(x.t)*gg*(o.b-o.a+60)/100*(o.bot>1?2:1),0);}
 return {area,blocos:area*wpm(x.t),rev:area*revPM(),graute:gr};}
// aberturas: a carga sobre o vão vai para os trechos de parede dos dois lados (verga)
function openings(x,a){let b=0;while(b<x.nb){if(x.solid[b]){b++;continue;}let e=b;while(e+1<x.nb&&!x.solid[e+1])e++;let G=0,Q=0;for(let k=b;k<=e;k++){G+=a.g[k];Q+=a.q[k];a.g[k]=0;a.q[k]=0;}const l=b-1,r=e+1<x.nb?e+1:-1;
 // apoio da verga: espalha em até 60 cm de parede de cada lado
 const side=(k0,dir,G,Q)=>{const ks=[];for(let k=k0;k>=0&&k<x.nb&&x.solid[k]&&ks.length*x.db<60;k+=dir)ks.push(k);for(const k of ks){a.g[k]+=G/ks.length;a.q[k]+=Q/ks.length;}};
 if(l>=0&&r>=0){side(l,-1,G/2,Q/2);side(r,1,G/2,Q/2);}else if(l>=0)side(l,-1,G,Q);else if(r>=0)side(r,1,G,Q);else{a.g[b]+=G;a.q[b]+=Q;}b=e+1;}}
// grupos de paredes: trechos entre aberturas ligados pelos encontros
function groupsOf(lvl){if(lvl._groups)return lvl._groups;const piers=[];lvl.I.forEach((x,j)=>{let b=0;while(b<x.nb){if(!x.solid[b]){b++;continue;}let e=b;while(e+1<x.nb&&x.solid[e+1])e++;piers.push({j,b0:b,b1:e});b=e+1;}});
 const par=piers.map((_,i)=>i),fd=i=>par[i]===i?i:(par[i]=fd(par[i]));const P=(x,s)=>({x:x.g.A.x+x.g.u[0]*s,y:x.g.A.y+x.g.u[1]*s});
 piers.forEach((p,i)=>{const x=lvl.I[p.j],E=[P(x,p.b0*x.db),P(x,(p.b1+1)*x.db)];piers.forEach((q,k)=>{if(k<=i||q.j===p.j)return;const y=lvl.I[q.j],A=P(y,q.b0*y.db),B=P(y,(q.b1+1)*y.db),tol=(x.t+y.t)/2+3;
  const F=[A,B];if(E.some(e=>segD(e,A,B)<=tol)||F.some(f=>segD(f,E[0],E[1])<=tol))par[fd(i)]=fd(k);});});
 const g=new Map();piers.forEach((p,i)=>{const r=fd(i);if(!g.has(r))g.set(r,[]);g.get(r).push(p);});return lvl._groups=[...g.values()];}
function uniform(lvl,arr){for(const grp of groupsOf(lvl)){let G=0,Q=0,L=0;for(const p of grp){const x=lvl.I[p.j];for(let b=p.b0;b<=p.b1;b++){G+=arr[p.j].g[b];Q+=arr[p.j].q[b];}L+=(p.b1-p.b0+1)*x.db;}if(L<=0)continue;
 for(const p of grp){const x=lvl.I[p.j];for(let b=p.b0;b<=p.b1;b++){arr[p.j].g[b]=G/L*x.db;arr[p.j].q[b]=Q/L*x.db;}}}}
function transferMap(up,low){return up.I.map(x=>{const m=new Int32Array(x.nb*2).fill(-1);for(let b=0;b<x.nb;b++){const s=(b+.5)*x.db,P={x:x.g.A.x+x.g.u[0]*s,y:x.g.A.y+x.g.u[1]*s};let bj=-1,bv=Infinity;low.I.forEach((y,j)=>{const d=segD(P,y.g.A,y.g.B);if(d<=Math.max(y.t/2,3)+3&&d<bv){bv=d;bj=j;}});if(bj>=0){m[2*b]=bj;m[2*b+1]=binOf(low.I[bj],proj(low.I[bj],P));}}return m;});}

function compute(filter={}){const fk=JSON.stringify(filter)+'|'+dirty;if(cache.has(fk))return cache.get(fk);
 const s=S(),LV=levels(),warn=[],flagged=new Set();if(!LV.length){const r={LV,base:[],warn:['Nenhuma parede com posição na planta.'],flagged};cache.set(fk,r);return r;}
 const on=k=>filter.lv==null||filter.lv===k?1:0,top=LV.length-1,slabs=[];
 const pgOf=l=>N(l.walls[0]?.page||1);
 const addTo=(arr,lvl)=>(j,sp,G,Q)=>{const x=lvl.I[j],b=binOf(x,sp);arr[j].g[b]+=G;arr[j].q[b]+=Q;};
 const keys=new Set(LV.map(l=>l.key));for(const it of s.items)if(!keys.has(itemKey(it))){warn.push('Há ações lançadas em planta sem paredes ('+(L68()?.nameOf?L68().nameOf(itemKey(it)):'nível')+') — não entram no cálculo.');break;}
 if(LV.length>1){const pgs=new Set(LV.flatMap(l=>l.walls.map(w=>N(w.page||1))));if(pgs.size>1&&[...pgs].some(p=>!window.originOf74?.(p)))warn.push('Pavimentos em plantas diferentes sem ponto de origem: a passagem de carga entre pavimentos pode ficar errada. Marque a origem (Pavimentos · origem e 3D).');}
 const base=new Array(LV.length);let incoming=zeros(LV[top].I),lost=0;
 if(s.roof.on){const def={...s.roof},ctx=prepSlab(LV[top],def,itemsOf(LV[top].key,'cob'),pgOf(LV[top]));if(ctx&&on(LV[top].key)){const st=ctx.load(addTo(incoming,LV[top]));slabs.push({lvl:top,sup:top,kind:'cob',name:roofName(LV[top]),def,st,ctx});}}
 for(let i=top;i>=0;i--){const l=LV[i],def=lvDef(l.key),rep=Math.max(1,N(l.rep)||1);let inp=incoming,B=null;
  // V100 — no pavimento mais baixo, a laje entre as repetições é própria (a do piso é o térreo)
  const defS=i===0?lvDef(l.key+'#tipo'):def,tgtS=i===0?'tipo':'piso',ctxSelf=rep>1?prepSlab(l,defS,itemsOf(l.key,tgtS),pgOf(l)):null;
  const own102=rep>1?ownList(l.key,tgtS).filter(j=>j<=rep):[],ctxOwn={};for(const j of own102){try{ctxOwn[j]=prepSlab(l,defS,ownItems(l.key,tgtS,j),pgOf(l));}catch(e){console.error('V102 laje própria',e);}}const st102=new Map();
  for(let k=rep-1;k>=0;k--){B=zeros(l.I);add2(B,inp);l.I.forEach((x,j)=>ownLoad(x,B[j],on(l.key)));l.I.forEach((x,j)=>openings(x,B[j]));if(s.cfg.mode==='grp')uniform(l,B);
   if(k>0){inp=zeros(l.I);add2(inp,B);const j=k+1,cx=ctxOwn[j]||ctxSelf;if(cx&&on(l.key)){const st=cx.load(addTo(inp,l));const e0=st102.get(cx);if(e0)e0.reps.push(j);else st102.set(cx,{st,reps:[j],own:!!ctxOwn[j]});}}}
  const zj=j=>valOfKey(l.key)+(j-1)*((N(l.H)||280)+(N(GEO()?.opt3?.t)||10))/100,lb=String(l.key).split('|')[1]||'';
  for(const[cx,v]of st102){v.reps.sort((a,b)=>a-b);const cot=v.reps.map(j=>f2v(zj(j))).join(' · ');slabs.push({lvl:i,sup:i,kind:i===0?'tipo':'piso',name:v.own?'Laje '+cot+' · topo do '+(v.reps[0]-1)+'º pavimento'+(lb?' '+lb:'')+' (laje própria)':'Laje'+(v.reps.length>1?'s':'')+' '+cot+' · tipo'+(lb?' '+lb:'')+' (topo dos pavimentos '+repTxt(v.reps.map(j=>j-1))+')',def:defS,st:v.st,ctx:cx,times:v.reps.length,reps:v.reps,own:v.own?v.reps[0]:0});}
  base[i]=B;
  if(i>0){const low=LV[i-1],nx=zeros(low.I),tm=transferMap(l,low),ctxP=prepSlab(low,def,itemsOf(l.key,'piso'),pgOf(l));
   l.I.forEach((x,j)=>{let miss=0;for(let b=0;b<x.nb;b++){const G=B[j].g[b],Q=B[j].q[b];if(!G&&!Q)continue;const lj=tm[j][2*b];if(lj>=0){const lb=tm[j][2*b+1];nx[lj].g[lb]+=G;nx[lj].q[lb]+=Q;continue;}
     miss++;const s2=(b+.5)*x.db,P={x:x.g.A.x+x.g.u[0]*s2,y:x.g.A.y+x.g.u[1]*s2},t=ctxP?ctxP.pointTo(P):-1;if(t>=0){const y=low.I[t],lb=binOf(y,proj(y,P));nx[t].g[lb]+=G;nx[t].q[lb]+=Q;}else if(t<=-10){for(const[j2,f,R]of ctxP.split(t,P)){const y=low.I[j2],lb=binOf(y,proj(y,R));nx[j2].g[lb]+=G*f;nx[j2].q[lb]+=Q*f;}}else lost+=G+Q;}
    if(miss>x.nb*.1)flagged.add(x.w);});
   if(ctxP&&on(l.key)){const st=ctxP.load(addTo(nx,low));slabs.push({lvl:i,sup:i-1,kind:'piso',name:slabName(l.key),def,st,ctx:ctxP});}
   incoming=nx;}}
 if(flagged.size)warn.push(flagged.size+' parede(s) sem parede embaixo: a carga delas desce pela laje para as paredes vizinhas (em roxo na planta de cargas do pavimento delas). Confira se há viga ou apoio.');
 if(lost>.01)warn.push('Parte da carga ('+fx(U.f(lost))+' '+U.F()+') não encontrou parede de apoio.');
 const rows=LV.map((l,i)=>l.I.map((x,j)=>{const a=base[i][j];let G=0,Q=0,L=0,mx=0;for(let b=0;b<x.nb;b++){G+=a.g[b];Q+=a.q[b];if(x.solid[b])L+=x.db;}
  for(let b=0;b<x.nb;b++){if(!x.solid[b])continue;let sg=0,n=0;for(let k=Math.max(0,b-5);k<=Math.min(x.nb-1,b+4);k++)if(x.solid[k]){sg+=a.g[k]+a.q[k];n++;}mx=Math.max(mx,sg/(n*x.db)*100);}
  const Lm=L/100||x.L/100;return {w:x.w,j,x,G,Q,L:Lm,g:G/Lm,q:Q/Lm,p:(G+Q)/Lm,max:mx,label:wLabel(x.w,l)};}));
 let ground=null;{const l0=LV[0],gd=gDef(l0.key);if(on(l0.key)&&gd.base!=='sem'){try{const ctx=prepSlab(l0,gd,itemsOf(l0.key,'piso'),pgOf(l0));if(ctx){const st=ctx.load(()=>{});ground={name:slabName(l0.key),def:gd,st,base:gd.base};}}catch(e){console.error('V80 laje do térreo',e);}}}
 const moments=[];for(const sl of slabs)for(const[j,m]of sl.st.mom||[]){const L=LV[sl.sup],x=L?.I[j];if(!x)continue;const len=Math.max(.1,(m.s1-m.s0+10)/100);moments.push({slab:sl.name,times:sl.times||1,sup:sl.sup,j,label:wLabel(x.w,L),lvName:L.name,len,area:m.area,Mg:m.G,Mq:m.Q,mg:m.G/len,mq:m.Q/len});}
 const r={LV,base,rows,warn,flagged,slabs,ground,moments};cache.set(fk,r);return r;}
function repTxt(r){const out=[];let a=r[0],b=r[0];for(const x of r.slice(1)){if(x===b+1){b=x;continue;}out.push(a===b?a+'º':a+'º–'+b+'º');a=b=x;}out.push(a===b?a+'º':a+'º–'+b+'º');return out.join(', ');}
function wLabel(w,l){const i=state.walls.indexOf(w);if(i>=0)return 'P'+(i+1);const s=l.walls.slice().sort((a,b)=>(N(a.seq58)||0)-(N(b.seq58)||0));return 'P'+(s.indexOf(w)+1);}
// V97.1 — ✂ Aparar também no beiral: clique no pedaço que passou da parede; corta no cruzamento (face/eixo das paredes ou outro lado do beiral)
function trimEdge97(P){const pg=curPage(),tol=10/(zoom||1),cr=(ax,ay,bx,by)=>ax*by-ay*bx;let best=null;
 let ek=null;try{ek=editCtx().key;}catch{}
 let e102=null;try{e102=editCtx();}catch{}
 for(const it of S().items){if(it.kind!=='edge'||(ek&&itemKey(it)!==ek)||(e102&&!repOk(it,e102)))continue;const ip=N(it.page),Q=(it.pts||[]).map(q=>ip===pg?q:window.toPage74(pg,window.world74(ip,q))),n=Q.length;if(n<2)continue;
  for(let k=0;k<n;k++){const a=Q[k],b=Q[(k+1)%n];if(n===2&&k===1)break;const d=segD(P,a,b);if(d<=tol&&(!best||d<best.d))best={it,Q,k,a,b,d,ip};}}
 if(!best)return null;const{it,Q,k,a,b,ip}=best,n=Q.length,dx=b.x-a.x,dy=b.y-a.y,L2=dx*dx+dy*dy||1,tc=((P.x-a.x)*dx+(P.y-a.y)*dy)/L2,ts=[];
 const hitLine=(c,d)=>{const ex=d.x-c.x,ey=d.y-c.y,den=cr(dx,dy,ex,ey);if(Math.abs(den)<1e-9)return;const t=cr(c.x-a.x,c.y-a.y,ex,ey)/den,u=cr(c.x-a.x,c.y-a.y,dx,dy)/den;if(u>=-.001&&u<=1.001&&t>.002&&t<.998)ts.push(t);};
 for(const w of state.walls){if(!w.line||N(w.page||1)!==pg)continue;const[c,d]=w.line,l=Math.hypot(d.x-c.x,d.y-c.y)||1,sc=N(w.planScale)||(typeof pxCm==='number'&&pxCm>0?pxCm:l/N(w.length)),h=N(w.width||14)*sc/2,nx=-(d.y-c.y)/l*h,ny=(d.x-c.x)/l*h,ux=(d.x-c.x)/l*h,uy=(d.y-c.y)/l*h;
  for(const s of [-1,0,1])hitLine({x:c.x+nx*s-ux,y:c.y+ny*s-uy},{x:d.x+nx*s+ux,y:d.y+ny*s+uy});}
 for(let j=0;j<n;j++){if(j===k||(j+1)%n===k||(k+1)%n===j)continue;hitLine(Q[j],Q[(j+1)%n]);}
 ts.sort((x,y)=>x-y);const lo=ts.filter(t=>t<tc).pop(),hi=ts.find(t=>t>tc),pt=t=>({x:a.x+dx*t,y:a.y+dy*t});
 if(lo==null&&hi==null)return 'Esse lado do beiral não cruza nenhuma parede: nada para aparar.';
 if(lo!=null&&hi!=null)return 'Esse pedaço fica entre dois cruzamentos: clique no pedaço da ponta que passou.';
 const back=q=>ip===pg?{x:q.x,y:q.y}:window.toPage74(ip,window.world74(pg,q));
 if(lo==null)it.pts[k]=back(pt(hi));else it.pts[(k+1)%n]=back(pt(lo));
 touch();try{drawPlan();}catch{}return (it.name||'Beiral')+' aparado no cruzamento ('+fx(Math.hypot(dx,dy)*Math.abs((lo==null?hi:1-lo))/((typeof pxCm==='number'&&pxCm>0)?pxCm:1),0)+' cm retirados).';}
window.trimEdge97=trimEdge97;
// V102 — mexeu na laje estando numa repetição que ainda é igual ao tipo: o tipo volta como estava e esta repetição ganha laje própria
let snap102=null;
function cowSnap(){let e;try{e=editCtx();}catch{return;}if(!e.rj||isOwn(e.key,e.tgt,e.rj)){snap102=null;return;}const id=ownId(e.key,e.tgt,e.rj);if(snap102&&snap102.id===id&&snap102.s===S())return;snap102={id,s:S(),json:JSON.stringify(itemsOf(e.key,e.tgt))};}
function cowCheck(){if(!snap102)return;let e;try{e=editCtx();}catch{return;}const id=e.rj?ownId(e.key,e.tgt,e.rj):'';if(id!==snap102.id||snap102.s!==S()){snap102=null;return;}const now=itemsOf(e.key,e.tgt),js=JSON.stringify(now);if(js===snap102.json)return;
 const old=JSON.parse(snap102.json);for(const it of now)it.rep102=e.rj;for(const it of old)it.id=newId();S().items.push(...old);S().own102??={};S().own102[snap102.id]=true;snap102=null;
 try{const st=$('planStatus');if(st)setTimeout(()=>{st.textContent='Laje própria criada para o '+e.rj+'º pavimento: a mudança vale só para ele. Os outros pavimentos continuam iguais ao tipo.';},0);}catch{}}
// V103 — no 1º pavimento do tipo (o que comanda as repetições): lançar algo novo vai para TODOS os pavimentos;
// tirar ou alterar muda só o 1º (os outros recebem a laje como estava e ficam com laje própria).
let base103=null;
function repCount(key){try{const l=levels().find(x=>x.key===key);return Math.max(1,N(l?.rep)||1);}catch{return 1;}}
function baseCtx(e){if(!e||e.rj)return null;const R=repCount(e.key);if(R<2)return null;if(e.tgt==='tipo')return {first:3,R};if(e.tgt==='piso'&&!e.ground&&!e.selfRep&&e.below)return {first:2,R};return null;}
function baseSnap(){let e;try{e=editCtx();}catch{return;}const b=baseCtx(e);if(!b){base103=null;return;}const id=e.key+'|'+e.tgt;if(base103&&base103.id===id&&base103.s===S())return;base103={id,s:S(),key:e.key,tgt:e.tgt,b,json:JSON.stringify(itemsOf(e.key,e.tgt))};}
function baseCheck(){if(!base103)return;let e;try{e=editCtx();}catch{return;}if(e.key+'|'+e.tgt!==base103.id||base103.s!==S()){base103=null;return;}const now=itemsOf(e.key,e.tgt),js=JSON.stringify(now);if(js===base103.json)return;
 const old=JSON.parse(base103.json),oldIds=new Set(old.map(i=>i.id)),added=now.filter(i=>!oldIds.has(i.id)),{first,R}=base103.b;let made=0;
 S().own102??={};
 for(let j=first;j<=R;j++){const id=ownId(e.key,e.tgt,j);if(!S().own102[id]){for(const it of old){const c=JSON.parse(JSON.stringify(it));c.id=newId();c.rep102=j;S().items.push(c);}S().own102[id]=true;made++;}
  for(const it of added){const c=JSON.parse(JSON.stringify(it));c.id=newId();c.rep102=j;S().items.push(c);}}
 base103.json=js;
 try{const st=$('planStatus');if(st)setTimeout(()=>{st.textContent=added.length&&now.length>=old.length&&added.length===now.length-old.length&&old.every(o=>now.some(n=>n.id===o.id&&JSON.stringify(n)===JSON.stringify(o)))?'Lançado no 1º pavimento: vai também para os pavimentos de cima (cada um pode tirar o seu).':'Mudança só no 1º pavimento: os pavimentos de cima continuam como estavam'+(added.length?' (o que foi lançado agora vai para todos)':'')+'.';},0);}catch{}}
function backToTipo(){const e=editCtx();if(!e.rj)return false;const id=ownId(e.key,e.tgt,e.rj);S().items=S().items.filter(it=>!(itemKey(it)===e.key&&(it.tgt||'piso')===e.tgt&&it.rep102===e.rj));if(S().own102)delete S().own102[id];snap102=null;touch();try{drawPlan();}catch{}return true;}
// itens visíveis no contexto em edição (tipo ou laje própria da repetição)
function repOk(it,e){e=e||editCtx();const o=isOwn(e.key,e.tgt,e.rj);return it.rep102==null?!o:(o&&it.rep102===e.rj&&itemKey(it)===e.key);}
function visIn(it,e){e=e||editCtx();if(itemKey(it)!==e.key||(it.tgt||'piso')!==e.tgt)return false;return isOwn(e.key,e.tgt,e.rj)?it.rep102===e.rj:it.rep102==null;}
{const dp2=drawPlan;drawPlan=function(...a){try{cowCheck();cowSnap();baseCheck();baseSnap();}catch{}return dp2.apply(this,a);};}
window.loads77={repOk,vis:visIn,isOwn,ownList,ownItems,itemsRep,backToTipo,repTxt,snapPt:P=>snap(P),editCtx:()=>editCtx(),itemKey,itemsOf,slabName,roofName,polyOf,worldPts,compute,S,prepSlab,levels,ppDefault,touch,U,fx,typeTxt,shortTxt,ppOf,heat,keyOfPage,get pkHook(){return pkHook;},set pkHook(f){pkHook=f;}};

// ---------- 5. Lançamento na planta
let tool=null,pts=[],hover=null,raf=0;
function editCtx(){const pg=curPage(),o92=window.lvl92ctx&&window.lvl92ctx.wallKey===keyOfPage(pg)?window.lvl92ctx:null,key=o92?o92.slabKey:keyOfPage(pg),LV=levels(),v=valOfKey(key);const idx=LV.findIndex(l=>l.key===key);const below=[...LV].filter(l=>valOfKey(l.key)<v-1e-6).pop()||null;const isTop=!LV.some(l=>valOfKey(l.key)>v+1e-6);
 const tgt=o92?(o92.tgt==='cob'&&isTop?'cob':o92.tgt==='tipo'?'tipo':'piso'):(isTop&&S().cfg.tgt==='cob'?'cob':'piso');return {pg,key,LV,idx,below,isTop,tgt,ground:tgt==='piso'&&!below&&!o92?.self,selfRep:!!o92?.self,rj:o92?.rep&&!(o92.tgt==='tipo'&&o92.rep===2)?o92.rep:null,self:idx>=0?LV[idx]:null};}
function vizCtx(){const e=editCtx();
 // V100 — laje entre as repetições do pavimento-tipo: apoiada nas paredes do próprio pavimento
 if(e.tgt==='tipo'){if(!e.self)return null;return prepSlab(e.self,lvDef(e.key+'#tipo'),itemsRep(e.key,'tipo',e.rj),e.pg);}
 if(e.selfRep&&e.self)return prepSlab(e.self,lvDef(e.key),itemsRep(e.key,'piso',e.rj),e.pg);
 if(e.tgt==='cob'){if(!e.self||!S().roof.on)return null;return prepSlab(e.self,{...S().roof},itemsOf(e.key,'cob'),e.pg);}if(!e.below){if(!e.self||gDef(e.key).base==='sem')return null;const v=prepSlab(e.self,gDef(e.key),itemsOf(e.key,'piso'),e.pg);if(v)v.ground=true;return v;}return prepSlab(e.below,lvDef(e.key),itemsOf(e.key,'piso'),e.pg);}
let vizCache={k:'',ctx:null};
function getViz(){const k=dirty+'|'+curPage()+'|'+S().cfg.tgt+'|'+(GEO()?.opt3?.close)+'|'+(window.lvl92ctx?window.lvl92ctx.id:'')+'|'+JSON.stringify(S().own102||{});if(vizCache.k!==k){try{vizCache={k,ctx:vizCtx()};}catch(e){console.error('V77 viz',e);vizCache={k,ctx:null};}}return vizCache.ctx;}
const PAL=['#2f80ed','#e8503a','#27ae60','#f2994a','#9b51e0','#00a3a3','#d4a017','#eb5ca5','#56ccf2','#6fcf97','#bb6bd9','#f2c94c','#8d6e63','#4f6d7a'];
function rawPoint(e){const c=$('plan'),r=c.getBoundingClientRect();return {x:(e.clientX-r.left)*c.width/r.width+(c.planOrigin25?.x||0),y:(e.clientY-r.top)*c.height/r.height+(c.planOrigin25?.y||0)};}
function paredes128(){const pg=curPage(),out=[],vis=new Set();const add=(A,B,wd,k)=>{const L=Math.hypot(B.x-A.x,B.y-A.y);if(!(L>0))return;const key=[A.x,A.y,B.x,B.y].map(v=>Math.round(v)).join(',');if(vis.has(key))return;vis.add(key);const u={x:(B.x-A.x)/L,y:(B.y-A.y)/L},n={x:-u.y,y:u.x},h=(N(wd)||14)*k/2,F=(s)=>[{x:A.x+n.x*h*s,y:A.y+n.y*h*s},{x:B.x+n.x*h*s,y:B.y+n.y*h*s}],X=(s)=>[{x:A.x-u.x*h+n.x*h*s,y:A.y-u.y*h+n.y*h*s},{x:B.x+u.x*h+n.x*h*s,y:B.y+u.y*h+n.y*h*s}];out.push({A,B,u,n,h,k,wd:N(wd)||14,faces:[X(1),X(-1)],cantos:[...X(1),...X(-1),...F(1),...F(-1)]});};
 for(const w of state.walls){if(!w.line||N(w.page||1)!==pg)continue;const [a,b]=w.line,L=Math.hypot(b.x-a.x,b.y-a.y);add(a,b,w.width,N(w.planScale)||L/N(w.length)||1);}
 try{const e=editCtx();if(e.below)for(const w of e.below.walls){if(!w.line)continue;const wp=N(w.page||1),A=window.toPage74(pg,window.world74(wp,w.line[0])),B=window.toPage74(pg,window.world74(wp,w.line[1])),L=Math.hypot(B.x-A.x,B.y-A.y);add(A,B,w.width,L/N(w.length)||1);}}catch{}
 return out;}
function snap(P){const tol=12/(zoom||1),pg=curPage();let best=null,bd=tol;const test=q=>{const d=Math.hypot(q.x-P.x,q.y-P.y);if(d<bd){bd=d;best=q;}};
 for(const w of state.walls){if(!w.line||N(w.page||1)!==pg)continue;w.line.forEach(test);}
 try{const e=editCtx();if(e.below)for(const w of e.below.walls){if(!w.line)continue;const wp=N(w.page||1);for(const Q of w.line)test(window.toPage74(pg,window.world74(wp,Q)));}}catch{}
 for(const it of S().items)if(N(it.page)===pg)(it.pts||[]).forEach(test);
 try{(window.ref126?.pontos?.(pg)||[]).forEach(test);}catch{}
 pts.forEach(test);
 // V128 — cantos das faces das paredes (onde o beiral encosta) e pontos do DXF
 const PW=paredes128();for(const W of PW)for(const q of W.cantos)test(q);
 try{for(const q of (typeof fixedPoints!=='undefined'&&fixedPoints)||[])test(q);}catch{}
 if(best)return {...best,snap:true};
 // V128 — sem vértice perto: a face da parede (para fechar o beiral em qualquer ponto da face)
 {let f=null,fd=tol*.8;for(const W of PW)for(const [a,b] of W.faces){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((P.x-a.x)*dx+(P.y-a.y)*dy)/l)),X={x:a.x+t*dx,y:a.y+t*dy},d=Math.hypot(X.x-P.x,X.y-P.y);if(d<fd){fd=d;f=X;}}if(f)return {...f,snap:true,face:true};}
 if(!best&&pts.length&&tool==='edge'&&!shift97){const a=pts.at(-1);return Math.abs(P.x-a.x)>=Math.abs(P.y-a.y)?{x:P.x,y:a.y}:{x:a.x,y:P.y};}
 if(!best&&pts.length&&(tool==='poly'||tool==='edge'||tool==='line'||tool==='div')){const a=pts.at(-1),dx=Math.abs(P.x-a.x),dy=Math.abs(P.y-a.y);if(dx<tol*1.5)return {x:a.x,y:P.y};if(dy<tol*1.5)return {x:P.x,y:a.y};}
 return best?{...best}:P;}
function bar77(msg,actions=[]){let p=$('ld77bar');if(!p){p=document.createElement('div');p.id='ld77bar';p.className='walltool56 noPrint';$('planStatus').after(p);}p.innerHTML='';const t=document.createElement('span');t.textContent=msg||'';p.append(t);for(const[l,fn]of actions){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=l;b.onclick=fn;p.append(b);}p.style.display=msg?'flex':'none';}
const HELP={edge:'Beiral / balanço (como o LINE do AutoCAD): clique no início (quadradinho verde = vértice), leve o mouse na direção — a linha trava na horizontal/vertical (Shift solta) — e digite o comprimento + Enter, ou clique. Cada Enter fixa um ponto e segue. Esc termina o beiral (fecha pela parede) e você começa outro onde quiser; outro Esc solta a ferramenta. ✂ Aparar corta o pedaço que passou.',rect:'Retângulo de ação: clique em dois cantos opostos.',poly:'Polígono de ação: clique ponto a ponto; clique no 1º ponto ou Enter para fechar.',panel:'Painel de laje: clique dentro do painel (área entre paredes) para definir tipo, altura, direção das vigotas e ações.',div:'Linha divisória: clique os pontos da linha que separa a laje em painéis; Enter ou duplo clique termina.',line:'Carga linear: clique início e fim (Enter termina uma polilinha).',point:'Carga concentrada: clique no ponto.',edit:'Editar: clique numa ação ou painel desenhado para editar ou excluir.'};
function startTool(k){if(!image){alert('Carregue a planta primeiro.');return;}const e=editCtx();if(e.ground&&!e.self&&k!=='edit'){alert('Esta planta ainda não tem paredes posicionadas.');return;}
 try{(window.stopAll108||window.cancelTool56)?.();}catch{}try{mode='';}catch{}tool=k;pts=[];hover=null;rapido128=0;document.body.classList.add('tool56','ld77on');if(k==='edge')barraBeiral128();else bar77(HELP[k]+' Esc cancela.',[['Cancelar',cancelTool]]);refreshSide();drawPlan();}
window.cancelTool77=()=>{if(tool)cancelTool();};function cancelTool(){tool=null;pts=[];hover=null;document.body.classList.remove('tool56','ld77on');bar77('');refreshSide();drawPlan();}
const newId=()=>'ld-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
// V128 — BEIRAL RÁPIDO: com a largura definida, cada clique numa parede externa cria o beiral ao longo dela, para fora
let rapido128=0;
function larguraRapido128(){let v=0;try{v=N(localStorage.getItem('beiral128'))||0;}catch{}const r=prompt('Largura do beiral (cm), medida da face externa da parede:',String(v||60));if(r===null)return 0;const n=N(String(r).replace(',','.'));if(!(n>0)){alert('Digite uma largura em cm.');return 0;}try{localStorage.setItem('beiral128',String(n));}catch{}return n;}
function barraBeiral128(){const acoes=[['Cancelar',cancelTool]];acoes.unshift(rapido128?['✎ Linha de bordo (contornar)',()=>{rapido128=0;barraBeiral128();}]:['⚡ Beiral rápido: clique nas paredes',()=>{const n=larguraRapido128();if(n){rapido128=n;pts=[];barraBeiral128();}}]);if(rapido128)acoes.unshift(['Largura '+fx(rapido128,0)+' cm — alterar',()=>{const n=larguraRapido128();if(n){rapido128=n;barraBeiral128();}}]);
 bar77(rapido128?'⚡ Beiral rápido: clique em cada parede externa — o beiral de '+fx(rapido128,0)+' cm sai ao longo da parede inteira, para fora; os cantos fecham sozinhos. Esc termina.':HELP.edge+' Esc cancela.',acoes);}
function beiralParede128(P){const k0=(typeof pxCm==='number'&&pxCm>0)?pxCm:null,PW=paredes128();let W=null,bd=Infinity;
 for(const w of PW){const dx=w.B.x-w.A.x,dy=w.B.y-w.A.y,l=dx*dx+dy*dy||1,t=((P.x-w.A.x)*dx+(P.y-w.A.y)*dy)/l;if(t<0||t>1)continue;const d=Math.abs((P.x-w.A.x)*w.n.x+(P.y-w.A.y)*w.n.y);if(d<=w.h+10/(zoom||1)&&d<bd){bd=d;W=w;}}
 if(!W){bar77('⚡ Clique em cima de uma parede externa.',[['Cancelar',cancelTool]]);return;}
 const k=k0||W.k,larg=rapido128*k,M={x:(W.A.x+W.B.x)/2,y:(W.A.y+W.B.y)/2};
 // lado de fora: o raio que sai da face não cruza nenhuma outra parede
 const cruza=(O,d)=>PW.some(o=>{if(o===W)return false;const ex=o.B.x-o.A.x,ey=o.B.y-o.A.y,den=d.x*ey-d.y*ex;if(Math.abs(den)<1e-9)return false;const t=((o.A.x-O.x)*ey-(o.A.y-O.y)*ex)/den,s=((o.A.x-O.x)*d.y-(o.A.y-O.y)*d.x)/den;return t>0&&s>=-.02&&s<=1.02;});
 let lado=0;for(const sg of [1,-1]){const O={x:M.x+W.n.x*sg*(W.h+1),y:M.y+W.n.y*sg*(W.h+1)};if(!cruza(O,{x:W.n.x*sg,y:W.n.y*sg})){lado=sg;break;}}
 if(!lado){bar77('⚡ Essa parede é interna (dos dois lados há outras paredes). Clique numa parede externa.',[['Cancelar',cancelTool]]);return;}
 // pontas: em canto (outra parede chega na ponta) o beiral avança até cobrir o canto
 const n={x:W.n.x*lado,y:W.n.y*lado},edges=S().items.filter(i=>i.kind==='edge'&&N(i.page)===curPage()).map(i=>i.pts);
 const vizinhaComBeiral=(E,sai)=>{const R={x:E.x+sai.x*(W.h+larg/2)+n.x*W.h*.5,y:E.y+sai.y*(W.h+larg/2)+n.y*W.h*.5};return edges.some(pl=>inPoly(R,pl));};
 const e0=W.h+(vizinhaComBeiral(W.A,{x:-W.u.x,y:-W.u.y})?larg:0),e1=W.h+(vizinhaComBeiral(W.B,W.u)?larg:0),a={x:W.A.x-W.u.x*e0,y:W.A.y-W.u.y*e0},b={x:W.B.x+W.u.x*e1,y:W.B.y+W.u.y*e1};
 const poly=[{x:a.x+n.x*W.h,y:a.y+n.y*W.h},{x:b.x+n.x*W.h,y:b.y+n.y*W.h},{x:b.x+n.x*(W.h+larg),y:b.y+n.y*(W.h+larg)},{x:a.x+n.x*(W.h+larg),y:a.y+n.y*(W.h+larg)}];
 const e=editCtx(),it={id:newId(),kind:'edge',page:e.pg,tgt:e.tgt,pts:poly,name:'Beiral '+fx(rapido128,0)+' cm',g:null,q:null,mode:'sub',rapido128:rapido128};if(e.key!==keyOfPage(e.pg))it.slab92=e.key;if(isOwn(e.key,e.tgt,e.rj))it.rep102=e.rj;
 S().items.push(it);touch();try{window.undo58?.push?.();}catch{}drawPlan();barraBeiral128();
 bar77('✔ Beiral de '+fx(rapido128,0)+' cm lançado ('+fx(Math.hypot(b.x-a.x,b.y-a.y)/k/100,2)+' m). Clique na próxima parede externa; Esc termina; Ctrl+Z desfaz.',[['Largura '+fx(rapido128,0)+' cm — alterar',()=>{const n=larguraRapido128();if(n){rapido128=n;barraBeiral128();}}],['✎ Linha de bordo (contornar)',()=>{rapido128=0;barraBeiral128();}],['Cancelar',cancelTool]]);}
function finish(kind,list){const e=editCtx();const it={id:newId(),kind,page:e.pg,tgt:e.tgt,pts:list.map(p=>({x:p.x,y:p.y})),name:'',g:null,q:null,mode:'sub'};if(e.key!==keyOfPage(e.pg))it.slab92=e.key;if(isOwn(e.key,e.tgt,e.rj))it.rep102=e.rj;
 if(kind==='rect'||kind==='poly'){const d0=lvDef(e.tgt==='tipo'?e.key+'#tipo':e.key);it.g=d0.g;it.q=d0.q;}
 if(kind==='line'){it.g=0;it.q=0;it.mode='add';}if(kind==='point'){it.g=0;it.q=0;it.mode='add';}
 if(kind==='panel'){Object.assign(it,{type:'inherit',h:null,pp:null,dir:null,edge:null});}
 S().items.push(it);touch();pts=[];const keep=tool;if(kind!=='div')openPop(it,true);drawPlan();if(keep)bar77(HELP[keep]+' Esc cancela.',[['Cancelar',cancelTool]]);}
function hitItem(P){const pg=curPage(),tol=10/(zoom||1);let best=null,bd=Infinity;
 let e102=null;try{e102=editCtx();}catch{}
 for(const it of S().items){if(N(it.page)!==pg||it.kind==='beam'||it.kind==='hole'||(e102&&!repOk(it,e102)))continue;const p=it.pts||[];let d=Infinity;
  if(it.kind==='point'||it.kind==='panel')d=Math.hypot(p[0].x-P.x,p[0].y-P.y)-(it.kind==='panel'?14/(zoom||1):0);
  else if(it.kind==='line'||it.kind==='div'){for(let k=0;k+1<p.length;k++)d=Math.min(d,segD(P,p[k],p[k+1]));}
  else{const poly=it.kind==='rect'?[p[0],{x:p[1].x,y:p[0].y},p[1],{x:p[0].x,y:p[1].y}]:p;for(let k=0;k<poly.length;k++)d=Math.min(d,segD(P,poly[k],poly[(k+1)%poly.length]));if(inPoly(P,poly))d=Math.min(d,tol*.9);}
  if(d<=tol&&d<bd){bd=d;best=it;}}return best;}
$('plan')?.addEventListener('click',e=>{if(!tool)return;e.stopImmediatePropagation();e.preventDefault();const P=snap(rawPoint(e));
 if(tool==='edit'){const it=hitItem(P);if(it)openPop(it,false);return;}
 if(tool==='point'||tool==='panel'){finish(tool,[P]);return;}
 if(tool==='rect'){pts.push(P);if(pts.length===2){if(Math.abs(pts[0].x-pts[1].x)<2||Math.abs(pts[0].y-pts[1].y)<2){pts=[];return;}finish('rect',pts);}drawPlan();return;}
 if(tool==='edge'&&rapido128&&!pts.length){beiralParede128(P);return;}
 if(tool==='poly'||tool==='edge'){if(pts.length>=3&&Math.hypot(P.x-pts[0].x,P.y-pts[0].y)<12/(zoom||1)){finish(tool,pts);return;}pts.push(P);drawPlan();return;}
 if(tool==='line'||tool==='div'){pts.push(P);if(e.detail>=2&&pts.length>=2){finish(tool,pts);return;}drawPlan();}},true);
$('plan')?.addEventListener('dblclick',e=>{if(tool==='line'||tool==='div'||tool==='poly'||tool==='edge'){e.stopImmediatePropagation();e.preventDefault();}},true);
$('plan')?.addEventListener('mousemove',e=>{if(!tool)return;hover=snap(rawPoint(e));if(!raf)raf=requestAnimationFrame(()=>{raf=0;drawPlan();});});
let typed77='',shift97=false;document.addEventListener('keydown',e=>{if(e.key==='Shift')shift97=true;});document.addEventListener('keyup',e=>{if(e.key==='Shift')shift97=false;});window.addEventListener('blur',()=>{shift97=false;});
document.addEventListener('keydown',e=>{if(!tool)return;if(e.target?.closest?.('input,textarea,select'))return;
 if(e.key==='Escape'){typed77='';if(tool==='edge'&&pts.length>=3){finish('edge',pts);e.preventDefault();return;}if(tool==='edge'&&pts.length){pts=[];hover=null;drawPlan();bar77(HELP.edge,[['Cancelar',cancelTool]]);return;}cancelTool();return;}
 if(pts.length&&tool!=='rect'&&/^[0-9]$|^[.,]$/.test(e.key)){typed77+=e.key===','?'.':e.key;e.preventDefault();drawPlan();return;}
 if(e.key==='Backspace'&&typed77){typed77=typed77.slice(0,-1);e.preventDefault();drawPlan();return;}
 if(e.key==='Enter'&&typed77&&pts.length&&hover){const a=pts.at(-1),dx=hover.x-a.x,dy=hover.y-a.y,d=Math.hypot(dx,dy)||1,pc=(typeof pxCm==='number'&&pxCm>0)?pxCm:1,L=N(typed77)*pc;typed77='';if(L>0){pts.push({x:a.x+dx/d*L,y:a.y+dy/d*L});drawPlan();}e.preventDefault();return;}
 if(e.key==='Enter'){if((tool==='poly'||tool==='edge')&&pts.length>=3)finish(tool,pts);else if((tool==='line'||tool==='div')&&pts.length>=2)finish(tool,pts);}});

// desenho na planta
const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);if(!image)return r;try{const s=S();if(!s.cfg.show&&!tool)return r;window.__txtFixed=true;try{draw77();}finally{window.__txtFixed=false;}}catch(e){console.error('V77 planta',e);}return r;};
function draw77(){const c=$('plan'),ctx=c.getContext('2d'),o25=c.planOrigin25||{x:0,y:0},pg=curPage(),z=(window.zoom88?.fitZ?.()||zoom||1),s=S(),e=editCtx();ctx.save();ctx.setTransform(1,0,0,1,-o25.x,-o25.y);
 const toP=W=>window.toPage74(pg,W);
 if(s.cfg.infl||tool==='panel'){const v=getViz();if(v){const sc=(()=>{const a=toP({x:0,y:0}),b=toP({x:100,y:0});return Math.hypot(b.x-a.x,b.y-a.y)/100;})(),sz=v.s0*sc+.6;
  if(!v.img){const cv=document.createElement('canvas');cv.width=v.nx;cv.height=v.ny;const g2=cv.getContext('2d'),im=g2.createImageData(v.nx,v.ny),rgb=PAL.map(h=>[1,3,5].map(k=>parseInt(h.slice(k,k+2),16)));
   for(let i=0;i<v.n;i++){if(!v.inside[i]||v.assign[i]===-1)continue;const x=i%v.nx,y=(i-x)/v.nx,o=((v.ny-1-y)*v.nx+x)*4,c=v.ground?[120,144,170]:v.assign[i]<=-10?[29,78,216]:rgb[v.assign[i]%rgb.length];im.data[o]=c[0];im.data[o+1]=c[1];im.data[o+2]=c[2];im.data[o+3]=70;}g2.putImageData(im,0,0);v.img=cv;}
  {// imagem da grade (linha 0 = maior y do mundo) → planta, por transformação afim
   const X0=v.cx(0)-v.s0/2,Y1=v.cy((v.ny-1)*v.nx)+v.s0/2,O=toP({x:X0,y:Y1}),Ex=toP({x:X0+v.s0,y:Y1}),Ey=toP({x:X0,y:Y1-v.s0});ctx.save();ctx.transform(Ex.x-O.x,Ex.y-O.y,Ey.x-O.x,Ey.y-O.y,O.x,O.y);ctx.imageSmoothingEnabled=false;ctx.drawImage(v.img,0,0);ctx.restore();}
  if(!v.ground)v.I.forEach((x,j)=>{const A=toP(x.g.A),B=toP(x.g.B);ctx.strokeStyle=PAL[j%PAL.length];ctx.lineWidth=Math.max(2.5/z,x.t*sc*.55);ctx.globalAlpha=.85;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();ctx.globalAlpha=1;});
  // setas de vigotas e rótulos dos painéis
  const fz=(12/z);ctx.font='bold '+fz+'px Arial';
  for(let cI=0;cI<v.nc;cI++){let sx=0,sy=0,k=0,kc=0;for(let i=0;i<v.n;i+=1)if(v.comp[i]===cI){sx+=v.cx(i);sy+=v.cy(i);k++;if(v.cant[i])kc++;}if(k<30||kc>k/2)continue;const p=v.props[cI]||v.def,C=toP(v.seeds[cI]||{x:sx/k,y:sy/k});
   if(uniOf(p)){const d=N(p.dir)===90?{x:0,y:1}:{x:1,y:0},Ln=34/z;ctx.strokeStyle='#174a78';ctx.fillStyle='#174a78';ctx.lineWidth=2/z;ctx.beginPath();ctx.moveTo(C.x-d.x*Ln,C.y-d.y*Ln);ctx.lineTo(C.x+d.x*Ln,C.y+d.y*Ln);ctx.stroke();for(const sg of [1,-1]){const ex=C.x+sg*d.x*Ln,ey=C.y+sg*d.y*Ln,h=7/z;ctx.beginPath();ctx.moveTo(ex+sg*d.x*h,ey+sg*d.y*h);ctx.lineTo(ex-d.y*h*.6,ey+d.x*h*.6);ctx.lineTo(ex+d.y*h*.6,ey-d.x*h*.6);ctx.closePath();ctx.fill();}}
   else{ctx.strokeStyle='#174a78';ctx.lineWidth=1.6/z;ctx.beginPath();ctx.arc(C.x,C.y,9/z,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(C.x-14/z,C.y);ctx.lineTo(C.x+14/z,C.y);ctx.moveTo(C.x,C.y-14/z);ctx.lineTo(C.x,C.y+14/z);ctx.stroke();}
   // V97.1 — um texto só, do tamanho do nome das paredes: tipo · (pp + gₖ + qₖ)
   {const WN=15.12,tot=(p.base==='solo'?0:ppOf(p))+(N(p.g)||0)+(N(p.q)||0),t1=shortTxt(p)+' · '+fx(U.f(tot),2)+' '+U.A();ctx.save();ctx.font='bold '+WN+'px Arial';ctx.fillStyle=p.item?'#b45309':'#174a78';ctx.textAlign='center';ctx.fillText(t1,C.x,C.y+16/z+WN);ctx.restore();}}}}
 // ações lançadas (do mesmo nível)
 const key=keyOfPage(pg),vis102=it=>{const o=isOwn(e.key,e.tgt,e.rj);return o?it.rep102===e.rj:it.rep102==null;};
 for(const it of s.items){if((itemKey(it)!==key&&itemKey(it)!==e.key)||(it.tgt||'piso')!==e.tgt||!vis102(it))continue;const P=(it.pts||[]).map(Q=>N(it.page)===pg?Q:toP(window.world74(N(it.page),Q)));if(!P.length)continue;const fz=(12/z);ctx.font='bold '+fz+'px Arial';
  const label=(t,x,y,col)=>{const w=ctx.measureText(t).width+8/z;ctx.fillStyle=col;ctx.textAlign='center';ctx.fillText(t,x,y);ctx.textAlign='left';};
  const gq=(u)=>(N(it.g)?'gₖ '+fx(U.f(N(it.g)),2):'')+(N(it.g)&&N(it.q)?' · ':'')+(N(it.q)?'qₖ '+fx(U.f(N(it.q)),2):'')+(N(it.g)||N(it.q)?' '+u:'');
  if(it.kind==='rect'||it.kind==='poly'){const poly=it.kind==='rect'?[P[0],{x:P[1].x,y:P[0].y},P[1],{x:P[0].x,y:P[1].y}]:P;const add=it.mode==='add';ctx.save();ctx.beginPath();poly.forEach((q,k)=>k?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.fillStyle=add?'rgba(58,154,82,.13)':'rgba(224,138,42,.15)';ctx.fill();ctx.clip();
    const bb=poly.reduce((b,q)=>({x0:Math.min(b.x0,q.x),x1:Math.max(b.x1,q.x),y0:Math.min(b.y0,q.y),y1:Math.max(b.y1,q.y)}),{x0:Infinity,x1:-Infinity,y0:Infinity,y1:-Infinity}),st=10/z;ctx.strokeStyle=add?'rgba(58,154,82,.55)':'rgba(224,138,42,.6)';ctx.lineWidth=1.2/z;ctx.beginPath();for(let k=bb.x0-(bb.y1-bb.y0);k<bb.x1;k+=st){ctx.moveTo(k,bb.y1);ctx.lineTo(k+(bb.y1-bb.y0),bb.y0);}ctx.stroke();ctx.restore();
    ctx.strokeStyle=add?'#3a9a52':'#e08a2a';ctx.lineWidth=2/z;ctx.beginPath();poly.forEach((q,k)=>k?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.stroke();
    const cx=poly.reduce((s,q)=>s+q.x,0)/poly.length,cy=poly.reduce((s,q)=>s+q.y,0)/poly.length;label((it.name?it.name+' · ':'')+(add?'soma ':'substitui ')+gq(U.A()),cx,cy,add?'#2b7a3e':'#b0601a');}
  else if(it.kind==='edge'){ctx.save();ctx.beginPath();P.forEach((q,k)=>k?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.fillStyle='rgba(0,163,163,.12)';ctx.fill();ctx.strokeStyle='#008a8a';ctx.lineWidth=2.4/z;ctx.setLineDash([9/z,4/z]);ctx.stroke();ctx.setLineDash([]);ctx.restore();const cx=P.reduce((s,q)=>s+q.x,0)/P.length,cy=P.reduce((s,q)=>s+q.y,0)/P.length;ctx.save();ctx.font='bold 15.12px Arial';label(it.name||'Beiral / balanço',cx,cy,'#007070');ctx.restore();}
  else if(it.kind==='div'){ctx.strokeStyle='#174a78';ctx.lineWidth=2.4/z;ctx.setLineDash([10/z,6/z]);ctx.beginPath();P.forEach((q,k)=>k?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();ctx.setLineDash([]);}
  else if(it.kind==='line'){ctx.strokeStyle='#7c3aed';ctx.lineWidth=4/z;ctx.setLineDash([12/z,6/z]);ctx.beginPath();P.forEach((q,k)=>k?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();ctx.setLineDash([]);const m=P.length>>1,a=P[Math.max(0,m-1)],b=P[m]||a;label((it.name?it.name+' · ':'')+gq(U.L()),(a.x+b.x)/2,(a.y+b.y)/2-10/z,'#6d28d9');}
  else if(it.kind==='point'){const q=P[0];ctx.fillStyle='#e8503a';ctx.strokeStyle='#fff';ctx.lineWidth=2/z;ctx.beginPath();ctx.arc(q.x,q.y,8/z,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#e8503a';ctx.lineWidth=3/z;ctx.beginPath();ctx.moveTo(q.x,q.y-34/z);ctx.lineTo(q.x,q.y-10/z);ctx.stroke();label((it.name?it.name+' · ':'')+[N(it.g)?'Fₖ,g '+fx(U.f(N(it.g)),2):'',N(it.q)?'Fₖ,q '+fx(U.f(N(it.q)),2):''].filter(Boolean).join(' · ')+' '+U.F(),q.x,q.y-40/z,'#b42318');}
  else if(it.kind==='panel'){const q=P[0];ctx.fillStyle=it._miss?'#d93a2b':'#b45309';ctx.beginPath();ctx.arc(q.x,q.y,5/z,0,Math.PI*2);ctx.fill();if(it._miss)label('painel fora da laje',q.x,q.y-10/z,'#d93a2b');}}
 // desenho em andamento
 if(tool&&(pts.length||hover)){const all=[...pts,...(hover?[hover]:[])];ctx.strokeStyle='#f2b705';ctx.lineWidth=2/z;ctx.setLineDash([6/z,4/z]);ctx.beginPath();
  if(tool==='rect'&&pts.length===1&&hover){const a=pts[0],b=hover;ctx.rect(Math.min(a.x,b.x),Math.min(a.y,b.y),Math.abs(b.x-a.x),Math.abs(b.y-a.y));}else all.forEach((q,k)=>k?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();ctx.setLineDash([]);
  if(hover){if(hover.snap){ctx.strokeStyle='#16a34a';ctx.lineWidth=2/z;const q=6/z;ctx.strokeRect(hover.x-q,hover.y-q,2*q,2*q);}else{ctx.fillStyle='#f2b705';ctx.beginPath();ctx.arc(hover.x,hover.y,4/z,0,Math.PI*2);ctx.fill();}
   if(pts.length&&tool!=='rect'){const a=pts.at(-1),pc=(typeof pxCm==='number'&&pxCm>0)?pxCm:1,L=Math.hypot(hover.x-a.x,hover.y-a.y)/pc,fz2=(13/z);ctx.font='bold '+fz2+'px Arial';ctx.textAlign='left';ctx.fillStyle='#b45309';ctx.fillText((typed77?typed77+' cm ↵':fx(L,1)+' cm')+(typed77?'':'  (digite o comprimento + Enter)'),hover.x+12/z,hover.y-10/z);}}}
 // legenda
 const fz=(12/z);ctx.font='bold '+fz+'px Arial';ctx.fillStyle='#174a78';const t=e.tgt==='cob'?'Cargas · '+roofName(e.self)+' → apoiada nas paredes de '+(e.self?.name||''):e.below?'Cargas · '+slabName(e.key)+' → apoiada nas paredes de '+e.below.name:gDef(e.key).base==='sem'?'Piso '+(L68()?.nameOf?L68().nameOf(e.key):'')+' — sem laje (o piso não carrega as paredes). Para radier ou contrapiso com tela: Laje → ⚙ Laje e ações do pavimento.':'Cargas · '+slabName(e.key)+' — '+baseTxt(gDef(e.key).base)+': vai direto para a fundação, não carrega as paredes';
 {const t88=t+(s.cfg.infl&&!e.ground?' · cores = parede que recebe cada parte da laje':'');if(window.hud88)window.hud88.push({t:t88,c:'#174a78'});else ctx.fillText(t88,o25.x+10/z,o25.y+(document.body.classList.contains('ghost74')?36:34)/z+fz);}
 ctx.restore();}

// ---------- 6. Janela de edição (ação / painel / pavimento)
function closePop(){$('ld77pop')?.remove();}
const Q_SUG=[[1.5,'Residencial: dormitórios, sala, cozinha, banheiro'],[2.0,'Residencial: despensa, área de serviço, lavanderia'],[2.5,'Escritórios (salas de uso geral)'],[3.0,'Corredores e escadas de uso comum; garagem (veículos leves)'],[1.0,'Cobertura sem acesso (só manutenção)']];
const sugHTML=()=>`<select data-k="sug"><option value="">Sugestões de qₖ (confira na NBR 6120:2019)…</option>${Q_SUG.map(([v,t])=>`<option value="${v}">${fx(U.f(v),2)} ${U.A()} — ${esc(t)}</option>`).join('')}</select>`;
const inp=(k,lab,v,unit,ph='')=>`<label class="r77"><span>${lab}</span><input data-k="${k}" type="text" inputmode="decimal" value="${v===null||v===undefined||v===''||!Number.isFinite(N(v))?'':fx(N(v),2).replace(/\./g,'')}" placeholder="${ph}"><em>${unit||''}</em></label>`;
const uv=v=>v===null||v===undefined||v===''?null:U.f(N(v));
function slabFields(p,inherit,dp){const ty=p.type??'inherit',list=['mac','tr8','tr12','tr16','tr20',...(ty==='alv'||dp?.type==='alv'?['alv']:[])];
 const nm=k=>k==='mac'?'Maciça (informar a espessura)':isTR(k)?TYPES[k].n+' — laje h='+TYPES[k].h+' cm':TYPES[k].n;
 return `<label class="r77"><span>Tipo de laje</span><select data-k="type">${inherit?`<option value="inherit" ${ty==='inherit'?'selected':''}>Igual ao pavimento (${esc(shortTxt(dp))})</option>`:''}${list.map(k=>`<option value="${k}" ${ty===k?'selected':''}>${nm(k)}</option>`).join('')}</select></label>
 ${inp('h','Espessura da maciça',p.type==='mac'||p.type==='alv'?p.h:null,'cm','10')}
 <label class="ck77 bi77"><input type="checkbox" data-k="bi" ${p.bi?'checked':''}> Bidirecional (nervuras nos dois sentidos)</label>
 ${inp('pp','Peso próprio (gₖ)',uv(p.pp),U.A(),'automático')}
 <label class="r77"><span>Direção das vigotas</span><select data-k="dir">${inherit?`<option value="" ${p.dir==null?'selected':''}>Igual ao pavimento (${N(dp.dir)===90?'↕':'↔'})</option>`:''}<option value="0" ${p.dir!=null&&N(p.dir)===0?'selected':''}>↔ horizontal na planta</option><option value="90" ${N(p.dir)===90?'selected':''}>↕ vertical na planta</option></select></label>
 <label class="r77"><span>Bordas (maciça)</span><select data-k="edge">${inherit?`<option value="" ${p.edge==null?'selected':''}>Igual ao pavimento</option>`:''}<option value="auto" ${p.edge==='auto'?'selected':''}>Contínuas = engastadas (60°), demais apoiadas (45°)</option><option value="apoiada" ${p.edge==='apoiada'?'selected':''}>Todas apoiadas (45°)</option></select></label>
 <p class="note">Treliçada: peso próprio típico com enchimento cerâmico (TR8 1,60 · TR12 2,00 · TR16 2,40 · TR20 2,90 kN/m²) — informe o do fabricante se for outro (EPS, outra capa).</p>`;}
function openPop(it,isNew){closePop();const d=document.createElement('div');d.id='ld77pop';d.className='noPrint';const e=editCtx();const dp=it.kind==='lvl'?null:(it.tgt==='cob'?{...S().roof}:lvDef(itemKey(it)));
 const T0={edge:'⌒ Beiral / balanço da laje',rect:'▭ Região de ação (retângulo)',poly:'⬠ Região de ação (polígono)',panel:'▦ Painel de laje',div:'╱ Linha divisória da laje',line:'━ Carga linear',point:'● Carga concentrada',lvl:'⚙ Laje e ações do pavimento',roof:'⚙ Laje de cobertura',gnd:'⚙ Laje do piso térreo'}[it.kind],T=it.title?T0.replace(/^⚙ .*/,'⚙ '+it.title):T0;
 let body='';
 if(it.kind==='lvl'||it.kind==='roof'){const p=it.data;body=(it.kind==='roof'?`<label class="ck77"><input type="checkbox" data-k="on" ${p.on?'checked':''}> Considerar laje de cobertura sobre o último pavimento</label>`:'')+slabFields(p,false,p)+inp('g','Permanente gₖ (contrapiso, piso, forro)',U.f(p.g),U.A())+inp('q','Variável qₖ (uso)',U.f(p.q),U.A())+sugHTML()+
  `<p class="note">Vale para toda a laje ${it.kind==='roof'?'de cobertura':'deste piso'}. Painéis e regiões desenhados mudam só a parte deles. O peso próprio entra além de gₖ.</p>`;}
 else if(it.kind==='gnd'){const p=it.data;body=`<label class="r77"><span>Tipo de piso</span><select data-k="base"><option value="sem" ${p.base==='sem'?'selected':''}>Sem laje (só o piso)</option><option value="solo" ${p.base==='solo'?'selected':''}>Contrapiso / laje sobre o solo (tela)</option><option value="radier" ${p.base==='radier'?'selected':''}>Radier (concreto armado)</option></select></label>`+inp('h','Espessura do radier',p.h,'cm')+inp('pp','Peso próprio (gₖ)',uv(p.pp),U.A(),'automático')+inp('g','Permanente gₖ (contrapiso, piso)',U.f(p.g),U.A())+inp('q','Variável qₖ (uso)',U.f(p.q),U.A())+sugHTML()+
  '<p class="note">O piso do pavimento mais baixo não carrega as paredes: vai direto para a fundação. No radier, ele entra no total da fundação junto com as cargas das paredes (mapa e tabela de cargas). No contrapiso, só o gₖ informado (sem peso próprio de laje).</p>';}
 else if(it.kind==='panel'){body=`<label class="r77"><span>Nome</span><input data-k="name" value="${esc(it.name||'')}" placeholder="ex.: Sala"></label>`+slabFields(it,true,dp)+inp('g','Permanente gₖ',uv(it.g),U.A(),'igual: '+fx(U.f(N(dp.g)),2))+inp('q','Variável qₖ',uv(it.q),U.A(),'igual: '+fx(U.f(N(dp.q)),2))+sugHTML()+'<p class="note">Campos vazios = iguais ao pavimento. O peso próprio da laje entra além de gₖ.</p>';}
 else if(it.kind==='rect'||it.kind==='poly'){body=`<label class="r77"><span>Nome</span><input data-k="name" value="${esc(it.name||'')}" placeholder="ex.: Área técnica"></label>`+inp('g','Permanente gₖ',uv(it.g),U.A())+inp('q','Variável qₖ',uv(it.q),U.A())+
  `<label class="r77"><span>Modo</span><select data-k="mode"><option value="sub" ${it.mode!=='add'?'selected':''}>Substitui gₖ e qₖ da laje nesta região</option><option value="add" ${it.mode==='add'?'selected':''}>Soma às ações da laje</option></select></label>`+sugHTML()+
  `<details class="h77"><summary>Ajudante: terra / jardim</summary><label class="r77"><span>Espessura de terra</span><input data-k="hTerra" value="40"><em>cm</em></label><label class="r77"><span>Peso específico</span><input data-k="gTerra" value="18"><em>kN/m³</em></label><button type="button" data-a="terra" class="secondary">Aplicar em gₖ</button></details><p class="note">O peso próprio da laje continua valendo também na região.</p>`;}
 else if(it.kind==='line'){body=`<label class="r77"><span>Nome</span><input data-k="name" value="${esc(it.name||'')}" placeholder="ex.: Parede sobre laje"></label>`+inp('g','Permanente gₖ',uv(it.g),U.L())+inp('q','Variável qₖ',uv(it.q),U.L())+
  `<details class="h77" ${isNew?'open':''}><summary>Ajudante: parede sobre a laje → ${U.L()}</summary><label class="r77"><span>Bloco</span><select data-k="hMat"><option value="concreto">Concreto</option><option value="ceramico">Cerâmico</option></select></label><label class="r77"><span>Largura do bloco</span><select data-k="hT">${[9,11.5,14,19].map(t=>`<option value="${t}" ${t===14?'selected':''}>${fx(t,t%1?1:0)} cm</option>`).join('')}</select></label><label class="r77"><span>Altura da parede</span><input data-k="hH" value="260"><em>cm</em></label><label class="r77"><span>Revestimento por face</span><input data-k="hR" value="${fx(S().cfg.rev,1)}"><em>cm</em></label><button type="button" data-a="wall" class="secondary">Aplicar em gₖ</button><p class="note" data-k="hOut"></p></details>`;}
 else if(it.kind==='point'){body=`<label class="r77"><span>Nome</span><input data-k="name" value="${esc(it.name||'')}" placeholder="ex.: Caixa-d'água"></label>`+inp('g','Permanente Fₖ,g',uv(it.g),U.F())+inp('q','Variável Fₖ,q',uv(it.q),U.F())+`<p class="note">Ex.: caixa-d'água de 1000 L cheia ≈ 10 kN (água) + peso próprio.</p>`;}
 else if(it.kind==='edge'){body=`<label class="r77"><span>Nome</span><input data-k="name" value="${esc(it.name||'')}" placeholder="ex.: Beiral frente"></label><p class="note">Esta área passa a fazer parte da laje (mesmo tipo, peso próprio, gₖ e qₖ do pavimento ou do painel vizinho). A carga vai para a parede onde o balanço engasta e o programa calcula o <b>momento no engaste</b> (kN·m/m) para conferência. Uma parede ou platibanda na ponta do beiral: lance com “Carga linear” sobre a borda — ela entra na carga e no momento.</p>`;}
 else if(it.kind==='div'){body='<p class="note">Separa a laje em painéis. Depois use “Painel de laje” para dar tipo, direção ou ações diferentes a cada lado.</p>';}
 d.innerHTML=`<div class="h">${T}</div><div class="b">${body}</div><div class="f"><button type="button" data-a="ok">${isNew?'Salvar':'Salvar'}</button>${it.kind==='lvl'||it.kind==='roof'||it.kind==='gnd'?'':'<button type="button" data-a="del" class="secondary">Excluir</button>'}<button type="button" data-a="x" class="secondary">Fechar</button></div>`;
 document.body.append(d);const q=k=>d.querySelector(`[data-k="${k}"]`);
 d.querySelector('[data-k="sug"]')?.addEventListener('change',ev=>{const v=pnum(ev.target.value);if(Number.isFinite(v)){q('q').value=fx(U.f(v),2);}ev.target.value='';});
 const ty=q('type');const sync=()=>{if(!ty)return;const inh=ty.value==='inherit',t=inh?dp?.type:ty.value,biEl=q('bi'),bi=inh?!!dp?.bi:!!biEl?.checked;const uni=t==='alv'||(isTR(t)&&!bi);const dr=q('dir')?.closest('label'),ed=q('edge')?.closest('label'),hl=q('h')?.closest('label'),bl=biEl?.closest('label');if(dr)dr.style.display=uni?'':'none';if(ed)ed.style.display=t==='mac'?'':'none';if(hl)hl.style.display=(t==='mac'||t==='alv')&&!inh?'':'none';if(bl)bl.style.display=isTR(t)&&!inh?'':'none';const pp=q('pp');if(pp){const h=pnum(q('h').value);pp.placeholder='automático: '+fx(U.f(ppDefault(t,Number.isFinite(h)?h:(t==='mac'?10:15),bi)),2);}};q('bi')?.addEventListener('change',sync);ty?.addEventListener('change',sync);q('h')?.addEventListener('input',sync);sync();
 d.addEventListener('click',ev=>{const a=ev.target.dataset?.a;if(!a)return;
  if(a==='x'){closePop();return;}
  if(a==='del'){S().items=S().items.filter(x=>x!==it);touch();closePop();drawPlan();refreshSide();return;}
  if(a==='terra'){const h=pnum(q('hTerra').value),g=pnum(q('gTerra').value);if(h>0&&g>0){q('g').value=fx(U.f(h/100*g),2);if(q('mode'))q('mode').value='add';}return;}
  if(a==='wall'){const t=N(q('hT').value),H=pnum(q('hH').value),rv=pnum(q('hR').value),tab=WPM[q('hMat').value]||WPM.concreto,pm=(tab[t]||tab[14]*t/14)+2*(Number.isFinite(rv)?rv:0)*N(S().cfg.gRev)/100;if(H>0){const v=pm*H/100;q('g').value=fx(U.f(v),2);q('hOut').textContent=fx(pm,2)+' kN/m² × '+fx(H/100,2)+' m = '+fx(v,2)+' kN/m';}return;}
  if(a==='ok'){const get=k=>{const el=q(k);if(!el)return undefined;const v=pnum(el.value);return Number.isFinite(v)?v:null;};
   if(it.kind==='gnd'){const p=it.data;p.base=q('base').value;p.type='mac';p.h=get('h')??15;const pp=get('pp');p.pp=pp==null?null:U.b(pp);p.g=U.b(get('g')??0);p.q=U.b(get('q')??0);it.save(p);}
   else if(it.kind==='lvl'||it.kind==='roof'){const p=it.data;p.type=q('type').value;p.h=isTR(p.type)?TYPES[p.type].h:(get('h')??10);p.bi=isTR(p.type)&&!!q('bi')?.checked;const pp=get('pp');p.pp=pp==null?null:U.b(pp);p.dir=N(q('dir').value)||0;p.edge=q('edge').value;p.g=U.b(get('g')??0);p.q=U.b(get('q')??0);if(it.kind==='roof')p.on=q('on').checked;it.save(p);}
   else{if(q('name'))it.name=q('name').value.trim();if(it.kind==='panel'){it.type=q('type').value;it.h=it.type==='mac'||it.type==='alv'?(get('h')??10):isTR(it.type)?TYPES[it.type].h:null;it.bi=isTR(it.type)?!!q('bi')?.checked:null;const pp=get('pp');it.pp=pp==null?null:U.b(pp);it.dir=q('dir').value===''?null:N(q('dir').value);it.edge=q('edge').value||null;const g=get('g'),qq=get('q');it.g=g==null?null:U.b(g);it.q=qq==null?null:U.b(qq);}
    else{if(q('g'))it.g=U.b(get('g')??0);if(q('q'))it.q=U.b(get('q')??0);if(q('mode'))it.mode=q('mode').value;}}
   touch();closePop();drawPlan();refreshSide();if($('ld77dlg')?.style.display==='flex')renderDlg();}});}
function at94(P){const e=editCtx(),v=getViz();if(!v)return {e,v:null};const W=window.world74(e.pg,P),c=v.cell(W),k=c>=0?v.comp[c]:-1;if(k<0)return {e,v,outside:true};const pr=v.props[k]||v.def;return {e,v,comp:k,prop:pr,item:pr.item||null,ground:!!v.ground};}
function lvlOf94(){const e=editCtx();return e.tgt==='cob'?{...S().roof}:e.tgt==='tipo'?lvDef(e.key+'#tipo'):(!e.below&&!e.selfRep)?gDef(e.key):lvDef(e.key);}
function setLevel94(vals){const e=editCtx();if(e.tgt==='cob')S().roof={...S().roof,...vals};else if(e.tgt==='tipo')S().lv[e.key+'#tipo']={...lvDef(e.key+'#tipo'),...vals};else if(!e.below)S().lv[e.key]={...gDef(e.key),...vals};else S().lv[e.key]={...lvDef(e.key),...vals};touch();drawPlan();}
function setPanel94(P,vals){const r=at94(P);if(!r.v||r.outside)return false;let it=r.item;if(!it){const e=r.e;it={id:newId(),kind:'panel',page:e.pg,tgt:e.tgt,pts:[{x:P.x,y:P.y}],name:'',g:null,q:null,mode:'sub',type:'inherit',h:null,pp:null,dir:null,edge:null};if(e.key!==keyOfPage(e.pg))it.slab92=e.key;if(isOwn(e.key,e.tgt,e.rj))it.rep102=e.rj;S().items.push(it);}
 Object.assign(it,vals);if(vals.type&&vals.type!=='mac'&&vals.type!=='alv')it.h=null;it.pp=null;touch();drawPlan();return true;}
function clearPanel94(P){const r=at94(P);if(!r.item)return false;S().items=S().items.filter(x=>x!==r.item);touch();drawPlan();return true;}
window.slab94={at:at94,level:lvlOf94,setLevel:setLevel94,setPanel:setPanel94,clearPanel:clearPanel94,edge:()=>startTool('edge'),types:()=>TYPES,ctx:()=>editCtx(),ppDefault};
function editLevel(){const e=editCtx();if(e.tgt==='cob'){const p={...S().roof};openPop({kind:'roof',data:p,save:v=>{S().roof={...S().roof,...v};}},false);return;}
 if(e.tgt==='tipo'){const p=lvDef(e.key+'#tipo');openPop({kind:'lvl',data:p,title:'Laje do tipo (repetições)',save:v=>{S().lv[e.key+'#tipo']={...v};}},false);return;}
 if(!e.below){const p=gDef(e.key);openPop({kind:'gnd',data:p,title:slabName(e.key),save:v=>{S().lv[e.key]={...v};}},false);return;}
 const p=lvDef(e.key);openPop({kind:'lvl',data:p,title:slabName(e.key),save:v=>{S().lv[e.key]={...v};}},false);}

// ---------- 7. Configurações gerais
function openCfg(){closePop();const c=S().cfg,d=document.createElement('div');d.id='ld77pop';d.className='noPrint';const LV=levels();const widths=[...new Set(LV.flatMap(l=>l.I.map(x=>x.t)))].sort((a,b)=>a-b);if(!widths.length)widths.push(14,19);
 d.innerHTML=`<div class="h">⚙ Cargas · configurações</div><div class="b">
 <label class="r77"><span>Unidades</span><select data-k="unit"><option value="kN" ${c.unit!=='tf'?'selected':''}>kN · kN/m · kN/m²</option><option value="tf" ${c.unit==='tf'?'selected':''}>tf · tf/m · tf/m²</option></select></label>
 <label class="r77"><span>1 tf =</span><select data-k="tf"><option value="9.80665" ${N(c.tf)!==10?'selected':''}>9,80665 kN (exato)</option><option value="10" ${N(c.tf)===10?'selected':''}>10 kN (arredondado)</option></select></label>
 <label class="r77"><span>γg (permanentes)</span><input data-k="gG" value="${fx(c.gG,2)}"></label><label class="r77"><span>γq (variáveis)</span><input data-k="gQ" value="${fx(c.gQ,2)}"></label>
 <p class="note">p<sub>d</sub> = γg·gₖ + γq·qₖ (combinação normal; 1,4 e 1,4 por padrão).</p>
 <h4>Peso próprio das paredes (gₖ)</h4>
 <label class="r77"><span>Material dos blocos</span><select data-k="mat"><option value="concreto" ${c.mat!=='ceramico'?'selected':''}>Concreto</option><option value="ceramico" ${c.mat==='ceramico'?'selected':''}>Cerâmico</option></select></label>
 ${widths.map(t=>`<label class="r77"><span>Parede ${fx(t,t%1?1:0)} cm · blocos + assentamento</span><input data-k="w${t}" value="${N(c.wpm?.[t])>0?fx(N(c.wpm[t]),2):''}" placeholder="${fx(((WPM[c.mat]||WPM.concreto)[t]||(WPM[c.mat]||WPM.concreto)[14]*t/14),2)}"><em>kN/m²</em></label>`).join('')}
 <label class="r77"><span>Revestimento por face</span><input data-k="rev" value="${fx(c.rev,1)}"><em>cm</em></label><label class="r77"><span>Peso esp. do revestimento</span><input data-k="gRev" value="${fx(c.gRev,0)}"><em>kN/m³</em></label>
 <label class="ck77"><input type="checkbox" data-k="grout" ${c.grout?'checked':''}> Incluir graute (furos nas pontas, encontros e ombreiras; canaleta de respaldo, vergas e contravergas)</label>
 <label class="r77"><span>Peso esp. do graute</span><input data-k="gGr" value="${fx(c.gGr,0)}"><em>kN/m³</em></label>
 <p class="note">Valores médios, editáveis: deixe vazio para usar o padrão ou informe o dado do fabricante.</p>
 <h4>Distribuição</h4>
 <label class="r77"><span>Faixa nas paredes paralelas às vigotas</span><input data-k="strip" value="${fx(c.strip,0)}"><em>cm</em></label>
 <label class="ck77"><input type="checkbox" data-k="plot" ${c.plot!==false?'checked':''}> Mapa e tabela de cargas na 1ª prancha (antes da locação)</label>
 <p class="note">0 = desligado. Com valor, a parede paralela às vigotas recebe a laje até essa distância (critério do projetista, não exigência de norma). Vãos entre paredes da laje fecham conforme a Vista 3D (“Fechar vãos… até ${fx(GEO()?.opt3?.close??120,0)} cm”).</p>
 </div><div class="f"><button type="button" data-a="ok">Salvar</button><button type="button" data-a="x" class="secondary">Fechar</button></div>`;
 document.body.append(d);const q=k=>d.querySelector(`[data-k="${k}"]`);
 q('mat').onchange=()=>{const tab=WPM[q('mat').value]||WPM.concreto;widths.forEach(t=>{const el=q('w'+t);if(el)el.placeholder=fx(tab[t]||tab[14]*t/14,2);});};
 d.addEventListener('click',ev=>{const a=ev.target.dataset?.a;if(a==='x'){closePop();return;}if(a!=='ok')return;const g=k=>{const v=pnum(q(k).value);return Number.isFinite(v)?v:null;};
  c.unit=q('unit').value;c.tf=N(q('tf').value);c.gG=g('gG')??1.4;c.gQ=g('gQ')??1.4;c.mat=q('mat').value;c.wpm={};widths.forEach(t=>{const v=g('w'+t);if(v>0)c.wpm[t]=v;});c.rev=g('rev')??1.5;c.gRev=g('gRev')??19;c.grout=q('grout').checked;c.gGr=g('gGr')??22;c.strip=Math.max(0,g('strip')??0);c.plot=q('plot').checked;
  touch();closePop();drawPlan();refreshSide();if($('ld77dlg')?.style.display==='flex')renderDlg();});}

// ---------- 8. Grupo na coluna de ferramentas
function refreshSide(){const box=$('ld77side');if(!box)return;const e=editCtx(),s=S();box.querySelectorAll('[data-t]').forEach(b=>b.classList.toggle('on77',tool===b.dataset.t));
 const sel=$('ld77tgt');if(sel){const oc=sel.querySelector('[value="cob"]'),op=sel.querySelector('[value="piso"]');oc.disabled=!e.isTop;op.disabled=false;
  op.textContent=slabName(e.key)+(e.below?' → paredes de baixo':' — '+baseTxt(gDef(e.key).base));oc.textContent=e.isTop?roofName(e.self):'Laje de cobertura — só no último pavimento';sel.value=e.tgt;}
 const why=$('ld77why');if(why){const LVn=e.LV.length,pgs=(()=>{try{return pages36.map(q=>q.id);}catch{return [];}})(),same=pgs.filter(q=>keyOfPage(q)===e.key).length;let msg='';
  if(!e.below){msg=(e.isTop?'<b>Por que só cobertura?</b> ':'<b>Nada a lançar nesta planta.</b> ')+esc(L68()?.nameOf?L68().nameOf(e.key):'Este nível')+' é o pavimento mais baixo do projeto: o piso dele fica apoiado no solo e não carrega paredes. ';
   if(LVn<=1&&pgs.length>1)msg+=(same>1?'As '+same+' plantas estão no <b>mesmo nível</b>. ':'')+'Informe o nível de cada planta (valor em metros e descrição, no quadro de níveis acima da planta, ao lado de “Repetições”) para o programa saber qual pavimento fica em cima de qual.';
   else if(LVn<=1)msg+='Para lançar o piso de um pavimento de cima, carregue a planta dele e informe o nível.';
   else msg+='Abra a planta de um pavimento de cima para lançar o piso dele.';}
  msg='';why.innerHTML=msg;why.style.display=msg?'block':'none';}
 const n=$('ld77note');if(n){const its=S().items.filter(it=>itemKey(it)===e.key&&(it.tgt||'piso')===e.tgt);const p=e.tgt==='cob'?s.roof:e.ground?gDef(e.key):lvDef(e.key);
  n.innerHTML=e.ground?(p.base==='radier'?'Radier h='+fx(N(p.h),0)+' cm · pp '+fx(U.f(ppOf(p)),2):'Contrapiso sobre o solo')+' · gₖ '+fx(U.f(N(p.g)),2)+' · qₖ '+fx(U.f(N(p.q)),2)+' '+U.A()+'<br>Não carrega as paredes: vai direto para a fundação. '+its.length+' ação(ões) lançadas aqui.':(esc(typeTxt(p))+(uniOf(p)?(N(p.dir)===90?' ↕':' ↔'):'')+' · pp '+fx(U.f(ppOf(p)),2)+' · gₖ '+fx(U.f(N(p.g)),2)+' · qₖ '+fx(U.f(N(p.q)),2)+' '+U.A()+'<br>'+its.length+' ação(ões)/painel(is) lançados aqui.');}
 const sh=$('ld77show');if(sh)sh.checked=!!s.cfg.show;const inf=$('ld77infl');if(inf)inf.checked=!!s.cfg.infl;}
{const side=$('tools62');if(side){const g=document.createElement('details');g.className='grp62 grp77';g.open=true;g.innerHTML='<summary>Cargas (ações)</summary>';const body=document.createElement('div');body.className='grpBody62';body.id='ld77side';
 const btn=(t,ico,txt,fn,title='',cls='secondary')=>{const b=document.createElement('button');b.type='button';b.className=cls;if(t)b.dataset.t=t;b.title=title;b.innerHTML='<span class="ico62">'+ico+'</span><span>'+txt+'</span>';b.onclick=fn;body.append(b);return b;};
 const lab=document.createElement('label');lab.className='tgt77';lab.innerHTML='Lançando em <select id="ld77tgt"><option value="piso">Laje deste pavimento</option><option value="cob">Laje de cobertura</option></select>';body.append(lab);
 lab.querySelector('select').onchange=e=>{S().cfg.tgt=e.target.value;cancelTool();refreshSide();drawPlan();};const why=document.createElement('p');why.id='ld77why';why.className='note why77';body.append(why);
 btn('','⚙','Laje e ações do pavimento',editLevel,'Tipo de laje, altura, direção das vigotas, gₖ e qₖ que valem para todo o piso.');
 btn('panel','▦','Painel de laje (clique dentro)',()=>startTool('panel'),'Muda tipo, direção das vigotas ou ações só de um painel.');
 btn('div','╱','Linha divisória da laje',()=>startTool('div'));
 btn('edge','⌒','Beiral / balanço (borda da laje)',()=>startTool('edge'),'Contorne a parte da laje em balanço (beiral, varanda). Carga e momento vão para a parede onde engasta.');
 btn('rect','▭','Retângulo de ação',()=>startTool('rect'));
 btn('poly','⬠','Polígono de ação',()=>startTool('poly'));
 btn('line','━','Carga linear',()=>startTool('line'),'Parede sobre laje, peitoril, guarda-corpo…');
 btn('point','●','Carga concentrada',()=>startTool('point'));
 btn('edit','✎','Editar / excluir ação',()=>startTool('edit'));
 const ck=(id,txt,k)=>{const l=document.createElement('label');l.className='ck77';l.innerHTML=`<input type="checkbox" id="${id}"> ${txt}`;body.append(l);l.querySelector('input').onchange=e=>{S().cfg[k]=e.target.checked;drawPlan();};};
 ck('ld77show','Mostrar cargas na planta','show');ck('ld77infl','Mostrar áreas de influência (cores)','infl');
 btn('','📊','Planta de cargas',()=>openDlg(),'Carga acumulada na base das paredes, por pavimento.','');
 btn('','⚙','Configurações (unidades, paredes, γ)',openCfg);
 const n=document.createElement('p');n.id='ld77note';n.className='note';n.style.cssText='margin:2px 0 0;font-size:11.5px';body.append(n);
 g.append(body);const after=side.querySelector('.grp74');if(after)after.after(g);else side.append(g);}}
$('page')?.addEventListener('change',()=>setTimeout(()=>{if(tool)cancelTool();refreshSide();},60));try{const rp=renderPage;renderPage=async function(...a){const r=await rp.apply(this,a);try{if(tool)cancelTool();refreshSide();}catch{}return r;};}catch{}
const rw=renderWalls;renderWalls=function(...a){const r=rw.apply(this,a);try{touch();refreshSide();}catch{}return r;};
for(const id of ['newProject','example']){const b=$(id);if(!b)continue;const old=b.onclick;b.onclick=function(...a){const r=old?.apply(this,a);state.loads77=null;touch();setTimeout(refreshSide,0);return r;};}
{const r=$('restore');if(r){const old=r.onchange;r.onchange=async function(...a){const res=await old?.apply(this,a);try{touch();refreshSide();}catch{}return res;};}}
try{const inv=invalidate;invalidate=function(...a){touch();return inv.apply(this,a);};}catch{}

function groundTxt(R,rows,html=true){const g=R.ground;if(!g||!(g.st.area>0)||g.base!=='radier')return '';const G=g.st.G,Q=g.st.Q,A=g.st.area,WG=rows.reduce((a,r)=>a+r.G,0),WQ=rows.reduce((a,r)=>a+r.Q,0),b=html?(t=>'<b>'+t+'</b>'):(t=>t);
 return g.name+' — '+baseTxt(g.base)+(g.base==='radier'?' h='+fx(N(g.def.h),0)+' cm':'')+': '+fx(A,1)+' m² · Gₖ '+fx(U.f(G),1)+' · Qₖ '+fx(U.f(Q),1)+' '+U.F()+' (média '+fx(U.f((G+Q)/A),2)+' '+U.A()+').'+(g.base==='radier'?' Total na fundação = paredes ('+fx(U.f(WG+WQ),1)+') + radier ('+fx(U.f(G+Q),1)+') = '+b(fx(U.f(WG+WQ+G+Q),1)+' '+U.F())+'.':' Não entra nas paredes.');}
// ---------- 9. Planta de cargas (janela)
const dlg={show:'p',lv:null,sel:null};
function openDlg(){let d=$('ld77dlg');if(!d){d=document.createElement('div');d.id='ld77dlg';d.className='noPrint';document.body.append(d);}d.style.display='flex';document.body.classList.add('ld77dlgOn');renderDlg();}
function closeDlg(){const d=$('ld77dlg');if(d)d.style.display='none';document.body.classList.remove('ld77dlgOn');}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('ld77dlg')?.style.display==='flex'&&!$('ld77pop'))closeDlg();});
const valOf=(r,k)=>{const c=S().cfg;return k==='g'?r.g:k==='q'?r.q:k==='d'?N(c.gG)*r.g+N(c.gQ)*r.q:r.g+r.q;};
const KN={g:'gₖ',q:'qₖ',p:'pₖ = gₖ + qₖ',d:'p_d = γg·gₖ + γq·qₖ'};
function heat(t){t=Math.max(0,Math.min(1,t));const a=[46,158,87],b=[242,183,5],c=[217,58,43];const m=t<.5?a.map((v,i)=>v+(b[i]-v)*t*2):b.map((v,i)=>v+(c[i]-v)*(t-.5)*2);return 'rgb('+m.map(Math.round).join(',')+')';}
function planSVG(R,li,opts={}){const l=R.LV[li],rows=R.rows[li],k=dlg.show;const ws=l.I;let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;ws.forEach(x=>{for(const P of [x.g.A,x.g.B]){x0=Math.min(x0,P.x);x1=Math.max(x1,P.x);y0=Math.min(y0,P.y);y1=Math.max(y1,P.y);}});
 const pad=90,W=x1-x0+2*pad,H=y1-y0+2*pad,T=P=>[P.x-x0+pad,y1-P.y+pad];const vals=rows.map(r=>valOf(r,k)),mn=Math.min(...vals),mx=Math.max(...vals);const fs=Math.max(14,Math.min(W,H)/55);
 let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" ${opts.size||'width="100%" height="100%"'} font-family="Arial" style="background:#fff">`;
 rows.forEach((r,j)=>{const x=ws[j],A=T(x.g.A),B=T(x.g.B),t=mx-mn>Math.max(.05*mx,1e-9)?(vals[j]-mn)/(mx-mn):.5,col=R.flagged.has(x.w)?'#7c3aed':heat(t);
  s+=`<line x1="${A[0].toFixed(1)}" y1="${A[1].toFixed(1)}" x2="${B[0].toFixed(1)}" y2="${B[1].toFixed(1)}" stroke="${col}" stroke-width="${Math.max(x.t,10)*1.25}" stroke-linecap="square" data-w="${j}" style="cursor:pointer"${dlg.sel===j?' stroke-opacity=".75"':''}/>`;
  for(const o of x.ops){const a=T({x:x.g.A.x+x.g.u[0]*o.a,y:x.g.A.y+x.g.u[1]*o.a}),b=T({x:x.g.A.x+x.g.u[0]*o.b,y:x.g.A.y+x.g.u[1]*o.b});s+=`<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="#fff" stroke-width="${Math.max(x.t,10)*.7}" pointer-events="none"/>`;}
  if(dlg.sel===j)s+=`<line x1="${A[0].toFixed(1)}" y1="${A[1].toFixed(1)}" x2="${B[0].toFixed(1)}" y2="${B[1].toFixed(1)}" stroke="#102e4b" stroke-width="3" stroke-dasharray="10 6" pointer-events="none"/>`;});
 rows.forEach((r,j)=>{const x=ws[j],M=T({x:(x.g.A.x+x.g.B.x)/2,y:(x.g.A.y+x.g.B.y)/2}),ang=Math.atan2(-(x.g.u[1]),x.g.u[0])*180/Math.PI,a=ang>90||ang<-90?ang+180:ang,off=Math.max(x.t,10)*.6+fs*.45;const nx=Math.sin(a*Math.PI/180),ny=-Math.cos(a*Math.PI/180);
  const txt=r.label+' · '+fx(U.f(vals[j]),2)+' '+U.L();s+=`<text x="${(M[0]+nx*off).toFixed(1)}" y="${(M[1]+ny*off).toFixed(1)}" font-size="${fs.toFixed(1)}" font-weight="700" text-anchor="middle" fill="#102e4b" transform="rotate(${a.toFixed(2)} ${(M[0]+nx*off).toFixed(1)} ${(M[1]+ny*off).toFixed(1)})" paint-order="stroke" stroke="#fff" stroke-width="${(fs/4).toFixed(1)}" pointer-events="none">${esc(txt)}</text>`;});
 const lw=Math.min(W*.35,420),lx=W-lw-20,ly=H-34;s+=`<defs><linearGradient id="hg77"><stop offset="0" stop-color="${heat(0)}"/><stop offset=".5" stop-color="${heat(.5)}"/><stop offset="1" stop-color="${heat(1)}"/></linearGradient></defs><rect x="${lx}" y="${ly}" width="${lw}" height="12" fill="url(#hg77)" rx="3"/><text x="${lx}" y="${ly-6}" font-size="${(fs*.8).toFixed(1)}" fill="#5b6b7b">${fx(U.f(mn),2)}</text><text x="${lx+lw}" y="${ly-6}" font-size="${(fs*.8).toFixed(1)}" fill="#5b6b7b" text-anchor="end">${fx(U.f(mx),2)} ${U.L()}</text>${R.flagged.size?`<rect x="${lx}" y="${ly+20}" width="14" height="10" fill="#7c3aed"/><text x="${lx+20}" y="${ly+30}" font-size="${(fs*.75).toFixed(1)}" fill="#5b6b7b">sem parede embaixo (desce pela laje)</text>`:''}`;
 return s+'</svg>';}
function renderDlg(){const d=$('ld77dlg');if(!d)return;let R;try{R=compute({});}catch(e){console.error(e);d.innerHTML='<div class="bar77"><b>Planta de cargas</b><span class="sp77"></span><button type="button" id="ld77close">Fechar</button></div><p class="warn74">Erro no cálculo: '+esc(e.message)+'</p>';$('ld77close').onclick=closeDlg;return;}
 const s=S(),c=s.cfg;if(!R.LV.length){d.innerHTML='<div class="bar77"><b>Planta de cargas</b><span class="sp77"></span><button type="button" id="ld77close">Fechar</button></div><p class="note" style="padding:20px">Nenhuma parede posicionada na planta.</p>';$('ld77close').onclick=closeDlg;return;}
 let li=R.LV.findIndex(l=>l.key===dlg.lv);if(li<0)li=0;dlg.lv=R.LV[li].key;const l=R.LV[li],rows=R.rows[li];if(dlg.sel!=null&&!rows[dlg.sel])dlg.sel=null;
 const lvSel=R.LV.map((x,i)=>`<option value="${esc(x.key)}" ${i===li?'selected':''}>${esc(x.name)}${x.rep>1?' × '+x.rep:''}${i===0?' — base (fundação)':''}</option>`).join('');
 const sorted=rows.map((r,j)=>({r,j})).sort((a,b)=>valOf(b.r,'p')-valOf(a.r,'p'));
 const tab=`<table class="t77"><thead><tr><th>Parede</th><th>gₖ</th><th>qₖ</th><th>pₖ</th><th>p<sub>d</sub></th><th>máx pₖ</th></tr></thead><tbody>${sorted.map(({r,j})=>`<tr data-w="${j}" class="${dlg.sel===j?'sel77':''}${R.flagged.has(r.w)?' fl77':''}"><td>${esc(r.label)}</td><td>${fx(U.f(r.g))}</td><td>${fx(U.f(r.q))}</td><td><b>${fx(U.f(r.p))}</b></td><td>${fx(U.f(valOf(r,'d')))}</td><td>${fx(U.f(r.max))}</td></tr>`).join('')}</tbody></table>`;
 const totG=rows.reduce((a,r)=>a+r.G,0),totQ=rows.reduce((a,r)=>a+r.Q,0);
 let det='<p class="note">Clique numa parede (no desenho ou na tabela) para ver de onde vem a carga.</p>';
 if(dlg.sel!=null){const r=rows[dlg.sel],x=r.x,parts=ownParts(x),tf=U.f;const per=R.LV.map(L2=>{const rr=compute({lv:L2.key}).rows[li][dlg.sel];return {n:L2.name,g:rr.G/r.L,q:rr.Q/r.L};}).filter(p=>p.g>1e-6||p.q>1e-6);
  det=`<h4>${esc(r.label)} · ${esc(l.name)}</h4><p class="note">Comprimento ${fx(x.L/100,2)} m (${fx(r.L,2)} m sem aberturas) · largura ${fx(x.t,1)} cm · altura ${fx(x.H,0)} cm</p>
  <table class="t77"><thead><tr><th>Origem (pavimento)</th><th>gₖ</th><th>qₖ</th></tr></thead><tbody>${per.map(p=>`<tr><td>${esc(p.n)}</td><td>${fx(tf(p.g))}</td><td>${fx(tf(p.q))}</td></tr>`).join('')}<tr><td><b>Total na base</b></td><td><b>${fx(tf(r.g))}</b></td><td><b>${fx(tf(r.q))}</b></td></tr></tbody></table><p class="note">Valores em ${U.L()} (média no comprimento sem aberturas).</p>
  <p class="note">Peso próprio desta parede (1 pavimento): blocos ${fx(tf(parts.blocos))} + revestimento ${fx(tf(parts.rev))} + graute ${fx(tf(parts.graute))} = ${fx(tf(parts.blocos+parts.rev+parts.graute))} ${U.F()}.</p>`;}
 const slabInfo=R.slabs.filter(sl=>sl.lvl>=li||sl.kind==='cob').map(sl=>`<li>${esc(sl.name)}${sl.times?' × '+sl.times:''}: ${fx(sl.st.area,1)} m² · Gₖ ${fx(U.f(sl.st.G),1)} · Qₖ ${fx(U.f(sl.st.Q),1)} ${U.F()} <span class="note">(${esc(typeTxt(sl.def))})</span></li>`).join('');
 d.innerHTML=`<div class="bar77"><b>Planta de cargas</b><span class="note">carga linear acumulada na base de cada parede · valores característicos · NBR 6120 / NBR 8681</span><span class="sp77"></span><button type="button" id="ld77dxf" class="secondary">Baixar DXF</button><button type="button" id="ld77xls" class="secondary">Baixar Excel (memória)</button><button type="button" id="ld77prn" class="secondary">Imprimir / PDF</button><button type="button" id="ld77close">Fechar</button></div>
 <div class="body77"><div class="cv77" id="ld77cv">${planSVG(R,li)}</div><aside class="side77">
 <h4>Mostrar</h4><div class="seg77" id="ld77show">${['g','q','p','d'].map(k=>`<button type="button" data-k="${k}" class="${dlg.show===k?'on':''}">${{g:'gₖ',q:'qₖ',p:'pₖ',d:'p<sub>d</sub>'}[k]}</button>`).join('')}</div>
 <p class="note">${KN[dlg.show].replace('p_d','p<sub>d</sub>')}${dlg.show==='d'?' (γg = '+fx(c.gG,2)+' · γq = '+fx(c.gQ,2)+')':''}</p>
 <div class="seg77" id="ld77unit"><button type="button" data-u="kN" class="${c.unit!=='tf'?'on':''}">kN/m</button><button type="button" data-u="tf" class="${c.unit==='tf'?'on':''}">tf/m</button></div><p class="note">1 tf = ${fx(c.tf,N(c.tf)===10?0:5)} kN · <a href="#" id="ld77cfg">configurações</a></p>
 <label>Ver na base de<select id="ld77lv">${lvSel}</select></label>
 <div class="seg77" id="ld77mode"><button type="button" data-m="iso" class="${c.mode!=='grp'?'on':''}">Paredes isoladas</button><button type="button" data-m="grp" class="${c.mode==='grp'?'on':''}">Grupos de paredes</button></div>
 <p class="note">${c.mode==='grp'?'Grupos: trechos entre aberturas ligados pelos encontros; a carga é uniformizada no grupo a cada pavimento.':'Isoladas: cada parede leva o que chega nela; a carga sobre portas e janelas vai para os trechos dos lados.'}</p>
 ${R.warn.length?`<div class="warn77">${R.warn.map(w=>'<p>⚠ '+esc(w)+'</p>').join('')}</div>`:''}
 <h4>Carga na base · ${U.L()}</h4>${tab}<p class="note">Total na base de ${esc(l.name)}: Gₖ ${fx(U.f(totG),1)} · Qₖ ${fx(U.f(totQ),1)} ${U.F()}.</p>${li===0&&groundTxt(R,rows)?'<p class="note gnd77">'+groundTxt(R,rows)+'</p>':''}
 <div class="det77">${det}</div>
 ${R.moments.length?`<h4>Balanços · momento no engaste</h4><table class="t77"><thead><tr><th>Laje</th><th>Parede</th><th>L (m)</th><th>M<sub>g,k</sub></th><th>M<sub>q,k</sub></th></tr></thead><tbody>${R.moments.map(m=>`<tr><td style="font-weight:400;font-size:11.5px">${esc(m.slab)}${m.times>1?' × '+m.times:''}</td><td>${esc(m.label)}</td><td>${fx(m.len,2)}</td><td>${fx(U.f(m.mg))}</td><td>${fx(U.f(m.mq))}</td></tr>`).join('')}</tbody></table><p class="note">Momentos característicos por metro de parede (${U.tf?'tf·m/m':'kN·m/m'}), na face da parede de apoio, para conferência. A carga vertical do balanço já está incluída na carga da parede.</p>`:''}
 <h4>Lajes consideradas</h4><ul class="sl77">${slabInfo||'<li class="note">Nenhuma laje acima deste nível.</li>'}</ul>
 </aside></div>`;
 $('ld77close').onclick=closeDlg;$('ld77lv').onchange=e=>{dlg.lv=e.target.value;dlg.sel=null;renderDlg();};
 d.querySelectorAll('#ld77show [data-k]').forEach(b=>b.onclick=()=>{dlg.show=b.dataset.k;renderDlg();});
 d.querySelectorAll('#ld77unit [data-u]').forEach(b=>b.onclick=()=>{c.unit=b.dataset.u;touch();renderDlg();drawPlan();refreshSide();});
 d.querySelectorAll('#ld77mode [data-m]').forEach(b=>b.onclick=()=>{c.mode=b.dataset.m;touch();renderDlg();});
 d.querySelectorAll('[data-w]').forEach(el=>el.addEventListener('click',()=>{const j=N(el.dataset.w);dlg.sel=dlg.sel===j?null:j;renderDlg();}));
 $('ld77cfg').onclick=e=>{e.preventDefault();openCfg();};
 $('ld77dxf').onclick=()=>exportDXF(R,li);$('ld77xls').onclick=()=>exportXLS(R);$('ld77prn').onclick=()=>printDlg(R,li);}

// ---------- 10. Saídas
function dxfTxt(s){return String(s).normalize('NFC').replace(/[^\x20-\x7e]/g,ch=>'\\U+'+ch.codePointAt(0).toString(16).toUpperCase().padStart(4,'0'));}
function exportDXF(R,li){const l=R.LV[li],rows=R.rows[li],k=dlg.show,out=[];const put=(...a)=>out.push(...a.map(String));const vals=rows.map(r=>valOf(r,k)),mn=Math.min(...vals),mx=Math.max(...vals);
 const aci=t=>t<.25?3:t<.5?2:t<.75?30:1;put(0,'SECTION',2,'ENTITIES');
 rows.forEach((r,j)=>{const x=r.x,t=x.t/2,n=x.n,A=x.g.A,B=x.g.B,P=[[A.x+n[0]*t,A.y+n[1]*t],[B.x+n[0]*t,B.y+n[1]*t],[B.x-n[0]*t,B.y-n[1]*t],[A.x-n[0]*t,A.y-n[1]*t]],col=R.flagged.has(x.w)?6:aci(mx>mn?(vals[j]-mn)/(mx-mn):.5);
  for(let i=0;i<4;i++){const a=P[i],b=P[(i+1)%4];put(0,'LINE',8,'CARGAS_PAREDES',62,col,10,a[0].toFixed(2),20,a[1].toFixed(2),30,0,11,b[0].toFixed(2),21,b[1].toFixed(2),31,0);}
  const M={x:(A.x+B.x)/2,y:(A.y+B.y)/2},ang=Math.atan2(x.g.u[1],x.g.u[0])*180/Math.PI,a=ang>90?ang-180:ang<-90?ang+180:ang,off=t+12,nx=-Math.sin(a*Math.PI/180),ny=Math.cos(a*Math.PI/180),px=M.x+nx*off,py=M.y+ny*off;
  put(0,'TEXT',8,'CARGAS_TEXTO',62,7,10,px.toFixed(2),20,py.toFixed(2),30,0,40,12,1,dxfTxt(r.label+' · '+fx(U.f(vals[j]),2)+' '+U.L()),50,a.toFixed(3),72,1,11,px.toFixed(2),21,py.toFixed(2),31,0);});
 let y0=Infinity,x0=Infinity;rows.forEach(r=>{for(const P of [r.x.g.A,r.x.g.B]){y0=Math.min(y0,P.y);x0=Math.min(x0,P.x);}});
 put(0,'TEXT',8,'CARGAS_TEXTO',62,7,10,x0.toFixed(2),20,(y0-80).toFixed(2),30,0,40,18,1,dxfTxt('PLANTA DE CARGAS — base de '+l.name+' — '+KN[k].replace('p_d','pd')+' ('+U.L()+') — valores característicos, unidades do desenho: cm'));
 put(0,'ENDSEC',0,'EOF');download('Planta_de_Cargas_'+l.name.replace(/[^\w\-]+/g,'_')+'_V87.dxf',out.join('\n'),'application/dxf');}
function exportXLS(R){const K=window.xlsxKit73;if(!K){alert('Gerador de planilha indisponível.');return;}const {zip,sheetXML,STYLES,STY}=K,c=S().cfg,u=U.L(),r3=v=>Math.round(U.f(v)*1000)/1000,sheets=[],used=new Set();
 const nm=s=>{let n=String(s).replace(/[\[\]:*?\/\\]/g,'-').slice(0,31).trim()||'Nível';let k=2,b=n;while(used.has(n.toLowerCase()))n=b.slice(0,27)+' ('+k+++')';used.add(n.toLowerCase());return n;};
 const R0=[[{t:'Planta de cargas — Modulação de Alvenaria Engenhar V87',s:STY.title}],['Projeto',($('project')?.value||'').trim()||'—'],['Gerado em',new Date().toLocaleString('pt-BR')],['Unidade',u+' (forças em '+U.F()+')'],['1 tf =',{n:N(c.tf),s:STY.dec},'kN'],['γg',{n:N(c.gG),s:STY.dec}],['γq',{n:N(c.gQ),s:STY.dec}],['Distribuição',c.mode==='grp'?'Grupos de paredes':'Paredes isoladas'],null,
  [{t:'Paredes — peso próprio',s:STY.title}],['Material',c.mat==='ceramico'?'Cerâmico':'Concreto'],['Revestimento por face (cm)',{n:N(c.rev),s:STY.dec}],['Peso esp. revestimento (kN/m³)',{n:N(c.gRev),s:STY.dec}],['Graute',c.grout?'sim — γ '+fx(c.gGr,0)+' kN/m³':'não'],null,
  [{t:'Lajes',s:STY.title}],['Laje','Tipo','h (cm)','pp (kN/m²)','gₖ (kN/m²)','qₖ (kN/m²)','Direção vigotas','Área (m²)','Gₖ ('+U.F()+')','Qₖ ('+U.F()+')'].map(t=>({t,s:STY.head}))];
 for(const sl of R.slabs)R0.push([sl.name+(sl.times?' × '+sl.times:''),typeTxt(sl.def),{n:N(sl.def.h),s:STY.dec},{n:ppOf(sl.def),s:STY.dec},{n:N(sl.def.g),s:STY.dec},{n:N(sl.def.q),s:STY.dec},uniOf(sl.def)?(N(sl.def.dir)===90?'↕':'↔'):'—',{n:Math.round(sl.st.area*100)/100,s:STY.dec},{n:r3(sl.st.G),s:STY.dec},{n:r3(sl.st.Q),s:STY.dec}]);
 if(R.ground&&R.ground.base==='radier')R0.push([R.ground.name+' ('+baseTxt(R.ground.base)+')',R.ground.base==='radier'?'Radier':'Contrapiso',{n:N(R.ground.def.h),s:STY.dec},{n:R.ground.base==='solo'?0:ppOf(R.ground.def),s:STY.dec},{n:N(R.ground.def.g),s:STY.dec},{n:N(R.ground.def.q),s:STY.dec},'—',{n:Math.round(R.ground.st.area*100)/100,s:STY.dec},{n:r3(R.ground.st.G),s:STY.dec},{n:r3(R.ground.st.Q),s:STY.dec}]),R0.push([{t:groundTxt(R,R.rows[0],false),s:STY.note}]);
 if(R.moments.length){R0.push(null,[{t:'Balanços (beirais, varandas) — momento no engaste',s:STY.title}],['Laje','Parede de apoio','Pavimento da parede','Comprimento (m)','Área (m²)','Mg,k ('+(U.tf?'tf·m/m':'kN·m/m')+')','Mq,k ('+(U.tf?'tf·m/m':'kN·m/m')+')','Repetições'].map(t=>({t,s:STY.head})));for(const m of R.moments)R0.push([m.slab,m.label,m.lvName,{n:Math.round(m.len*100)/100,s:STY.dec},{n:Math.round(m.area*100)/100,s:STY.dec},{n:r3(m.mg),s:STY.dec},{n:r3(m.mq),s:STY.dec},{n:m.times,s:STY.int}]);}
 R0.push(null,[{t:'Ações lançadas',s:STY.title}],['Pavimento','Laje','Tipo','Nome','gₖ','qₖ','Modo / unidade'].map(t=>({t,s:STY.head})));
 const KT={edge:'Beiral / balanço',rect:'Retângulo',poly:'Polígono',panel:'Painel de laje',div:'Linha divisória',line:'Carga linear',point:'Carga concentrada'};
 for(const it of S().items){const k=itemKey(it);R0.push([L68()?.nameOf?L68().nameOf(k):k,it.tgt==='cob'?'Cobertura':'Piso',KT[it.kind]||it.kind,it.name||'',it.g==null?'igual':{n:r3(N(it.g)),s:STY.dec},it.q==null?'igual':{n:r3(N(it.q)),s:STY.dec},it.kind==='line'?u:it.kind==='point'?U.F():it.kind==='panel'?(TYPES[it.type]?.n||'tipo do pavimento'):it.kind==='div'?'':(it.mode==='add'?'soma':'substitui')+' · '+U.A()]);}
 R0.push(null,[{t:'Valores característicos (gₖ, qₖ) conforme NBR 6120:2019; combinação de cálculo p_d = γg·gₖ + γq·qₖ (NBR 8681). Conferir pesos de blocos e lajes com os fabricantes.',s:STY.note}]);
 sheets.push({name:nm('Resumo'),xml:sheetXML(R0,[34,26,12,12,12,12,16,12,14,14])});
 R.LV.forEach((l,li)=>{const rows=[[{t:'Carga na base — '+l.name+(l.rep>1?' (× '+l.rep+')':''),s:STY.title}],['Valores em '+u+' (média no comprimento sem aberturas)'],null,['Parede','Comprimento (m)','Sem aberturas (m)','Largura (cm)','gₖ','qₖ','pₖ','p_d','máx pₖ','Gₖ total ('+U.F()+')','Qₖ total ('+U.F()+')','Peso próprio da parede ('+U.F()+')','Sem parede embaixo'].map(t=>({t,s:STY.head}))];
  for(const r of R.rows[li]){const p=ownParts(r.x);rows.push([r.label,{n:Math.round(r.x.L)/100,s:STY.dec},{n:Math.round(r.L*100)/100,s:STY.dec},{n:r.x.t,s:STY.dec},{n:r3(r.g),s:STY.dec},{n:r3(r.q),s:STY.dec},{n:r3(r.p),s:STY.dec},{n:r3(valOf(r,'d')),s:STY.dec},{n:r3(r.max),s:STY.dec},{n:r3(r.G),s:STY.dec},{n:r3(r.Q),s:STY.dec},{n:r3(p.blocos+p.rev+p.graute),s:STY.dec},R.flagged.has(r.w)?'sim':'']);}
  sheets.push({name:nm(l.name),xml:sheetXML(rows,[12,16,16,12,12,12,12,12,12,16,16,22,16])});});
 const files=[['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')+'</Types>'],
  ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
  ['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((s,i)=>`<sheet name="${s.name.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')+'</sheets></workbook>'],
  ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')+`<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
  ['xl/styles.xml',STYLES],...sheets.map((s,i)=>['xl/worksheets/sheet'+(i+1)+'.xml',s.xml])];
 download('Planta_de_Cargas_Engenhar_V87.xlsx',zip(files),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');}
function printDlg(R,li){const l=R.LV[li],rows=R.rows[li],c=S().cfg;const html=`<!doctype html><html><head><meta charset="utf-8"><title>Planta de cargas</title><style>body{font-family:Arial;margin:12mm;color:#102e4b}h1{font-size:16pt;margin:0 0 4px}p{margin:2px 0;font-size:9.5pt;color:#334}table{border-collapse:collapse;font-size:9pt;margin-top:8px}th,td{border:1px solid #c9d7e6;padding:3px 7px;text-align:right}th{background:#174a78;color:#fff}td:first-child,th:first-child{text-align:left}.pl{border:1px solid #c9d7e6;height:150mm;margin-top:6px}@page{size:A4 landscape;margin:8mm}</style></head><body>
 <h1>Planta de cargas — base de ${esc(l.name)}</h1><p>${esc(($('project')?.value||'').trim())} · ${KN[dlg.show].replace('p_d','p<sub>d</sub>')} em ${U.L()} · valores característicos (NBR 6120:2019 / NBR 8681) · ${c.mode==='grp'?'grupos de paredes':'paredes isoladas'} · γg ${fx(c.gG,2)} · γq ${fx(c.gQ,2)} · 1 tf = ${fx(c.tf,N(c.tf)===10?0:5)} kN</p>
 <div class="pl">${planSVG(R,li)}</div><table><tr><th>Parede</th><th>gₖ</th><th>qₖ</th><th>pₖ</th><th>p<sub>d</sub></th><th>máx pₖ</th></tr>${rows.map(r=>`<tr><td>${esc(r.label)}</td><td>${fx(U.f(r.g))}</td><td>${fx(U.f(r.q))}</td><td>${fx(U.f(r.p))}</td><td>${fx(U.f(valOf(r,'d')))}</td><td>${fx(U.f(r.max))}</td></tr>`).join('')}</table>${R.warn.map(w=>'<p>⚠ '+esc(w)+'</p>').join('')}<p>Engenhar Engenharia e Projetos · Modulação de Alvenaria V86</p></body></html>`;
 const f=document.createElement('iframe');f.style.cssText='position:fixed;width:0;height:0;border:0;right:0;bottom:0';document.body.append(f);f.contentDocument.open();f.contentDocument.write(html);f.contentDocument.close();setTimeout(()=>{try{f.contentWindow.focus();f.contentWindow.print();}catch(e){alert(e.message);}setTimeout(()=>f.remove(),2000);},300);}


// ---------- 10b. Primeira prancha: mapa de cargas + tabela de cargas (antes da locação)
function plotLoadItems(availW,availH){const s=S(),c=s.cfg;if(c.plot===false)return [];let R;try{R=compute({});}catch(e){console.error('V80 cargas prancha',e);return [];}if(!R.LV.length||!R.rows[0]?.length)return [];
 const li=0,l=R.LV[li],rows=R.rows[li],sc=N(plotSettings26().scale)||50,k=10/sc;// cm do mundo → mm na folha
 const vals=rows.map(r=>r.p),mn=Math.min(...vals),mx=Math.max(...vals),tOf=v=>mx-mn>Math.max(.05*mx,1e-9)?(v-mn)/(mx-mn):.5;
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;l.I.forEach(x=>{for(const P of [x.g.A,x.g.B]){x0=Math.min(x0,P.x);x1=Math.max(x1,P.x);y0=Math.min(y0,P.y);y1=Math.max(y1,P.y);}});
 const fs=2.4/k,pad=fs*7,W=x1-x0+2*pad,legH=fs*3.2,H=y1-y0+2*pad+legH,T=P=>[P.x-x0+pad,y1-P.y+pad],r1=v=>v.toFixed(2);
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r1(W)} ${r1(H)}" width="${r1(W*k)}mm" height="${r1(H*k)}mm" font-family="Arial">`;
 const quad=(x,a,b,t,col,stroke)=>{const n=x.n,A={x:x.g.A.x+x.g.u[0]*a,y:x.g.A.y+x.g.u[1]*a},B={x:x.g.A.x+x.g.u[0]*b,y:x.g.A.y+x.g.u[1]*b},h=t/2;const P=[[A.x+n[0]*h,A.y+n[1]*h],[B.x+n[0]*h,B.y+n[1]*h],[B.x-n[0]*h,B.y-n[1]*h],[A.x-n[0]*h,A.y-n[1]*h]].map(q=>T({x:q[0],y:q[1]}).map(r1).join(',')).join(' ');return `<polygon points="${P}" fill="${col}" stroke="${stroke}" stroke-width="${r1(.25/k)}"/>`;};
 rows.forEach((r,j)=>{const x=r.x,col=R.flagged.has(x.w)?'#7c3aed':heat(tOf(vals[j])),t=Math.max(x.t,8);svg+=quad(x,-t/2+.01,x.L+t/2-.01,t,col,'#33414f');for(const o of x.ops)svg+=quad(x,o.a,o.b,t+.6,'#ffffff','#33414f');});
 rows.forEach((r,j)=>{const x=r.x,M=T({x:(x.g.A.x+x.g.B.x)/2,y:(x.g.A.y+x.g.B.y)/2}),ang=Math.atan2(-x.g.u[1],x.g.u[0])*180/Math.PI,a=ang>90||ang<-90?ang+180:ang,off=Math.max(x.t,8)/2+fs*.5,nx=Math.sin(a*Math.PI/180),ny=-Math.cos(a*Math.PI/180),px=M[0]+nx*off,py=M[1]+ny*off;
  svg+=`<text x="${r1(px)}" y="${r1(py)}" font-size="${r1(fs)}" font-weight="700" text-anchor="middle" fill="#102e4b" transform="rotate(${a.toFixed(2)} ${r1(px)} ${r1(py)})">${esc(r.label+' · '+fx(U.f(vals[j]),2))}</text>`;});
 // legenda em faixas (sem degradê, para o DXF)
 const ly=H-legH*.55,lw=Math.min(W*.6,fs*30),lx=pad*.5,steps=5;for(let q=0;q<steps;q++)svg+=`<rect x="${r1(lx+q*lw/steps)}" y="${r1(ly-fs*.8)}" width="${r1(lw/steps)}" height="${r1(fs*.8)}" fill="${heat(q/(steps-1))}"/>`;
 svg+=`<text x="${r1(lx)}" y="${r1(ly+fs*1.1)}" font-size="${r1(fs*.8)}" fill="#33414f">${fx(U.f(mn),2)}</text><text x="${r1(lx+lw)}" y="${r1(ly+fs*1.1)}" font-size="${r1(fs*.8)}" fill="#33414f" text-anchor="end">${fx(U.f(mx),2)} ${U.L()}</text>`;
 if(R.flagged.size)svg+=`<rect x="${r1(lx+lw+fs)}" y="${r1(ly-fs*.8)}" width="${r1(fs)}" height="${r1(fs*.8)}" fill="#7c3aed"/><text x="${r1(lx+lw+fs*2.3)}" y="${r1(ly)}" font-size="${r1(fs*.8)}" fill="#33414f">sem parede embaixo</text>`;
 svg+='</svg>';
 const items=[];const map=svgPanel26('Mapa de cargas · base de '+l.name+' · pₖ = gₖ + qₖ ('+U.L()+')',svg);if(map){map.load77=true;items.push(map);}
 const f=v=>fx(U.f(v),2),head=['Parede','Comp. (m)','gₖ','qₖ','pₖ','p<sub>d</sub>'];
 const trs=rows.map((r,j)=>[r.label,fx(r.x.L/100,2),f(r.g),f(r.q),f(r.p),f(valOf(r,'d'))]);
 const tbl=list=>'<table><thead><tr>'+head.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+list.map(r=>'<tr>'+r.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
 const slabTxt=R.slabs.map(sl=>esc(sl.name)+(sl.times?' × '+sl.times:'')+': '+esc(typeTxt(sl.def))+(uniOf(sl.def)?(N(sl.def.dir)===90?' ↕':' ↔'):'')+' · pp '+fx(U.f(ppOf(sl.def)),2)+' · gₖ '+fx(U.f(N(sl.def.g)),2)+' · qₖ '+fx(U.f(N(sl.def.q)),2)+' '+U.A()).join('<br>');
 const note='<p>Carga linear na base de cada parede ('+U.L()+'), média no comprimento sem aberturas. Valores característicos (NBR 6120:2019); p<sub>d</sub> = '+fx(c.gG,2)+'·gₖ + '+fx(c.gQ,2)+'·qₖ (NBR 8681). '+(c.mode==='grp'?'Grupos de paredes.':'Paredes isoladas.')+(U.tf?' 1 tf = '+fx(c.tf,N(c.tf)===10?0:5)+' kN.':'')+'</p><p>Lajes: '+(slabTxt||'—')+'</p><p>Peso próprio das paredes: blocos '+(c.mat==='ceramico'?'cerâmicos':'de concreto')+' + revestimento '+fx(c.rev,1)+' cm por face'+(c.grout?' + graute':'')+'.</p>'+(groundTxt(R,rows)?'<p>'+groundTxt(R,rows)+'</p>':'')+(R.moments.length?'<p>Balanços — momento característico no engaste ('+(U.tf?'tf·m/m':'kN·m/m')+'): '+R.moments.map(m=>esc(m.label+' ('+m.lvName+')')+': M<sub>g,k</sub> '+fx(U.f(m.mg),2)+' · M<sub>q,k</sub> '+fx(U.f(m.mq),2)+' em '+fx(m.len,2)+' m').join('; ')+'.</p>':'')+(R.warn.length?'<p>'+R.warn.map(esc).join('<br>')+'</p>':'');
 const tw=Math.min(availW,150),title='Tabela de cargas · base de '+l.name;
 let chunk=[],first=true;const push=(list,last)=>{const html='<h3>'+esc(title)+(first?'':' (continuação)')+'</h3>'+tbl(list)+(last?note:'');items.push({title,w:tw,h:measureHTML26(html,tw-4)+13,html,load77:true});first=false;};
 for(const r of trs){const trial=[...chunk,r];if(chunk.length&&measureHTML26('<h3>x</h3>'+tbl(trial)+note,tw-4)+13>availH){push(chunk,false);chunk=[];}chunk.push(r);}if(chunk.length)push(chunk,true);
 return items;}
// V95 — planta de lajes nas pranchas (depois das paredes de cada pavimento): painéis L1, L2… com tipo, altura e direção
function slabPlanItems95(availW,availH){let R;try{R=compute({});}catch(e){return [];}const LV=R.LV;if(!LV?.length)return [];const sc=N(plotSettings26().scale)||50,k=10/sc,out=[];
 const pgOf=l=>N(l.walls[0]?.page||1),top=LV.length-1,list=[];
 for(let i=1;i<LV.length;i++)list.push({supp:LV[i-1],def:lvDef(LV[i].key),its:itemsOf(LV[i].key,'piso'),pg:pgOf(LV[i]),name:slabName(LV[i].key),lv:i-1,key:LV[i].key,tgt:'piso',rj:0});
 // V103 — lajes das repetições (tipo e próprias), com o nome pela cota
 LV.forEach((l,i)=>{const R0=Math.max(1,N(l.rep)||1);if(R0<2)return;const tg=i===0?'tipo':'piso',d0=i===0?lvDef(l.key+'#tipo'):lvDef(l.key),lb=String(l.key).split('|')[1]||'',zj=j=>valOfKey(l.key)+(j-1)*((N(l.H)||280)+(N(GEO()?.opt3?.t)||10))/100;
  const own=ownList(l.key,tg).filter(j=>j<=R0),baseR=[];for(let j=2;j<=R0;j++)if(!own.includes(j))baseR.push(j);
  if(baseR.length)list.push({supp:l,def:d0,its:itemsOf(l.key,tg),pg:pgOf(l),name:'Laje'+(baseR.length>1?'s':'')+' '+baseR.map(j=>f2v(zj(j))).join(' · ')+' · tipo'+(lb?' '+lb:'')+' (topo dos pavimentos '+repTxt(baseR.map(j=>j-1))+')',lv:i,key:l.key,tgt:tg,rj:0});
  for(const j of own)list.push({supp:l,def:d0,its:ownItems(l.key,tg,j),pg:pgOf(l),name:'Laje '+f2v(zj(j))+' · topo do '+(j-1)+'º pavimento'+(lb?' '+lb:'')+' (laje própria)',lv:i,key:l.key,tgt:tg,rj:j});});
 if(S().roof.on)list.push({supp:LV[top],def:{...S().roof},its:itemsOf(LV[top].key,'cob'),pg:pgOf(LV[top]),name:roofName(LV[top]),lv:top,key:LV[top].key,tgt:'cob',rj:0});
 {const g=gDef(LV[0].key);if(g.base&&g.base!=='sem')list.push({supp:LV[0],def:g,its:itemsOf(LV[0].key,'piso'),pg:pgOf(LV[0]),name:'Piso '+(L68()?.nameOf?L68().nameOf(LV[0].key):'')+' — '+baseTxt(g.base),lv:0,ground:true});}
 const COLT=t=>t==='mac'?[245,226,200]:t==='alv'?[221,238,214]:t==='sem'?null:[214,229,245];
 for(const L of list){let c;try{c=prepSlab(L.supp,L.def,L.its,L.pg);}catch(e){continue;}if(!c)continue;
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(let i=0;i<c.n;i++){if(!c.inside[i])continue;const X=c.cx(i),Y=c.cy(i);x0=Math.min(x0,X);x1=Math.max(x1,X);y0=Math.min(y0,Y);y1=Math.max(y1,Y);}
  c.I.forEach(x=>{for(const P of [x.g.A,x.g.B]){x0=Math.min(x0,P.x);x1=Math.max(x1,P.x);y0=Math.min(y0,P.y);y1=Math.max(y1,P.y);}});if(!isFinite(x0))continue;
  const fs=2.5/k,pad=fs*4,W=x1-x0+2*pad,legH=fs*3.4,H=y1-y0+2*pad+legH,T=P=>[P.x-x0+pad,y1-P.y+pad],r1=v=>v.toFixed(2);
  // painéis (imagem da malha) e balanços
  const cv=document.createElement('canvas');cv.width=c.nx;cv.height=c.ny;const g2=cv.getContext('2d'),im=g2.createImageData(c.nx,c.ny);const cen=new Map();
  for(let i=0;i<c.n;i++){if(!c.inside[i])continue;const cp=c.comp[i],pr=cp>=0?(c.props[cp]||c.def):c.def,col=c.cant[i]?[253,230,138]:COLT(pr.type);if(cp>=0){const m=cen.get(cp)||{x:0,y:0,n:0};m.x+=c.cx(i);m.y+=c.cy(i);m.n++;cen.set(cp,m);}if(!col)continue;
   const x=i%c.nx,y=(i-x)/c.nx,o=((c.ny-1-y)*c.nx+x)*4;im.data[o]=col[0];im.data[o+1]=col[1];im.data[o+2]=col[2];im.data[o+3]=255;}
  g2.putImageData(im,0,0);const XA=c.cx(0)-c.s0/2,YT=c.cy((c.ny-1)*c.nx)+c.s0/2,P0=T({x:XA,y:YT});
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r1(W)} ${r1(H)}" width="${r1(W*k)}mm" height="${r1(H*k)}mm" font-family="Arial"><image x="${r1(P0[0])}" y="${r1(P0[1])}" width="${r1(c.nx*c.s0)}" height="${r1(c.ny*c.s0)}" preserveAspectRatio="none" style="image-rendering:pixelated" href="${cv.toDataURL('image/png')}"/>`;
  // V99 — encontros casados: cada parede vai meia espessura além do eixo da ponta (chega à face da outra)
  c.I.forEach(x=>{const n=x.n,h=Math.max(x.t,8)/2,u=x.g.u,A={x:x.g.A.x-u[0]*h,y:x.g.A.y-u[1]*h},B={x:x.g.B.x+u[0]*h,y:x.g.B.y+u[1]*h},P=[[A.x+n[0]*h,A.y+n[1]*h],[B.x+n[0]*h,B.y+n[1]*h],[B.x-n[0]*h,B.y-n[1]*h],[A.x-n[0]*h,A.y-n[1]*h]].map(q=>T({x:q[0],y:q[1]}).map(r1).join(',')).join(' ');svg+=`<polygon points="${P}" fill="#5b6d7f" stroke="#33414f" stroke-width="${r1(.2/k)}"/>`;});
  // rótulos dos painéis: L1, L2… (de cima para baixo, da esquerda para a direita)
  const comps=[...cen.entries()].map(([cp,m])=>({cp,x:m.x/m.n,y:m.y/m.n,n:m.n})).filter(q=>q.n*c.s0*c.s0>=2500).sort((a,b)=>(b.y-a.y)>30?1:(a.y-b.y)>30?-1:a.x-b.x);
  comps.forEach((q,j)=>{const pr=c.props[q.cp]||c.def,M=T(q);const uni=uniOf(pr)&&pr.type!=='sem';const t1='L'+(j+1),t2=pr.type==='sem'?'sem laje':shortTxt(pr)+(isTR(pr.type)?' (h='+hOf(pr)+')':''),t3=pr.type==='sem'?'':'pp '+fx(ppOf(pr),2)+' · g '+fx(N(pr.g),2)+' · q '+fx(N(pr.q),2);
   svg+=`<text x="${r1(M[0])}" y="${r1(M[1]-fs*.6)}" font-size="${r1(fs*1.25)}" font-weight="700" text-anchor="middle" fill="#102e4b">${t1}</text><text x="${r1(M[0])}" y="${r1(M[1]+fs*.8)}" font-size="${r1(fs)}" text-anchor="middle" fill="#174a78">${esc(t2)}</text>`+(t3?`<text x="${r1(M[0])}" y="${r1(M[1]+fs*2)}" font-size="${r1(fs*.8)}" text-anchor="middle" fill="#40566b">${esc(t3)}</text>`:'');
   if(uni){const v=N(pr.dir)===90,L2=fs*4;svg+=v?`<path d="M${r1(M[0]+fs*5)} ${r1(M[1]-L2/2)}V${r1(M[1]+L2/2)}M${r1(M[0]+fs*5-fs*.5)} ${r1(M[1]-L2/2+fs*.7)}L${r1(M[0]+fs*5)} ${r1(M[1]-L2/2)}L${r1(M[0]+fs*5+fs*.5)} ${r1(M[1]-L2/2+fs*.7)}M${r1(M[0]+fs*5-fs*.5)} ${r1(M[1]+L2/2-fs*.7)}L${r1(M[0]+fs*5)} ${r1(M[1]+L2/2)}L${r1(M[0]+fs*5+fs*.5)} ${r1(M[1]+L2/2-fs*.7)}" stroke="#174a78" stroke-width="${r1(fs*.12)}" fill="none"/>`:`<path d="M${r1(M[0]-L2/2)} ${r1(M[1]-fs*2)}H${r1(M[0]+L2/2)}M${r1(M[0]-L2/2+fs*.7)} ${r1(M[1]-fs*2.5)}L${r1(M[0]-L2/2)} ${r1(M[1]-fs*2)}L${r1(M[0]-L2/2+fs*.7)} ${r1(M[1]-fs*1.5)}M${r1(M[0]+L2/2-fs*.7)} ${r1(M[1]-fs*2.5)}L${r1(M[0]+L2/2)} ${r1(M[1]-fs*2)}L${r1(M[0]+L2/2-fs*.7)} ${r1(M[1]-fs*1.5)}" stroke="#174a78" stroke-width="${r1(fs*.12)}" fill="none"/>`;}});
  try{svg+=window.slabSvg97?.(L.its,T,fs,r1,comps.map(q=>T(q)),c.I)||'';}catch(e){console.error('V97 planta de lajes',e);}
  // legenda
  const ly=H-legH*.45;let lx=pad*.5;const LEG=[['Treliçada',COLT('tr8')],['Maciça',COLT('mac')],['Alveolar',COLT('alv')],['Balanço / beiral',[253,230,138]]];
  // V99 — viga, reforço e abertura na legenda (só quando existem nesta laje)
  if(L.its.some(i=>i.kind==='beam'&&i.sub==='viga'))LEG.push(['Viga',[219,230,251],'#1d4ed8',1]);if(L.its.some(i=>i.kind==='beam'&&i.sub==='ref'))LEG.push(['Reforço',[253,227,208],'#c2410c']);if(L.its.some(i=>i.kind==='hole'))LEG.push(['Abertura',[255,255,255],'#222',0,1]);
  for(const[t,col,sk,dash,x]of LEG){svg+=`<rect x="${r1(lx)}" y="${r1(ly-fs*.8)}" width="${r1(fs*1.4)}" height="${r1(fs*.9)}" fill="rgb(${col.join(',')})" stroke="${sk||'#9aa7b4'}" stroke-width="${r1(fs*(sk?.08:.05))}"${dash?` stroke-dasharray="${r1(fs*.25)} ${r1(fs*.12)}"`:''}/>`+(x?`<path d="M${r1(lx)} ${r1(ly-fs*.8)}l${r1(fs*1.4)} ${r1(fs*.9)}M${r1(lx+fs*1.4)} ${r1(ly-fs*.8)}l${r1(-fs*1.4)} ${r1(fs*.9)}" stroke="#222" stroke-width="${r1(fs*.05)}"/>`:'')+`<text x="${r1(lx+fs*1.8)}" y="${r1(ly)}" font-size="${r1(fs*.85)}" fill="#33414f">${t}</text>`;lx+=fs*(t.length*.55+3.5);}
  svg+=`<text x="${r1(W-pad*.5)}" y="${r1(ly)}" font-size="${r1(fs*.85)}" fill="#33414f" text-anchor="end">↔ ↕ direção das vigotas · medidas em cm</text></svg>`;
  const it=svgPanel26('Planta de lajes · '+L.name,svg);if(it){it.lv77=L.lv;it.slab95=true;if(it.w<=availW+.01&&it.h<=availH+.01)out.push(it);}
  // V106 — logo depois: planta de armaduras (negativos e positivos) e a tabela de aço desta laje
  if(!L.ground&&window.arm106?.items)try{for(const a of window.arm106.items(L,c,availW,availH)||[]){a.lv77=L.lv;out.push(a);}}catch(e){console.error('V106 armaduras',e);}}
 return out;}
window.slabPlanItems95=slabPlanItems95;
// pavimento por pavimento: plantas (1ª e 2ª fiada) e depois as elevações daquele pavimento
function tagLevels(items){let gs=[];try{gs=window.levelGroups54?.()||[];}catch{}if(gs.length<2)return;
 const wl=new Map();gs.forEach((g,gi)=>{for(const i of g.walls)wl.set(i,gi);});
 const pages=[...new Set(state.walls.filter(w=>w.line).map(w=>Number(w.page||1)))].sort((a,b)=>(window.pageLevel53?pageLevel53(a)-pageLevel53(b):0)||a-b);
 const pl=new Map();state.walls.forEach((w,i)=>{if(w.line&&wl.has(i))pl.set(Number(w.page||1),wl.get(i));});
 const f2=v=>Number(v).toFixed(2).replace('.',',');let pi=0;
 for(const q of items){if(q.load77)continue;const t=q.title||'';let m;
  if(/fiada · planta/.test(t)){const pg=pages[Math.floor(pi/2)];pi++;if(pl.has(pg))q.lv77=pl.get(pg);}
  else if(m=t.match(/^Parede (\d+)/)){const gi=wl.get(N(m[1])-1);if(gi!=null)q.lv77=gi;}
  else{const gi=gs.findIndex(g=>(g.label&&t.includes(g.label))||t.includes(f2(g.value)+' m'));if(gi>=0)q.lv77=gi;}}}
try{const cp=collectPlot26;collectPlot26=function(...a){const d=cp.apply(this,a);try{tagLevels(d.items);}catch(e){console.error('V80 níveis nas pranchas',e);}try{const it=plotLoadItems(d.availW,d.availH);if(it.length)d.items.unshift(...it);}catch(e){console.error('V80 prancha de cargas',e);}try{const sp=slabPlanItems95(d.availW,d.availH);if(sp.length)d.items.push(...sp);}catch(e){console.error('V95 planta de lajes',e);}return d;};
 const pk=packPlot29;packPlot29=function(items,w,h){const L=items.filter(q=>q.load77),O=items.filter(q=>!q.load77),out=[];if(L.length)out.push(...pk.call(this,L,w,h));
  if(O.some(q=>q.lv77!=null)){const ids=[...new Set(O.filter(q=>q.lv77!=null).map(q=>q.lv77))].sort((a,b)=>a-b),rest=O.filter(q=>q.lv77==null);
   ids.forEach((gi,k)=>{const grp=O.filter(q=>q.lv77===gi&&!q.slab82),sl=O.filter(q=>q.lv77===gi&&q.slab82);if(k===ids.length-1)grp.push(...rest.filter(q=>!q.slab82));out.push(...pk.call(this,grp,w,h));if(sl.length)out.push(...pk.call(this,sl,w,h));});
   const orphan=O.filter(q=>q.slab82&&q.lv77==null);if(orphan.length)out.push(...pk.call(this,orphan,w,h));}
  else if(O.length){const A=O.filter(q=>!q.slab82),B=O.filter(q=>q.slab82);if(A.length)out.push(...pk.call(this,A,w,h));if(B.length)out.push(...pk.call(this,B,w,h));}
  return out;};}catch(e){console.error('V80 pranchas',e);}
// ---------- 11. Estilos
const st=document.createElement('style');st.textContent=`
#ld77side .on77{outline:2px solid #f2b705;background:#fff6dc}#ld77side .tgt77{display:flex;flex-direction:column;gap:3px;font-size:12px;font-weight:700;color:#2b4a66;margin-bottom:4px}#ld77side .why77{display:none;background:#fff4e5;border:1px solid #f2b705;border-radius:8px;padding:6px 8px;font-size:11.5px;margin:0 0 4px;color:#5b3b00}#ld77side .ck77{display:flex;gap:6px;align-items:center;font-size:12.5px;margin:3px 0}
body.ld77on #plan{cursor:crosshair}
#ld77pop{position:fixed;right:24px;top:90px;width:380px;max-height:calc(100vh - 120px);overflow:auto;background:#fff;border:1px solid #9fb6cf;border-radius:10px;box-shadow:0 14px 34px rgba(16,46,75,.28);z-index:10050;font-size:13px}
#ld77pop .h{background:#174a78;color:#fff;padding:9px 12px;border-radius:10px 10px 0 0;font-weight:700;position:sticky;top:0}#ld77pop .b{padding:10px 12px}#ld77pop .f{padding:8px 12px 12px;display:flex;gap:8px;flex-wrap:wrap}
#ld77pop h4{margin:12px 0 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#102e4b}
#ld77pop .r77{display:grid;grid-template-columns:1fr 120px 52px;gap:6px;align-items:center;margin:5px 0;font-size:12.5px}#ld77pop .r77 span{font-weight:600;color:#2b4a66}#ld77pop .r77 em{font-style:normal;color:#5b6b7b;font-size:11.5px}
#ld77pop .r77 select{grid-column:2/4}#ld77pop .r77 input{width:100%;text-align:right;background:#fffbea}#ld77pop>.b>select{width:100%;margin:4px 0;font-size:12px}#ld77pop .ck77{display:flex;gap:6px;align-items:flex-start;margin:6px 0}
#ld77pop .h77{margin:8px 0;padding:6px 8px;background:#f4f8fc;border-radius:8px}#ld77pop .h77 summary{cursor:pointer;font-weight:700;color:#174a78}
#ld77dlg{position:fixed;inset:0;z-index:10040;background:#eef3f8;display:none;flex-direction:column}
#ld77dlg .bar77{display:flex;gap:10px;align-items:center;padding:10px 14px;background:#102e4b;color:#fff;flex-wrap:wrap}#ld77dlg .bar77 .note{color:#c9dcef}#ld77dlg .sp77{flex:1}
#ld77dlg .body77{flex:1;display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:12px;padding:12px;min-height:0}
#ld77dlg .cv77{background:#fff;border:1px solid #cfdceb;border-radius:12px;overflow:hidden;min-height:0}#ld77dlg .cv77 svg{display:block}
#ld77dlg .side77{background:#fff;border:1px solid #cfdceb;border-radius:12px;padding:10px 12px;overflow:auto;font-size:13px}
#ld77dlg h4{margin:12px 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#102e4b;border-bottom:2px solid #e4edf6;padding-bottom:4px}
#ld77dlg .seg77{display:flex;border:1px solid #9fb6cf;border-radius:7px;overflow:hidden;width:max-content;margin:6px 0}#ld77dlg .seg77 button{border:0;border-radius:0;background:#fff;color:#102e4b;padding:6px 11px;font-size:12.5px;box-shadow:none}#ld77dlg .seg77 button.on{background:#174a78;color:#fff;font-weight:700}
#ld77dlg label{display:flex;flex-direction:column;gap:3px;font-weight:600;font-size:12.5px;margin:8px 0}
#ld77dlg .t77{width:100%;border-collapse:collapse;font-size:12.5px}#ld77dlg .t77 th{background:#174a78;color:#fff;padding:5px;text-align:right}#ld77dlg .t77 th:first-child{text-align:left}#ld77dlg .t77 td{padding:4px 5px;border-bottom:1px solid #e1e8f0;text-align:right}#ld77dlg .t77 td:first-child{text-align:left;font-weight:600}
#ld77dlg .t77 tr[data-w]{cursor:pointer}#ld77dlg .t77 tr.sel77{background:#fff6dc}#ld77dlg .t77 tr.fl77 td:first-child{color:#7c3aed}
#ld77dlg .warn77{background:#fff4e5;border:1px solid #f2b705;border-radius:8px;padding:4px 10px;margin:8px 0;font-size:12.5px}#ld77dlg .warn77 p{margin:4px 0}
#ld77dlg .det77{background:#f4f8fc;border-radius:8px;padding:6px 10px;margin-top:10px}#ld77dlg .sl77{padding-left:18px;margin:4px 0;font-size:12.5px}
@media(max-width:900px){#ld77dlg .body77{grid-template-columns:1fr;overflow:auto}#ld77dlg .cv77{height:60vh}}`;document.head.append(st);
setTimeout(refreshSide,0);
})();
