(function () {
  'use strict';
  const { html, $, setHTML, loading, errorState, emptyState, pagination, debounce, plural, toast } = CNJ.ui;
  const C = CNJ.components;
  const params = C.readParams();

  async function showArticle(id) {
    $('#news-list-view').hidden = true;
    const view = $('#news-article-view');
    view.hidden = false;
    loading(view, 'A carregar a notícia…');
    try {
      const n = await CNJ.repo.get('noticias', id, { publico: true });
      document.title = `${n.titulo} | CNJ Angola`;
      $('#banner-title').textContent = 'Notícia';
      const paragraphs = String(n.conteudo || n.resumo || '').split(/\n\s*\n/);
      const [main, ...extra] = n.imagens || [];
      setHTML(view, html`<article class="article"><p><a href="noticias.html">Voltar a todas as notícias</a></p>${C.newsMeta(n)}<h2>${n.titulo}</h2><p class="muted">${n.resumo}</p>
        <img src="${CNJ.asset(main || 'assets/images/demo-6.svg')}" alt="Fotografia principal da notícia" width="800" height="450">
        <div class="article-body">${paragraphs.map((p) => html`<p>${p}</p>`)}</div>
        ${extra.length ? html`<div class="article-extra">${extra.map((s) => html`<img src="${CNJ.asset(s)}" alt="Fotografia complementar" loading="lazy">`)}</div>` : ''}
        <div class="article-actions"><button type="button" class="btn btn-outline" id="share">Copiar ligação</button><a class="btn" href="noticias.html">Ver mais notícias</a></div></article>`);
      $('#share').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(location.href); toast('Ligação copiada.', 'success'); }
        catch (_) { toast('Não foi possível copiar. Copie o endereço na barra do navegador.', 'warning'); }
      });
    } catch (err) {
      setHTML(view, html`<div class="state" role="alert"><h3>Notícia indisponível</h3><p>${err.message}</p><a class="btn btn-outline btn-small" href="noticias.html">Voltar às notícias</a></div>`);
    }
  }

  if (params.id) { showArticle(params.id); return; }

  const search = $('#news-search');
  const category = $('#news-category');
  CNJ.catalog.noticias.forEach((c) => category.add(new Option(c, c)));
  search.value = params.q || '';
  category.value = CNJ.catalog.noticias.includes(params.categoria) ? params.categoria : '';
  let page = Number(params.page) || 1;
  let request = 0;

  async function load() {
    const list = $('#news-grid');
    const current = ++request;
    loading(list);
    $('#news-count').textContent = '';
    const query = { q: search.value.trim(), categoria: category.value };
    try {
      const res = await CNJ.repo.list('noticias', { ...query, publico: true, page, pageSize: CNJ.config.PAGE_SIZE.noticias });
      if (current !== request) return; // ignora respostas antigas
      page = res.page || page;
      C.writeParams({ ...query, page });
      $('#news-count').textContent = plural(res.total, 'notícia encontrada', 'notícias encontradas');
      setHTML(list, res.items.length ? res.items.map(C.newsCard) : emptyState('Nenhuma notícia encontrada', 'Experimente outras palavras ou escolha outra categoria.', 'Limpar pesquisa'));
      $('[data-state-action]', list)?.addEventListener('click', () => { search.value = ''; category.value = ''; page = 1; load(); });
      pagination($('#news-pagination'), { page, pageSize: CNJ.config.PAGE_SIZE.noticias, total: res.total, onChange: (p) => { page = p; load(); $('#news-list-view').scrollIntoView(); } });
    } catch (err) {
      if (current === request) { errorState(list, err, load); $('#news-pagination').innerHTML = ''; }
    }
  }
  search.addEventListener('input', debounce(() => { page = 1; load(); }));
  category.addEventListener('change', () => { page = 1; load(); });
  $('#news-filters').addEventListener('submit', (e) => { e.preventDefault(); page = 1; load(); });
  load();
})();
