# ConstruTec — guia completo de funcionamento e apresentação

Este é o documento central do projeto. Explica o que o sistema faz, as tecnologias, o caminho dos dados, as responsabilidades de cada pasta e arquivo e uma forma simples de apresentar o produto. Foi escrito para leitura e estudo, não apenas para consulta por desenvolvedores.

> **Estado documentado:** aplicação React/TypeScript servida por Node.js/Express; API e interface no mesmo processo; MySQL é necessário para persistir configurações globais e preços administrados. Sem o banco, algumas operações funcionam apenas em memória durante a execução. Não há backend Java neste projeto.

## 1. O sistema em uma frase

O ConstruTec é uma aplicação web que recebe dimensões e características de uma obra, calcula quantidades estimadas de materiais e preços, apresenta a memória do cálculo e permite organizar orçamentos, catálogo e funções administrativas.

## 2. Como explicar a arquitetura

Pense no sistema como quatro partes conectadas:

1. **Interface (frontend):** telas que a pessoa vê e usa no navegador. Está em `src/` e foi construída com React e TypeScript.
2. **Servidor e API:** recebe pedidos HTTP, autentica usuários, calcula quando a API é chamada, coordena dados e entrega o site. O ponto de entrada principal é `server.ts`.
3. **Regras e dados de referência:** as fórmulas vivem em `src/services/calculationEngine.ts`; os tipos de obra, materiais e referências regionais ficam em `src/data/catalog.ts`.
4. **Persistência:** MySQL pode guardar usuários, materiais, orçamentos, histórico e cálculos salvos. A conexão usa `mysql2` e está separada em `src/config/database.ts`.

No desenvolvimento, o próprio Express incorpora o middleware do Vite. Assim, interface e API são acessadas na mesma origem, normalmente `http://localhost:3000`; não é preciso iniciar um servidor Java ou manter uma API em outra porta.

```text
Pessoa
  │ navegador
  ▼
React (src/)
  ├─ consulta catálogo e localização de referência
  ├─ calcula no navegador pelo CalculationService
  └─ chama endpoints HTTP quando precisa de API/autenticação/persistência
       │
       ▼
Node.js + Express (server.ts)
  ├─ endpoints existentes: login, catálogo, orçamentos, administração
  ├─ rota modular: /api/calculos/salvos
  └─ pool mysql2 (src/config/database.ts)
       │
       ▼
MySQL local (XAMPP) — banco construtec
```

### O que acontece ao iniciar

1. `INICIAR_PROJETO.bat` (Windows) ou `iniciar_projeto.sh` (Unix) verifica Node.js, instala dependências se necessário e chama `npm run dev`. Também é possível executar os comandos manualmente.
2. `npm run dev` inicia `tsx server.ts`. `dotenv/config` carrega as variáveis locais de `.env`.
3. `startServer()` tenta conectar ao MySQL. Primeiro tenta criar o banco configurado, depois abre o pool, testa a conexão, verifica tabelas e sincroniza alguns dados.
4. Se a conexão falhar, o servidor informa o problema e continua com os dados mantidos em memória. Esses dados em memória duram somente enquanto o processo está ligado.
5. Em desenvolvimento, Express encaixa o middleware do Vite; em produção, serve os arquivos de `dist/`.
6. O navegador recebe `index.html`, que carrega `src/main.tsx`; esse arquivo monta o React e renderiza `App`.

**Importante:** o fallback em memória permite que partes do sistema continuem funcionando, mas não equivale a uma gravação permanente. A rota de cálculos salvos retorna `503` quando o MySQL está indisponível.

### Caminho da tela até o resultado

1. `src/main.tsx` monta o componente raiz `App`.
2. `App.tsx` recupera tema, localização, usuário e orçamentos do `localStorage`, determina a aba inicial e organiza a navegação.
3. Ao abrir a calculadora, o `AuthGuard` verifica se existe usuário conectado; sem sessão, mostra as opções de entrar ou criar conta.
4. `Calculator.tsx` apresenta os campos adequados ao tipo de obra e mantém as medidas em estado React.
5. Ao calcular, o componente chama `CalculationService.calculate(tipo, parâmetros)`.
6. O motor escolhe a fórmula, busca os materiais de referência, aplica desperdício e multiplicador regional e devolve quantidades e custos estimados.
7. A interface mostra itens, fórmulas, premissas técnicas e resultado. O cálculo normal da tela acontece no próprio processo do navegador.
8. Ao salvar um orçamento, a tela chama `POST /api/orcamentos`; o servidor atualiza seus registros, registra auditoria e tenta salvar no MySQL. O React também atualiza estado e `localStorage`.
9. A rota separada `POST /api/calculos/salvos` grava um exemplo de resultado e parâmetros na tabela `calculos`. Ela **não é chamada automaticamente pela calculadora**.

