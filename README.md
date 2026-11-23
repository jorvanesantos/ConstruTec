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

Alguns materiais usam preços SINAPI por UF e mês, obtidos dos relatórios oficiais da CAIXA; os demais usam estimativas não oficiais com multiplicadores regionais. Cada item informa sua origem. Não há consulta oficial em tempo real nem garantia de que o preço inclua frete.

A API verifica o último relatório ao iniciar e a cada 24 horas enquanto estiver ligada. Caso não haja publicação nova ou ocorra falha, conserva a última importação; a competência é mostrada no item. Os preços são gravados por UF e competência na tabela `sinapi_preco`. A importação cobre os insumos mapeados em `SINAPI_MATERIALS`, não todo o catálogo SINAPI. Antes de iniciar uma instalação nova ou atualizar uma instalação existente, execute a manutenção administrativa descrita em [Banco de dados](#banco-de-dados). Para verificar apenas a conectividade à fonte oficial, use `npm run sinapi:verificar`.

O preço do cimento CP II publicado por kg é multiplicado por 50 para o saco de 50 kg; argamassas e cal por 20 para sacos de 20 kg, tinta e selador por 18 para latas de 18 litros, massa por 25 para barrica de 25 kg, e a telha de fibrocimento por 2,44 × 1,10 para obter o preço da placa. Confira sempre a descrição oficial associada, a unidade, a competência e o dimensionamento da obra antes de comprar.

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

O mesmo servidor disponibiliza a interface e a API na porta 3000. Os cálculos, os preços, as regiões e os tipos de obra apresentados na calculadora são obtidos pela API; se a conexão falhar, a interface informa o erro e não gera uma estimativa local. Alguns dados são mantidos em memória e podem ser sincronizados com o MySQL.

Novos cálculos são assinados pela API e vinculados à conta, para detectar alterações nos valores antes de salvar o orçamento. Os parâmetros de edição e a localização anexados pela interface não são cobertos pela assinatura. Cálculos antigos já salvos continuam disponíveis para edição sem alteração; para modificar um cálculo antigo, recalcule-o. Se `JWT_SECRET` mudar, cálculos ainda não salvos precisam ser refeitos.

As fórmulas de materiais e os totais gravados no banco são calculados pela API. A soma exibida para vários cálculos e o total acumulado do painel ainda são calculados no navegador; não são usados para definir o valor gravado no banco.

## Estrutura do projeto

```text
construtec/
├── frontend/construtec-web/src/  # Aplicação Angular: telas, serviços e componentes
├── backend/construtec-api/src/   # API: rotas, controllers, serviços e repositório
├── database/
│   ├── migrations/                # Scripts de estrutura do banco
│   ├── seeds/                     # Dados iniciais
│   └── scripts/                   # Scripts auxiliares de banco
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
```

| Variável | Finalidade |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Endereço, porta e nome do banco MySQL. Os padrões são `localhost`, `3306` e `construtec_db`. |
| `DB_USER`, `DB_PASSWORD` | Credenciais do MySQL; por padrão o usuário é `root` e a senha é vazia. Ajuste conforme sua instalação. |
| `JWT_SECRET` | Chave de assinatura dos tokens. Defina uma chave forte e exclusiva; o valor padrão do código é apenas para desenvolvimento. |
| `GOOGLE_CLIENT_ID` | Client ID OAuth Web, necessário somente para login Google. |
| `EMAIL_USER`, `EMAIL_PASS` | Credenciais para envio de e-mail; `SMTP_USER` e `SMTP_PASS` são alternativas. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` | Configurações opcionais do servidor e remetente SMTP. Os padrões de host e porta são `smtp.gmail.com` e `587`. |
| `DISABLE_HMR` | Com valor `true`, desativa o HMR e a observação de arquivos no Vite. |

Não publique o `.env`, senhas, tokens ou chaves. Consulte as opções acima e as instruções de recuperação de senha a seguir.

### Banco de dados

Ao iniciar ou reconectar, a API usa `DB_USER` e `DB_PASSWORD` para acessar o banco **já preparado**. Ela verifica as tabelas e as colunas de recuperação de senha, mas não cria nem altera a estrutura. Se o banco ou uma dessas estruturas estiver ausente, a conexão é informada como indisponível e o terminal orienta a executar a manutenção.

Para criar ou atualizar a estrutura, faça backup antes em um banco existente e execute separadamente `npm run db:migrate` com uma conta administrativa autorizada. Configure `DB_ADMIN_USER` e `DB_ADMIN_PASSWORD` somente no ambiente desse comando; ele usa `DB_HOST`, `DB_PORT` e `DB_NAME` para escolher o mesmo servidor e banco da aplicação. No PowerShell local, por exemplo, para o MariaDB atual com `root` sem senha:

```powershell
$env:DB_ADMIN_USER = "root"
$env:DB_ADMIN_PASSWORD = ""
npm.cmd run db:migrate
Remove-Item Env:\DB_ADMIN_USER, Env:\DB_ADMIN_PASSWORD
```

Para produção, use uma senha administrativa forte, fornecida por um gerenciador de segredos ou outro mecanismo seguro, sem incluí-la no código ou em comandos do histórico. Mantenha essas credenciais fora do processo da API. A conta de execução necessita de `SELECT`, `INSERT`, `UPDATE` e `DELETE` nas tabelas do banco; ela não precisa de `CREATE`, `ALTER` ou `DROP`. O comando administrativo precisa de `CREATE` para o banco e suas tabelas e `ALTER` para atualizações da estrutura. O comando de manutenção altera a estrutura existente e não apaga dados intencionalmente, mas comandos DDL não são transacionais; confira o backup e as permissões antes de executá-lo. Os scripts em [`database/`](database/) são recursos adicionais e não são executados automaticamente por esse comando.

Se o MySQL estiver indisponível, a aplicação pode iniciar com dados de catálogo em memória, mas **login, cadastro, validação de sessão, salvamento de orçamentos e recuperação de senha exigem o banco de dados disponível**. O código inclui contas de demonstração em [`data.repository.ts`](backend/construtec-api/src/repositories/data.repository.ts), inseridas ao inicializar um banco sem usuários; elas usam credenciais conhecidas e não são adequadas para produção. Contas já existentes no banco podem ter credenciais diferentes.

### Login Google e recuperação de senha

- **Google:** crie um OAuth Client ID do tipo aplicativo Web, configure `GOOGLE_CLIENT_ID` e autorize no Google Cloud a origem exata utilizada, por exemplo `http://127.0.0.1:3000`. `localhost` e `127.0.0.1` são origens diferentes.
- **Recuperação:** configure MySQL e as credenciais SMTP. Para Gmail, utilize uma senha de aplicativo, não a senha normal da conta. Em **Esqueci minha senha**, informe o e-mail e digite na aplicação o código temporário recebido para criar uma nova senha. O código expira após uma hora, é de uso único e não altera a senha atual até a confirmação da nova senha. Uma nova solicitação invalida o código anterior.

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
| POST | `/auth/esqueci-senha`, `/auth/verificar-codigo-recuperacao`, `/auth/redefinir-senha` | Solicitar código, verificá-lo e redefinir senha. |
| POST | `/calculos/:tipo` | Calcular materiais para um tipo de obra; exige autenticação. |
| GET, POST | `/orcamentos` | Listar ou criar orçamentos; a criação exige autenticação e MySQL. |
| PUT, DELETE | `/orcamentos/:id` | Atualizar ou excluir um orçamento; exige autenticação. |
| GET | `/materiais`, `/tipos-obras`, `/precos` | Consultar catálogo e preços de referência. |
| GET | `/admin/stats`, `/admin/usuarios` | Consultar estatísticas e usuários administrativos. |

A lista completa e as regras de acesso estão em [`api.routes.ts`](backend/construtec-api/src/routes/api.routes.ts).

## Verificação e testes

Na raiz do projeto:

```bash
npm run lint
npm run build
node --import tsx --test scripts\painting-ceiling.test.ts
node --import tsx --test scripts\calculation-api.test.ts
node --import tsx --test scripts\catalog-budget-api.test.ts
node --import tsx --test scripts\documentation.test.ts
node --import tsx --test scripts\password-recovery.test.mjs
node --import tsx --test scripts\auth-database.test.mjs
npm run docs
```

`lint` verifica os tipos TypeScript; `build` compila a aplicação; os testes verificam os cálculos e preços pela API, o histórico, o cálculo de pintura, as rotas do README, a autenticação e a recuperação de senha com banco e envio de e-mail simulados. `docs` apenas verifica a existência e o título do README.

## Solução de problemas

| Problema | Verificação |
|---|---|
| Tela branca ou porta 3000 ocupada | Encerre o Five Server, Live Server ou outro processo nessa porta. Execute `npm run dev` e acesse o endereço informado pelo servidor. |
| MySQL indisponível | Confira se o serviço está ativo, as variáveis `DB_*`, as permissões e os avisos no terminal. Sem banco, não é possível autenticar ou salvar orçamentos. |
| Login Google não funciona | Confira o Client ID e a origem exata autorizada no Google Cloud. |
| E-mail de recuperação não chega | Confira MySQL, credenciais e configurações SMTP, a caixa de spam e os logs, sem compartilhar dados sensíveis. |
| Cálculos pendentes desapareceram | Eles ficam na memória da página até salvar; sair ou atualizar pode descartá-los. |

## Limitações e documentação complementar

- A disponibilidade do banco, serviços externos e permissões do navegador afetam algumas funcionalidades.
- As contas de demonstração e a chave JWT padrão não são apropriadas para implantação pública.
- O README é a documentação principal do projeto e pode ser consultado ou baixado na página **Sobre**.
