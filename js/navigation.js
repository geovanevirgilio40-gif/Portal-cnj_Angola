/** Cabeçalho, menu (incluindo telemóvel) e rodapé da área pública. */
(function () {
  'use strict';
  const { html, raw, setHTML, $, $$, icon, safeUrl, toast } = CNJ.ui;

  const LINKS = [
    ['index.html', 'Início', 'inicio'], ['sobre.html', 'Sobre o CNJ', 'sobre'], ['noticias.html', 'Notícias', 'noticias'],
    ['eventos.html', 'Eventos', 'eventos'], ['galeria.html', 'Galeria', 'galeria'], ['contactos.html', 'Contactos', 'contactos']
  ];
  const SOCIAL = [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['youtube', 'YouTube'], ['x', 'X']];

  const brand = (logo) => html`<a class="brand" href="index.html"><img data-logo src="${CNJ.asset(logo)}" alt="Espaço reservado para o logótipo do CNJ" width="52" height="52"><span class="brand-name"><strong>CNJ Angola</strong><span>Conselho Nacional de Juventude</span></span></a>`;

  function renderHeader(page) {
    const header = $('#site-header');
    const demo = CNJ.isDemo() ? html`<p class="demo-strip">Versão de demonstração: os conteúdos, datas e imagens são exemplos e não constituem informação oficial do CNJ.</p>` : '';
    header.insertAdjacentHTML('beforebegin', String(demo));
    header.className = 'site-header';
    setHTML(header, html`<div class="container header-inner">${brand(CNJ.config.LOGO_PATH)}
      <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="main-nav">${icon('menu')}<span class="nav-toggle-text">Menu</span></button>
      <nav class="main-nav" id="main-nav" aria-label="Navegação principal"><ul>${LINKS.map(([href, label, key]) => html`<li><a href="${href}" ${key === page ? raw('aria-current="page"') : ''}>${label}</a></li>`)}</ul></nav></div>`);

    const button = $('.nav-toggle', header);
    const nav = $('#main-nav', header);
    const toggle = (open) => {
      nav.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
      button.querySelector('path').setAttribute('d', open ? 'M6 6l12 12M18 6L6 18' : 'M4 6h16M4 12h16M4 18h16');
    };
    button.addEventListener('click', () => toggle(!nav.classList.contains('is-open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) toggle(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { toggle(false); button.focus(); } });
    document.addEventListener('click', (e) => { if (!header.contains(e.target)) toggle(false); });
    header.addEventListener('focusout', (e) => { if (e.relatedTarget && !header.contains(e.relatedTarget)) toggle(false); });
    window.matchMedia('(min-width: 1025px)').addEventListener('change', () => toggle(false));
  }

  /** Dado institucional ou indicação clara de que ainda não foi fornecido. */
  const value = (v, placeholder) => (v ? html`<span>${v}</span>` : html`<span class="provisional">${placeholder}</span>`);

  /** Redes sociais: ligação real quando configurada; caso contrário, botão que explica. */
  const social = (settings) => html`<div class="social">${SOCIAL.map(([key, label]) => safeUrl(settings[key])
    ? html`<a href="${safeUrl(settings[key])}" target="_blank" rel="noopener noreferrer">${label}</a>`
    : html`<button type="button" data-social="${label}">${label}</button>`)}</div>`;

  function renderFooter(settings) {
    const footer = $('#site-footer');
    footer.className = 'site-footer';
    setHTML(footer, html`<div class="container"><div class="footer-grid">
      <div>${brand(settings.logotipo || CNJ.config.LOGO_PATH)}<p>Portal institucional para divulgação de notícias, eventos, comunicados e actividades do Conselho Nacional de Juventude de Angola.</p></div>
      <div><h2>Navegação</h2><ul>${LINKS.map(([href, label]) => html`<li><a href="${href}">${label}</a></li>`)}</ul></div>
      <div><h2>Contactos</h2><ul><li>${value(settings.email, 'Email por definir')}</li><li>${value(settings.telefone, 'Telefone por definir')}</li><li>${value(settings.endereco, 'Endereço por definir')}</li></ul></div>
      <div><h2>Redes sociais</h2>${social(settings)}</div></div>
      <div class="footer-bottom"><span>© ${new Date().getFullYear()} Conselho Nacional de Juventude de Angola</span><a href="admin/entrar.html">Área administrativa</a></div></div>`);
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-social]');
    if (b) toast(`O endereço oficial da página no ${b.dataset.social} ainda não foi configurado.`, 'info');
  });

  async function init() {
    renderHeader(document.body.dataset.page);
    let settings = {};
    try { settings = await CNJ.repo.getSettings({ publico: true }); } catch (_) { /* o rodapé mostra os campos por definir */ }
    renderFooter(settings);
    if (settings.logotipo) $$('[data-logo]').forEach((i) => { i.src = CNJ.asset(settings.logotipo); i.alt = 'Logótipo do CNJ'; });
    document.dispatchEvent(new CustomEvent('cnj:settings', { detail: settings }));
  }

  CNJ.navigation = { social, value };
  CNJ.settingsReady = new Promise((resolve) => document.addEventListener('cnj:settings', (e) => resolve(e.detail), { once: true }));
  init();
})();