## 3. Tecnologias e para que cada uma serve

| Tecnologia | Uso no ConstruTec |
|---|---|
| React 19 | Constrói a interface em componentes e atualiza as telas quando o estado muda. |
| TypeScript | Acrescenta tipos a dados, propriedades de componentes e resultados, ajudando a detectar erros antes de executar. |
| Vite 6 | Desenvolve e empacota o frontend; no modo desenvolvimento oferece atualização rápida ao editar arquivos. |
| Node.js | Executa o servidor JavaScript/TypeScript fora do navegador. |
| Express | Define a API HTTP, middlewares, autenticação e entrega de arquivos estáticos. |
| `tsx` | Executa `server.ts` diretamente em desenvolvimento, sem uma etapa manual de compilação. |
| `esbuild` | Empacota o servidor Node para produção como `dist/server.cjs`. |
| MySQL | Banco relacional opcional para manter dados entre reinicializações. |
| `mysql2/promise` | Driver MySQL com API assíncrona; o pool reutiliza conexões com o banco. |
| `jsonwebtoken` | Assina e valida tokens JWT usados pelas rotas protegidas. |
| Tailwind CSS 4 | Estiliza a aplicação com classes utilitárias; `index.css` inclui tokens e regras globais. |
| Lucide React | Ícones usados nos componentes de interface. |
| `motion` | Recursos de animação da interface. |
| `canvas-confetti` | Efeitos visuais de celebração na interface. |
| `dotenv` | Carrega variáveis do arquivo local `.env` no processo Node. |

### Comandos definidos no `package.json`

- `npm run dev`: inicia o servidor integrado de desenvolvimento.
- `npm run build`: gera os arquivos estáticos em `dist/` e o servidor `dist/server.cjs`.
- `npm run start`: executa o servidor já compilado para produção.
- `npm run preview`: inicia a visualização local do build do Vite.
- `npm run lint`: executa `tsc --noEmit`, checando tipos sem criar arquivos de saída.
- `npm run clean`: tenta remover artefatos locais de build; o comando atual usa sintaxe Unix e pode precisar de adaptação para PowerShell/Windows.

`npm install` usa `package.json` e `package-lock.json`; `bun.lock` é o lockfile do Bun. É preferível escolher um gerenciador por instalação e manter seu lockfile atualizado.

## 4. Fluxos principais de uso

### 4.1 Cálculo

O usuário escolhe o tipo de obra, informa dimensões, vãos, acabamento e desperdício, escolhe a localização e aciona o cálculo. O componente envia os valores para o serviço local; ele não precisa esperar uma consulta de API para mostrar o resultado.

Um resultado `CalculationResult` inclui:

- tipo de obra, área e, quando aplicável, volume/perímetro;
- lista de materiais com quantidade teórica, quantidade comercial, unidade e preço;
- subtotal, custo de desperdício e total estimado;
- fórmulas usadas, premissas técnicas, resumo das entradas e data do cálculo.

O motor encontra o item de catálogo por ID. Para cada material, ajusta o preço base pela localização e arredonda os valores exibidos conforme o pacote/unidade de compra.

### 4.2 Preços e localização

`src/data/catalog.ts` contém localizações de referência para 15 UFs e seus multiplicadores. O preço calculado segue a ideia:

```text
preço regional estimado = preço administrado (ou preço de referência) × multiplicador da localização
```

A localização escolhida é mantida pelo frontend em `localStorage`. A tela de materiais consulta `GET /api/materiais`; o servidor inicia com os itens de `src/data/catalog.ts` e usa os preços mantidos no catálogo administrativo. Quando um preço de material existente é alterado por um administrador, o servidor também atualiza a configuração consumida pelo motor, então a mudança aparece no catálogo e nos próximos cálculos. Se o MySQL estiver conectado, material e configuração são persistidos juntos; sem MySQL, a mudança vale somente até o servidor reiniciar. Não há sincronização automática confirmada com uma API oficial do SINAPI.

### 4.3 Salvar e consultar orçamentos

- O botão de salvar cria um objeto `SavedBudget`, chama `POST /api/orcamentos` e atualiza a lista exibida.
- `App.tsx` persiste a lista atual em `localStorage`.
- O Express também mantém estruturas em memória e, se conectado, tenta gravar na tabela MySQL `orcamentos`.
- `GET /api/orcamentos` lista registros do banco quando encontra dados; caso contrário, usa a lista em memória. A interface consulta essa rota ao montar.
- O botão de exclusão remove o item do estado da aplicação e chama `DELETE /api/orcamentos/:id`.

Isso combina estado do navegador, memória do servidor e MySQL. `localStorage` pertence ao navegador atual; memória se perde ao reiniciar o servidor; somente registros confirmados no banco permanecem guardados entre execuções.

