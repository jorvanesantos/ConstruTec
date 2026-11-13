import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  FolderOpen,
  LayoutDashboard,
  LucideAngularModule,
  MapPin,
  Package
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { ObraService } from '../../core/services/obra.service';
import { UiStateService } from '../../core/services/ui-state.service';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BrlCurrencyPipe],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="space-y-1">
          <button
            type="button"
            (click)="ui.navigateTo('home')"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-amber-600 cursor-pointer"
          >
            <lucide-icon [img]="ArrowLeft" class="w-4 h-4"></lucide-icon>
            Voltar ao Início
          </button>
          <h1 class="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <lucide-icon [img]="LayoutDashboard" class="w-7 h-7 text-amber-500"></lucide-icon>
            Painel de Obras e Resumo
          </h1>
        </div>

        <button
          type="button"
          (click)="ui.navigateTo('calculator')"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer"
        >
          <lucide-icon [img]="Calculator" class="w-4 h-4"></lucide-icon>
          Calcular Nova Obra
        </button>
      </div>

      <!-- KPIs Reais -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Obras Salvas</span>
          <p class="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{{ totalBudgets() }}</p>
        </div>
        <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Orçado Acumulado</span>
          <p class="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{{ totalValue() | brl }}</p>
        </div>
        <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Tabela Regional Ativa</span>
          <p class="text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
            <lucide-icon [img]="MapPin" class="w-4 h-4 text-amber-500"></lucide-icon>
            {{ ui.currentLocation().stateName }} ({{ ui.currentLocation().uf }})
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-slate-900 dark:text-white">Orçamentos Recentes</h2>
            <button
              type="button"
              (click)="ui.navigateTo('budgets')"
              class="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Ver todos →
            </button>
          </div>

          @if (!auth.isLoggedIn() || totalBudgets() === 0) {
            <div class="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center space-y-2">
              <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {{ auth.isLoggedIn() ? 'Nenhuma obra lançada até o momento' : 'Faça login para acompanhar seu histórico' }}
              </p>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Os indicadores são atualizados automaticamente conforme você calcula e salva suas obras.
              </p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (item of recentBudgets(); track item.id) {
                <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                  <div>
                    <p class="text-sm font-bold text-slate-900 dark:text-white">{{ item.title }}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                      {{ item.workTypeName }} · {{ item.location.uf }} · {{ item.createdAt | date: 'dd/MM/yyyy' }}
                    </p>
                  </div>
                  <span class="font-extrabold text-sm text-amber-600 dark:text-amber-400 shrink-0">
                    {{ item.calculationResult.totalEstimatedCost | brl }}
                  </span>
                </div>
              }
            </div>
          }
        </div>

        <div class="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 class="text-base font-bold text-slate-900 dark:text-white">Atalhos Rápidos</h2>
          <button
            type="button"
            (click)="ui.navigateTo('calculator', 'muro')"
            class="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-500/10 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            <span>Calcular Muro / Alvenaria</span>
            <lucide-icon [img]="ArrowRight" class="w-4 h-4 text-amber-500"></lucide-icon>
          </button>
          <button
            type="button"
            (click)="ui.navigateTo('calculator', 'piso')"
            class="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-500/10 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            <span>Calcular Piso / Porcelanato</span>
            <lucide-icon [img]="ArrowRight" class="w-4 h-4 text-amber-500"></lucide-icon>
          </button>
          <button
            type="button"
            (click)="ui.navigateTo('materials')"
            class="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-500/10 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            <span class="flex items-center gap-2">
              <lucide-icon [img]="Package" class="w-4 h-4 text-amber-500"></lucide-icon>
              Consultar Catálogo de Insumos
            </span>
            <lucide-icon [img]="ArrowRight" class="w-4 h-4 text-amber-500"></lucide-icon>
          </button>
          <button
            type="button"
            (click)="ui.navigateTo('budgets')"
            class="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-500/10 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            <span class="flex items-center gap-2">
              <lucide-icon [img]="FolderOpen" class="w-4 h-4 text-amber-500"></lucide-icon>
              Abrir Histórico Salvo
            </span>
            <lucide-icon [img]="ArrowRight" class="w-4 h-4 text-amber-500"></lucide-icon>
          </button>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  readonly ui = inject(UiStateService);
  readonly auth = inject(AuthService);
  private readonly obraService = inject(ObraService);

  readonly totalBudgets = computed(() => this.obraService.budgets().length);
  readonly totalValue = computed(() =>
    this.obraService.budgets().reduce((sum, b) => sum + Number(b.calculationResult?.totalEstimatedCost || 0), 0)
  );
  readonly recentBudgets = computed(() => this.obraService.budgets().slice(0, 5));

  readonly ArrowLeft = ArrowLeft;
  readonly LayoutDashboard = LayoutDashboard;
  readonly Calculator = Calculator;
  readonly MapPin = MapPin;
  readonly ArrowRight = ArrowRight;
  readonly Package = Package;
  readonly FolderOpen = FolderOpen;
}
