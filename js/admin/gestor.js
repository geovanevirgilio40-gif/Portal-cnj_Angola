/**
 * Gestor genérico (listar, pesquisar, filtrar, criar, editar, eliminar)
 * usado por Publicações, Notícias e Eventos.
 */
(function () {
  'use strict';
  const { html, raw, $, setHTML, loading, errorState, emptyState, pagination, debounce, plural, modal, confirmDialog, toast, formatDate, formatDateTime } = CNJ.ui;
  const F = CNJ.forms;

  const statusClass = { publicado: 'tag-success', rascunho: 'tag-gold', arquivado: '', cancelado: 'tag-danger' };
  const options = (entries, selected) => entries.map(([v, l]) => html`<option value="${v}" ${v === selected ? raw('selected') : ''}>${l}</option>`);

  /** Cada campo: { name, label, type, required, max, categories, half } */
  function fieldHTML(f, value = '') {
    const id = `f-${f.name}`;
    const attrs = raw(`id="${id}" name="${f.name}"${f.required ? ' data-publish-required' : ''}${f.max ? ` maxlength="${f.max}"` : ''}`);
    let control;
    if (f.type === 'textarea') control = html`<textarea ${attrs}>${value}</textarea>`;
    else if (f.type === 'select') control = html`<select ${attrs}><option value="">Escolher…</option>${options(f.categories.map((c) => [c, c]), value)}</select>`;
    else control = html`<input ${attrs} type="${f.type || 'text'}" value="${value}">`;
    return html`<div class="field"><label for="${id}">${f.label}</label>${control}</div>`;
  }

  function manager(config, user) {
    const { resource, singular, article = 'a', fields, dateField = 'data', categories, filterCategory = true } = config;
    const states = CNJ.catalog.estados[resource];
    const root = $('#manager');
    const newLabel = `${article === 'a' ? 'Nova' : 'Novo'} ${singular}`;
    let page = 1;
    let items = [];
    let request = 0;

    setHTML(root, html`<div class="admin-intro"><p>${config.intro}</p><button type="button" class="btn" id="create">${newLabel}</button></div>
      <form class="toolbar" id="filters" role="search">
        <div class="field field-grow"><label for="q">Pesquisar ${config.plural}</label><input type="search" id="q" placeholder="Escreva uma palavra" autocomplete="off"></div>
        ${filterCategory && categories ? html`<div class="field"><label for="fcat">Categoria</label><select id="fcat"><option value="">Todas</option>${options(categories.map((c) => [c, c]))}</select></div>` : ''}
        <div class="field"><label for="fstate">Estado</label><select id="fstate"><option value="">Todos</option>${options(Object.entries(states))}</select></div>
      </form>
      <p class="result-count" id="count" aria-live="polite"></p><div id="list"></div><nav class="pagination" id="pages" aria-label="Paginação"></nav>`);

    const q = $('#q', root);
    const fcat = $('#fcat', root);
    const fstate = $('#fstate', root);
    const list = $('#list', root);
    const reload = () => { page = 1; load(); };
    q.addEventListener('input', debounce(reload));
    fcat?.addEventListener('change', reload);
    fstate.addEventListener('change', reload);
    $('#filters', root).addEventListener('submit', (e) => { e.preventDefault(); reload(); });

    async function load() {
      const current = ++request;
      loading(list);
      try {
        const pageSize = CNJ.config.PAGE_SIZE.admin;
        const res = await CNJ.repo.list(resource, { q: q.value.trim(), categoria: fcat?.value || '', estado: fstate.value, page, pageSize });
        if (current !== request) return;
        page = res.page || page;
        items = res.items;
        $('#count', root).textContent = plural(res.total, 'registo', 'registos');
        if (!items.length) {
          const filtered = q.value || fcat?.value || fstate.value;
          setHTML(list, emptyState(filtered ? 'Nenhum resultado' : `Ainda não há ${config.plural}`, filtered ? 'Altere a pesquisa ou os filtros.' : 'Crie o primeiro registo.', filtered ? 'Limpar filtros' : newLabel));
          $('[data-state-action]', list).addEventListener('click', () => {
            if (!filtered) { openForm(); return; }
            q.value = ''; fstate.value = ''; if (fcat) fcat.value = ''; reload();
          });
        } else {
          setHTML(list, html`<div class="table-wrap"><table class="table"><caption class="sr-only">Lista de ${config.plural}</caption>
            <thead><tr><th scope="col">Título</th><th scope="col">${config.detailLabel}</th><th scope="col">${dateField === 'inicio' ? 'Data e hora' : 'Data'}</th><th scope="col">Estado</th><th scope="col">Acções</th></tr></thead>
            <tbody>${items.map((it) => html`<tr>
              <td class="cell-main"><div class="table-title">${it.imagens?.[0] ? html`<img src="${CNJ.asset(it.imagens[0])}" alt="">` : ''}<strong>${it.titulo}</strong></div></td>
              <td data-label="${config.detailLabel}">${it[config.detailField] || 'Por definir'}</td>
              <td data-label="Data">${dateField === 'inicio' ? formatDateTime(it.inicio) : formatDate(it[dateField])}</td>
              <td data-label="Estado"><span class="tag ${statusClass[it.estado] || ''}">${states[it.estado] || it.estado}</span></td>
              <td data-label="Acções"><div class="row-actions"><button type="button" class="btn btn-outline btn-small" data-edit="${it.id}">Editar<span class="sr-only">: ${it.titulo}</span></button><button type="button" class="btn btn-outline btn-small" data-delete="${it.id}">Eliminar<span class="sr-only">: ${it.titulo}</span></button></div></td></tr>`)}</tbody></table></div>`);
        }
        pagination($('#pages', root), { page, pageSize, total: res.total, onChange: (p) => { page = p; load(); } });
      } catch (err) {
        if (current === request) errorState(list, err, load);
      }
    }

    function openForm(item = null) {
      let dirty = false;
      let saving = false;
      let picker;
      const editing = Boolean(item);
      const m = modal({
        title: editing ? `Editar ${singular}` : newLabel,
        onClose: () => picker?.destroy(),
        beforeClose: async () => !saving && (!(dirty || picker?.changed) || confirmDialog({ title: 'Descartar alterações?', message: 'As alterações que não guardou serão perdidas.', confirmText: 'Descartar', danger: true })),
        body: html`<form novalidate>
          ${fields.map((f) => fieldHTML(f, item?.[f.name] ?? ''))}
          <div data-picker></div>
          ${editing ? html`<div class="field"><label for="f-estado">Estado</label><select id="f-estado" name="estado">${options(Object.entries(states), item.estado)}</select></div>` : html`<p class="field-hint">Para guardar um rascunho basta o título. Para publicar, preencha todos os campos.</p>`}
          <p class="alert alert-error" data-error role="alert" hidden></p>
          <div class="form-actions">
            ${editing ? html`<button type="submit" class="btn btn-outline" value="manter">Guardar alterações</button>` : ''}
            <button type="submit" class="btn btn-outline" value="rascunho">Guardar rascunho</button>
            <button type="submit" class="btn" value="publicado">Publicar</button>
          </div></form>`
      });
      const form = $('form', m.el);
      picker = CNJ.imagePicker($('[data-picker]', form), { initial: item?.imagens || [] });
      F.liveValidation(form);
      form.addEventListener('input', () => { dirty = true; });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (saving) return;
        const button = e.submitter || form.querySelector('[value="rascunho"]');
        const estado = button.value === 'manter' ? form.elements.estado.value : button.value;
        const strict = estado === 'publicado' || estado === 'cancelado';
        form.querySelectorAll('[data-publish-required]').forEach((c) => { c.required = strict || c.name === 'titulo'; });
        if (!F.validate(form)) { toast('Corrija os campos assinalados.', 'error'); return; }

        const errorBox = $('[data-error]', form);
        errorBox.hidden = true;
        saving = true;
        const buttons = form.querySelectorAll('button[type="submit"]');
        F.busy(button, true, 'A guardar…');
        buttons.forEach((b) => { b.disabled = true; });
        try {
          const data = { ...F.values(form), estado, imagens: await picker.commit(resource) };
          if (item) data.id = item.id;
          if (dateField === 'data') data.data = item?.estado === 'publicado' || !strict ? (item?.data || CNJ.repo.now().slice(0, 10)) : CNJ.repo.now().slice(0, 10);
          await CNJ.repo.save(resource, data);
          m.close();
          const done = estado === 'publicado' ? 'Publicado' : estado === 'rascunho' ? 'Rascunho guardado' : `Guardado como «${states[estado]}»`;
          toast(CNJ.isDemo() ? `${done} na demonstração local.` : `${done}.`, 'success');
          if (!item) page = 1;
          load();
        } catch (err) {
          errorBox.textContent = `Não foi possível guardar. ${err.message}`;
          errorBox.hidden = false;
          buttons.forEach((b) => { b.disabled = false; });
          F.busy(button, false);
        } finally {
          saving = false;
        }
      });
    }

    $('#create', root).addEventListener('click', () => openForm());
    list.addEventListener('click', async (e) => {
      const edit = e.target.closest('[data-edit]');
      const del = e.target.closest('[data-delete]');
      const found = items.find((i) => i.id === (edit?.dataset.edit || del?.dataset.delete));
      if (!found) return;
      if (edit) {
        edit.disabled = true;
        try { openForm(await CNJ.repo.get(resource, found.id)); }
        catch (err) { toast(err.message, 'error'); }
        finally { edit.disabled = false; }
        return;
      }
      if (!await confirmDialog({ title: `Eliminar ${singular}?`, message: `Vai eliminar «${found.titulo}». Esta acção não pode ser anulada.`, confirmText: 'Eliminar', danger: true })) return;
      del.disabled = true;
      try { await CNJ.repo.remove(resource, found.id); toast(CNJ.isDemo() ? 'Eliminado da demonstração local.' : 'Eliminado.', 'success'); load(); }
      catch (err) { toast(`Não foi possível eliminar. ${err.message}`, 'error'); del.disabled = false; }
    });

    load();
    if (new URLSearchParams(location.search).get('novo') === '1') openForm();
  }

  CNJ.manager = manager;
})();