### 4.4 Conta e permissões

1. O modal de autenticação recolhe e valida os dados.
2. `AuthService` chama `/api/auth/login` ou `/api/auth/register`.
3. O servidor consulta ou atualiza seus usuários em memória e, quando disponível, também o MySQL.
4. Após autenticar, a API devolve usuário e token; o frontend salva a sessão em `localStorage`.
5. A interface usa `AuthGuard` e as funções de permissão de `AuthService` para controlar o que exibe.
6. Nas rotas administrativas, o servidor verifica o JWT, a situação da conta e o tipo de usuário com middlewares. A verificação do backend é a barreira da API; esconder uma aba no React, por si só, não protege um endpoint.

Papéis usados pelo código: usuário comum (`USUARIO`), administrador normal (`ADM`) e administrador master/proprietário (`ADM_MASTER` ou `PROPRIETARIO`). A matriz implementada é:

| Ação | Usuário final | ADM Normal | ADM Master |
|---|---:|---:|---:|
| Calcular e trabalhar com seus próprios orçamentos | Sim | Sim | Sim |
| Ver orçamentos e cálculos de outros usuários | Não | Somente nos fluxos administrativos autorizados | Sim, para administração |
| Criar/editar usuários finais e redefinir suas senhas | Não | Sim | Sim |
| Criar, editar ou excluir outros administradores | Não | Não | Sim |
| Cadastrar materiais e atualizar preços | Não | Sim | Sim |
| Alterar parâmetros estruturais do cálculo | Não | Não | Sim |
| Alterar configurações globais do sistema | Não | Não | Sim |
| Consultar faturamento global | Não | Não | Não disponível: o sistema não possui faturamento/pagamentos integrados |

O histórico pessoal é separado por proprietário. A redefinição administrativa gera uma senha temporária; recuperação pública de senha está indisponível até existir uma integração segura de e-mail. Usuários autenticados podem abrir chamados de suporte e acompanhar as respostas; ADM Normal e ADM Master respondem e atualizam seus status no painel. A gestão de parâmetros configuráveis atualmente cobre os percentuais de desperdício e o rendimento de blocos/tijolos por metro quadrado; as demais fórmulas continuam definidas no motor de cálculo.

### 4.5 Painel administrativo

O painel reúne estatísticas, usuários, tipos de obra, materiais, obras, chamados e histórico. A interface consulta endpoints `/api/admin/...`; operações protegidas passam por autenticação JWT e autorização administrativa. Materiais e seus preços alimentam o catálogo público e, para materiais reconhecidos pelo motor, os cálculos. Chamados pertencem ao usuário que os abriu; cada cliente só lista os próprios, enquanto administradores autorizados podem responder e mudar o status. Chamados e alterações de materiais são mantidos em memória quando MySQL está indisponível, com aviso de que não são persistentes; quando conectado, o banco os mantém entre execuções. Configurações globais e parâmetros de cálculo exigem MySQL e retornam erro explícito quando ele está indisponível. O ADM Normal não pode alterar tipos de obra estruturais, parâmetros de fórmula ou configurações gerais.

### 4.6 Impressão e compartilhamento

`PrintBudgetModal.tsx` apresenta um resultado formatado para impressão. A calculadora também monta um resumo de texto para copiar/compartilhar. Essas ações usam o resultado já existente no frontend.

## 5. Os nove tipos de cálculo existentes

As fórmulas estão em `src/services/calculationEngine.ts`. `CalculationService.calculate()` atua como distribuidor: recebe uma chave e encaminha os parâmetros ao método específico. Os resultados são estimativas baseadas nas premissas declaradas pelo próprio código; não substituem projeto, orçamento de profissional ou dimensionamento estrutural.

| Tipo | Método | O que o código considera |
|---|---|---|
| Muro (`muro`) | `calculateMuro` | Comprimento × altura, dedução de vãos informados, escolha de bloco/tijolo, percentual de desperdício, cimento e areia. Usa referência de 12,5 blocos/m² ou 25 tijolos/m². |
| Parede (`parede`) | `calculateParede` | Área líquida após portas/janelas, bloco ou tijolo, número de faces revestidas, consumo de cimento, cal e areia. |
| Piso (`piso`) | `calculatePiso` | Comprimento × largura, desperdício, compra de revestimento em múltiplos de 1,8 m², argamassa e rejunte. O tamanho da placa altera o consumo. |
| Pintura (`pintura`) | `calculatePintura` | Área de paredes menos vãos, demãos, rendimento de tinta configurável, e opções de selador, massa e kit de pintura. |
| Concreto (`concreto`) | `calculateConcreto` | Volume geométrico e traços `1:2:3`, `1:2.5:3.5` ou `1:3:4`, com cimento, areia e brita. |
| Fundação (`fundacao`) | `calculateFundacao` | Volume de baldrame, sapatas ou brocas cilíndricas, além de concreto, aço, arame e tábuas para formas. |
| Telhado (`telhado`) | `calculateTelhado` | Área projetada, correção de inclinação `√(1 + (inclinação/100)²)`, telhas cerâmicas ou placas de fibrocimento e opção de madeiramento. |
| Revestimento (`revestimento`) | `calculateRevestimento` | Área de parede e deduções estimadas para portas/janelas, compra de revestimento em caixas, argamassa AC-II e rejunte. |
| Personalizado (`outro`) | `calculateOutro` | Área e espessura para estimar volume, cimento, areia, brita e inclusões opcionais de alvenaria/pintura. |

