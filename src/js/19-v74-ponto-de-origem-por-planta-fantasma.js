// V74 — ponto de origem por planta, fantasma do pavimento de baixo, vista 3D com lajes e importador de IFC.
(function(){
'use strict';
const N=v=>Number(v),f1=v=>Number(v).toLocaleString('pt-BR',{maximumFractionDigits:1}),f2=v=>Number(v).toFixed(2).replace('.',',');
const LS=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch{}return null;};
const L68=()=>window.level68;
const allWalls=()=>L68()?.all?.()||state.walls;
const curPage=()=>num($('page').value)||1;
const pagesList=()=>{try{return pages36;}catch{return [];}};
const pageObj=pg=>pagesList().find(p=>p.id===N(pg));
const sourceOf=pg=>pageObj(pg)?.source||null;
state.origins74??={};

// ---------- 1. Ponto de origem
// escala (px por cm) de cada planta
function scaleOf(pg){pg=N(pg);const s=N(state.pageScales23?.[pg]);if(s>0)return s;const w=allWalls().find(w=>N(w.page||1)===pg&&N(w.planScale)>0);if(w)return N(w.planScale);return pg===curPage()&&pxCm>0?pxCm:1;}
function originOf(pg,seen=0){pg=N(pg);const o=state.origins74?.[pg];if(o)return o;const c=(state.pageCopies72||[]).find(c=>N(c.id)===pg);if(c&&seen<10)return originOf(c.of,seen+1);
 // origem reconhecida no DXF (layer ORIGEM) — fica gravada no projeto
 const src=sourceOf(pg),m=src?.canvas?.map74;if(m?.org){const p=dxfToCanvas(m,m.org.x,m.org.y),o2={x:p.x,y:p.y,how:'layer'};if(Number.isFinite(m.org.rot)&&m.org.rot){const a=m.org.rot*Math.PI/180,q=dxfToCanvas(m,m.org.x+100*Math.cos(a),m.org.y+100*Math.sin(a));o2.ax=q.x;o2.ay=q.y;}state.origins74[pg]=o2;return o2;}
 return null;}
const dxfToCanvas=(m,x,y)=>({x:m.margin+(x-m.minX)*m.scale,y:m.margin+(m.maxY-y)*m.scale});
function angOf(o){return o&&o.ax!=null?Math.atan2(-(o.ay-o.y),o.ax-o.x):0;}
// planta → coordenadas do projeto (cm, Y para cima)
function world(pg,P){const o=originOf(pg)||{x:0,y:0},s=scaleOf(pg),X=(P.x-o.x)/s,Y=-(P.y-o.y)/s,a=angOf(o),c=Math.cos(a),n=Math.sin(a);return {x:X*c+Y*n,y:-X*n+Y*c};}
function toPage(pg,W){const o=originOf(pg)||{x:0,y:0},s=scaleOf(pg),a=angOf(o),c=Math.cos(a),n=Math.sin(a),X=W.x*c-W.y*n,Y=W.x*n+W.y*c;return {x:o.x+X*s,y:o.y-Y*s};}
function aligned(a,b){a=N(a);b=N(b);if(a===b)return true;if(originOf(a)&&originOf(b))return true;const sa=sourceOf(a),sb=sourceOf(b);return !!sa&&sa===sb;}
window.world74=world;window.toPage74=toPage;window.aligned74=aligned;window.originOf74=originOf;

// leitura do layer ORIGEM e da origem 0,0 dos DXF
const dxfInfo=[];
function scanOrigin(text){const L=text.split(/\r\n|\n|\r/);let sec='',cur=null;const ents=[];
 for(let i=0;i+1<L.length;i+=2){const c=L[i].trim(),v=L[i+1].trim();if(c==='0'){if(v==='SECTION'){sec='?';cur=null;continue;}if(v==='ENDSEC'){sec='';cur=null;continue;}cur=sec==='ENTITIES'?{t:v,g:{}}:null;if(cur)ents.push(cur);continue;}
  if(c==='2'&&sec==='?'){sec=v;continue;}if(cur){(cur.g[c]??=[]).push(v);}}
 const mine=ents.filter(e=>/^(ORIGEM|ORIGIN|0-ORIGEM|ORIGEM.*)$/i.test(e.g['8']?.[0]||''));if(!mine.length)return null;
 const n=(e,c,k=0)=>Number(e.g[c]?.[k]);
 const pt=mine.find(e=>/^(POINT|INSERT|CIRCLE)$/.test(e.t));if(pt)return {x:n(pt,'10'),y:n(pt,'20'),rot:pt.t==='INSERT'?(n(pt,'50')||0):0};
 const lines=mine.filter(e=>e.t==='LINE').map(e=>[{x:n(e,'10'),y:n(e,'20')},{x:n(e,'11'),y:n(e,'21')}]);
 for(let i=0;i<lines.length;i++)for(let j=i+1;j<lines.length;j++){const[a,b]=lines[i],[c,d]=lines[j],r={x:b.x-a.x,y:b.y-a.y},s={x:d.x-c.x,y:d.y-c.y},den=r.x*s.y-r.y*s.x;if(Math.abs(den)<1e-9)continue;const t=((c.x-a.x)*s.y-(c.y-a.y)*s.x)/den,u=((c.x-a.x)*r.y-(c.y-a.y)*r.x)/den;if(t>-.01&&t<1.01&&u>-.01&&u<1.01)return {x:a.x+t*r.x,y:a.y+t*r.y,rot:0};}
 if(lines.length)return {x:lines[0][0].x,y:lines[0][0].y,rot:0};return null;}
try{const pd=parseDXF;parseDXF=function(text){const r=pd.apply(this,arguments);try{let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const s of r.segments)for(const p of s){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
  dxfInfo.push({n:r.segments.length,minX,maxY,scale:1800/Math.max(maxX-minX,maxY-minY,1e-6),margin:30,org:scanOrigin(text)});if(dxfInfo.length>30)dxfInfo.shift();}catch(e){console.error(e);}return r;};}catch(e){console.error('V74 parseDXF',e);}
try{const ap=addPlant36;addPlant36=async function(file,stored){const r=await ap.apply(this,arguments);try{const src=plants36[plants36.length-1];if(src?.type==='dxf'&&src.canvas){const info=[...dxfInfo].reverse().find(d=>d.n===src.canvas.dxfSegments53?.length);if(info)src.canvas.map74=info;if(info?.org){for(const pg of src.pages)if(!state.origins74[pg])originOf(pg);const s=$('planStatus');if(s)s.textContent+=' Ponto de origem reconhecido no layer ORIGEM.';}}refreshPanel();try{drawPlan();}catch{}}catch(e){console.error(e);}return r;};}catch(e){console.error('V74 addPlant36',e);}

// ferramenta "Marcar ponto de origem"
let pick=null;
function bar(msg,actions=[]){let p=$('orig74bar');if(!p){p=document.createElement('div');p.id='orig74bar';p.className='walltool56 noPrint';$('planStatus').after(p);}p.innerHTML='';const t=document.createElement('span');t.textContent=msg||'';p.append(t);for(const[l,fn]of actions){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=l;b.onclick=fn;p.append(b);}p.style.display=msg?'flex':'none';}
window.cancelPick74=()=>{if(pick)cancelPick();};function cancelPick(){pick=null;document.body.classList.remove('tool56','pick74');bar('');drawPlan();}
function donePick(){const o=state.origins74[curPage()];pick=null;document.body.classList.remove('tool56','pick74');bar('');drawPlan();refreshPanel();try{invalidate3D();}catch{}
 $('planStatus').textContent='Ponto de origem desta planta marcado'+(o?.ax!=null?' com direção do eixo X':'')+'. Marque o mesmo ponto físico nas plantas dos outros pavimentos.';}
function startPick(){if(!image){alert('Carregue a planta primeiro.');return;}try{(window.stopAll108||window.cancelTool56)?.();}catch{}mode='';pick={stage:1};document.body.classList.add('tool56','pick74');
 bar('Ponto de origem: clique no ponto de referência desta planta — o mesmo ponto físico em todos os pavimentos (ex.: um canto externo, o poço do elevador). O clique gruda nos pontos do desenho.',[['Cancelar',cancelPick]]);}
function rawPoint(e){const c=$('plan'),r=c.getBoundingClientRect();return {x:(e.clientX-r.left)*c.width/r.width+(c.planOrigin25?.x||0),y:(e.clientY-r.top)*c.height/r.height+(c.planOrigin25?.y||0)};}
function snap(P){const tol=14/(zoom||1);let best=null,bd=tol;const test=q=>{const d=Math.hypot(q.x-P.x,q.y-P.y);if(d<bd){bd=d;best=q;}};try{for(const q of fixedPoints||[])test(q);}catch{}for(const w of state.walls){if(!w.line||N(w.page||1)!==curPage())continue;w.line.forEach(test);}return best?{x:best.x,y:best.y}:P;}
$('plan').addEventListener('click',e=>{if(!pick)return;e.stopImmediatePropagation();e.preventDefault();const P=snap(rawPoint(e)),pg=curPage();
 if(pick.stage===1){state.origins74[pg]={x:P.x,y:P.y,how:'manual'};pick.stage=2;drawPlan();bar('Origem marcada. Se quiser, clique um 2º ponto para a direção do eixo X (ex.: o outro canto da mesma parede externa) — útil quando uma planta veio girada.',[['Concluir sem direção',donePick],['Cancelar',()=>{delete state.origins74[pg];cancelPick();}]]);return;}
 const o=state.origins74[pg];if(!o||Math.hypot(P.x-o.x,P.y-o.y)<3)return;o.ax=P.x;o.ay=P.y;donePick();},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&pick)cancelPick();});
function dxf00Page(pg){const p=pagesList().find(p=>N(p.id)===N(pg)),m=p?.source?.canvas?.map74;if(!m)return false;const q=dxfToCanvas(m,0,0);state.origins74[pg]={x:q.x,y:q.y,how:'dxf00'};return true;}
window.dxf00Page74=dxf00Page;
function useDxf00(){let n=0;for(const p of pagesList()){const m=p.source?.canvas?.map74;if(!m)continue;const q=dxfToCanvas(m,0,0);state.origins74[p.id]={x:q.x,y:q.y,how:'dxf00'};n++;}
 if(!n){alert('Nenhuma planta DXF carregada nesta sessão. A origem 0,0 só existe em plantas DXF (abra os DXF de novo se o projeto foi reaberto).');return;}
 drawPlan();refreshPanel();try{invalidate3D();}catch{}$('planStatus').textContent='Origem 0,0 do DXF aplicada em '+n+' planta(s) DXF. Use quando todos os pavimentos foram desenhados no mesmo sistema de coordenadas do CAD.';}
