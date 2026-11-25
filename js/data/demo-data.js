/**
 * DADOS DE DEMONSTRAÇÃO — NÃO SÃO INFORMAÇÕES OFICIAIS DO CNJ.
 * Servem apenas para desenhar e testar a interface.
 * Não são usados quando CNJ.config.API_BASE_URL está definido.
 */
(function () {
  'use strict';
  const pad = (n) => String(n).padStart(2, '0');
  /** Datas relativas ao dia actual, para haver sempre eventos futuros e realizados. */
  function day(offset, time) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return time ? `${date}T${time}` : date;
  }
  const img = (n) => `assets/images/demo-${((n - 1) % 6) + 1}.svg`;
  const BODY = 'Este é um texto de demonstração, usado apenas para apresentar o aspecto de uma notícia completa no portal.\n\nQuando o portal estiver ligado ao servidor, este espaço mostrará o conteúdo redigido e aprovado pela equipa de comunicação do CNJ.\n\nNenhum nome, número, data ou acontecimento aqui apresentado é real.';

  function build() {
    const news = [
      ['Formação em liderança juvenil: exemplo de notícia', 'Formação'],
      ['Encontro de associações juvenis: texto de demonstração', 'Institucional'],
      ['Campanha de voluntariado comunitário: exemplo', 'Comunidade'],
      ['Debate sobre emprego e empreendedorismo: exemplo', 'Empreendedorismo'],
      ['Jornada desportiva da juventude: demonstração', 'Desporto'],
      ['Mostra cultural de jovens criadores: exemplo', 'Cultura'],
      ['Sessão de trabalho com organizações membros: exemplo', 'Institucional'],
      ['Oficina de competências digitais: demonstração', 'Formação'],
      ['Acção de limpeza num bairro: texto de exemplo', 'Comunidade']
    ].map(([titulo, categoria], i) => ({
      id: `not-${i + 1}`, titulo, categoria, estado: 'publicado', data: day(-3 - i * 6),
      resumo: 'Resumo de demonstração que ocupa o lugar de uma breve descrição da notícia.',
      conteudo: BODY, imagens: [img(i + 1)]
    }));
    news.push({ id: 'not-10', titulo: 'Rascunho de exemplo, não visível no portal', categoria: 'Institucional', estado: 'rascunho', data: day(0), resumo: 'Os rascunhos só aparecem na área administrativa.', conteudo: BODY, imagens: [img(2)] });

    const publications = [
      ['Fórum de auscultação juvenil (exemplo)', 'Actividade'],
      ['Programa de mentoria entre jovens (exemplo)', 'Actividade'],
      ['Visitas de trabalho às comunidades (exemplo)', 'Actividade'],
      ['Comunicado de demonstração sobre inscrições', 'Comunicado'],
      ['Nota informativa de demonstração', 'Nota informativa']
    ].map(([titulo, categoria], i) => ({
      id: `pub-${i + 1}`, titulo, categoria, estado: i === 4 ? 'rascunho' : 'publicado', data: day(-2 - i * 5),
      descricao: 'Descrição de demonstração. Substituir pelo texto oficial da publicação.', imagens: [img(i + 3)]
    }));

    const gallery = Array.from({ length: 16 }, (_, i) => {
      const categoria = ['Formação', 'Comunidade', 'Cultura', 'Desporto'][i % 4];
      return { id: `fot-${i + 1}`, legenda: `Fotografia de demonstração ${i + 1}: ${categoria.toLowerCase()}`, categoria, data: day(-1 - i * 3), imagens: [img(i + 1)] };
    });

    const events = [
      [12, '09:00', 'Conferência de juventude (evento de exemplo)'],
      [27, '14:30', 'Oficina de empreendedorismo (exemplo)'],
      [45, '08:30', 'Jornada de voluntariado (exemplo)'],
      [63, '10:00', 'Feira de oportunidades (exemplo)'],
      [-9, '09:30', 'Seminário de formação (exemplo)'],
      [-24, '15:00', 'Encontro cultural (exemplo)'],
      [-51, '08:00', 'Torneio desportivo (exemplo)']
    ].map(([offset, time, titulo], i) => ({
      id: `eve-${i + 1}`, titulo, estado: 'publicado', inicio: day(offset, time),
      local: 'Local a definir (provisório)',
      descricao: 'Descrição de demonstração do evento: objectivos, programa e destinatários serão indicados pela organização.',
      imagens: [img(i + 2)]
    }));

    const admins = [
      { id: 'adm-1', nome: 'Conta de exemplo A', email: 'conta.a@exemplo.invalid', perfil: 'superadministrador', activo: true, permissoes: ['publicacoes', 'noticias', 'galeria', 'eventos', 'auditoria', 'configuracoes'] },
      { id: 'adm-2', nome: 'Conta de exemplo B', email: 'conta.b@exemplo.invalid', perfil: 'administrador', activo: true, permissoes: ['noticias', 'galeria'] },
      { id: 'adm-3', nome: 'Conta de exemplo C', email: 'conta.c@exemplo.invalid', perfil: 'administrador', activo: false, permissoes: ['eventos'] }
    ];

    const audit = [
      ['criou', 'Publicação', publications[0].titulo, -2, '10:15'],
      ['editou', 'Notícia', news[0].titulo, -2, '15:40'],
      ['eliminou', 'Fotografia', 'Fotografia de exemplo removida', -4, '09:05'],
      ['criou', 'Evento', events[0].titulo, -6, '11:20']
    ].map(([accao, tipo, item, offset, time], i) => ({ id: `aud-${i + 1}`, utilizador: `Conta de exemplo ${i % 2 ? 'B' : 'A'}`, accao, tipo, item, dataHora: day(offset, time) }));

    return { noticias: news, publicacoes: publications, galeria: gallery, eventos: events, utilizadores: admins, auditoria: audit };
  }

  CNJ.demoData = { build };
})();