### Exemplo simples para explicar o motor

Para um muro, o código calcula primeiro a área bruta (`comprimento × altura`), subtrai os vãos informados e aplica a margem de desperdício. Em seguida, calcula unidades de bloco/tijolo e argamassa. Cada material tem preço de referência; o serviço multiplica pelo fator da região, soma os itens e constrói o resultado com fórmulas e premissas para a interface apresentar.

## 6. API: principais grupos de rotas

Todas as rotas abaixo são montadas pelo Express em `server.ts`, exceto o grupo explicitamente extraído para `src/routes/savedCalculations.routes.ts`.

### Diagnóstico e banco

| Método e caminho | Finalidade |
|---|---|
| `GET /api/health` | Informa estado do serviço, estado conhecido do banco e horário. |
| `GET /api/status-banco` | Apresenta diagnóstico e configuração pública da conexão. |
| `POST /api/conectar-banco` | Tenta inicializar/sincronizar a conexão novamente. |

### Autenticação

| Método e caminho | Finalidade |
|---|---|
| `POST /api/auth/login` | Valida credenciais e inicia sessão com token. |
| `POST /api/auth/register` | Registra um usuário conforme as validações da API. |
| `POST /api/auth/google` | Fluxo de autenticação associado ao provedor Google. |
| `POST /api/auth/alterar-senha` | Altera senha em sessão autenticada. |
| `POST /api/auth/recuperar-senha/solicitar` e `/redefinir` | Retornam `503` até configurar um provedor de e-mail seguro; o sistema não revela códigos de recuperação. |

### Catálogo e cálculos

| Método e caminho | Finalidade |
|---|---|
| `GET /api/tipos-obras` | Lista tipos de obra ativos mantidos pelo servidor. |
| `GET /api/materiais` e `GET /api/materiais/:id` | Lista ou consulta materiais. |
| `GET /api/precos` | Retorna localizações e observação sobre estimativa de preços. |
| `GET /api/calculation-settings` | Retorna desperdícios, rendimentos configuráveis e preços usados nos cálculos. |
| `GET /api/system-settings` | Retorna nome e termos atuais do sistema. |
| `POST /api/calculos` | Calcula para `tipoObra` enviado no JSON; não salva o resultado. |
| `POST /api/calculos/:tipo` | Calcula para o tipo indicado na URL; não salva o resultado. |
| `POST /api/calculos/salvos` | Valida e persiste tipo, parâmetros e resultado como JSON. Requer MySQL ativo. |
| `GET /api/calculos/salvos` | Lista até 50 cálculos salvos mais recentes. |
| `GET /api/calculos/salvos/:id` | Busca um cálculo salvo por identificador numérico. |

Exemplo de requisição da rota de persistência:

```json
{
  "tipoObra": "muro",
  "parametros": { "length": 5, "height": 2 },
  "resultado": { "totalEstimatedCost": 1250.5 }
}
```

Respostas importantes: `201` ao salvar, `400` para corpo inválido, `404` para ID válido não encontrado, `503` quando MySQL não está disponível e `500` se houver falha de banco inesperada. O exemplo guarda JSON fornecido pelo cliente: ele não recalcula nem confirma que os valores vieram do motor.

### Orçamentos

`GET/POST /api/orcamentos` lista e cria orçamentos; `PUT /api/orcamentos/:id` atualiza e `DELETE /api/orcamentos/:id` remove. A estrutura também registra ações de auditoria e mantém obras recentes para o painel.

### Chamados de suporte

| Método e caminho | Finalidade |
|---|---|
| `POST /api/chamados` | Abre um chamado para o usuário autenticado. |
| `GET /api/chamados` | Lista somente os chamados pertencentes ao usuário autenticado. |
| `GET /api/admin/chamados` | Lista chamados para ADM Normal e ADM Master. |
| `PATCH /api/admin/chamados/:id` | Registra resposta e/ou atualiza o status do chamado. |

O MySQL persiste chamados entre reinicializações. Se o banco estiver indisponível, a API mantém os chamados na memória da sessão e informa que eles não são permanentes.

