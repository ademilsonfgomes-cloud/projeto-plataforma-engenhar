// V53 — proposta de paredes a partir das linhas do DXF (pares de faces paralelas).
(function(){
'use strict';
// Núcleo puro (testável fora do navegador): segmentos em coordenadas do canvas, px por cm, espessura e comprimento mínimo em cm.
function detectDXFWalls53(segments,pxCm,thickCm,minCm,opts={}){
 const thick=thickCm*pxCm,tolT=Math.max(1.5,thickCm*.12)*pxCm,tolAxis=.4*pxCm,joinGap=1*pxCm,minLen=Math.max(4,thickCm*.5)*pxCm,lines={h:[],v:[]};
 for(const[a,b]of segments){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<2*pxCm)continue;const slack=Math.max(.05*pxCm,len*.003);
  if(Math.abs(dy)<=slack)lines.h.push({pos:(a.y+b.y)/2,s:Math.min(a.x,b.x),e:Math.max(a.x,b.x)});else if(Math.abs(dx)<=slack)lines.v.push({pos:(a.x+b.x)/2,s:Math.min(a.y,b.y),e:Math.max(a.y,b.y)});}
 const merge=ivs=>{ivs.sort((a,b)=>a[0]-b[0]);const out=[];for(const[s,e]of ivs){const l=out[out.length-1];if(l&&s<=l[1]+joinGap)l[1]=Math.max(l[1],e);else out.push([s,e]);}return out;};
 const cluster=list=>{list.sort((a,b)=>a.pos-b.pos);const out=[];for(const l of list){const c=out[out.length-1];if(c&&l.pos-c.pos<=tolAxis){c.ivs.push([l.s,l.e]);c.sum+=l.pos*(l.e-l.s);c.w+=l.e-l.s;}else out.push({pos:l.pos,ivs:[[l.s,l.e]],sum:l.pos*(l.e-l.s),w:l.e-l.s});}return out.map(c=>({pos:c.sum/Math.max(c.w,1e-9),ivs:merge(c.ivs)}));};
 const intersect=(A,B)=>{const out=[];let i=0,k=0;while(i<A.length&&k<B.length){const s=Math.max(A[i][0],B[k][0]),e=Math.min(A[i][1],B[k][1]);if(e>s)out.push([s,e]);if(A[i][1]<B[k][1])i++;else k++;}return out;};
 const found=[],clusters={};
 for(const vertical of [false,true]){const L=cluster(vertical?lines.v:lines.h);clusters[vertical?'v':'h']=L;
  for(let i=0;i<L.length;i++)for(let k=i+1;k<L.length;k++){const d=L[k].pos-L[i].pos;if(d>thick+tolT)break;if(Math.abs(d-thick)>tolT)continue;
   // não aceita par se houver outra linha contínua entre as duas faces (evita pegar reboco/hachura como parede)
   for(const[s,e]of intersect(L[i].ivs,L[k].ivs)){if(e-s<minLen)continue;const pos=(L[i].pos+L[k].pos)/2;if(found.some(f=>f.vertical===vertical&&Math.abs(f.pos-pos)<thick/2&&f.from<e-1&&f.to>s+1))continue;
    found.push({vertical,pos,from:s,to:e,line:vertical?[{x:pos,y:s},{x:pos,y:e}]:[{x:s,y:pos},{x:e,y:pos}],thicknessCm:d/pxCm});}}}
 found.clusters=clusters;return found;}
// V54 — aberturas: vãos nas faces da parede. 1 linha no meio = porta; 2 ou mais = janela; sem linha = dúvida.
function detectDXFOpenings54(groups,clusters,pxCm,thickCm,jh,opts={}){
 const thick=thickCm*pxCm,minGap=(opts.minWidth??30)*pxCm,maxGap=(opts.maxWidth??500)*pxCm,out=[];
 const merge=ivs=>{const a=ivs.map(v=>[...v]).sort((x,y)=>x[0]-y[0]),o=[];for(const[s,e]of a){const l=o[o.length-1];if(l&&s<=l[1]+.5*pxCm)l[1]=Math.max(l[1],e);else o.push([s,e]);}return o;};
 groups.forEach((g,gi)=>{const L=clusters[g.vertical?'v':'h']||[],segs=merge(g.segments||[[g.from,g.to]]);
  const inner=L.filter(c=>Math.abs(c.pos-g.pos)<thick/2-.3*pxCm);
  const linesIn=(a,b)=>inner.filter(c=>c.ivs.some(([s,e])=>Math.min(e,b)-Math.max(s,a)>=(b-a)*.6)).length;
  const crossing=(a,b)=>groups.some(h=>h!==g&&h.vertical!==g.vertical&&h.pos>a-thick*.3&&h.pos<b+thick*.3&&Math.abs((b-a)-thick)<thick*.6&&g.pos>=h.from-thick&&g.pos<=h.to+thick);
  const push=(a,b,n,solid)=>{const startCm=(a-g.from)/pxCm,widthCm=(b-a)/pxCm;out.push({group:gi,start:startCm-jh/2,width:widthCm+jh,lines:n,type:n>=2?'Janela':'Porta',doubtful:n===0,solidFaces:!!solid});};
  const perp=groups.filter(h=>h!==g&&h.vertical!==g.vertical&&g.pos>=h.from-thick&&g.pos<=h.to+thick);
  const clip=(a,b)=>{for(const h of perp){if(h.pos<a-thick||h.pos>b+thick)continue;if(h.pos-a<b-h.pos)a=Math.max(a,h.pos+thick/2);else b=Math.min(b,h.pos-thick/2);}return [a,b];};
  const cand=[];for(let k=1;k<segs.length;k++)cand.push([segs[k-1][1],segs[k][0]]);
  if(segs.length){if(segs[0][0]-g.from>thick*.6)cand.push([g.from,segs[0][0]]);if(g.to-segs[segs.length-1][1]>thick*.6)cand.push([segs[segs.length-1][1],g.to]);}
  for(const[a0,b0]of cand){if(b0-a0>=minGap&&b0-a0<=maxGap+thick*2&&crossing(a0,b0))continue;const[a,b]=clip(a0,b0);if(b-a<minGap||b-a>maxGap)continue;push(a,b,linesIn(a,b));}
  // janelas desenhadas sobre faces contínuas: duas ou mais linhas internas com 40 cm ou mais
  for(const c of inner)for(const[s,e]of c.ivs){const a=Math.max(s,g.from),b=Math.min(e,g.to);if(b-a<40*pxCm)continue;if(out.some(o=>o.group===gi&&Math.abs(o.start-((a-g.from)/pxCm-jh/2))<5))continue;const n=inner.filter(d=>d.ivs.some(([s2,e2])=>Math.min(e2,b)-Math.max(s2,a)>=(b-a)*.8)).length;if(n>=2&&segs.some(([s2,e2])=>s2<=a+1&&e2>=b-1))push(a,b,n,true);}
 });
 return out;}
if(typeof module!=='undefined')module.exports={detectDXFWalls53,detectDXFOpenings54};
if(typeof document==='undefined')return;

// V58 — une trechos da mesma parede separados por um vão grande (até 5 m) quando há linha de porta/janela no meio do vão
function bridge58(groups,segs,thick){const tol=Math.max(2,thick*.12);let changed=true,guard=0;
 const midLine=(g,a,b)=>segs.some(([p,q])=>{const vert=Math.abs(p.x-q.x)<.01,hor=Math.abs(p.y-q.y)<.01;if(g.vertical?!vert:!hor)return false;const off=g.vertical?p.x-g.pos:p.y-g.pos;if(Math.abs(off)>=thick/2-.3*pxCm)return false;const s1=Math.min(g.vertical?p.y:p.x,g.vertical?q.y:q.x),s2=Math.max(g.vertical?p.y:p.x,g.vertical?q.y:q.x);return Math.min(s2,b)-Math.max(s1,a)>=(b-a)*.6;});
 while(changed&&guard++<50){changed=false;
  for(const g of groups)for(const h of groups){if(g===h||g.vertical!==h.vertical||Math.abs(g.pos-h.pos)>tol||h.from<g.to)continue;const gap=(h.from-g.to)/pxCm;if(gap<=0||gap>500)continue;
   if(groups.some(o=>o!==g&&o!==h&&o.vertical===g.vertical&&Math.abs(o.pos-g.pos)<=tol&&o.from<h.from&&o.to>g.to))continue;
   if(!midLine(g,g.to,h.from))continue;
   g.segments=[...(g.segments||[[g.from,g.to]]),...(h.segments||[[h.from,h.to]])];g.to=Math.max(g.to,h.to);g.line=g.vertical?[{x:g.pos,y:g.from},{x:g.pos,y:g.to}]:[{x:g.from,y:g.pos},{x:g.to,y:g.pos}];groups.splice(groups.indexOf(h),1);changed=true;break;}
  if(changed)continue;}
 // ponta da parede parada no começo de uma porta encostada no encontro: leva a ponta até a parede perpendicular
 for(const g of groups){const perp=groups.filter(h=>h.vertical!==g.vertical&&g.pos>=h.from-thick&&g.pos<=h.to+thick);
  for(const end of ['from','to']){const e=g[end],dir=end==='to'?1:-1;let best=null;
   for(const h of perp){const d=(h.pos-e)*dir;if(d<=thick*.6||d/pxCm>500)continue;if(!best||d<best.d)best={h,d};}
   if(!best)continue;const a=dir>0?e:best.h.pos+thick/2,b=dir>0?best.h.pos-thick/2:e;if(b-a<30*pxCm)continue;
   if(groups.some(o=>o!==g&&o.vertical===g.vertical&&Math.abs(o.pos-g.pos)<=tol&&o.to>Math.min(a,b)&&o.from<Math.max(a,b)))continue;
   if(!midLine(g,a,b))continue;g[end]=best.h.pos;g.line=g.vertical?[{x:g.pos,y:g.from},{x:g.pos,y:g.to}]:[{x:g.from,y:g.pos},{x:g.to,y:g.pos}];}}
 return groups;}

// V108.1 — paredes inclinadas no DXF
function incl108(segs,thickCm,minCm,thick,orth){const items=[],Q=Math.PI/2;
 for(const[a,b]of segs){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<2*pxCm)continue;const slack=Math.max(.05*pxCm,len*.003);if(Math.abs(dy)<=slack||Math.abs(dx)<=slack)continue;const phi=((Math.atan2(dy,dx)%Q)+Q)%Q;items.push({a,b,phi,len});}
 items.sort((x,y)=>x.phi-y.phi);const fams=[],tol=.4*Math.PI/180;for(const it of items){const f=fams[fams.length-1];if(f&&it.phi-f.last<=tol){f.items.push(it);f.last=it.phi;f.w+=it.len;f.s+=it.phi*it.len;}else fams.push({items:[it],last:it.phi,w:it.len,s:it.phi*it.len});}
 const out=[];
 for(const F of fams){if(F.w<2*minCm*pxCm)continue;const phi=F.s/F.w,c=Math.cos(phi),s=Math.sin(phi),R=p=>({x:p.x*c+p.y*s,y:-p.x*s+p.y*c}),B=p=>({x:p.x*c-p.y*s,y:p.x*s+p.y*c});
  const rs=F.items.map(it=>{let p=R(it.a),q=R(it.b);if(Math.abs(q.y-p.y)<Math.abs(q.x-p.x)){const y=(p.y+q.y)/2;p={x:p.x,y};q={x:q.x,y};}else{const x=(p.x+q.x)/2;p={x,y:p.y};q={x,y:q.y};}return [p,q];});
  let f=detectDXFWalls53(rs,pxCm,thickCm,minCm);const cl=f.clusters;f=bridge58(consolidateDetected(f,thick),rs,thick).filter(g=>(g.to-g.from)/pxCm>=minCm);
  const fam={clusters:{h:cl.h,v:cl.v}};
  for(const g of f){const line=g.line.map(B);out.push({line,from:0,to:Math.hypot(line[1].x-line[0].x,line[1].y-line[0].y),thicknessCm:g.thicknessCm,inc108:{fam,g:{...g},off:0}});}}
 if(!out.length)return out;
 // pontas: vão até o eixo da parede que encontram (inclinada ↔ inclinada ou ortogonal)
 const all=[...orth,...out],dirOf=f=>{const[a,b]=f.line,L=Math.hypot(b.x-a.x,b.y-a.y)||1;return {x:(b.x-a.x)/L,y:(b.y-a.y)/L,L};};
 const extend=(f,targets)=>{const u=dirOf(f),res=[0,0];for(const idx of [0,1]){const E=f.line[idx],d=idx?{x:u.x,y:u.y}:{x:-u.x,y:-u.y};let best=null;
   for(const h of targets){if(h===f)continue;const[c]=h.line,v=dirOf(h),den=d.x*v.y-d.y*v.x;if(Math.abs(den)<.2)continue;const t=((c.x-E.x)*v.y-(c.y-E.y)*v.x)/den;if(t<-thick*.3||t>thick*1.6)continue;
    const X={x:E.x+d.x*t,y:E.y+d.y*t},m=(X.x-c.x)*v.x+(X.y-c.y)*v.y;if(m<-thick||m>v.L+thick)continue;if(!best||Math.abs(t)<Math.abs(best.t))best={t,X};}
   if(best&&Math.abs(best.t)>.01){f.line[idx]=best.X;res[idx]=best.t;}}return res;};
 for(const f of out){const[t0]=extend(f,all);f.inc108.off+=t0/pxCm;f.from=0;f.to=Math.hypot(f.line[1].x-f.line[0].x,f.line[1].y-f.line[0].y);}
 for(const f of orth){const v=f.vertical;const[t0,t1]=extend(f,out);if(t0)f.from-=t0;if(t1)f.to+=t1;}
 return out;}
