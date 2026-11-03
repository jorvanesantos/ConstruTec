import { UserProfile, UserType } from '../types';
import { REGIONAL_LOCATIONS } from '../data/catalog';

const STORAGE_KEY_USER = 'construtec_user';
const STORAGE_KEY_TOKEN = 'construtec_jwt_token';

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: UserProfile;
  message?: string;
}

export class AuthService {
  /**
   * Valida formato de e-mail de acordo com a norma RFC
   */
  public static isValidEmail(email: string): boolean {
    if (!email) return false;
    const clean = email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(clean);
  }

  /**
   * Valida senha com requisitos de segurança
   */
  public static validatePassword(password: string): { isValid: boolean; message?: string } {
    if (!password) {
      return { isValid: false, message: 'A senha é obrigatória.' };
    }
    if (password.length < 6) {
      return { isValid: false, message: 'A senha deve conter no mínimo 6 caracteres.' };
    }
    return { isValid: true };
  }

  /**
   * Obtém o token JWT armazenado
   */
  public static getToken(): string | null {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  }

  /**
   * Obtém o usuário atual persistido no LocalStorage
   */
  public static getCurrentUser(): UserProfile | null {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email && AuthService.isValidEmail(parsed.email)) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Salva a sessão do usuário
   */
  public static setSession(user: UserProfile, token?: string): void {
    if (token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
    }
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  }

  /**
   * Encerra a sessão
   */
  public static logout(): void {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
  }

  /**
   * Verifica se o usuário é ADM MASTER (Nível 1 - Master)
   */
  public static isMaster(user: UserProfile | null | undefined): boolean {
    return Boolean(user && user.isLoggedIn && (user.userType === 'ADM_MASTER' || user.userType === 'PROPRIETARIO'));
  }

  /**
   * Alias de compatibilidade para isMaster
   */
  public static isOwner(user: UserProfile | null | undefined): boolean {
    return AuthService.isMaster(user);
  }

  /**
   * Verifica se o usuário é ADMINISTRADOR (Nível 2 ou Nível 1)
   */
  public static isAdmin(user: UserProfile | null | undefined): boolean {
    return Boolean(user && user.isLoggedIn && (user.userType === 'ADM' || user.userType === 'ADM_MASTER' || user.userType === 'PROPRIETARIO'));
  }

  /**
   * Verifica se o usuário tem permissão para acessar o Painel Administrativo
   */
  public static canAccessAdmin(user: UserProfile | null | undefined): boolean {
    return AuthService.isAdmin(user);
  }

  /**
   * Verifica se o usuário pode gerenciar/promover outros Administradores e ADM Masters
   * Regra estrita: Apenas ADM MASTER tem essa prerrogativa
   */
  public static canManageAdmins(user: UserProfile | null | undefined): boolean {
    return AuthService.isMaster(user);
  }

  /**
   * Retorna o nome amigável do perfil
   */
  public static getRoleLabel(userType: UserType): string {
    if (userType === 'ADM_MASTER' || userType === 'PROPRIETARIO') {
      return 'ADM Master';
    }
    if (userType === 'ADM') {
      return 'ADM';
    }
    return 'Usuário';
  }

  /**
   * Verifica se o usuário pode gerenciar insumos e preços
   */
  public static canManageMaterials(user: UserProfile | null | undefined): boolean {
    return AuthService.isAdmin(user);
  }

  /**
   * Retorna os cabeçalhos de autenticação para chamadas de API
   */
  public static getAuthHeaders(): Record<string, string> {
    const token = AuthService.getToken() || '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Executa login seguro na API com validação estrita de e-mail e senha
   */
  public static async login(email: string, password: string): Promise<AuthResponse> {
    const cleanEmail = email.trim().toLowerCase();

    if (!AuthService.isValidEmail(cleanEmail)) {
      return { success: false, message: 'Digite um endereço de e-mail válido (ex: seu.nome@dominio.com).' };
    }

    const passCheck = AuthService.validatePassword(password);
    if (!passCheck.isValid) {
      return { success: false, message: passCheck.message };
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: data.message || data.error || 'Credenciais inválidas. Verifique seu e-mail e senha.'
        };
      }

      const loggedUser: UserProfile = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatarUrl: data.user.avatarUrl,
        role: data.user.role || 'proprietario',
        userType: data.user.userType || 'USUARIO',
        token: data.token,
        active: data.user.active !== undefined ? data.user.active : true,
        defaultLocation: REGIONAL_LOCATIONS[0],
        isLoggedIn: true,
        createdAt: data.user.createdAt
      };

      AuthService.setSession(loggedUser, data.token);

      return {
        success: true,
        user: loggedUser,
        token: data.token
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Não foi possível conectar ao servidor. Certifique-se de que o backend está ativo.'
      };
    }
  }

  /**
   * Executa cadastro seguro de novo usuário
   */
  public static async register(params: {
    name: string;
    email: string;
    password: string;
    role?: UserProfile['role'];
  }): Promise<AuthResponse> {
    const cleanEmail = params.email.trim().toLowerCase();

    if (!params.name || params.name.trim().length < 2) {
      return { success: false, message: 'Informe seu nome completo (mínimo 2 caracteres).' };
    }

    if (!AuthService.isValidEmail(cleanEmail)) {
      return { success: false, message: 'Informe um e-mail válido para criar a conta.' };
    }

    const passCheck = AuthService.validatePassword(params.password);
    if (!passCheck.isValid) {
      return { success: false, message: passCheck.message };
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: params.name.trim(),
          email: cleanEmail,
          password: params.password,
          role: params.role || 'proprietario'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: data.message || data.error || 'Erro ao realizar cadastro.'
        };
      }

      const registeredUser: UserProfile = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatarUrl: data.user.avatarUrl,
        role: data.user.role || 'proprietario',
        userType: data.user.userType || 'USUARIO',
        token: data.token,
        active: true,
        defaultLocation: REGIONAL_LOCATIONS[0],
        isLoggedIn: true,
        createdAt: data.user.createdAt
      };

      AuthService.setSession(registeredUser, data.token);

      return {
        success: true,
        user: registeredUser,
        token: data.token
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Erro ao conectar ao servidor de cadastro.'
      };
    }
  }

  /**
   * Autenticação com o Google
   */
  public static async loginWithGoogle(googleData?: { email?: string; name?: string; avatarUrl?: string }): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleData || {})
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: data.message || data.error || 'Falha ao autenticar com a conta Google.'
        };
      }

      const loggedUser: UserProfile = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatarUrl: data.user.avatarUrl,
        role: data.user.role || 'cliente',
        userType: data.user.userType || 'USUARIO',
        token: data.token,
        active: data.user.active !== undefined ? data.user.active : true,
        defaultLocation: REGIONAL_LOCATIONS[0],
        isLoggedIn: true,
        createdAt: data.user.createdAt
      };

      AuthService.setSession(loggedUser, data.token);

      return {
        success: true,
        user: loggedUser,
        token: data.token
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Erro de comunicação ao entrar com o Google.'
      };
    }
  }
}