### Administração

Rotas sob `/api/admin/...` cobrem estatísticas, usuários, tipos de obra, materiais, obras, cálculos persistidos, chamados e histórico. São protegidas pelos middlewares de token e papel administrativo; criação/gestão de administradores exige papel master em operações específicas. ADM Normal precisa informar um motivo ao moderar obras ou excluir cálculos persistidos. O produto não tem recurso de comentários para moderar.

### Documento único

- `GET /api/docs/download` baixa o guia Markdown.
- `GET /api/docs/content` devolve o conteúdo do guia em JSON (`{ "content": "..." }`).
- O conteúdo também é servido sob `/documentacao/GUIA_COMPLETO_CONSTRUTEC.md`.

## 7. MySQL, variáveis e tabelas

### Configuração para XAMPP

O arquivo `.env` é local e não deve ser compartilhado. O exemplo do repositório, `.env.example`, mostra os nomes das variáveis:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=construtec
DB_USER=root
DB_PASSWORD=
```

O `.env` deste workspace está configurado com esses padrões locais. Usuário `root` sem senha é uma configuração local típica do XAMPP; para ambiente exposto, use usuário e senha apropriados e não publique credenciais.

### Banco e esquema

O script `database/create_calculations.sql` cria o banco `construtec` e a tabela mínima que a rota modular usa:

| Coluna | Significado |
|---|---|
| `id` | Identificador numérico gerado pelo MySQL. |
| `tipo_obra` | Chave do tipo de cálculo, como `muro`. |
| `parametros_json` | JSON recebido com as entradas do cálculo. |
| `resultado_json` | JSON recebido com o resultado a guardar. |
| `criado_em` | Data/hora automática de criação. |

O servidor também executa `CREATE TABLE IF NOT EXISTS` para `usuarios`, `historico`, `materiais`, `orcamentos` e `calculos` ao conectar. O script completo `database/create_tables.sql` inclui entidades normalizadas como `localizacoes`, `tipos_obra`, `obras`, `orcamentos`, `orcamento_materiais` e `historico`.

> **Diferença importante para explicar com precisão:** os `CREATE TABLE` embutidos no servidor são simplificados e não correspondem em todos os campos ao esquema mais completo do arquivo `database/create_tables.sql`. `IF NOT EXISTS` cria tabelas que faltam, mas não converte uma tabela já criada para outra estrutura. Antes de usar um banco de produção, alinhe e versione um único esquema/migração para evitar divergência.

### O que é sincronizado e o que persiste

- Na inicialização, o servidor tenta carregar usuários, materiais e histórico que encontra no banco.
- A tabela `calculos` armazena os novos registros da rota `/api/calculos/salvos`.
- Os orçamentos são gravados por outra rota/tabela e também mantidos na lista em memória.
- Nem todas as estruturas em memória são carregadas do banco; por exemplo, a inicialização não reconstrói todas as listas de orçamentos, tipos de obra e obras a partir do SQL.
- Com MySQL indisponível, a rota de cálculos salvos informa indisponibilidade; não finge que a gravação foi concluída.

## 8. Estrutura atual: pastas e arquivos

As descrições abaixo refletem os arquivos de código-fonte e configuração do projeto. `node_modules/` e `dist/` são gerados/instalados; não devem ser editados manualmente. A antiga pasta Java e diretórios de documentação vazios foram removidos.

### Arquivos na raiz

| Arquivo | Papel no sistema |
|---|---|
| `.env` | Configuração local do processo; está ignorado pelo Git e contém valores locais. Não compartilhar nem versionar. |
| `.env.example` | Modelo de variáveis para copiar/adaptar ao criar outro ambiente. |
| `.gitignore` | Evita versionar dependências, build, arquivos locais, logs e `.env`; também ignora artefatos locais do fluxo de modernização. |
| `README.md` | Entrada rápida do repositório: tecnologias, comandos, banco e teste da rota. |
| `package.json` | Manifesto da aplicação, dependências e comandos npm. |
| `package-lock.json` | Versões resolvidas do npm para instalação reproduzível. |
| `bun.lock` | Lockfile do Bun, outro gerenciador suportado pelo projeto. |
| `tsconfig.json` | Regras do TypeScript, JSX, alias `@`, resolução de módulos e checagem de tipos. |
| `vite.config.ts` | Plugins React/Tailwind, alias de imports e plugin para mídias do AI Studio no Vite. |
| `server.ts` | Entrada do backend Node/Express: conexão e sincronização MySQL, dados em memória, autenticação, autorização, APIs, auditoria, documentos e inicialização de Vite/servidor. |
| `index.html` | HTML inicial entregue ao navegador; declara metadados e ponto `<div id="root">` onde React será montado. |
| `INICIAR_PROJETO.bat` | Inicialização conveniente no Windows; verifica Node, pode executar `npm install`, abre navegador e inicia o servidor. |
| `iniciar_projeto.sh` | Inicialização equivalente em sistemas Unix/macOS. |
| `metadata.json` | Metadados e capacidades do projeto para o ambiente de desenvolvimento que o utiliza. |

### `.github/`

Configurações e automações associadas ao GitHub e às ferramentas de desenvolvimento. O conteúdo de modernização Java é configuração auxiliar local, ignorada pelo Git e não é backend da aplicação. Hooks em `hooks/scripts/recordToolUse.ps1` e `recordToolUse.sh` registram uso de ferramentas em PowerShell e shell.

### `.vscode/`

- `settings.json`: configura preferências locais do editor; a definição atual configura a porta do Live Server.

### `database/`

Contém SQL para banco e dados iniciais.

| Arquivo | Papel |
|---|---|
| `create_calculations.sql` | Cria o banco `construtec` e a tabela `calculos` usada pela rota exemplo de gravação/consulta. |
| `create_database.sql` | Cria/seleciona o banco `construtec`. |
| `create_tables.sql` | Define o conjunto mais amplo de tabelas relacionais para usuários, regiões, tipos, materiais, obras, orçamentos e auditoria. |
| `insert_data.sql` | Insere registros iniciais de demonstração e referências usadas pelo esquema SQL. |
| `admin_migration.sql` | Atualiza o esquema SQL para recursos administrativos e histórico; é migração, não precisa ser executada em cada inicialização da aplicação. |

### `documentacao/`

- `GUIA_COMPLETO_CONSTRUTEC.md`: documento central que reúne arquitetura, tecnologias, fluxos, módulos, arquivos, API, MySQL e roteiro de apresentação. Os links da interface e do servidor apontam para este arquivo.

### `public/`

Arquivos estáticos do frontend. Tudo aqui pode ser copiado para a saída pública do build.

- `assets/aistudio/.gitignore`: controla os recursos gerenciados localmente pelo AI Studio dentro dessa pasta.
- Não há cópia paralela da documentação: a fonte oficial fica em `documentacao/`.

### `src/`

Código TypeScript/React e módulos usados pelo servidor Node.

#### Arquivos centrais

| Arquivo | Papel e relação com o fluxo |
|---|---|
| `App.tsx` | Componente raiz. Controla aba atual, usuário, tema, tipo de obra, localização, orçamentos, sidebar e modais; conecta componentes filhos aos serviços. |
| `main.tsx` | Cria a raiz React, ativa `StrictMode`, monta `App` no elemento `root` e importa `index.css`. |
| `index.css` | Estilos globais, Tailwind, variáveis de cor e comportamento de tema claro/escuro. |
| `types.ts` | Contratos de dados do aplicativo: `CalculationResult`, `MaterialItem`, `SavedBudget`, `SupportTicket`, localização, usuários, papéis, materiais e dados administrativos. |
| `vite-env.d.ts` | Tipos de ambiente para integração com Vite/TypeScript. |

#### `src/components/`

Componentes de tela e interface. `App.tsx` combina as telas conforme a navegação.

| Arquivo | O que apresenta ou coordena |
|---|---|
| `Hero.tsx` | Página inicial e atalhos para os tipos de cálculo e principais ações. |
| `Header.tsx` | Barra superior, conta, ações globais e atalhos. |
| `Sidebar.tsx` | Navegação lateral, estados de expansão/mobile e seletores de telas administrativas. |
| `Calculator.tsx` | Formulário da calculadora, estado dos parâmetros, chamada do motor, exibição do resultado e ações de salvar/imprimir/compartilhar. |
| `MaterialsCatalog.tsx` | Pesquisa e filtragem do catálogo recebido pela API, com preços administrados e seleção de região. |
| `SupportTickets.tsx` | Permite ao usuário autenticado abrir chamados e acompanhar respostas/status sem consultar chamados de terceiros. |
| `BudgetList.tsx` | Pesquisa/filtro da lista de orçamentos; oferece abrir, excluir e imprimir. |
| `Dashboard.tsx` | Resumo para usuário, com custo agregado e atalhos para orçamento, materiais e calculadora. |
| `AdminDashboard.tsx` | Painel administrativo; consulta estatísticas, usuários, materiais, tipos, obras, chamados, auditoria e estado do MySQL. |
| `AboutPage.tsx` | Página institucional e acesso ao guia de apresentação do sistema. |
| `AuthModal.tsx` | Modal com fluxos de entrada e cadastro. |
| `ChangePasswordModal.tsx` | Interface do fluxo de troca de senha. |
| `RegionalLocationModal.tsx` | Busca/seleção de localização e tentativa de detectar a mais próxima via geolocalização do navegador. |
| `PrintBudgetModal.tsx` | Apresentação do resultado/orçamento e regras de impressão. |
| `ConstruTecLogo.tsx` | Logotipo da aplicação como componente. |
| `RealisticHardhatLogo.tsx` | Variação visual do logotipo com capacete. |

#### `src/assets/images/`

Imagens visuais incluídas no frontend:

- `construtec_logo_v2_1790727419275.jpg`: logo ConstruTec.
- `realistic_hardhat_1790360413785.jpg`: arte de capacete realista.
- `yellow_hardhat_logo_1790727668517.jpg`: versão do logo com capacete amarelo.

#### `src/data/`

- `catalog.ts`: fonte de referência do frontend para tipos de obra, multiplicadores e preços de materiais. Alterar um preço-base ou uma categoria usada pelos cálculos começa aqui.

#### `src/services/`

- `calculationEngine.ts`: serviço puro de cálculo, sem interface. Cada método recebe parâmetros, produz materiais e retorna um `CalculationResult`; `calculate()` escolhe o método de acordo com o tipo.
- `auth.service.ts`: valida email/senha no cliente, chama endpoints de autenticação, armazena/limpa sessão no navegador e expõe verificações de papel/permissão para a interface.

#### `src/guards/`

- `AuthGuard.tsx`: componente de apresentação que solicita login ou informa falta de permissão antes de renderizar conteúdo restrito. A API ainda deve validar autorização no servidor.

#### `src/config/`

- `database.ts`: lê host/porta/usuário/senha/nome do banco e expõe `createMysqlPool()`. Sem argumento cria pool de administração para tentar selecionar/criar o banco; com nome cria pool conectado àquele banco.

#### `src/routes/`

- `savedCalculations.routes.ts`: cria um `Router` Express para cálculos persistidos. Recebe o pool e o estado de conexão como dependências, valida o tipo e objetos JSON, usa consultas parametrizadas e fornece `POST /`, `GET /` e `GET /:id`.

### `dist/`, `node_modules/` e `.git/`

- `dist/`: saída gerada por `npm run build`; inclui frontend otimizado e bundle do servidor. Pode ser recriada.
- `node_modules/`: pacotes baixados pelos gerenciadores; pode ser recriada com instalação.
- `.git/`: histórico e metadados internos do Git. Não é código da aplicação.

## 9. O papel do `server.ts` em detalhes

O servidor ainda é o módulo que concentra a maior parte da API, então é útil dividir mentalmente seu conteúdo em blocos:

1. **Imports e configuração:** carrega Express, Node, JWT, tipos, catálogo, motor e configuração MySQL.
2. **Banco:** `initDatabase()` cria/conecta o banco; `ensureDatabaseSchema()` garante tabelas; `syncDataFromMySQL()` importa algumas tabelas.
3. **Dados em memória:** listas de usuários, materiais, tipos, obras, auditoria, orçamentos e códigos de recuperação oferecem valores enquanto o processo está ativo ou o MySQL não está disponível.
4. **Auditoria:** `recordAuditLog()` cria eventos para ações relevantes e tenta persistir no histórico.
5. **Autenticação e autorização:** funções/middlewares de token, administração e proprietário protegem os endpoints.
6. **Rotas públicas e de usuário:** diagnóstico, login, cadastro, materiais, preços, cálculos e orçamento.
7. **Rotas administrativas:** estatísticas, contas, tipos de obra, materiais, obras e histórico.
8. **Rota modular de cálculos salvos:** o router de `src/routes/` é registrado antes de iniciar o servidor.
9. **Conteúdo/documentação e inicialização:** serve o guia, conecta Vite ou `dist/` e abre a porta configurada.

Essa organização mostra uma etapa intermediária de modularização: a rota nova e a conexão já estão em arquivos dedicados, enquanto as demais rotas continuam em `server.ts`.

## 10. Guia rápido de apresentação oral

### Sugestão de roteiro em 6 partes

1. **Problema:** estimar materiais de obra “no olho” pode causar falta, sobra e custo difícil de prever.
2. **Proposta:** ConstruTec organiza medidas, tipo de serviço, perda e localização para produzir uma lista estimada de materiais e custos.
3. **Demonstração:** escolher um tipo, preencher dimensões, calcular, explicar a área/volume e mostrar a tabela de materiais com a memória do cálculo.
4. **Tecnologia:** React/TypeScript constrói a tela; Node/Express disponibiliza API e site; TypeScript mantém contratos; MySQL oferece persistência quando está ativo.
5. **Fluxo e dados:** dados entram pela interface, passam pelo motor, retornam como resultado; quando são salvos, seguem para API, estado local e banco conforme a funcionalidade.
6. **Fechamento:** o sistema deixa premissas visíveis, oferece orçamento e ferramentas administrativas; valores são estimativas e precisam ser conferidos com os profissionais da obra.

### Texto-base de aproximadamente 1 minuto

> “O ConstruTec é uma aplicação web para estimar materiais de construção. A pessoa informa dimensões, escolhe o tipo de obra e a localização. A interface React envia esses dados ao motor de cálculo em TypeScript, que aplica as fórmulas daquele serviço, a margem de desperdício e os preços de referência regional. O sistema apresenta quantidades, custos e as premissas usadas, para que o resultado seja compreensível. O servidor Node com Express atende a interface e oferece API para autenticação, administração e persistência. Quando o MySQL está disponível, dados podem ser gravados no banco; algumas partes também usam memória ou armazenamento local do navegador. Por isso, os valores são estimativas para apoiar o planejamento, não substituem projeto ou validação de um profissional.”

### Demonstração sugerida

1. Inicie o servidor e abra `http://localhost:3000`.
2. Entre na conta apropriada para acessar a calculadora, pois `App.tsx` protege essa tela com `AuthGuard`.
3. Escolha um tipo simples, como muro ou piso; explique quais campos representam as medidas reais.
4. Calcule e mostre quantidades, preços estimados, desperdício e premissas.
5. Se o MySQL estiver ligado, demonstre o status no painel administrativo e explique como orçamento e cálculo salvo são fluxos distintos.
6. Conclua mostrando catálogo, localização e documento de apresentação.