function clearOrigin(){const pg=curPage();if(!state.origins74[pg]){alert('Esta planta não tem ponto de origem próprio.');return;}delete state.origins74[pg];drawPlan();refreshPanel();$('planStatus').textContent='Ponto de origem desta planta apagado.';}
const howTxt={manual:'marcado na planta',layer:'layer ORIGEM do DXF',dxf00:'origem 0,0 do DXF',ifc:'importado do IFC'};
function originText(pg){const own=state.origins74?.[pg],o=originOf(pg);if(!o)return 'Origem: não definida nesta planta';return 'Origem: '+(own?howTxt[own.how]||'definida':'herdada da planta copiada')+(o.ax!=null?' · com direção X':'');}

// ---------- 2. Fantasma do pavimento de baixo
let ghost=LS('ghost74')==='1';
function belowWalls(pg){const L=L68();if(!L?.levelKeys)return {walls:[],name:''};const keys=L.levelKeys(),k=L.keyOf(pg),i=keys.indexOf(k);if(i<=0)return {walls:[],name:''};const bk=keys[i-1];return {walls:allWalls().filter(w=>L.keyOf(N(w.page||1))===bk),name:L.nameOf(bk)};}
const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);if(!image)return r;try{const c=$('plan'),ctx=c.getContext('2d'),o25=c.planOrigin25||{x:0,y:0},pg=curPage(),z=zoom||1;ctx.save();ctx.setTransform(1,0,0,1,-o25.x,-o25.y);
 if(ghost){const {walls,name}=belowWalls(pg);let miss=0,drawn=0;const s=scaleOf(pg);ctx.lineCap='butt';
  for(const w of walls){if(!w.line)continue;const wp=N(w.page||1);if(!aligned(pg,wp)){miss++;continue;}const A=toPage(pg,world(wp,w.line[0])),B=toPage(pg,world(wp,w.line[1]));ctx.strokeStyle='rgba(124,58,237,.28)';ctx.lineWidth=Math.max(3,N(w.width)*s);ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();ctx.strokeStyle='rgba(124,58,237,.85)';ctx.lineWidth=1.2/z;ctx.setLineDash([6/z,4/z]);ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();ctx.setLineDash([]);drawn++;}
  {const t88=name?('Fantasma: '+name+(drawn?' ('+drawn+' paredes)':'')+(miss?' — '+miss+' sem origem comum':'')):'Fantasma: não há pavimento abaixo deste';if(window.hud88)window.hud88.push({t:t88,c:'#6d28d9'});else{ctx.font='bold '+(13/z)+'px Arial';ctx.fillStyle='#6d28d9';ctx.textAlign='left';ctx.fillText(t88,o25.x+10/z+0,o25.y+18/z);}}}
 const o=originOf(pg);if(o){const R=10/z,Lx=46/z,a=angOf(o),ux=Math.cos(a),uy=-Math.sin(a);ctx.lineWidth=2/z;ctx.strokeStyle='#c81e1e';ctx.beginPath();ctx.arc(o.x,o.y,R,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(o.x-R*1.6,o.y);ctx.lineTo(o.x+R*1.6,o.y);ctx.moveTo(o.x,o.y-R*1.6);ctx.lineTo(o.x,o.y+R*1.6);ctx.stroke();
  const arrow=(dx,dy,col,lab)=>{const ex=o.x+dx*Lx,ey=o.y+dy*Lx;ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=2.2/z;ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(ex,ey);ctx.stroke();const h=8/z,px=-dy,py=dx;ctx.beginPath();ctx.moveTo(ex+dx*h,ey+dy*h);ctx.lineTo(ex+px*h*.6,ey+py*h*.6);ctx.lineTo(ex-px*h*.6,ey-py*h*.6);ctx.closePath();ctx.fill();ctx.font='bold '+(12/z)+'px Arial';ctx.fillText(lab,ex+dx*14/z-4/z,ey+dy*14/z+4/z);};
  arrow(ux,uy,'#c81e1e','X');arrow(uy,-ux,'#15803d','Y');ctx.fillStyle='#c81e1e';ctx.font='bold '+(12/z)+'px Arial';ctx.fillText('ORIGEM',o.x+R+4/z,o.y+R+14/z);}
 if(pick?.stage===2&&state.origins74[pg]){}ctx.restore();}catch(e){console.error('V74 planta',e);}return r;};

// ---------- 3. Painel na coluna de ferramentas
function refreshPanel(){const n=$('orig74note');if(n)n.textContent=originText(curPage());const g=$('ghost74btn');if(g){g.classList.toggle('on74',ghost);g.querySelector('.t74').textContent=ghost?'Fantasma do pavimento de baixo: ligado':'Fantasma do pavimento de baixo';}}
{const side=$('tools62');if(side){const g=document.createElement('details');g.className='grp62 grp74';g.open=true;g.innerHTML='<summary>Pavimentos · origem e 3D</summary>';const body=document.createElement('div');body.className='grpBody62';
 const btn=(id,ico,txt,fn,cls='secondary',title='')=>{const b=document.createElement('button');b.type='button';b.id=id;b.className=cls;b.title=title;b.innerHTML='<span class="ico62">'+ico+'</span><span class="t74">'+txt+'</span>';b.onclick=fn;body.append(b);return b;};
 btn('orig74btn','⌖','Marcar ponto de origem',startPick,'secondary','Clique no mesmo ponto físico em cada planta (canto externo, poço do elevador...). O 2º clique, opcional, dá a direção do eixo X.');
 btn('dxf00btn74','⊙','Usar origem 0,0 do DXF',useDxf00,'secondary','Para quando todos os pavimentos foram desenhados no mesmo sistema de coordenadas do CAD.');
 btn('origDel74','✕','Apagar origem desta planta',clearOrigin);
 btn('ghost74btn','◐','Fantasma do pavimento de baixo',()=>{ghost=!ghost;LS('ghost74',ghost?'1':'0');refreshPanel();drawPlan();});
 btn('v3d74btn','🧊','Ver em 3D',()=>open3D(),'');
 btn('ifc74btn','📥','Importar IFC',()=>$('ifcFile74').click(),'secondary','Lê pavimentos, paredes, portas e janelas de um modelo IFC (Revit, ArchiCAD, etc.).');
 const n=document.createElement('p');n.id='orig74note';n.className='note';n.style.cssText='margin:2px 0 0;font-size:11.5px';body.append(n);
 g.append(body);const after=side.querySelector('.lvlGrp68');if(after)after.after(g);else side.prepend(g);}}
{const f=document.createElement('input');f.type='file';f.id='ifcFile74';f.accept='.ifc';f.style.display='none';document.body.append(f);f.onchange=async()=>{const file=f.files?.[0];f.value='';if(file)await importIFC(file);};}
// o campo "Planta PDF ou DXF" também aceita IFC
{const inp=$('pdf');if(inp){inp.accept=(inp.accept||'')+',.ifc';inp.addEventListener('change',async e=>{const file=inp.files?.[0];if(!file||!/\.ifc$/i.test(file.name))return;e.stopImmediatePropagation();inp.value='';await importIFC(file);},true);const lab=inp.closest('label');if(lab&&lab.firstChild?.nodeType===3)lab.firstChild.textContent='Planta PDF, DXF ou IFC';}}
$('page')?.addEventListener('change',()=>setTimeout(refreshPanel,50));
const rw=renderWalls;renderWalls=function(...a){const r=rw.apply(this,a);try{refreshPanel();}catch{}return r;};
for(const id of ['newProject','example']){const b=$(id);if(!b)continue;const old=b.onclick;b.onclick=function(...a){const r=old?.apply(this,a);state.origins74={};setTimeout(refreshPanel,0);return r;};}
{const r=$('restore');if(r){const old=r.onchange;r.onchange=async function(...a){const res=await old?.apply(this,a);try{state.origins74??={};refreshPanel();}catch{}return res;};}}

// ---------- 4. Vista 3D (WebGL, sem bibliotecas)
let v3=null;const opt3=Object.assign({slab:true,roof:true,t:10,blocks:false,explode:0,flag:true,color:'pos',hide:{},upTo:'all',close:120,ends:true},(()=>{try{return JSON.parse(LS('v3d74')||'{}');}catch{return {};}})());
const save3=()=>LS('v3d74',JSON.stringify({...opt3,hide:{}}));
function invalidate3D(){if(v3?.open)build3D();}
window.invalidate3D74=invalidate3D;
// matrizes
const M4={persp(f,a,n,fa){const t=1/Math.tan(f/2);return [t/a,0,0,0,0,t,0,0,0,0,(fa+n)/(n-fa),-1,0,0,2*fa*n/(n-fa),0];},
 look(e,c,u){let z=[e[0]-c[0],e[1]-c[1],e[2]-c[2]],l=Math.hypot(...z);z=z.map(v=>v/l);let x=[u[1]*z[2]-u[2]*z[1],u[2]*z[0]-u[0]*z[2],u[0]*z[1]-u[1]*z[0]];l=Math.hypot(...x)||1;x=x.map(v=>v/l);const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
  return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-(x[0]*e[0]+x[1]*e[1]+x[2]*e[2]),-(y[0]*e[0]+y[1]*e[1]+y[2]*e[2]),-(z[0]*e[0]+z[1]*e[1]+z[2]*e[2]),1];},
 mul(a,b){const o=new Array(16).fill(0);for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)o[j*4+i]+=a[k*4+i]*b[j*4+k];return o;}};
const hex=h=>{const n=parseInt(h.slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];};
const COL={Externa:hex('#c98455'),Interna:hex('#e2cfa6'),Mista:hex('#cfa274'),none:hex('#bdbdbd'),flag:hex('#d93a2b'),slab:hex('#aeb9c4'),roof:hex('#9aa7b4'),conf:hex('#4f9d7a'),pend:hex('#e0a040')};
function blockColor(code){if(/^U/.test(code))return hex('#79b47f');if(/^J/.test(code))return hex('#5f9f8f');const n=N(String(code).replace(/\D.*$/,'').replace(/^\D+/,''))||N((String(code).match(/\d+/)||[0])[0]);const cut=/_C/.test(code);const base={39:'#e08a4a',29:'#8ea6d8',19:'#e9c55b',14:'#7fb3d5',34:'#d28fb5',44:'#b28ad8',54:'#9a7fc9',5:'#a8d0e6'}[n]||'#d0a070';const c=hex(base);return cut?c.map(v=>v*.75+.25):c;}
function geomBuilder(){const T=[],Lz=[];
 const tri=(a,b,c,col)=>{const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];for(const p of [a,b,c])T.push(p[0],p[1],p[2],n[0],n[1],n[2],col[0],col[1],col[2]);};
 const quad=(a,b,c,d,col)=>{tri(a,b,c,col);tri(a,c,d,col);};
 const line=(a,b)=>{Lz.push(a[0],a[1],a[2],b[0],b[1],b[2]);};
 // caixa orientada: origem O, eixo u (unitário 2D), espessura t, s0..s1, z0..z1
 function box(O,u,t,s0,s1,z0,z1,col,edges){const n=[-u[1],u[0]],h=t/2,P=(s,q,z)=>[O[0]+u[0]*s+n[0]*q,O[1]+u[1]*s+n[1]*q,z];
  const a=P(s0,-h,z0),b=P(s1,-h,z0),c=P(s1,h,z0),d=P(s0,h,z0),e=P(s0,-h,z1),f=P(s1,-h,z1),g=P(s1,h,z1),k=P(s0,h,z1);
  quad(e,f,g,k,col);quad(a,d,c,b,col);quad(a,b,f,e,col);quad(c,d,k,g,col);quad(b,c,g,f,col);quad(d,a,e,k,col);
  if(edges){line(a,b);line(b,c);line(c,d);line(d,a);line(e,f);line(f,g);line(g,k);line(k,e);line(a,e);line(b,f);line(c,g);line(d,k);}}
 return {T,Lz,tri,quad,line,box};}
