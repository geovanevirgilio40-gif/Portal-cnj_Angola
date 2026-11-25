# Portal institucional do CNJ — Angola (frontend)

HTML5, CSS3 e JavaScript puro. Sem dependências e sem compilação.

## Executar
- **Rápido:** abrir `index.html` com duplo clique.
- **Recomendado:** nesta pasta, `python -m http.server 8000` e abrir <http://localhost:8000>.
  (No Windows pode ser `py -m http.server 8000`.)
- Painel: `admin/entrar.html` → «Pré-visualizar o painel».

Para testar no telemóvel, ligue-o à mesma rede Wi-Fi e abra `http://IP-DO-COMPUTADOR:8000`.
Use apenas numa rede de confiança.

## Modo de demonstração
Com `API_BASE_URL` vazio (`js/config.js`), os conteúdos são **exemplos**, não informação oficial.
As alterações ficam no `localStorage` deste navegador. **Não substitui uma base de dados.**
No modo `file://`, a partilha desses dados entre páginas depende do navegador; use o servidor local.
Repor: Configurações → «Repor dados de demonstração».

**Não publique a demonstração como site oficial.** Ela não tem autenticação.

## Estrutura
```
index.html, noticias.html, galeria.html, eventos.html, sobre.html, contactos.html
admin/            9 páginas do painel
css/              styles.css, admin.css, responsive.css
js/config.js      configuração e categorias
js/core/          utilitários de interface e validação
js/services/      api.js (rede), auth.js, repository.js (dados)
js/data/          dados de demonstração
js/navigation.js  cabeçalho, menu e rodapé públicos
js/public/        lógica das páginas públicas
js/admin/         lógica do painel (gestor.js é comum a publicações, notícias e eventos)
assets/           imagens e logótipo provisórios
docs/API.md       contrato proposto para o backend
```
Diferença face à estrutura sugerida: o JavaScript está separado por camada (serviços, público, administração)
para não misturar interface com comunicação. São usados scripts clássicos, e não módulos ES, para o portal
abrir também sem servidor.

## Substituir conteúdos provisórios
- **Logótipo:** colocar o ficheiro oficial em `assets/logo/` e alterar `LOGO_PATH` em `js/config.js`.
  A página `admin/entrar.html` tem o caminho no próprio HTML.
- **Banner:** substituir `assets/images/banner-jovens.svg` em `index.html` (e a respectiva legenda e `alt`).
- **Textos institucionais:** editar `sobre.html` e a apresentação em `index.html`.
- **Contactos e redes sociais:** no modo real, vêm das Configurações.

## Ligar ao backend
Definir `API_BASE_URL` e implementar `docs/API.md`. Nesse modo não há recurso a dados de demonstração.
`js/data/demo-data.js` pode ser removido quando o modo de demonstração deixar de ser necessário
(retirar também as referências nas páginas e em `repository.js`).

## Segurança
Esconder menus no navegador não protege nada: o backend tem de validar sessão e permissões em todos os pedidos.
Em produção: HTTPS, cabeçalho `Content-Security-Policy`, e nunca colocar a chave `service_role` do Supabase no frontend.
