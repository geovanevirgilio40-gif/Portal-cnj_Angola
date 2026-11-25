CNJ.admin.start((user) => CNJ.manager({
  resource: 'noticias', singular: 'notícia', plural: 'notícias', detailField: 'categoria', detailLabel: 'Categoria',
  intro: 'Crie e actualize as notícias do portal. Só as notícias com o estado «Publicado» são visíveis ao público.',
  categories: CNJ.catalog.noticias,
  fields: [
    { name: 'titulo', label: 'Título', required: true, max: 160 },
    { name: 'categoria', label: 'Categoria', type: 'select', categories: CNJ.catalog.noticias, required: true },
    { name: 'resumo', label: 'Resumo', type: 'textarea', required: true, max: 300 },
    { name: 'conteudo', label: 'Texto completo (deixe uma linha em branco entre parágrafos)', type: 'textarea', required: true, max: 20000 }
  ]
}, user));