function levelsData(){const L=L68();const keys=L?.levelKeys?L.levelKeys():['0.000|'];const W=allWalls().filter(w=>w.line);
 return keys.map(k=>{const walls=W.filter(w=>(L?L.keyOf(N(w.page||1)):'0.000|')===k);let rep=1;for(const w of walls)rep=Math.max(rep,N((state.levels53||[]).find(l=>String(l.page)===String(w.page||1))?.rep)||1);
  const hs={};walls.forEach(w=>{const h=Math.round(N(w.height)||0);hs[h]=(hs[h]||0)+1;});const H=N(Object.entries(hs).sort((a,b)=>b[1]-a[1])[0]?.[0])||N($('height')?.value)||280;
  return {key:k,name:L?L.nameOf(k):'Nível',z:(Number(k.split('|')[0])||0)*100,walls,rep,H};}).filter(l=>l.walls.length);}
function wallWorld(w){const pg=N(w.page||1),A=world(pg,w.line[0]),B=world(pg,w.line[1]),L=Math.hypot(B.x-A.x,B.y-A.y)||1;return {A,B,L,u:[(B.x-A.x)/L,(B.y-A.y)/L],pg};}
function segDist(P,A,B){const dx=B.x-A.x,dy=B.y-A.y,l2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((P.x-A.x)*dx+(P.y-A.y)*dy)/l2));return Math.hypot(P.x-A.x-t*dx,P.y-A.y-t*dy);}
// laje: contorno pelas faces externas das paredes (grade de 5 cm, preenchimento por fora)
function slabCells(walls){const ww=walls.map(wallWorld);let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;ww.forEach(g=>{for(const p of [g.A,g.B]){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}});
 {const pad=60+Math.max(0,N(opt3.close)||0)/2+10;minX-=pad;minY-=pad;maxX+=pad;maxY+=pad;}const C=Math.max(2.5,Math.ceil(Math.max(maxX-minX,maxY-minY)/1600*2)/2);const nx=Math.ceil((maxX-minX)/C),ny=Math.ceil((maxY-minY)/C);if(nx*ny>4e6)return null;const grid=new Uint8Array(nx*ny);
 ww.forEach((g,i)=>{const t=N(walls[i].width)||14,h=t/2+.3,ext=t/2+.3,n=[-g.u[1],g.u[0]];const pts=[[-ext,-h],[g.L+ext,-h],[g.L+ext,h],[-ext,h]].map(([s,q])=>({x:g.A.x+g.u[0]*s+n[0]*q,y:g.A.y+g.u[1]*s+n[1]*q}));
  const x0=Math.max(0,Math.floor((Math.min(...pts.map(p=>p.x))-minX)/C)),x1=Math.min(nx-1,Math.ceil((Math.max(...pts.map(p=>p.x))-minX)/C)),y0=Math.max(0,Math.floor((Math.min(...pts.map(p=>p.y))-minY)/C)),y1=Math.min(ny-1,Math.ceil((Math.max(...pts.map(p=>p.y))-minY)/C));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const px=minX+(x+.5)*C-g.A.x,py=minY+(y+.5)*C-g.A.y,s=px*g.u[0]+py*g.u[1],q=px*n[0]+py*n[1];if(s>=-ext&&s<=g.L+ext&&Math.abs(q)<=h)grid[y*nx+x]=1;}});
 // fora = alcançável pela borda sem atravessar parede
 const flood=g2=>{const out=new Uint8Array(nx*ny),st=[];const push=(x,y)=>{const i=y*nx+x;if(!g2[i]&&!out[i]){out[i]=1;st.push(i);}};for(let x=0;x<nx;x++){push(x,0);push(x,ny-1);}for(let y=0;y<ny;y++){push(0,y);push(nx-1,y);}
  while(st.length){const i=st.pop(),x=i%nx,y=(i-x)/nx;if(x>0)push(x-1,y);if(x<nx-1)push(x+1,y);if(y>0)push(x,y-1);if(y<ny-1)push(x,y+1);}return out;};
 // dilatação quadrada (raio R células), em duas passadas
 const dil=(m,R)=>{const a=new Uint8Array(nx*ny),b=new Uint8Array(nx*ny);for(let y=0;y<ny;y++){let c=0;const o=y*nx;for(let x=-R;x<nx;x++){const ad=x+R;if(ad<nx&&m[o+ad])c++;const rm=x-R-1;if(rm>=0&&m[o+rm])c--;if(x>=0)a[o+x]=c>0?1:0;}}
  for(let x=0;x<nx;x++){let c=0;for(let y=-R;y<ny;y++){const ad=y+R;if(ad<ny&&a[ad*nx+x])c++;const rm=y-R-1;if(rm>=0&&a[rm*nx+x])c--;if(y>=0)b[y*nx+x]=c>0?1:0;}}return b;};
 const out0=flood(grid);let out=out0,closed=0;const R=Math.round((N(opt3.close)||0)/2/C);
 if(R>0){const o1=flood(dil(grid,R)),o2=dil(o1,R);out=new Uint8Array(nx*ny);let in0=0,in1=0;for(let i=0;i<nx*ny;i++){out[i]=o2[i]&&!grid[i]?1:0;if(!out0[i])in0++;if(!out[i])in1++;}closed=Math.max(0,in1-in0)*C*C/1e4;}
 return {C,nx,ny,minX,minY,in:i=>!out[i],closed};}
function addSlab(G,S,z0,z1,col){if(!S)return 0;const {C,nx,ny,minX,minY}=S;let area=0;
 for(let y=0;y<ny;y++){let x=0;while(x<nx){if(!S.in(y*nx+x)){x++;continue;}let x2=x;while(x2+1<nx&&S.in(y*nx+x2+1))x2++;const X0=minX+x*C,X1=minX+(x2+1)*C,Y0=minY+y*C,Y1=Y0+C;area+=(X1-X0)*C;
   G.quad([X0,Y0,z1],[X1,Y0,z1],[X1,Y1,z1],[X0,Y1,z1],col);G.quad([X0,Y0,z0],[X0,Y1,z0],[X1,Y1,z0],[X1,Y0,z0],col);x=x2+1;}}
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){if(!S.in(y*nx+x))continue;const X0=minX+x*C,X1=X0+C,Y0=minY+y*C,Y1=Y0+C;
  if(x===0||!S.in(y*nx+x-1)){G.quad([X0,Y1,z0],[X0,Y0,z0],[X0,Y0,z1],[X0,Y1,z1],col);G.line([X0,Y0,z1],[X0,Y1,z1]);G.line([X0,Y0,z0],[X0,Y1,z0]);}
  if(x===nx-1||!S.in(y*nx+x+1)){G.quad([X1,Y0,z0],[X1,Y1,z0],[X1,Y1,z1],[X1,Y0,z1],col);G.line([X1,Y0,z1],[X1,Y1,z1]);G.line([X1,Y0,z0],[X1,Y1,z0]);}
  if(y===0||!S.in((y-1)*nx+x)){G.quad([X0,Y0,z0],[X1,Y0,z0],[X1,Y0,z1],[X0,Y0,z1],col);G.line([X0,Y0,z1],[X1,Y0,z1]);G.line([X0,Y0,z0],[X1,Y0,z0]);}
  if(y===ny-1||!S.in((y+1)*nx+x)){G.quad([X1,Y1,z0],[X0,Y1,z0],[X0,Y1,z1],[X1,Y1,z1],col);G.line([X0,Y1,z1],[X1,Y1,z1]);G.line([X0,Y1,z0],[X1,Y1,z0]);}}
 return area/1e4;}
// paredes sem parede embaixo
function unsupported(walls,below){const bw=below.map(w=>({w,g:wallWorld(w)}));const res=new Set();
 for(const w of walls){const g=wallWorld(w);if(bw.length&&!aligned(g.pg,bw[0].g.pg))continue;let n=0,ok=0;for(let s=5;s<g.L-4;s+=10){n++;const P={x:g.A.x+g.u[0]*s,y:g.A.y+g.u[1]*s};if(bw.some(b=>segDist(P,b.g.A,b.g.B)<=(N(b.w.width)||14)/2+3))ok++;}if(n&&ok/n<.9)res.add(w);}
 return res;}
function wallBoxes(G,w,z0,col,blocks,ends){const g=wallWorld(w),t=N(w.width)||14,H=N(w.height)||280,O=[g.A.x,g.A.y],L=g.L,e0=N(ends?.[0])||0,e1=N(ends?.[1])||0;
 const m=blocks?L68()?.resultOf?.(w):null;
 if(m?.rows?.length&&!m.errors?.length){let k=0;for(const row of m.rows)for(const p of row.pieces||[]){if(p.fill)continue;const pw=N(p.width)||t;G.box(O,g.u,pw-.3,N(p.x)+.5,N(p.x)+N(p.length)-.5,z0+N(p.y)+.5,z0+N(p.y)+N(p.height)-.5,blockColor(p.code),false);k++;}if(k)return;}
 const ops=(w.openings||[]).map(o=>({s0:N(o.start),s1:N(o.start)+N(o.width),b:N(o.bottom)||0,t:(N(o.bottom)||0)+N(o.height)})).filter(o=>o.s1>o.s0);
 const xs=[...new Set([-e0,L+e1,...ops.flatMap(o=>[o.s0,o.s1])])].filter(v=>v>=-e0&&v<=L+e1).sort((a,b)=>a-b);
 for(let i=0;i+1<xs.length;i++){const a=xs[i],b=xs[i+1];if(b-a<.01)continue;const mid=(a+b)/2,cut=ops.filter(o=>o.s0<=mid&&o.s1>=mid).sort((p,q)=>p.b-q.b);let z=0;for(const o of cut){if(o.b>z+.01)G.box(O,g.u,t,a,b,z0+z,z0+o.b,col,true);z=Math.max(z,o.t);}if(H>z+.01)G.box(O,g.u,t,a,b,z0+z,z0+H,col,true);}}
