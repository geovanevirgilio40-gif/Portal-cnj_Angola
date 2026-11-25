/**
 * Cliente HTTP para a futura API FastAPI.
 * É o ÚNICO ficheiro que executa pedidos de rede.
 * Autenticação: pressupõe cookies HttpOnly emitidos pelo backend
 * (credentials: 'include'); nenhum token é guardado no localStorage.
 */
(function () {
  'use strict';

  class ApiError extends Error {
    constructor(message, status = 0, details = null) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.details = details;
    }
  }

  const MESSAGES = {
    400: 'O pedido contém dados inválidos.', 401: 'A sessão não é válida. Inicie sessão novamente.',
    403: 'Não tem permissão para executar esta operação.', 404: 'O recurso pedido não foi encontrado.',
    409: 'A operação entra em conflito com dados existentes.', 413: 'O ficheiro enviado é demasiado grande.',
    422: 'Verifique os dados introduzidos.', 429: 'Demasiadas tentativas. Aguarde um momento.'
  };

  function buildUrl(path, params) {
    if (CNJ.isDemo()) throw new ApiError('O serviço ainda não está ligado: API_BASE_URL não foi configurado.');
    const query = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== '' && v !== undefined && v !== null)).toString();
    return CNJ.config.API_BASE_URL.replace(/\/$/, '') + path + (query ? `?${query}` : '');
  }

  async function request(path, { method = 'GET', params, body } = {}) {
    const url = buildUrl(path, params);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CNJ.config.REQUEST_TIMEOUT_MS);
    const isForm = body instanceof FormData;
    const headers = { Accept: 'application/json' };
    if (body && !isForm) headers['Content-Type'] = 'application/json';

    let response;
    try {
      response = await fetch(url, { method, headers, credentials: 'include', signal: controller.signal, body: body ? (isForm ? body : JSON.stringify(body)) : undefined });
    } catch (err) {
      throw new ApiError(err.name === 'AbortError' ? 'O servidor demorou demasiado a responder.' : 'Não foi possível contactar o servidor. Verifique a ligação.');
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 204) return null;
    const isJson = (response.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await response.json().catch(() => null) : null;
    if (!response.ok) {
      if (response.status === 401 && !path.startsWith('/auth/')) document.dispatchEvent(new CustomEvent('cnj:sessao-expirada'));
      const detail = typeof data?.detail === 'string' ? data.detail : '';
      throw new ApiError(detail || MESSAGES[response.status] || `Erro do servidor (${response.status}).`, response.status, data);
    }
    if (!isJson) throw new ApiError('O servidor devolveu uma resposta num formato inesperado.', response.status);
    return data;
  }

  /** Envia um ficheiro; o backend guarda-o no Supabase Storage e devolve { url }. */
  function upload(file, folder) {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);
    return request('/uploads', { method: 'POST', body: form });
  }

  CNJ.ApiError = ApiError;
  CNJ.api = {
    request, upload,
    get: (p, params) => request(p, { params }),
    post: (p, body) => request(p, { method: 'POST', body }),
    put: (p, body) => request(p, { method: 'PUT', body }),
    patch: (p, body) => request(p, { method: 'PATCH', body }),
    delete: (p) => request(p, { method: 'DELETE' })
  };
})();