const detectBase53=$('detect').onclick;
$('detect').onclick=()=>{const segs=image?.dxfSegments53;if(!segs)return detectBase53();
 if(!(pxCm>0)){alert('Calibre a planta primeiro: clique em “Calibrar por dois pontos” e marque uma cota conhecida.');return;}
 const thickCm=num($('detectWidth').value),minCm=num($('minimum').value);if(!(thickCm>0)){alert('Informe a espessura das paredes desenhadas no DXF.');return;}
 let found=detectDXFWalls53(segs,pxCm,thickCm,minCm);const thick=thickCm*pxCm;
 found=bridge58(consolidateDetected(found,thick),segs,thick).filter(f=>(f.to-f.from)/pxCm>=minCm);
 // V108.1 — paredes inclinadas: cada direção inclinada é girada para a horizontal, detectada igual e girada de volta
 try{const inc=incl108(segs,thickCm,minCm,thick,found);for(const f of inc)found.push(f);}catch(er){console.error('V108.1 inclinadas',er);}
 // trechos isolados curtos (bancadas, móveis, peitoris) não encostam em nenhuma outra parede
 const near=(p,g)=>{const[a,b]=g.line,minx=Math.min(a.x,b.x)-thick,maxx=Math.max(a.x,b.x)+thick,miny=Math.min(a.y,b.y)-thick,maxy=Math.max(a.y,b.y)+thick;return p.x>=minx&&p.x<=maxx&&p.y>=miny&&p.y<=maxy;};
 const isolated=f=>!found.some(g=>g!==f&&(near(f.line[0],g)||near(f.line[1],g)))&&!state.walls.some(w=>w.line&&Number(w.page||1)===num($('page').value)&&(near(f.line[0],w)||near(f.line[1],w)));
 const isolatedShort=found.filter(f=>isolated(f)&&(f.to-f.from)/pxCm<200);found=found.filter(f=>!isolatedShort.includes(f));
 // espessura estrutural: bloco principal ativo mais próximo (sem ultrapassar a espessura desenhada); senão a espessura informada
 const widths=[...new Set(state.blocks.filter(b=>b.active!==false&&b.type!=='Canaleta'&&ModEngine.roleOf(b,state.blocks)==='Principal').map(b=>Number(b.width)))].sort((a,b)=>b-a),structural=widths.find(w=>w<=thickCm+.5)??widths[widths.length-1]??thickCm;
 const page=num($('page').value);let additions=0,skipped=0;
 const created=[],clusters=found.clusters||detectDXFWalls53(segs,pxCm,thickCm,minCm).clusters;
 for(const f of found.slice(0,300)){if(state.walls.some(w=>Number(w.page||1)===page&&w.line&&((Math.hypot(w.line[0].x-f.line[0].x,w.line[0].y-f.line[0].y)<thick&&Math.hypot(w.line[1].x-f.line[1].x,w.line[1].y-f.line[1].y)<thick)||(Math.hypot(w.line[0].x-f.line[1].x,w.line[0].y-f.line[1].y)<thick&&Math.hypot(w.line[1].x-f.line[0].x,w.line[1].y-f.line[0].y)<thick)))){skipped++;continue;}
  const nw={length:Number(((f.to-f.from)/pxCm).toFixed(1)),height:num($('height').value),width:structural,confirmed:false,openings:[],line:f.line,page,planScale:pxCm,source:'DXF — faces paralelas (eixo entre linhas); conferir vãos',detectedSegments:f.segments};state.walls.push(nw);created.push({f,w:nw});additions++;}
 normalizeLengths();const jh108=num($('jh').value)||1,orth108=created.filter(c=>!c.f.inc108),props=orth108.length?detectDXFOpenings54(orth108.map(c=>c.f),{h:clusters.h,v:clusters.v},pxCm,thickCm,jh108).map(o=>({...o,wall:orth108[o.group].w})):[];
 {const fams=new Map();for(const c of created.filter(c=>c.f.inc108)){const k=c.f.inc108.fam;if(!fams.has(k))fams.set(k,[]);fams.get(k).push(c);}
  for(const[fam,list]of fams){try{props.push(...detectDXFOpenings54(list.map(c=>c.f.inc108.g),fam.clusters,pxCm,thickCm,jh108).map(o=>({...o,start:o.start+list[o.group].f.inc108.off,wall:list[o.group].w})));}catch(er){console.error('V108.1 vãos inclinados',er);}}}openingProposals54(props,structural);
 renderWalls();drawPlan();invalidate();
 $('planStatus').textContent=(props.length?props.length+' abertura(s) proposta(s) — confira na tabela abaixo da planta. ':'')+(additions?additions+' parede(s) proposta(s) a partir das linhas do DXF (faces a '+fmt(thickCm)+' cm; espessura estrutural '+fmt(structural)+' cm).'+(skipped?' '+skipped+' já existiam.':'')+(isolatedShort.length?' '+isolatedShort.length+' trecho(s) isolado(s) com menos de 2 m ignorado(s) (bancadas, móveis ou peitoris); se for parede, marque por dois pontos.':'')+' Use “Numerar paredes”, confira cada medida e cadastre portas e janelas.':'Nenhum par de linhas paralelas a '+fmt(thickCm)+' cm encontrado. Confira a calibração e a espessura desenhada (com reboco, por exemplo 15 ou 17 cm).');};