function endsOf(walls){const gs=walls.map(wallWorld);return gs.map((g,i)=>[g.A,g.B].map(P=>{let e=0;gs.forEach((h,j)=>{if(j===i)return;const t=N(walls[j].width)||14;if(segDist(P,h.A,h.B)>t/2+3)return;const corner=Math.min(Math.hypot(P.x-h.A.x,P.y-h.A.y),Math.hypot(P.x-h.B.x,P.y-h.B.y))<=t/2+3;e=Math.max(e,corner?t/2:t/2-.8);});return e;}));}
function freeEnds(walls){const gs=walls.map(wallWorld),res=[];gs.forEach((g,i)=>[g.A,g.B].forEach(P=>{const near=gs.some((h,j)=>j!==i&&segDist(P,h.A,h.B)<=(N(walls[j].width)||14)/2+3);if(!near)res.push({P,w:walls[i]});}));return res;}
// V100 — 3D com a mesma laje da planta de lajes: aberturas (escada, alçapão), beirais, lajes fechadas por viga, vão aberto; vigas em azul
function slab3D(R,li,k,rep,isTop){if(!R?.slabs)return undefined;let sl=null;if(k<rep-1)sl=R.slabs.find(s=>s.sup===li&&s.reps?.includes(k+2))||R.slabs.find(s=>s.sup===li&&s.times);else if(!isTop)sl=R.slabs.find(s=>s.kind==='piso'&&s.lvl===li+1&&!s.times);else sl=R.slabs.find(s=>s.kind==='cob');
 const c=sl?.ctx;if(!c)return null;return {S:{C:c.s0,nx:c.nx,ny:c.ny,minX:c.X0,minY:c.Y0,in:i=>!!c.inside[i]&&!(c.comp[i]>=0&&c.propOf(c.comp[i]).type==='sem')},items:c.items||[]};}
function beams3D(G,items,zTop){for(const it of items){if(it.kind!=='beam')continue;if(it.sub==='ref'){let P;try{P=window.beamEnds97?.(it);}catch{}P=P||(it.pts||[]).map(Q=>world(N(it.page),Q));if(P.length<2)continue;const L=Math.hypot(P[1].x-P[0].x,P[1].y-P[0].y);if(L<1)continue;const u=[(P[1].x-P[0].x)/L,(P[1].y-P[0].y)/L],t=N(opt3.t)||10;G.box([P[0].x,P[0].y],u,(N(it.ref?.b)||14)+1,0,L,zTop-t-1.5,zTop+1.5,hex('#ea580c'),true);continue;}if(it.sub!=='viga')continue;let P;try{P=window.beamEnds97?.(it);}catch{}P=P||(it.pts||[]).map(Q=>world(N(it.page),Q));if(P.length<2)continue;const L=Math.hypot(P[1].x-P[0].x,P[1].y-P[0].y);if(L<1)continue;const u=[(P[1].x-P[0].x)/L,(P[1].y-P[0].y)/L],h=N(it.viga?.h)||40;G.box([P[0].x,P[0].y],u,N(it.viga?.b)||15,0,L,zTop-h,zTop,hex('#2563eb'),true);}}
function build3D(){if(!v3)return;const G=geomBuilder(),lv=levelsData();const info=[];let R100=null;try{R100=window.loads77?.compute?.({})||null;}catch(e){console.error('V100 3D lajes',e);}let flagged=0,area=0,noOrig=new Set(),closed=0,loose=0;const gaps=[];
 const pgs=new Set(lv.flatMap(l=>l.walls.map(w=>N(w.page||1))));if(pgs.size>1)for(const p of pgs)if(!originOf(p))noOrig.add(p);
 let floor=0;const upIdx=opt3.upTo==='all'?Infinity:lv.findIndex(l=>l.key===opt3.upTo);
 lv.forEach((l,li)=>{if(li>upIdx)return;const hidden=opt3.hide[l.key];const flags=opt3.flag&&li>0?unsupported(l.walls,lv[li-1].walls):new Set();const ends=endsOf(l.walls);const S=opt3.slab?slabCells(l.walls):null;if(S?.closed>.05)closed+=S.closed;const fe=freeEnds(l.walls);loose+=fe.length;
  if(li>0){const p=lv[li-1],exp=p.z+p.rep*(p.H+opt3.t),d=l.z-exp;if(Math.abs(d)>1.5)gaps.push({from:p.name,to:l.name,d});}
  for(let k=0;k<l.rep;k++){const z0=l.z+k*(l.H+opt3.t)+floor*opt3.explode;floor++;if(hidden)continue;
   if(opt3.ends)for(const e of fe){const g=wallWorld(e.w);G.box([e.P.x,e.P.y],g.u,8,-4,4,z0,z0+l.H+opt3.t+25,hex('#f59e0b'),true);}
   l.walls.forEach((w,i)=>{const isF=k===0&&flags.has(w);if(isF)flagged++;const col=isF?COL.flag:opt3.color==='conf'?(w.confirmed?COL.conf:COL.pend):(COL[w.location]||COL.none);wallBoxes(G,w,z0+(N(w.base87)||0),col,opt3.blocks&&!isF,ends[i]);});
   const top=li===lv.length-1&&k===l.rep-1;if(opt3.slab&&(!top||opt3.roof)){const tops87=[...new Set(l.walls.map(w=>N(w.top87)||0))];if(tops87.length>1){for(const d of tops87){const ws=l.walls.filter(w=>(N(w.top87)||0)===d||((N(w.base87)||0)<=d&&d<(N(w.top87)||0)));const S2=slabCells(ws);if(!S2)continue;const a=addSlab(G,S2,z0+l.H+d,z0+l.H+d+opt3.t,top?COL.roof:COL.slab);if(k===0)area+=a*l.rep;}}else{const sd=R100?slab3D(R100,li,k,l.rep,li===lv.length-1):undefined;const a=addSlab(G,sd===undefined?S:sd?.S||null,z0+l.H,z0+l.H+opt3.t,top?COL.roof:COL.slab);if(sd)beams3D(G,sd.items,z0+l.H+opt3.t);if(k===0)area+=a*l.rep;}}}
  info.push(l);});
 v3.upload(G);v3.stats={levels:lv,flagged,area,noOrig,closed,loose,gaps};render3DInfo();v3.draw();}
function render3DInfo(){const box=$('v3dInfo74');if(!box||!v3?.stats)return;const {levels,flagged,area,noOrig,closed,loose,gaps}=v3.stats;
 const lv=levels.map(l=>`<label class="lv74"><input type="checkbox" data-k="${esc(l.key)}" ${opt3.hide[l.key]?'':'checked'}> ${esc(l.name)}${l.rep>1?' × '+l.rep:''} <span class="note">· ${l.walls.length} paredes · pé-direito ${f1(l.H)} cm</span></label>`).join('');
 box.innerHTML=`<h4>Níveis</h4>${lv||'<p class="note">Nenhuma parede com posição na planta.</p>'}
 <label>Mostrar até<select id="upTo74"><option value="all">Todos</option>${levels.map(l=>`<option value="${esc(l.key)}" ${opt3.upTo===l.key?'selected':''}>${esc(l.name)}</option>`).join('')}</select></label>
 ${flagged?`<p class="warn74">⚠ ${flagged} parede(s) em vermelho: sem parede embaixo em pelo menos 10% do comprimento.</p>`:(opt3.flag&&levels.length>1?'<p class="ok74">✔ Todas as paredes de cima têm parede embaixo.</p>':'')}
 ${noOrig.size?`<p class="warn74">⚠ Planta(s) sem ponto de origem: os pavimentos podem estar desalinhados. Marque a origem em cada planta (⌖ na coluna de ferramentas).</p>`:''}
 ${gaps.length?`<p class="warn74">⚠ Espaço entre pavimentos diferente de pé-direito + laje: ${gaps.map(g=>esc(g.to)+(g.d>0?' está '+f1(g.d)+' cm acima':' está '+f1(-g.d)+' cm abaixo')+' do topo da laje de '+esc(g.from)).join('; ')}. A cota de cada nível vem do painel “Níveis do projeto”.<br><button type="button" id="fixLv74" class="secondary" style="margin-top:5px">Ajustar cotas: pé-direito + laje</button></p>`:''}
 ${opt3.explode>0?`<p class="note">Pavimentos afastados ${f1(opt3.explode)} cm pelo controle “Separar pavimentos” (só na visualização).</p>`:''}
 ${closed>0?`<p class="warn74">⚠ Contorno da laje com vãos entre paredes (pontas que não se encontram). A laje foi fechada automaticamente (${f1(closed)} m²). Confira os encontros: use “Estender parede” ou “Unir paredes” — isso também afeta a amarração.</p>`:''}
 ${loose?`<p class="note">${loose} ponta(s) de parede solta(s)${opt3.ends?' marcadas em laranja':''}. Pontas soltas são normais em paredes que terminam livres; nos cantos indicam parede que não chega no encontro.</p>`:''}
 ${opt3.slab&&area?`<p class="note">Área de laje (projeção, todos os pavimentos): ${f1(area)} m²</p>`:''}`;
 $('fixLv74')?.addEventListener('click',fixLevels);
 box.querySelectorAll('[data-k]').forEach(c=>c.onchange=()=>{opt3.hide[c.dataset.k]=!c.checked;build3D();});$('upTo74').onchange=e=>{opt3.upTo=e.target.value;build3D();};}