## 11. Limites e pontos importantes para não explicar errado

- A calculadora que aparece na interface executa `CalculationService` no frontend; não depende da API `POST /api/calculos` para produzir cada resultado.
- `/api/calculos/salvos` é uma rota de demonstração/persistência independente. A tela atual de orçamento não envia automaticamente seus cálculos para ela.
- O catálogo começa com referências definidas no código, mas a tela consulta `/api/materiais` e aplica os preços administrados; não há sincronização automática confirmada com uma fonte oficial de preços em tempo real.
- `localStorage` é local ao navegador, listas em memória são locais ao processo Node e MySQL é o armazenamento persistente. São camadas diferentes.
- Se MySQL não está rodando, mudanças de materiais podem aparecer enquanto o servidor continua ligado, mas não são persistentes; configurações globais e parâmetros de cálculo não podem ser salvos. Inicie o MySQL no XAMPP e confira `/api/status-banco`.
- Os scripts SQL e a criação simplificada de tabelas no servidor precisam de alinhamento futuro para garantir uma única definição de esquema.
- Algumas telas exibem números iniciais de demonstração. Confirme se um número vem da API, do catálogo ou de um valor de exemplo antes de apresentá-lo como produção.
- O código de cálculo contém premissas médias e ressalvas próprias; fundações e estruturas requerem dimensionamento e validação por profissional habilitado.
- A tela pede autenticação para abrir a calculadora; não diga que o acesso atual à calculadora é anônimo.

