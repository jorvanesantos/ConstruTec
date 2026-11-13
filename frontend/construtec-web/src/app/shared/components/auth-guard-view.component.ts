import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { LucideAngularModule, Lock, LogIn, ShieldCheck } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { UiStateService } from '../../core/services/ui-state.service';

@Component({
  selector: 'app-auth-guard-view',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="max-w-lg mx-auto my-12 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg text-center space-y-5">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
        <lucide-icon [img]="requireAdmin ? ShieldCheck : Lock" class="w-8 h-8"></lucide-icon>
      </div>
      <div class="space-y-2">
        <h3 class="text-xl font-bold text-slate-900 dark:text-white">
          {{ requireAdmin ? 'Acesso Administrativo Restrito' : 'Autenticação Necessária' }}
        </h3>
        <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {{ message || (requireAdmin ? 'Esta área é exclusiva para administradores autenticados.' : 'Faça login na sua conta ConstruTec para visualizar ou gerenciar este conteúdo.') }}
        </p>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
        @if (!auth.isLoggedIn()) {
          <button
            type="button"
            (click)="ui.openAuthModal(message)"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm shadow-sm transition-colors cursor-pointer"
          >
            <lucide-icon [img]="LogIn" class="w-4 h-4"></lucide-icon>
            Entrar na Conta
          </button>
        }
        <button
          type="button"
          (click)="ui.navigateTo('home')"
          class="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-colors cursor-pointer"
        >
          Voltar ao Início
        </button>
      </div>
    </div>
  `
})
export class AuthGuardViewComponent {
  readonly auth = inject(AuthService);
  readonly ui = inject(UiStateService);

  @Input() requireAdmin = false;
  @Input() message = '';

  readonly Lock = Lock;
  readonly LogIn = LogIn;
  readonly ShieldCheck = ShieldCheck;
}
