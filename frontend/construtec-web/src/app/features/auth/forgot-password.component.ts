import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="max-w-md mx-auto px-4 py-12">
      <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-6">
        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Esqueci minha senha</h1>
          <p class="text-sm text-slate-600 dark:text-slate-400">
            Informe o e-mail da sua conta. Se ele estiver cadastrado, enviaremos um link para redefinir sua senha.
          </p>
        </div>

        @if (message()) {
          <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm" role="status">
            {{ message() }}
          </div>
        }
        @if (error()) {
          <div class="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-sm" role="alert">
            {{ error() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label for="recovery-email" class="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">E-mail</label>
            <input
              id="recovery-email"
              type="email"
              formControlName="email"
              autocomplete="email"
              placeholder="seu.email@exemplo.com"
              class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
            @if (form.controls.email.touched && form.controls.email.hasError('required')) {
              <p class="mt-1 text-xs text-red-600">Informe seu e-mail.</p>
            } @else if (form.controls.email.touched && form.controls.email.hasError('email')) {
              <p class="mt-1 text-xs text-red-600">Informe um endereço de e-mail válido.</p>
            }
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-950 font-bold text-sm transition-colors"
          >
            {{ loading() ? 'Enviando...' : 'Enviar link de redefinição' }}
          </button>
        </form>

        <a routerLink="/login" class="block text-center text-sm font-semibold text-amber-600 dark:text-amber-400 hover:underline">
          Voltar para o login
        </a>
      </div>
    </section>
  `
})
export class ForgotPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  private readonly recoveryEmail = this.getRecoveryEmail();
  readonly form = this.formBuilder.nonNullable.group({
    email: [this.recoveryEmail, [Validators.required, Validators.email]]
  });

  private getRecoveryEmail(): string {
    const navigationEmail = this.router.getCurrentNavigation()?.extras.state?.['recoveryEmail'];
    const historyEmail = window.history.state?.recoveryEmail;
    const email = typeof navigationEmail === 'string' ? navigationEmail : historyEmail;
    return typeof email === 'string' ? email : '';
  }

  async submit(): Promise<void> {
    this.message.set('');
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const result = await this.auth.requestPasswordRecovery(this.form.controls.email.value);
    this.loading.set(false);

    if (result.success) {
      this.message.set(result.message || 'Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.');
    } else {
      this.error.set(result.error || 'Não foi possível solicitar a redefinição de senha.');
    }
  }
}
