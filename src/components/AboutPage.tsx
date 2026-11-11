import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Target, 
  TrendingDown, 
  Leaf, 
  Clock, 
  Users, 
  Cpu, 
  CheckCircle2,
  HardHat,
  Scale,
  FileText,
  Download,
  Copy,
  Check,
  Sparkles,
  Bot,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [termsOfUse, setTermsOfUse] = useState('');

  useEffect(() => {
    fetch('/api/system-settings')
      .then(async (response) => {
        if (!response.ok) throw new Error('Não foi possível carregar os termos de uso.');
        return response.json();
      })
      .then((settings: { termsOfUse?: string }) => {
        if (settings.termsOfUse) setTermsOfUse(settings.termsOfUse);
      })
      .catch((error) => console.error('[Sistema] Não foi possível carregar os termos:', error));
  }, []);

  const aiPromptText = `Atue como um Engenheiro de Software Sênior especialista em Construção Civil, React, TypeScript, Node.js e Tailwind CSS.

Construa uma plataforma web completa chamada "ConstruTec" para cálculo de materiais e orçamentos de engenharia civil.

O sistema deve ter OBRIGATORIAMENTE os seguintes recursos e requisitos idênticos:

1. REQUISITOS DE DESIGN E INTERFACE (UI/UX):
- Suporte nativo e alternável a TEMA CLARO (Light Mode) e TEMA ESCURO (Dark Mode) com persistência em localStorage ("construtec_theme") e transições suaves de cor.
- Topo fixo (Header Sticky top-0 z-50) com fundo sólido (bg-white dark:bg-slate-900), impedindo que o scroll da página sobreponha o botão de Login ("Entrar"), a foto do usuário e o botão "Sair da conta".
- Menu do usuário suspenso (Dropdown) com z-index elevado (z-[100]), backdrop de clique externo (z-[90]) e opções: Trocar Tema, Meus Orçamentos, Painel Administrativo, Alterar Minha Senha e Sair da Conta.
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

Gere o código completo, limpo, modular e funcional seguindo esses requisitos estritos.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(aiPromptText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* HEADER */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold mb-3 border border-amber-500/20 dark:border-amber-500/30">
          <HardHat className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>SOBRE A PLATAFORMA</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Inteligência aplicada à Construção Civil
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
          A <strong className="text-slate-900 dark:text-white">ConstruTec</strong> nasceu com uma missão clara: transformar o modo como reformas e obras são planejadas no Brasil, eliminando o achismo e garantindo previsibilidade financeira.
        </p>
      </div>

      {/* GUIA ÚNICO DE APRESENTAÇÃO E FUNCIONAMENTO DO SISTEMA */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-100 to-amber-500/5 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border-2 border-amber-400/50 dark:border-amber-500/30 p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider">
              <Bot className="w-3.5 h-3.5" />
              <span>Guia de apresentação do sistema</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Guia Completo do ConstruTec
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Um único documento explica as tecnologias, a arquitetura, os fluxos de uso e de dados, as pastas e arquivos do código e um roteiro para apresentar o sistema.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
            <a
              href="/api/docs/download"
              download="GUIA_COMPLETO_CONSTRUTEC.md"
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Guia Completo (.md)</span>
            </a>

            <button
              type="button"
              onClick={handleCopyPrompt}
              className={`px-5 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 shadow-xs'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-amber-500" />}
              <span>{copied ? 'Prompt Copiado!' : 'Copiar Prompt para IA'}</span>
            </button>

            <a
              href="/api/docs/download"
              download="GUIA_COMPLETO_CONSTRUTEC.md"
              className="px-4 py-2 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-center transition-colors"
            >
              Baixar o mesmo guia em Markdown
            </a>
          </div>
        </div>

        {/* ACORDEÃO / VISUALIZADOR DO PROMPT */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowPromptDetails(!showPromptDetails)}
            className="flex items-center justify-between w-full text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 py-2 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Visualizar Prompt Mestre para a Inteligência Artificial</span>
            </span>
            {showPromptDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showPromptDetails && (
            <div className="mt-3 p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-96 border border-slate-800 selection:bg-amber-500 selection:text-slate-950 animate-in fade-in">
              <pre className="whitespace-pre-wrap">{aiPromptText}</pre>
            </div>
          )}
        </div>
      </div>

      {/* O CONCEITO CENTRAL */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl text-center relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
            Nosso Lema
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-white">
            "Calcule com precisão, construa com economia."
          </h2>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            Unimos fórmulas consagradas da engenharia civil com tecnologia moderna para calcular desde um simples muro até pavimentações e estruturas complexas.
          </p>
        </div>
      </div>

      {/* O PROBLEMA QUE RESOLVEMOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
            O Desafio da Obra
          </span>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Por que 80% das obras estouram o orçamento?
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
            Historicamente, o cálculo de materiais no canteiro de obras depende de estimativas informais ("no olho"). As consequências são graves:
          </p>
          <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">✗</span>
              <span><strong>Falta de material no meio do dia:</strong> paralisa pedreiros e gera custo ocioso de mão de obra.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">✗</span>
              <span><strong>Sobra excessiva de entulho:</strong> dinheiro jogado fora e descarte prejudicial ao meio ambiente.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">✗</span>
              <span><strong>Compras fracionadas emergenciais:</strong> fretes repetidos e perda de descontos por lote.</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            A Solução ConstruTec
          </span>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">
            Engenharia acessível a qualquer pessoa
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Nossos algoritmos realizam três passos cruciais:
          </p>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <strong className="text-slate-900 dark:text-white block font-semibold">1. Área & Volume Geométrico Real</strong>
              <span className="text-slate-500 dark:text-slate-400">Descontamos vãos de portas, janelas e consideramos a espessura exata das peças.</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <strong className="text-slate-900 dark:text-white block font-semibold">2. Arredondamento Comercial Preciso</strong>
              <span className="text-slate-500 dark:text-slate-400">Transformamos metros cúbicos em sacos de 50kg, latas de 18L e caixas de porcelanato fechadas.</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <strong className="text-slate-900 dark:text-white block font-semibold">3. Tabela Regionalizada SINAPI</strong>
              <span className="text-slate-500 dark:text-slate-400">Preços ponderados para cada estado da federação, evitando surpresas no orçamento.</span>
            </div>
          </div>
        </div>
      </div>

      {/* PARA QUEM É A CONSTRUTEC */}
      <div>
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Público-Alvo
          </span>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Projetado para todos os elos da construção
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Proprietários de Imóveis</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Compre materiais com autonomia, compare preços em depósitos e não pague por desperdício desnecessário.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Pedreiros & Empreiteiros</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Gere orçamentos impressos com aspecto profissional para seus clientes e ganhe credibilidade imediata.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Mestres de Obras</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Controle requisições de insumos em cada etapa (fundação, alvenaria, reboco, piso, telhado) sem atrasos.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Engenheiros & Arquitetos</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Ferramenta rápida para estimativas preliminares de custo e anteprojetos em reuniões com clientes.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Lojas & Depósitos de Materiais</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Atenda balconistas e clientes rapidamente montando orçamentos completos a partir das medidas da obra.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Estudantes de Engenharia / ADS</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Aprenda a formulação matemática de consumo de agregados, traços de concreto e índices de alvenaria.
            </p>
          </div>
        </div>
      </div>

      {/* AVISO TÉCNICO LEGAL */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 text-center">
        <p className="font-semibold text-slate-800 dark:text-slate-200">Aviso Legal & Responsabilidade Técnica</p>
        <p className="mt-1 max-w-2xl mx-auto">
          {termsOfUse || 'Os cálculos apresentados pela ConstruTec são estimativas baseadas em parâmetros normativos e médias de mercado. Para obras estruturais, contenções ou intervenções de risco, a contratação de um Engenheiro Civil ou Arquiteto registrado no CREA/CAU com a emissão da devida ART/RRT é indispensável.'}
        </p>
      </div>

    </div>
  );
};
