import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  Anchor,
  ArrowRight,
  ArrowUpRight,
  Box,
  BrickWall,
  Calculator,
  CheckCircle2,
  ChevronDown,
  Grid3x3,
  HelpCircle,
  Home,
  Layers,
  LucideAngularModule,
  MapPin,
  Package,
  Paintbrush,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wrench
} from 'lucide-angular';
import { MaterialService } from '../../core/services/material.service';
import { UiStateService } from '../../core/services/ui-state.service';
import { WorkTypeKey } from '../../core/models/types';

interface BenefitItem {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  badge: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      <!-- HERO SECTION -->
      <section class="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 lg:p-12">
          <div class="lg:col-span-7 space-y-6">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold">
              <lucide-icon [img]="Sparkles" class="w-3.5 h-3.5"></lucide-icon>
              <span>Planejamento de Obra com Precisão Técnica</span>
            </div>

            <h1 class="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Calcule cada material da sua obra sem erro e sem desperdício.
            </h1>

            <p class="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Informe as medidas do ambiente ou estrutura e receba automaticamente a lista de compras em embalagens comerciais, com margem técnica de perda e referência de preços SINAPI para o seu estado.
            </p>

            <div class="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                type="button"
                (click)="ui.navigateTo('calculator')"
                class="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <lucide-icon [img]="Calculator" class="w-5 h-5"></lucide-icon>
                <span>Iniciar Novo Cálculo</span>
                <lucide-icon [img]="ArrowRight" class="w-4 h-4"></lucide-icon>
              </button>

              <button
                type="button"
                (click)="ui.navigateTo('materials')"
                class="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <lucide-icon [img]="Package" class="w-4 h-4 text-amber-500"></lucide-icon>
                <span>Ver Catálogo SINAPI ({{ ui.currentLocation().uf }})</span>
              </button>
            </div>

            <div class="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span class="inline-flex items-center gap-1.5">
                <lucide-icon [img]="CheckCircle2" class="w-4 h-4 text-emerald-500"></lucide-icon>
                9 tipos completos de serviços
              </span>
              <span class="inline-flex items-center gap-1.5">
                <lucide-icon [img]="MapPin" class="w-4 h-4 text-amber-500"></lucide-icon>
                Tabela regional ajustada ({{ ui.currentLocation().stateName }})
              </span>
              <span class="inline-flex items-center gap-1.5">
                <lucide-icon [img]="ShieldCheck" class="w-4 h-4 text-sky-500"></lucide-icon>
                Relatório pronto para imprimir
              </span>
            </div>
          </div>

          <div class="lg:col-span-5">
            <div class="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg bg-slate-100 dark:bg-slate-800">
              <img
                src="/assets/images/hero_benefits_showcase_1793825285870.jpg"
                alt="Planejamento e quantitativo de materiais ConstruTec"
                class="w-full h-72 sm:h-80 lg:h-96 object-cover"
              />
              <div class="p-4 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <p class="text-xs font-bold text-slate-900 dark:text-white">Orçamentação Inteligente</p>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400">Da medição em metros à lista exata de compras</p>
                </div>
                <span class="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-bold shrink-0">
                  NBR & SINAPI
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- BENEFÍCIOS VISUAIS DO PROJETO -->
      <section class="space-y-6">
        <div class="max-w-2xl">
          <span class="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Por que usar o ConstruTec?
          </span>
          <h2 class="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Benefícios reais para quem constrói ou reforma
          </h2>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Evite paradas na obra por falta de cimento ou compras exageradas no depósito com cálculos transparentes passo a passo.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          @for (item of benefits; track item.title) {
            <article class="group rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col">
              <div class="h-48 overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                <img
                  [src]="item.image"
                  [alt]="item.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span class="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/75 text-white text-[11px] font-bold backdrop-blur-xs">
                  {{ item.badge }}
                </span>
              </div>
              <div class="p-5 space-y-2 flex-1 flex flex-col">
                <span class="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {{ item.subtitle }}
                </span>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">
                  {{ item.title }}
                </h3>
                <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {{ item.description }}
                </p>
              </div>
            </article>
          }
        </div>
      </section>

      <!-- COMO FUNCIONA EM 3 PASSOS -->
      <section class="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 space-y-8">
        <div class="text-center max-w-2xl mx-auto space-y-2">
          <span class="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Guia Rápido para Primeira Visita
          </span>
          <h2 class="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Como funciona em 3 passos simples
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
            <div class="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-sm flex items-center justify-center">
              1
            </div>
            <h3 class="font-bold text-slate-900 dark:text-white">Escolha o tipo de serviço</h3>
            <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Selecione entre Muro, Parede, Piso, Pintura, Concreto, Fundação, Telhado, Revestimento ou Reforma Geral.
            </p>
          </div>

          <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
            <div class="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-sm flex items-center justify-center">
              2
            </div>
            <h3 class="font-bold text-slate-900 dark:text-white">Preencha as medidas reais</h3>
            <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Informe comprimento, altura, largura e vãos de portas ou janelas. Ajuste a margem de segurança (%) se desejar.
            </p>
          </div>

          <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
            <div class="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-sm flex items-center justify-center">
              3
            </div>
            <h3 class="font-bold text-slate-900 dark:text-white">Salve ou imprima a lista</h3>
            <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Receba a relação exata em sacos, caixas, barras e metros cúbicos para cotar direto na loja de materiais.
            </p>
          </div>
        </div>
      </section>

