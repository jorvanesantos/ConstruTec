import React, { useState } from 'react';
import { WorkTypeKey } from '../types';
import { WORK_TYPES } from '../data/catalog';
import { 
  Calculator, 
  ArrowRight, 
  FileText, 
  CheckCircle2, 
  Layers, 
  Building2, 
  Paintbrush, 
  Grid3X3, 
  Hammer, 
  Home, 
  Boxes, 
  Wrench,
  HelpCircle,
  MapPin,
  Package,
  SlidersHorizontal,
  ChevronDown,
  Printer
} from 'lucide-react';

interface HeroProps {
  onSelectWorkType: (type: WorkTypeKey) => void;
  onGoToBudgets: () => void;
  onGoToCalculator: () => void;
}

const iconMap: Record<string, any> = {
  Layers,
  Building2,
  Grid3X3,
  Paintbrush,
  Boxes,
  Hammer,
  Home,
  Wrench
};

export const Hero: React.FC<HeroProps> = ({
  onSelectWorkType,
  onGoToBudgets,
  onGoToCalculator
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const scrollToHowItWorks = () => {
    const el = document.getElementById('como-funciona');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      question: 'Preciso pagar ou cadastrar cartão de crédito para usar?',
      answer: 'Não. O cálculo de quantitativos de materiais e estimativas de custos da ConstruTec é 100% gratuito. Você pode calcular quantas obras desejar.'
    },
    {
      question: 'De onde vêm os preços apresentados nos cálculos?',
      answer: 'Utilizamos a tabela oficial do SINAPI (Caixa Econômica Federal e IBGE), atualizada e ponderada com os coeficientes de mercado de cada um dos estados brasileiros. Você pode trocar seu estado no topo a qualquer momento.'
    },
    {
      question: 'Não entendo de engenharia, vou conseguir usar?',
      answer: 'Com certeza! A plataforma foi feita pensando em quem vai construir ou reformar e não quer ser enganado. Você só precisa medir o tamanho da sua parede, chão ou muro com uma trena comum. Nós fazemos todas as contas técnicas por você.'
    },
    {
      question: 'O que significa o arredondamento comercial?',
      answer: 'Nas lojas de materiais você não compra 3,2 sacos de cimento ou 1,4 latas de tinta. Nosso sistema arredonda automaticamente para sacos inteiros de 50kg, latas de 18L, galões de 3,6L e caixas fechadas de piso, evitando compras erradas.'
    }
  ];

  return (
    <div className="w-full">
      {/* SEÇÃO PRINCIPAL DE BOAS-VINDAS (HERO) */}
      <section className="pt-8 pb-14 sm:pt-12 sm:pb-20 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Coluna da Esquerda: Mensagem Clara & Humana */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                <span>Calculadora prática de materiais para sua obra</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.18]">
                Saiba exatamente quanto comprar,{' '}
                <span className="text-amber-600 dark:text-amber-400">sem faltar nem sobrar.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                Informe as medidas básicas da sua reforma ou construção. A <strong className="text-slate-900 dark:text-white font-semibold">ConstruTec</strong> gera 
                a lista completa em embalagens que você realmente encontra no depósito — sacos fechados de cimento, latas de tinta e caixas de porcelanato —, com estimativa de custo para o seu estado.
              </p>

              {/* Botões de Ação Direta */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  id="btn-hero-calc-main"
                  onClick={onGoToCalculator}
                  className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Fazer um cálculo agora</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </button>

                <button
                  type="button"
                  onClick={scrollToHowItWorks}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span>Como funciona o cálculo</span>
                </button>

                <button
                  id="btn-hero-budgets"
                  onClick={onGoToBudgets}
                  className="px-4 py-3.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Meus orçamentos</span>
                </button>
              </div>

              {/* Destaques Rápidos de Confiança */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Embalagens comerciais reais</span>
                </div>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Margem de perda ajustável</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>Preços médios por Estado</span>
                </div>
              </div>

            </div>

            {/* Coluna da Direita: Exemplo Real e Limpo (Estilo Prancheta de Obra) */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-md transition-colors relative">
                
                {/* Cabeçalho do Exemplo */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Exemplo Real de Cálculo
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                      Muro Residencial (20m × 2,20m)
                    </h3>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    44 m² de área
                  </span>
                </div>

                {/* Lista Realista de Materiais Arredondados */}
                <div className="space-y-2.5 py-4">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">Blocos de Concreto (14×19×39)</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Inclui 10% de folga para recortes</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm shrink-0">605 un</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">Cimento Portland CP II</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Arredondado para sacos fechados</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm shrink-0">8 sacos (50kg)</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">Areia Média Lavada</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Volume para argamassa de assentamento</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm shrink-0">1,2 m³</span>
                  </div>
                </div>

                {/* Resumo de Valor e Rodapé do Exemplo */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Estimativa total dos materiais:</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">R$ 3.183,40</span>
                  </div>
                  <button
                    onClick={() => onSelectWorkType('muro')}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Calcular este muro</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* GUIA DE ONBOARDING: PRIMEIRA VEZ AQUI? (3 PASSOS SIMPLES) */}
      <section id="como-funciona" className="py-14 sm:py-18 bg-white dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Primeira vez por aqui?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Como funciona em 3 passos simples
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Você não precisa saber fórmulas matemáticas nem coeficientes de engenharia. O sistema faz tudo automaticamente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Passo 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-700 text-amber-400 flex items-center justify-center font-bold text-base mb-4">
                  1
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Escolha o tipo de obra
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Selecione se você vai levantar um muro, construir paredes de tijolo, assentar piso, pintar cômodos, bater laje ou fazer fundação.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-500 dark:text-slate-400">
                8 categorias prontas para usar
              </div>
            </div>

            {/* Passo 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-700 text-amber-400 flex items-center justify-center font-bold text-base mb-4">
                  2
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Digite as medidas básicas
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Informe comprimento e altura com uma trena simples, ou a metragem em m². Você também pode escolher o percentual de perda para quebras.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-500 dark:text-slate-400">
                Campos guiados com dicas na tela
              </div>
            </div>

            {/* Passo 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-700 text-amber-400 flex items-center justify-center font-bold text-base mb-4">
                  3
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Receba a lista para a loja
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Veja a relação pronta em sacos, caixas e latas. Imprima a folha ou salve seu orçamento para negociar no depósito de construção.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-500 dark:text-slate-400">
                Embalagens reais com custo estimado
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* CATÁLOGO DE OBRAS: ESCOLHA O QUE VAI CONSTRUIR */}
      <section className="py-14 sm:py-18 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Catálogo de Obras
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                O que você quer calcular hoje?
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
              Clique em qualquer categoria abaixo para abrir a calculadora com os campos específicos daquele serviço.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WORK_TYPES.map((type) => {
              const IconComponent = iconMap[type.icon] || Boxes;
              return (
                <div
                  key={type.id}
                  id={`card-work-type-${type.id}`}
                  onClick={() => onSelectWorkType(type.id)}
                  className="group rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 group-hover:bg-amber-500 text-amber-600 dark:text-amber-400 group-hover:text-slate-950 flex items-center justify-center transition-colors">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        Perda: {type.defaultWaste}%
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {type.name}
                    </h3>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                      {type.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    <span>Calcular {type.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* DIFERENCIAIS PRÁTICOS (POR QUE USAR A CONSTRUTEC?) */}
      <section className="py-14 sm:py-18 bg-white dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Vantagens Reais
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Quatro motivos para calcular antes de comprar
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Mais de 20% do orçamento de uma obra comum é desperdiçado em compras erradas ou sobras esquecidas no quintal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Embalagens Comerciais</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Você nunca precisará adivinhar quantos sacos de 50kg ou galões de tinta comprar. O sistema já faz o arredondamento ideal.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Preços da sua Região</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Tabela referencial ponderada com base no SINAPI oficial para todos os 27 estados do Brasil, ajustada à sua localidade.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Margem de Folga</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Controle perdas por cortes em cantos e quebras acidentais com um slider fácil de 0% a 30%, sem risco de faltar material no meio do serviço.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Imprima ou Salve</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Gere uma lista limpa em PDF para levar diretamente na loja de construção ou entregar para o seu pedreiro cotar.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* DÚVIDAS FREQUENTES (FAQ) */}
      <section className="py-14 sm:py-18 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Tira Dúvidas
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Perguntas frequentes de quem usa pela primeira vez
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-amber-500' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* CHAMADA FINAL AMIGÁVEL */}
      <section className="py-12 bg-slate-900 text-white transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Pronto para economizar na sua próxima obra?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Faça seu primeiro cálculo em menos de dois minutos e tenha a tranquilidade de comprar a quantidade certa.
          </p>
          <div className="pt-2">
            <button
              onClick={onGoToCalculator}
              className="px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all inline-flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Calculator className="w-4 h-4" />
              <span>Começar meu cálculo agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