// ---------- V54: conferência das aberturas propostas
let props54=[],hl54=-1,struct54=14;
function snapStart54(v){const off=((-(struct54/2)-(num($('jh').value)||1)/2)%5+5)%5;return Math.round((v-off)/5)*5+off;}
function defaults54(){return {door:Number($('def54Door')?.value)||220,winBottom:Number($('def54WinB')?.value)||100,winH:Number($('def54WinH')?.value)||120};}
function applyDefaults54(p){const d=defaults54();if(p.type==='Porta'){p.bottom=0;p.height=d.door;}else{p.bottom=d.winBottom;p.height=d.winH;}}
// V64 — número fixo de cada abertura (P1, J1…): continua o mesmo depois de cadastrada e não se repete
const pre58=o=>o.type==='Porta'||(o.type!=='Janela'&&!(Number(o.bottom)>0))?'P':'J';
function nextTag58(pf){let mx=0;const see=t=>{const m=String(t||'').match(/^([PJ])(\d+)$/);if(m&&m[1]===pf)mx=Math.max(mx,Number(m[2]));};for(const w of state.walls)for(const o of w.openings||[])see(o.tag58);for(const p of props54)see(p.tag58);return pf+(mx+1);}
function ensureTags58(){for(const w of state.walls)for(const o of w.openings||[])if(!o.tag58||o.tag58[0]!==pre58(o))o.tag58=nextTag58(pre58(o));for(const p of props54)if(!p.tag58||p.tag58[0]!==pre58(p))p.tag58=nextTag58(pre58(p));}
window.ensureTags58=ensureTags58;
const tag54=k=>{const p=props54[k];if(!p)return '';if(!p.tag58||p.tag58[0]!==pre58(p))p.tag58=nextTag58(pre58(p));return p.tag58;};window.tag54=tag54;
window.openingProposals54=function(list,structural){struct54=structural||14;props54=list.map(o=>{const p={...o,accept:false,rawStart:o.start,rawWidth:o.width};applyDefaults54(p);return p;});hl54=-1;render54();};
function render54(){let box=$('dxfOpenings54');if(!props54.length){box?.remove();drawPlan();return;}if(!box){box=document.createElement('div');box.id='dxfOpenings54';box.className='dxfOpenings54';$('plan').closest('section')?.append(box);}
 const snap=$('snap54')?.checked??true,d=defaults54(),step=(Number(state.blocks.find(b=>b.active!==false&&b.type!=='Canaleta')?.height)||19)+(num($('jv').value)||1);
 const val=p=>{const s=snap?snapStart54(p.rawStart):Math.round(p.rawStart*2)/2,w=snap?Math.max(5,Math.round(p.rawWidth/5)*5):Math.round(p.rawWidth*2)/2;p.start=p.manualStart??s;p.width=p.manualWidth??w;};props54.forEach(val);
 const bad=v=>Math.abs(v/step-Math.round(v/step))>.001;
 box.innerHTML=`<h3>Aberturas encontradas no DXF · conferir antes de aceitar</h3><p class="note">Uma linha no meio do vão = porta; duas ou mais = janela. Todas vêm desmarcadas: confira uma por uma. Na janelinha da planta, “Aceitar e cadastrar na parede” já grava a abertura; pela tabela, marque “Aceitar” e clique em “Aceitar marcadas”. Ao gerar a modulação, as marcadas que faltarem são cadastradas automaticamente. Vãos sem linha no meio têm ⚠. A posição é medida desde o início da parede (cm). Clique numa linha para destacar na planta, ou clique direto na caixa da planta para editar ali mesmo. Clicando dentro de um vão do desenho que ainda não tem caixa, ele é reconhecido e entra na tabela.</p>
 <div class="row54"><label>Porta · altura<input id="def54Door" type="number" step="1" value="${d.door}"></label><label>Janela · peitoril<input id="def54WinB" type="number" step="1" value="${d.winBottom}"></label><label>Janela · altura<input id="def54WinH" type="number" step="1" value="${d.winH}"></label><label class="chk54"><input id="snap54" type="checkbox" ${snap?'checked':''}> Ajustar posições ao módulo</label><button type="button" class="secondary" onclick="reapply54()">Aplicar padrões a todas</button></div>
 <div class="scroll"><table><thead><tr><th>Nº</th><th>Aceitar</th><th>Parede</th><th>Tipo</th><th>Início (cm)</th><th>Largura (cm)</th><th>Peitoril (cm)</th><th>Altura (cm)</th><th></th></tr></thead><tbody>${props54.map((p,k)=>`<tr class="${k===hl54?'hl54':''}" onclick="if(!event.target.closest('input,select,button,label'))hl54Row(${k})"><td><b>${tag54(k)}</b></td><td><input type="checkbox" ${p.accept?'checked':''} onclick="event.stopPropagation()" onchange="edit54(${k},'accept',this.checked)"></td><td>Parede ${state.walls.indexOf(p.wall)+1}</td><td><select onchange="edit54(${k},'type',this.value)"><option ${p.type==='Porta'?'selected':''}>Porta</option><option ${p.type==='Janela'?'selected':''}>Janela</option></select></td><td><input type="number" step="0.5" value="${p.start}" onchange="edit54(${k},'start',this.value)"></td><td><input type="number" step="0.5" value="${p.width}" onchange="edit54(${k},'width',this.value)"></td><td><input type="number" step="1" value="${p.bottom}" style="${bad(p.bottom)?'border-color:#c52828':''}" onchange="edit54(${k},'bottom',this.value)"></td><td><input type="number" step="1" value="${p.height}" style="${bad(p.bottom+p.height)?'border-color:#c52828':''}" onchange="edit54(${k},'height',this.value)"></td><td class="note">${p.manual58?'marcado na planta':p.doubtful?'⚠ vão sem linha no meio':p.solidFaces?'esquadria sobre faces contínuas':p.lines+' linha(s) no meio'}</td></tr>`).join('')}</tbody></table></div>
 <p class="note">Peitoril e topo fora das fiadas (múltiplos de ${fmt(step)} cm) são aceitos: o vão de alvenaria vai até a fiada e a diferença sai hachurada como complemento.</p>
 <div class="toolbar"><button type="button" class="secondary" onclick="startNewVao54()">＋ Novo vão (clicar no início)</button><button type="button" onclick="accept54()">Aceitar marcadas (${props54.filter(p=>p.accept).length})</button><button type="button" class="secondary" onclick="discard54()">Descartar todas</button></div>`;
 for(const id of ['def54Door','def54WinB','def54WinH'])$(id).onchange=()=>{};$('snap54').onchange=()=>{props54.forEach(p=>{delete p.manualStart;delete p.manualWidth;});render54();};drawPlan();}
window.reapply54=function(){props54.forEach(applyDefaults54);render54();};
window.edit54=function(k,f,v){const p=props54[k];if(!p)return;if(f==='accept')p.accept=v;else if(f==='type'){p.type=v;applyDefaults54(p);}else if(f==='start')p.manualStart=Number(v);else if(f==='width')p.manualWidth=Number(v);else p[f]=Number(v);render54();};
window.hl54Row=function(k){hl54=hl54===k?-1:k;render54();$('plan').scrollIntoView({block:'center',behavior:'smooth'});};
window.accept54=function(){let n=0;for(const p of props54.filter(p=>p.accept)){const w=p.wall;if(!state.walls.includes(w))continue;w.openings??=[];if(w.openings.some(o=>Math.abs(Number(o.start)-p.start)<1&&Math.abs(Number(o.width)-p.width)<1))continue;w.openings.push({start:p.start,width:p.width,bottom:p.bottom,height:p.height,type:p.type,source:'DXF',tag58:p.tag58||nextTag58(pre58(p)),confirmed58:true});w.openings.sort((a,b)=>a.start-b.start);n++;}
 props54=props54.filter(p=>!p.accept);render54();renderWalls();invalidate();drawPlan();$('planStatus').textContent=n+' abertura(s) cadastrada(s) a partir do DXF.'+(props54.length?' As outras '+props54.length+' continuam na lista para conferir (Descartar todas apaga).':' Confira cada parede e gere a modulação.');};
