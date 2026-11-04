
'use strict';
/* V48: camada independente de diagnóstico, validação de arquivos e indicadores.
   Não modifica ModEngine, JunctionEngine, ChannelEngine nem as fórmulas V47. */
(function(){
  const el=id=>document.getElementById(id);
  const n=v=>Number(v);
  const finitePositive=v=>Number.isFinite(n(v))&&n(v)>0;
  const decimal1=v=>Math.abs(n(v)*10-Math.round(n(v)*10))<0.001;
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const reportMax=50;
  let auditVisible=false,scheduled=false;
  let lastSavedMessage='Salve um JSON após cada alteração importante.';

  // Validar estrutura antes de substituir o projeto em memória.
  window.validateImportV48=function(d){
    if(!d||typeof d!=='object'||Array.isArray(d))throw Error('O arquivo não contém um projeto válido.');
    if(d.version!==1)throw Error('Formato não suportado. Abra um projeto JSON da Engenhar compatível (formato 1).');
    if(d.projectSchema!==undefined&&(!Number.isInteger(d.projectSchema)||d.projectSchema>1||d.projectSchema<1))throw Error('O arquivo foi salvo em um formato de projeto não suportado por esta versão.');
    if(!Array.isArray(d.blocks)||!Array.isArray(d.walls))throw Error('O arquivo não contém listas válidas de blocos e paredes.');
    if(d.blocks.length>2000||d.walls.length>2000)throw Error('O arquivo excede o limite de segurança de 2.000 itens por lista.');
    for(const [i,b] of d.blocks.entries()){
      if(!b||typeof b!=='object'||Array.isArray(b))throw Error('Bloco '+(i+1)+' inválido no arquivo.');
      if(['length','height','width'].some(k=>b[k]!==undefined&&!Number.isFinite(Number(b[k]))))throw Error('Bloco '+(i+1)+' contém dimensões não numéricas.');
    }
    for(const [i,w] of d.walls.entries()){
      if(!w||typeof w!=='object'||Array.isArray(w))throw Error('Parede '+(i+1)+' inválida no arquivo.');
      if(w.openings!==undefined&&!Array.isArray(w.openings))throw Error('Parede '+(i+1)+' contém uma lista de aberturas inválida.');
      if(['length','height','width'].some(k=>w[k]!==undefined&&!Number.isFinite(Number(w[k]))))throw Error('Parede '+(i+1)+' contém dimensões não numéricas.');
      for(const [j,o] of (w.openings||[]).entries()){
        if(!o||typeof o!=='object'||Array.isArray(o))throw Error('Abertura '+(j+1)+' da parede '+(i+1)+' inválida.');
      }
    }
    if(d.plants36!==undefined&&!Array.isArray(d.plants36))throw Error('Lista de plantas inválida.');
    if((d.plants36||[]).length>10)throw Error('Limite de dez arquivos de planta por projeto.');
    const pageIds=new Set();
    for(const [i,p] of (d.plants36||[]).entries()){
      if(!p||typeof p!=='object'||typeof p.name!=='string'||!/\.(pdf|dxf)$/i.test(p.name)||typeof p.data!=='string'||!p.data.length)throw Error('Planta '+(i+1)+' inválida no arquivo.');
      try{atob(p.data);}catch{throw Error('Dados da planta '+(i+1)+' estão corrompidos.');}
      if(p.pages!==undefined&&(!Array.isArray(p.pages)||p.pages.some(id=>!Number.isInteger(id)||id<1)))throw Error('Páginas da planta '+(i+1)+' inválidas.');
      for(const id of p.pages||[]){if(pageIds.has(id))throw Error('Identificador de página repetido: '+id+'.');pageIds.add(id);}
    }
    return true;
  };

  function diagnostics(){
    const errors=[],warnings=[];
    const add=(dest,message)=>{if(dest.length<reportMax)dest.push(message);};
    const walls=Array.isArray(state.walls)?state.walls:[];
    const blocks=Array.isArray(state.blocks)?state.blocks:[];
    const active=blocks.filter(b=>b&&b.active!==false);
    if(!walls.length)add(errors,'Cadastre ao menos uma parede.');
    if(!active.length)add(errors,'Cadastre ao menos um bloco ativo.');
    const codes=new Set();
    active.forEach((b,i)=>{
      const code=String(b.code??'').trim();
      if(!code)add(errors,'Peça ativa '+(i+1)+': informe um código.');
      else if(codes.has(code))add(errors,'Código de bloco duplicado: '+code+'.');
      codes.add(code);
      for(const key of ['length','height','width'])if(!finitePositive(b[key])||!decimal1(b[key])){
        add(errors,'Bloco '+(code||i+1)+': '+key+' deve ser positivo, em centímetros, com precisão de 0,1 cm.');break;
      }
    });
    for(const [key,name] of [['jh','Junta horizontal'],['jv','Junta vertical']]){
      const v=el(key)?.value;
      if(!Number.isFinite(n(v))||n(v)<0||!decimal1(v))add(errors,name+': informe valor válido, não negativo, com precisão de 0,1 cm.');
    }
    if(el('flex')?.checked){
      const low=n(el('jMin')?.value),high=n(el('jMax')?.value);
      if(!Number.isFinite(low)||!Number.isFinite(high)||low<=0||high<low)add(errors,'Limites de juntas flexíveis inválidos: confira mínimo e máximo.');
    }
    if(!finitePositive(el('scale')?.value))add(warnings,'Escala de impressão inválida. Confira antes de gerar pranchas.');
    if(!finitePositive(el('openingBearing')?.value))add(warnings,'Confira o apoio de vergas e contravergas.');
    walls.forEach((w,i)=>{
      const id='Parede '+(i+1),L=n(w.length),H=n(w.height),T=n(w.width);
      if(![L,H,T].every(Number.isFinite)||L<=0||H<=0||T<=0){add(errors,id+': comprimento, altura e espessura precisam ser positivos.');return;}
      if(L>5000||H>4000)add(errors,id+': excede o limite de geometria do motor (50 m de comprimento / 40 m de altura).');
      if(![L,H,T].every(decimal1))add(errors,id+': dimensões precisam de precisão de 0,1 cm.');
      if(!active.some(b=>b.type!=='Canaleta'&&n(b.width)===T))add(errors,id+': não há blocos comuns/especiais ativos com espessura '+T+' cm.');
      if(!w.confirmed)add(warnings,id+': dimensões ainda não marcadas como conferidas.');
      const openings=Array.isArray(w.openings)?w.openings:[];
      openings.forEach((o,j)=>{
        const a=n(o.start),width=n(o.width),bottom=n(o.bottom),height=n(o.height),name=id+' · abertura '+(j+1);
        if(![a,width,bottom,height].every(Number.isFinite)||width<=0||height<=0){add(errors,name+': medidas inválidas.');return;}
        if(a<-.01||bottom<-.01||a+width>L+.01||bottom+height>H+.01)add(errors,name+': abertura ultrapassa os limites da parede.');
      });
      for(let j=0;j<openings.length;j++)for(let k=j+1;k<openings.length;k++){
        const a=openings[j],b=openings[k];
        if(n(a.start)<n(b.start)+n(b.width)-.01&&n(b.start)<n(a.start)+n(a.width)-.01&&n(a.bottom)<n(b.bottom)+n(b.height)-.01&&n(b.bottom)<n(a.bottom)+n(a.height)-.01){
          add(warnings,id+': aberturas '+(j+1)+' e '+(k+1)+' se sobrepõem; confira se é intencional.');
        }
      }
    });
    const results=Array.isArray(state.results)?state.results:null;
    let pending=0,withErrors=0;
    if(results){
      if(results.length!==walls.length)add(warnings,'Quantidade de resultados difere da quantidade de paredes; gere novamente.');
      results.forEach((m,i)=>{
        if(!m||typeof m!=='object'){add(warnings,'Resultado da parede '+(i+1)+' ausente.');return;}
        if(m.pending||m.revisionStale||m.manual||m.meetingPending)pending++;
        if(m.errors?.length){withErrors++;add(warnings,'Parede '+(i+1)+': '+String(m.errors[0]));}
        for(const [code,quantity] of Object.entries(m.quant||{})){
          if(!Number.isFinite(n(quantity))||n(quantity)<0)add(warnings,'Parede '+(i+1)+': quantidade inválida para '+code+'.');
        }
        for(const row of m.rows||[])for(const piece of row.pieces||[]){
          if(!Number.isFinite(n(piece.x))||!Number.isFinite(n(piece.length))||n(piece.length)<0){
            add(warnings,'Parede '+(i+1)+': geometria de peça inconsistente no resultado.');break;
          }
        }
      });
      if(pending)add(warnings,pending+' parede(s) com desenho ou resultado pendente de revisão/atualização.');
    }
    if(!image&&walls.some(w=>w.line))add(warnings,'A planta de fundo não está carregada. Se restaurou um JSON, recarregue o PDF/DXF original.');
    return {errors,warnings,walls:walls.length,confirmed:walls.filter(w=>w.confirmed).length,activeBlocks:active.length,pending,withErrors,hasResults:!!results};
  }
  window.diagnoseV48=diagnostics;

  function renderAudit(d){
    const panel=el('v48AuditDetails');
    if(!panel)return;
    panel.classList.toggle('hidden',!auditVisible);
    if(!auditVisible)return;
    const section=(heading,items,css)=>'<h3>'+heading+' ('+items.length+')</h3>'+(items.length?'<ul class="'+css+'">'+items.map(t=>'<li>'+safe(t)+'</li>').join('')+'</ul>':'<p>Nenhum registro nesta categoria.</p>');
    panel.innerHTML='<p class="note">Verificação preventiva de entradas e consistência. Não substitui revisão técnica das modulações e dos detalhes executivos.</p>'+section('Erros que precisam de correção',d.errors,'v48Errors')+section('Avisos para conferência',d.warnings,'v48Warnings');
  }
  function renderStatus(){
    scheduled=false;
    const d=diagnostics(),root=el('v48Overview');
    if(!root)return;
    const card=(value,label,cls='')=>'<div class="v48Stat '+cls+'"><b>'+safe(value)+'</b><span>'+safe(label)+'</span></div>';
    const resultLabel=!d.hasResults?'Modulação não gerada':d.pending||d.withErrors?'Resultados exigem revisão':'Resultados disponíveis para conferência';
    root.innerHTML=card(d.walls,d.confirmed+' parede(s) conferida(s)')+card(d.activeBlocks,'Peças ativas no catálogo')+card(d.errors.length,d.errors.length?'Erro(s) de entrada':'Erros de entrada',d.errors.length?'v48Issue':'')+card(d.warnings.length,resultLabel+' · avisos',d.warnings.length?'v48Alert':'');
    renderAudit(d);
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(renderStatus);}
  el('auditV48').addEventListener('click',()=>{auditVisible=!auditVisible;schedule();if(auditVisible)el('v48AuditDetails').scrollIntoView({block:'nearest'});});
  el('downloadAuditV48').addEventListener('click',()=>{
    const d=diagnostics();
    const content=['ENGENHAR — DIAGNÓSTICO PREVENTIVO V108','Projeto: '+(el('project')?.value||'(sem nome)'),
      'Data: '+new Date().toLocaleString('pt-BR'),'Paredes: '+d.walls,'Paredes conferidas: '+d.confirmed,
      'Blocos ativos: '+d.activeBlocks,'Resultados pendentes: '+d.pending,'',
      'ERROS ('+d.errors.length+')',...(d.errors.length?d.errors:['Nenhum erro de entrada identificado.']),'',
      'AVISOS ('+d.warnings.length+')',...(d.warnings.length?d.warnings:['Nenhum aviso identificado.']),'',
      'Verificação preventiva; não substitui revisão técnica.'].join('\r\n');
    download('Diagnostico_Modulacao_V108.txt','\ufeff'+content,'text/plain;charset=utf-8');
  });
  // Preserva cancelamento do cálculo em andamento; bloqueia apenas entradas geometricamente inválidas.
  const originalGenerate=el('generate').onclick;
  el('generate').onclick=function(event){
    if(typeof activeGeneration19!=='undefined'&&activeGeneration19)return originalGenerate.call(this,event);
    const d=diagnostics();
    if(d.errors.length){auditVisible=true;renderStatus();showStatus('Corrija '+d.errors.length+' erro(s) de entrada indicados em Conferir projeto antes de gerar.');el('v48AuditDetails').scrollIntoView({block:'nearest'});return;}
    return originalGenerate.call(this,event);
  };
  // Abertura e salvamento continuam usando os métodos originais; os indicadores são auxiliares.
  const originalSave=el('save').onclick;
  el('save').onclick=function(event){
    const result=originalSave.call(this,event);
    lastSavedMessage='Cópia JSON V108 baixada nesta sessão. Guarde o arquivo em sua pasta.';
    el('v48SaveNote').textContent=lastSavedMessage;
    schedule();
    return result;
  };
  const originalRestore=el('restore').onchange;
  el('restore').onchange=async function(event){
    await originalRestore.call(this,event);
    schedule();
  };
  const originalNew=el('newProject').onclick;
  el('newProject').onclick=function(event){const result=originalNew.call(this,event);schedule();return result;};
  const originalExample=el('example').onclick;
  el('example').onclick=function(event){const result=originalExample.call(this,event);schedule();return result;};
  document.addEventListener('input',event=>{if(event.target?.closest('#controls,#v48ProjectPanel')){el('v48SaveNote').textContent='Há dados editados nesta sessão. Salve uma nova cópia JSON.';schedule();}},true);
  document.addEventListener('change',event=>{if(event.target?.closest('#controls,#v48ProjectPanel'))schedule();},true);
  ['walls','blocks','output'].forEach(id=>{const target=el(id);if(target)new MutationObserver(schedule).observe(target,{childList:true,subtree:false});});
  schedule();
})();
