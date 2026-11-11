// V133 — NUMERAÇÃO AUTOMÁTICA DAS PAREDES NOVAS: parede desenhada depois da última renumeração recebia o próximo número
// livre (Parede 70, 71…) e ficava fora de ordem até clicar em Renumerar. Agora, quando o nível ganha paredes novas e a
// ferramenta de desenho termina (Esc), as paredes do nível são renumeradas sozinhas: de cima para baixo, da esquerda para
// a direita (horizontais e depois verticais). Pode ser desligado na janela 🔢 Renumerar ("Numerar sozinho as paredes novas").
(function () {
  'use strict';
  const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch {} return null; };
  const ligado = () => LS('auto133') !== '0';
  const nivel = () => { try { return window.level68?.current?.() || 'all'; } catch { return 'all'; } };
  const ocupado = () => document.body.classList.contains('wall101') || !!window.ferr56 || document.body.classList.contains('tool56');
  let chave = null, conta = 0, pendente = false, timer = null;

  function renumerar() {
    timer = null;
    if (!pendente || !ligado()) { pendente = false; return; }
    if (ocupado()) { timer = setTimeout(renumerar, 500); return; }
    pendente = false;
    try {
      const nb = document.getElementById('numberWalls');
      if (nb && nb.onclick && state.walls.length > 1) {
        nb.onclick();
        try { renderWalls(); drawPlan(); } catch {}
        const st = document.getElementById('planStatus'); if (st) st.textContent = '🔢 Paredes renumeradas sozinhas (de cima para baixo, da esquerda para a direita). Ctrl+Z desfaz.';
      }
    } catch (e) { console.error('V133', e); }
    conta = state.walls.length;
  }
  function observar() {
    const k = nivel(), n = state.walls.length;
    if (k !== chave) { chave = k; conta = n; return; }
    if (n > conta && ligado()) { pendente = true; if (!timer) timer = setTimeout(renumerar, 400); }
    else if (n < conta) conta = n;
  }
  try { const rw = renderWalls; renderWalls = function (...a) { const r = rw.apply(this, a); try { observar(); } catch (e) { console.error('V133', e); } return r; }; } catch (e) { console.error('V133', e); }
  // quando a ferramenta de desenho termina, renumera o que ficou pendente
  new MutationObserver(() => { if (pendente && !ocupado() && !timer) timer = setTimeout(renumerar, 300); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  // ao abrir um projeto, a contagem recomeça (não renumera o projeto aberto)
  try { const inp = document.getElementById('restore'); if (inp && inp.onchange) { const o = inp.onchange; inp.onchange = async function (...a) { pendente = false; chave = null; const r = await o.apply(this, a); chave = null; observar(); pendente = false; return r; }; } } catch {}

  // opção na janela Renumerar
  const pop = document.getElementById('rn101');
  if (pop) new MutationObserver(() => {
    if (pop.hidden || pop.querySelector('#auto133')) return;
    const a = pop.querySelector('.a101'); if (!a) return;
    const l = document.createElement('label'); l.className = 'auto133';
    l.innerHTML = '<input type="checkbox" id="auto133"> Numerar sozinho as paredes novas';
    a.before(l); const c = l.querySelector('input'); c.checked = ligado();
    c.onchange = () => LS('auto133', c.checked ? '1' : '0');
  }).observe(pop, { attributes: true, childList: true });
  window.auto133 = { ligado, renumerar: () => { pendente = true; renumerar(); } };
})();