function register54(list){let n=0;for(const p of list){const w=p.wall;if(!state.walls.includes(w))continue;w.openings??=[];if(w.openings.some(o=>Math.abs(Number(o.start)-p.start)<1&&Math.abs(Number(o.width)-p.width)<1))continue;w.openings.push({start:p.start,width:p.width,bottom:p.bottom,height:p.height,type:p.type,source:'DXF',tag58:p.tag58||nextTag58(pre58(p)),confirmed58:true});w.openings.sort((a,b)=>a.start-b.start);n++;}props54=props54.filter(p=>!list.includes(p));for(const w of new Set(list.map(p=>p.wall)))confirmIfDone54(w);return n;}
function confirmIfDone54(w){if(w&&state.walls.includes(w)&&!props54.some(p=>p.wall===w)&&!w.confirmed){w.confirmed=true;return true;}return false;}
window.registerAccepted54=function(){const list=props54.filter(p=>p.accept);if(!list.length)return 0;const n=register54(list);hl54=-1;pop54?.remove();pop54=null;render54();renderWalls();invalidate();drawPlan();return n;};
$('generate').addEventListener('click',()=>{const n=window.registerAccepted54?.();if(n){const t='Antes de calcular: '+n+' abertura(s) marcada(s) como aceita(s) foram cadastradas nas paredes.';$('planStatus').textContent=t;}},true);
{const r=$('restore');if(r){const old=r.onchange;r.onchange=async function(...a){const res=await old?.apply(this,a);try{window.props54io.set(state.props54saved||[]);delete state.props54saved;ensureTags58();drawPlan();const n=props54.length;if(n)$('planStatus').textContent+=' '+n+' abertura(s) do DXF em conferência foram recuperadas (quadradinhos tracejados).';}catch(e){console.error(e);}return res;};}}
window.discard54=function(){if(!confirm('Descartar todas as aberturas propostas?'))return;props54=[];render54();};
// V61 — corta o vão na face das paredes que cruzam ou encostam (não invade o encontro)
window.clipGap58=function(w,s1,s2){if(!w?.line)return [s1,s2];const[a,b]=w.line,len=Math.hypot(b.x-a.x,b.y-a.y);if(!len)return [s1,s2];const k=Number(w.planScale)||pxCm||len/Number(w.length),ux=(b.x-a.x)/len,uy=(b.y-a.y)/len,tw=Number(w.width)/2;
 for(const q of state.walls){if(q===w||!q.line||Number(q.page||1)!==Number(w.page||1))continue;const[c,d]=q.line,lq=Math.hypot(d.x-c.x,d.y-c.y);if(!lq)continue;const vx=(d.x-c.x)/lq,vy=(d.y-c.y)/lq;if(Math.abs(ux*vx+uy*vy)>.2)continue;
  const den=ux*vy-uy*vx;if(Math.abs(den)<1e-6)continue;const t=((c.x-a.x)*vy-(c.y-a.y)*vx)/den,uq=((c.x-a.x)*uy-(c.y-a.y)*ux)/den;const kq=Number(q.planScale)||k,tq=Number(q.width)/2;
  if(uq<-(tw+2)*kq||uq>lq+(tw+2)*kq)continue;const s=t/k;if(s<s1-tq-2||s>s2+tq+2)continue;if(s-s1<s2-s)s1=Math.max(s1,s+tq);else s2=Math.min(s2,s-tq);}
 return [s1,s2];};
// V58 — procurar portas e janelas de novo nas paredes atuais (inclusive esticadas ou unidas)
function scanWall58(w,segs,thickCm,jh){const[a,b]=w.line,len=Math.hypot(b.x-a.x,b.y-a.y);if(len<5)return [];const k=Number(w.planScale)||pxCm||len/Number(w.length),ux=(b.x-a.x)/len,uy=(b.y-a.y)/len,half=thickCm*k/2,tol=Math.max(1.5*k,half*.3);
 const faces=[],mids=[];
 for(const[p,q]of segs){const dx=q.x-p.x,dy=q.y-p.y,l=Math.hypot(dx,dy);if(l<.5)continue;if(Math.abs(dx*uy-dy*ux)/l>.02)continue;
  const t1=-(p.x-a.x)*uy+(p.y-a.y)*ux,t2=-(q.x-a.x)*uy+(q.y-a.y)*ux,t=(t1+t2)/2;let s1=(p.x-a.x)*ux+(p.y-a.y)*uy,s2=(q.x-a.x)*ux+(q.y-a.y)*uy;if(s1>s2)[s1,s2]=[s2,s1];s1=Math.max(0,s1);s2=Math.min(len,s2);if(s2-s1<.3)continue;
  if(Math.abs(Math.abs(t)-half)<=tol)faces.push([s1,s2]);else if(Math.abs(t)<half-.3*k)mids.push([s1,s2]);}
 faces.sort((x,y)=>x[0]-y[0]);const m=[];for(const[s1,s2]of faces){const l=m[m.length-1];if(l&&s1<=l[1]+.5*k)l[1]=Math.max(l[1],s2);else m.push([s1,s2]);}
 const out=[],cand=[];for(let i=1;i<m.length;i++)cand.push([m[i-1][1],m[i][0]]);if(m.length){if(m[0][0]>half*1.2)cand.push([0,m[0][0]]);if(len-m[m.length-1][1]>half*1.2)cand.push([m[m.length-1][1],len]);}
 for(const[c0,c1]of cand){const cl=window.clipGap58(w,c0/k,c1/k),g0=cl[0]*k,g1=cl[1]*k,wcm=(g1-g0)/k;if(wcm<30||wcm>500)continue;
  const n=mids.filter(([s1,s2])=>Math.min(s2,g1)-Math.max(s1,g0)>=(g1-g0)*.6).length;
  out.push({start:g0/k-jh/2,width:wcm+jh,lines:n,type:n>=2?'Janela':'Porta',doubtful:n===0,solidFaces:false});}
 return out;}
