// V117 — 01. AGRUPAR PAREDES IGUAIS NAS PRANCHAS (economia de folhas)
// Só na montagem das pranchas: a geração da modulação não muda em nada.
// Duas paredes do mesmo pavimento podem sair num quadro só ("Parede 1 = Parede 5 = Parede 9") quando o DESENHO
// pronto delas é idêntico: elevação, corte, 1ª e 2ª fiada, armaduras, grautes e amarração dos encontros.
// Na comparação só se ignoram os números (Parede N, etiquetas de portas/janelas/vigas), a cor do bloco de
// referência da parede vizinha e o tamanho de fonte. A decisão é do projetista: cada grupo pode ser desmarcado
// nas configurações das pranchas. Os quantitativos continuam somando parede por parede.
(function () {
  'use strict';
  const N = Number, $id = id => document.getElementById(id);
  const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch {} return null; };
  let ligado = LS('iguais117') !== '0';
  // bloco da parede vizinha desenhado como contexto na vista da fiada: só a posição ao longo da parede importa
  const contexto = h => h.replace(/<polygon[^>]*?\spoints="([^"]*)"[^>]*><title>Parede \d+ · [^<]*contado na parede de origem<\/title><\/polygon>/g, (_, pts) => {
    const xs = pts.trim().split(/\s+/).map(q => N(q.split(',')[0])).filter(Number.isFinite);
    return '<ctx ' + Math.round(Math.min(...xs) * 10) / 10 + '-' + Math.round(Math.max(...xs) * 10) / 10 + '/>';
  });
  const norm = h => contexto(String(h || ''))
    .replace(/\sfont-size="[^"]*"/g, '')
    .replace(/(bloco de referência da outra parede<\/title><rect[^>]*?) fill="[^"]*"/g, '$1')
    .replace(/\s(on[a-z]+|id|for|data-[\w-]+)="[^"]*"/gi, '')
    .replace(/Parede\s*\d+/g, 'Parede #').replace(/\b([PJVRAN])\d+\b/g, '$1#')
    .replace(/-?\d+\.\d+/g, x => String(Math.round(N(x) * 100) / 100));
  const lista = ns => ns.length <= 4 ? ns.map(n => 'Parede ' + n).join(' = ') : 'Paredes ' + ns.join(' = ');
  const separada = n => !!state.walls[n - 1]?.separar117;
  let ultimo = { grupos: [], economia: 0 };

  function agrupar(d) {
    if (!d?.items?.length) { ultimo = { grupos: [], economia: 0 }; return d; }
    // 1) grupos possíveis (desenhos idênticos), sem olhar a escolha do projetista
    const por = new Map();
    for (const it of d.items) {
      const m = /^Parede (\d+)/.exec(it.title || ''), w = m ? state.walls[N(m[1]) - 1] : null;
      if (!w || !it.html || /pendente/.test(it.title)) continue;
      const chave = N(w.page || 1) + '|' + Math.round(it.w) + 'x' + Math.round(it.h) + '|' + norm(it.html);
      if (!por.has(chave)) por.set(chave, []); por.get(chave).push({ it, n: N(m[1]) });
    }
    const grupos = [...por.values()].filter(g => g.length > 1).map(g => ({ ns: g.map(x => x.n), its: g.map(x => x.it), ativo: ligado && !g.some(x => separada(x.n)) }));
    ultimo = { grupos: grupos.map(g => ({ ns: g.ns, ativo: g.ativo })), economia: grupos.filter(g => g.ativo).reduce((s, g) => s + g.ns.length - 1, 0) };
    // 2) aplica só os grupos marcados
    const fora = new Set();
    for (const g of grupos) {
      if (!g.ativo) continue;
      const it = g.its[0], resto = it.title.replace(/^Parede \d+/, '');
      it.title = lista(g.ns) + resto + ' (' + g.ns.length + ' paredes iguais)';
      if (it.contents27) it.contents27 = it.contents27.replace(/^Parede \d+/, lista(g.ns));
      it.iguais117 = g.ns.slice();
      g.its.slice(1).forEach(x => fora.add(x));
    }
    return fora.size ? { ...d, items: d.items.filter(x => !fora.has(x)) } : d;
  }
  try {
    const cp = collectPlot26;
    collectPlot26 = function (...a) {
      const d = cp.apply(this, a);
      try { return agrupar(d); } catch (e) { console.error('V117 paredes iguais', e); return d; }
    };
  } catch (e) { console.error('V117 paredes iguais', e); }
  // a escolha "detalhar separada" fica na parede (vai no .json) e não é mudança da parede para a modulação
  try { const ss = sourceSignature; sourceSignature = function (w) { if (!w || !w.separar117) return ss(w); const { separar117, ...rest } = w; return ss(rest); }; } catch (e) { console.error('V117 assinatura', e); }

  // ---------------------------------------------------------------- opção e lista de grupos nas pranchas
  const aviso = () => { try { $id('plotStatus26').textContent = 'Configuração alterada. Monte novamente as pranchas.'; } catch {} };
  function opcao() {
    const ref = $id('plotDate27')?.closest('label'); if (!ref || $id('iguais117')) return;
    const l = document.createElement('label'); l.className = 'iguais117';
    l.innerHTML = '<input type="checkbox" id="iguais117"> Agrupar paredes iguais (P1 = P2 = P3)';
    ref.after(l);
    const box = document.createElement('div'); box.id = 'iguaisBox117'; box.className = 'noPrint'; box.hidden = true;
    (ref.parentElement?.parentElement || ref.parentElement).append(box);
    const c = $id('iguais117'); c.checked = ligado;
    c.onchange = () => { ligado = c.checked; LS('iguais117', ligado ? '1' : '0'); aviso(); mostrarGrupos(); };
  }
  function mostrarGrupos() {
    const box = $id('iguaisBox117'); if (!box) return;
    const g = ultimo.grupos;
    if (!g.length) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    box.innerHTML = '<b>Paredes iguais encontradas</b> <span>(desenho idêntico: fiadas, armaduras e encontros). Desmarque o grupo que você quer detalhar separado e monte as pranchas de novo.</span>' +
      '<div class="g117">' + g.map((x, k) => '<label><input type="checkbox" data-g="' + k + '"' + (x.ativo ? ' checked' : '') + (ligado ? '' : ' disabled') + '> P' + x.ns.join(' = P') + '</label>').join('') + '</div>' +
      '<div class="e117">' + (ligado ? (ultimo.economia ? ultimo.economia + ' quadro(s) a menos nas pranchas.' : 'Nenhum grupo marcado.') : 'Agrupamento desligado.') + '</div>';
    box.querySelectorAll('[data-g]').forEach(cb => cb.onchange = () => {
      const x = g[N(cb.dataset.g)];
      for (const n of x.ns) { const w = state.walls[n - 1]; if (!w) continue; if (cb.checked) delete w.separar117; else w.separar117 = true; }
      x.ativo = cb.checked; ultimo.economia = g.filter(y => y.ativo).reduce((s, y) => s + y.ns.length - 1, 0);
      aviso(); mostrarGrupos();
    });
  }
  opcao(); setTimeout(opcao, 800);
  try {
    const bp = buildPlot26;
    buildPlot26 = function (...a) {
      const r = bp.apply(this, a);
      const fim = () => {
        try {
          mostrarGrupos();
          const s = $id('plotStatus26'), u = ultimo;
          if (s && u.economia) s.textContent = s.textContent.replace(/\s*· Paredes iguais:.*$/, '') + ' · Paredes iguais: ' + u.grupos.filter(x => x.ativo).length + ' grupo(s), ' + u.economia + ' quadro(s) a menos.';
        } catch {}
      };
      if (r && typeof r.then === 'function') r.then(fim, () => {}); else fim();
      return r;
    };
  } catch (e) { console.error('V117 resumo', e); }
  window.iguais117 = { ultimo: () => ultimo, ligado: () => ligado, set: v => { ligado = !!v; LS('iguais117', v ? '1' : '0'); }, grupos: mostrarGrupos };

  const css = document.createElement('style');
  css.textContent = `label.iguais117{display:flex;align-items:center;gap:6px;font-weight:600}label.iguais117 input{width:auto;margin:0}
#iguaisBox117{margin:8px 0;padding:8px 10px;border:1px solid #b9d0e6;border-radius:6px;background:#f3f8fd;font-size:12.5px}#iguaisBox117[hidden]{display:none}
#iguaisBox117>span{color:#4a5d70}#iguaisBox117 .g117{display:flex;flex-wrap:wrap;gap:4px 14px;margin:6px 0}#iguaisBox117 .g117 label{display:flex;align-items:center;gap:5px;font-weight:600;white-space:nowrap}
#iguaisBox117 .g117 input{width:auto;margin:0}#iguaisBox117 .e117{color:#1d6b34;font-weight:600}`;
  document.head.append(css);
})();
