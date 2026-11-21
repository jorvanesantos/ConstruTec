# ConstruTec - Documentacao Completa

**Versao consolidada:** 1.0  
**Data:** 2026  
**Arquitetura:** Angular 19 + Node.js/Express + TypeScript + MySQL

## 1. Visao Geral

O ConstruTec e uma plataforma full-stack para calculo de materiais de construcao civil, orcamento e estimativa de custos com multiplicadores regionais. O sistema atende visitantes, usuarios autenticados e administradores, com suporte a obras, historico, catalogo de insumos, controle de acesso e auditoria.

### Objetivos

- Estimar quantitativos de nove tipos de obra.
- Aplicar margem de desperdicio e precificacao regional.
- Permitir o salvamento e a consulta de orcamentos.
- Disponibilizar catalogo de materiais e tipos de construcao.
- Oferecer operacoes administrativas protegidas por perfil.
- Registrar acoes relevantes em historico de auditoria.
- Continuar operando em memoria quando o MySQL estiver indisponivel.

## 2. Estrutura do Sistema

```text
construtec/
├── frontend/construtec-web/src/app/
│   ├── core/          # guards, interceptors, modelos e services
│   ├── shared/        # componentes, modais, diretivas e pipes
│   ├── features/      # paginas e funcionalidades
│   └── layout/        # header, sidebar e footer
├── backend/construtec-api/src/
│   ├── app.ts         # configuracao da aplicacao Express
│   ├── server.ts      # inicializacao standalone da API
│   ├── config/        # conexao e configuracao do banco
│   ├── routes/        # contrato HTTP
│   ├── controllers/   # entradas das requisicoes
│   ├── services/      # regras de calculo
│   ├── repositories/  # dados e persistencia
│   ├── validators/    # validacao de entrada
│   ├── middlewares/   # autenticacao e autorizacao
│   ├── models/        # tipos e dados de catalogo
│   └── utils/         # seguranca e envio de e-mail
├── database/
│   ├── migrations/    # schema inicial
│   ├── seeds/         # dados iniciais
│   └── scripts/       # manutencao e reset
├── docs/              # esta documentacao consolidada
└── server.ts          # inicializacao full-stack Angular + Express
```

## 3. Stack Tecnologica

| Camada | Tecnologia |
|---|---|
| Frontend | Angular 19, TypeScript, RxJS, Angular Router |
| Backend | Node.js, Express, TypeScript |
| Banco | MySQL 8+ |
| Autenticacao | JWT e bcryptjs |
| Build | Vite, esbuild e tsx |
| Interface | CSS responsivo, Lucide Angular |

## 4. Inicializacao e Execucao

### Desenvolvimento

```bash
npm install
npm run dev
```

A aplicacao sera atendida em `http://localhost:3000`. Em desenvolvimento, o Vite atua como middleware do Express.

### Producao

```bash
npm run build
npm start
```

### Validacao

```bash
npm run lint
npm run docs
```

### Variaveis de Ambiente

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=construtec_db
DB_USER=root
DB_PASSWORD=
PORT=3000
JWT_SECRET=troque_em_producao
VITE_API_URL=http://localhost:3000/api
```

O arquivo `.env` nao deve ser versionado. Nao compartilhe chaves reais ou credenciais.

## 5. Arquitetura

### Fluxo Principal

```text
Navegador
  -> Angular Router / Components
  -> Services HTTP
  -> Interceptor JWT
  -> Express /api
  -> Middlewares de autenticacao
  -> Controllers
  -> Services de calculo
  -> Repository
  -> MySQL ou armazenamento em memoria
