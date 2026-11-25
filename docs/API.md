# Contrato proposto para a API (FastAPI)

Isto é uma **proposta**, derivada do que o frontend já chama. Nenhum destes endpoints existe ainda.
Base: `API_BASE_URL` em `js/config.js` (ex.: `/api/v1`).

## Regras gerais
- JSON em UTF-8. Erros no formato FastAPI: `{"detail": "mensagem em português"}`.
- Listagens: parâmetros `page`, `page_size` e filtros; resposta `{"items": [...], "total": 0, "page": 1}`.
  Sem `page_size` explícito o painel pede 1000; o backend deve impor um máximo.
- Sessão em cookie `HttpOnly; Secure; SameSite=Lax`. Preferir frontend e API no mesmo domínio.
  Com domínios diferentes: CORS com origem explícita e `allow_credentials=True`, e rever o `SameSite`.
- Como há cookies, proteger as operações de escrita contra CSRF (verificar `Origin` e/ou token CSRF;
  se for usado um token em cabeçalho, acrescentá-lo em `js/services/api.js`).
- Autenticação, permissões, validação e auditoria são impostas **no servidor**.

## Autenticação
| Método | Caminho | Notas |
|---|---|---|
| POST | /auth/login | `{email, password}`; define o cookie. Limitar tentativas |
| POST | /auth/logout | |
| GET | /auth/me | `{nome, email, perfil, permissoes[]}` ou 401 |

## Público (sem sessão; apenas conteúdo publicado)
| Método | Caminho | Filtros |
|---|---|---|
| GET | /public/noticias, /public/noticias/{id} | q, categoria |
| GET | /public/publicacoes | categoria |
| GET | /public/eventos | q, periodo=futuros\|realizados (inclui cancelados) |
| GET | /public/galeria | categoria |
| GET | /public/configuracoes | |
| POST | /public/contactos | `{nome, email, assunto, mensagem}`; limitar abuso |

`futuros` ordena por data ascendente; as restantes listagens por data descendente.

## Gestão (com sessão e permissão)
- `/noticias`, `/publicacoes`, `/galeria`, `/eventos`: GET (lista), POST, GET/PUT/DELETE `/{id}`.
  Filtros: q, categoria, estado.
- `/administradores`: GET, POST, PUT `/{id}` (só superadministrador). Activar/desactivar usa PUT com `activo`.
  No POST, o servidor envia o convite. Impedir a desactivação do último superadministrador activo e emails repetidos.
- `/auditoria`: GET com q, accao (criou\|editou\|eliminou), tipo, de, ate. Apenas leitura.
- `/configuracoes`: GET, PUT.
- `/dashboard/estatisticas`: GET → `{publicacoes, noticias, fotografias, eventos}`.
- `/uploads`: POST multipart (`file`, `folder`) → `{url}`. Guardar no Supabase Storage; validar tipo real
  (não só a extensão), tamanho e permissão; gerar o nome no servidor.

## Modelos
| Recurso | Campos |
|---|---|
| Notícia | id, titulo, categoria, resumo, conteudo, estado, data (AAAA-MM-DD), imagens[] |
| Publicação | id, titulo, categoria, descricao, estado, data, imagens[] |
| Fotografia | id, legenda, categoria, data, imagens[] (uma) |
| Evento | id, titulo, inicio (AAAA-MM-DDTHH:MM), local, descricao, estado, imagens[] |
| Administrador | id, nome, email, perfil (superadministrador\|administrador), activo, permissoes[] |
| Auditoria | id, utilizador, accao, tipo, item, dataHora |
| Configurações | nome, sigla, email, telefone, endereco, horario, facebook, instagram, youtube, x, logotipo |

Estados: notícias e publicações `rascunho|publicado|arquivado`; eventos `rascunho|publicado|cancelado`.
Um rascunho pode ter apenas o título.

`inicio` é enviado sem fuso e representa a hora de Angola (WAT, UTC+1). O backend deve guardá-lo como
`timestamptz` em `Africa/Luanda` e devolvê-lo no mesmo formato. Se devolver outro fuso, o navegador converte
para a hora local do visitante. O filtro `periodo` deve ser calculado no servidor.

A data da publicação é proposta pelo frontend; recomenda-se que o servidor a defina.

Os carregamentos acontecem antes da gravação do registo: o backend deve limpar ficheiros órfãos.
