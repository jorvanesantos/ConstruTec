import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ArrowLeft, LogIn, LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { UiStateService } from '../../core/services/ui-state.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="max-w-xl mx-auto px-4 py-12 space-y-6">
      <button
        type="button"
        (click)="ui.navigateTo('home')"
        class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-500 cursor-pointer"
      >
        <lucide-icon [img]="ArrowLeft" class="w-4 h-4"></lucide-icon>
        Voltar ao Início
      </button>

      <div class="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Acesso ConstruTec</h2>
        <p class="text-sm text-slate-600 dark:text-slate-400">
          Entre ou crie sua conta para gerenciar seus orçamentos e acompanhar projetos.
        </p>
        <button
          type="button"
          (click)="ui.openAuthModal()"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm cursor-pointer"
        >
          <lucide-icon [img]="LogIn" class="w-4 h-4"></lucide-icon>
          Abrir Tela de Login
        </button>
      </div>
    </div>
  `
})
export class AuthPageComponent implements OnInit {
  readonly ui = inject(UiStateService);
  private readonly auth = inject(AuthService);

  readonly ArrowLeft = ArrowLeft;
  readonly LogIn = LogIn;

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.ui.navigateTo(this.auth.isAdmin() ? 'admin' : 'dashboard');
    } else {
      this.ui.openAuthModal();
    }
  }
}