      <!-- GRADE DOS 9 TIPOS DE OBRA -->
      <section class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Módulos de Cálculo
            </span>
            <h2 class="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              O que você deseja calcular hoje?
            </h2>
          </div>
          <button
            type="button"
            (click)="ui.navigateTo('calculator')"
            class="text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            Abrir calculadora completa
            <lucide-icon [img]="ArrowUpRight" class="w-4 h-4"></lucide-icon>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (wt of workTypes; track wt.id) {
            <button
              type="button"
              (click)="selectWorkType(wt.id)"
              class="group text-left p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors shrink-0">
                  <lucide-icon [img]="getIcon(wt.icon)" class="w-5 h-5"></lucide-icon>
                </div>
                <span class="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {{ wt.category }}
                </span>
              </div>

              <div>
                <h3 class="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {{ wt.name }}
                </h3>
                <p class="text-xs font-medium text-amber-600 dark:text-amber-400 mt-0.5">{{ wt.tagline }}</p>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {{ wt.description }}
                </p>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Perda técnica padrão: {{ wt.defaultWaste }}%</span>
                <span class="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                  Calcular <lucide-icon [img]="ArrowRight" class="w-3.5 h-3.5"></lucide-icon>
                </span>
              </div>
            </button>
          }
        </div>
      </section>

      <!-- FAQ RÁPIDO -->
      <section class="max-w-4xl mx-auto space-y-5">
        <div class="text-center space-y-2">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <lucide-icon [img]="HelpCircle" class="w-4 h-4"></lucide-icon>
            <span>Dúvidas Frequentes</span>
          </div>
          <h2 class="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Perguntas comuns de quem está começando
          </h2>
        </div>

        <div class="space-y-3">
          @for (faq of faqs; track faq.question; let idx = $index) {
            <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
              <button
                type="button"
                (click)="toggleFaq(idx)"
                class="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <span>{{ faq.question }}</span>
                <lucide-icon
                  [img]="ChevronDown"
                  class="w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0"
                  [ngClass]="openFaqIndex() === idx ? 'rotate-180 text-amber-500' : ''"
                ></lucide-icon>
              </button>
              @if (openFaqIndex() === idx) {
                <div class="px-5 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                  {{ faq.answer }}
                </div>
              }
            </div>
          }
        </div>
      </section>
    </div>
  `
})
export class HomeComponent {
  readonly ui = inject(UiStateService);
  private readonly materialService = inject(MaterialService);

  readonly workTypes = this.materialService.getStaticWorkTypes();
  readonly openFaqIndex = signal<number | null>(0);

  readonly Sparkles = Sparkles;
  readonly Calculator = Calculator;
  readonly ArrowRight = ArrowRight;
  readonly ArrowUpRight = ArrowUpRight;
  readonly Package = Package;
  readonly CheckCircle2 = CheckCircle2;
  readonly MapPin = MapPin;
  readonly ShieldCheck = ShieldCheck;
  readonly HelpCircle = HelpCircle;
  readonly ChevronDown = ChevronDown;

  readonly benefits: BenefitItem[] = [
    {
      badge: 'Compra Certa',
      subtitle: 'Conversão Automática',
      title: 'Embalagens Comerciais Exatas',
      description: 'Nada de medidas soltas difíceis de comprar: o sistema converte volumes e áreas em sacos fechados, caixas e barras de 12m.',
      image: '/assets/images/benefit_commercial_packaging_1793825297247.jpg'
    },
    {
      badge: 'Menos Desperdício',
      subtitle: 'Orçamento Inteligente',
      title: 'Economia e Controle de Perdas',
      description: 'Ajuste a margem técnica para recortes e quebras conforme a etapa da obra, evitando sobras paradas ou viagens extras ao depósito.',
      image: '/assets/images/benefit_cost_savings_1793825309370.jpg'
    },
    {
      badge: 'Pronto para Obra',
      subtitle: 'Gestão Profissional',
      title: 'Orçamento Pronto para Compras',
      description: 'Salve múltiplos projetos na sua conta e imprima relatórios limpos com fórmulas e valores regionais atualizados.',
      image: '/assets/images/benefit_print_report_1793825321718.jpg'
    }
  ];

  readonly faqs: FaqItem[] = [
    {
      question: 'Preciso estar logado para fazer cálculos na plataforma?',
      answer: 'Sim! Para realizar cálculos de materiais, gerar orçamentos e salvar seus projetos no histórico com segurança, é necessário entrar na sua conta ou fazer um cadastro rápido.'
    },
    {
      question: 'Como os preços dos materiais são calculados para a minha região?',
      answer: 'Utilizamos uma base de preços de referência ajustada pelos multiplicadores estaduais inspirados no SINAPI. Você pode trocar seu estado a qualquer momento clicando na sigla UF no topo da tela.'
    },
    {
      question: 'O que significa a margem de desperdício (%)?',
      answer: 'Na construção civil sempre ocorrem perdas por recortes de pisos, quebras de blocos ou sobras de argamassa. Recomendamos manter o padrão entre 8% e 12% conforme o tipo de obra.'
    }
  ];

  getIcon(iconName: string): any {
    const map: Record<string, any> = {
      ShieldAlert,
      BrickWall,
      Grid3x3,
      Paintbrush,
      Box,
      Anchor,
      Home,
      Layers,
      Wrench
    };
    return map[iconName] || Wrench;
  }

  selectWorkType(id: WorkTypeKey): void {
    this.ui.navigateTo('calculator', id);
  }

  toggleFaq(idx: number): void {
    this.openFaqIndex.update(cur => (cur === idx ? null : idx));
  }
}
