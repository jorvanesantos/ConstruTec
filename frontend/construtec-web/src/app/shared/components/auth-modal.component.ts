import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  LucideAngularModule,
  Mail,
  User,
  UserPlus,
  X
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { ObraService } from '../../core/services/obra.service';
import { UiStateService } from '../../core/services/ui-state.service';
import { UserProfile } from '../../core/models/types';

type AuthMode = 'login' | 'register' | 'recovery';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    @if (ui.authModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
        <div
          class="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
          (click)="$event.stopPropagation()"
        >
          <!-- Cabeçalho -->
          <div class="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <lucide-icon [img]="mode() === 'register' ? UserPlus : mode() === 'recovery' ? KeyRound : LogIn" class="w-5 h-5"></lucide-icon>
              </div>
              <div>
                <h2 class="text-lg font-bold text-slate-900 dark:text-white">
                  @if (mode() === 'login') { Acessar ConstruTec }
                  @else if (mode() === 'register') { Criar Nova Conta }
                  @else { Recuperar Senha }
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  @if (mode() === 'login') { Entre para realizar cálculos, salvar orçamentos e acompanhar suas obras }
                  @else if (mode() === 'register') { Cadastre-se em segundos com e-mail válido }
                  @else { Informe seu e-mail para receber uma senha provisória }
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="close()"
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <lucide-icon [img]="X" class="w-5 h-5"></lucide-icon>
            </button>
          </div>

          <div class="p-6 space-y-4">
            @if (ui.authModalMessage()) {
              <div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-medium">
                {{ ui.authModalMessage() }}
              </div>
            }

            <!-- Alternador Login / Cadastro -->
            @if (mode() !== 'recovery') {
              <div class="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  (click)="switchMode('login')"
                  class="py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                  [ngClass]="mode() === 'login'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'"
                >
                  Entrar
                </button>
                <button
                  type="button"
                  (click)="switchMode('register')"
                  class="py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                  [ngClass]="mode() === 'register'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'"
                >
                  Criar Conta
                </button>
              </div>
            }

            @if (errorMsg()) {
              <div class="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-xs font-medium">
                <lucide-icon [img]="AlertCircle" class="w-4 h-4 shrink-0 mt-0.5"></lucide-icon>
                <span>{{ errorMsg() }}</span>
              </div>
            }

            @if (successMsg()) {
              <div class="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200 text-xs font-medium">
                <lucide-icon [img]="CheckCircle2" class="w-4 h-4 shrink-0 mt-0.5"></lucide-icon>
                <span>{{ successMsg() }}</span>
              </div>
            }

            @if (mode() === 'login') {
              <form (ngSubmit)="handleLogin()" class="space-y-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">E-mail</label>
                  <div class="relative">
                    <lucide-icon [img]="Mail" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></lucide-icon>
                    <input
                      type="email"
                      name="email"
                      [(ngModel)]="email"
                      required
                      placeholder="seu.email@exemplo.com"
                      class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200">Senha</label>
                    <button
                      type="button"
                      (click)="switchMode('recovery')"
                      class="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div class="relative">
                    <lucide-icon [img]="Lock" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></lucide-icon>
                    <input
                      [type]="showPassword() ? 'text' : 'password'"
                      name="password"
                      [(ngModel)]="password"
                      required
                      placeholder="••••••"
                      class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <button
                      type="button"
                      (click)="showPassword.set(!showPassword())"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <lucide-icon [img]="showPassword() ? EyeOff : Eye" class="w-4 h-4"></lucide-icon>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  [disabled]="loading()"
                  class="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-950 font-bold text-sm shadow-sm transition-colors cursor-pointer"
                >
                  {{ loading() ? 'Autenticando...' : 'Entrar no Sistema' }}
                </button>
              </form>

              <div class="relative py-1">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div class="relative flex justify-center text-xs">
                  <span class="px-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">ou continue com</span>
                </div>
              </div>

              <button
                type="button"
                (click)="handleGoogleLogin()"
                [disabled]="loading()"
                class="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span class="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">G</span>
                Entrar com Google
              </button>
            } @else if (mode() === 'register') {
              <form (ngSubmit)="handleRegister()" class="space-y-3.5">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Nome Completo</label>
                  <div class="relative">
                    <lucide-icon [img]="User" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></lucide-icon>
                    <input
                      type="text"
                      name="regName"
                      [(ngModel)]="name"
                      required
                      placeholder="Ex: João Silva"
                      class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">E-mail</label>
                  <div class="relative">
                    <lucide-icon [img]="Mail" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></lucide-icon>
                    <input
                      type="email"
                      name="regEmail"
                      [(ngModel)]="email"
                      required
                      placeholder="seu.email@exemplo.com"
                      class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Perfil Profissional</label>
                  <select
                    name="regRole"
                    [(ngModel)]="role"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="cliente">Proprietário / Autônomo</option>
                    <option value="engenheiro">Engenheiro(a) Civil</option>
                    <option value="arquiteto">Arquiteto(a)</option>
                    <option value="mestre_obras">Mestre de Obras</option>
                    <option value="pedreiro">Profissional de Obra</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Senha (mín. 6 caracteres)</label>
                  <div class="relative">
                    <lucide-icon [img]="Lock" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></lucide-icon>
                    <input
                      [type]="showPassword() ? 'text' : 'password'"
                      name="regPassword"
                      [(ngModel)]="password"
                      required
                      minlength="6"
                      placeholder="Crie sua senha"
                      class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <button
                      type="button"
                      (click)="showPassword.set(!showPassword())"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <lucide-icon [img]="showPassword() ? EyeOff : Eye" class="w-4 h-4"></lucide-icon>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  [disabled]="loading()"
                  class="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-950 font-bold text-sm shadow-sm transition-colors cursor-pointer"
                >
                  {{ loading() ? 'Criando Conta...' : 'Concluir Cadastro' }}
                </button>
              </form>
            } @else {
              <!-- Recuperação de Senha com Senha Provisória -->
              <div class="space-y-4">
                @if (!provisionalSent()) {
                  <form (ngSubmit)="handleRequestRecovery()" class="space-y-4">
                    <div>
                      <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">E-mail cadastrado</label>
                      <div class="relative">
                        <lucide-icon [img]="Mail" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></lucide-icon>
                        <input
                          type="email"
                          name="recEmail"
                          [(ngModel)]="email"
                          required
                          placeholder="seu.email@exemplo.com"
                          class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <p class="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        Uma senha provisória será gerada e enviada para o e-mail informado.
                      </p>
                    </div>
                    <button
                      type="submit"
                      [disabled]="loading()"
                      class="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
                    >
                      {{ loading() ? 'Enviando Senha Provisória...' : 'Enviar Senha Provisória' }}
                    </button>
                  </form>
                } @else {
                  <div class="space-y-3.5">
                    @if (provisionalPassword()) {
                      <div class="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 text-xs space-y-1">
                        <p class="font-semibold">Senha provisória gerada para <span class="underline">{{ email }}</span>:</p>
                        <p class="font-mono text-base font-extrabold tracking-wider text-amber-700 dark:text-amber-300 select-all">
                          {{ provisionalPassword() }}
                        </p>
                        <p class="text-[11px] text-amber-800/80 dark:text-amber-200/80">
                          Guarde esta senha e altere-a após entrar em "Alterar Senha" no menu do perfil.
                        </p>
                      </div>
                    }

                    <button
                      type="button"
                      (click)="goToLoginWithProvisional()"
                      class="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
                    >
                      Ir para o Login
                    </button>
                  </div>
                }

                <button
                  type="button"
                  (click)="switchMode('login')"
                  class="w-full py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Voltar para Login
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class AuthModalComponent {
  readonly ui = inject(UiStateService);
  private readonly auth = inject(AuthService);
  private readonly obraService = inject(ObraService);

  readonly mode = signal<AuthMode>('login');
  readonly showPassword = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly errorMsg = signal<string>('');
  readonly successMsg = signal<string>('');
  readonly provisionalSent = signal<boolean>(false);
  readonly provisionalPassword = signal<string>('');

  email = '';
  password = '';
  name = '';
  role: UserProfile['role'] = 'cliente';

  readonly X = X;
  readonly LogIn = LogIn;
  readonly UserPlus = UserPlus;
  readonly KeyRound = KeyRound;
  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly User = User;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle2 = CheckCircle2;

  switchMode(nextMode: AuthMode): void {
    this.mode.set(nextMode);
    this.errorMsg.set('');
    this.successMsg.set('');
    this.provisionalSent.set(false);
    this.provisionalPassword.set('');
  }

  close(): void {
    this.errorMsg.set('');
    this.successMsg.set('');
    this.provisionalSent.set(false);
    this.provisionalPassword.set('');
    this.mode.set('login');
    this.ui.closeAuthModal();
  }

  async handleLogin(): Promise<void> {
    this.errorMsg.set('');
    this.loading.set(true);
    const res = await this.auth.login(this.email, this.password);
    this.loading.set(false);

    if (!res.success || !res.user) {
      this.errorMsg.set(res.error || 'E-mail ou senha incorretos.');
      return;
    }

    await this.obraService.loadBudgets(true, res.user.id);
    if (res.user.defaultLocation && !this.ui.hasManualLocation() && !this.ui.locationAutoDetected()) {
      this.ui.setLocation(res.user.defaultLocation, false);
    }
    this.close();
    if (this.auth.isAdmin(res.user)) {
      this.ui.navigateTo('admin');
    }
  }

  async handleRegister(): Promise<void> {
    this.errorMsg.set('');
    this.loading.set(true);
    const res = await this.auth.register(this.name, this.email, this.password, this.role);
    this.loading.set(false);

    if (!res.success || !res.user) {
      this.errorMsg.set(res.error || 'Erro ao criar conta.');
      return;
    }

    await this.obraService.loadBudgets(true, res.user.id);
    this.close();
  }

  async handleGoogleLogin(): Promise<void> {
    this.errorMsg.set('');
    this.loading.set(true);
    const res = await this.auth.loginWithGoogle();
    this.loading.set(false);

    if (!res.success || !res.user) {
      this.errorMsg.set(res.error || 'Falha no acesso com Google.');
      return;
    }

    await this.obraService.loadBudgets(true, res.user.id);
    this.close();
  }

  async handleRequestRecovery(): Promise<void> {
    this.errorMsg.set('');
    this.successMsg.set('');
    this.loading.set(true);
    const res = await this.auth.requestPasswordRecovery(this.email);
    this.loading.set(false);

    if (!res.success) {
      this.errorMsg.set(res.error || 'E-mail não localizado.');
      return;
    }

    this.provisionalSent.set(true);
    this.provisionalPassword.set(res.provisionalPassword || '');
    this.successMsg.set(res.message || 'Senha provisória enviada para o seu e-mail.');
  }

  goToLoginWithProvisional(): void {
    const prov = this.provisionalPassword();
    if (prov) {
      this.password = prov;
    }
    this.switchMode('login');
  }
}