```

### Frontend

- Componentes standalone organizados por recurso.
- `app.routes.ts` define rotas e guardas.
- `auth.interceptor.ts` envia o token JWT.
- `auth.guard.ts` protege rotas administrativas.
- Services encapsulam chamadas HTTP e estado da interface.
- Componentes utilizam signals para estado reativo.

### Backend

- `createExpressApp()` configura JSON, CORS e rotas `/api`.
- Controllers recebem e validam entradas.
- `CalculationService` aplica as regras tecnicas.
- Repositories mantem dados no banco ou em memoria.
- Middlewares verificam JWT e niveis administrativos.
- Utilitarios cuidam de seguranca, senha e e-mail.

### Banco de Dados

- Conexao feita por pool `mysql2/promise`.
- Se o banco estiver indisponivel, o backend entra em modo de memoria.
- Ao restabelecer a conexao, os dados podem ser sincronizados pelo repository.
- Consultas administrativas e operacionais usam parametros preparados.

## 6. Rotas Frontend

| Rota | Funcionalidade |
|---|---|
| `/` | Pagina inicial |
| `/login` | Login e cadastro |
| `/calculo` | Calculadora |
| `/calculo/:tipo` | Calculadora por tipo |
| `/historico` | Historico do usuario |
| `/obras` | Catalogo de obras |
| `/materiais` | Materiais e precos |
| `/dashboard` | Painel do usuario |
| `/sobre` | Informacoes e documentacao |
| `/admin` | Painel administrativo protegido |

## 7. Usuarios e Permissoes

| Perfil | Permissoes principais |
|---|---|
| Visitante | Calculos publicos, catalogo e consulta de tipos |
| USUARIO | Salva orcamentos, consulta historico e altera senha |
| ADM | Gerencia materiais, tipos de obra e obras |
| ADM_MASTER | Gerencia usuarios e possui acesso administrativo completo |
| PROPRIETARIO | Perfil administrativo de propriedade e gestao de sistema |

Os perfis sao definidos pelo campo `tipo_usuario`. Rotas administrativas exigem token JWT e `requireAdmin`. Acoes de ADM_MASTER podem ser submetidas a solicitacoes de rebaixamento ou exclusao.

## 8. Autenticacao

- Senhas de usuario sao protegidas com bcryptjs.
- Login retorna token JWT e dados do usuario.
- Alteracao de senha exige token valido.
- Recuperacao usa codigo temporario.
- Avatar, perfil e dados basicos sao mantidos pela API.
- O frontend usa Authorization Bearer no interceptor HTTP.

Credenciais iniciais fornecidas pelos seeds:

| Perfil | E-mail | Senha inicial |
|---|---|---|
| ADM Master | `jorvanesantos@gmail.com` | `123456` |
| ADM Tecnico | `adm@construtec.com.br` | `123456` |

Essas credenciais devem ser alteradas antes de publicar em ambiente real.

## 9. Contrato da API REST

Base: `/api`, formato JSON.

### Saude e Banco

- `GET /api/health`
- `GET /api/status-banco`
- `POST /api/conectar-banco`

### Autenticacao e Perfil

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/google`
- `GET /api/auth/me`
- `POST /api/auth/alterar-senha`
- `POST /api/auth/change-password`
- `POST /api/auth/avatar`
- `POST /api/auth/solicitar-recuperacao`
- `POST /api/auth/redefinir-senha`

### Calculos

- `POST /api/calculos`
- `POST /api/calculos/:tipo`

Tipos validos: `muro`, `parede`, `piso`, `pintura`, `concreto`, `fundacao`, `telhado`, `revestimento` e `outro`.

### Obras

- `GET /api/obras`
- `POST /api/obras`
- `PUT /api/obras/:id`
- `DELETE /api/obras/:id`

Os aliases `orcamentos` e suas variantes possuem o mesmo comportamento.

### Catalogo

- `GET /api/tipos-obras`
- `GET /api/tipos-construcao`
- `GET /api/materiais`
- `GET /api/materiais/:id`
- `GET /api/precos`
- `GET /api/regiao/detectar`

### Administracao

- `GET /api/admin/stats`
- `GET/POST/PUT/PATCH/DELETE /api/admin/usuarios`
- `GET/POST/PUT/PATCH /api/admin/tipos-construcao`
- `GET/POST/PUT/PATCH/DELETE /api/admin/materiais`
- `GET /api/admin/obras`
- `GET /api/admin/historico`
- `GET/POST/DELETE /api/admin/master-solicitacoes`

Rotas administrativas exigem autenticacao JWT e perfil ADM ou ADM_MASTER.

## 10. Motores de Calculo

### Muro

- Desconta portas e janelas da area bruta.
- Consome blocos ou tijolos por metro quadrado.
- Calcula cimento e areia para assentamento.
- Aplica desperdicio configurado.

### Parede

- Desconta portas e janelas.
- Calcula alvenaria, chapisco e revestimento conforme a opcao.
- Suporta uma face ou ambas as faces.

### Piso

- Calcula area, contrapiso, argamassa colante, piso e rejunte.
- Arredonda revestimentos para unidades comerciais.

### Pintura

- Considera area, numero de demao, selador e massa corrida.
- Organiza a compra em latas e galoes comerciais.

### Concreto

- Calcula cimento, areia, brita e agua por volume.
- Admite traços 1:2:3, 1:2.5:3.5 e 1:3:4.

