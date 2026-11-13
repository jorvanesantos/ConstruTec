import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  LucideAngularModule,
  X
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { UiStateService } from '../../core/services/ui-state.service';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    @if (ui.changePasswordModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
        <div class="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
          <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <lucide-icon [img]="KeyRound" class="w-5 h-5"></lucide-icon>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Alterar Senha</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">Atualize sua credencial de acesso</p>
              </div>
            </div>
            <button
              type="button"
              (click)="close()"
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <lucide-icon [img]="X" class="w-5 h-5"></lucide-icon>
            </button>
          </div>

          <form (ngSubmit)="submit()" class="p-6 space-y-4">
            @if (errorMsg()) {
              <div class="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-xs">
                <lucide-icon [img]="AlertCircle" class="w-4 h-4 shrink-0"></lucide-icon>
                <span>{{ errorMsg() }}</span>
              </div>
            }
            @if (successMsg()) {
              <div class="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200 text-xs">
                <lucide-icon [img]="CheckCircle2" class="w-4 h-4 shrink-0"></lucide-icon>
                <span>{{ successMsg() }}</span>
              </div>
            }

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Senha Atual</label>
              <input
                type="password"
                name="currentPass"
                [(ngModel)]="currentPassword"
                required
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Nova Senha (mín. 6 caracteres)</label>
              <input
                type="password"
                name="newPass"
                [(ngModel)]="newPassword"
                required
                minlength="6"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Confirmar Nova Senha</label>
              <input
                type="password"
                name="confirmPass"
                [(ngModel)]="confirmPassword"
                required
                minlength="6"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                (click)="close()"
                class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="loading()"
                class="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer"
              >
                {{ loading() ? 'Salvando...' : 'Atualizar Senha' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class ChangePasswordModalComponent {
  readonly ui = inject(UiStateService);
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly errorMsg = signal('');
  readonly successMsg = signal('');

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  readonly KeyRound = KeyRound;
  readonly X = X;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle2 = CheckCircle2;

  close(): void {
    this.errorMsg.set('');
    this.successMsg.set('');
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.ui.changePasswordModalOpen.set(false);
  }

  async submit(): Promise<void> {
    this.errorMsg.set('');
    this.successMsg.set('');

    if (this.newPassword !== this.confirmPassword) {
      this.errorMsg.set('As senhas digitadas não conferem.');
      return;
    }

    this.loading.set(true);
    const res = await this.auth.changePassword(this.currentPassword, this.newPassword);
    this.loading.set(false);

    if (!res.success) {
      this.errorMsg.set(res.error || 'Erro ao alterar senha.');
      return;
    }

    this.successMsg.set(res.message || 'Senha atualizada com sucesso!');
    setTimeout(() => this.close(), 1200);
  }
}
