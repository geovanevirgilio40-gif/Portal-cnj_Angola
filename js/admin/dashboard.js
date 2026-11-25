CNJ.admin.start(async (user) => {
  'use strict';
  const { html, $, setHTML, loading, errorState, emptyState, formatDate, formatDateTime } = CNJ.ui;
  const demoTag = () => (CNJ.isDemo() ? html`<span class="tag tag-demo">Dados de demonstração</span>` : '');

  async function stats() {
    const el = $('#stats');
    loading(el);
    try {
      const s = await CNJ.repo.stats();
      setHTML(el, html`<ul class="stats">${[['publicacoes', 'Total de publicações'], ['noticias', 'Total de notícias'], ['fotografias', 'Total de fotografias'], ['eventos', 'Total de eventos']].map(([k, label]) => {
        const sectionName = k === 'fotografias' ? 'galeria' : k;
        const inner = html`<span class="stat-label">${label}</span><span class="stat-value">${s[k] ?? 'n/d'}</span>${demoTag()}`;
        return html`<li class="stat">${CNJ.auth.can(user, sectionName) ? html`<a href="${sectionName}.html">${inner}</a>` : inner}</li>`;
      })}</ul>`);
    } catch (err) { errorState(el, err, stats); }
  }

  async function recent() {
    const el = $('#recent');
    loading(el);
    try {
      const { items } = await CNJ.repo.list('publicacoes', { pageSize: 5 });
      setHTML(el, items.length ? html`<ul class="timeline">${items.map((p) => html`<li><strong>${p.titulo}</strong><div class="meta"><span class="tag ${p.estado === 'publicado' ? 'tag-success' : 'tag-gold'}">${CNJ.catalog.estados.publicacoes[p.estado] || p.estado}</span><span>${p.categoria}</span><span>${formatDate(p.data)}</span></div></li>`)}</ul>` : emptyState('Sem publicações', 'Ainda não foi criada nenhuma publicação.'));
    } catch (err) { errorState(el, err, recent); }
  }

  async function activity() {
    const el = $('#activity');
    if (!CNJ.auth.can(user, 'auditoria')) { setHTML(el, emptyState('Acesso reservado', 'A sua conta não tem permissão para consultar a actividade administrativa.')); return; }
    loading(el);
    try {
      const { items } = await CNJ.repo.list('auditoria', { pageSize: 6 });
      setHTML(el, items.length ? html`<ul class="timeline">${items.map((a) => html`<li><strong>${a.utilizador}</strong> ${a.accao}: ${a.item}<div class="meta"><span>${a.tipo}</span><span>${formatDateTime(a.dataHora)}</span></div></li>`)}</ul>` : emptyState('Sem actividade', 'Ainda não há operações registadas.'));
    } catch (err) { errorState(el, err, activity); }
  }

  document.querySelectorAll('[data-needs]').forEach((a) => { a.hidden = !CNJ.auth.can(user, a.dataset.needs); });
  document.querySelectorAll('[data-demo-tag]').forEach((el) => setHTML(el, demoTag()));
  stats(); recent(); activity();
});
