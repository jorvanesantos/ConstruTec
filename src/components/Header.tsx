import React, { useState, useEffect } from 'react';
import { UserProfile, RegionalLocation, ThemeMode } from '../types';
import { ConstruTecLogo } from './ConstruTecLogo';
import { 
  MapPin, 
  User, 
  LogOut, 
  Menu, 
  ChevronDown,
  LayoutDashboard,
  ShieldCheck,
  Crown,
  Lock,
  KeyRound,
  FlaskConical,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

interface HeaderProps {
  setActiveTab: (tab: 'home' | 'calculator' | 'budgets' | 'materials' | 'support' | 'about' | 'dashboard' | 'admin') => void;
  user: UserProfile | null;
  systemName?: string;
  onOpenAuth: () => void;
  onLogout: () => void;
  currentLocation: RegionalLocation;
  onOpenLocationModal: () => void;
  savedBudgetsCount: number;
  onToggleMobileSidebar: () => void;
  onOpenChangePassword?: () => void;
  onOpenProfile?: () => void;
  isUserTestMode?: boolean;
  onEnterUserTestMode?: () => void;
  onExitUserTestMode?: () => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  setActiveTab,
  user,
  systemName = 'ConstruTec',
  onOpenAuth,
  onLogout,
  currentLocation,
  onOpenLocationModal,
  onToggleMobileSidebar,
  onOpenChangePassword,
  onOpenProfile,
  isUserTestMode = false,
  onEnterUserTestMode,
  onExitUserTestMode,
  theme = 'light',
  onToggleTheme
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const isMaster = user && user.isLoggedIn && (user.userType === 'ADM_MASTER' || user.userType === 'PROPRIETARIO');
  const isAdmin = user && user.isLoggedIn && user.userType === 'ADM';
  const isAdminOrMaster = isMaster || isAdmin;

  // Fecha dropdown ao pressionar a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs no-print transition-colors shrink-0">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 flex-nowrap">
        
        {/* LADO ESQUERDO: BOTÃO DE MENU (MOBILE) + NOVA LOGO CONSTRUTEC */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            id="btn-mobile-menu-toggle"
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            aria-label="Abrir navegação lateral"
            title="Menu de navegação"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* NOVA LOGO CONSTRUTEC 3D */}
          <div 
            onClick={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 cursor-pointer group select-none"
            id="brand-logo"
          >
            <ConstruTecLogo size="md" />

            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
                  {systemName}
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400 tracking-tight -mt-0.5 hidden sm:block">
                Inteligência em Obras & Orçamentos
              </span>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: HIERARQUIA, LOCALIDADE E SESSÃO */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* BOTÃO ALTERNAR TEMA CLARO / ESCURO */}
          {onToggleTheme && (
            <button
              id="btn-toggle-theme"
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center justify-center shrink-0"
              title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              aria-label="Alternar tema de cor claro ou escuro"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          )}

          {/* Perfil / Login com Validação de E-mail */}
          {user && user.isLoggedIn ? (
            <div className="relative shrink-0">
              <button
                id="btn-user-dropdown"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700/80 shrink-0"
                aria-label="Opções do usuário"
              >
                <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center text-xs font-bold shrink-0 bg-slate-900 text-amber-400 dark:bg-slate-800 dark:text-amber-300 border border-slate-200 dark:border-slate-700">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-[110px] truncate leading-tight">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-tight">
                    {isMaster ? 'Master' : isAdmin ? 'Admin' : 'Usuário'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <>
                  {/* Backdrop para fechar ao clicar fora - z-[90] para ficar sobre o conteúdo da página */}
                  <div 
                    className="fixed inset-0 z-[90] bg-black/20 dark:bg-black/50" 
                    onClick={() => setUserDropdownOpen(false)} 
                    aria-hidden="true" 
                  />

                  {/* Menu Dropdown - z-[100] para NUNCA ser sobreposto pelo scroll da página */}
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 p-2.5 shadow-xl border border-slate-200 dark:border-slate-800 z-[100] animate-in fade-in ring-1 ring-black/5 dark:ring-white/10">
                    <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 rounded-xl mb-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">{user.email}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="px-2 py-0.5 text-[9px] font-medium uppercase rounded bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300">
                          {isMaster ? 'ADM Master' : isAdmin ? 'ADM' : 'Usuário'}
                        </span>
                      </div>
                    </div>

                    {isAdminOrMaster && !isUserTestMode && (
                      <button
                        id="btn-dropdown-admin"
                        onClick={() => {
                          setActiveTab('admin');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left mt-1 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span>Painel de Administração</span>
                      </button>
                    )}

                    {(!isAdminOrMaster || isUserTestMode) && (
                      <button
                        id="btn-go-dashboard"
                        onClick={() => {
                          setActiveTab('dashboard');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left mt-1 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span>Meus Orçamentos & Painel</span>
                      </button>
                    )}

                    {onOpenProfile && (
                      <button
                        id="btn-edit-profile"
                        onClick={() => {
                          onOpenProfile();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left mt-1 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span>Editar meu perfil</span>
                      </button>
                    )}

                    {onOpenChangePassword && (
                      <button
                        id="btn-change-password"
                        onClick={() => {
                          onOpenChangePassword();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left mt-1 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-900 dark:hover:text-amber-300 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Alterar Minha Senha</span>
                      </button>
                    )}

                    <button
                      id="btn-logout"
                      onClick={() => {
                        onLogout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl flex items-center gap-2 cursor-pointer mt-1 border-t border-slate-100 dark:border-slate-800"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da conta</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              id="btn-open-auth-header"
              type="button"
              onClick={onOpenAuth}
              className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/80 dark:border-slate-700/80 cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
              <span>Entrar</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
