import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  Check,
  Compass,
  LucideAngularModule,
  MapPin,
  Navigation,
  X
} from 'lucide-angular';
import { REGIONAL_LOCATIONS } from '../../core/models/catalog';
import { RegionalLocation } from '../../core/models/types';
import { UiStateService } from '../../core/services/ui-state.service';

@Component({
  selector: 'app-regional-location-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (ui.locationModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
        <div class="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col">
          <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <lucide-icon [img]="MapPin" class="w-5 h-5"></lucide-icon>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Base de Preços Regionais (SINAPI)</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Selecione o estado da obra para calibrar automaticamente os custos dos materiais
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="ui.locationModalOpen.set(false)"
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <lucide-icon [img]="X" class="w-5 h-5"></lucide-icon>
            </button>
          </div>

          <div class="p-6 overflow-y-auto space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <div class="flex items-center gap-3">
                <lucide-icon [img]="Compass" class="w-5 h-5 text-amber-500 shrink-0"></lucide-icon>
                <div>
                  <p class="text-xs font-bold text-slate-800 dark:text-slate-100">Detectar Região Automaticamente</p>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400">Usa geolocalização ou rede para localizar sua UF</p>
                </div>
              </div>
              <button
                type="button"
                (click)="detectLocation()"
                [disabled]="ui.detectingLocation()"
                class="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition-colors cursor-pointer shrink-0 disabled:opacity-60"
              >
                <lucide-icon [img]="Navigation" class="w-3.5 h-3.5"></lucide-icon>
                {{ ui.detectingLocation() ? 'Localizando...' : 'Detectar Agora' }}
              </button>
            </div>

            @if (statusMessage()) {
              <p class="text-xs text-amber-600 dark:text-amber-400 font-medium px-1">{{ statusMessage() }}</p>
            }

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              @for (loc of locations; track loc.uf) {
                <button
                  type="button"
                  (click)="select(loc)"
                  class="flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer"
                  [ngClass]="ui.currentLocation().uf === loc.uf
                    ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 ring-1 ring-amber-500'
                    : 'border-slate-200 dark:border-slate-700 hover:border-amber-400 bg-white dark:bg-slate-800'"
                >
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-extrabold text-amber-600 dark:text-amber-400">{{ loc.uf }}</span>
                      <span class="text-xs font-semibold text-slate-800 dark:text-slate-100">{{ loc.stateName }}</span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[140px]">{{ loc.city }}</p>
                    <p class="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                      Fator: {{ loc.priceMultiplier.toFixed(2) }}x
                    </p>
                  </div>
                  @if (ui.currentLocation().uf === loc.uf) {
                    <lucide-icon [img]="Check" class="w-4 h-4 text-amber-500 shrink-0"></lucide-icon>
                  }
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class RegionalLocationModalComponent {
  readonly ui = inject(UiStateService);
  readonly locations = REGIONAL_LOCATIONS;
  readonly statusMessage = signal('');

  readonly MapPin = MapPin;
  readonly Compass = Compass;
  readonly Navigation = Navigation;
  readonly Check = Check;
  readonly X = X;

  select(loc: RegionalLocation): void {
    this.ui.setLocation(loc, true);
    this.ui.locationModalOpen.set(false);
  }

  async detectLocation(): Promise<void> {
    this.statusMessage.set('Consultando localização automática...');
    const res = await this.ui.detectRegionAutomatically({ force: true, allowPrompt: true });
    this.statusMessage.set(res.message);
  }
}
