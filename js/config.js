/**
 * Configuração global do frontend.
 *
 * API_BASE_URL vazio  -> MODO DE DEMONSTRAÇÃO: dados de exemplo guardados
 *                        apenas neste navegador (localStorage).
 * API_BASE_URL definido -> todas as operações são enviadas à API REST.
 *                        Neste modo NUNCA se recorre a dados de demonstração.
 *
 * Não colocar aqui chaves secretas (por exemplo, a "service_role" do Supabase):
 * tudo o que está neste ficheiro é público.
 */
window.CNJ = window.CNJ || {};

CNJ.config = Object.freeze({
  API_BASE_URL: '',              // Ex.: 'https://api.exemplo.ao/api/v1'
  REQUEST_TIMEOUT_MS: 15000,
  LOGO_PATH: 'assets/logo/logo-provisorio.svg', // Substituir pelo ficheiro oficial
  PAGE_SIZE: Object.freeze({ noticias: 6, galeria: 12, eventos: 5, admin: 8 }),
  UPLOAD: Object.freeze({
    TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    MAX_BYTES: 5 * 1024 * 1024,
    MAX_FILES: 12
  })
});

CNJ.isDemo = () => !CNJ.config.API_BASE_URL;

/** Prefixo para caminhos relativos: as páginas em /admin/ estão um nível abaixo. */
CNJ.root = document.documentElement.dataset.root || '';
CNJ.asset = (path) => (/^(data:|blob:|https?:)/.test(path) ? path : CNJ.root + path);

/** Categorias e estados usados nas duas áreas (no futuro podem vir da API). */
CNJ.catalog = Object.freeze({
  noticias: ['Institucional', 'Formação', 'Comunidade', 'Empreendedorismo', 'Cultura', 'Desporto'],
  publicacoes: ['Actividade', 'Comunicado', 'Nota informativa', 'Documento'],
  galeria: ['Formação', 'Comunidade', 'Cultura', 'Desporto', 'Institucional'],
  estados: Object.freeze({
    noticias: { rascunho: 'Rascunho', publicado: 'Publicado', arquivado: 'Arquivado' },
    publicacoes: { rascunho: 'Rascunho', publicado: 'Publicado', arquivado: 'Arquivado' },
    eventos: { rascunho: 'Rascunho', publicado: 'Publicado', cancelado: 'Cancelado' }
  })
});
