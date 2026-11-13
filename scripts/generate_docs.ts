import fs from 'fs';
import path from 'path';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle, 
  AlignmentType, 
  ShadingType 
} from 'docx';

async function generateArchitectureDoc() {
  console.log('Iniciando geração da documentação técnica e arquitetural para ADS...');

  const outputDocxMain = path.resolve('docs/requisitos/ESPECIFICACAO_COMPLETA_SISTEMA_CONSTRUTEC.docx');
  const outputDocxPublic = path.resolve('public/documentacao/ESPECIFICACAO_COMPLETA_SISTEMA_CONSTRUTEC.docx');
  const outputDocxStudy = path.resolve('docs/requisitos/GUIA_DE_ARQUITETURA_E_FLUXO_ADS.docx');
  const outputDocxStudyPublic = path.resolve('public/documentacao/GUIA_DE_ARQUITETURA_E_FLUXO_ADS.docx');
  const outputMdStudy = path.resolve('docs/requisitos/GUIA_DE_ARQUITETURA_E_FLUXO_ADS.md');

  fs.mkdirSync(path.resolve('docs/requisitos'), { recursive: true });
  fs.mkdirSync(path.resolve('public/documentacao'), { recursive: true });

  const createCell = (text: string, isHeader = false, widthPercent = 50) => {
    return new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      shading: isHeader ? { fill: '0F172A', type: ShadingType.CLEAR } : undefined,
      children: [
        new Paragraph({
          spacing: { before: 80, after: 80 },
          children: [
            new TextRun({
              text,
              bold: isHeader,
              color: isHeader ? 'FFFFFF' : '1E293B',
              size: isHeader ? 20 : 19,
            }),
          ],
        }),
      ],
    });
  };

  const doc = new Document({
    creator: 'ConstruTec Software Engineering',
    title: 'Arquitetura Completa, Tecnologias e Fluxo do Sistema ConstruTec',
    description: 'Manual de Engenharia de Software e Guia Didático para Análise e Desenvolvimento de Sistemas (ADS)',
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
            color: '1E293B',
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          // TÍTULO PRINCIPAL
          new Paragraph({
            text: 'CONSTRUTEC - MANUAL TÉCNICO DE ARQUITETURA, FLUXO DE EXECUÇÃO E SEGURANÇA',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            run: { bold: true, size: 36, color: 'D97706' },
          }),
          new Paragraph({
            text: 'Guia Aprofundado de Engenharia de Software para Apresentação em Análise e Desenvolvimento de Sistemas (ADS)',
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            run: { bold: true, size: 24, color: '475569' },
          }),
          new Paragraph({
            text: 'Autor: Jorvane Santos | Data: 2026 | Sistema: ConstruTec v3.0 | Status: Produção',
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
            run: { italics: true, size: 20, color: '64748B' },
          }),

          // SEÇÃO 1: INTRODUÇÃO E VISÃO GERAL DO PROJETO
          new Paragraph({
            text: '1. VISÃO GERAL E CONTEXTO DO SISTEMA',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            run: { bold: true, size: 28, color: '0F172A' },
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun('O ConstruTec é uma plataforma full-stack moderna e modular desenvolvida para cálculo de materiais, quantitativos de obras e precificação de orçamentos com base nos coeficientes regionais do SINAPI (Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil).'),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun('A aplicação foi arquitetada para solucionar problemas reais de canteiro de obras: desperdício financeiro por compras incorretas ("estimativas no olho") e paralisações de equipes por falta de insumos, entregando precisão matemática em 9 tipos de obras da construção civil.'),
            ],
          }),

          // SEÇÃO 2: STACK TECNOLÓGICA COMPLETA
          new Paragraph({
            text: '2. STACK TECNOLÓGICA E JUSTIFICATIVAS DE ENGENHARIA',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            run: { bold: true, size: 28, color: '0F172A' },
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: 'A. Frontend (Camada de Apresentação):' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun('• React 19: Biblioteca baseada em componentes funcionais e renderização declarativa via Virtual DOM. Permite reatividade instantânea durante a digitação de dimensões da obra sem recarregar a página.\n'),
              new TextRun('• TypeScript (~5.8): Adiciona tipagem estática rigorosa sobre o JavaScript, prevenindo erros em tempo de compilação (undefined, tipos numéricos de cálculo e interfaces de usuário).\n'),
              new TextRun('• Vite 6: Bundler e servidor de desenvolvimento ultra veloz alimentado por Rollup e ES Modules nativos no navegador.\n'),
              new TextRun('• Tailwind CSS v4: Framework CSS utility-first com compilação de alta performance via JIT, suporte nativo aos temas Claro e Escuro e classes responsivas para todos os dispositivos.\n'),
              new TextRun('• Lucide React: Pacote de ícones SVG limpos e padronizados para construção civil e painéis administrativos.\n'),
              new TextRun('• Canvas Confetti: Biblioteca de efeitos visuais de celebração ao salvar orçamentos com sucesso.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: 'B. Backend (Camada de Aplicação e Negócios):' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun('• Node.js + Express: Ambiente de execução assíncrono e event-driven sobre a V8 engine. O Express gerencia requisições HTTP, rotas REST, middlewares de segurança e serialização JSON.\n'),
              new TextRun('• TSX (TypeScript Execute): Executa código TypeScript diretamente no Node.js sem necessidade de etapa prévia manual de build durante o desenvolvimento.\n'),
              new TextRun('• JWT (jsonwebtoken - RFC 7519): Mecanismo de autenticação stateless baseado em tokens assinados com segredo criptográfico.\n'),
              new TextRun('• Criptografia Nativa Node (crypto): Funções hash SHA-256 combinadas com Salt único por aplicação para armazenamento seguro de credenciais.\n'),
              new TextRun('• esbuild: Compilador de produção extremamente rápido para gerar o bundle do servidor Node.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: 'C. Camada de Dados e Persistência:' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun('• MySQL 8.0+ com driver mysql2/promise: Banco relacional ACID com pool de conexões reutilizáveis e suporte a consultas preparadas.\n'),
              new TextRun('• Arquitetura Híbrida com Fallback em Memória: O sistema detecta se a base MySQL local está ativa; caso o serviço MySQL esteja desligado no ambiente, ativa instantaneamente armazenamento seguro em memória (In-Memory Array Stores) sem jamais interromper o usuário ou causar erro 500.'),
            ],
          }),

          // SEÇÃO 3: MAPEAMENTO DA ESTRUTURA DE PASTAS E ARQUIVOS
          new Paragraph({
            text: '3. ESTRUTURA DE PASTAS E FUNÇÃO DE CADA ARQUIVO',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            run: { bold: true, size: 28, color: '0F172A' },
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun('A tabela a seguir descreve a responsabilidade exata de cada diretório e arquivo do projeto:'),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell('Arquivo / Diretório', true, 35),
                  createCell('Responsabilidade Técnica no Sistema', true, 65),
                ],
              }),
              new TableRow({
                children: [
                  createCell('server.ts', false, 35),
                  createCell('Ponto de entrada do backend. Inicializa o Express, conecta ao MySQL, registra todos os endpoints REST (/api/*), injeta o Vite como middleware e escuta na porta 3000.', false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createCell('index.html', false, 35),
                  createCell('Página HTML raiz do frontend SPA. Contém a div #root onde o React é montado e carrega o script /src/main.tsx.', false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createCell('src/main.tsx', false, 35),
                  createCell('Arquivo bootstrap do React. Invoca createRoot() e renderiza o componente raiz <App />.', false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createCell('src/App.tsx', false, 35),
                  createCell('Orquestrador mestre do frontend. Mantém o estado global (usuário logado, orçamentos, tema claro/escuro, localização regional, aba ativa) e renderiza Header, Sidebar, Telas e Modais.', false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createCell('src/services/calculationEngine.ts', false, 35),
                  createCell('Motor de cálculo civil. Implementa 9 métodos estáticos de engenharia para Muro, Parede, Piso, Pintura, Concreto, Fundação, Telhado, Revestimento e Obra Personalizada.', false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createCell('src/services/auth.service.ts', false, 35),
                  createCell('Camada de serviço de autenticação do frontend. Valida regex de e-mails, gerencia token JWT e sessão no localStorage e realiza chamadas fetch para /api/auth.', false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createCell('src/components/Header.tsx', false, 35),
                  createCell('Barra superior fixa (sticky top-0 z-50). Contém logo ConstruTec, seletor de localização SINAPI, menu do usuário logado e alternador de tema claro/escuro.', false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createCell('src/components/Sidebar.tsx', false, 35),
                  createCell('Menu de navegação lateral (desktop e gaveta mobile). Permite navegar entre Início, Calculadora, Orçamentos, Materiais, Sobre e Painel ADM.', false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createCell('src/components/Calculator.tsx', false, 35),
                  createCell('Interface interativa de cálculo de obras. Contém campos dinâmicos por tipo de construção, exibição do resumo quantitativo, botão voltar e salvar orçamento.', false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createCell('src/components/BudgetList.tsx', false, 35),
                  createCell('Listagem e histórico de orçamentos salvos pelo usuário com filtros de busca, exclusão, impressão técnica e botão voltar.', false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createCell('src/components/MaterialsCatalog.tsx', false, 35),
                  createCell('Catálogo de insumos e preços regionalizados por estado com busca e categorização.', false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createCell('src/components/Dashboard.tsx', false, 35),
                  createCell('Visão geral do usuário logado (KPIs de orçamentos criados, economia estimada e atalhos rápidos).', false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createCell('src/components/AdminDashboard.tsx', false, 35),
                  createCell('Painel de gestão administrativa (RBAC). Permite gerenciar usuários, cadastrar administradores, atualizar estoque e preços de materiais e auditar histórico em tempo real.', false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createCell('src/components/AuthModal.tsx', false, 35),
                  createCell('Modal acessível de Login e Cadastro de novos usuários com validação visual de senha e feedback de erros.', false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createCell('src/components/AuthGuard.tsx', false, 35),
                  createCell('Componente de proteção de rota no frontend. Bloqueia acesso a áreas restritas para visitantes ou usuários sem nível ADM.', false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createCell('src/components/PrintBudgetModal.tsx', false, 35),
                  createCell('Gera folha de impressão e relatório limpo com CSS @media print sem barras de navegação para entrega ao cliente final.', false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createCell('src/data/catalog.ts', false, 35),
                  createCell('Base de dados estática dos 9 tipos de obras, tabela de coeficientes SINAPI das 27 unidades federativas e catálogo base de materiais.', false, 65),
                ],
              }),
              new TableRow({
                children: [
                  createCell('src/types/index.ts', false, 35),
                  createCell('Definições TypeScript estritas de interfaces (UserProfile, SavedBudget, CalculationResult, MaterialItem, AdminUser, etc.).', false, 65),
                ],
              }),
            ],
          }),

          // SEÇÃO 4: FLUXO DE INICIALIZAÇÃO DO SISTEMA
          new Paragraph({
            text: '4. FLUXO DE INICIALIZAÇÃO DO SISTEMA (BOOTSTRAP)',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            run: { bold: true, size: 28, color: '0F172A' },
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun('O ciclo de inicialização do sistema obedece rigorosamente a seguinte sequência técnica:'),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '1º Passo: Disparo do Node.js via Script Dev\n' }),
              new TextRun('O comando "npm run dev" invoca o utilitário tsx sobre o arquivo "server.ts". O Node.js compila o TypeScript sob demanda na memória e inicia o processo.\n\n'),
              new TextRun({ bold: true, text: '2º Passo: Instanciação do Express e Conexão de Banco\n' }),
              new TextRun('Dentro de server.ts, o Express é instanciado ("const app = express()"). Em seguida, a função initMySQL() tenta estabelecer um Connection Pool com o banco relacional MySQL. Se bem-sucedido, executa ensureDatabaseSchema() para criar as tabelas necessárias e sincronizar dados. Se o MySQL estiver desligado, o sistema registra o aviso e liga os Stores em memória.\n\n'),
              new TextRun({ bold: true, text: '3º Passo: Acoplamento do Vite Middleware\n' }),
              new TextRun('O servidor chama "vite.createServer({ server: { middlewareMode: true } })" e monta "app.use(vite.middlewares)". Isso permite que tanto a API REST (/api/*) quanto o ecossistema frontend React rodem sob a mesma porta 3000 sem problemas de CORS ou portas separadas.\n\n'),
              new TextRun({ bold: true, text: '4º Passo: O Navegador Requisita a Aplicação\n' }),
              new TextRun('Quando o usuário acessa http://localhost:3000, o Express entrega o arquivo "index.html". O navegador faz o parsing do HTML e encontra a tag: <script type="module" src="/src/main.tsx"></script>.\n\n'),
              new TextRun({ bold: true, text: '5º Passo: Execução do main.tsx e Renderização do App.tsx\n' }),
              new TextRun('O arquivo src/main.tsx captura a div com id "root" do DOM e invoca createRoot(rootElement).render(<App />). O componente App.tsx inicializa seus hooks de estado (useState), recupera usuário e tema persistidos no localStorage e dispara o useEffect que consulta a API (/api/orcamentos). A interface visual torna-se interativa para o usuário.'),
            ],
          }),

          // SEÇÃO 5: CADEIA DE CHAMADAS (COMO UM CÓDIGO CHAMA O OUTRO)
          new Paragraph({
            text: '5. CADEIA DE CHAMADAS DETALHADA: COMO UM CÓDIGO CHAMA O OUTRO',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            run: { bold: true, size: 28, color: '0F172A' },
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun('Abaixo estão os 3 fluxos mais importantes do sistema explicados linha a linha, detalhando a passagem de parâmetros e comunicação cliente-servidor:'),
            ],
          }),

          // FLUXO DE LOGIN
          new Paragraph({
            text: 'A. Fluxo de Autenticação e Login:',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: { bold: true, size: 22, color: 'D97706' },
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun('1. O usuário preenche e-mail e senha no componente "AuthModal.tsx" e clica no botão "Entrar".\n'),
              new TextRun('2. O evento "onSubmit" do formulário dispara a função "handleLogin".\n'),
              new TextRun('3. O componente invoca o método estático "AuthService.login(email, password)" localizado em "src/services/auth.service.ts".\n'),
              new TextRun('4. O AuthService valida o regex RFC do e-mail e tamanho mínimo de senha; se válido, executa uma requisição HTTP via "fetch(\'/api/auth/login\', { method: \'POST\', headers: { \'Content-Type\': \'application/json\' }, body: JSON.stringify({ email, password }) })".\n'),
              new TextRun('5. No backend (server.ts), a rota "app.post(\'/api/auth/login\')" recebe a requisição. O middleware "express.json()" transforma o payload bruto em objeto JavaScript acessível em "req.body".\n'),
              new TextRun('6. O backend executa "hashPassword(password)", que aplica SHA-256 com o Salt secreto "construtec_unique_salt_...".\n'),
              new TextRun('7. O backend compara o hash calculado com o registro de usuários (no MySQL ou usersStore em memória). Se correto, gera um token JWT via "jwt.sign({ id, email, userType }, JWT_SECRET, { expiresIn: \'7d\' })".\n'),
              new TextRun('8. O backend responde com status 200 e payload JSON contendo o token e o perfil do usuário.\n'),
              new TextRun('9. O AuthService recebe a resposta, armazena o token em "localStorage.setItem(\'construtec_jwt_token\')" e invoca o callback "onLoginSuccess(user)" passado por "App.tsx".\n'),
              new TextRun('10. O "App.tsx" atualiza o estado "user". Caso o usuário seja do tipo ADM ou ADM_MASTER, redireciona automaticamente para o Painel Administrativo ("activeTab = admin").'),
            ],
          }),

          // FLUXO DE CÁLCULO
          new Paragraph({
            text: 'B. Fluxo do Motor de Cálculo de Materiais:',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: { bold: true, size: 22, color: 'D97706' },
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun('1. No componente "Calculator.tsx", o usuário seleciona um tipo de obra (ex: Muro) e digita o comprimento (20m) e altura (2.5m).\n'),
              new TextRun('2. Os manipuladores "onChange" atualizam os estados locais do React (useState).\n'),
              new TextRun('3. O componente invoca diretamente "CalculationService.calculateMuro({ length, height, blockType, doorsCount, doorWidth, doorHeight, wastePercentage, location })".\n'),
              new TextRun('4. O "CalculationService" (src/services/calculationEngine.ts) calcula a área bruta (20 * 2.5 = 50m²), desconta vãos de portões para obter a área líquida e aplica a fórmula de consumo de blocos por m² conforme o tipo (ex: 12.5 blocos/m² para bloco 14x19x39cm).\n'),
              new TextRun('5. Em seguida, calcula o volume de argamassa de assentamento e emboço (traço 1:4), determinando a massa de cimento e areia média necessária.\n'),
              new TextRun('6. Aplica a taxa de quebra/perda selecionada pelo usuário (ex: +10%) e utiliza "Math.ceil" para converter as quantidades teóricas fracionadas em embalagens comerciais fechadas (ex: sacos de 50kg de cimento e m³ de areia).\n'),
              new TextRun('7. Multiplica as quantidades pelos preços unitários ponderados pelo índice regional do SINAPI do estado escolhido.\n'),
              new TextRun('8. Retorna uma instância de "CalculationResult" contendo materiais discriminados, custos totais e economia estimada de desperdício.\n'),
              new TextRun('9. O React re-renderiza o painel exibindo o valor total estimado e tabela com detalhes para visualização imediata.'),
            ],
          }),

          // FLUXO DE PERSISTÊNCIA E AUDITORIA
          new Paragraph({
            text: 'C. Fluxo de Salvamento do Orçamento e Auditoria:',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: { bold: true, size: 22, color: 'D97706' },
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun('1. O usuário clica em "Salvar Orçamento". O "Calculator.tsx" verifica se o usuário está logado; se não estiver, abre o modal de login.\n'),
              new TextRun('2. Estando logado, monta um objeto "SavedBudget" e dispara requisição POST para "/api/orcamentos" com o token Bearer no header "Authorization".\n'),
              new TextRun('3. O backend intercepta a requisição, extrai o token JWT, valida com "jwt.verify(token, JWT_SECRET)" e obtém os dados do autor.\n'),
              new TextRun('4. O backend persiste o registro: executa comando SQL "INSERT INTO orcamentos" no MySQL ou "budgetsStore.unshift(newBudget)" em memória.\n'),
              new TextRun('5. O backend invoca "recordAuditLog(\'CRIAR_CALCULO\', ...)" para registrar no histórico de auditoria quem realizou o cálculo, data, hora e IP.\n'),
              new TextRun('6. O backend retorna status 201 (Created) com o orçamento serializado em JSON.\n'),
              new TextRun('7. O "App.tsx" recebe o novo orçamento via "handleSaveBudgetSuccess", insere no topo do array "budgets" do React e persiste cópia em localStorage.\n'),
              new TextRun('8. O sistema dispara a animação de confetes na tela e atualiza os contadores na barra superior e lateral.'),
            ],
          }),

          // SEÇÃO 6: SEGURANÇA E PROTOCOLOS
          new Paragraph({
            text: '6. SEGURANÇA DA INFORMAÇÃO, AUTENTICAÇÃO E RBAC',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            run: { bold: true, size: 28, color: '0F172A' },
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• Hashing Criptográfico com Salt: ' }),
              new TextRun('Senhas jamais são salvas em texto puro. O sistema concatena a senha digitada com uma string secreta de aplicação (Salt) e gera o hash criptográfico SHA-256 de 64 caracteres hexadecimais, inviabilizando ataques de dicionário e tabelas rainbow.\n'),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• Tokens JWT (RFC 7519): ' }),
              new TextRun('A autenticação é desacoplada e escalável. O cliente armazena o token e envia via header "Authorization: Bearer <token>". O servidor não precisa manter sessões em disco, apenas valida a assinatura criptográfica do token.\n'),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• RBAC (Role-Based Access Control): ' }),
              new TextRun('O sistema implementa 3 níveis de acesso: USUARIO (acesso à calculadora, orçamentos pessoais e catálogo), ADM (acesso ao Painel de Gestão, controle de insumos e visualização de obras) e ADM_MASTER (acesso irrestrito, gerenciamento de permissões e auditoria do sistema).\n'),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ bold: true, text: '• Proteção de Rotas em Duas Camadas: ' }),
              new TextRun('No cliente, o componente "AuthGuard.tsx" impede a renderização de componentes administrativos caso o usuário não possua o nível necessário. No backend, middlewares Express barram requisições não autorizadas com código HTTP 401 (Unauthorized) ou 403 (Forbidden), garantindo segurança mesmo se a chamada for forjada diretamente via Postman ou cURL.'),
            ],
          }),

          // SEÇÃO 7: PROTOCOLO JSON E BANCO DE DADOS
          new Paragraph({
            text: '7. ARQUITETURA DE DADOS: JSON E BANCO RELACIONAL MYSQL',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            run: { bold: true, size: 28, color: '0F172A' },
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun('O sistema adota o padrão JSON (JavaScript Object Notation) como formato universal de troca de dados entre o navegador e o servidor. Na camada de banco de dados, o MySQL 8 armazena tanto dados relacionais normalizados (tabelas usuarios, materiais, historico) quanto colunas do tipo nativo JSON (dados_localizacao, resultado_calculo).\n'),
              new TextRun('Isso permite consultas SQL estruturadas de alto desempenho combinadas com a flexibilidade de armazenar a composição completa de insumos calculados sem necessidade de dezenas de tabelas intermediárias complexas.'),
            ],
          }),

          // SEÇÃO 8: GUIA PARA APRESENTAÇÃO ACADÊMICA EM ADS
          new Paragraph({
            text: '8. GUIA RÁPIDO PARA APRESENTAÇÃO E DEFESA EM ADS',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            run: { bold: true, size: 28, color: '0F172A' },
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: 'Perguntas clássicas de bancas de ADS e como responder com autoridade:\n\n' }),
              new TextRun('1. "Por que usar TypeScript em vez de JavaScript puro?"\n'),
              new TextRun('Resposta: Em um software de engenharia civil com cálculos complexos e conversões de unidades, qualquer dado tipado incorretamente pode gerar orçamentos com erros graves de milhares de reais. O TypeScript garante type safety em tempo de desenvolvimento, tipando cada parâmetro de cálculo e cada campo de API.\n\n'),
              new TextRun('2. "Como funciona o desacoplamento entre frontend e backend?"\n'),
              new TextRun('Resposta: O frontend é uma SPA (Single Page Application) que consome exclusivamente uma API RESTful por meio do protocolo HTTP/JSON com autenticação via tokens JWT. O frontend não sabe como o banco de dados é estruturado, apenas consome e envia contratos de dados padronizados.\n\n'),
              new TextRun('3. "Qual a estratégia de resiliência caso o banco MySQL falhe?"\n'),
              new TextRun('Resposta: O backend implementa o padrão Failover Graceful Degradation. Ao iniciar, testa o pool de conexões com o MySQL. Caso indisponível, inicializa estruturas em memória com persistência durante a sessão e sincroniza automaticamente assim que a base de dados relacional é restabelecida.'),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputDocxMain, buffer);
  fs.writeFileSync(outputDocxPublic, buffer);
  fs.writeFileSync(outputDocxStudy, buffer);
  fs.writeFileSync(outputDocxStudyPublic, buffer);

  console.log(`[DOCX] Documento principal gerado: ${outputDocxMain} (${buffer.length} bytes)`);
  console.log(`[DOCX] Documento público gerado: ${outputDocxPublic}`);
  console.log(`[DOCX] Guia de ADS gerado: ${outputDocxStudy}`);

  // Gera versão Markdown para leitura direta
  const mdContent = `# CONSTRUTEC - MANUAL TÉCNICO DE ARQUITETURA, FLUXO DE EXECUÇÃO E SEGURANÇA
**Guia Aprofundado de Engenharia de Software para Apresentação em Análise e Desenvolvimento de Sistemas (ADS)**  
*Autor: Jorvane Santos | Data: 2026 | Sistema: ConstruTec v3.0 | Status: Produção*

---

## 1. VISÃO GERAL E CONTEXTO DO SISTEMA
O **ConstruTec** é uma plataforma full-stack moderna e modular desenvolvida para cálculo de materiais, quantitativos de obras e precificação de orçamentos com base nos coeficientes regionais do SINAPI (Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil).

A aplicação foi arquitetada para solucionar problemas reais de canteiro de obras: desperdício financeiro por compras incorretas ("estimativas no olho") e paralisações de equipes por falta de insumos, entregando precisão matemática em 9 tipos de obras da construção civil.

---

## 2. STACK TECNOLÓGICA E JUSTIFICATIVAS DE ENGENHARIA

### A. Frontend (Camada de Apresentação):
- **React 19**: Biblioteca baseada em componentes funcionais e renderização declarativa via Virtual DOM. Permite reatividade instantânea durante a digitação de dimensões da obra sem recarregar a página.
- **TypeScript (~5.8)**: Adiciona tipagem estática rigorosa sobre o JavaScript, prevenindo erros em tempo de compilação (undefined, tipos numéricos de cálculo e interfaces de usuário).
- **Vite 6**: Bundler e servidor de desenvolvimento ultra veloz alimentado por Rollup e ES Modules nativos no navegador.
- **Tailwind CSS v4**: Framework CSS utility-first com compilação de alta performance via JIT, suporte nativo aos temas Claro e Escuro e classes responsivas para todos os dispositivos.
- **Lucide React**: Pacote de ícones SVG limpos e padronizados para construção civil e painéis administrativos.
- **Canvas Confetti**: Biblioteca de efeitos visuais de celebração ao salvar orçamentos com sucesso.

### B. Backend (Camada de Aplicação e Negócios):
- **Node.js + Express**: Ambiente de execução assíncrono e event-driven sobre a V8 engine. O Express gerencia requisições HTTP, rotas REST, middlewares de segurança e serialização JSON.
- **TSX (TypeScript Execute)**: Executa código TypeScript diretamente no Node.js sem necessidade de etapa prévia manual de build durante o desenvolvimento.
- **JWT (jsonwebtoken - RFC 7519)**: Mecanismo de autenticação stateless baseado em tokens assinados com segredo criptográfico.
- **Criptografia Nativa Node (crypto)**: Funções hash SHA-256 combinadas com Salt único por aplicação para armazenamento seguro de credenciais.
- **esbuild**: Compilador de produção extremamente rápido para gerar o bundle do servidor Node.

### C. Camada de Dados e Persistência:
- **MySQL 8.0+ com driver mysql2/promise**: Banco relacional ACID com pool de conexões reutilizáveis e suporte a consultas preparadas.
- **Arquitetura Híbrida com Fallback em Memória**: O sistema detecta se a base MySQL local está ativa; caso o serviço MySQL esteja desligado no ambiente, ativa instantaneamente armazenamento seguro em memória (In-Memory Array Stores) sem jamais interromper o usuário ou causar erro 500.

---

## 3. ESTRUTURA DE PASTAS E FUNÇÃO DE CADA ARQUIVO

| Arquivo / Diretório | Responsabilidade Técnica no Sistema |
| :--- | :--- |
| **server.ts** | Ponto de entrada do backend. Inicializa o Express, conecta ao MySQL, registra todos os endpoints REST (/api/*), injeta o Vite como middleware e escuta na porta 3000. |
| **index.html** | Página HTML raiz do frontend SPA. Contém a div #root onde o React é montado e carrega o script /src/main.tsx. |
| **src/main.tsx** | Arquivo bootstrap do React. Invoca createRoot() e renderiza o componente raiz <App />. |
| **src/App.tsx** | Orquestrador mestre do frontend. Mantém o estado global (usuário logado, orçamentos, tema claro/escuro, localização regional, aba ativa) e renderiza Header, Sidebar, Telas e Modais. |
| **src/services/calculationEngine.ts** | Motor de cálculo civil. Implementa 9 métodos estáticos de engenharia para Muro, Parede, Piso, Pintura, Concreto, Fundação, Telhado, Revestimento e Obra Personalizada. |
| **src/services/auth.service.ts** | Camada de serviço de autenticação do frontend. Valida regex de e-mails, gerencia token JWT e sessão no localStorage e realiza chamadas fetch para /api/auth. |
| **src/components/Header.tsx** | Barra superior fixa (sticky top-0 z-50). Contém logo ConstruTec, seletor de localização SINAPI, menu do usuário logado e alternador de tema claro/escuro. |
| **src/components/Sidebar.tsx** | Menu de navegação lateral (desktop e gaveta mobile). Permite navegar entre Início, Calculadora, Orçamentos, Materiais, Sobre e Painel ADM. |
| **src/components/Calculator.tsx** | Interface interativa de cálculo de obras. Contém campos dinâmicos por tipo de construção, exibição do resumo quantitativo, botão voltar e salvar orçamento. |
| **src/components/BudgetList.tsx** | Listagem e histórico de orçamentos salvos pelo usuário com filtros de busca, exclusão, impressão técnica e botão voltar. |
| **src/components/MaterialsCatalog.tsx** | Catálogo de insumos e preços regionalizados por estado com busca e categorização. |
| **src/components/Dashboard.tsx** | Visão geral do usuário logado (KPIs de orçamentos criados, economia estimada e atalhos rápidos). |
| **src/components/AdminDashboard.tsx** | Painel de gestão administrativa (RBAC). Permite gerenciar usuários, cadastrar administradores, atualizar estoque e preços de materiais e auditar histórico em tempo real. |
| **src/components/AuthModal.tsx** | Modal acessível de Login e Cadastro de novos usuários com validação visual de senha e feedback de erros. |
| **src/components/AuthGuard.tsx** | Componente de proteção de rota no frontend. Bloqueia acesso a áreas restritas para visitantes ou usuários sem nível ADM. |
| **src/components/PrintBudgetModal.tsx** | Gera folha de impressão e relatório limpo com CSS @media print sem barras de navegação para entrega ao cliente final. |
| **src/data/catalog.ts** | Base de dados estática dos 9 tipos de obras, tabela de coeficientes SINAPI das 27 unidades federativas e catálogo base de materiais. |
| **src/types/index.ts** | Definições TypeScript estritas de interfaces (UserProfile, SavedBudget, CalculationResult, MaterialItem, AdminUser, etc.). |

---

## 4. FLUXO DE INICIALIZAÇÃO DO SISTEMA (BOOTSTRAP)

1. **1º Passo: Disparo do Node.js via Script Dev**  
   O comando \`npm run dev\` invoca o utilitário \`tsx\` sobre o arquivo \`server.ts\`. O Node.js compila o TypeScript sob demanda na memória e inicia o processo.
2. **2º Passo: Instanciação do Express e Conexão de Banco**  
   Dentro de \`server.ts\`, o Express é instanciado (\`const app = express()\`). Em seguida, a função \`initMySQL()\` tenta estabelecer um Connection Pool com o banco relacional MySQL. Se bem-sucedido, executa \`ensureDatabaseSchema()\` para criar as tabelas necessárias e sincronizar dados. Se o MySQL estiver desligado, o sistema registra o aviso e liga os Stores em memória.
3. **3º Passo: Acoplamento do Vite Middleware**  
   O servidor chama \`vite.createServer({ server: { middlewareMode: true } })\` e monta \`app.use(vite.middlewares)\`. Isso permite que tanto a API REST (/api/*) quanto o ecossistema frontend React rodem sob a mesma porta 3000 sem problemas de CORS ou portas separadas.
4. **4º Passo: O Navegador Requisita a Aplicação**  
   Quando o usuário acessa http://localhost:3000, o Express entrega o arquivo \`index.html\`. O navegador faz o parsing do HTML e encontra a tag: \`<script type="module" src="/src/main.tsx"></script>\`.
5. **5º Passo: Execução do main.tsx e Renderização do App.tsx**  
   O arquivo \`src/main.tsx\` captura a div com id "root" do DOM e invoca \`createRoot(rootElement).render(<App />)\`. O componente \`App.tsx\` inicializa seus hooks de estado (\`useState\`), recupera usuário e tema persistidos no localStorage e dispara o \`useEffect\` que consulta a API (\`/api/orcamentos\`). A interface visual torna-se interativa para o usuário.

---

## 5. CADEIA DE CHAMADAS DETALHADA: COMO UM CÓDIGO CHAMA O OUTRO

### A. Fluxo de Autenticação e Login:
1. O usuário preenche e-mail e senha no componente \`AuthModal.tsx\` e clica no botão "Entrar".
2. O evento \`onSubmit\` do formulário dispara a função \`handleLogin\`.
3. O componente invoca o método estático \`AuthService.login(email, password)\` localizado em \`src/services/auth.service.ts\`.
4. O AuthService valida o regex RFC do e-mail e tamanho mínimo de senha; se válido, executa uma requisição HTTP via \`fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })\`.
5. No backend (\`server.ts\`), a rota \`app.post('/api/auth/login')\` recebe a requisição. O middleware \`express.json()\` transforma o payload bruto em objeto JavaScript acessível em \`req.body\`.
6. O backend executa \`hashPassword(password)\`, que aplica SHA-256 com o Salt secreto "construtec_unique_salt_...".
7. O backend compara o hash calculado com o registro de usuários (no MySQL ou usersStore em memória). Se correto, gera um token JWT via \`jwt.sign({ id, email, userType }, JWT_SECRET, { expiresIn: '7d' })\`.
8. O backend responde com status 200 e payload JSON contendo o token e o perfil do usuário.
9. O AuthService recebe a resposta, armazena o token em \`localStorage.setItem('construtec_jwt_token')\` e invoca o callback \`onLoginSuccess(user)\` passado por \`App.tsx\`.
10. O \`App.tsx\` atualiza o estado \`user\`. Caso o usuário seja do tipo ADM ou ADM_MASTER, redireciona automaticamente para o Painel Administrativo (\`activeTab = admin\`).

### B. Fluxo do Motor de Cálculo de Materiais:
1. No componente \`Calculator.tsx\`, o usuário seleciona um tipo de obra (ex: Muro) e digita o comprimento (20m) e altura (2.5m).
2. Os manipuladores \`onChange\` atualizam os estados locais do React (\`useState\`).
3. O componente invoca diretamente \`CalculationService.calculateMuro({ length, height, blockType, doorsCount, doorWidth, doorHeight, wastePercentage, location })\`.
4. O \`CalculationService\` (\`src/services/calculationEngine.ts\`) calcula a área bruta (20 * 2.5 = 50m²), desconta vãos de portões para obter a área líquida e aplica a fórmula de consumo de blocos por m² conforme o tipo (ex: 12.5 blocos/m² para bloco 14x19x39cm).
5. Em seguida, calcula o volume de argamassa de assentamento e emboço (traço 1:4), determinando a massa de cimento e areia média necessária.
6. Aplica a taxa de quebra/perda selecionada pelo usuário (ex: +10%) e utiliza \`Math.ceil\` para converter as quantidades teóricas fracionadas em embalagens comerciais fechadas (ex: sacos de 50kg de cimento e m³ de areia).
7. Multiplica as quantidades pelos preços unitários ponderados pelo índice regional do SINAPI do estado escolhido.
8. Retorna uma instância de \`CalculationResult\` contendo materiais discriminados, custos totais e economia estimada de desperdício.
9. O React re-renderiza o painel exibindo o valor total estimado e tabela com detalhes para visualização imediata.

### C. Fluxo de Salvamento do Orçamento e Auditoria:
1. O usuário clica em "Salvar Orçamento". O \`Calculator.tsx\` verifica se o usuário está logado; se não estiver, abre o modal de login.
2. Estando logado, monta um objeto \`SavedBudget\` e dispara requisição POST para \`/api/orcamentos\` com o token Bearer no header \`Authorization\`.
3. O backend intercepta a requisição, extrai o token JWT, valida com \`jwt.verify(token, JWT_SECRET)\` e obtém os dados do autor.
4. O backend persiste o registro: executa comando SQL \`INSERT INTO orcamentos\` no MySQL ou \`budgetsStore.unshift(newBudget)\` em memória.
5. O backend invoca \`recordAuditLog('CRIAR_CALCULO', ...)\` para registrar no histórico de auditoria quem realizou o cálculo, data, hora e IP.
6. O backend retorna status 201 (Created) com o orçamento serializado em JSON.
7. O \`App.tsx\` recebe o novo orçamento via \`handleSaveBudgetSuccess\`, insere no topo do array \`budgets\` do React e persiste cópia em localStorage.
8. O sistema dispara a animação de confetes na tela e atualiza os contadores na barra superior e lateral.

---

## 6. SEGURANÇA DA INFORMAÇÃO, AUTENTICAÇÃO E RBAC
- **Hashing Criptográfico com Salt**: Senhas jamais são salvas em texto puro. O sistema concatena a senha digitada com uma string secreta de aplicação (Salt) e gera o hash criptográfico SHA-256 de 64 caracteres hexadecimais, inviabilizando ataques de dicionário e tabelas rainbow.
- **Tokens JWT (RFC 7519)**: A autenticação é desacoplada e escalável. O cliente armazena o token e envia via header \`Authorization: Bearer <token>\`. O servidor não precisa manter sessões em disco, apenas valida a assinatura criptográfica do token.
- **RBAC (Role-Based Access Control)**: O sistema implementa 3 níveis de acesso: USUARIO (acesso à calculadora, orçamentos pessoais e catálogo), ADM (acesso ao Painel de Gestão, controle de insumos e visualização de obras) e ADM_MASTER (acesso irrestrito, gerenciamento de permissões e auditoria do sistema).
- **Proteção de Rotas em Duas Camadas**: No cliente, o componente \`AuthGuard.tsx\` impede a renderização de componentes administrativos caso o usuário não possua o nível necessário. No backend, middlewares Express barram requisições não autorizadas com código HTTP 401 (Unauthorized) ou 403 (Forbidden).

---

## 7. ARQUITETURA DE DADOS: JSON E BANCO RELACIONAL MYSQL
O sistema adota o padrão JSON (JavaScript Object Notation) como formato universal de troca de dados entre o navegador e o servidor. Na camada de banco de dados, o MySQL 8 armazena tanto dados relacionais normalizados (tabelas usuarios, materiais, historico) quanto colunas do tipo nativo JSON (\`dados_localizacao\`, \`resultado_calculo\`).

Isso permite consultas SQL estruturadas de alto desempenho combinadas com a flexibilidade de armazenar a composição completa de insumos calculados sem necessidade de dezenas de tabelas intermediárias complexas.

---

## 8. GUIA RÁPIDO PARA APRESENTAÇÃO E DEFESA EM ADS
Perguntas clássicas de bancas de ADS e como responder com autoridade:
1. **"Por que usar TypeScript em vez de JavaScript puro?"**  
   *Resposta:* Em um software de engenharia civil com cálculos complexos e conversões de unidades, qualquer dado tipado incorretamente pode gerar orçamentos com erros graves de milhares de reais. O TypeScript garante type safety em tempo de desenvolvimento, tipando cada parâmetro de cálculo e cada campo de API.
2. **"Como funciona o desacoplamento entre frontend e backend?"**  
   *Resposta:* O frontend é uma SPA (Single Page Application) que consome exclusivamente uma API RESTful por meio do protocolo HTTP/JSON com autenticação via tokens JWT. O frontend não sabe como o banco de dados é estruturado, apenas consome e envia contratos de dados padronizados.
3. **"Qual a estratégia de resiliência caso o banco MySQL falhe?"**  
   *Resposta:* O backend implementa o padrão Failover Graceful Degradation. Ao iniciar, testa o pool de conexões com o MySQL. Caso indisponível, inicializa estruturas em memória com persistência durante a sessão e sincroniza automaticamente assim que a base de dados relacional é restabelecida.
`;

  fs.writeFileSync(outputMdStudy, mdContent);
  console.log(`[MD] Guia Markdown gerado: ${outputMdStudy}`);
}

generateArchitectureDoc().catch(console.error);
