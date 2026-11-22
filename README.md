# ConstruTec — Cálculo de Materiais e Orçamentos

> Calcule com precisão, construa com economia.

O ConstruTec é uma aplicação web para estimar quantitativos de materiais e custos de serviços de construção civil. A pessoa usuária informa as medidas e as características da obra, consulta uma estimativa e pode reunir cálculos em orçamentos, acompanhar o histórico e imprimir um relatório.

**Objetivo:** facilitar o planejamento inicial de pequenas obras e reformas, reunindo cálculos, preços de referência e organização de orçamentos em uma única ferramenta.

> **Importante:** os valores e quantitativos são estimativas. Rendimentos, preços, frete, perdas e condições da obra podem variar. O sistema não substitui projeto ou avaliação de profissional habilitado.

## Funcionalidades

- Cadastro, login, alteração e recuperação de senha; login Google opcional.
- Cálculo de materiais para muro, parede, piso, pintura, concreto, fundação, telhado, revestimento e serviços personalizados.
- Ajuste do percentual de desperdício e da região usada na estimativa de preços.
- Na pintura, opção **Incluir teto**: a área informada entra no cálculo da tinta e, quando selecionados, do selador e da massa corrida.
- Reunião de vários cálculos em um orçamento, edição, histórico e visualização para impressão ou PDF pelo navegador.
- Catálogo de materiais e tipos de obra.
- Painel administrativo com gestão de usuários, materiais, tipos de obra, histórico e solicitações relacionadas a administradores master.
- Interface responsiva com tema claro e escuro.

Os preços são valores de referência com multiplicadores regionais; **não representam uma consulta oficial em tempo real ao SINAPI**.

## Tecnologias

| Camada | Tecnologias principais |
|---|---|
| Interface | Angular 19, TypeScript, RxJS, Tailwind CSS e Lucide |
| API | Node.js, Express e TypeScript |
| Banco de dados | MySQL, acessado com `mysql2` |
| Autenticação | JWT, bcrypt e Google OAuth opcional |
| Ferramentas | Vite, `tsx`, esbuild e npm |
| E-mail | Nodemailer e servidor SMTP, para recuperação de senha |

### Organização e fluxo

```text
Navegador (Angular)
        |
        | HTTP /api + JWT quando necessário
        v
Servidor Node.js/Express
        |
        +-- rotas -> controllers -> serviços e repositório
        |                                 |
        |                                 +-- MySQL
        +-- Vite em desenvolvimento ou arquivos compilados em produção
```

O mesmo servidor disponibiliza a interface e a API na porta 3000. O cálculo é feito pela API; em determinadas falhas de comunicação, a interface também possui um cálculo local de contingência. Alguns dados são mantidos em memória e podem ser sincronizados com o MySQL.

## Estrutura do projeto

```text
construtec/
├── frontend/construtec-web/src/  # Aplicação Angular: telas, serviços e componentes
├── backend/construtec-api/src/   # API: rotas, controllers, serviços e repositório
├── database/
│   ├── migrations/                # Scripts de estrutura do banco
│   ├── seeds/                     # Dados iniciais
│   └── scripts/                   # Scripts auxiliares de banco
├── docs/                          # Documentação técnica e funcional
├── public/                        # Arquivos públicos e imagens
├── scripts/                       # Verificação de documentação e testes
├── index.html                     # Página inicial da aplicação
├── server.ts                      # Servidor integrado da interface e API
├── package.json                   # Dependências e comandos npm
└── vite.config.ts                 # Configuração do Vite e Angular
```

## Pré-requisitos

- Node.js e npm instalados. A execução e o build foram verificados com Node.js 24 e npm 11.
- MySQL local ou acessível pela rede, necessário para salvar orçamentos e usar a recuperação de senha.
- Navegador atualizado.
- Git, caso o projeto seja obtido por clonagem.

## Instalação e execução

