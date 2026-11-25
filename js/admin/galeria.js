CNJ.admin.start(() => {
  'use strict';
  const { html, raw, $, $$, setHTML, loading, errorState, emptyState, pagination, debounce, plural, modal, confirmDialog, toast } = CNJ.ui;
  const F = CNJ.forms;
  const cats = CNJ.catalog.galeria;
  const root = $('#manager');
  const catOptions = (selected) => cats.map((c) => html`<option value="${c}" ${c === selected ? raw('selected') : ''}>${c}</option>`);
  let page = 1;
  let items = [];
  let request = 0;

  setHTML(root, html`<div class="admin-intro"><p>Carregue várias fotografias de uma vez, escreva as legendas e organize-as por categoria.</p><button type="button" class="btn" id="create">Carregar fotografias</button></div>
    <form class="toolbar" id="filters" role="search"><div class="field field-grow"><label for="q">Pesquisar pela legenda</label><input type="search" id="q" autocomplete="off"></div>
    <div class="field"><label for="fcat">Categoria</label><select id="fcat"><option value="">Todas</option>${catOptions()}</select></div></form>
    <p class="result-count" id="count" aria-live="polite"></p><div class="admin-gallery" id="list"></div><nav class="pagination" id="pages" aria-label="Paginação"></nav>`);
  const q = $('#q');
  const fcat = $('#fcat');
  const list = $('#list');
  const reload = () => { page = 1; load(); };
  q.addEventListener('input', debounce(reload));
  fcat.addEventListener('change', reload);
  $('#filters').addEventListener('submit', (e) => { e.preventDefault(); reload(); });

  async function load() {
    const current = ++request;
    loading(list);
    try {
      const pageSize = CNJ.config.PAGE_SIZE.galeria;
      const res = await CNJ.repo.list('galeria', { q: q.value.trim(), categoria: fcat.value, page, pageSize });
      if (current !== request) return;
      page = res.page || page;
      items = res.items;
      $('#count').textContent = plural(res.total, 'fotografia', 'fotografias');
      setHTML(list, items.length ? items.map((p) => html`<article class="card"><img class="card-media" src="${CNJ.asset(p.imagens[0])}" alt="${p.legenda}" loading="lazy">
        <div class="card-body"><div class="meta"><span class="tag">${p.categoria}</span></div><p>${p.legenda}</p><div class="row-actions card-link"><button type="button" class="btn btn-outline btn-small" data-edit="${p.id}">Editar<span class="sr-only">: ${p.legenda}</span></button><button type="button" class="btn btn-outline btn-small" data-delete="${p.id}">Eliminar<span class="sr-only">: ${p.legenda}</span></button></div></div></article>`)
        : emptyState('Sem fotografias', 'Não há fotografias para os filtros escolhidos.'));
      pagination($('#pages'), { page, pageSize, total: res.total, onChange: (x) => { page = x; load(); } });
    } catch (err) {
      if (current === request) errorState(list, err, load);
    }
  }

  /* ---------- Carregamento múltiplo ---------- */
  function openUpload() {
    let queue = [];
    let saving = false;
    let serial = 0;
    const m = modal({
      title: 'Carregar fotografias',
      onClose: () => { queue.forEach((x) => URL.revokeObjectURL(x.preview)); load(); },
      beforeClose: async () => !saving && (!queue.length || confirmDialog({ title: 'Descartar fotografias?', message: 'As fotografias ainda não guardadas serão retiradas.', confirmText: 'Descartar', danger: true })),
      body: html`<form novalidate>
        <div class="field"><label for="up-files">Ficheiros</label><input type="file" id="up-files" multiple accept="${CNJ.config.UPLOAD.TYPES.join(',')}"><span class="field-hint">JPG, PNG ou WebP, até ${CNJ.config.UPLOAD.MAX_BYTES / 1048576} MB cada, máximo de ${CNJ.config.UPLOAD.MAX_FILES} de cada vez.</span></div>
        <div class="field"><label for="up-cat">Categoria</label><select id="up-cat" name="categoria" required><option value="">Escolher…</option>${catOptions()}</select></div>
        <ul class="previews"></ul><p class="alert alert-error" data-error role="alert" hidden></p>
        <div class="form-actions"><button type="submit" class="btn">Guardar fotografias</button></div></form>`
    });
    const form = $('form', m.el);
    const previews = $('.previews', m.el);
    const errorBox = $('[data-error]', m.el);
    F.liveValidation(form);

    // Cada fotografia tem o seu nó próprio: as legendas escritas não se perdem ao acrescentar outras.
    function add(file) {
      const entry = { file, preview: URL.createObjectURL(file), key: ++serial };
      const li = document.createElement('li');
      setHTML(li, html`<img src="${entry.preview}" alt="Pré-visualização de ${file.name}"><div class="field"><label for="leg-${entry.key}">Legenda</label><input id="leg-${entry.key}" name="legenda-${entry.key}" data-label="Legenda" required maxlength="160"></div><button type="button" class="btn btn-outline btn-small">Remover</button>`);
      entry.el = li;
      li.querySelector('button').addEventListener('click', () => drop(entry));
      queue.push(entry);
      previews.appendChild(li);
    }
    function drop(entry) {
      URL.revokeObjectURL(entry.preview);
      entry.el.remove();
      queue = queue.filter((x) => x !== entry);
    }
    $('#up-files', m.el).addEventListener('change', (e) => {
      for (const file of e.target.files) {
        const problem = F.checkImage(file);
        if (problem) { toast(problem, 'error'); continue; }
        if (queue.length >= CNJ.config.UPLOAD.MAX_FILES) { toast('Atingiu o máximo de fotografias por carregamento.', 'warning'); break; }
        add(file);
      }
      e.target.value = '';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (saving) return;
      errorBox.hidden = true;
      if (!queue.length) { errorBox.textContent = 'Escolha pelo menos uma fotografia.'; errorBox.hidden = false; return; }
      if (!F.validate(form)) return;
      saving = true;
      const button = form.querySelector('[type="submit"]');
      F.busy(button, true, 'A guardar…');
      let saved = 0;
      try {
        for (const entry of [...queue]) {
          const url = await CNJ.repo.storeImage(entry.file, 'galeria');
          await CNJ.repo.save('galeria', { legenda: entry.el.querySelector('input').value.trim(), categoria: form.elements.categoria.value, data: CNJ.repo.now().slice(0, 10), imagens: [url] });
          drop(entry); // as já guardadas saem da fila, para não se duplicarem numa nova tentativa
          saved += 1;
        }
        m.close();
        page = 1;
        toast(`${plural(saved, 'fotografia guardada', 'fotografias guardadas')}${CNJ.isDemo() ? ' na demonstração local' : ''}.`, 'success');
      } catch (err) {
        errorBox.textContent = `${saved ? `Foram guardadas ${saved}. ` : ''}As restantes não foram guardadas. ${err.message}`;
        errorBox.hidden = false;
        F.busy(button, false);
      } finally {
        saving = false;
      }
    });
  }

  function openEdit(photo) {
    let picker;
    const m = modal({
      title: 'Editar fotografia', onClose: () => picker?.destroy(),
      body: html`<form novalidate><div data-picker></div>
        <div class="field"><label for="e-leg">Legenda</label><input id="e-leg" name="legenda" required maxlength="160" value="${photo.legenda}"></div>
        <div class="field"><label for="e-cat">Categoria</label><select id="e-cat" name="categoria" required>${catOptions(photo.categoria)}</select></div>
        <p class="alert alert-error" data-error role="alert" hidden></p>
        <div class="form-actions"><button type="button" class="btn btn-outline" data-close>Cancelar</button><button type="submit" class="btn">Guardar alterações</button></div></form>`
    });
    const form = $('form', m.el);
    picker = CNJ.imagePicker($('[data-picker]', form), { initial: photo.imagens, max: 1, label: 'Substituir fotografia' });
    F.liveValidation(form);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!F.validate(form)) return;
      const errorBox = $('[data-error]', form);
      if (!picker.count) { errorBox.textContent = 'É necessário manter uma fotografia.'; errorBox.hidden = false; return; }
      const button = form.querySelector('[type="submit"]');
      F.busy(button, true, 'A guardar…');
      try {
        await CNJ.repo.save('galeria', { ...photo, ...F.values(form), imagens: await picker.commit('galeria') });
        m.close(); toast('Fotografia actualizada.', 'success'); load();
      } catch (err) {
        errorBox.textContent = `Não foi possível guardar. ${err.message}`; errorBox.hidden = false; F.busy(button, false);
      }
    });
  }

  $('#create').addEventListener('click', openUpload);
  list.addEventListener('click', async (e) => {
    const edit = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-delete]');
    const found = items.find((i) => i.id === (edit?.dataset.edit || del?.dataset.delete));
    if (!found) return;
    if (edit) { openEdit(found); return; }
    if (!await confirmDialog({ title: 'Eliminar fotografia?', message: `Vai eliminar «${found.legenda}». Esta acção não pode ser anulada.`, confirmText: 'Eliminar', danger: true })) return;
    try { await CNJ.repo.remove('galeria', found.id); toast('Fotografia eliminada.', 'success'); load(); }
    catch (err) { toast(`Não foi possível eliminar. ${err.message}`, 'error'); }
  });
  load();
});
