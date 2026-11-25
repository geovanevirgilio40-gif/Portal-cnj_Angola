CNJ.admin.start((user) => CNJ.manager({
  resource: 'publicacoes', singular: 'publicação', plural: 'publicações', detailField: 'categoria', detailLabel: 'Categoria',
  intro: 'Comunicados, notas informativas e actividades. As publicações da categoria «Actividade» aparecem nos destaques da página inicial.',
  categories: CNJ.catalog.publicacoes,
  fields: [
    { name: 'titulo', label: 'Título', required: true, max: 160 },
    { name: 'categoria', label: 'Categoria', type: 'select', categories: CNJ.catalog.publicacoes, required: true },
    { name: 'descricao', label: 'Descrição', type: 'textarea', required: true, max: 3000 }
  ]
}, user));
