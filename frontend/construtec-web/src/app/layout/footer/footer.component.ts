import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { UiStateService } from '../../core/services/ui-state.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="no-print mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 sm:px-8">
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-800 dark:text-slate-200">ConstruTec</span>
          <span>·</span>
          <span>Engenharia & Quantitativo de Obras</span>
        </div>
        <div class="flex flex-wrap items-center gap-4">
          <button type="button" (click)="ui.navigateTo('calculator')" class="hover:text-amber-500 transition-colors cursor-pointer">
            Calculadora
          </button>
          <button type="button" (click)="ui.navigateTo('materials')" class="hover:text-amber-500 transition-colors cursor-pointer">
            Catálogo SINAPI
          </button>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {
  readonly ui = inject(UiStateService);
}
