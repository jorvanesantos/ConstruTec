import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

const passwordsMatchValidator: ValidatorFn = (control): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmation = control.get('confirmPassword')?.value;
  return password === confirmation ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="max-w-md mx-auto px-4 py-12">
      <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-6">
        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Redefinir senha</h1>
          <p class="text-sm text-slate-600 dark:text-slate-400">
            Escolha uma nova senha com pelo menos 6 caracteres.
          </p>
        </div>

        @if (!token()) {
          <div class="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-sm" role="alert">
            O link está incompleto ou inválido. Solicite uma nova redefinição de senha.
          </div>
        }
        @if (error()) {
          <div class="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-sm" role="alert">
            {{ error() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label for="new-password" class="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Nova senha</label>
            <input
              id="new-password"
              type="password"
              formControlName="password"
              autocomplete="new-password"
              class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
            @if (form.controls.password.touched && form.controls.password.hasError('required')) {
              <p class="mt-1 text-xs text-red-600">Informe a nova senha.</p>
            } @else if (form.controls.password.touched && form.controls.password.hasError('minlength')) {
              <p class="mt-1 text-xs text-red-600">A senha deve ter pelo menos 6 caracteres.</p>
            }
          </div>

          <div>
            <label for="confirm-password" class="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Confirmar nova senha</label>
            <input
              id="confirm-password"
              type="password"
              formControlName="confirmPassword"
              autocomplete="new-password"
              class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
            @if (form.controls.confirmPassword.touched && form.hasError('passwordMismatch')) {
              <p class="mt-1 text-xs text-red-600">As senhas não coincidem.</p>
            }
          </div>

          <button
            type="submit"
            [disabled]="loading() || !token()"
            class="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-950 font-bold text-sm transition-colors"
          >
            {{ loading() ? 'Salvando...' : 'Salvar nova senha' }}
          </button>
        </form>

        <a routerLink="/login" class="block text-center text-sm font-semibold text-amber-600 dark:text-amber-400 hover:underline">
          Voltar para o login
        </a>
      </div>
    </section>
  `
})
export class ResetPasswordComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);

  readonly token = signal('');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = new FormGroup({
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  }, { validators: passwordsMatchValidator });

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => this.token.set(params.get('token') || ''));
  }

  async submit(): Promise<void> {
    this.error.set('');
    if (this.form.invalid || !this.token()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const result = await this.auth.resetPassword(this.token(), this.form.controls.password.value);
    this.loading.set(false);

    if (!result.success) {
      this.error.set(result.error || 'Não foi possível redefinir a senha.');
      return;
    }

    await this.router.navigateByUrl('/login');
  }
}
