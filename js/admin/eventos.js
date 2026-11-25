CNJ.admin.start((user) => CNJ.manager({
  resource: 'eventos', singular: 'evento', article: 'o', plural: 'eventos', detailField: 'local', detailLabel: 'Localização', dateField: 'inicio',
  intro: 'Gira a agenda. O portal separa automaticamente os próximos eventos dos já realizados, conforme a data e a hora (hora de Angola).',
  fields: [
    { name: 'titulo', label: 'Nome do evento', required: true, max: 160 },
    { name: 'inicio', label: 'Data e hora', type: 'datetime-local', required: true },
    { name: 'local', label: 'Localização', required: true, max: 200 },
    { name: 'descricao', label: 'Descrição', type: 'textarea', required: true, max: 3000 }
  ]
}, user));
