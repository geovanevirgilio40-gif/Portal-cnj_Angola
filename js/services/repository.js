/**
 * Camada de serviços de conteúdos.
 * A interface fala apenas com este ficheiro; ele decide entre:
 *   - API REST (quando API_BASE_URL está definido), ou
 *   - protótipo local de demonstração (localStorage).
 * ATENÇÃO: o localStorage NÃO substitui a base de dados real. Os dados ficam
 * apenas neste navegador, não são partilhados e podem ser apagados a qualquer momento.
 *
 * Contrato de listagem proposto: { items: [...], total: n }
 */
(function () {
  'use strict';
  const STORE_KEY = 'cnj.demo.v1';
  const TYPE_NAMES = { noticias: 'Notícia', publicacoes: 'Publicação', galeria: 'Fotografia', eventos: 'Evento', utilizadores: 'Administrador', configuracoes: 'Configurações' };
  const PATHS = { noticias: '/noticias', publicacoes: '/publicacoes', galeria: '/galeria', eventos: '/eventos', utilizadores: '/administradores', auditoria: '/auditoria' };
  const EMPTY_SETTINGS = { nome: 'Conselho Nacional de Juventude', sigla: 'CNJ', email: '', telefone: '', endereco: '', horario: '', facebook: '', instagram: '', youtube: '', x: '', logotipo: '' };

  let memory = null; // alternativa quando o armazenamento do navegador está bloqueado

  function read() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (saved && saved.noticias) return saved;
    } catch (_) { /* usa a memória */ }
    if (!memory) memory = CNJ.demoData.build();
    return JSON.parse(JSON.stringify(memory));
  }
  function write(db) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); }
    catch (err) {
      if (err && /quota/i.test(err.name)) throw new Error('O armazenamento local de demonstração está cheio. Remova fotografias ou reponha os dados.');
    }
    memory = db;
  }
  const wait = () => new Promise((r) => setTimeout(r, 180)); // permite ver o indicador de carregamento
  const newId = () => `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const now = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
  const titleOf = (i) => i.titulo || i.legenda || i.nome || 'Registo';

  /** Registo de auditoria local. Na versão real é o BACKEND que o escreve. */
  function log(db, accao, resource, item) {
    db.auditoria.unshift({ id: newId(), utilizador: 'Utilizador de demonstração', accao, tipo: TYPE_NAMES[resource], item: typeof item === 'string' ? item : titleOf(item), dataHora: now() });
    db.auditoria = db.auditoria.slice(0, 200);
  }

  const dateOf = (i) => i.inicio || i.dataHora || i.data || '';

  /** Filtragem local equivalente aos parâmetros de consulta que a API deverá aceitar. */
  function filterLocal(items, q) {
    const term = CNJ.ui.normalize(q.q);
    const nowValue = now();
    let out = items.filter((i) =>
      (!term || CNJ.ui.normalize([i.titulo, i.resumo, i.descricao, i.conteudo, i.legenda, i.local, i.nome, i.email, i.item, i.utilizador].join(' ')).includes(term)) &&
      (!q.categoria || i.categoria === q.categoria) &&
      (!q.estado || i.estado === q.estado) &&
      (!q.publico || !i.estado || i.estado === 'publicado' || i.estado === 'cancelado') &&
      (!q.accao || i.accao === q.accao) &&
      (!q.tipo || i.tipo === q.tipo) &&
      (!q.de || dateOf(i).slice(0, 10) >= q.de) &&
      (!q.ate || dateOf(i).slice(0, 10) <= q.ate) &&
      (!q.periodo || (q.periodo === 'futuros' ? i.inicio >= nowValue : i.inicio < nowValue)));
    const ascending = q.periodo === 'futuros';
    out = out.sort((a, b) => (ascending ? 1 : -1) * dateOf(a).localeCompare(dateOf(b)));
    return out;
  }

  const repo = {
    /**
     * q: { q, categoria, estado, periodo, publico, accao, tipo, de, ate, page, pageSize }
     * "publico" usa os endpoints /public/*, que só devem devolver conteúdo publicado.
     */
    async list(resource, q = {}) {
      const page = q.page || 1;
      const pageSize = q.pageSize || 1000;
      if (!CNJ.isDemo()) {
        const { publico, pageSize: _ignored, ...params } = q;
        return CNJ.api.get((publico ? '/public' : '') + PATHS[resource], { ...params, page, page_size: pageSize });
      }
      await wait();
      const all = filterLocal(read()[resource] || [], q);
      const lastPage = Math.max(1, Math.ceil(all.length / pageSize));
      const current = Math.min(page, lastPage);
      return { items: all.slice((current - 1) * pageSize, current * pageSize), total: all.length, page: current };
    },

    async get(resource, id, { publico = false } = {}) {
      if (!CNJ.isDemo()) return CNJ.api.get(`${publico ? '/public' : ''}${PATHS[resource]}/${encodeURIComponent(id)}`);
      await wait();
      const item = (read()[resource] || []).find((i) => i.id === id);
      if (!item || (publico && item.estado && !['publicado', 'cancelado'].includes(item.estado))) throw new Error('O conteúdo pedido não existe ou não está publicado.');
      return item;
    },

    async save(resource, data) {
      if (!CNJ.isDemo()) {
        return data.id ? CNJ.api.put(`${PATHS[resource]}/${encodeURIComponent(data.id)}`, data) : CNJ.api.post(PATHS[resource], data);
      }
      await wait();
      const db = read();
      const index = db[resource].findIndex((i) => i.id === data.id);
      const item = index >= 0 ? { ...db[resource][index], ...data } : { ...data, id: newId() };
      if (index >= 0) db[resource][index] = item; else db[resource].unshift(item);
      log(db, index >= 0 ? 'editou' : 'criou', resource, item);
      write(db);
      return item;
    },

    async remove(resource, id) {
      if (!CNJ.isDemo()) return CNJ.api.delete(`${PATHS[resource]}/${encodeURIComponent(id)}`);
      await wait();
      const db = read();
      const item = db[resource].find((i) => i.id === id);
      if (!item) throw new Error('O registo já não existe.');
      db[resource] = db[resource].filter((i) => i.id !== id);
      log(db, 'eliminou', resource, item);
      write(db);
      return null;
    },

    /** Converte um ficheiro num URL: upload real, ou imagem reduzida no protótipo local. */
    async storeImage(file, folder) {
      if (!CNJ.isDemo()) return (await CNJ.api.upload(file, folder)).url;
      return CNJ.forms.compressToDataURL(file);
    },

    async getSettings({ publico = false } = {}) {
      if (!CNJ.isDemo()) return { ...EMPTY_SETTINGS, ...(await CNJ.api.get(publico ? '/public/configuracoes' : '/configuracoes')) };
      return { ...EMPTY_SETTINGS, ...(read().configuracoes || {}) };
    },
    async saveSettings(data) {
      if (!CNJ.isDemo()) return CNJ.api.put('/configuracoes', data);
      await wait();
      const db = read();
      db.configuracoes = { ...EMPTY_SETTINGS, ...(db.configuracoes || {}), ...data };
      log(db, 'editou', 'configuracoes', 'Configurações institucionais');
      write(db);
      return db.configuracoes;
    },

    async stats() {
      if (!CNJ.isDemo()) return CNJ.api.get('/dashboard/estatisticas');
      await wait();
      const db = read();
      return { publicacoes: db.publicacoes.length, noticias: db.noticias.length, fotografias: db.galeria.length, eventos: db.eventos.length };
    },

    /** Envio do formulário de contacto. Só existe com o backend ligado. */
    sendContact: (data) => CNJ.api.post('/public/contactos', data),

    resetDemo() {
      try { localStorage.removeItem(STORE_KEY); } catch (_) { /* ignorar */ }
      memory = null;
    },
    now
  };

  CNJ.repo = repo;
})();