function makeGL(canvas){const gl=canvas.getContext('webgl',{antialias:true,preserveDrawingBuffer:true});if(!gl)throw Error('Este navegador não liberou o WebGL (3D). Atualize o navegador ou ative a aceleração de hardware.');
 const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(o));return o;};
 const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,'attribute vec3 p;attribute vec3 n;attribute vec3 c;uniform mat4 M;uniform vec3 L;uniform float F;varying vec3 v;void main(){gl_Position=M*vec4(p,1.);vec3 nn=normalize(n+vec3(1e-6));float d=abs(dot(nn,L));v=mix(c*(.48+.52*d),c,F);}'));
 gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,'precision mediump float;varying vec3 v;void main(){gl_FragColor=vec4(v,1.);}'));gl.linkProgram(pr);gl.useProgram(pr);
 const loc={p:gl.getAttribLocation(pr,'p'),n:gl.getAttribLocation(pr,'n'),c:gl.getAttribLocation(pr,'c'),M:gl.getUniformLocation(pr,'M'),L:gl.getUniformLocation(pr,'L'),F:gl.getUniformLocation(pr,'F')};
 const tb=gl.createBuffer(),lb=gl.createBuffer();let nt=0,nl=0,bb=null;gl.enable(gl.DEPTH_TEST);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1,1);
 const cam={yaw:-.75,pitch:.55,dist:1500,tx:0,ty:0,tz:0};
 const o={gl,cam,open:true,upload(G){gl.bindBuffer(gl.ARRAY_BUFFER,tb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(G.T),gl.STATIC_DRAW);nt=G.T.length/9;const Ls=[];for(let i=0;i<G.Lz.length;i+=3)Ls.push(G.Lz[i],G.Lz[i+1],G.Lz[i+2],0,0,1,.22,.24,.27);gl.bindBuffer(gl.ARRAY_BUFFER,lb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(Ls),gl.STATIC_DRAW);nl=Ls.length/9;
   let mn=[Infinity,Infinity,Infinity],mx=[-Infinity,-Infinity,-Infinity];for(let i=0;i<G.T.length;i+=9)for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],G.T[i+k]);mx[k]=Math.max(mx[k],G.T[i+k]);}const first=!bb;bb=nt?{mn,mx}:null;if(first&&bb)o.reset();},
  reset(view){if(!bb)return;cam.tx=(bb.mn[0]+bb.mx[0])/2;cam.ty=(bb.mn[1]+bb.mx[1])/2;cam.tz=(bb.mn[2]+bb.mx[2])/2;cam.dist=Math.hypot(bb.mx[0]-bb.mn[0],bb.mx[1]-bb.mn[1],bb.mx[2]-bb.mn[2])*1.25+100;if(view==='top'){cam.pitch=1.5;cam.yaw=-Math.PI/2;}else if(view==='front'){cam.pitch=.06;cam.yaw=-Math.PI/2;}else if(view==='side'){cam.pitch=.06;cam.yaw=0;}else{cam.pitch=.55;cam.yaw=-.75;}o.draw();},
  draw(){const W=canvas.clientWidth,H=canvas.clientHeight,dpr=Math.min(2,devicePixelRatio||1);if(canvas.width!==Math.round(W*dpr)||canvas.height!==Math.round(H*dpr)){canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);}gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.93,.95,.97,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);if(!nt)return;
   const cp=Math.cos(cam.pitch),e=[cam.tx+cam.dist*cp*Math.cos(cam.yaw),cam.ty+cam.dist*cp*Math.sin(cam.yaw),cam.tz+cam.dist*Math.sin(cam.pitch)];const P=M4.persp(.8,W/Math.max(1,H),cam.dist/200,cam.dist*20),V=M4.look(e,[cam.tx,cam.ty,cam.tz],Math.abs(cam.pitch)>1.45?[Math.cos(cam.yaw+Math.PI),Math.sin(cam.yaw+Math.PI),0]:[0,0,1]);gl.uniformMatrix4fv(loc.M,false,new Float32Array(M4.mul(P,V)));
   const l=[.35,-.55,.76],ll=Math.hypot(...l);gl.uniform3f(loc.L,l[0]/ll,l[1]/ll,l[2]/ll);
   const bind=b=>{gl.bindBuffer(gl.ARRAY_BUFFER,b);for(const[k,off]of [['p',0],['n',3],['c',6]]){gl.enableVertexAttribArray(loc[k]);gl.vertexAttribPointer(loc[k],3,gl.FLOAT,false,36,off*4);}};
   bind(tb);gl.uniform1f(loc.F,0);gl.drawArrays(gl.TRIANGLES,0,nt);if(nl){bind(lb);gl.uniform1f(loc.F,1);gl.drawArrays(gl.LINES,0,nl);}}};
 return o;}
function open3D(){let d=$('v3d74');if(!d){d=document.createElement('div');d.id='v3d74';d.className='noPrint';document.body.append(d);}
 d.innerHTML=`<div class="bar74"><b>Vista 3D · paredes e lajes</b><span class="note">Arraste para girar · botão direito (ou Shift) para mover · rodinha para aproximar · duplo clique centraliza</span><span class="sp74"></span><button type="button" data-v="persp" class="secondary">Perspectiva</button><button type="button" data-v="top" class="secondary">Topo</button><button type="button" data-v="front" class="secondary">Frente</button><button type="button" data-v="side" class="secondary">Lateral</button><button type="button" id="png74" class="secondary">Baixar imagem</button><button type="button" id="close74">Fechar</button></div>
 <div class="body74"><aside class="side74"><h4>Exibição</h4>
 <label class="ck74"><input type="checkbox" id="slab74" ${opt3.slab?'checked':''}> Lajes entre pavimentos (o piso do térreo não leva laje)</label>
 <label class="ck74"><input type="checkbox" id="roof74" ${opt3.roof?'checked':''}> Laje de cobertura no último pavimento</label>
 <label>Espessura da laje (cm)<input type="number" id="t74" min="4" max="40" step="1" value="${opt3.t}"></label>
 <label class="ck74"><input type="checkbox" id="blk74" ${opt3.blocks?'checked':''}> Mostrar blocos (fiada por fiada, das paredes já moduladas)</label>
 <label class="ck74"><input type="checkbox" id="flag74" ${opt3.flag?'checked':''}> Destacar paredes sem parede embaixo</label>
 <label>Fechar vãos entre paredes na laje até (cm)<input type="number" id="gapClose74" min="0" max="300" step="10" value="${opt3.close}"></label>
 <label class="ck74"><input type="checkbox" id="ends74" ${opt3.ends?'checked':''}> Marcar pontas de parede soltas (laranja)</label>
 <label>Cores<select id="col74"><option value="pos" ${opt3.color==='pos'?'selected':''}>Externa / interna</option><option value="conf" ${opt3.color==='conf'?'selected':''}>Conferida / pendente</option></select></label>
 <label>Separar pavimentos (explodir)<input type="range" id="exp74" min="0" max="200" step="10" value="${opt3.explode}"></label>
 <div id="v3dInfo74"></div>
 <p class="note leg74"><span style="background:#c98455"></span>Externa <span style="background:#e2cfa6"></span>Interna <span style="background:#aeb9c4"></span>Laje <span style="background:#d93a2b"></span>Sem parede embaixo</p></aside><div class="cv74"><canvas id="cv74"></canvas><p id="err74" class="warn74" style="display:none"></p></div></div>`;
 d.style.display='flex';document.body.classList.add('v3d74on');const cv=$('cv74');
 try{v3=makeGL(cv);}catch(e){$('err74').style.display='block';$('err74').textContent=e.message;return;}
 const ch=(id,k,f=x=>x)=>{$(id).onchange=e=>{opt3[k]=f(e.target.type==='checkbox'?e.target.checked:e.target.value);save3();build3D();};};
 ch('slab74','slab');ch('roof74','roof');ch('t74','t',v=>Math.max(4,Math.min(40,N(v)||10)));ch('blk74','blocks');ch('flag74','flag');ch('gapClose74','close',v=>Math.max(0,Math.min(300,N(v)||0)));ch('ends74','ends');ch('col74','color');$('exp74').oninput=e=>{opt3.explode=N(e.target.value);build3D();};$('exp74').onchange=save3;
 d.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>v3.reset(b.dataset.v));
 $('close74').onclick=close3D;$('png74').onclick=()=>{v3.draw();const a=document.createElement('a');a.href=cv.toDataURL('image/png');a.download='Vista3D_Modulacao_Engenhar.png';document.body.append(a);a.click();a.remove();};
 let drag=null;cv.oncontextmenu=e=>e.preventDefault();
 cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,pan:e.button===2||e.shiftKey||e.button===1};cv.setPointerCapture(e.pointerId);});
 cv.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;const c=v3.cam;
  if(drag.pan){const k=c.dist/cv.clientHeight*.8,sy=Math.sin(c.yaw),cy=Math.cos(c.yaw),sp=Math.sin(c.pitch),cp=Math.cos(c.pitch),r=[-sy,cy,0],up=[-sp*cy,-sp*sy,cp];c.tx+=(-r[0]*dx+up[0]*dy)*k;c.ty+=(-r[1]*dx+up[1]*dy)*k;c.tz+=(up[2]*dy)*k;}else{c.yaw-=dx*.006;c.pitch=Math.max(-.2,Math.min(1.55,c.pitch+dy*.006));}v3.draw();});
 cv.addEventListener('pointerup',()=>{drag=null;});cv.addEventListener('wheel',e=>{e.preventDefault();const c=v3.cam,s=Math.max(50,c.dist*Math.pow(1.0015,e.deltaY))/c.dist;
  // V108.8 — zoom no ponto do cursor (como no AutoCAD): o ponto sob o cursor fica parado e o alvo anda até ele
  try{const r0=cv.getBoundingClientRect(),W=r0.width||1,H=r0.height||1,nx=2*(e.clientX-r0.left)/W-1,ny=1-2*(e.clientY-r0.top)/H,cp=Math.cos(c.pitch),f=[-cp*Math.cos(c.yaw),-cp*Math.sin(c.yaw),-Math.sin(c.pitch)];
   let rt=[f[1]*1-f[2]*0,f[2]*0-f[0]*1,0];const rl=Math.hypot(rt[0],rt[1])||1;rt=[rt[0]/rl,rt[1]/rl,0];const up=[rt[1]*f[2]-rt[2]*f[1],rt[2]*f[0]-rt[0]*f[2],rt[0]*f[1]-rt[1]*f[0]];
   const th=Math.tan(.4),ax=nx*th*(W/H)*c.dist,ay=ny*th*c.dist,P=[c.tx+rt[0]*ax+up[0]*ay,c.ty+rt[1]*ax+up[1]*ay,c.tz+rt[2]*ax+up[2]*ay];
   c.tx=P[0]+(c.tx-P[0])*s;c.ty=P[1]+(c.ty-P[1])*s;c.tz=P[2]+(c.tz-P[2])*s;}catch{}
  c.dist*=s;v3.draw();},{passive:false});cv.addEventListener('dblclick',()=>v3.reset());
 window.addEventListener('resize',onResize);build3D();}
const onResize=()=>{if(v3?.open)v3.draw();};
function close3D(){const d=$('v3d74');if(d)d.style.display='none';document.body.classList.remove('v3d74on');if(v3)v3.open=false;window.removeEventListener('resize',onResize);}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&v3?.open)close3D();});
window.open3D74=open3D;
function fixLevels(){const lv=levelsData();if(lv.length<2)return;const L=L68();let prev=null;const changes=[];
 for(const l of lv){if(prev){const want=Math.round(prev.z+prev.rep*(prev.H+opt3.t));if(Math.abs(want-l.z)>1.5){for(const row of state.levels53||[]){const pg=N(row.page);if(!L||L.keyOf(pg)!==l.key)continue;const m=String(row.text||'').trim().match(/^([+-]?\d+(?:[.,]\d+)?)\s*(.*)$/);const lab=m?m[2]:String(row.text||'');const nt=(want/100).toFixed(2).replace('.',',')+(lab?' '+lab:''),k=state.levels53.indexOf(row);if(window.editLevel53)window.editLevel53(k,'text',nt);else row.text=nt;}changes.push(l.name+' → '+(want/100).toFixed(2).replace('.',',')+' m');l.z=want;}}prev=l;}
 if(!changes.length){alert('As cotas já estão de acordo com pé-direito + laje.');return;}
 if(!confirm('Ajustar as cotas dos níveis para pé-direito + laje ('+f1(opt3.t)+' cm)?\n\n'+changes.join('\n')))return;
 try{L?.refresh?.();}catch{}renderWalls();build3D();$('planStatus').textContent='Cotas ajustadas: '+changes.join(' · ')+'.';}window.__v3d74=()=>v3;window.v3d74=()=>v3;window.opt3d74=opt3;window.build3D74=()=>{build3D();return v3?.stats;};window.geo74={slabCells,wallWorld,levelsData,segDist,opt3};

