(function () {
  'use strict';
  const { html, raw, $, $$, setHTML, loading, errorState, emptyState, pagination, plural } = CNJ.ui;
  const C = CNJ.components;
  const params = C.readParams();
  let categoria = CNJ.catalog.galeria.includes(params.categoria) ? params.categoria : '';
  let page = Number(params.page) || 1;
  let photos = [];
  let request = 0;

  setHTML($('#gallery-filters'), ['', ...CNJ.catalog.galeria].map((c) => html`<button type="button" class="chip" data-category="${c}" aria-pressed="${String(c === categoria)}">${c || 'Todas'}</button>`));
  $('#gallery-filters').addEventListener('click', (e) => {
    const b = e.target.closest('[data-category]');
    if (!b) return;
    categoria = b.dataset.category; page = 1;
    $$('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
    load();
  });

  async function load() {
    const grid = $('#gallery-grid');
    const current = ++request;
    loading(grid);
    try {
      const res = await CNJ.repo.list('galeria', { publico: true, categoria, page, pageSize: CNJ.config.PAGE_SIZE.galeria });
      if (current !== request) return;
      page = res.page || page;
      photos = res.items;
      C.writeParams({ categoria, page });
      $('#gallery-count').textContent = plural(res.total, 'fotografia', 'fotografias');
      setHTML(grid, photos.length ? photos.map(C.galleryItem) : emptyState('Sem fotografias', 'Ainda não há fotografias nesta categoria.'));
      pagination($('#gallery-pagination'), { page, pageSize: CNJ.config.PAGE_SIZE.galeria, total: res.total, onChange: (p) => { page = p; load(); $('#gallery-filters').scrollIntoView(); } });
    } catch (err) {
      if (current === request) errorState(grid, err, load);
    }
  }
  C.bindGallery($('#gallery-grid'), () => photos);
  load();
})();
