# CONSTRUTEC - ESPECIFICAÇÃO TÉCNICA E FUNCIONAL COMPLETA
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
- **Top Bar / Header**: Sticky (`sticky top-0 z-50`) com fundo 100% sólido (`bg-white dark:bg-slate-900`), impedindo qualquer vazamento visual do conteúdo rolado sob os botões de Entrar/Sair.
- **Dropdown de Usuário**: Posicionamento absoluto com `z-[100]` e backdrop `z-[90]`, garantindo que o menu nunca seja sobreposto por elementos da página.
- **Biblioteca de Ícones**: Lucide React.
- **Feedback Visual**: Canvas Confetti ao salvar orçamentos, Motion para transições de páginas.
- **Backend Node.js / Express**: Arquitetura modular montada em `server.ts` com endpoints RESTful, geração e validação de JWT, hash criptográfico de senhas.
- **Backend Java / Spring Boot**: Módulo complementar em `backend/pom.xml` e `backend/src/`.
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
   - Acesso ao Painel Administrativo (`/admin`).
   - Gestão de Insumos do Catálogo (criar, editar preços unitários, unidades comerciais e categorias).
   - Acompanhamento de todas as obras cadastradas na plataforma.
   - Monitoramento do status e ping do banco MySQL.
4. **Administrador Master (Super ADM)**:
   - Gestão de Usuários (tornar administrador, redefinir senhas, desativar usuários).
   - Auditoria completa do sistema com visualização de logs com IP e data/hora.
   - Seletor de Modo de Teste rápido para inspecionar qualquer visão sem deslogar.

---

## 4. OS 9 MOTORES DE CÁLCULO DE ENGENHARIA CIVIL
Implementados em `src/services/calculationEngine.ts`:

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
Banco: `construtec_ia`

```sql
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
```

---

## 6. PROMPT MESTRE PARA INTELIGÊNCIAS ARTIFICIAIS (CHATGPT, CLAUDE, GEMINI, CURSOR)

```
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
```