// ---------- 5. Importador de IFC
function parseIFC(text){const s=text,n=s.length;let i=s.indexOf('DATA;');if(i<0)throw Error('Arquivo IFC sem seção DATA.');i+=5;const E=new Map();
 const ws=()=>{while(i<n){const c=s.charCodeAt(i);if(c===32||c===10||c===13||c===9)i++;else if(c===47&&s[i+1]==='*'){const j=s.indexOf('*/',i+2);i=j<0?n:j+2;}else break;}};
 const str=()=>{i++;let o='';for(;;){const j=s.indexOf("'",i);if(j<0){i=n;break;}o+=s.slice(i,j);if(s[j+1]==="'"){o+="'";i=j+2;continue;}i=j+1;break;}return decode(o);};
 function val(){ws();const c=s[i];
  if(c==='#'){let j=i+1;while(j<n&&s.charCodeAt(j)>=48&&s.charCodeAt(j)<=57)j++;const r=+s.slice(i+1,j);i=j;return {r};}
  if(c==="'")return str();
  if(c==='$'||c==='*'){i++;return null;}
  if(c==='.'){const j=s.indexOf('.',i+1);const v=s.slice(i+1,j);i=j+1;return {e:v};}
  if(c==='('){i++;const a=[];ws();if(s[i]===')'){i++;return a;}for(;;){a.push(val());ws();if(s[i]===','){i++;continue;}if(s[i]===')'){i++;break;}throw Error('IFC inválido perto do caractere '+i);}return a;}
  if(c==='"'){const j=s.indexOf('"',i+1);i=j+1;return null;}
  if(/[-+0-9.]/.test(c)){let j=i+1;while(j<n&&/[0-9.eE+-]/.test(s[j]))j++;const v=+s.slice(i,j);i=j;return v;}
  if(/[A-Za-z]/.test(c)){let j=i;while(j<n&&/[A-Za-z0-9_]/.test(s[j]))j++;const t=s.slice(i,j).toUpperCase();i=j;ws();if(s[i]==='('){i++;const v=val();ws();while(s[i]===','){i++;val();ws();}if(s[i]===')')i++;return {t,v};}return {e:t};}
  throw Error('IFC inválido perto do caractere '+i);}
 for(;;){ws();if(i>=n)break;if(s.startsWith('ENDSEC',i))break;if(s[i]!=='#'){const j=s.indexOf(';',i);if(j<0)break;i=j+1;continue;}
  let j=i+1;while(j<n&&s.charCodeAt(j)>=48&&s.charCodeAt(j)<=57)j++;const id=+s.slice(i+1,j);i=j;ws();if(s[i]!=='='){const k=s.indexOf(';',i);i=k+1;continue;}i++;ws();let k=i;while(k<n&&/[A-Za-z0-9_]/.test(s[k]))k++;const t=s.slice(i,k).toUpperCase();i=k;ws();
  let a=[];try{a=val();}catch(e){const q=s.indexOf(';',i);i=q<0?n:q;}ws();if(s[i]===';')i++;E.set(id,{t,a:Array.isArray(a)?a:[]});}
 return E;}
function decode(o){return o.replace(/\\X2\\([0-9A-F]+)\\X0\\/gi,(m,h)=>{let r='';for(let k=0;k+3<h.length;k+=4)r+=String.fromCharCode(parseInt(h.slice(k,k+4),16));return r;}).replace(/\\X\\([0-9A-F]{2})/gi,(m,h)=>String.fromCharCode(parseInt(h,16))).replace(/\\S\\(.)/g,(m,c)=>String.fromCharCode(c.charCodeAt(0)+128));}
function ifcModel(E){const get=v=>v&&v.r!=null?E.get(v.r):null,num1=v=>typeof v==='number'?v:v&&typeof v.v==='number'?v.v:NaN;
 // unidade de comprimento → cm
 let U=100;for(const[,e]of E){if(e.t==='IFCSIUNIT'&&e.a[1]?.e==='LENGTHUNIT'){const p=e.a[2]?.e||'';U={MILLI:.1,CENTI:1,DECI:10,'':100,KILO:1e5}[p]??100;break;}if(e.t==='IFCCONVERSIONBASEDUNIT'&&e.a[1]?.e==='LENGTHUNIT'){const nm=String(e.a[2]||'').toUpperCase();U=/FOOT|FEET/.test(nm)?30.48:/INCH/.test(nm)?2.54:U;break;}}
 const I={X:[1,0,0],Y:[0,1,0],Z:[0,0,1],T:[0,0,0]};
 const pt=v=>{const e=get(v);const c=e?.a?.[0]||[];return [N(c[0])||0,N(c[1])||0,N(c[2])||0];};
 const dir=v=>{const e=get(v);if(!e)return null;const c=e.a[0]||[];const d=[N(c[0])||0,N(c[1])||0,N(c[2])||0],l=Math.hypot(...d);return l?d.map(x=>x/l):null;};
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
 const frame=(X,Z,T)=>{Z=Z||[0,0,1];X=X||(Math.abs(Z[0])<.9?[1,0,0]:[0,1,0]);const k=dot(X,Z);X=[X[0]-k*Z[0],X[1]-k*Z[1],X[2]-k*Z[2]];const l=Math.hypot(...X)||1;X=X.map(v=>v/l);return {X,Y:cross(Z,X),Z,T};};
 const ap=(m,p)=>[m.T[0]+m.X[0]*p[0]+m.Y[0]*p[1]+m.Z[0]*p[2],m.T[1]+m.X[1]*p[0]+m.Y[1]*p[1]+m.Z[1]*p[2],m.T[2]+m.X[2]*p[0]+m.Y[2]*p[1]+m.Z[2]*p[2]];
 const ad=(m,d)=>[m.X[0]*d[0]+m.Y[0]*d[1]+m.Z[0]*d[2],m.X[1]*d[0]+m.Y[1]*d[1]+m.Z[1]*d[2],m.X[2]*d[0]+m.Y[2]*d[1]+m.Z[2]*d[2]];
 const mul=(A,B)=>({X:ad(A,B.X),Y:ad(A,B.Y),Z:ad(A,B.Z),T:ap(A,B.T)});
 const axis=v=>{const e=get(v);if(!e)return I;if(e.t==='IFCAXIS2PLACEMENT3D')return frame(dir(e.a[2]),dir(e.a[1]),pt(e.a[0]));if(e.t==='IFCAXIS2PLACEMENT2D'){const p=pt(e.a[0]);return frame(dir(e.a[1]),[0,0,1],[p[0],p[1],0]);}return I;};
 const pc=new Map();const place=v=>{const e=get(v);if(!e)return I;if(pc.has(v.r))return pc.get(v.r);let m=I;if(e.t==='IFCLOCALPLACEMENT'){const par=e.a[0]?place(e.a[0]):I;m=mul(par,axis(e.a[1]));}pc.set(v.r,m);return m;};
 const curve=(v)=>{const e=get(v);if(!e)return [];if(e.t==='IFCPOLYLINE')return (e.a[0]||[]).map(pt);
  if(e.t==='IFCINDEXEDPOLYCURVE'){const l=get(e.a[0]);return (l?.a?.[0]||[]).map(c=>[N(c[0])||0,N(c[1])||0,N(c[2])||0]);}
  if(e.t==='IFCCOMPOSITECURVE')return (e.a[0]||[]).flatMap(sg=>curve(get(sg)?.a?.[2]));
  if(e.t==='IFCTRIMMEDCURVE'){const b=get(e.a[0]);const tr=x=>(x||[]).map(q=>q&&q.r!=null?pt(q):q&&q.t==='IFCPARAMETERVALUE'?{t:q.v}:null).find(Boolean);const t1=tr(e.a[1]),t2=tr(e.a[2]);
   if(b?.t==='IFCLINE'){const P=pt(b.a[0]),vec=get(b.a[1]),d=dir(vec?.a?.[0])||[1,0,0],mg=N(vec?.a?.[1])||1;const at=t=>Array.isArray(t)?t:[P[0]+d[0]*mg*t.t,P[1]+d[1]*mg*t.t,P[2]+d[2]*mg*t.t];if(t1&&t2)return [at(t1),at(t2)];}
   return [t1,t2].filter(Array.isArray);}
  if(e.t==='IFCLINE'){const P=pt(e.a[0]);return [P];}
  return [];};
 const profile=v=>{const e=get(v);if(!e)return [];if(e.t==='IFCRECTANGLEPROFILEDEF'||e.t==='IFCRECTANGLEHOLLOWPROFILEDEF'||e.t==='IFCROUNDEDRECTANGLEPROFILEDEF'){const m=e.a[2]?axis(e.a[2]):I,x=N(e.a[3])/2,y=N(e.a[4])/2;return [[-x,-y,0],[x,-y,0],[x,y,0],[-x,y,0]].map(p=>ap(m,p));}
  if(/^IFCARBITRARY(CLOSED|PROFILEDEFWITHVOIDS)|^IFCARBITRARYCLOSEDPROFILEDEF$/.test(e.t))return curve(e.a[2]).map(p=>[p[0],p[1],0]);
  if(e.t==='IFCCIRCLEPROFILEDEF'){const m=e.a[2]?axis(e.a[2]):I,r=N(e.a[3]);return Array.from({length:12},(_,k)=>ap(m,[r*Math.cos(k*Math.PI/6),r*Math.sin(k*Math.PI/6),0]));}
  if(e.t==='IFCDERIVEDPROFILEDEF')return profile(e.a[2]);return [];};
 function items(v,M,out,depth=0){const e=get(v);if(!e||depth>8)return;switch(e.t){
  case 'IFCEXTRUDEDAREASOLID':case 'IFCEXTRUDEDAREASOLIDTAPERED':{const M2=mul(M,e.a[1]?axis(e.a[1]):I),d=dir(e.a[2])||[0,0,1],h=N(e.a[3])||0;for(const p of profile(e.a[0])){out.push(ap(M2,p));out.push(ap(M2,[p[0]+d[0]*h,p[1]+d[1]*h,p[2]+d[2]*h]));}break;}
  case 'IFCBOOLEANCLIPPINGRESULT':case 'IFCBOOLEANRESULT':items(e.a[1],M,out,depth+1);break;
  case 'IFCMAPPEDITEM':{const src=get(e.a[0]),tg=get(e.a[1]);let Mt=I;if(tg){const o=pt(tg.a[2]),x=dir(tg.a[0]),y=dir(tg.a[1]),z=tg.a[4]?dir(tg.a[4]):null;const fr=frame(x||[1,0,0],z||(x&&y?cross(x,y):[0,0,1]),o);Mt=fr;}const Mo=src?axis(src.a[0]):I;const rep=get(src?.a?.[1]);for(const it of rep?.a?.[3]||[])items(it,mul(M,mul(Mt,Mo)),out,depth+1);break;}
  case 'IFCFACETEDBREP':case 'IFCFACETEDBREPWITHVOIDS':{const sh=get(e.a[0]);for(const f of sh?.a?.[0]||[])for(const b of get(f)?.a?.[0]||[]){const lp=get(get(b)?.a?.[0]);for(const p of lp?.a?.[0]||[])out.push(ap(M,pt(p)));}break;}
  case 'IFCSHELLBASEDSURFACEMODEL':for(const shv of e.a[0]||[]){const sh=get(shv);for(const f of sh?.a?.[0]||[])for(const b of get(f)?.a?.[0]||[]){const lp=get(get(b)?.a?.[0]);for(const p of lp?.a?.[0]||[])out.push(ap(M,pt(p)));}}break;
  case 'IFCTRIANGULATEDFACESET':case 'IFCPOLYGONALFACESET':{const l=get(e.a[0]);for(const c of l?.a?.[0]||[])out.push(ap(M,[N(c[0])||0,N(c[1])||0,N(c[2])||0]));break;}
  default:break;}}
 const reps=prod=>{const s=get(prod.a[6]);return (s?.a?.[2]||[]).map(get).filter(Boolean);};
 const bodyPts=prod=>{const M=place(prod.a[5]),out=[];const rs=reps(prod);const body=rs.filter(r=>/^(Body|Facetation|Mesh)$/i.test(r.a[1]||''));for(const r of (body.length?body:rs.filter(r=>!/^(Axis|FootPrint|Box|Profile|Annotation)$/i.test(r.a[1]||''))))for(const it of r.a[3]||[])items(it,M,out);return out.map(p=>p.map(v=>v*U));};
 const axisPts=prod=>{const M=place(prod.a[5]);const r=reps(prod).find(r=>/^Axis$/i.test(r.a[1]||''));if(!r)return null;const ps=[];for(const it of r.a[3]||[])for(const p of curve(it))ps.push(ap(M,p).map(v=>v*U));return ps.length>=2?ps:null;};
 return {E,get,U,bodyPts,axisPts,place,num1};}
