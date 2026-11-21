import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LucideAngularModule, Printer, TriangleAlert, X } from 'lucide-angular';
import { UiStateService } from '../../core/services/ui-state.service';
import { budgetCalculations, budgetTotal } from '../../core/models/budget-calculations';
import { CalculationResult } from '../../core/models/types';
import { BrlCurrencyPipe } from '../pipes/brl-currency.pipe';

@Component({
  selector: 'app-print-budget-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BrlCurrencyPipe],
  template: `
    @if (ui.printModalData(); as budget) {
      <div class="budget-print-overlay fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm overflow-y-auto p-2 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="budget-details-title" (keydown.escape)="ui.closePrintModal()">
        <div class="budget-print-sheet max-w-4xl mx-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <!-- Barra de ações (não impressa) -->
          <div class="no-print sticky top-0 z-10 px-4 sm:px-6 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 id="budget-details-title" class="text-sm font-bold text-slate-900 dark:text-white">Detalhes do orçamento</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Confira os cálculos ou imprima o relatório</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="printPage()"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer"
              >
                <lucide-icon [img]="Printer" class="w-4 h-4"></lucide-icon>
                Imprimir / Salvar PDF
              </button>
              <button
                type="button"
                (click)="ui.closePrintModal()"
                aria-label="Fechar detalhes do orçamento"
                class="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <lucide-icon [img]="X" class="w-4 h-4"></lucide-icon>
              </button>
            </div>
          </div>

          <!-- Folha do Orçamento -->
          <div class="p-4 sm:p-8 space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-6">
              <div>
                <div class="flex items-center gap-2 text-amber-600 font-extrabold text-xl">
                  <span class="print-brand">ConstruTec</span>
                  <span class="print-badge text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Orçamento Técnico
                  </span>
                </div>
                <h1 class="text-2xl font-bold text-slate-900 dark:text-white mt-2">{{ budget.title }}</h1>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Categoria: <strong>{{ budget.workTypeName }}</strong>
                  @if (budget.clientName) { · Cliente/Responsável: <strong>{{ budget.clientName }}</strong> }
                </p>
              </div>
              <div class="text-sm text-slate-600 dark:text-slate-300 sm:text-right space-y-1">
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Data: {{ budget.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                </p>
              </div>
            </div>

            @if (budget.notes) {
              <p class="text-sm"><strong>Observações:</strong> {{ budget.notes }}</p>
            }
            <div class="print-total p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <span class="text-sm font-bold">Total do orçamento:</span>
              <strong class="text-lg font-extrabold text-amber-600 dark:text-amber-400">{{ total(budget) | brl }}</strong>
            </div>
            @for (calculation of calculations(budget); track $index) {
            <h2 class="print-section-title text-lg font-bold">{{ calculation.workTypeName }} — Cálculo {{ $index + 1 }}</h2>
            @if (inputs(calculation).length) {
              <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 card-print">
                <h3 class="text-xs font-bold uppercase tracking-wider mb-2">Dados informados</h3>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  @for (input of inputs(calculation); track input[0]) {
                    <div><dt class="inline font-semibold">{{ input[0] }}:</dt> <dd class="inline">{{ input[1] }}</dd></div>
                  }
                </dl>
              </div>
            }
            <!-- Resumo numérico -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 card-print">
                <span class="text-xs text-slate-500 dark:text-slate-400 block">Área Calculada</span>
                <strong class="text-lg font-bold text-slate-900 dark:text-white">
                  {{ (calculation.areaM2 || calculation.area || 0) }} m²
                </strong>
              </div>
              <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 card-print">
                <span class="text-xs text-slate-500 dark:text-slate-400 block">Margem de Perda</span>
                <strong class="text-lg font-bold text-slate-900 dark:text-white">
                  {{ calculation.wastePercentage }}%
                </strong>
              </div>
              <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 card-print">
                <span class="text-xs text-slate-500 dark:text-slate-400 block">Itens Levantados</span>
                <strong class="text-lg font-bold text-slate-900 dark:text-white">
                  {{ calculation.materials.length }} materiais
                </strong>
              </div>
              <div class="print-total p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 card-print">
                <span class="text-xs text-amber-700 dark:text-amber-300 block font-semibold">Total Estimado</span>
                <strong class="text-lg font-extrabold text-amber-600 dark:text-amber-400">
                  {{ calculation.totalEstimatedCost | brl }}
                </strong>
              </div>
            </div>
            @if (calculation.volumeM3 ?? calculation.volume; as volume) {
              <p class="text-sm"><strong>Volume:</strong> {{ volume }} m³</p>
            }
            @if (calculation.perimeter) {
              <p class="text-sm"><strong>Perímetro:</strong> {{ calculation.perimeter }} m</p>
            }

            <!-- Tabela de materiais -->
            <div class="sm:hidden print:hidden space-y-3">
              @for (mat of calculation.materials; track mat.id) {
                <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <p class="font-bold">{{ mat.name }}</p>
                  @if (mat.purpose) { <p class="text-xs text-slate-500 dark:text-slate-400">{{ mat.purpose }}</p> }
                  @if (mat.commercialPackageDescription) { <p class="text-xs text-slate-500 dark:text-slate-400">{{ mat.commercialPackageDescription }}</p> }
                  <dl class="grid grid-cols-2 gap-2 text-xs">
                    <div><dt>Qtd. técnica</dt><dd class="font-semibold">{{ mat.theoreticalQuantity ?? mat.quantityRaw }}</dd></div>
                    <div><dt>Qtd. comercial</dt><dd class="font-semibold">{{ mat.commercialQuantity ?? mat.quantityCommercial }} {{ mat.unit }}</dd></div>
                    <div><dt>Preço unitário</dt><dd class="font-semibold">{{ mat.unitPrice | brl }}</dd></div>
                    <div><dt>Subtotal</dt><dd class="font-bold">{{ mat.totalPrice | brl }}</dd></div>
                  </dl>
                </div>
              }
            </div>
            <div class="hidden sm:block print:block overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl card-print">
              <table class="w-full text-left border-collapse text-sm">
                <thead>
                  <tr class="print-table-header bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs uppercase">
                    <th class="py-3 px-4 font-bold">Material / Insumo</th>
                    <th class="py-3 px-4 font-bold text-right">Qtd. Técnica</th>
                    <th class="py-3 px-4 font-bold text-right">Qtd. Comercial</th>
                    <th class="py-3 px-4 font-bold text-right">Preço Unit.</th>
                    <th class="py-3 px-4 font-bold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
                  @for (mat of calculation.materials; track mat.id) {
                    <tr>
                      <td class="py-3 px-4">
                        <p class="font-semibold text-slate-900 dark:text-white">{{ mat.name }}</p>
                        @if (mat.purpose) {
                          <p class="text-xs text-slate-500 dark:text-slate-400">{{ mat.purpose }}</p>
                        }
                        @if (mat.commercialPackageDescription) {
                          <p class="text-xs text-slate-500 dark:text-slate-400">{{ mat.commercialPackageDescription }}</p>
                        }
                      </td>
                      <td class="py-3 px-4 text-right font-mono text-xs text-slate-600 dark:text-slate-300">
                        {{ mat.theoreticalQuantity ?? mat.quantityRaw }}
                      </td>
                      <td class="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {{ mat.commercialQuantity ?? mat.quantityCommercial }} {{ mat.unit }}
                      </td>
                      <td class="py-3 px-4 text-right text-slate-700 dark:text-slate-300">
                        {{ mat.unitPrice | brl }}
                      </td>
                      <td class="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {{ mat.totalPrice | brl }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Premissas e Fórmulas -->
            @if (calculation.formulasUsed.length > 0) {
              <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2 card-print">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Memória de Cálculo</h4>
                <ul class="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc pl-4">
                  @for (f of calculation.formulasUsed; track f) {
                    <li>{{ f }}</li>
                  }
                </ul>
              </div>
            }

            @if (calculation.technicalPremises?.length) {
              <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2 card-print">
                <h4 class="text-xs font-bold uppercase tracking-wider">Premissas técnicas</h4>
                <ul class="text-xs space-y-1 list-disc pl-4">
                  @for (premise of calculation.technicalPremises; track $index) { <li>{{ premise }}</li> }
                </ul>
              </div>
            }

            <div class="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <lucide-icon [img]="TriangleAlert" class="w-4 h-4 shrink-0 text-amber-600 mt-0.5"></lucide-icon>
              <div class="space-y-1">
                <p>{{ calculation.technicalWarning }}</p>
                <p class="opacity-85">{{ calculation.priceDisclaimer }}</p>
              </div>
            </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class PrintBudgetModalComponent {
  readonly ui = inject(UiStateService);
  readonly calculations = budgetCalculations;
  readonly total = budgetTotal;

  readonly Printer = Printer;
  readonly X = X;
  readonly TriangleAlert = TriangleAlert;

  inputs(calculation: CalculationResult): [string, string | number][] {
    return Object.entries(calculation.inputSummary || {}).filter(([key]) =>
      !/regi[aã]o|localiza[cç][aã]o|cidade|estado|\buf\b/i.test(key)
    );
  }

  printPage(): void {
    window.print();
  }
}
