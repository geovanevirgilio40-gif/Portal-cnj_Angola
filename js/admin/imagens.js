/** Selector de fotografias com pré-visualização, remoção e escolha da principal. */
(function () {
  'use strict';
  const { html, $, setHTML, toast } = CNJ.ui;

  function imagePicker(container, { initial = [], max = CNJ.config.UPLOAD.MAX_FILES, label = 'Carregar fotografias' } = {}) {
    let items = initial.map((url) => ({ url }));
    let changed = false;
    const id = `files-${Math.random().toString(36).slice(2, 7)}`;
    setHTML(container, html`<div class="field"><label for="${id}">${label}</label><input type="file" id="${id}" accept="${CNJ.config.UPLOAD.TYPES.join(',')}" ${max > 1 ? CNJ.ui.raw('multiple') : ''}>
      <span class="field-hint">JPG, PNG ou WebP, até ${CNJ.config.UPLOAD.MAX_BYTES / 1048576} MB cada. ${max > 1 ? `Máximo de ${max}. A primeira é a fotografia principal.` : 'Escolher um novo ficheiro substitui o actual.'}</span></div><ul class="previews" aria-live="polite"></ul>`);
    const input = $('input', container);
    const list = $('ul', container);

    const draw = () => setHTML(list, items.map((it, i) => html`<li><img src="${it.preview || CNJ.asset(it.url)}" alt="Pré-visualização ${i + 1}">
      ${max > 1 ? (i === 0 ? html`<span class="tag tag-gold">Principal</span>` : html`<button type="button" class="btn btn-outline btn-small" data-first="${i}">Tornar principal</button>`) : ''}
      <button type="button" class="btn btn-outline btn-small" data-remove="${i}">Remover<span class="sr-only"> fotografia ${i + 1}</span></button></li>`));

    const release = (it) => { if (it.preview) URL.revokeObjectURL(it.preview); };

    input.addEventListener('change', () => {
      for (const file of input.files) {
        const problem = CNJ.forms.checkImage(file);
        if (problem) { toast(problem, 'error'); continue; }
        if (max === 1) { items.forEach(release); items = []; }
        if (items.length >= max) { toast(`Só pode juntar ${max} fotografias.`, 'warning'); break; }
        items.push({ file, preview: URL.createObjectURL(file) });
        changed = true;
      }
      input.value = '';
      draw();
    });
    list.addEventListener('click', (e) => {
      const remove = e.target.closest('[data-remove]');
      const first = e.target.closest('[data-first]');
      if (remove) release(items.splice(Number(remove.dataset.remove), 1)[0]);
      else if (first) items.unshift(...items.splice(Number(first.dataset.first), 1));
      else return;
      changed = true;
      draw();
    });
    draw();

    return {
      get count() { return items.length; },
      get changed() { return changed; },
      /** Guarda os ficheiros novos e devolve a lista final de URLs. */
      async commit(folder) {
        for (const it of items) {
          if (it.file) {
            const url = await CNJ.repo.storeImage(it.file, folder);
            release(it);
            delete it.file; delete it.preview;
            it.url = url; // se algo falhar depois, não se repete o envio
          }
        }
        return items.map((i) => i.url);
      },
      destroy() { items.forEach(release); }
    };
  }

  CNJ.imagePicker = imagePicker;
})();