function hull(P){const p=P.map(q=>[q[0],q[1]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);if(p.length<3)return p;const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[],up=[];for(const q of p){while(lo.length>=2&&cr(lo.at(-2),lo.at(-1),q)<=0)lo.pop();lo.push(q);}for(const q of p.slice().reverse()){while(up.length>=2&&cr(up.at(-2),up.at(-1),q)<=0)up.pop();up.push(q);}return lo.slice(0,-1).concat(up.slice(0,-1));}
function minRectDir(P){const h=hull(P);let best=null;for(let i=0;i<h.length;i++){const a=h[i],b=h[(i+1)%h.length];const L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<1e-6)continue;const u=[(b[0]-a[0])/L,(b[1]-a[1])/L],n=[-u[1],u[0]];let s0=Infinity,s1=-Infinity,q0=Infinity,q1=-Infinity;for(const p of h){const s=p[0]*u[0]+p[1]*u[1],q=p[0]*n[0]+p[1]*n[1];s0=Math.min(s0,s);s1=Math.max(s1,s);q0=Math.min(q0,q);q1=Math.max(q1,q);}const area=(s1-s0)*(q1-q0);if(!best||area<best.area){const lng=s1-s0>=q1-q0;best={area,u:lng?u:n};}}return best?.u||[1,0];}
async function importIFC(file){window.__quietNorm73=true;try{return await importIFC0(file);}finally{setTimeout(()=>{window.__quietNorm73=false;},200);}}
async function importIFC0(file){const st=$('planStatus');try{
 if(file.size>150*1024*1024)throw Error('IFC acima de 150 MB.');st.textContent='Lendo o IFC '+file.name+'…';await new Promise(r=>setTimeout(r,30));
 const text=await file.text();if(!/ISO-10303-21/.test(text.slice(0,200)))throw Error('O arquivo não parece um IFC (STEP). Exporte do Revit/ArchiCAD em IFC 2x3 ou IFC4.');
 const E=parseIFC(text),m=ifcModel(E),get=m.get;st.textContent='IFC lido: '+E.size+' entidades. Montando paredes…';await new Promise(r=>setTimeout(r,30));
 // pavimentos
 const storeys=new Map();for(const[id,e]of E)if(e.t==='IFCBUILDINGSTOREY'){const pz=m.place(e.a[5]).T[2]*m.U;const el=N(e.a[9]);storeys.set(id,{id,name:(e.a[2]||e.a[7]||'Pavimento '+id).toString().trim(),z:Number.isFinite(el)?el*m.U:pz,walls:[]});}
 const where=new Map();for(const[,e]of E)if(e.t==='IFCRELCONTAINEDINSPATIALSTRUCTURE'){const s=e.a[5]?.r;for(const r of e.a[4]||[])if(r?.r!=null)where.set(r.r,s);}
 const isExt=new Map();for(const[,e]of E)if(e.t==='IFCRELDEFINESBYPROPERTIES'){const ps=get(e.a[5]);if(!ps||ps.t!=='IFCPROPERTYSET')continue;for(const pv of ps.a[4]||[]){const p=get(pv);if(p?.t==='IFCPROPERTYSINGLEVALUE'&&/^IsExternal$/i.test(p.a[0]||'')){const v=p.a[2]?.v?.e??p.a[2]?.e;if(v)for(const o of e.a[4]||[])if(o?.r!=null)isExt.set(o.r,v==='T'||v==='TRUE');}}}
 const voids=new Map(),fills=new Map();for(const[,e]of E){if(e.t==='IFCRELVOIDSELEMENT'){const w=e.a[4]?.r,o=e.a[5]?.r;if(w!=null&&o!=null){if(!voids.has(w))voids.set(w,[]);voids.get(w).push(o);}}if(e.t==='IFCRELFILLSELEMENT'){const o=e.a[4]?.r,d=e.a[5]?.r;if(o!=null&&d!=null)fills.set(o,d);}}
 const filled=new Set(fills.values());const skipped=[];const WALLT=/^IFCWALL(STANDARDCASE|ELEMENTEDCASE)?$/;
 const walls=[];
 for(const[id,e]of E){if(!WALLT.test(e.t))continue;const pts=m.bodyPts(e);if(pts.length<4){skipped.push((e.a[2]||'Parede #'+id)+' (geometria não suportada)');continue;}
  const ax=m.axisPts(e);let u;if(ax){const a=ax[0],b=ax.at(-1);const l=Math.hypot(b[0]-a[0],b[1]-a[1]);u=l>1?[(b[0]-a[0])/l,(b[1]-a[1])/l]:minRectDir(pts);}else u=minRectDir(pts);const n=[-u[1],u[0]];
  let s0=Infinity,s1=-Infinity,q0=Infinity,q1=-Infinity,z0=Infinity,z1=-Infinity;for(const p of pts){const s=p[0]*u[0]+p[1]*u[1],q=p[0]*n[0]+p[1]*n[1];s0=Math.min(s0,s);s1=Math.max(s1,s);q0=Math.min(q0,q);q1=Math.max(q1,q);z0=Math.min(z0,p[2]);z1=Math.max(z1,p[2]);}
  let sa=s0,sb=s1;if(ax){const a=ax[0],b=ax.at(-1);sa=a[0]*u[0]+a[1]*u[1];sb=b[0]*u[0]+b[1]*u[1];if(sa>sb)[sa,sb]=[sb,sa];}
  const t=q1-q0,qc=(q0+q1)/2;if(!(t>2&&t<80)||!(sb-sa>10)||!(z1-z0>20)){skipped.push((e.a[2]||'Parede #'+id)+' (espessura '+f1(t)+' cm)');continue;}
  const st0=where.get(id);const S=storeys.get(st0)||[...storeys.values()].sort((a,b)=>Math.abs(a.z-z0)-Math.abs(b.z-z0))[0];
  walls.push({id,name:String(e.a[2]||'Parede').trim(),u,n,qc,sa,sb,t,z0,z1,S,ext:isExt.get(id),ops:[]});}
 if(!walls.length)throw Error('Nenhuma parede (IfcWall) com geometria reconhecida neste IFC.'+(skipped.length?' Ignoradas: '+skipped.slice(0,5).join(', '):''));
 if(!storeys.size){const S={id:0,name:'Pavimento',z:Math.min(...walls.map(w=>w.z0)),walls:[]};storeys.set(0,S);walls.forEach(w=>w.S=S);}
 // pontas: leva cada ponta até o eixo da parede que encontra
 const pw=w=>({A:{x:w.u[0]*w.sa+w.n[0]*w.qc,y:w.u[1]*w.sa+w.n[1]*w.qc},B:{x:w.u[0]*w.sb+w.n[0]*w.qc,y:w.u[1]*w.sb+w.n[1]*w.qc}});
 for(const w of walls){for(const end of ['sa','sb']){const P=pw(w)[end==='sa'?'A':'B'];let best=null;for(const v of walls){if(v===w||v.S!==w.S)continue;if(Math.abs(w.u[0]*v.u[0]+w.u[1]*v.u[1])>.98)continue;const q=pw(v),dx=q.B.x-q.A.x,dy=q.B.y-q.A.y,den=w.u[0]*dy-w.u[1]*dx;if(Math.abs(den)<1e-9)continue;const tt=((q.A.x-P.x)*dy-(q.A.y-P.y)*dx)/den;const X={x:P.x+w.u[0]*tt,y:P.y+w.u[1]*tt};if(Math.abs(tt)>Math.max(w.t,v.t)*1.2+2)continue;if(segDist(X,q.A,q.B)>v.t/2+2)continue;if(!best||Math.abs(tt)<Math.abs(best))best=tt;}if(best!=null){if(end==='sa')w.sa+=best;else w.sb+=best;}}if(w.sa>w.sb)[w.sa,w.sb]=[w.sb,w.sa];}
 // aberturas
 const typeOf=(d,b)=>d?.t==='IFCDOOR'||d?.t==='IFCDOORSTANDARDCASE'?'Porta':d?.t==='IFCWINDOW'||d?.t==='IFCWINDOWSTANDARDCASE'?'Janela':(b<5?'Porta':'Janela');
 const addOp=(w,pts,type)=>{let a=Infinity,b=-Infinity,z0=Infinity,z1=-Infinity;for(const p of pts){const s=p[0]*w.u[0]+p[1]*w.u[1]-w.sa;a=Math.min(a,s);b=Math.max(b,s);z0=Math.min(z0,p[2]);z1=Math.max(z1,p[2]);}const L=w.sb-w.sa,H=w.z1-w.z0;a=Math.max(0,a);b=Math.min(L,b);const bot=Math.max(0,z0-w.z0),top=Math.min(H,z1-w.z0);if(b-a<20||top-bot<20)return false;
  const o={start:Math.round(a*2)/2,width:Math.round((b-a)*2)/2,bottom:Math.round(bot*2)/2,height:Math.round((top-bot)*2)/2,type:type||typeOf(null,bot)};if(o.type==='Porta'&&o.bottom<5){o.height=Math.round((o.bottom+o.height)*2)/2;o.bottom=0;}
  if(w.ops.some(q=>Math.min(q.start+q.width,o.start+o.width)-Math.max(q.start,o.start)>Math.min(q.width,o.width)*.5))return false;w.ops.push(o);return true;};
 let nOps=0;for(const w of walls){for(const oid of voids.get(w.id)||[]){const op=E.get(oid);if(!op)continue;const pts=m.bodyPts(op);const d=E.get(fills.get(oid));let ok=false;if(pts.length)ok=addOp(w,pts,d?typeOf(d,0):null);if(!ok&&d){const dp=m.bodyPts(d);if(dp.length)ok=addOp(w,dp,typeOf(d,0));}if(ok)nOps++;}}
 // portas/janelas sem abertura ligada: procura a parede mais próxima
 for(const[id,e]of E){if(!/^IFC(DOOR|WINDOW)(STANDARDCASE)?$/.test(e.t)||filled.has(id))continue;const pts=m.bodyPts(e);if(!pts.length)continue;const c=pts.reduce((s,p)=>[s[0]+p[0]/pts.length,s[1]+p[1]/pts.length,s[2]+p[2]/pts.length],[0,0,0]);let best=null,bd=Infinity;for(const w of walls){const s=c[0]*w.u[0]+c[1]*w.u[1],q=c[0]*w.n[0]+c[1]*w.n[1];if(s<w.sa-5||s>w.sb+5||c[2]<w.z0-10||c[2]>w.z1+10)continue;const d=Math.abs(q-w.qc);if(d<=w.t/2+20&&d<bd){bd=d;best=w;}}if(best&&addOp(best,pts,typeOf(e,0)))nOps++;}
 // planta por pavimento: DXF de faces (cm), com a mesma moldura e a origem em todos
 let mnx=Infinity,mny=Infinity,mxx=-Infinity,mxy=-Infinity;for(const w of walls){const q=pw(w);for(const P of [q.A,q.B]){mnx=Math.min(mnx,P.x);mny=Math.min(mny,P.y);mxx=Math.max(mxx,P.x);mxy=Math.max(mxy,P.y);}}
 const near0=0>=mnx-5000&&0<=mxx+5000&&0>=mny-5000&&0<=mxy+5000,O=near0?{x:0,y:0}:{x:mnx,y:mny};mnx=Math.min(mnx,O.x)-150;mny=Math.min(mny,O.y)-150;mxx=Math.max(mxx,O.x)+150;mxy=Math.max(mxy,O.y)+150;
 const used=[...storeys.values()].filter(S=>walls.some(w=>w.S===S)).sort((a,b)=>a.z-b.z);
 const freeSlots=10-(plants36?.length||0);if(used.length>freeSlots)throw Error('O IFC tem '+used.length+' pavimentos com paredes e o projeto aceita mais '+freeSlots+' planta(s). Comece um projeto novo ou exporte só os pavimentos de alvenaria.');
 try{if(L68()?.current?.()!=='all')await L68().switchTo('all',true);}catch{}
 const base=file.name.replace(/\.ifc$/i,'');const made=[];
 for(const S of used){const ws=walls.filter(w=>w.S===S);const out=[];const LN=(a,b,ly)=>out.push('0','LINE','8',ly,'10',a.x.toFixed(2),'20',a.y.toFixed(2),'11',b.x.toFixed(2),'21',b.y.toFixed(2));
  LN({x:mnx,y:mny},{x:mxx,y:mny},'LIMITE');LN({x:mxx,y:mny},{x:mxx,y:mxy},'LIMITE');LN({x:mxx,y:mxy},{x:mnx,y:mxy},'LIMITE');LN({x:mnx,y:mxy},{x:mnx,y:mny},'LIMITE');
  LN({x:O.x-40,y:O.y},{x:O.x+40,y:O.y},'ORIGEM');LN({x:O.x,y:O.y-40},{x:O.x,y:O.y+40},'ORIGEM');
  for(const w of ws){const P=(s,q)=>({x:w.u[0]*(w.sa+s)+w.n[0]*(w.qc+q),y:w.u[1]*(w.sa+s)+w.n[1]*(w.qc+q)}),L=w.sb-w.sa,h=w.t/2;
   const gaps=w.ops.filter(o=>o.bottom<150&&o.bottom+o.height>100).map(o=>[o.start,o.start+o.width,o]).sort((a,b)=>a[0]-b[0]);
   let s=0;for(const[a,b]of gaps){if(a>s){LN(P(s,-h),P(a,-h),'PAREDE');LN(P(s,h),P(a,h),'PAREDE');}s=Math.max(s,b);}if(L>s){LN(P(s,-h),P(L,-h),'PAREDE');LN(P(s,h),P(L,h),'PAREDE');}
   LN(P(0,-h),P(0,h),'PAREDE');LN(P(L,-h),P(L,h),'PAREDE');
   for(const[a,b,o]of gaps){LN(P(a,-h),P(a,h),'PAREDE');LN(P(b,-h),P(b,h),'PAREDE');if(o.type==='Janela'){LN(P(a,-h/3),P(b,-h/3),'JANELA');LN(P(a,h/3),P(b,h/3),'JANELA');}else LN(P(a,0),P(b,0),'PORTA');}}
  const dxf=['0','SECTION','2','ENTITIES',...out,'0','ENDSEC','0','EOF'].join('\n');const nm=(base+' · '+S.name).replace(/[\\/:*?"<>|]+/g,'-')+'.dxf';
  st.textContent='Criando a planta '+S.name+'…';await addPlant36(new File([dxf],nm,{type:'application/dxf'}));const src=plants36[plants36.length-1],pg=src.pages[0],info=src.canvas.map74||dxfInfo.at(-1);const scale=info.scale;
  applyPageScale23(pg,scale,false);if(curPage()===pg)pxCm=scale;const c=dxfToCanvas(info,O.x,O.y);state.origins74[pg]={x:c.x,y:c.y,how:'ifc'};
  const toC=(x,y)=>dxfToCanvas(info,x,y);
  for(const w of ws){const q=pw(w);const o={uid:'wall-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10),line:[toC(q.A.x,q.A.y),toC(q.B.x,q.B.y)],length:Math.round((w.sb-w.sa)*10)/10,height:Math.round((w.z1-w.z0)*10)/10,width:Math.round(w.t*2)/2,page:pg,planScale:scale,confirmed:false,openings:w.ops.map(o=>({...o})).sort((a,b)=>a.start-b.start),source:'IFC — '+w.name};if(w.ext!=null)o.location=w.ext?'Externa':'Interna';state.walls.push(o);}
  state.levels53??=[];state.levels53=state.levels53.filter(l=>String(l.page)!==String(pg));state.levels53.push({id:'lvl-'+pg+'-'+Date.now().toString(36),text:f2(S.z/100)+' '+S.name,page:String(pg),rep:1});
  made.push({S,pg,n:ws.length,ops:ws.reduce((a,w)=>a+w.ops.length,0)});}
 let nNorm=0;try{nNorm=(window.norm73?.()||[]).length;}catch{}try{window.ensureTags58?.();}catch{}renderWalls();invalidate();try{L68()?.refresh?.();}catch{}
 if(made[0]){$('page').value=String(made[0].pg);await renderPage();}renderWalls();drawPlan();refreshPanel();
 const msg='IFC importado: '+made.length+' pavimento(s) — '+made.map(x=>x.S.name+' ('+f2(x.S.z/100)+' m): '+x.n+' paredes, '+x.ops+' aberturas').join(' · ')+'. A escala e o ponto de origem já vêm do IFC.'+(nNorm?' '+nNorm+' abertura(s) com altura fora das fiadas receberam complemento hachurado.':'')+' Confira as paredes (espessura, altura, posição) e marque como conferidas.'+(skipped.length?' Itens ignorados: '+skipped.length+' ('+skipped.slice(0,4).join(', ')+(skipped.length>4?'…':'')+').':'');
 st.textContent=msg;setTimeout(()=>{st.textContent=msg;},80);return {made,skipped,walls:walls.length,ops:nOps};
 }catch(e){console.error(e);st.textContent='Não foi possível importar o IFC: '+e.message;alert('Não foi possível importar o IFC: '+e.message);return null;}}
window.importIFC74=importIFC;

const css=document.createElement('style');css.textContent=`
.grp74{border-color:#c7b8f0!important;background:#faf8ff!important}.grp74 button.on74{background:#ede4ff;border-color:#8b5cf6;color:#4c1d95}
#v3d74{position:fixed;inset:0;z-index:9999;background:#e9eef3;display:none;flex-direction:column;font-family:inherit}
#v3d74 .bar74{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;background:#102e4b;color:#fff}#v3d74 .bar74 .note{color:#c9d8e8;font-size:12px}#v3d74 .sp74{flex:1}
#v3d74 .bar74 button{padding:6px 10px;margin:0}#v3d74 #close74{background:#e8eef5;color:#102e4b;font-weight:700}
#v3d74 .body74{flex:1;display:flex;min-height:0}#v3d74 .side74{width:290px;flex:0 0 290px;overflow:auto;padding:12px;background:#fff;border-right:1px solid #cfdceb;display:flex;flex-direction:column;gap:8px;font-size:13px}
#v3d74 .side74 h4{margin:6px 0 2px;color:#102e4b;font-size:13px;text-transform:uppercase;letter-spacing:.06em}#v3d74 .side74 label{display:flex;flex-direction:column;gap:3px;font-weight:600;color:#2b4a66;margin:0}
#v3d74 .side74 label.ck74,#v3d74 .side74 label.lv74{flex-direction:row;align-items:flex-start;gap:6px;font-weight:500}#v3d74 .side74 input[type=checkbox]{width:auto;margin-top:2px}
#v3d74 .cv74{flex:1;position:relative;min-width:0}#v3d74 canvas{width:100%;height:100%;display:block;cursor:grab;touch-action:none}
.warn74{color:#a3361f;background:#fff1ee;border:1px solid #f3c2b8;border-radius:6px;padding:6px 8px;margin:4px 0;font-size:12.5px}.ok74{color:#1d6b3a;background:#eef8f0;border:1px solid #b9dcc3;border-radius:6px;padding:6px 8px;margin:4px 0;font-size:12.5px}
.leg74 span{display:inline-block;width:11px;height:11px;border-radius:2px;margin:0 3px 0 8px;vertical-align:-1px}
@media(max-width:700px){#v3d74 .body74{flex-direction:column}#v3d74 .side74{width:auto;flex:0 0 auto;max-height:38vh}}`;document.head.append(css);
setTimeout(refreshPanel,0);
})();