## 12. Glossário para a apresentação

| Termo | Explicação simples |
|---|---|
| Componente | Peça de interface reutilizável, como cabeçalho, calculadora ou modal. |
| Estado | Valores que a tela mantém enquanto a pessoa interage com ela. |
| Serviço | Módulo que executa uma responsabilidade fora da interface, como calcular ou autenticar. |
| Endpoint/rota | Endereço HTTP da API que recebe uma ação, por exemplo `POST /api/calculos/salvos`. |
| Middleware | Função que roda no caminho de uma requisição, por exemplo para validar um token. |
| Pool | Conjunto de conexões MySQL reutilizadas pelo servidor. |
| JWT | Token assinado usado para identificar uma sessão em requisições protegidas. |
| Persistência | Gravação de dados de forma que continuem existindo após fechar ou reiniciar a aplicação. |
| Desperdício | Percentual adicional considerado para cobrir cortes, perdas e variações de execução. |
| Lockfile | Arquivo com versões exatas de pacotes para reproduzir uma instalação. |

## 13. Próximos passos recomendados para evoluir o sistema

1. Dividir as rotas grandes de `server.ts` em módulos, como já foi feito para conexão e cálculos salvos.
2. Unificar o esquema SQL e introduzir migrações versionadas; reconciliar as diferenças entre `create_tables.sql` e `ensureDatabaseSchema()`.
3. Integrar a gravação de cálculos da tela à rota persistente, se esse for o comportamento desejado, definindo também quem é o proprietário de cada registro.
4. Definir se os orçamentos devem ser carregados exclusivamente do MySQL ou manter explicitamente os três níveis de armazenamento.
5. Automatizar testes para cada método de cálculo e para as rotas com banco disponível e indisponível.
6. Registrar fonte, data e método de atualização dos preços para que estimativas regionais sejam explicáveis e auditáveis.
