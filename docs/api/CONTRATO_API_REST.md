# Contrato Oficial da API REST — ConstruTec

Base URL: `/api` (JSON)

## Autenticação & Usuário
- `POST /api/auth/login` — Autentica usuário e retorna `{ token, user }`.
- `POST /api/auth/register` — Cadastra novo usuário com hash bcrypt e retorna `{ token, user }`.
- `POST /api/auth/google` — Login rápido/OAuth.
- `POST /api/auth/alterar-senha` *(JWT)* — Altera senha do usuário autenticado.
- `POST /api/auth/recuperar-senha/solicitar` — Gera código temporário de recuperação.
- `POST /api/auth/recuperar-senha/redefinir` — Redefine senha mediante código válido.
- `GET /api/usuarios/me` *(JWT)* — Retorna perfil do usuário autenticado.

## Catálogo & Preços Regionais
- `GET /api/tipos-construcao` *(alias: `/api/tipos-obras`)* — Lista tipos de obra ativos.
- `GET /api/materiais` — Lista insumos ativos.
- `GET /api/materiais/:id` — Detalha um insumo.
- `GET /api/precos` — Retorna multiplicadores regionais SINAPI por UF.

## Motor de Cálculos
- `POST /api/calculos/:tipo` — Executa cálculo para `muro`, `parede`, `piso`, `pintura`, `concreto`, `fundacao`, `telhado`, `revestimento`, `outro`.
- `POST /api/calculos` — Executa cálculo informando `tipoObra` no corpo JSON.

## Obras / Orçamentos & Histórico
- `GET /api/obras` *(alias: `/api/orcamentos`)* — Lista obras/orçamentos salvos.
- `GET /api/obras/:id` *(alias: `/api/orcamentos/:id`)* — Busca obra específica.
- `POST /api/obras` *(alias: `/api/orcamentos`)* — Salva nova obra/cálculo + medição + log.
- `PUT /api/obras/:id` *(alias: `/api/orcamentos/:id`)* — Atualiza obra/orçamento.
- `DELETE /api/obras/:id` *(alias: `/api/orcamentos/:id`)* — Remove obra/orçamento.
- `GET /api/historico` *(JWT)* — Retorna histórico de cálculos/ações do usuário autenticado.

## Administração *(JWT + `requireAdmin`)*
- `GET /api/admin/stats`
- `GET / POST / PUT / PATCH / DELETE /api/admin/usuarios`
- `GET / POST / PUT / PATCH /api/admin/tipos-obra`
- `GET / POST / PUT / PATCH / DELETE /api/admin/materiais`
- `GET /api/admin/obras`
- `GET /api/admin/historico`
