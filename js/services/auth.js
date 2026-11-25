/**
 * Autenticação dos administradores.
 * NÃO existem credenciais fixas nem autenticação simulada.
 * Em modo de demonstração é apenas possível PRÉ-VISUALIZAR a interface;
 * isso não é um início de sessão e não protege coisa alguma.
 * A segurança real tem de ser imposta pelo backend em cada endpoint.
 */
(function () {
  'use strict';
  const ROLE_KEY = 'cnj.demo.perfil';
  const ROLES = Object.freeze({ superadministrador: 'Superadministrador', administrador: 'Administrador' });
  const PERMISSIONS = Object.freeze({
    publicacoes: 'Publicações', noticias: 'Notícias', galeria: 'Galeria', eventos: 'Eventos',
    auditoria: 'Auditoria', configuracoes: 'Configurações'
  });

  const demoRole = () => {
    try { return sessionStorage.getItem(ROLE_KEY) in ROLES ? sessionStorage.getItem(ROLE_KEY) : 'superadministrador'; }
    catch (_) { return 'superadministrador'; }
  };
  const setDemoRole = (role) => { try { sessionStorage.setItem(ROLE_KEY, role); } catch (_) { /* opcional */ } };

  CNJ.auth = {
    ROLES, PERMISSIONS, setDemoRole,
    login: (email, password) => CNJ.api.post('/auth/login', { email, password }),
    logout: () => CNJ.api.post('/auth/logout'),
    /** Utilizador da sessão actual: { nome, email, perfil, permissoes[] } */
    async currentUser() {
      if (CNJ.isDemo()) {
        const role = demoRole();
        return { demo: true, nome: 'Utilizador de demonstração', email: '', perfil: role, permissoes: role === 'superadministrador' ? Object.keys(PERMISSIONS) : ['publicacoes', 'noticias', 'galeria', 'eventos'] };
      }
      return CNJ.api.get('/auth/me');
    },
    /** Apenas para esconder elementos da interface; o backend decide de facto. */
    can(user, section) {
      if (!user) return false;
      if (section === 'dashboard') return true;
      if (user.perfil === 'superadministrador') return true;
      if (section === 'utilizadores') return false;
      return (user.permissoes || []).includes(section);
    }
  };
})();