1. Clone o repositório e entre na pasta:

   ```bash
   git clone https://github.com/jorvanesantos/ConstruTec.git
   cd ConstruTec
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Configure o MySQL e, quando necessário, crie o arquivo `.env` na raiz conforme a seção [Configuração](#configuração).
4. Inicie o projeto:

   ```bash
   npm run dev
   ```

5. Aguarde a mensagem de inicialização e acesse **http://127.0.0.1:3000**. Mantenha o terminal aberto enquanto utiliza a aplicação.

No PowerShell do Windows, se a política de execução bloquear `npm`, use `npm.cmd install` e `npm.cmd run dev`. Para encerrar o servidor, pressione `Ctrl+C` no terminal.

Em desenvolvimento, o servidor aceita conexões somente no próprio computador. Não abra o `index.html` pelo Five Server ou Live Server: eles não compilam o Angular nem executam a API. Se a porta 3000 estiver ocupada, encerre o outro servidor antes de iniciar o ConstruTec.

### Build e execução de produção

```bash
npm run build
npm start
```

O build gera os arquivos em `dist/`; `npm start` serve a interface compilada e a API na porta 3000. Antes de publicar o sistema, revise as configurações de segurança e as limitações descritas abaixo.

## Configuração

O arquivo `.env` é opcional para uma execução local básica. Crie-o manualmente na raiz para substituir as configurações padrão. Exemplo, com valores ilustrativos:

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_NAME=construtec_db
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_mysql
JWT_SECRET=defina_uma_chave_longa_e_aleatoria
FRONTEND_URL=http://127.0.0.1:3000
```

| Variável | Finalidade |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Endereço, porta e nome do banco MySQL. Os padrões são `localhost`, `3306` e `construtec_db`. |
| `DB_USER`, `DB_PASSWORD` | Credenciais do MySQL; por padrão o usuário é `root` e a senha é vazia. Ajuste conforme sua instalação. |
| `JWT_SECRET` | Chave de assinatura dos tokens. Defina uma chave forte e exclusiva; o valor padrão do código é apenas para desenvolvimento. |
| `FRONTEND_URL` | Origem usada nos links de recuperação de senha. Configure com o endereço real da interface; sem configuração, o serviço usa `http://localhost:4200`. |
| `GOOGLE_CLIENT_ID` | Client ID OAuth Web, necessário somente para login Google. |
| `EMAIL_USER`, `EMAIL_PASS` | Credenciais para envio de e-mail; `SMTP_USER` e `SMTP_PASS` são alternativas. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` | Configurações opcionais do servidor e remetente SMTP. Os padrões de host e porta são `smtp.gmail.com` e `587`. |
| `DISABLE_HMR` | Com valor `true`, desativa o HMR e a observação de arquivos no Vite. |

Não publique o `.env`, senhas, tokens ou chaves. A lista de opções e os detalhes da recuperação estão na [documentação completa](docs/DOCUMENTACAO_COMPLETA.md).

### Banco de dados

Ao iniciar, a API tenta conectar ao MySQL, criar o banco e garantir as tabelas necessárias. A conta configurada precisa das permissões adequadas; confira os avisos no terminal, pois uma conexão estabelecida não garante que toda a estrutura foi criada corretamente. Os scripts versionados estão em [`database/`](database/); não é necessário executá-los manualmente no fluxo de inicialização automático.

Se o MySQL estiver indisponível, a aplicação pode iniciar com dados em memória para demonstração, mas **esses dados se perdem ao reiniciar**. Salvar e editar orçamentos e recuperar senha exigem banco de dados disponível. O código inclui contas de demonstração em [`data.repository.ts`](backend/construtec-api/src/repositories/data.repository.ts); elas usam credenciais conhecidas e não são adequadas para produção. Contas já existentes no banco podem ter credenciais diferentes.

### Login Google e recuperação de senha

- **Google:** crie um OAuth Client ID do tipo aplicativo Web, configure `GOOGLE_CLIENT_ID` e autorize no Google Cloud a origem exata utilizada, por exemplo `http://127.0.0.1:3000`. `localhost` e `127.0.0.1` são origens diferentes.
- **Recuperação:** configure MySQL, `FRONTEND_URL` e as credenciais SMTP. Para Gmail, utilize uma senha de aplicativo, não a senha normal da conta.

