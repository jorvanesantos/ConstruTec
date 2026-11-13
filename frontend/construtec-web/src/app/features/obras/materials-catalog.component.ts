import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ArrowLeft, LucideAngularModule, MapPin, Package, Search } from 'lucide-angular';
import { MaterialService } from '../../core/services/material.service';
import { UiStateService } from '../../core/services/ui-state.service';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';

@Component({
  selector: 'app-materials-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, BrlCurrencyPipe],
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
            <lucide-icon [img]="Package" class="w-7 h-7 text-amber-500"></lucide-icon>
            Catálogo de Materiais e Preços SINAPI
          </h1>
        </div>

        <button
          type="button"
          (click)="ui.locationModalOpen.set(true)"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-amber-500 cursor-pointer"
        >
          <lucide-icon [img]="MapPin" class="w-4 h-4 text-amber-500"></lucide-icon>
          <span>{{ ui.currentLocation().stateName }} ({{ ui.currentLocation().priceMultiplier.toFixed(2) }}x)</span>
        </button>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <lucide-icon [img]="Search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></lucide-icon>
          <input
            type="text"
            [(ngModel)]="searchTerm"
            placeholder="Filtrar insumo por nome ou aplicação..."
            class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          />
        </div>
        <select
          [(ngModel)]="selectedCategory"
          class="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium"
        >
          <option value="todas">Todas as Categorias</option>
          @for (cat of categories; track cat) {
            <option [value]="cat">{{ cat }}</option>
          }
        </select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (item of filteredMaterials(); track item.id) {
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4">
            <div class="space-y-2">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {{ item.category }}
                </span>
                <span class="text-xs font-mono text-slate-400">{{ item.commercialUnit }}</span>
              </div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white leading-snug">{{ item.name }}</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{{ item.description }}</p>
            </div>

            <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
              <span class="text-xs text-slate-500 dark:text-slate-400">Estimativa {{ ui.currentLocation().uf }}:</span>
              <span class="text-base font-extrabold text-amber-600 dark:text-amber-400">
                {{ getAdjustedPrice(item.basePrice) | brl }}
                <span class="text-[11px] font-normal text-slate-500">/{{ item.baseUnit }}</span>
              </span>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class MaterialsCatalogComponent {
  readonly ui = inject(UiStateService);
  private readonly materialService = inject(MaterialService);

  private readonly allItems = this.materialService.getStaticMaterials();
  readonly categories = Array.from(new Set(this.allItems.map(i => i.category)));

  searchTerm = signal('');
  selectedCategory = signal('todas');

  readonly filteredMaterials = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    const cat = this.selectedCategory();
    return this.allItems.filter(item => {
      const matchCat = cat === 'todas' || item.category === cat;
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  });

  readonly ArrowLeft = ArrowLeft;
  readonly Package = Package;
  readonly MapPin = MapPin;
  readonly Search = Search;

  getAdjustedPrice(basePrice: number): number {
    return Math.round(basePrice * this.ui.currentLocation().priceMultiplier * 100) / 100;
  }
}
