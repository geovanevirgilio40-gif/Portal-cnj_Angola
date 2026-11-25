CNJ.admin.start(() => {
  'use strict';
  const { html, raw, $, $$, setHTML, loading, errorState, emptyState, pagination, debounce, plural, modal, confirmDialog, toast } = CNJ.ui;
  const F = CNJ.forms;
  const { ROLES, PERMISSIONS } = CNJ.auth;
  const root = $('#manager');
  let page = 1;
  let items = [];
  let request = 0;

  setHTML(root, html`<div class="admin-intro"><p>Área exclusiva do superadministrador. Defina quem pode entrar no painel e o que cada conta pode gerir.</p><button type="button" class="btn" id="create">Nova conta</button></div>
    <form class="toolbar" id="filters" role="search"><div class="field field-grow"><label for="q">Pesquisar por nome ou email</label><input type="search" id="q" autocomplete="off"></div></form>
    <p class="result-count" id="count" aria-live="polite"></p><div id="list"></div><nav class="pagination" id="pages" aria-label="Paginação"></nav>`);
  const q = $('#q');
  const list = $('#list');
  q.addEventListener('input', debounce(() => { page = 1; load(); }));
  $('#filters').addEventListener('submit', (e) => e.preventDefault());

  async function load() {
    const current = ++request;
    loading(list);
    try {
      const pageSize = CNJ.config.PAGE_SIZE.admin;
      const res = await CNJ.repo.list('utilizadores', { q: q.value.trim(), page, pageSize });
      if (current !== request) return;
      page = res.page || page;
      items = res.items;
      $('#count').textContent = plural(res.total, 'conta', 'contas');
      setHTML(list, items.length ? html`<div class="table-wrap"><table class="table"><caption class="sr-only">Lista de administradores</caption><thead><tr><th scope="col">Nome</th><th scope="col">Nível de acesso</th><th scope="col">Permissões</th><th scope="col">Estado</th><th scope="col">Acções</th></tr></thead><tbody>${items.map((u) => html`<tr>
        <td class="cell-main"><strong>${u.nome}</strong><br><span class="muted">${u.email}</span></td><td data-label="Nível">${ROLES[u.perfil]}</td>
        <td data-label="Permissões">${u.perfil === 'superadministrador' ? 'Todas' : (u.permissoes || []).map((p) => PERMISSIONS[p]).join(', ') || 'Nenhuma'}</td>
        <td data-label="Estado"><span class="tag ${u.activo ? 'tag-success' : 'tag-danger'}">${u.activo ? 'Activa' : 'Desactivada'}</span></td>
        <td data-label="Acções"><div class="row-actions"><button type="button" class="btn btn-outline btn-small" data-edit="${u.id}">Editar<span class="sr-only">: ${u.nome}</span></button><button type="button" class="btn btn-outline btn-small" data-toggle="${u.id}">${u.activo ? 'Desactivar' : 'Activar'}<span class="sr-only">: ${u.nome}</span></button></div></td></tr>`)}</tbody></table></div>`
        : emptyState('Nenhuma conta encontrada', 'Altere a pesquisa ou crie uma conta.'));
      pagination($('#pages'), { page, pageSize, total: res.total, onChange: (p) => { page = p; load(); } });
    } catch (err) {
      if (current === request) errorState(list, err, load);
    }
  }

  /** Regras verificadas aqui por conveniência; o backend tem de as impor. */
  async function checkRules(account) {
    if (!CNJ.isDemo()) return;
    const { items: all } = await CNJ.repo.list('utilizadores');
    const others = all.filter((u) => u.id !== account.id);
    if (others.some((u) => u.email.toLowerCase() === account.email.toLowerCase())) throw new Error('Já existe uma conta com este email.');
    if (![...others, account].some((u) => u.perfil === 'superadministrador' && u.activo)) throw new Error('Tem de existir pelo menos um superadministrador activo.');
  }

  function openForm(account) {
    const selected = account?.permissoes || [];
    const m = modal({
      title: account ? 'Editar conta' : 'Nova conta',
      body: html`<form novalidate>
        <div class="field"><label for="u-nome">Nome completo</label><input id="u-nome" name="nome" required minlength="3" maxlength="120" value="${account?.nome || ''}" autocomplete="off"></div>
        <div class="field"><label for="u-email">Email</label><input id="u-email" name="email" type="email" required maxlength="160" value="${account?.email || ''}" autocomplete="off"></div>
        <div class="field"><label for="u-perfil">Nível de acesso</label><select id="u-perfil" name="perfil" required>${Object.entries(ROLES).map(([v, l]) => html`<option value="${v}" ${v === (account?.perfil || 'administrador') ? raw('selected') : ''}>${l}</option>`)}</select></div>
        <fieldset class="fieldset"><legend>Permissões</legend>${Object.entries(PERMISSIONS).map(([v, l]) => html`<label class="check"><input type="checkbox" value="${v}" data-permission ${selected.includes(v) ? raw('checked') : ''}> ${l}</label>`)}<p class="field-hint" data-super-hint>O superadministrador tem todas as permissões e é o único que gere contas.</p></fieldset>
        <p class="field-hint">A palavra-passe não é definida aqui. O servidor deverá enviar um convite para o próprio utilizador a criar. Na demonstração não é enviado qualquer email.</p>
        <p class="alert alert-error" data-error role="alert" hidden></p>
        <div class="form-actions"><button type="button" class="btn btn-outline" data-close>Cancelar</button><button type="submit" class="btn">${account ? 'Guardar alterações' : 'Criar conta'}</button></div></form>`
    });
    const form = $('form', m.el);
    const role = form.elements.perfil;
    const boxes = $$('[data-permission]', form);
    let manual = selected.slice();
    const sync = () => {
      const isSuper = role.value === 'superadministrador';
      boxes.forEach((b) => { b.disabled = isSuper; b.checked = isSuper || manual.includes(b.value); });
      $('[data-super-hint]', form).hidden = !isSuper;
    };
    boxes.forEach((b) => b.addEventListener('change', () => { manual = boxes.filter((x) => x.checked).map((x) => x.value); }));
    role.addEventListener('change', sync);
    sync();
    F.liveValidation(form);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!F.validate(form)) return;
      const errorBox = $('[data-error]', form);
      errorBox.hidden = true;
      const button = form.querySelector('[type="submit"]');
      F.busy(button, true, 'A guardar…');
      try {
        const v = F.values(form);
        const data = { nome: v.nome, email: v.email, perfil: v.perfil, activo: account ? account.activo : true, permissoes: boxes.filter((b) => b.checked).map((b) => b.value) };
        if (account) data.id = account.id;
        await checkRules(data);
        await CNJ.repo.save('utilizadores', data);
        m.close();
        toast(CNJ.isDemo() ? 'Conta guardada na demonstração local. Nenhum acesso real foi criado.' : 'Conta guardada.', 'success');
        load();
      } catch (err) {
        errorBox.textContent = err.message; errorBox.hidden = false; F.busy(button, false);
      }
    });
  }

  $('#create').addEventListener('click', () => openForm(null));
  list.addEventListener('click', async (e) => {
    const edit = e.target.closest('[data-edit]');
    const toggle = e.target.closest('[data-toggle]');
    const account = items.find((i) => i.id === (edit?.dataset.edit || toggle?.dataset.toggle));
    if (!account) return;
    if (edit) { openForm(account); return; }
    const verb = account.activo ? 'Desactivar' : 'Activar';
    if (!await confirmDialog({ title: `${verb} conta?`, message: `${verb} a conta «${account.nome}».`, confirmText: verb, danger: account.activo })) return;
    try {
      const updated = { ...account, activo: !account.activo };
      await checkRules(updated);
      await CNJ.repo.save('utilizadores', updated);
      toast(updated.activo ? 'Conta activada.' : 'Conta desactivada.', 'success');
      load();
    } catch (err) { toast(err.message, 'error'); }
  });
  load();
});
