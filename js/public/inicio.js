(function () {
  'use strict';
  const { html, $, setHTML, loading, errorState, emptyState } = CNJ.ui;
  const C = CNJ.components;
  const repo = CNJ.repo;

  /** Carrega uma secção de forma independente: uma falha não afecta as restantes. */
  async function section(selector, fetcher, render) {
    const el = $(selector);
    loading(el);
    try {
      const { items } = await fetcher();
      setHTML(el, items.length ? render(items) : emptyState('Sem conteúdos', 'Ainda não existem conteúdos publicados nesta secção.'));
    } catch (err) {
      errorState(el, err, () => section(selector, fetcher, render));
    }
  }

  section('#home-news', () => repo.list('noticias', { publico: true, pageSize: 4 }), ([lead, ...rest]) => html`<div class="news-feature">
    <article class="lead"><img src="${C.cover(lead)}" alt="" width="800" height="500">${C.newsMeta(lead)}<h3><a href="${C.newsUrl(lead)}">${lead.titulo}</a></h3><p class="muted">${lead.resumo}</p></article>
    <ul class="news-list">${rest.map((n) => html`<li><img src="${C.cover(n)}" alt="" loading="lazy" width="110" height="110"><div>${C.newsMeta(n)}<h3><a href="${C.newsUrl(n)}">${n.titulo}</a></h3></div></li>`)}</ul></div>`);

  let activities = [];
  section('#home-activities', () => repo.list('publicacoes', { publico: true, categoria: 'Actividade', pageSize: 3 }), (items) => {
    activities = items;
    return html`<div class="activity-list">${items.map((a) => html`<article class="activity"><img src="${C.cover(a)}" alt="" loading="lazy"><div><span class="tag tag-gold">${CNJ.ui.formatDate(a.data)}</span><h3>${a.titulo}</h3><p>${a.descricao}</p><button type="button" class="btn btn-ghost-light btn-small" data-activity="${a.id}">Ver actividade<span class="sr-only">: ${a.titulo}</span></button></div></article>`)}</div>`;
  });
  $('#home-activities').addEventListener('click', (e) => {
    const b = e.target.closest('[data-activity]');
    const a = b && activities.find((x) => x.id === b.dataset.activity);
    if (a) CNJ.ui.modal({ title: a.titulo, body: html`<div class="stack">${(a.imagens || []).map((s) => html`<img src="${CNJ.asset(s)}" alt="Fotografia da actividade">`)}<p class="muted">${CNJ.ui.formatDate(a.data)}</p><p>${a.descricao}</p></div>` });
  });

  let events = [];
  section('#home-events', () => repo.list('eventos', { publico: true, periodo: 'futuros', pageSize: 3 }), (items) => {
    events = items;
    return html`<ul class="event-list">${items.map(C.eventRow)}</ul>`;
  });
  C.bindEvents($('#home-events'), () => events);

  let photos = [];
  section('#home-gallery', () => repo.list('galeria', { publico: true, pageSize: 6 }), (items) => {
    photos = items;
    return html`<div class="gallery-grid">${items.map(C.galleryItem)}</div>`;
  });
  C.bindGallery($('#home-gallery'), () => photos);
})();