### Fundacao

- Suporta sapata isolada, baldrame e estaca/broca.
- Calcula concreto estrutural, escavacao e armaduras.

### Telhado

- Calcula area inclinada a partir da inclinacao.
- Dimensiona telhas, madeiramento e elementos de cobertura.

### Revestimento

- Calcula area liquida de superficies molhadas.
- Dimensiona revestimento, argamassa e rejunte.

### Outro

- Permite calculo modular personalizado por area e parametros informados.

Os resultados informam formula utilizada, premissas tecnicas, quantidade teorica, quantidade comercial, custo unitario, custo total, desperdicio e alertas de engenharia.

## 11. Modelo de Dados

### usuario

Conta, perfil, e-mail, hash bcrypt, tipo de usuario, telefone, UF, cidade e status ativo.

### unidade_medida

Unidades padronizadas como unidade, sacos, metros cubicos, metros quadrados e quilogramas.

### tipo_construcao

Tipos de obra, codigo, nome, descricao, categoria, desperdicio padrao e status.

### material

Codigo, nome, categoria, unidade, preco, quantidade minima, descricao e status.

### localizacoes

UF, estado, cidade, multiplicador regional SINAPI e fonte de referencia.

### obra

Usuario, titulo, cliente, tipo, custo estimado, status, localizacao e resultado de calculo.

### medicao

Dimensoes, area liquida, volume, desperdicio e parametros utilizados em uma obra.

### historico

Usuario, tipo de perfil, acao, descricao, detalhes, IP e data/hora.

### master_solicitacoes

Solicitacoes de rebaixamento ou exclusao envolvendo contas administrativas.

## 12. Scripts de Banco

- `database/migrations/001_initial_schema.sql`: cria banco e tabelas.
- `database/seeds/001_initial_data.sql`: insere usuarios, tipos, materiais e locais.
- `database/scripts/reset_database.sql`: restaura dados ou executa limpeza conforme o script.

O seed cria os perfis administrativos iniciais. Mantenha uma copia segura antes de executar scripts destrutivos.

## 13. Seguranca

- Senhas com bcryptjs.
- JWT com segredo configuravel em ambiente.
- Middleware `authenticateToken` nas operacoes autenticadas.
- Middleware `requireAdmin` nas operacoes administrativas.
- Parametros preparados no acesso ao MySQL.
- Validacao de entrada nos controllers e validators.
- Dados sensiveis em variaveis de ambiente.
- Auditoria de login, senha, obras, materiais, usuarios e tipos.

## 14. Fallback em Memoria

Quando o MySQL nao pode ser conectado:

1. A aplicacao registra o erro no startup.
2. Os repositories utilizam estruturas em memoria.
3. O sistema permanece utilizavel durante a sessao.
4. O status bancario fica disponivel pela API.
5. O administrador pode tentar reconectar pela interface.

Os dados em memoria nao substituem persistencia em producao.

## 15. Painel Administrativo

O painel permite:

- Consultar estatisticas.
- Gerenciar usuarios.
- Alterar status de usuarios.
- Cadastrar e editar administradores.
- Gerenciar materiais e tipos de obra.
- Consultar todas as obras.
- Consultar historico de auditoria.
- Processar solicitacoes ligadas a ADM_MASTER.

## 16. Procedimento de Conexao MySQL

1. Instale e inicie MySQL 8 ou superior.
2. Configure `.env` com host, porta, banco, usuario e senha.
3. Execute `database/migrations/001_initial_schema.sql`.
4. Execute `database/seeds/001_initial_data.sql`.
5. Inicie `npm run dev`.
6. Consulte `GET /api/status-banco`.

No XAMPP, normalmente o usuario local e `root` e a senha pode estar vazia.

## 17. Implantacao

- Gere a build com `npm run build`.
- Execute `npm start`.
- Configure `JWT_SECRET`, banco e porta no ambiente.
- Habilite HTTPS.
- Restrinja origens, firewall e credenciais.
- Execute migrations antes da aplicacao.
- Monitore health check e logs.
- Troque todas as credenciais iniciais.

## 18. Consideracoes Tecnicas

Os calculos utilizam coeficientes convencionais e premissas simplificadas para estimativa. Estruturas armadas, fundacoes especiais, solo, nivelamento, fretes, impostos e especificacoes executivas exigem validacao profissional.

Os valores de preco podem variar por fornecedor, marca, estado e cidade. A documentacao do sistema deve ser usada como referencia tecnica e nao como projeto executivo.
