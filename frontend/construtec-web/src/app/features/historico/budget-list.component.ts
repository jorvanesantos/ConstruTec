import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ArrowLeft,
  Calculator,
  FolderOpen,
  Lock,
  LogIn,
  LucideAngularModule,
  MapPin,
  Printer,
  Search,
  Trash2
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { ObraService } from '../../core/services/obra.service';
import { UiStateService } from '../../core/services/ui-state.service';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, BrlCurrencyPipe],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="space-y-1">
          <button
            type="button"
            (click)="ui.navigateTo('home')"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
          >
            <lucide-icon [img]="ArrowLeft" class="w-4 h-4"></lucide-icon>
            Voltar ao Início
          </button>
          <h1 class="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <lucide-icon [img]="FolderOpen" class="w-7 h-7 text-amber-500"></lucide-icon>
            Meus Orçamentos Salvos
          </h1>
        </div>

        <button
          type="button"
          (click)="ui.navigateTo('calculator')"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
        >
          <lucide-icon [img]="Calculator" class="w-4 h-4"></lucide-icon>
          Novo Cálculo
        </button>
      </div>

      @if (!auth.isLoggedIn()) {
        <div class="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
            <lucide-icon [img]="Lock" class="w-7 h-7"></lucide-icon>
          </div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">Acesse sua conta para ver seus orçamentos</h3>
          <p class="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Por segurança e privacidade, os orçamentos ficam vinculados ao seu perfil. Faça login ou cadastre-se para salvar e consultar seu histórico.
          </p>
          <button
            type="button"
            (click)="ui.openAuthModal('Entre para acessar seus orçamentos salvos.')"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm cursor-pointer"
          >
            <lucide-icon [img]="LogIn" class="w-4 h-4"></lucide-icon>
            Entrar Agora
          </button>
        </div>
      } @else {
        <!-- Filtros -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <lucide-icon [img]="Search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></lucide-icon>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              placeholder="Buscar por nome da obra ou cliente..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <select
            [(ngModel)]="statusFilter"
            class="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium"
          >
            <option value="todos">Todos os Status</option>
            <option value="rascunho">Rascunho</option>
            <option value="aprovado">Aprovado</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluido">Concluído</option>
          </select>
        </div>

        @if (filteredBudgets().length === 0) {
          <div class="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
            <p class="text-base font-bold text-slate-800 dark:text-slate-100">
              Nenhum orçamento registrado ainda
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Os contadores e listas iniciam zerados até você calcular e salvar sua primeira obra real.
            </p>
            <button
              type="button"
              (click)="ui.navigateTo('calculator')"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Calcular Primeira Obra
            </button>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (budget of filteredBudgets(); track budget.id) {
              <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
                <div class="space-y-2">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <span class="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        {{ budget.workTypeName }}
                      </span>
                      <h3 class="text-base font-bold text-slate-900 dark:text-white mt-2">{{ budget.title }}</h3>
                      @if (budget.clientName) {
                        <p class="text-xs text-slate-500 dark:text-slate-400">Responsável: {{ budget.clientName }}</p>
                      }
                    </div>
                    <span class="text-lg font-extrabold text-amber-600 dark:text-amber-400 shrink-0">
                      {{ budget.calculationResult.totalEstimatedCost | brl }}
                    </span>
                  </div>

                  <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span class="inline-flex items-center gap-1">
                      <lucide-icon [img]="MapPin" class="w-3.5 h-3.5 text-amber-500"></lucide-icon>
                      {{ budget.location.city }} ({{ budget.location.uf }})
                    </span>
                    <span>Área: {{ budget.calculationResult.areaM2 || budget.calculationResult.area }} m²</span>
                    <span>{{ budget.createdAt | date: 'dd/MM/yyyy' }}</span>
                  </div>
                </div>

                <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    (click)="ui.openPrintModal(budget)"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <lucide-icon [img]="Printer" class="w-3.5 h-3.5"></lucide-icon>
                    Imprimir
                  </button>
                  <button
                    type="button"
                    (click)="remove(budget.id)"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-xs font-semibold text-red-600 dark:text-red-400 cursor-pointer"
                  >
                    <lucide-icon [img]="Trash2" class="w-3.5 h-3.5"></lucide-icon>
                    Excluir
                  </button>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `
})
export class BudgetListComponent {
  readonly ui = inject(UiStateService);
  readonly auth = inject(AuthService);
  private readonly obraService = inject(ObraService);

  searchTerm = signal('');
  statusFilter = signal('todos');

  readonly filteredBudgets = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    const st = this.statusFilter();
    return this.obraService.budgets().filter(b => {
      const matchesStatus = st === 'todos' || b.status === st;
      const matchesQuery =
        !q ||
        b.title.toLowerCase().includes(q) ||
        (b.clientName || '').toLowerCase().includes(q) ||
        b.workTypeName.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  });

  readonly ArrowLeft = ArrowLeft;
  readonly FolderOpen = FolderOpen;
  readonly Calculator = Calculator;
  readonly Lock = Lock;
  readonly LogIn = LogIn;
  readonly Search = Search;
  readonly MapPin = MapPin;
  readonly Printer = Printer;
  readonly Trash2 = Trash2;

  async remove(id: string): Promise<void> {
    await this.obraService.deleteBudget(id);
  }
}
