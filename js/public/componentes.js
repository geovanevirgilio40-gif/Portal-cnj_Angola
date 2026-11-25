/** Componentes de conteúdo reutilizados nas páginas públicas. */
(function () {
  'use strict';
  const { html, formatDate, formatTime, shortMonth, toDate } = CNJ.ui;
  const cover = (item) => CNJ.asset(item.imagens?.[0] || 'assets/images/demo-6.svg');
  const newsUrl = (n) => `noticias.html?id=${encodeURIComponent(n.id)}`;

  const newsMeta = (n) => html`<div class="meta"><span class="tag">${n.categoria}</span><time datetime="${n.data}">${formatDate(n.data)}</time></div>`;

  const newsCard = (n) => html`<article class="card">
    <img class="card-media" src="${cover(n)}" alt="" loading="lazy" width="800" height="500">
    <div class="card-body">${newsMeta(n)}<h3><a href="${newsUrl(n)}">${n.titulo}</a></h3><p>${n.resumo}</p>
    <a class="card-link" href="${newsUrl(n)}">Ler notícia<span class="sr-only">: ${n.titulo}</span></a></div></article>`;

  const eventRow = (e) => {
    const d = toDate(e.inicio);
    return html`<li class="event-row">
      <div class="date-block"><strong>${d ? d.getDate() : '?'}</strong><span>${shortMonth(e.inicio)} ${d ? d.getFullYear() : ''}</span></div>
      <img src="${cover(e)}" alt="" loading="lazy" width="800" height="600">
      <div><h3>${e.titulo}</h3>
        <div class="meta">${e.estado === 'cancelado' ? html`<span class="tag tag-danger">Cancelado</span>` : ''}<span>${formatDate(e.inicio)} às ${formatTime(e.inicio)}</span><span>${e.local}</span></div>
        <p>${e.descricao}</p>
        <button type="button" class="btn btn-outline btn-small" data-event="${e.id}">Ver detalhes<span class="sr-only">: ${e.titulo}</span></button></div></li>`;
  };

  function eventModal(e) {
    CNJ.ui.modal({
      title: e.titulo,
      body: html`<div class="stack">${(e.imagens || []).map((src) => html`<img src="${CNJ.asset(src)}" alt="Fotografia do evento ${e.titulo}">`)}
        ${e.estado === 'cancelado' ? html`<p class="alert alert-error">Este evento foi cancelado.</p>` : ''}
        <p><strong>Data e hora:</strong> ${formatDate(e.inicio)} às ${formatTime(e.inicio)}<br><strong>Localização:</strong> ${e.local}</p><p>${e.descricao}</p></div>`
    });
  }

  /** Liga os botões "Ver detalhes" de uma lista de eventos. */
  function bindEvents(container, getItems) {
    container.addEventListener('click', (ev) => {
      const button = ev.target.closest('[data-event]');
      const item = button && getItems().find((i) => i.id === button.dataset.event);
      if (item) eventModal(item);
    });
  }

  /* ---------- Visualizador de fotografias ---------- */
  function lightbox(photos, start) {
    let index = start;
    const dialog = document.createElement('dialog');
    dialog.className = 'lightbox';
    dialog.setAttribute('aria-label', 'Visualização ampliada da fotografia');
    dialog.innerHTML = '<div class="lightbox-bar"><span data-counter aria-live="polite"></span><button type="button" class="btn btn-ghost-light btn-small" data-close autofocus>Fechar</button></div><div class="lightbox-stage"><img alt=""></div><div class="lightbox-foot"><button type="button" class="btn btn-ghost-light" data-prev>Anterior</button><p data-caption></p><button type="button" class="btn btn-ghost-light" data-next>Seguinte</button></div>';
    document.body.appendChild(dialog);
    const q = (s) => dialog.querySelector(s);
    const show = () => {
      const p = photos[index];
      q('img').src = cover(p);
      q('img').alt = p.legenda;
      q('[data-caption]').textContent = p.legenda;
      q('[data-counter]').textContent = `Fotografia ${index + 1} de ${photos.length}`;
    };
    const step = (n) => { index = (index + n + photos.length) % photos.length; show(); };
    q('[data-prev]').addEventListener('click', () => step(-1));
    q('[data-next]').addEventListener('click', () => step(1));
    q('[data-close]').addEventListener('click', () => dialog.close());
    q('[data-prev]').disabled = q('[data-next]').disabled = photos.length < 2;
    dialog.addEventListener('close', () => dialog.remove());
    dialog.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
    let touchX = null;
    q('.lightbox-stage').addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
    q('.lightbox-stage').addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const delta = e.changedTouches[0].clientX - touchX;
      if (Math.abs(delta) > 50) step(delta < 0 ? 1 : -1);
      touchX = null;
    }, { passive: true });
    show();
    dialog.showModal();
  }

  const galleryItem = (p, i) => html`<figure class="gallery-item"><button type="button" data-photo="${i}" aria-label="Ampliar: ${p.legenda}">
    <img src="${cover(p)}" alt="${p.legenda}" loading="lazy" width="800" height="600"></button>
    <figcaption class="gallery-caption"><small>${p.categoria}</small>${p.legenda}</figcaption></figure>`;

  function bindGallery(container, getPhotos) {
    container.addEventListener('click', (e) => {
      const b = e.target.closest('[data-photo]');
      if (b) lightbox(getPhotos(), Number(b.dataset.photo));
    });
  }

  /** Estado em endereço, para partilhar e usar o botão "voltar". */
  const readParams = () => Object.fromEntries(new URLSearchParams(location.search));
  function writeParams(params) {
    const query = new URLSearchParams(Object.entries(params).filter(([k, v]) => v && !(k === 'page' && Number(v) === 1))).toString();
    try { history.replaceState(null, '', location.pathname + (query ? `?${query}` : '')); } catch (_) { /* opcional */ }
  }

  CNJ.components = { cover, newsUrl, newsMeta, newsCard, eventRow, bindEvents, galleryItem, bindGallery, readParams, writeParams };
})();
