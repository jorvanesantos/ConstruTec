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

async function generateDocumentation() {
  console.log('Iniciando geração da documentação completa em DOCX, MD e TXT...');

  const docxFilePath = path.resolve('documentacao/ESPECIFICACAO_COMPLETA_SISTEMA_CONSTRUTEC.docx');
  const publicDocxPath = path.resolve('public/documentacao/ESPECIFICACAO_COMPLETA_SISTEMA_CONSTRUTEC.docx');
  const mdFilePath = path.resolve('documentacao/ESPECIFICACAO_COMPLETA_SISTEMA_CONSTRUTEC.md');
  const txtFilePath = path.resolve('documentacao/ESPECIFICACAO_COMPLETA_SISTEMA_CONSTRUTEC.txt');
  const publicTxtPath = path.resolve('public/documentacao/ESPECIFICACAO_COMPLETA_SISTEMA_CONSTRUTEC.txt');

  // Garante diretórios
  fs.mkdirSync(path.resolve('documentacao'), { recursive: true });
  fs.mkdirSync(path.resolve('public/documentacao'), { recursive: true });

  // 1. GERAÇÃO DO DOCUMENTO WORD COM DOCX
  const doc = new Document({
    creator: 'ConstruTec Engenharia & Software',
    title: 'Especificação Completa do Sistema ConstruTec',
    description: 'Documentação técnica, requisitos, regras de negócio e prompt mestre para construção idêntica por IA',
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 22, // 11pt
            color: '1E293B',
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          // CABEÇALHO DO DOCUMENTO
          new Paragraph({
            text: 'CONSTRUTEC - PLATAFORMA INTELIGENTE DE CÁLCULO DE MATERIAIS E ORÇAMENTOS',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            run: {
              bold: true,
              size: 36,
              color: 'D97706', // Amber-600
            },
          }),
          new Paragraph({
            text: 'DOCUMENTAÇÃO COMPLETA DE REQUISITOS, RECURSOS, FUNÇÕES E ARQUITETURA PARA REPRODUÇÃO POR INTELIGÊNCIA ARTIFICIAL',
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            run: {
              bold: true,
              size: 24,
              color: '475569',
            },
          }),
          new Paragraph({
            text: 'Versão do Documento: 3.0 Enterprise Edition | Data: 2026 | Idioma: Português (Brasil)',
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
            run: {
              italics: true,
              size: 20,
              color: '64748B',
            },
          }),

          // SEÇÃO 1
          new Paragraph({
            text: '1. INTRODUÇÃO E OBJETIVO DO SISTEMA',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            run: { bold: true, size: 28, color: '0F172A' },
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'O ConstruTec é um sistema web corporativo e responsivo desenvolvido para solucionar um dos maiores gargalos da construção civil no Brasil: o desperdício financeiro e material causado por estimativas imprecisas ("no olho") em reformas e obras residenciais e comerciais.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'O sistema realiza cálculos automáticos precisos de insumos (cimento, areia, brita, blocos, tijolos, tintas, argamassas, rejuntes, aços CA-50, etc.), converte quantidades brutas teóricas em embalagens comerciais padronizadas de mercado (sacos de 50kg, latas de 18L, barras de 12m, m³) e precifica instantaneamente a obra com base na tabela regionalizada SINAPI dos 26 estados brasileiros e do Distrito Federal.',
              }),
            ],
          }),

          // SEÇÃO 2
          new Paragraph({
            text: '2. STACK TECNOLÓGICA E ARQUITETURA DE SOFTWARE',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            run: { bold: true, size: 28, color: '0F172A' },
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ bold: true, text: '• Frontend: ' }),
              new TextRun('React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React (ícones), Canvas Confetti, Motion para animações.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ bold: true, text: '• Backend Principal (Node.js): ' }),
              new TextRun('Express.js montado com vite.middlewares em desenvolvimento e bundle esbuild em produção, suporte a JSON Web Token (JWT), biblioteca mysql2/promise.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ bold: true, text: '• Backend Alternativo (Java): ' }),
              new TextRun('Spring Boot 3 com Maven (pom.xml), arquitetura MVC com Controllers REST, Services e Repositories JPA.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ bold: true, text: '• Banco de Dados: ' }),
              new TextRun('MySQL 8.0+ relacional com arquitetura híbrida de failover em memória para permitir execução imediata sem banco local, sincronizando automaticamente assim que o MySQL estiver acessível.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ bold: true, text: '• Design System & Temas: ' }),
              new TextRun('Suporte completo e padronizado a Tema Claro (Light) e Tema Escuro (Dark) com alternância fluida, persistência em localStorage ("construtec_theme") e cores unificadas.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ bold: true, text: '• Fixação do Topo (Header Sticky): ' }),
              new TextRun('Cabeçalho com sticky top-0 z-50 com fundo 100% sólido (sem transparência de rolagem), impedindo sobreposição dos botões de login, logout e alternância de temas.'),
            ],
          }),

          // SEÇÃO 3
          new Paragraph({
            text: '3. NÍVEIS DE PERMISSÃO E GESTÃO DE USUÁRIOS (RBAC)',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            run: { bold: true, size: 28, color: '0F172A' },
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '1. Visitante (Não Autenticado): ' }),
              new TextRun('Acesso à página inicial (Hero), Calculadora com resultados completos e detalhados, Catálogo de Materiais público, Página Sobre e Guia de Conexão. Ao tentar salvar orçamentos ou acessar painéis protegidos, o modal de autenticação é exibido.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '2. Usuário Comum: ' }),
              new TextRun('Salva orçamentos com nome personalizado e anotações, visualiza histórico em "Meus Orçamentos", imprime relatórios com layout profissional, exporta orçamentos e altera a própria senha.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '3. Administrador (ADM): ' }),
              new TextRun('Acesso ao Painel Administrativo (/admin), gestão de catálogo de insumos, visualização de todas as obras cadastradas no sistema, consulta de métricas e histórico de atividades.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ bold: true, text: '4. Administrador Master (Super ADM): ' }),
              new TextRun('Poder irrestrito. Criação e edição de outros administradores, alteração de papéis (roles), ativação e desativação de contas, auditoria completa de logs e teste rápido de visões sem deslogar.'),
            ],
          }),

          // SEÇÃO 4
          new Paragraph({
            text: '4. OS 9 MOTORES DE CÁLCULO DE ENGENHARIA CIVIL',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            run: { bold: true, size: 28, color: '0F172A' },
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'A classe CalculationService (/src/services/calculationEngine.ts) implementa fórmulas padronizadas da ABNT e tabelas de produtividade da construção civil brasileira para 9 modalidades de obra:',
              }),
            ],
          }),

          // Motor 1
          new Paragraph({
            text: '4.1 Muro (Alvenaria de Vedação Externa)',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: { bold: true, size: 24, color: 'B45309' },
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• Parâmetros de Entrada: ' }),
              new TextRun('Comprimento (m), Altura (m), Tipo de Bloco (Bloco de Concreto 14x19x39, Bloco de Concreto 09x19x39 ou Tijolo Cerâmico 8 furos 9x19x19), Vãos de portões (quantidade, largura e altura), Margem de Perda (%).'),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• Regra de Cálculo: ' }),
              new TextRun('Área Líquida = (Comprimento * Altura) - (Portões). Bloco 14 e 09 consom 12.5 peças/m²; tijolo cerâmico consome 25 peças/m². Argamassa de assentamento consome 0.15 sacos de cimento 50kg/m² e 0.022 m³ de areia lavada média/m².'),
            ],
          }),

          // Motor 2
          new Paragraph({
            text: '4.2 Parede (Alvenaria Interna / Externa com Chapisco e Emboço)',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: { bold: true, size: 24, color: 'B45309' },
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• Parâmetros: ' }),
              new TextRun('Comprimento (m), Altura (m), Tipo de Bloco, Quantidade e Dimensões de Portas e Janelas, Inclusão de Revestimento Argamassado (Chapisco e Emboço/Reboco), Perda (%).'),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• Regra de Cálculo: ' }),
              new TextRun('Desconto de áreas de esquadrias. Chapisco consome 0.05 sacos de cimento/m² e 0.008 m³ areia/m². Emboço traço 1:4 com cal consome 0.12 sacos cimento/m², 0.10 sacos de cal hidratada 20kg/m² e 0.025 m³ de areia média/m² por face revestida.'),
            ],
          }),

          // Motor 3
          new Paragraph({
            text: '4.3 Piso e Pavimentação',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: { bold: true, size: 24, color: 'B45309' },
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• Parâmetros: ' }),
              new TextRun('Comprimento do cômodo (m), Largura (m), Espessura do Contrapiso (cm), Tipo de Revestimento (Cerâmica Padrão, Porcelanato Polido, Cimentado Líquido), Inclusão de Rodapé perimetral.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• Regra de Cálculo: ' }),
              new TextRun('Área = C * L. Contrapiso traço 1:4 calcula volume exato com consumo de 7 sacos de cimento por m³ de argamassa e 1.1 m³ de areia grossa por m³. Argamassa colante AC-II/AC-III consome 5 kg/m² (sacos de 20kg). Rejunte consome 0.35 kg/m². Pisos cerâmicos são arredondados para caixas comerciais fechadas (ex: 2.2 m²/cx).'),
            ],
          }),

          // Motor 4
          new Paragraph({
            text: '4.4 Pintura Residencial e Comercial',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: { bold: true, size: 24, color: 'B45309' },
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• Parâmetros: ' }),
              new TextRun('Área total a ser pintada (m²), Número de Demãos (1 a 4 demãos), Aplicação de Fundo Selador Acrílico (Sim/Não), Aplicação de Massa Corrida ou Massa Acrílica para nivelamento (Sim/Não), Tipo de Tinta (Látex PVA Econômico, Acrílica Fosca Premium, Verniz).'),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• Regra de Cálculo: ' }),
              new TextRun('Rendimento de tinta de ~10 m²/L/demão, agrupando em latas de 18L e galões de 3.6L para minimizar sobras financeiras. Massa corrida consome ~1.2 kg/m² por demão em sacos ou barricas de 25kg. Selador consome 0.12 L/m².'),
            ],
          }),

          // Motor 5
          new Paragraph({
            text: '4.5 Concreto Estrutural e Vigamento',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: { bold: true, size: 24, color: 'B45309' },
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• Parâmetros: ' }),
              new TextRun('Volume de concreto em metros cúbicos (m³) OU dimensões estruturais (base, altura e comprimento), Tipo de Elemento (Sapatas, Pilares, Vigas ou Laje Maciça), Traço do Concreto (convencional fck 25 MPa 1:2:3).'),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• Regra de Cálculo: ' }),
              new TextRun('Para cada 1 m³ de concreto estrutural 25 MPa: 7.0 sacos de cimento 50kg, 0.65 m³ de areia lavada média/grossa, 0.85 m³ de brita graduada nº 1. Taxa de aço CA-50 calculada em 85 kg a 100 kg de armadura por m³ de concreto estrutural, com arame recozido nº 18 para amarração (1.5 kg por 100 kg de aço).'),
            ],
          }),

          // Motor 6
          new Paragraph({
            text: '4.6 Fundação (Baldrame, Broca, Sapata Isolada, Radier)',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: { bold: true, size: 24, color: 'B45309' },
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• Parâmetros: ' }),
              new TextRun('Tipo de Fundação, Comprimento linear de vigas baldrame ou quantidade e profundidade de estacas brocas, Largura e Altura das peças, Concreto magro de proteção (espessura 5cm), Pintura asfáltica impermeabilizante.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• Regra de Cálculo: ' }),
              new TextRun('Volume de escavação, volume de concreto magro 1:3:6, volume de concreto usinado/virado em obra fck 25 MPa, armadura longitudinal e estribos a cada 15 cm com traspasse, emulsão asfáltica impermeabilizante (0.4 L/m² de face de contato com solo).'),
            ],
          }),

          // Motor 7
          new Paragraph({
            text: '4.7 Telhado e Cobertura',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: { bold: true, size: 24, color: 'B45309' },
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• Parâmetros: ' }),
              new TextRun('Área em projeção horizontal (m²), Inclinação do telhado (%), Tipo de Telha (Telha Cerâmica Colonial ~16 un/m², Fibrocimento 2.44x1.10m, Telha Metálica Trapezoidal Termoacústica), Estrutura (Madeira de lei tratada ou Aço galvanizado), Inclusão de Calhas e Cumeeiras.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• Regra de Cálculo: ' }),
              new TextRun('Cálculo da área real inclinada pelo fator de caimento Pitagórico. Madeiramento calcula metros lineares de ripas (espaçamento 32cm), caibros (espaçamento 50cm) e terças/vigas de apoio com parafusos e pregos galvanizados.'),
            ],
          }),

          // Motor 8
          new Paragraph({
            text: '4.8 Revestimento Cerâmico de Paredes (Azulejos / Pastilhas)',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: { bold: true, size: 24, color: 'B45309' },
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• Parâmetros: ' }),
              new TextRun('Área das paredes (m²), Vãos a descontar (portas, vitrôs), Tipo de Revestimento (Azulejo 30x60, Porcelanato parede, Pastilhas), Tipo de Argamassa Colante (AC-II interna / AC-III externa), Cor de Rejunte.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({ bold: true, text: '• Regra de Cálculo: ' }),
              new TextRun('Área líquida acrescida de perda de 10% a 15% para recortes nos cantos. Argamassa colante consome 4.5 a 5.0 kg/m² em sacos de 20kg. Rejunte fino antimofo consome 0.30 kg/m².'),
            ],
          }),

          // Motor 9
          new Paragraph({
            text: '4.9 Outros / Orçamento Customizado',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: { bold: true, size: 24, color: 'B45309' },
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Permite compor orçamentos livres adicionando insumos personalizados, definindo quantidades, unidades e valores unitários avulsos.',
              }),
            ],
          }),

          // SEÇÃO 5
          new Paragraph({
            text: '5. MODELO DE DADOS E TABELAS DO BANCO MYSQL',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            run: { bold: true, size: 28, color: '0F172A' },
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'O banco de dados relacional (banco "construtec_ia") é composto pelas seguintes tabelas:',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ bold: true, text: '1. usuarios: ' }),
              new TextRun('id (INT PK AUTO_INCREMENT), nome (VARCHAR 150), email (VARCHAR 150 UNIQUE), senha (VARCHAR 255 - Hash SHA-256), papel (ENUM "user", "admin", "master"), ativo (TINYINT 1), criado_em (DATETIME), ultimo_login (DATETIME).'),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ bold: true, text: '2. materiais: ' }),
              new TextRun('id (VARCHAR 64 PK), nome (VARCHAR 200), categoria (VARCHAR 100), unidade_comercial (VARCHAR 50), preco_base (DECIMAL 10,2), unidade_base (VARCHAR 50), descricao (TEXT), ativo (TINYINT 1).'),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ bold: true, text: '3. tipos_obra: ' }),
              new TextRun('chave (VARCHAR 64 PK), nome (VARCHAR 100), categoria (VARCHAR 100), icone (VARCHAR 50), ativo (TINYINT 1), ordem_exibicao (INT).'),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ bold: true, text: '4. orcamentos: ' }),
              new TextRun('id (VARCHAR 64 PK), usuario_id (VARCHAR 64), nome_projeto (VARCHAR 255), tipo_obra (VARCHAR 64), regiao_id (VARCHAR 32), estado_sigla (VARCHAR 2), custo_total (DECIMAL 12,2), margem_perda_percentual (DECIMAL 5,2), parametros_json (LONGTEXT), materiais_json (LONGTEXT), criado_em (DATETIME), atualizado_em (DATETIME).'),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ bold: true, text: '5. logs_auditoria: ' }),
              new TextRun('id (VARCHAR 64 PK), usuario_id (VARCHAR 64), usuario_nome (VARCHAR 150), acao (VARCHAR 100), detalhe (TEXT), ip (VARCHAR 45), data_hora (DATETIME).'),
            ],
          }),

          // SEÇÃO 6
          new Paragraph({
            text: '6. ENDPOINTS DA API RESTful (EXPRESS & SPRING BOOT)',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            run: { bold: true, size: 28, color: '0F172A' },
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ bold: true, text: '• POST /api/auth/login: ' }),
              new TextRun('Autenticação com email e senha (SHA-256), retorna JWT token e perfil de usuário com papel.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ bold: true, text: '• POST /api/auth/register: ' }),
              new TextRun('Cadastro de novo usuário com validação de duplicidade e atribuição de papel "user".'),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ bold: true, text: '• POST /api/auth/change-password: ' }),
              new TextRun('Alteração de senha autenticada via Bearer Token com validação da senha atual.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ bold: true, text: '• GET /api/materials: ' }),
              new TextRun('Lista todos os insumos com preços e multiplicadores regionais.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ bold: true, text: '• POST /api/calculate: ' }),
              new TextRun('Recebe tipo de obra, parâmetros geométricos e região, executa motor de cálculo e devolve lista de insumos com arredondamento comercial e custo.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ bold: true, text: '• GET/POST/DELETE /api/budgets: ' }),
              new TextRun('CRUD completo de orçamentos salvos do usuário autenticado.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ bold: true, text: '• GET /api/admin/users & PUT /api/admin/users/:id: ' }),
              new TextRun('Gestão de contas e papéis administrativos com proteção RBAC (somente ADM/Master).'),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ bold: true, text: '• GET /api/admin/audit-logs: ' }),
              new TextRun('Trilha de auditoria das ações de segurança e administrativas.'),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ bold: true, text: '• GET /api/database/status: ' }),
              new TextRun('Diagnóstico de conexão ao vivo com o MySQL, latência de ping e contagem de registros.'),
            ],
          }),

          // SEÇÃO 7
          new Paragraph({
            text: '7. PROMPT MESTRE PARA ENVIAR A UMA INTELIGÊNCIA ARTIFICIAL',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            run: { bold: true, size: 28, color: '0F172A' },
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: 'Copie e cole o texto delimitado abaixo diretamente na IA (ChatGPT, Claude, Gemini, Cursor, v0 ou similar) para que ela construa um sistema 100% idêntico:',
                italics: true,
              }),
            ],
          }),

          // BLOCO DE PROMPT FORMATADO
          new Paragraph({
            spacing: { before: 200, after: 200 },
            shading: { type: ShadingType.SOLID, color: 'F1F5F9' },
            children: [
              new TextRun({
                bold: true,
                size: 20,
                color: '0F172A',
                text: '--- INÍCIO DO PROMPT PARA A INTELIGÊNCIA ARTIFICIAL ---\n\n',
              }),
              new TextRun({
                size: 19,
                color: '1E293B',
                text: `Atue como um Engenheiro de Software Sênior especialista em Construção Civil, React, TypeScript, Node.js e Tailwind CSS.

Construa uma plataforma web completa chamada "ConstruTec" para cálculo de materiais e orçamentos de engenharia civil.

O sistema deve ter OBRIGATORIAMENTE os seguintes recursos e requisitos idênticos:

1. REQUISITOS DE DESIGN E INTERFACE (UI/UX):
- Suporte nativo e alternável a TEMA CLARO (Light Mode) e TEMA ESCURO (Dark Mode) com persistência em localStorage e transições suaves de cor.
- Topo fixo (Header Sticky top-0 z-50) com fundo sólido (sem transparência de rolagem), impedindo que o scroll da página sobreponha o botão de Login ("Entrar"), a foto do usuário e o botão "Sair da conta".
- Menu do usuário suspenso (Dropdown) com z-index elevado (z-[100]), backdrop de clique externo e opções: Trocar Tema, Meus Orçamentos, Painel Administrativo, Alterar Minha Senha e Sair da Conta.
- Navegação lateral (Sidebar) com atalhos para: Início, Calculadora, Catálogo de Materiais, Meus Orçamentos, Sobre e Painel ADM.
- Seletor de Localização Regional com multiplicadores de preço baseados no SINAPI para todas as capitais brasileiras.

2. OS 9 MOTORES DE CÁLCULO DE ENGENHARIA CIVIL (CALCULATION ENGINE):
Desenvolva a classe CalculationService contendo 9 motores de cálculo:
- Muro: Bloco 14x19x39, Bloco 09x19x39 ou Tijolo Cerâmico 8 furos; desconto de portões; cálculo de blocos, cimento e areia lavada média.
- Parede: Desconto de portas e janelas; opcional de chapisco traço 1:3 e emboço/reboco traço 1:4 com cal hidratada em sacos de 20kg.
- Piso: Área e rodapés; contrapiso 1:4 por espessura em cm; argamassa colante AC-I/AC-II/AC-III em sacos de 20kg; piso cerâmico ou porcelanato com caixas comerciais fechadas; rejunte.
- Pintura: Área total e número de demãos (1 a 4); opcional de fundo selador e massa corrida/acrílica; tinta látex PVA ou acrílica premium em latas de 18L e galões de 3.6L.
- Concreto Estrutural: Volume ou dimensões de peças estruturais; traço 1:2:3 25 MPa; cálculo de sacos de cimento 50kg, areia, brita, armadura de aço CA-50 em kg e arame recozido nº 18.
- Fundação: Baldrame, brocas perfuradas, sapatas isoladas ou radier; concreto magro, concreto estrutural, armadura e impermeabilização asfáltica.
- Telhado: Projeção com fator de caimento/inclinação Pitagórica; telhas cerâmicas tipo colonial (~16 un/m²), fibrocimento ou metálicas; madeiramento (ripas, caibros, terças/vigas); calhas e cumeeiras.
- Revestimento de Parede: Azulejos e pastilhas para áreas molhadas; argamassa colante e rejunte antimofo.
- Personalizado / Outros: Composição livre de insumos.

3. PERSISTÊNCIA, BANCO DE DADOS E BACKEND:
- Backend em Express.js com endpoints RESTful para autenticação JWT, cálculo, orçamentos, catálogo de insumos e auditoria.
- Banco de dados MySQL relacional (tabelas: usuarios, materiais, tipos_obra, orcamentos, logs_auditoria).
- Fallback resiliente: Caso o MySQL local não esteja em execução, o sistema funciona perfeitamente em memória sem quebrar, sincronizando assim que a conexão MySQL for estabelecida.
- Suporte a script de migração e criação automática de tabelas.

4. SISTEMA DE PERMISSÕES E PAINEL ADMINISTRATIVO:
- Quatro papéis: Visitante, Usuário Comum, ADM e ADM Master.
- O Master pode gerenciar contas, alterar papéis de usuários, desativar acessos e ver logs de auditoria.
- Seletor rápido de teste no cabeçalho para simular a visão de qualquer usuário sem precisar fazer logout.

5. RELATÓRIOS E IMPRESSÃO:
- Modal de impressão de orçamento com formatação limpa (print CSS sem elementos de navegação), tabela discriminada com quantidades brutas e comerciais, totais e assinaturas técnicas.

Gere o código completo, limpo, modular e funcional seguindo esses requisitos estritos.
--- FIM DO PROMPT ---`,
              }),
            ],
          }),

          // SEÇÃO 8
          new Paragraph({
            text: '8. CONCLUSÃO E DIRETRIZES DE REPRODUÇÃO',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            run: { bold: true, size: 28, color: '0F172A' },
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Este documento contém 100% dos requisitos estruturais, regras de engenharia civil, modelos relacionais e detalhes de interface necessários para reproduzir o sistema ConstruTec de forma totalmente idêntica e sem lacunas.',
              }),
            ],
          }),
        ],
      },
    ],
  });

  // Salva o DOCX
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(docxFilePath, buffer);
  fs.writeFileSync(publicDocxPath, buffer);
  console.log(`[DOCX] Arquivo Word gerado em: ${docxFilePath} (${buffer.length} bytes)`);
  console.log(`[DOCX] Cópia pública gerada em: ${publicDocxPath}`);

  // 2. GERAÇÃO DA VERSÃO EM MARKDOWN (.md) E TEXTO (.txt)
  const fullContent = `# CONSTRUTEC - ESPECIFICAÇÃO TÉCNICA E FUNCIONAL COMPLETA
**Documento para Criação e Reprodução Idêntica do Sistema por Inteligência Artificial**
*Versão 3.0 Enterprise Edition | Data: 2026 | Idioma: Português (Brasil)*

---

## 1. VISÃO GERAL E MISSÃO DO SISTEMA
O **ConstruTec** é uma plataforma inteligente e corporativa para cálculo automatizado de materiais de construção civil, orçamentos quantitativos e estimativas de custos com base na tabela regionalizada SINAPI.

Seu principal objetivo é eliminar o "achismo" e a informalidade no canteiro de obras, reduzindo o desperdício de insumos em até 30% e prevenindo a paralisação de operários por falta de materiais.

---

## 2. REQUISITOS TÉCNICOS E STACK TECNOLÓGICA
- **Frontend SPA**: React 19, TypeScript (~5.8), Vite 6.
- **Estilização**: Tailwind CSS v4 com padrão de temas Claro e Escuro unificados.
- **Top Bar / Header**: Sticky (\`sticky top-0 z-50\`) com fundo 100% sólido (\`bg-white dark:bg-slate-900\`), impedindo qualquer vazamento visual do conteúdo rolado sob os botões de Entrar/Sair.
- **Dropdown de Usuário**: Posicionamento absoluto com \`z-[100]\` e backdrop \`z-[90]\`, garantindo que o menu nunca seja sobreposto por elementos da página.
- **Biblioteca de Ícones**: Lucide React.
- **Feedback Visual**: Canvas Confetti ao salvar orçamentos, Motion para transições de páginas.
- **Backend Node.js / Express**: Arquitetura modular montada em \`server.ts\` com endpoints RESTful, geração e validação de JWT, hash criptográfico de senhas.
- **Backend Java / Spring Boot**: Módulo complementar em \`backend/pom.xml\` e \`backend/src/\`.
- **Banco de Dados**: MySQL 8.0+ com failover resiliente em memória caso o MySQL local não esteja conectado, realizando sync automático quando disponível.

---

## 3. NÍVEIS DE PERMISSÃO E GESTÃO DE ACESSO (RBAC)
1. **Visitante (Anônimo)**:
   - Acesso ao cálculo instantâneo na Calculadora.
   - Acesso ao Catálogo de Insumos e multiplicadores regionais SINAPI.
   - Ao tentar salvar orçamentos ou acessar o painel administrativo, abre o modal de autenticação.
2. **Usuário Comum**:
   - Salva orçamentos com título do projeto e notas técnicas.
   - Histórico completo na aba "Meus Orçamentos".
   - Impressão de relatórios técnicos profissionais com marca d'água e linhas de assinatura.
   - Troca de senha autenticada.
3. **Administrador (ADM)**:
   - Acesso ao Painel Administrativo (\`/admin\`).
   - Gestão de Insumos do Catálogo (criar, editar preços unitários, unidades comerciais e categorias).
   - Acompanhamento de todas as obras cadastradas na plataforma.
   - Monitoramento do status e ping do banco MySQL.
4. **Administrador Master (Super ADM)**:
   - Gestão de Usuários (tornar administrador, redefinir senhas, desativar usuários).
   - Auditoria completa do sistema com visualização de logs com IP e data/hora.
   - Seletor de Modo de Teste rápido para inspecionar qualquer visão sem deslogar.

---

## 4. OS 9 MOTORES DE CÁLCULO DE ENGENHARIA CIVIL
Implementados em \`src/services/calculationEngine.ts\`:

### 4.1 Muro (Alvenaria de Vedação Externa)
- **Parâmetros**: Comprimento (m), Altura (m), Tipo de Bloco (Bloco Concreto 14x19x39, Bloco Concreto 09x19x39, Tijolo Cerâmico 8 furos), Portões (quantidade, largura, altura), Perda (%).
- **Cálculo**:
  - Área Líquida = (Comprimento * Altura) - Área de Portões.
  - Bloco Concreto 14/09 = 12.5 unidades/m² * fator de perda.
  - Tijolo Cerâmico 8f = 25.0 unidades/m² * fator de perda.
  - Argamassa de assentamento: 0.15 sacos de cimento 50kg/m² e 0.022 m³ de areia lavada média/m².

### 4.2 Parede (Alvenaria Interna / Externa)
- **Parâmetros**: Comprimento, Altura, Tipo de Bloco, Portas e Janelas, Revestimento (Chapisco e Emboço/Reboco), Perda.
- **Cálculo**:
  - Desconto exato das áreas de portas e janelas.
  - Chapisco traço 1:3: 0.05 sacos de cimento/m² e 0.008 m³ areia/m² por face.
  - Emboço/Reboco traço 1:4 com cal: 0.12 sacos cimento/m², 0.10 sacos de cal hidratada 20kg/m² e 0.025 m³ de areia média/m² por face.

### 4.3 Piso e Pavimentação
- **Parâmetros**: Comprimento (m), Largura (m), Espessura do Contrapiso (cm), Tipo de Revestimento (Cerâmica, Porcelanato, Cimentado), Rodapés.
- **Cálculo**:
  - Contrapiso traço 1:4: Volume = C * L * (espessura/100). Consumo: 7 sacos de cimento 50kg por m³ e 1.1 m³ de areia grossa por m³.
  - Argamassa Colante AC-II/AC-III: 5 kg/m² em sacos de 20kg.
  - Piso Cerâmico/Porcelanato: Arredondamento para caixas comerciais fechadas (ex: 2.2 m²/caixa) com acréscimo de perda para cortes.
  - Rejunte flexível: 0.35 kg/m².

### 4.4 Pintura Residencial e Comercial
- **Parâmetros**: Área total (m²), Número de demãos (1 a 4), Fundo Selador (Sim/Não), Massa Corrida/Acrílica (Sim/Não), Tipo de Tinta.
- **Cálculo**:
  - Rendimento padrão de tinta: 10 m²/litro/demão. Otimização em latas de 18L e galões de 3.6L.
  - Fundo Selador Acrílico: 0.12 L/m².
  - Massa Corrida: 1.2 kg/m² por demão (sacos/barricas de 25kg).

### 4.5 Concreto Estrutural
- **Parâmetros**: Volume em m³ ou dimensões estruturais (base, altura, comprimento), Elemento (Sapata, Pilar, Viga, Laje), Traço 1:2:3 25 MPa.
- **Cálculo por 1 m³ de concreto**:
  - Cimento 50kg: 7.0 sacos.
  - Areia lavada: 0.65 m³.
  - Brita nº 1: 0.85 m³.
  - Aço CA-50: 85 a 100 kg/m³ de concreto em barras de 12m.
  - Arame recozido nº 18: 1.5 kg por 100 kg de armadura.

### 4.6 Fundação
- **Parâmetros**: Baldrame, Broca perfurada, Sapata isolada, Radier; Concreto magro (5cm); Impermeabilização asfáltica.
- **Cálculo**:
  - Volume de escavação e concreto magro 1:3:6.
  - Concreto estrutural fck 25 MPa e armadura estribada a cada 15 cm.
  - Tinta asfáltica impermeabilizante: 0.4 L/m² de face enterrada.

### 4.7 Telhado e Cobertura
- **Parâmetros**: Área em projeção (m²), Inclinação (%), Tipo de telha (Cerâmica colonial ~16 un/m², Fibrocimento, Metálica), Estrutura (Madeira ou Metálica), Calhas e Cumeeiras.
- **Cálculo**:
  - Área real inclinada calculada pelo fator de caimento Pitagórico.
  - Madeiramento: Ripas (a cada 32cm), Caibros (a cada 50cm), Vigas/Terças com pregos e parafusos.

### 4.8 Revestimento Cerâmico de Paredes
- **Parâmetros**: Área das paredes em áreas molhadas (banheiros, cozinhas), Desconto de portas e janelas, Tipo de argamassa (AC-II ou AC-III).
- **Cálculo**:
  - Azulejos em caixas fechadas com perda de recorte de 10% a 15%.
  - Argamassa colante 5 kg/m² e rejunte antimofo 0.30 kg/m².

### 4.9 Outros / Personalizado
- Composição livre e flexível com insumos avulsos.

---

## 5. ESTRUTURA DO BANCO DE DADOS MYSQL
Banco: \`construtec_ia\`

\`\`\`sql
-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  papel ENUM('user', 'admin', 'master') NOT NULL DEFAULT 'user',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  ultimo_login DATETIME NULL
);

-- 2. Tabela de Materiais
CREATE TABLE IF NOT EXISTS materiais (
  id VARCHAR(64) PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  unidade_comercial VARCHAR(50) NOT NULL,
  preco_base DECIMAL(10,2) NOT NULL,
  unidade_base VARCHAR(50) NOT NULL,
  descricao TEXT,
  ativo TINYINT(1) NOT NULL DEFAULT 1
);

-- 3. Tabela de Tipos de Obra
CREATE TABLE IF NOT EXISTS tipos_obra (
  chave VARCHAR(64) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  icone VARCHAR(50) NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  ordem_exibicao INT NOT NULL DEFAULT 0
);

-- 4. Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
  id VARCHAR(64) PRIMARY KEY,
  usuario_id VARCHAR(64) NOT NULL,
  nome_projeto VARCHAR(255) NOT NULL,
  tipo_obra VARCHAR(64) NOT NULL,
  regiao_id VARCHAR(32) NOT NULL,
  estado_sigla VARCHAR(2) NOT NULL,
  custo_total DECIMAL(12,2) NOT NULL,
  margem_perda_percentual DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  parametros_json LONGTEXT NOT NULL,
  materiais_json LONGTEXT NOT NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id VARCHAR(64) PRIMARY KEY,
  usuario_id VARCHAR(64) NULL,
  usuario_nome VARCHAR(150) NULL,
  acao VARCHAR(100) NOT NULL,
  detalhe TEXT NULL,
  ip VARCHAR(45) NULL,
  data_hora DATETIME DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

---

## 6. PROMPT MESTRE PARA INTELIGÊNCIAS ARTIFICIAIS (CHATGPT, CLAUDE, GEMINI, CURSOR)

\`\`\`
Atue como um Arquiteto de Software e Engenheiro Full-Stack Sênior especializado em Construção Civil.
Crie um sistema web idêntico ao "ConstruTec" com os seguintes requisitos rigorosos:

1. REQUISITOS DE TELA E INTERFACE:
- Interface moderna, responsiva, com suporte completo a Tema Claro e Escuro (Light/Dark).
- Header fixo com 'sticky top-0 z-50' e fundo sólido 'bg-white dark:bg-slate-900' para impedir qualquer sobreposição ou vazamento de texto ao rolar a página sobre os botões de Login ("Entrar") e Logout ("Sair da conta").
- Menu Dropdown do usuário no topo direito com 'z-[100]' e backdrop 'z-[90]' com opções: Modo Claro/Escuro, Meus Orçamentos, Painel ADM, Alterar Senha e Sair.
- Sidebar lateral retrátil no mobile e persistente no desktop.
- Modal de impressão limpa com tabela de orçamentos, marcas d'água profissionais e campos para assinatura técnica.

2. ENGENHARIA E CÁLCULOS CIVIS (9 MOTORES):
- Implemente a classe CalculationService com as fórmulas para: Muro, Parede (com chapisco e emboço), Piso (contrapiso 1:4, argamassa colante, piso em caixas e rejunte), Pintura (rendimento 10m²/L, latas de 18L e galões de 3.6L, selador e massa corrida), Concreto Estrutural (traço 1:2:3 25 MPa, cimento 50kg, areia, brita, aço CA-50 e arame recozido), Fundação (baldrame, broca, radier, concreto magro e impermeabilização asfáltica), Telhado (área real inclinada, madeiramento ripas/caibros/terças e telhas cerâmicas/fibrocimento), Revestimento de Parede e Outros personalizados.

3. DADOS REGIONAIS E TABELA SINAPI:
- Catálogo de insumos com precificação base e multiplicadores estaduais (SP 1.0, RJ 1.05, MG 0.96, BA 0.92, PR 0.98, DF 1.08, AM 1.15, RS 1.02, etc.).

4. BANCO DE DADOS E BACKEND:
- API RESTful em Express (Node.js/TypeScript) com rotas para autenticação JWT, cálculo, orçamentos, catálogo e auditoria.
- Banco de dados MySQL relacional com arquitetura híbrida de failover em memória caso o MySQL não esteja rodando, sincronizando automaticamente quando disponível.
- Gestão de papéis RBAC: Visitante, Usuário, Administrador e Administrador Master.

Gere o código completo, funcional e modular.
\`\`\`
`;

  fs.writeFileSync(mdFilePath, fullContent, 'utf-8');
  fs.writeFileSync(txtFilePath, fullContent, 'utf-8');
  fs.writeFileSync(publicTxtPath, fullContent, 'utf-8');

  console.log(`[MD] Arquivo Markdown gerado em: ${mdFilePath}`);
  console.log(`[TXT] Arquivo TXT gerado em: ${txtFilePath}`);
  console.log(`[TXT] Cópia pública gerada em: ${publicTxtPath}`);
  console.log('Todos os arquivos foram gerados com sucesso!');
}

generateDocumentation().catch(err => {
  console.error('Erro ao gerar documentação:', err);
  process.exit(1);
});
