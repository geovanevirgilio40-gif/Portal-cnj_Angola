/** Utilitários de interface partilhados pela área pública e administrativa. */
(function () {
  'use strict';

  /* ---------- HTML seguro ---------- */
  const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const escape = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c]);

  /** Marca texto já seguro, para não ser escapado novamente. */
  class SafeHTML { constructor(s) { this.value = s; } toString() { return this.value; } }
  const raw = (s) => new SafeHTML(s);

  /** Template literal que escapa automaticamente todos os valores (protecção XSS). */
  function html(strings, ...values) {
    const render = (v) => {
      if (v instanceof SafeHTML) return v.value;
      if (Array.isArray(v)) return v.map(render).join('');
      if (v === null || v === undefined || v === false) return '';
      return escape(v);
    };
    return raw(strings.reduce((out, s, i) => out + s + (i < values.length ? render(values[i]) : ''), ''));
  }

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const setHTML = (el, content) => { el.innerHTML = Array.isArray(content) ? content.join('') : String(content); };

  /** Aceita apenas ligações http(s) (evita "javascript:" vindo de dados). */
  const safeUrl = (u) => (/^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '');

  /* ---------- Datas (pt-AO) ---------- */
  const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  function toDate(value) {
    if (!value) return null;
    // "AAAA-MM-DD" é interpretado como data local (e não UTC)
    const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? value + 'T00:00' : value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const pad = (n) => String(n).padStart(2, '0');
  const formatDate = (v) => { const d = toDate(v); return d ? `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}` : 'Sem data'; };
  const formatTime = (v) => { const d = toDate(v); return d ? `${pad(d.getHours())}h${pad(d.getMinutes())}` : ''; };
  const formatDateTime = (v) => (toDate(v) ? `${formatDate(v)}, ${formatTime(v)}` : 'Sem data');
  const shortMonth = (v) => { const d = toDate(v); return d ? MONTHS[d.getMonth()].slice(0, 3) : ''; };

  /** Normaliza texto para pesquisas sem distinção de acentos. */
  const normalize = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  /* ---------- Ícones (SVG em linha) ---------- */
  const ICONS = {
    menu: 'M4 6h16M4 12h16M4 18h16', close: 'M6 6l12 12M18 6L6 18',
    mail: 'M3 6h18v12H3zM3 7l9 6 9-6', phone: 'M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
    pin: 'M12 21s7-6.200 7-11.500a7 7 0 0 0-14 0C5 14.800 12 21 12 21zM12 12a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5z',
    home: 'M3 11l9-7 9 7M5 10v10h14V10', doc: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7',
    news: 'M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M7 9h7M7 12h7M7 15h4',
    image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.500 9.500h.01', calendar: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5',
    users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 7M18 15a7 7 0 0 1 4 6',
    history: 'M3 12a9 9 0 1 0 3-6.700L3 8M3 3v5h5M12 8v5l3 2', settings: 'M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4'
  };
  const icon = (name) => raw(`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[name] || ''}"/></svg>`);

  /* ---------- Estados ---------- */
  const loading = (el, text = 'A carregar…') => setHTML(el, html`<div class="state" role="status"><div class="spinner" aria-hidden="true"></div>${text}</div>`);
  const emptyState = (title, text, action) => html`<div class="state"><h3>${title}</h3><p>${text}</p>${action ? html`<button type="button" class="btn btn-outline btn-small" data-state-action>${action}</button>` : ''}</div>`;
  function errorState(el, error, retry) {
    setHTML(el, html`<div class="state" role="alert"><h3>Não foi possível carregar</h3><p>${error?.message || 'Ocorreu um erro inesperado.'}</p>${retry ? html`<button type="button" class="btn btn-outline btn-small" data-retry>Tentar novamente</button>` : ''}</div>`);
    if (retry) $('[data-retry]', el)?.addEventListener('click', retry);
  }

  /* ---------- Notificações ---------- */
  function toast(message, type = 'info', duration = 6000) {
    // Dentro de um <dialog> aberto, a notificação tem de pertencer ao diálogo para ficar visível.
    const dialogs = $$('dialog[open]');
    const dialog = dialogs[dialogs.length - 1];
    // Nos modais fica no cabeçalho, para não tapar os botões do formulário.
    const host = dialog ? $('.modal-head', dialog) || dialog : document.body;
    let region = $(':scope > .toast-region', host);
    if (!region) {
      region = document.createElement('div');
      region.className = 'toast-region';
      host.appendChild(region);
    }
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    setHTML(el, html`<span>${message}</span><button type="button" aria-label="Fechar notificação">×</button>`);
    el.querySelector('button').addEventListener('click', () => el.remove());
    region.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }
  /** Mensagem a mostrar depois de mudar de página. */
  const flash = (message, type) => { try { sessionStorage.setItem('cnj.flash', JSON.stringify({ message, type })); } catch (_) { /* opcional */ } };
  function showFlash() {
    try {
      const data = JSON.parse(sessionStorage.getItem('cnj.flash'));
      sessionStorage.removeItem('cnj.flash');
      if (data) toast(data.message, data.type);
    } catch (_) { /* opcional */ }
  }

  /* ---------- Modais (elemento nativo <dialog>) ---------- */
  let modalId = 0;
  function modal({ title, body, small = false, onClose, beforeClose }) {
    const id = `modal-title-${++modalId}`;
    const dialog = document.createElement('dialog');
    dialog.className = `modal${small ? ' modal-small' : ''}`;
    dialog.setAttribute('aria-labelledby', id);
    setHTML(dialog, html`<div class="modal-head"><h2 id="${id}">${title}</h2><button type="button" class="btn btn-outline btn-small" data-close>Fechar</button></div><div class="modal-body">${body}</div>`);
    document.body.appendChild(dialog);
    const close = () => { dialog.close(); };
    const requestClose = async () => { if (!beforeClose || await beforeClose()) close(); };
    dialog.addEventListener('close', () => { dialog.remove(); onClose?.(); });
    dialog.addEventListener('cancel', (e) => { e.preventDefault(); requestClose(); });
    dialog.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) requestClose(); });
    dialog.showModal();
    return { el: dialog, body: $('.modal-body', dialog), close };
  }

  function confirmDialog({ title = 'Confirmar', message, confirmText = 'Confirmar', danger = false }) {
    return new Promise((resolve) => {
      let answer = false;
      const m = modal({
        title, small: true, onClose: () => resolve(answer),
        body: html`<p>${message}</p><div class="form-actions"><button type="button" class="btn btn-outline" data-close autofocus>Cancelar</button><button type="button" class="btn ${danger ? 'btn-danger' : ''}" data-ok>${confirmText}</button></div>`
      });
      $('[data-ok]', m.el).addEventListener('click', () => { answer = true; m.close(); });
    });
  }

  /* ---------- Paginação ---------- */
  function pagination(container, { page, pageSize, total, onChange }) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (pages <= 1) { container.innerHTML = ''; return; }
    const numbers = [...Array(pages).keys()].map((i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
    const items = [];
    numbers.forEach((n, i) => {
      if (i && n - numbers[i - 1] > 1) items.push(html`<span aria-hidden="true">…</span>`);
      items.push(html`<button type="button" data-page="${n}" aria-label="Página ${n}" ${n === page ? raw('aria-current="page"') : ''}>${n}</button>`);
    });
    setHTML(container, html`<button type="button" data-page="${page - 1}" ${page === 1 ? raw('disabled') : ''}>Anterior</button>${items}<button type="button" data-page="${page + 1}" ${page === pages ? raw('disabled') : ''}>Seguinte</button>`);
    $$('button[data-page]', container).forEach((b) => b.addEventListener('click', () => onChange(Number(b.dataset.page))));
  }

  CNJ.ui = { html, raw, escape, $, $$, setHTML, safeUrl, formatDate, formatTime, formatDateTime, shortMonth, toDate, normalize, debounce, plural, icon, loading, emptyState, errorState, toast, flash, showFlash, modal, confirmDialog, pagination };
})();