window.rescan54=function(){const page=num($('page').value),segs=image?.dxfSegments53,ws=state.walls.filter(w=>w.line&&Number(w.page||1)===page);if(!ws.length){alert('Não há paredes nesta planta.');return;}
 const thickCm=num($('detectWidth').value)||14,jh=num($('jh').value)||1;let found=[];
 for(const w of ws){let list=[];if(segs)list=scanWall58(w,segs,thickCm,jh);else if(window.detectGapsAll57)list=window.detectGapsAll57(w).map(g=>({start:g.start,width:g.width,lines:0,type:'Porta',doubtful:true,solidFaces:false}));
  for(const o of list){const s1=o.start,s2=o.start+o.width,ov=(x1,x2)=>Math.min(x2,s2)-Math.max(x1,s1)>Math.min(x2-x1,s2-s1)*.5;
   if((w.openings||[]).some(q=>ov(Number(q.start),Number(q.start)+Number(q.width))))continue;
   if(props54.some(p=>p.wall===w&&ov(p.start,p.start+p.width)))continue;found.push({...o,wall:w});}}
 for(const o of found){const p={...o,accept:false,rawStart:o.start,rawWidth:o.width};applyDefaults54(p);props54.push(p);}
 render54();$('planStatus').textContent=found.length?found.length+' abertura(s) nova(s) encontrada(s) nas paredes atuais — confira na tabela abaixo da planta (todas desmarcadas).':'Nenhuma abertura nova encontrada. Vãos já cadastrados ou já propostos não são repetidos. Se faltar alguma, use “＋ Adicionar abertura”.';};
{const det=$('detect');if(det&&!$('rescan54')){const b=document.createElement('button');b.id='rescan54';b.type='button';b.className='secondary';b.textContent='Procurar portas e janelas de novo';b.title='Procura vãos nas paredes como estão agora (inclusive esticadas ou unidas) e acrescenta só os novos na tabela de conferência.';b.onclick=()=>window.rescan54();const n=document.createElement('button');n.id='newvao54';n.type='button';n.className='secondary';n.textContent='＋ Novo vão (clicar no início)';n.title='Clique na parede, no ponto onde o vão começa: abre a janelinha para ajustar e entra na tabela de conferência.';n.onclick=()=>window.startNewVao54();det.after(b,n);}}
// desenho das propostas na planta
const draw54=drawPlan;drawPlan=function(...a){const r=draw54(...a);if(!image)return r;try{ensureTags58();const c=$('plan'),ctx=c.getContext('2d'),o=c.planOrigin25||{x:0,y:0};ctx.save();ctx.setTransform(1,0,0,1,-o.x,-o.y);
 for(const w of state.walls){if(!w.line||Number(w.page||1)!==num($('page').value))continue;const[a,b]=w.line,len=Math.hypot(b.x-a.x,b.y-a.y);if(!len)continue;const sc=Number(w.planScale)||pxCm||len/Number(w.length),ux=(b.x-a.x)/len,uy=(b.y-a.y)/len,half=Number(w.width)*sc*.9,P=(s,t)=>[a.x+ux*s-uy*t,a.y+uy*s+ux*t];
  for(const op of w.openings||[]){const s0=Number(op.start)*sc,s1=(Number(op.start)+Number(op.width))*sc,col=pre58(op)==='P'?'#1d6b3a':'#1769c2';ctx.strokeStyle=col;ctx.lineWidth=1.6;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(...P(s0,-half));ctx.lineTo(...P(s1,-half));ctx.lineTo(...P(s1,half));ctx.lineTo(...P(s0,half));ctx.closePath();ctx.stroke();
   ctx.fillStyle=col;ctx.font='bold 10px Arial';const vert=Math.abs(uy)>Math.abs(ux),m=vert?P((s0+s1)/2,half+4):P((s0+s1)/2,half+10);if(vert){const ax=P((s0+s1)/2,0)[0];ctx.textAlign=m[0]>=ax?'left':'right';m[1]+=3;}else{ctx.textAlign='center';m[1]+=(m[1]>=P((s0+s1)/2,0)[1]?3:0);}const n=v=>Number(v).toLocaleString('pt-BR',{maximumFractionDigits:1});{const t93=op.tag58+' · '+n(op.width)+'×'+n(op.real73?op.real73.height:op.height)+(pre58(op)==='J'?' / '+n(op.real73?op.real73.bottom:op.bottom):'')+' ✓';if(vert){const ax=P((s0+s1)/2,0)[0],q=P((s0+s1)/2,half+9);ctx.save();ctx.translate(m[0]>=ax?Math.max(q[0],ax+half+9):Math.min(q[0],ax-half-9),q[1]);ctx.rotate(-Math.PI/2);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(t93,0,0);ctx.restore();}else ctx.fillText(t93,m[0],m[1]);}}}
 ctx.restore();}catch(e){console.error(e);}if(!props54.length)return r;const c=$('plan'),ctx=c.getContext('2d'),o=c.planOrigin25||{x:0,y:0};ctx.save();ctx.setTransform(1,0,0,1,-o.x,-o.y);
 props54.forEach((p,k)=>{const w=p.wall;if(!w?.line||Number(w.page||1)!==num($('page').value))return;const[a,b]=w.line,len=Math.hypot(b.x-a.x,b.y-a.y),sc=Number(w.planScale)||pxCm||len/Number(w.length),ux=(b.x-a.x)/len,uy=(b.y-a.y)/len,s0=p.start*sc,s1=(p.start+p.width)*sc,half=Number(w.width)*sc*.9;
  const sim97=similar97(p)&&k!==hl54;ctx.strokeStyle=k===hl54?'#d1462f':p.accept?'#e07b12':sim97?'#1f9d55':'#9aa3ab';ctx.lineWidth=k===hl54?3:2;ctx.setLineDash([5,3]);ctx.beginPath();const P=(s,t)=>[a.x+ux*s-uy*t,a.y+uy*s+ux*t];ctx.moveTo(...P(s0,-half));ctx.lineTo(...P(s1,-half));ctx.lineTo(...P(s1,half));ctx.lineTo(...P(s0,half));ctx.closePath();ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=ctx.strokeStyle;ctx.font='bold 12px Arial';ctx.textAlign='center';const m=P((s0+s1)/2,-half-8);window.__txtFixed=true;try{ctx.fillText(tag54(k)+' · '+fmt(p.width)+(p.doubtful?' ?':'')+(sim97?' ≈ igual':''),m[0],m[1]);}finally{window.__txtFixed=false;}});ctx.restore();return r;};
// V57 — editar a abertura proposta clicando na caixa da planta
let pop54=null,pick54=null,newVao54=false;window.cancelNewVao54=()=>{if(newVao54){newVao54=false;document.body.classList.remove('newvao54');}try{if(brush97)brushOn97(false);}catch{}};
window.startNewVao54=function(){if(!image){alert('Carregue a planta primeiro.');return;}if(!state.walls.some(w=>w.line&&Number(w.page||1)===num($('page').value))){alert('Marque ou proponha as paredes primeiro.');return;}closePop54();mode='';points=[];newVao54=true;document.body.classList.add('newvao54');$('planStatus').textContent='Novo vão: clique na parede, no ponto onde o vão começa (Esc cancela).';$('plan').scrollIntoView?.({block:'nearest'});};
const sc54=w=>{const[a,b]=w.line,len=Math.hypot(b.x-a.x,b.y-a.y);return Number(w.planScale)||pxCm||len/Number(w.length);};
function raw54(e){const c=$('plan'),r=c.getBoundingClientRect();return {x:(e.clientX-r.left)*c.width/r.width+(c.planOrigin25?.x||0),y:(e.clientY-r.top)*c.height/r.height+(c.planOrigin25?.y||0)};}
function along54(w,P){const[a,b]=w.line,len=Math.hypot(b.x-a.x,b.y-a.y),ux=(b.x-a.x)/len,uy=(b.y-a.y)/len;return {s:((P.x-a.x)*ux+(P.y-a.y)*uy)/sc54(w),t:(-(P.x-a.x)*uy+(P.y-a.y)*ux)/sc54(w)};}
function hit54(P){let best=-1,bd=1e9;props54.forEach((p,k)=>{const w=p.wall;if(!w?.line||Number(w.page||1)!==num($('page').value))return;const q=along54(w,P),half=Number(w.width)*.9+6;if(q.s<p.start-6||q.s>p.start+p.width+6||Math.abs(q.t)>half)return;const d=Math.abs(q.t)+Math.max(0,p.start-q.s,q.s-p.start-p.width);if(d<bd){bd=d;best=k;}});return best;}
const snapW54=v=>($('snap54')?.checked??true)?Math.max(5,Math.round(v/5)*5):Math.round(v*2)/2;
const snapS54=v=>($('snap54')?.checked??true)?snapStart54(v):Math.round(v*2)/2;
function closePop54(){pop54?.remove();pop54=null;pick54=null;}
window.closePop54=closePop54;
window.props54raw={get:()=>props54.slice(),set:a=>{props54=(a||[]).slice();hl54=-1;pop54?.remove();pop54=null;pick54=null;render54();}};
window.splitProps54=function(W,parts,s1,s2){const A=parts.find(p=>p===W),B=parts.find(p=>p!==W);props54=props54.filter(p=>{if(p.wall!==W)return true;const e=p.start+p.width;if(e<=s1+.5&&A)return true;if(p.start>=s2-.5&&B){p.wall=B;for(const f of ['start','rawStart','manualStart'])if(p[f]!=null)p[f]-=s2;return true;}return false;});hl54=-1;pop54?.remove();pop54=null;render54();};
window.props54io={get:()=>props54.map(p=>({...p,wall:state.walls.indexOf(p.wall)})).filter(p=>p.wall>=0),set:a=>{props54=(a||[]).map(p=>({...p,wall:state.walls[p.wall]})).filter(p=>p.wall);hl54=-1;pop54?.remove();pop54=null;pick54=null;render54();}};
// V97 — lembra o último vão aceito (tipo, largura, peitoril, altura): "＝ Igual à anterior", 🖌 pincel e novo vão
const MEM97=()=>{try{const s=window.loads77?.S?.();if(s)return s.vao97||null;}catch{}return state.vao97||null;};
function setMem97(o){const m={type:pre58(o)==='J'?'Janela':'Porta',width:Number(o.width),bottom:Number(o.real73?o.real73.bottom:o.bottom)||0,height:Number(o.real73?o.real73.height:o.height)};if(!(m.width>0&&m.height>0))return;try{const s=window.loads77?.S?.();if(s){s.vao97=m;return;}}catch{}state.vao97=m;}
const memTxt97=m=>m.type+' '+fmt(m.width)+' × '+fmt(m.height)+(m.type==='Janela'?' · peitoril '+fmt(m.bottom):'');
let brush97=false;
function applyProp97(k,m){const p=props54[k];if(!p)return;const L=Number(p.wall.length),c=p.start+p.width/2;let st=Math.round(Math.max(0,Math.min(L-m.width,c-m.width/2))*2)/2;p.type=m.type;p.manualStart=st;p.manualWidth=m.width;p.bottom=m.bottom;p.height=m.height;p.tag58=null;render54();}
function acceptProp97(k){const q=props54[k];if(!q)return null;tag54(k);register54([q]);render54();renderWalls();invalidate();drawPlan();return q;}
function applyReg97(w,oi,m){const o=w.openings?.[oi];if(!o)return 'Abertura não encontrada.';const L=Number(w.length),H=Number(w.height),c=Number(o.start)+Number(o.width)/2,st=Math.round(Math.max(0,Math.min(L-m.width,c-m.width/2))*2)/2;
 if(m.width>L+.01)return 'A parede é mais curta que '+fmt(m.width)+' cm.';if(m.bottom+m.height>H+.01)return 'Passa da altura da parede ('+fmt(H)+' cm).';
 if(w.openings.some((q,j)=>j!==oi&&st<Number(q.start)+Number(q.width)-.01&&st+m.width>Number(q.start)+.01))return 'Sobreporia outra abertura desta parede.';
 delete o.real73;Object.assign(o,{type:m.type,start:st,width:m.width,bottom:m.bottom,height:m.height});w.openings.sort((a,b)=>a.start-b.start);ensureTags58();renderWalls();invalidate();drawPlan();return '';}
