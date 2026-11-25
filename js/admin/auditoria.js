CNJ.admin.start(() => {
  'use strict';
  const { html, $, setHTML, loading, errorState, emptyState, pagination, debounce, plural, formatDateTime } = CNJ.ui;
  const form = $('#audit-filters');
  const list = $('#audit-list');
  const tags = { criou: 'tag-success', editou: 'tag-gold', eliminou: 'tag-danger' };
  const labels = { criou: 'Criou', editou: 'Editou', eliminou: 'Eliminou' };
  let page = 1;
  let request = 0;

  async function load() {
    const current = ++request;
    const f = CNJ.forms.values(form);
    const invalid = f.de && f.ate && f.de > f.ate;
    CNJ.forms.setError(form.elements.ate, invalid ? 'A data final é anterior à data inicial.' : '');
    if (invalid) return;
    loading(list);
    try {
      const pageSize = CNJ.config.PAGE_SIZE.admin;
      const res = await CNJ.repo.list('auditoria', { ...f, page, pageSize });
      if (current !== request) return;
      page = res.page || page;
      $('#audit-count').textContent = plural(res.total, 'operação', 'operações');
      setHTML(list, res.items.length ? html`<div class="table-wrap"><table class="table"><caption class="sr-only">Registo de auditoria</caption><thead><tr><th scope="col">Data e hora</th><th scope="col">Quem</th><th scope="col">Operação</th><th scope="col">Tipo</th><th scope="col">Registo</th></tr></thead><tbody>${res.items.map((a) => html`<tr>
        <td data-label="Data e hora">${formatDateTime(a.dataHora)}</td><td data-label="Quem">${a.utilizador}</td><td data-label="Operação"><span class="tag ${tags[a.accao] || ''}">${labels[a.accao] || a.accao}</span></td><td data-label="Tipo">${a.tipo}</td><td data-label="Registo">${a.item}</td></tr>`)}</tbody></table></div>`
        : emptyState('Sem operações', 'Não há registos para os filtros escolhidos.'));
      pagination($('#audit-pages'), { page, pageSize, total: res.total, onChange: (p) => { page = p; load(); } });
    } catch (err) {
      if (current === request) errorState(list, err, load);
    }
  }
  const reload = () => { page = 1; load(); };
  form.addEventListener('input', debounce(reload));
  form.addEventListener('submit', (e) => { e.preventDefault(); reload(); });
  form.addEventListener('reset', () => setTimeout(() => { CNJ.forms.setError(form.elements.ate, ''); reload(); }));
  load();
});
