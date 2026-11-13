import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  Camera,
  ChevronDown,
  Eye,
  KeyRound,
  LogIn,
  LogOut,
  LucideAngularModule,
  MapPin,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  User as UserIcon
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { ObraService } from '../../core/services/obra.service';
import { UiStateService } from '../../core/services/ui-state.service';
import { ConstruTecLogoComponent } from '../../shared/components/constru-tec-logo.component';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ConstruTecLogoComponent, ClickOutsideDirective],
  host: { class: 'block no-print' },
  template: `
    <header class="no-print fixed top-0 left-0 right-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <!-- Esquerda: Botão Menu + Logo -->
        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="ui.mobileSidebarOpen.set(true)"
            class="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Abrir menu"
          >
            <lucide-icon [img]="Menu" class="w-5 h-5"></lucide-icon>
          </button>

          <button
            type="button"
            (click)="ui.navigateTo('home')"
            class="text-left focus:outline-none cursor-pointer"
          >
            <app-construtec-logo sizeClass="w-9 h-9" [showText]="true"></app-construtec-logo>
          </button>
        </div>

        <!-- Direita: Localização SINAPI, Tema Claro/Escuro, Usuário -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Seletor Regional -->
          <button
            type="button"
            (click)="ui.locationModalOpen.set(true)"
            class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Alterar tabela de preços regional SINAPI"
          >
            <lucide-icon [img]="MapPin" class="w-3.5 h-3.5 text-amber-500" [ngClass]="ui.detectingLocation() ? 'animate-pulse' : ''"></lucide-icon>
            @if (ui.detectingLocation()) {
              <span>Localizando...</span>
            } @else {
              <span>{{ ui.currentLocation().uf }}</span>
              <span class="hidden md:inline text-slate-500 dark:text-slate-400 font-normal">
                ({{ ui.currentLocation().priceMultiplier.toFixed(2) }}x)
              </span>
            }
          </button>

          <!-- Botão único de alternância Claro / Escuro -->
          <button
            type="button"
            (click)="ui.toggleTheme()"
            class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            [title]="ui.isDark() ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'"
            aria-label="Alternar tema"
          >
            <lucide-icon [img]="ui.isDark() ? Sun : Moon" class="w-4 h-4 text-amber-500"></lucide-icon>
          </button>

          <!-- Área do Usuário -->
          @if (!auth.isLoggedIn()) {
            <button
              type="button"
              (click)="ui.openAuthModal()"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
            >
              <lucide-icon [img]="LogIn" class="w-4 h-4"></lucide-icon>
              <span>Entrar</span>
            </button>
          } @else {
            @if (auth.currentUser(); as user) {
              <div class="relative" (appClickOutside)="dropdownOpen.set(false)">
                <button
                  type="button"
                  (click)="dropdownOpen.set(!dropdownOpen())"
                  class="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  <span
                    (click)="openAvatarModalFromBadge($event)"
                    class="relative group/avatar w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center shrink-0 overflow-hidden cursor-pointer ring-1 ring-amber-400/50"
                    [title]="user.avatarUrl ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'"
                  >
                    @if (user.avatarUrl) {
                      <img
                        [src]="user.avatarUrl"
                        [alt]="user.name"
                        class="w-full h-full object-cover"
                        referrerpolicy="no-referrer"
                      />
                    } @else {
                      <span>{{ user.name.charAt(0).toUpperCase() }}</span>
                    }
                    <span class="absolute inset-0 bg-slate-950/55 text-white opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                      <lucide-icon [img]="Camera" class="w-3.5 h-3.5"></lucide-icon>
                    </span>
                  </span>
                  <div class="hidden sm:flex flex-col items-start leading-tight">
                    <span class="text-xs font-bold text-slate-900 dark:text-white max-w-[120px] truncate">
                      {{ user.name }}
                    </span>
                    <span class="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      {{ ui.isUserTestMode() ? 'Modo Usuário' : auth.getRoleLabel(user) }}
                    </span>
                  </div>
                  <lucide-icon [img]="ChevronDown" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400"></lucide-icon>
                </button>

                @if (dropdownOpen()) {
                  <div class="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-50">
                    <div class="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                      <button
                        type="button"
                        (click)="openAvatarModal()"
                        class="relative group/ddavatar w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-sm flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                        [title]="user.avatarUrl ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'"
                      >
                        @if (user.avatarUrl) {
                          <img
                            [src]="user.avatarUrl"
                            [alt]="user.name"
                            class="w-full h-full object-cover"
                            referrerpolicy="no-referrer"
                          />
                        } @else {
                          <span>{{ user.name.charAt(0).toUpperCase() }}</span>
                        }
                        <span class="absolute inset-0 bg-slate-950/55 text-white opacity-0 group-hover/ddavatar:opacity-100 flex items-center justify-center transition-opacity">
                          <lucide-icon [img]="Camera" class="w-4 h-4"></lucide-icon>
                        </span>
                      </button>
                      <div class="min-w-0">
                        <p class="text-xs font-bold text-slate-900 dark:text-white truncate">{{ user.name }}</p>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">{{ user.email }}</p>
                      </div>
                    </div>

                    <div class="py-1">
                      <button
                        type="button"
                        (click)="goTo('dashboard')"
                        class="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                      >
                        <lucide-icon [img]="UserIcon" class="w-4 h-4 text-slate-400"></lucide-icon>
                        Meu Resumo
                      </button>

                      @if (auth.isAdmin(user)) {
                        <button
                          type="button"
                          (click)="goTo('admin')"
                          class="w-full px-4 py-2 text-left text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between gap-2.5 cursor-pointer"
                        >
                          <span class="flex items-center gap-2.5">
                            <lucide-icon [img]="ShieldCheck" class="w-4 h-4"></lucide-icon>
                            Painel Administrativo
                          </span>
                          @if (user.pendingMasterRequestsCount && user.pendingMasterRequestsCount > 0) {
                            <span class="px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-extrabold">
                              {{ user.pendingMasterRequestsCount }}
                            </span>
                          }
                        </button>

                        <button
                          type="button"
                          (click)="toggleUserTest()"
                          class="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                        >
                          <span class="flex items-center gap-2.5">
                            <lucide-icon [img]="Eye" class="w-4 h-4 text-slate-400"></lucide-icon>
                            Visão Usuário
                          </span>
                          <span
                            class="text-[10px] px-1.5 py-0.5 rounded font-bold"
                            [ngClass]="ui.isUserTestMode() ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'"
                          >
                            {{ ui.isUserTestMode() ? 'ON' : 'OFF' }}
                          </span>
                        </button>
                      }

                      <button
                        type="button"
                        (click)="openAvatarModal()"
                        class="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                      >
                        <lucide-icon [img]="Camera" class="w-4 h-4 text-amber-500"></lucide-icon>
                        {{ user.avatarUrl ? 'Trocar Foto de Perfil' : 'Adicionar Foto de Perfil' }}
                      </button>

                      <button
                        type="button"
                        (click)="openChangePassword()"
                        class="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                      >
                        <lucide-icon [img]="KeyRound" class="w-4 h-4 text-slate-400"></lucide-icon>
                        Alterar Senha
                      </button>

                      <button
                        type="button"
                        (click)="openLocationModal()"
                        class="sm:hidden w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                      >
                        <lucide-icon [img]="MapPin" class="w-4 h-4 text-amber-500"></lucide-icon>
                        Região: {{ ui.currentLocation().uf }}
                      </button>
                    </div>

                    <div class="pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        (click)="logout()"
                        class="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 cursor-pointer"
                      >
                        <lucide-icon [img]="LogOut" class="w-4 h-4"></lucide-icon>
                        Sair da Conta
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          }
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  readonly ui = inject(UiStateService);
  readonly auth = inject(AuthService);
  private readonly obraService = inject(ObraService);

  readonly dropdownOpen = signal(false);

  readonly Menu = Menu;
  readonly MapPin = MapPin;
  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly LogIn = LogIn;
  readonly LogOut = LogOut;
  readonly ChevronDown = ChevronDown;
  readonly ShieldCheck = ShieldCheck;
  readonly KeyRound = KeyRound;
  readonly Eye = Eye;
  readonly UserIcon = UserIcon;
  readonly Camera = Camera;

  goTo(tab: 'dashboard' | 'admin'): void {
    this.dropdownOpen.set(false);
    this.ui.navigateTo(tab);
  }

  toggleUserTest(): void {
    this.dropdownOpen.set(false);
    this.ui.toggleUserTestMode();
  }

  openAvatarModalFromBadge(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen.set(false);
    this.ui.avatarModalOpen.set(true);
  }

  openAvatarModal(): void {
    this.dropdownOpen.set(false);
    this.ui.avatarModalOpen.set(true);
  }

  openChangePassword(): void {
    this.dropdownOpen.set(false);
    this.ui.changePasswordModalOpen.set(true);
  }

  openLocationModal(): void {
    this.dropdownOpen.set(false);
    this.ui.locationModalOpen.set(true);
  }

  logout(): void {
    this.dropdownOpen.set(false);
    this.auth.logout();
    this.obraService.clearOnLogout();
    this.ui.isUserTestMode.set(false);
    this.ui.navigateTo('home');
  }
}