function brushOn97(on){brush97=!!on&&!!MEM97();document.body.classList.toggle('brush97',brush97);if(brush97){closePop54();$('planStatus').textContent='🖌 Pincel: '+memTxt97(MEM97())+' — clique em cada vão (caixa cinza do DXF ou abertura já cadastrada) para aplicar e aceitar. Esc solta o pincel · Ctrl+Z desfaz.';}else $('planStatus').textContent='🖌 Pincel solto.';try{drawPlan();}catch{}}
window.brush97=brushOn97;window.vaoMem97=MEM97;
const similar97=p=>{const m=MEM97();return !!m&&!p.accept&&Math.abs(Number(p.width)-m.width)<=5;};
const memBar97=()=>{const m=MEM97();return m?'<div class="m97"><button type="button" data-a="same97" title="Aplica as medidas do último vão aceito, centrado neste vão, e já aceita">＝ Igual à anterior: '+esc(memTxt97(m))+'</button><button type="button" data-a="brush97" class="secondary" title="Aplica neste vão e continua: cada clique em outro vão aplica e aceita. Esc solta.">🖌 Pincel</button></div>':'';};
function openPop54(k,x,y){const p=props54[k];if(!p){closePop54();return;}pop54?.remove();hl54=k;render54();
 const d=document.createElement('div');d.id='pop54';d.className='pop54 noPrint';pop54=d;d.dataset.k=k;
 const L=Number(p.wall.length),wi=state.walls.indexOf(p.wall)+1;
 d.innerHTML=`<div class="pop54h"><b>${tag54(k)} · Parede ${wi}</b><button type="button" class="pop54x" title="Fechar">✕</button></div>${memBar97()}
 <div class="pop54g"><label>Tipo<select data-f="type"><option ${p.type==='Porta'?'selected':''}>Porta</option><option ${p.type==='Janela'?'selected':''}>Janela</option></select></label>
 <label>Início (cm)<input data-f="start" type="number" step="0.5" value="${p.start}"></label><label>Largura (cm)<input data-f="width" type="number" step="0.5" value="${p.width}"></label>
 <label>Peitoril (cm)<input data-f="bottom" type="number" step="1" value="${p.bottom}"></label><label>Altura (cm)<input data-f="height" type="number" step="1" value="${p.height}"></label>
 <label class="pop54c"><input data-f="accept" type="checkbox" ${p.accept?'checked':''}> Aceitar</label></div>
 <p class="pop54n">Início medido desde o começo da parede (0 a ${fmt(L)} cm).</p>
 <div class="pop54b"><button type="button" data-a="two" class="secondary">Marcar vão no desenho (2 cliques)</button><button type="button" data-a="move" class="secondary">Mover: clicar no novo início</button><button type="button" data-a="acc">Aceitar e cadastrar na parede</button><button type="button" data-a="ok" class="secondary">Fechar sem aceitar</button><button type="button" data-a="del" class="secondary">Excluir esta</button><button type="button" data-a="cut" class="secondary" title="Quando o vão do desenho não tem parede (passagem aberta): tira esse trecho da parede, dividindo-a em duas.">Não tem parede aqui: apagar este pedaço da parede</button></div>`;
 document.body.append(d);const r=d.getBoundingClientRect();d.style.left=Math.max(8,Math.min(innerWidth-r.width-8,x+14))+'px';d.style.top=Math.max(8,Math.min(innerHeight-r.height-8,y+14))+'px';
 d.querySelector('.pop54x').onclick=closePop54;
 d.querySelectorAll('[data-f]').forEach(inp=>inp.onchange=()=>{const f=inp.dataset.f,v=f==='accept'?inp.checked:inp.value;edit54(k,f,v);if(f==='type'){const q=props54[k];d.querySelector('[data-f=bottom]').value=q.bottom;d.querySelector('[data-f=height]').value=q.height;d.querySelector('b').textContent=tag54(k)+' · Parede '+wi;}});
 d.querySelector('[data-a=ok]').onclick=()=>{d.querySelectorAll('input[type=number]').forEach(i=>{if(document.activeElement===i)i.onchange();});closePop54();};
 {const m=MEM97(),same=()=>{const tg=tag54(k);applyProp97(k,m);const q=acceptProp97(k);closePop54();$('planStatus').textContent=(q?.tag58||tg)+' = '+memTxt97(m)+' cadastrada na Parede '+(state.walls.indexOf(q?.wall)+1)+'. '+(props54.length?props54.length+' abertura(s) ainda por conferir.':'Todas as aberturas conferidas.');};
 if(m){d.querySelector('[data-a=same97]').onclick=same;d.querySelector('[data-a=brush97]').onclick=()=>{same();brushOn97(true);};}}
 d.querySelector('[data-a=acc]').onclick=()=>{d.querySelectorAll('input[type=number]').forEach(i=>{if(document.activeElement===i)i.onchange();});if(props54[k])setMem97(props54[k]);const q=props54[k],tg=tag54(k),wi=state.walls.indexOf(q?.wall)+1;hl54=-1;closePop54();if(q){register54([q]);render54();renderWalls();invalidate();drawPlan();const n=props54.length;$('planStatus').textContent=tg+' cadastrada na Parede '+wi+' ('+q.type+' '+fmt(q.width)+' × '+fmt(q.height)+(q.type==='Janela'?' · peitoril '+fmt(q.bottom):'')+'). '+(n?n+' abertura(s) ainda por conferir.':'Todas as aberturas conferidas.');}return;render54();const n=props54.filter(p=>!p.accept).length;$('planStatus').textContent=tag54(k)+' aceita. '+(n?n+' abertura(s) ainda por conferir.':'Todas conferidas: clique em “Aceitar marcadas” na tabela para cadastrar.');};
 d.querySelector('[data-a=cut]').onclick=()=>{const q=props54[k];if(!q)return;const W=q.wall,s1=q.start,s2=q.start+q.width;closePop54();window.cutWall56?.(W,s1,s2);};
 d.querySelector('[data-a=del]').onclick=()=>{const w=props54[k]?.wall;props54.splice(k,1);hl54=-1;closePop54();if(w&&(w.openings||[]).length&&confirmIfDone54(w))renderWalls();render54();};
 d.querySelector('[data-a=two]').onclick=()=>{pick54={k,kind:'two',pts:[]};$('planStatus').textContent=tag54(k)+': clique no começo do vão no desenho (Esc cancela).';d.classList.add('pop54wait');};
 d.querySelector('[data-a=move]').onclick=()=>{pick54={k,kind:'move',pts:[]};$('planStatus').textContent=tag54(k)+': clique onde a abertura deve começar (Esc cancela).';d.classList.add('pop54wait');};
 const stop=e=>e.stopPropagation();d.addEventListener('pointerdown',stop);d.addEventListener('click',stop);}
