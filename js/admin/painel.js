/** Estrutura comum do painel: guarda de acesso, menu lateral e cabeçalho. */
(function () {
  'use strict';
  const { html, raw, $, setHTML, icon, confirmDialog, toast, flash, showFlash } = CNJ.ui;
  const auth = CNJ.auth;

  const MENU = [
    ['dashboard', 'dashboard.html', 'Painel', 'home'], ['publicacoes', 'publicacoes.html', 'Publicações', 'doc'],
    ['noticias', 'noticias.html', 'Notícias', 'news'], ['galeria', 'galeria.html', 'Galeria', 'image'],
    ['eventos', 'eventos.html', 'Eventos', 'calendar'], ['utilizadores', 'utilizadores.html', 'Administradores', 'users'],
    ['auditoria', 'auditoria.html', 'Auditoria', 'history'], ['configuracoes', 'configuracoes.html', 'Configurações', 'settings']
  ];
  const section = document.body.dataset.section;
  const toLogin = () => { location.replace('entrar.html'); };
  document.addEventListener('cnj:sessao-expirada', toLogin);

  function render(user) {
    const sidebar = $('#sidebar');
    setHTML(sidebar, html`<a class="brand" href="dashboard.html"><img src="${CNJ.asset(CNJ.config.LOGO_PATH)}" alt="Espaço reservado para o logótipo do CNJ" width="44" height="44"><span class="brand-name"><strong>CNJ Angola</strong><span>Área administrativa</span></span></a>
      <nav aria-label="Menu administrativo"><ul>${MENU.filter(([key]) => auth.can(user, key)).map(([key, href, label, i]) => html`<li><a href="${href}" ${key === section ? raw('aria-current="page"') : ''}>${icon(i)}${label}</a></li>`)}</ul></nav>
      <div class="sidebar-foot"><p><strong>${user.nome}</strong><br>${auth.ROLES[user.perfil] || user.perfil}</p><p><a href="../index.html">Ver o portal público</a></p>
      <button type="button" class="btn btn-ghost-light btn-small" id="logout">${user.demo ? 'Sair da demonstração' : 'Terminar sessão'}</button></div>`);

    setHTML($('#admin-header'), html`<button type="button" class="btn btn-outline btn-small sidebar-toggle" aria-expanded="false" aria-controls="sidebar">${icon('menu')}Menu</button><h1>${$('#admin-header').dataset.title}</h1>
      ${user.demo ? html`<div class="field"><label for="demo-role">Pré-visualizar como</label><select id="demo-role">${Object.entries(auth.ROLES).map(([v, l]) => html`<option value="${v}" ${v === user.perfil ? raw('selected') : ''}>${l}</option>`)}</select></div>` : ''}`);

    if (user.demo) {
      $('#conteudo').insertAdjacentHTML('afterbegin', '<p class="alert alert-warning"><strong>Modo de demonstração.</strong> Não há sessão iniciada nem ligação a um servidor. Os registos são exemplos e as alterações ficam apenas neste navegador (localStorage), o que não substitui a base de dados.</p>');
      $('#demo-role').addEventListener('change', (e) => { auth.setDemoRole(e.target.value); location.reload(); });
    }

    /* Menu lateral em ecrãs pequenos */
    const toggle = $('.sidebar-toggle');
    const scrim = $('#scrim');
    const main = $('.admin-main');
    const setOpen = (open) => {
      sidebar.classList.toggle('is-open', open);
      scrim.hidden = !open;
      main.inert = open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) setTimeout(() => sidebar.querySelector('a')?.focus(), 30);
    };
    toggle.addEventListener('click', () => setOpen(true));
    scrim.addEventListener('click', () => { setOpen(false); toggle.focus(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sidebar.classList.contains('is-open')) { setOpen(false); toggle.focus(); } });
    window.matchMedia('(min-width: 1025px)').addEventListener('change', () => setOpen(false));

    $('#logout').addEventListener('click', async () => {
      if (!await confirmDialog({ title: 'Sair', message: user.demo ? 'Quer sair da pré-visualização do painel?' : 'Quer terminar a sessão?', confirmText: 'Sair' })) return;
      if (user.demo) { flash('Saiu da pré-visualização do painel.', 'info'); toLogin(); return; }
      try { await auth.logout(); toLogin(); } catch (err) { toast(`Não foi possível terminar a sessão. ${err.message}`, 'error'); }
    });
  }

  /** Inicia uma página do painel depois de verificar a sessão e a permissão. */
  async function start(init) {
    const content = $('#page-content');
    CNJ.ui.loading(content, 'A verificar o acesso…');
    let user;
    try {
      user = await auth.currentUser();
    } catch (err) {
      if (err.status === 401) toLogin();
      else CNJ.ui.errorState(content, err, () => location.reload());
      return;
    }
    render(user);
    showFlash();
    content.innerHTML = '';
    if (!auth.can(user, section)) {
      setHTML(content, html`<div class="state" role="alert"><h3>Acesso reservado</h3><p>${section === 'utilizadores' ? 'Apenas o superadministrador pode gerir contas e permissões.' : 'A sua conta não tem permissão para abrir esta secção.'}</p><a class="btn btn-outline btn-small" href="dashboard.html">Voltar ao painel</a></div>`);
      return;
    }
    content.appendChild($('#page-template').content.cloneNode(true));
    init(user);
  }

  CNJ.admin = { start };
})();
