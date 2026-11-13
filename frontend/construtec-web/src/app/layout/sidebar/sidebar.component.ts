import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  Calculator,
  FolderOpen,
  Home,
  LayoutDashboard,
  LucideAngularModule,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  X
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { ObraService } from '../../core/services/obra.service';
import { UiStateService } from '../../core/services/ui-state.service';
import { NavTab } from '../../core/models/types';

interface NavItem {
  id: NavTab;
  label: string;
  icon: any;
  badge?: () => number | null;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  host: { class: 'block shrink-0 no-print' },
  template: `
    <!-- Overlay Mobile -->
    @if (ui.mobileSidebarOpen()) {
      <div
        class="no-print fixed inset-0 z-50 lg:hidden bg-slate-950/60 backdrop-blur-xs"
        (click)="ui.mobileSidebarOpen.set(false)"
      >
        <aside
          class="w-72 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4"
          (click)="$event.stopPropagation()"
        >
          <div class="space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span class="font-display font-bold text-lg text-slate-900 dark:text-white">
                Menu <span class="text-amber-500">ConstruTec</span>
              </span>
              <button
                type="button"
                (click)="ui.mobileSidebarOpen.set(false)"
                class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <lucide-icon [img]="X" class="w-5 h-5"></lucide-icon>
              </button>
            </div>

            <nav class="space-y-1">
              @for (item of visibleItems(); track item.id) {
                <button
                  type="button"
                  (click)="ui.navigateTo(item.id)"
                  class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                  [ngClass]="ui.activeTab() === item.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'"
                >
                  <span class="flex items-center gap-3">
                    <lucide-icon [img]="item.icon" class="w-4 h-4 shrink-0"></lucide-icon>
                    <span>{{ item.label }}</span>
                  </span>
                  @if (item.badge && item.badge() !== null) {
                    <span
                      class="text-[11px] px-2 py-0.5 rounded-full font-bold"
                      [ngClass]="ui.activeTab() === item.id
                        ? 'bg-slate-950/15 text-slate-950'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'"
                    >
                      {{ item.badge() }}
                    </span>
                  }
                </button>
              }
            </nav>
          </div>

          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <p class="font-bold text-slate-900 dark:text-white">Região Atual</p>
            <p class="mt-0.5">{{ ui.currentLocation().city }} ({{ ui.currentLocation().uf }})</p>
          </div>
        </aside>
      </div>
    }

    <!-- Rail Desktop -->
    <aside
      class="no-print hidden lg:flex flex-col justify-between sticky top-16 h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-200 shrink-0"
      [ngClass]="ui.sidebarCollapsed() ? 'w-20 p-3' : 'w-64 p-4'"
    >
      <div class="space-y-4">
        <div class="flex items-center" [ngClass]="ui.sidebarCollapsed() ? 'justify-center' : 'justify-between px-2'">
          @if (!ui.sidebarCollapsed()) {
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Navegação
            </span>
          }
          <button
            type="button"
            (click)="ui.sidebarCollapsed.set(!ui.sidebarCollapsed())"
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            [title]="ui.sidebarCollapsed() ? 'Expandir barra lateral' : 'Recolher barra lateral'"
          >
            <lucide-icon [img]="ui.sidebarCollapsed() ? PanelLeftOpen : PanelLeftClose" class="w-4 h-4"></lucide-icon>
          </button>
        </div>

        <nav class="space-y-1.5">
          @for (item of visibleItems(); track item.id) {
            <button
              type="button"
              (click)="ui.navigateTo(item.id)"
              [title]="ui.sidebarCollapsed() ? item.label : ''"
              class="w-full flex items-center rounded-xl text-sm font-semibold transition-all cursor-pointer"
              [ngClass]="[
                ui.sidebarCollapsed() ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5',
                ui.activeTab() === item.id
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              ]"
            >
              <span class="flex items-center gap-3">
                <lucide-icon [img]="item.icon" class="w-4 h-4 shrink-0"></lucide-icon>
                @if (!ui.sidebarCollapsed()) {
                  <span>{{ item.label }}</span>
                }
              </span>
              @if (!ui.sidebarCollapsed() && item.badge && item.badge() !== null) {
                <span
                  class="text-[11px] px-2 py-0.5 rounded-full font-bold"
                  [ngClass]="ui.activeTab() === item.id
                    ? 'bg-slate-950/15 text-slate-950'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'"
                >
                  {{ item.badge() }}
                </span>
              }
            </button>
          }
        </nav>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  readonly ui = inject(UiStateService);
  readonly auth = inject(AuthService);
  private readonly obraService = inject(ObraService);

  readonly X = X;
  readonly PanelLeftClose = PanelLeftClose;
  readonly PanelLeftOpen = PanelLeftOpen;

  private readonly navItems: NavItem[] = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'calculator', label: 'Calculadora', icon: Calculator },
    {
      id: 'budgets',
      label: 'Meus Orçamentos',
      icon: FolderOpen,
      badge: () => {
        const count = this.obraService.budgets().length;
        return count > 0 ? count : null;
      }
    },
    { id: 'materials', label: 'Catálogo SINAPI', icon: Package },
    { id: 'dashboard', label: 'Resumo Geral', icon: LayoutDashboard },
    { id: 'admin', label: 'Painel Admin', icon: ShieldCheck, adminOnly: true }
  ];

  visibleItems(): NavItem[] {
    const showAdmin = this.auth.isAdmin() && !this.ui.isUserTestMode();
    return this.navItems.filter(item => !item.adminOnly || showAdmin);
  }
}