function near54(P){let best=-1,bd=1e9;state.walls.forEach((w,i)=>{if(!w.line||Number(w.page||1)!==num($('page').value))return;const[a,b]=w.line,dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;if(!den)return;const t=Math.max(0,Math.min(1,((P.x-a.x)*dx+(P.y-a.y)*dy)/den)),d=Math.hypot(P.x-a.x-t*dx,P.y-a.y-t*dy),lim=Number(w.width)*sc54(w)/2+8/zoom;if(d<=lim&&d<bd){bd=d;best=i;}});return best;}
function createAt54(w,P,cx,cy,force){const L=Number(w.length),q=along54(w,P),g=window.detectGap57?.(w,P);let start,width=80,found=false;
 if(g&&q.s>=g.start-(force?25:3)&&q.s<=g.start+g.width+(force?25:3)){start=g.start;width=g.width;found=true;}else if(!force)return false;else{start=snapS54(Math.max(0,Math.min(L,q.s)));if(start+width>L)start=Math.max(0,L-width);}
 const ov=(a,b)=>Math.min(b,start+width)-Math.max(a,start)>width*.5;
 if((w.openings||[]).some(o=>ov(Number(o.start),Number(o.start)+Number(o.width)))){if(force)$('planStatus').textContent='Esse vão já está cadastrado na '+'Parede '+(state.walls.indexOf(w)+1)+'. Edite pela abertura da parede.';return force;}
 const dup=props54.findIndex(p=>p.wall===w&&ov(p.start,p.start+p.width));if(dup>=0){openPop54(dup,cx,cy);return true;}
 const p={wall:w,start,width,rawStart:start,rawWidth:width,manualStart:start,manualWidth:width,type:'Porta',lines:0,doubtful:false,solidFaces:false,accept:false,manual58:true};applyDefaults54(p);{const m=MEM97();if(m&&(!found||Math.abs(width-m.width)<=5)){const L2=Number(w.length);p.type=m.type;p.bottom=m.bottom;p.height=m.height;if(!found)p.manualStart=p.start=Math.max(0,Math.min(L2-m.width,start));p.manualWidth=p.width=m.width;if(found){p.manualStart=p.start=Math.round(Math.max(0,Math.min(L2-m.width,start+width/2-m.width/2))*2)/2;}}}props54.push(p);const k=props54.length-1;render54();
 $('planStatus').textContent=tag54(k)+(found?' reconhecida no desenho: ':' criada a partir do ponto clicado: ')+'início '+fmt(props54[k].start)+' cm, largura '+fmt(props54[k].width)+' cm (Parede '+(state.walls.indexOf(w)+1)+'). Confira na janelinha.';openPop54(k,cx,cy);return true;}
// V62 — arrastar a caixa da abertura ao longo da parede
let drag54=null,justDragged54=false;
function hitReg54(P){let best=null,bd=1e9;for(const w of state.walls){if(!w.line||Number(w.page||1)!==num($('page').value))continue;(w.openings||[]).forEach((o,oi)=>{const q=along54(w,P),st=Number(o.start),en=st+Number(o.width),half=Number(w.width)*.9+6;if(q.s<st-4||q.s>en+4||Math.abs(q.t)>half)return;const dd=Math.abs(q.t)+Math.max(0,st-q.s,q.s-en);if(dd<bd){bd=dd;best={w,oi};}});}return best;}
const step54=()=>(Number(state.blocks.find(b=>b.active!==false&&b.type!=='Canaleta')?.height)||19)+(num($('jv').value)||1);
function openReg54(w,oi,x,y){const o=w.openings?.[oi];if(!o)return;pop54?.remove();ensureTags58();const wi=state.walls.indexOf(w)+1,L=Number(w.length);
 const dv=document.createElement('div');dv.id='pop54';dv.className='pop54 noPrint reg54';pop54=dv;
 dv.innerHTML=`<div class="pop54h"><b>${o.tag58||''} · Parede ${wi} · cadastrada ✓</b><button type="button" class="pop54x" title="Fechar">✕</button></div>${memBar97()}
 <div class="pop54g"><label>Tipo<select data-f="type"><option ${pre58(o)==='P'?'selected':''}>Porta</option><option ${pre58(o)==='J'?'selected':''}>Janela</option></select></label>
 <label>Início (cm)<input data-f="start" type="number" step="0.5" value="${o.start}"></label><label>Largura (cm)<input data-f="width" type="number" step="0.5" value="${o.width}"></label>
 <label>Peitoril (cm)<input data-f="bottom" type="number" step="1" value="${Number(o.real73?o.real73.bottom:o.bottom)||0}"></label><label>Altura (cm)<input data-f="height" type="number" step="1" value="${o.real73?o.real73.height:o.height}"></label></div>${o.real73?`<p class="pop54n" style="color:#7a3d0a">Fora das fiadas: vão de alvenaria ${fmt(o.real73.mod.height)} cm${o.real73.mod.bottom?` (peitoril ${fmt(o.real73.mod.bottom)})`:''} com complemento hachurado.</p>`:''}
 <p class="pop54n">Início medido desde o começo da parede (0 a ${fmt(L)} cm). Também dá para arrastar a abertura na planta.</p><p class="pop54e" style="color:#a3361f;margin:4px 0;font-size:12px"></p>
 <div class="pop54b"><button type="button" data-a="save">Salvar alterações</button><button type="button" data-a="delreg" class="secondary">Excluir abertura</button><button type="button" data-a="close" class="secondary">Fechar</button></div>`;
 document.body.append(dv);const r=dv.getBoundingClientRect();dv.style.left=Math.max(8,Math.min(innerWidth-r.width-8,x+14))+'px';dv.style.top=Math.max(8,Math.min(innerHeight-r.height-8,y+14))+'px';
 const f=n=>dv.querySelector('[data-f='+n+']'),err=t=>{dv.querySelector('.pop54e').textContent=t||'';};
 f('type').onchange=()=>{const dfl=defaults54();if(f('type').value==='Porta'){f('bottom').value=0;f('height').value=dfl.door;}else{f('bottom').value=dfl.winBottom;f('height').value=dfl.winH;}};
 dv.querySelector('.pop54x').onclick=closePop54;dv.querySelector('[data-a=close]').onclick=closePop54;
 dv.querySelector('[data-a=save]').onclick=()=>{const st=Number(f('start').value),wd=Number(f('width').value),bt=Number(f('bottom').value),ht=Number(f('height').value),stp=step54(),H=Number(w.height);
  if(![st,wd,bt,ht].every(Number.isFinite)||st<0||wd<=0||ht<=0||bt<0)return err('Informe valores positivos.');
  if(st+wd>L+.01)return err('A abertura passa do fim da parede ('+fmt(L)+' cm).');
  if(bt+ht>H+.01)return err('A abertura passa da altura da parede ('+fmt(H)+' cm).');
  if((w.openings||[]).some((q,j)=>j!==oi&&st<Number(q.start)+Number(q.width)-.01&&st+wd>Number(q.start)+.01&&bt<(Number(q.bottom)||0)+Number(q.height)-.01&&bt+ht>(Number(q.bottom)||0)+.01))return err('Sobrepõe outra abertura desta parede.');
  delete o.real73;Object.assign(o,{type:f('type').value,start:st,width:wd,bottom:bt,height:ht});setMem97(o);w.openings.sort((a,b)=>a.start-b.start);ensureTags58();closePop54();renderWalls();invalidate();drawPlan();
  $('planStatus').textContent=(o.tag58||'Abertura')+' atualizada na Parede '+wi+': '+o.type+' '+fmt(wd)+' × '+fmt(ht)+(o.type==='Janela'?' · peitoril '+fmt(bt):'')+', início '+fmt(st)+' cm. Gere a modulação para atualizar os desenhos.';};
 {const m=MEM97();if(m){const same=()=>{const e1=applyReg97(w,oi,m);if(e1)return err(e1);closePop54();$('planStatus').textContent=(o.tag58||'Abertura')+' = '+memTxt97(m)+' na Parede '+wi+'. Gere a modulação para atualizar os desenhos.';};dv.querySelector('[data-a=same97]').onclick=same;dv.querySelector('[data-a=brush97]').onclick=()=>{const e1=applyReg97(w,oi,m);if(e1)return err(e1);brushOn97(true);};}}
 dv.querySelector('[data-a=delreg]').onclick=()=>{if(!confirm('Excluir '+(o.tag58||'a abertura')+' da Parede '+wi+'?'))return;const i=w.openings.indexOf(o);if(i>=0)w.openings.splice(i,1);closePop54();renderWalls();invalidate();drawPlan();$('planStatus').textContent=(o.tag58||'Abertura')+' excluída da Parede '+wi+'.';};
 const stop=e=>e.stopPropagation();dv.addEventListener('pointerdown',stop);dv.addEventListener('click',stop);}
window.openReg54=openReg54;
const idle54=()=>!mode&&!document.body.classList.contains('tool56')&&!window.mark57on&&!newVao54&&!pick54;
$('plan').addEventListener('pointerdown',e=>{if(e.button!==0||!image||!idle54())return;const P=raw54(e),k=props54.length?hit54(P):-1;if(k<0){const h=hitReg54(P);if(!h)return;const o=h.w.openings[h.oi];e.stopPropagation();drag54={reg:h,o,id:e.pointerId,s0:along54(h.w,P).s,start0:Number(o.start),moved:false};try{$('plan').setPointerCapture(e.pointerId);}catch{}return;}const p=props54[k];
 e.stopPropagation();drag54={k,id:e.pointerId,s0:along54(p.wall,P).s,start0:p.start,moved:false};try{$('plan').setPointerCapture(e.pointerId);}catch{}},true);
