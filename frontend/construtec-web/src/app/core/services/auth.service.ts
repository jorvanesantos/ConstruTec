import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { UserProfile } from '../models/types';

const SESSION_KEY = 'construtec_session_user';
const JWT_TOKEN_KEY = 'construtec_jwt_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  private readonly userSubject = new BehaviorSubject<UserProfile | null>(this.loadStoredSession());
  readonly currentUser$ = this.userSubject.asObservable();
  readonly currentUser = signal<UserProfile | null>(this.userSubject.value);

  readonly isLoggedIn = computed(() => Boolean(this.currentUser()?.isLoggedIn));
  readonly isAdminAccount = computed(() => {
    const u = this.currentUser();
    return Boolean(u && (u.userType === 'ADM_MASTER' || u.userType === 'ADM' || u.userType === 'PROPRIETARIO'));
  });
  readonly isMasterAccount = computed(() => {
    const u = this.currentUser();
    return Boolean(u && (u.userType === 'ADM_MASTER' || u.userType === 'PROPRIETARIO'));
  });

  private loadStoredSession(): UserProfile | null {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as UserProfile;
        const storedToken = localStorage.getItem(JWT_TOKEN_KEY) || parsed?.token;
        if (parsed && parsed.isLoggedIn && storedToken) {
          if (!localStorage.getItem(JWT_TOKEN_KEY) && parsed.token) {
            localStorage.setItem(JWT_TOKEN_KEY, parsed.token);
          }
          return { ...parsed, token: storedToken };
        }
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(JWT_TOKEN_KEY);
      }
    } catch {
      // ignore
    }
    return null;
  }

  private setSession(user: UserProfile | null, token?: string): void {
    this.currentUser.set(user);
    this.userSubject.next(user);
    try {
      if (user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        if (token) {
          localStorage.setItem(JWT_TOKEN_KEY, token);
        }
      } else {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(JWT_TOKEN_KEY);
      }
    } catch {
      // ignore
    }
  }

  getToken(): string | null {
    return localStorage.getItem(JWT_TOKEN_KEY);
  }

  async verifySession(): Promise<boolean> {
    const current = this.currentUser();
    const token = this.getToken() || current?.token;
    if (!current || !token) {
      if (current) this.logout();
      return false;
    }

    try {
      const data = await firstValueFrom(this.http.get<{ user: UserProfile }>('/api/auth/me'));
      if (data?.user) {
        this.setSession({ ...current, ...data.user, token, isLoggedIn: true }, token);
        return true;
      }
      return false;
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403 || err?.status === 404) {
        this.logout();
        return false;
      }
      return true;
    }
  }

  isValidEmail(email: string): boolean {
    return this.emailRegex.test(email.trim().toLowerCase());
  }

  validatePassword(password: string): { valid: boolean; message?: string } {
    if (!password || password.length < 6) {
      return { valid: false, message: 'A senha deve ter pelo menos 6 caracteres.' };
    }
    return { valid: true };
  }

  isAdmin(user: UserProfile | null | undefined = this.currentUser()): boolean {
    if (!user) return false;
    return user.userType === 'ADM_MASTER' || user.userType === 'ADM' || user.userType === 'PROPRIETARIO';
  }

  isMaster(user: UserProfile | null | undefined = this.currentUser()): boolean {
    if (!user) return false;
    return user.userType === 'ADM_MASTER' || user.userType === 'PROPRIETARIO';
  }

  getRoleLabel(user: UserProfile | null): string {
    if (!user) return 'Visitante';
    if (user.userType === 'ADM_MASTER' || user.userType === 'ADM' || user.userType === 'PROPRIETARIO') {
      return 'Admin';
    }
    return 'Usuário';
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!this.isValidEmail(cleanEmail)) {
      return { success: false, error: 'Formato de e-mail inválido. Use um endereço como exemplo@dominio.com.' };
    }

    const passCheck = this.validatePassword(password);
    if (!passCheck.valid) {
      return { success: false, error: passCheck.message };
    }

    try {
      const data = await firstValueFrom(
        this.http.post<{ user: UserProfile; token: string }>('/api/auth/login', {
          email: cleanEmail,
          password
        })
      );
      const userObj: UserProfile = {
        ...data.user,
        token: data.token,
        isLoggedIn: true
      };
      this.setSession(userObj, data.token);
      return { success: true, user: userObj };
    } catch (err: any) {
      return { success: false, error: err?.error?.error || 'E-mail ou senha incorretos.' };
    }
  }

  async register(
    name: string,
    email: string,
    password: string,
    role: UserProfile['role'] = 'cliente'
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Informe seu nome completo.' };
    }
    if (!this.isValidEmail(cleanEmail)) {
      return { success: false, error: 'E-mail inválido. Use um formato real como seu.nome@provedor.com.' };
    }

    const passCheck = this.validatePassword(password);
    if (!passCheck.valid) {
      return { success: false, error: passCheck.message };
    }

    try {
      const data = await firstValueFrom(
        this.http.post<{ user: UserProfile; token: string }>('/api/auth/register', {
          name: cleanName,
          email: cleanEmail,
          password,
          role
        })
      );
      const userObj: UserProfile = {
        ...data.user,
        token: data.token,
        isLoggedIn: true
      };
      this.setSession(userObj, data.token);
      return { success: true, user: userObj };
    } catch (err: any) {
      return { success: false, error: err?.error?.error || 'Não foi possível criar sua conta.' };
    }
  }

  async loginWithGoogle(googleEmail?: string, googleName?: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const emailToUse = googleEmail || `usuario.google.${Date.now().toString().slice(-4)}@gmail.com`;
      const nameToUse = googleName || 'Usuário Google';
      const data = await firstValueFrom(
        this.http.post<{ user: UserProfile; token: string }>('/api/auth/google', {
          email: emailToUse,
          name: nameToUse,
          avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(nameToUse)}`
        })
      );
      const userObj: UserProfile = {
        ...data.user,
        token: data.token,
        isLoggedIn: true
      };
      this.setSession(userObj, data.token);
      return { success: true, user: userObj };
    } catch (err: any) {
      return { success: false, error: err?.error?.error || 'Erro ao conectar com Google.' };
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string; message?: string }> {
    const passCheck = this.validatePassword(newPassword);
    if (!passCheck.valid) {
      return { success: false, error: passCheck.message };
    }
    try {
      const data = await firstValueFrom(
        this.http.post<{ success: boolean; message?: string }>('/api/auth/alterar-senha', {
          currentPassword,
          newPassword
        })
      );
      return { success: true, message: data.message || 'Senha alterada com sucesso.' };
    } catch (err: any) {
      return { success: false, error: err?.error?.error || 'Erro ao alterar senha.' };
    }
  }

  async requestPasswordRecovery(
    email: string
  ): Promise<{ success: boolean; error?: string; message?: string; provisionalPassword?: string; emailSent?: boolean }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!this.isValidEmail(cleanEmail)) {
      return { success: false, error: 'Informe um e-mail válido.' };
    }
    try {
      const data = await firstValueFrom(
        this.http.post<{ success: boolean; message: string; provisionalPassword?: string; emailSent?: boolean }>(
          '/api/auth/solicitar-recuperacao',
          {
            email: cleanEmail
          }
        )
      );
      return {
        success: true,
        message: data.message,
        provisionalPassword: data.provisionalPassword,
        emailSent: data.emailSent
      };
    } catch (err: any) {
      return { success: false, error: err?.error?.error || 'Não foi possível localizar esta conta.' };
    }
  }

  async updateAvatar(avatarUrl: string | null): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const data = await firstValueFrom(
        this.http.post<{ success: boolean; user: UserProfile }>('/api/auth/avatar', {
          avatarUrl
        })
      );
      const current = this.currentUser();
      const token = this.getToken() || current?.token;
      if (current && data?.user) {
        const merged: UserProfile = {
          ...current,
          ...data.user,
          avatarUrl: data.user.avatarUrl,
          token,
          isLoggedIn: true
        };
        this.setSession(merged, token || undefined);
        return { success: true, user: merged };
      }
      return { success: true, user: data?.user };
    } catch (err: any) {
      return { success: false, error: err?.error?.error || 'Não foi possível atualizar a foto de perfil.' };
    }
  }

  syncCurrentUser(partial: Partial<UserProfile>, newToken?: string): void {
    const current = this.currentUser();
    if (!current) return;
    const token = newToken || this.getToken() || current.token;
    this.setSession(
      {
        ...current,
        ...partial,
        token,
        isLoggedIn: true
      },
      token || undefined
    );
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; error?: string; message?: string }> {
    const passCheck = this.validatePassword(newPassword);
    if (!passCheck.valid) {
      return { success: false, error: passCheck.message };
    }
    try {
      const data = await firstValueFrom(
        this.http.post<{ success: boolean; message: string }>('/api/auth/redefinir-senha', {
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword
        })
      );
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err?.error?.error || 'Código inválido ou erro ao redefinir.' };
    }
  }

  logout(): void {
    this.setSession(null);
  }
}