## Como usar

1. Cadastre uma conta ou entre com uma conta existente.
2. Abra a calculadora, escolha o tipo de obra e informe medidas, opções e desperdício.
3. Confira o resultado, os materiais, as fórmulas e o custo estimado.
4. Use **Adicionar outro cálculo ao orçamento** para reunir serviços diferentes. Os cálculos pendentes permanecem somente na página até serem salvos.
5. Salve o orçamento com o MySQL conectado. Em **Meus Orçamentos**, consulte, acrescente ou edite cálculos; cálculos antigos podem exigir que as medidas sejam informadas novamente.
6. Abra os detalhes e use **Imprimir / Salvar PDF** para gerar a saída pelo navegador.
7. Uma conta administrativa pode acessar o painel de gestão e auditoria.

## API: principais rotas

A URL base local é `http://127.0.0.1:3000/api`. Rotas protegidas utilizam `Authorization: Bearer <token>`; as rotas administrativas também exigem perfil administrativo.

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/health` | Verificar a disponibilidade da API. |
| POST | `/auth/register`, `/auth/login` | Criar conta e iniciar sessão. |
| GET | `/auth/me` | Consultar o perfil autenticado. |
| POST | `/auth/esqueci-senha`, `/auth/redefinir-senha` | Solicitar recuperação e redefinir senha. |
| POST | `/calculos/:tipo` | Calcular materiais para um tipo de obra; exige autenticação. |
| GET, POST | `/orcamentos` | Listar ou criar orçamentos; a criação exige autenticação e MySQL. |
| PUT, DELETE | `/orcamentos/:id` | Atualizar ou excluir um orçamento; exige autenticação. |
| GET | `/materiais`, `/tipos-obras`, `/precos` | Consultar catálogo e preços de referência. |
| GET | `/admin/stats`, `/admin/usuarios` | Consultar estatísticas e usuários administrativos. |

A lista completa e as regras de acesso estão em [`api.routes.ts`](backend/construtec-api/src/routes/api.routes.ts) e na [documentação completa](docs/DOCUMENTACAO_COMPLETA.md).

## Verificação e testes

Na raiz do projeto:

```bash
npm run lint
npm run build
node --import tsx --test scripts\painting-ceiling.test.ts
npm run docs
```

`lint` verifica os tipos TypeScript; `build` compila a aplicação; o teste de pintura verifica teto e massa nos cálculos local e da API. `docs` apenas verifica a existência e o título da documentação consolidada, não os fluxos da aplicação.

## Solução de problemas

| Problema | Verificação |
|---|---|
| Tela branca ou porta 3000 ocupada | Encerre o Five Server, Live Server ou outro processo nessa porta. Execute `npm run dev` e acesse o endereço informado pelo servidor. |
| MySQL indisponível | Confira se o serviço está ativo, as variáveis `DB_*`, as permissões e os avisos no terminal. Em memória não é possível salvar orçamentos. |
| Login Google não funciona | Confira o Client ID e a origem exata autorizada no Google Cloud. |
| E-mail de recuperação não chega | Confira MySQL, credenciais e configurações SMTP, `FRONTEND_URL` e os logs, sem compartilhar dados sensíveis. |
| Cálculos pendentes desapareceram | Eles ficam na memória da página até salvar; sair ou atualizar pode descartá-los. |

## Limitações e documentação complementar

- A disponibilidade do banco, serviços externos e permissões do navegador afetam algumas funcionalidades.
- Na criação de orçamento com vários cálculos, o custo inicial registrado na visão administrativa usa o cálculo principal; consulte a [documentação completa](docs/DOCUMENTACAO_COMPLETA.md) para detalhes de persistência e outras limitações.
- As contas de demonstração e a chave JWT padrão não são apropriadas para implantação pública.
- A documentação técnica detalhada, incluindo arquitetura, fluxos, banco, autenticação e API, está em [Documentação Completa](docs/DOCUMENTACAO_COMPLETA.md).