$('plan').addEventListener('pointermove',e=>{if(!drag54){if(image&&idle54()){const P=raw54(e),k=props54.length?hit54(P):-1,w=k>=0?props54[k].wall:hitReg54(P)?.w;$('plan').style.cursor=w?(Math.abs(w.line[1].x-w.line[0].x)>=Math.abs(w.line[1].y-w.line[0].y)?'ew-resize':'ns-resize'):'';}return;}
 if(drag54.reg){const {w}=drag54.reg,o=drag54.o,s=along54(w,raw54(e)).s,d=s-drag54.s0;if(!drag54.moved&&Math.abs(d)<2)return;drag54.moved=true;const ns=Math.max(0,Math.min(Number(w.length)-Number(o.width),snapS54(drag54.start0+d)));if(ns!==Number(o.start)){o.start=ns;drawPlan();$('planStatus').textContent=(o.tag58||'Abertura')+': início '+fmt(ns)+' cm — solte para fixar.';}return;}
 const p=props54[drag54.k];if(!p){drag54=null;return;}const s=along54(p.wall,raw54(e)).s,L=Number(p.wall.length),d=s-drag54.s0;if(!drag54.moved&&Math.abs(d)<2)return;drag54.moved=true;
 const ns=Math.max(-.5,Math.min(L-p.width+.5,snapS54(drag54.start0+d)));if(ns!==p.start){p.manualStart=ns;p.manualWidth=p.width;p.start=ns;hl54=drag54.k;drawPlan();$('planStatus').textContent=tag54(drag54.k)+': início '+fmt(ns)+' cm (largura '+fmt(p.width)+' cm) — solte para fixar.';}},true);
const end54=e=>{if(!drag54)return;if(drag54.reg){const {w}=drag54.reg,o=drag54.o,moved=drag54.moved,s0=drag54.start0;drag54=null;if(!moved)return;justDragged54=true;setTimeout(()=>{justDragged54=false;},300);
  const bt=Number(o.bottom)||0,clash=(w.openings||[]).some(q=>q!==o&&Number(o.start)<Number(q.start)+Number(q.width)-.01&&Number(o.start)+Number(o.width)>Number(q.start)+.01&&bt<(Number(q.bottom)||0)+Number(q.height)-.01&&bt+Number(o.height)>(Number(q.bottom)||0)+.01);
  if(clash){o.start=s0;drawPlan();$('planStatus').textContent='Não dá para colocar '+(o.tag58||'a abertura')+' ali: sobrepõe outra abertura. Voltou para a posição anterior.';return;}
  w.openings.sort((a,b)=>a.start-b.start);renderWalls();invalidate();drawPlan();$('planStatus').textContent=(o.tag58||'Abertura')+' movida: início '+fmt(o.start)+' cm na Parede '+(state.walls.indexOf(w)+1)+'. Gere a modulação para atualizar os desenhos.';return;}
 const moved=drag54.moved,k=drag54.k;drag54=null;if(moved){justDragged54=true;setTimeout(()=>{justDragged54=false;},300);render54();$('planStatus').textContent=tag54(k)+' movida: início '+fmt(props54[k].start)+' cm, largura '+fmt(props54[k].width)+' cm.';}};
$('plan').addEventListener('pointerup',end54,true);$('plan').addEventListener('pointercancel',end54,true);
$('plan').addEventListener('click',e=>{if(!image)return;if(justDragged54){justDragged54=false;e.stopImmediatePropagation();e.preventDefault();return;}
 if(brush97){e.stopImmediatePropagation();e.preventDefault();const m=MEM97();if(!m){brushOn97(false);return;}const P=raw54(e),k=props54.length?hit54(P):-1;
  if(k>=0){const q=(applyProp97(k,m),acceptProp97(k));$('planStatus').textContent='🖌 '+(q?.tag58||'')+' = '+memTxt97(m)+' (Parede '+(state.walls.indexOf(q?.wall)+1)+'). '+(props54.length?props54.length+' por conferir. ':'')+'Esc solta o pincel.';return;}
  const h=hitReg54(P);if(h){const o=h.w.openings[h.oi],e1=applyReg97(h.w,h.oi,m);$('planStatus').textContent=e1?'🖌 '+(o?.tag58||'Abertura')+': '+e1:'🖌 '+(o?.tag58||'Abertura')+' = '+memTxt97(m)+' (Parede '+(state.walls.indexOf(h.w)+1)+'). Esc solta o pincel.';return;}
  const i=near54(P);if(i>=0&&createAt54(state.walls[i],P,e.clientX,e.clientY,false)){closePop54();const k2=props54.length-1;const q=(applyProp97(k2,m),acceptProp97(k2));$('planStatus').textContent='🖌 '+(q?.tag58||'')+' = '+memTxt97(m)+' reconhecida e cadastrada. Esc solta o pincel.';return;}
  $('planStatus').textContent='🖌 Clique em cima de um vão. Esc solta o pincel.';return;}
 if(newVao54){e.stopImmediatePropagation();e.preventDefault();const P=raw54(e),i=near54(P);if(i<0){$('planStatus').textContent='Nenhuma parede perto do clique. Clique sobre a parede, no início do vão (Esc cancela).';return;}
  newVao54=false;document.body.classList.remove('newvao54');createAt54(state.walls[i],P,e.clientX,e.clientY,true);return;}
 if(pick54){e.stopImmediatePropagation();e.preventDefault();const p=props54[pick54.k];if(!p){closePop54();return;}const q=along54(p.wall,raw54(e)),L=Number(p.wall.length),s=Math.max(0,Math.min(L,q.s));
  if(pick54.kind==='move'){p.manualStart=Math.max(0,Math.min(L-p.width,snapS54(s)));p.manualWidth=p.width;}
  else{pick54.pts.push(s);if(pick54.pts.length<2){$('planStatus').textContent=tag54(pick54.k)+': agora clique no fim do vão.';return;}const[a,b]=pick54.pts;p.manualStart=Math.max(0,snapS54(Math.min(a,b)));p.manualWidth=snapW54(Math.abs(b-a));}
  const k=pick54.k;pick54=null;render54();$('planStatus').textContent=tag54(k)+' ajustada: início '+fmt(props54[k].start)+' cm, largura '+fmt(props54[k].width)+' cm.';const r=pop54?.getBoundingClientRect();openPop54(k,r?r.left-14:e.clientX,r?r.top-14:e.clientY);return;}
 if(mode||document.body.classList.contains('tool56')||window.mark57on)return;
 const P=raw54(e),k=props54.length?hit54(P):-1;if(k>=0){e.stopImmediatePropagation();e.preventDefault();openPop54(k,e.clientX,e.clientY);return;}
 {const h=hitReg54(P);if(h){e.stopImmediatePropagation();e.preventDefault();openReg54(h.w,h.oi,e.clientX,e.clientY);return;}}
 if(pop54){closePop54();hl54=-1;render54();return;}
 // clique dentro de um vão do desenho: reconhece e cria a abertura numerada
 const i=near54(P);if(i<0)return;if(createAt54(state.walls[i],P,e.clientX,e.clientY,false)){e.stopImmediatePropagation();e.preventDefault();}},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&brush97){brushOn97(false);return;}if(e.key==='Escape'&&newVao54){newVao54=false;document.body.classList.remove('newvao54');$('planStatus').textContent='Novo vão cancelado.';}if(e.key==='Escape'&&(pop54||pick54)){closePop54();hl54=-1;render54();}});

const css54=document.createElement('style');css54.textContent='.m97{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 4px}.m97 button{margin:0;font-weight:600}body.brush97 #plan{cursor:copy}.dxfOpenings54{margin-top:14px;padding:12px;border:2px solid #e07b12;border-radius:8px;background:#fff8ef}.dxfOpenings54 h3{margin:0 0 6px;color:#9a4f00}.dxfOpenings54 table input{width:90px}.dxfOpenings54 tr.hl54 td{background:#ffe3c2}.dxfOpenings54 tbody tr{cursor:pointer}.pop54{position:fixed;z-index:9999;background:#fff;border:2px solid #d1462f;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.25);padding:10px 12px;font-size:13px;color:#102e4b;max-width:430px}.pop54h{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.pop54x{padding:1px 8px}.pop54g{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 10px}.pop54g label{display:flex;flex-direction:column;font-size:12px}.pop54g input[type=number],.pop54g select{width:100%;box-sizing:border-box}.pop54c{flex-direction:row!important;align-items:center;gap:6px;margin-top:14px}.pop54n{margin:6px 0;color:#586c7c;font-size:12px}.pop54b{display:flex;flex-wrap:wrap;gap:6px}.pop54b button{padding:4px 8px;font-size:12px}.pop54wait{outline:3px solid #f2b705}body.newvao54 #plan{cursor:crosshair}.row54{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin:8px 0}.row54 label{display:flex;flex-direction:column;font-size:13px}.row54 input[type=number]{width:90px}.chk54{flex-direction:row!important;align-items:center;gap:6px}';document.head.append(css54);
})();
