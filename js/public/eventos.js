(function () {
  'use strict';
  const { html, $, $$, setHTML, loading, errorState, emptyState, pagination, plural, debounce } = CNJ.ui;
  const C = CNJ.components;
  const params = C.readParams();
  let periodo = params.periodo === 'realizados' ? 'realizados' : 'futuros';
  let page = Number(params.page) || 1;
  let events = [];
  let request = 0;
  const search = $('#event-search');
  search.value = params.q || '';

  async function load() {
    const list = $('#event-list');
    const current = ++request;
    loading(list);
    $$('[data-period]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.period === periodo)));
    try {
      const q = search.value.trim();
      const res = await CNJ.repo.list('eventos', { publico: true, periodo, q, page, pageSize: CNJ.config.PAGE_SIZE.eventos });
      if (current !== request) return;
      page = res.page || page;
      events = res.items;
      C.writeParams({ periodo: periodo === 'realizados' ? periodo : '', q, page });
      $('#event-count').textContent = plural(res.total, 'evento', 'eventos');
      setHTML(list, events.length ? html`<ul class="event-list">${events.map(C.eventRow)}</ul>`
        : emptyState('Sem eventos', q ? 'Nenhum evento corresponde à pesquisa.' : (periodo === 'futuros' ? 'Não há eventos agendados de momento.' : 'Ainda não há eventos realizados.')));
      pagination($('#event-pagination'), { page, pageSize: CNJ.config.PAGE_SIZE.eventos, total: res.total, onChange: (p) => { page = p; load(); $('#event-filters').scrollIntoView(); } });
    } catch (err) {
      if (current === request) errorState(list, err, load);
    }
  }
  $$('[data-period]').forEach((b) => b.addEventListener('click', () => { periodo = b.dataset.period; page = 1; load(); }));
  search.addEventListener('input', debounce(() => { page = 1; load(); }));
  $('#event-filters').addEventListener('submit', (e) => { e.preventDefault(); page = 1; load(); });
  C.bindEvents($('#event-list'), () => events);
  load();
})();
