import React from 'react';
import { WorkTypeKey, RegionalLocation, UserProfile, ThemeMode } from '../types';
import { WORK_TYPES } from '../data/catalog';
import { ConstruTecLogo } from './ConstruTecLogo';
import { 
  Hammer, 
  Calculator, 
  FileText, 
  PackageCheck, 
  Info, 
  LayoutDashboard, 
  MapPin, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Layers,
  Building2,
  Grid3X3,
  Paintbrush,
  Boxes,
  Home,
  Wrench,
  Anchor,
  ShieldCheck,
  Crown,
  FlaskConical,
  Users,
  Activity,
  History,
  LifeBuoy,
  Sun,
  Moon
} from 'lucide-react';

export type NavTab = 'home' | 'calculator' | 'budgets' | 'materials' | 'support' | 'about' | 'dashboard' | 'admin';
export type AdminSubTabKey = 'overview' | 'users' | 'workTypes' | 'materials' | 'works' | 'support' | 'history';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  savedBudgetsCount: number;
  user?: UserProfile | null;
  selectedWorkType?: WorkTypeKey;
  onSelectWorkType?: (type: WorkTypeKey) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  currentLocation: RegionalLocation;
  onOpenLocationModal: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isUserTestMode?: boolean;
  onEnterUserTestMode?: () => void;
  onExitUserTestMode?: () => void;
  adminSubTab?: AdminSubTabKey;
  onSelectAdminSubTab?: (tab: AdminSubTabKey) => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

const workTypeIcons: Record<string, any> = {
  muro: Layers,
  parede: Building2,
  piso: Grid3X3,
  pintura: Paintbrush,
  concreto: Boxes,
  fundacao: Anchor,
  telhado: Home,
  revestimento: Layers,
  outro: Wrench
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  savedBudgetsCount,
  user,
  selectedWorkType,
  onSelectWorkType,
  isMobileOpen,
  onCloseMobile,
  currentLocation,
  onOpenLocationModal,
  isCollapsed = false,
  onToggleCollapse,
  isUserTestMode = false,
  onEnterUserTestMode,
  onExitUserTestMode,
  adminSubTab = 'overview',
  onSelectAdminSubTab,
  theme = 'light',
  onToggleTheme
}) => {
  const isMaster = user && (user.userType === 'ADM_MASTER' || user.userType === 'PROPRIETARIO');
  const isAdminOrMaster = user && (user.userType === 'ADM' || user.userType === 'ADM_MASTER' || user.userType === 'PROPRIETARIO');

  // Administrador em modo padrão NÃO vê as abas de usuário misturadas
  const showUserTabs = !isAdminOrMaster || isUserTestMode;

  const adminNavItems: {
    id: AdminSubTabKey;
    label: string;
    icon: any;
    description: string;
    badge?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Painel de Gestão',
      icon: Building2,
      description: 'Métricas gerais & resumo'
    },
    {
      id: 'users',
      label: 'Usuários e Equipe',
      icon: Users,
      description: 'Gestão de contas e equipe'
    },
    {
      id: 'workTypes',
      label: 'Tipos de Construção',
      icon: Hammer,
      description: 'Estruturas, vedações e normas'
    },
    {
      id: 'materials',
      label: 'Materiais e Preços',
      icon: PackageCheck,
      description: 'Insumos, cotações e SINAPI'
    },
    {
      id: 'works',
      label: 'Obras dos Usuários',
      icon: FileText,
      description: 'Obras e cálculos dos usuários'
    },
    {
      id: 'support',
      label: 'Chamados de Suporte',
      icon: LifeBuoy,
      description: 'Responder dúvidas e bugs'
    },
    {
      id: 'history',
      label: 'Histórico do Sistema',
      icon: History,
      description: 'Auditoria de segurança e logs'
    }
  ];

  const mainNavItems = [
    ...(isAdminOrMaster ? [{
      id: 'admin' as NavTab,
      label: isMaster ? 'Painel ADM Master' : 'Painel ADM',
      icon: isMaster ? Crown : ShieldCheck,
      badge: isMaster ? 'MASTER' : 'ADM',
      description: 'Gestão, Insumos & Obras',
      highlight: true
    }] : []),
    ...(showUserTabs ? [
      { 
        id: 'home' as NavTab, 
        label: 'Início', 
        icon: Hammer, 
        description: 'Visão geral & destaques' 
      },
      { 
        id: 'calculator' as NavTab, 
        label: 'Calculadora', 
        icon: Calculator, 
        description: 'Dimensionamento de materiais' 
      },
      { 
        id: 'budgets' as NavTab, 
        label: 'Meus Orçamentos', 
        icon: FileText, 
        badge: savedBudgetsCount > 0 ? savedBudgetsCount : undefined,
        description: 'Propostas salvas & histórico'
      },
      { 
        id: 'materials' as NavTab, 
        label: 'Catálogo de Insumos', 
        icon: PackageCheck, 
        description: 'Preços médios SINAPI' 
      },
      { 
        id: 'dashboard' as NavTab, 
        label: 'Meu Painel', 
        icon: LayoutDashboard, 
        description: 'Métricas & comparativos' 
      },
      {
        id: 'support' as NavTab,
        label: 'Suporte',
        icon: LifeBuoy,
        description: 'Dúvidas e chamados'
      },
      { 
        id: 'about' as NavTab, 
        label: 'Metodologia Técnica', 
        icon: Info, 
        description: 'Normas ABNT & referências' 
      }
    ] : [])
  ];

  const handleTabClick = (tabId: NavTab) => {
    setActiveTab(tabId);
    onCloseMobile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminSubTabClick = (subTabKey: AdminSubTabKey) => {
    setActiveTab('admin');
    if (onSelectAdminSubTab) {
      onSelectAdminSubTab(subTabKey);
    }
    onCloseMobile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWorkTypeClick = (wtKey: WorkTypeKey) => {
    if (onSelectWorkType) {
      onSelectWorkType(wtKey);
    } else {
      setActiveTab('calculator');
    }
    onCloseMobile();
  };

  // Content shared between Desktop Sidebar and Mobile Drawer
  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 select-none transition-colors">
      
      {/* Header na gaveta mobile */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white">
        <div className="flex items-center gap-2.5">
          <ConstruTecLogo size="sm" />
          <div className="flex items-center">
            <span className="font-extrabold text-base tracking-tight">
              Constru<span className="text-amber-400">Tec</span>
            </span>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          aria-label="Fechar navegação"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navegação Principal */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        
        {/* Bloco: Navegação */}
        <div>
          {/* Única opção na navegação esquerda para voltar ao modo ADM durante teste */}
          {isAdminOrMaster && isUserTestMode && (
            <div className="mb-3">
              <button
                id="btn-sidebar-exit-test"
                type="button"
                onClick={() => {
                  if (onExitUserTestMode) onExitUserTestMode();
                  onCloseMobile();
                }}
                title={isCollapsed ? (isMaster ? "Voltar ao Modo Master" : "Voltar ao Modo ADM") : undefined}
                className={`w-full flex items-center rounded-xl text-left transition-all cursor-pointer border ${
                  isCollapsed
                    ? 'justify-center p-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-700 shadow-sm'
                    : 'px-3 py-2.5 gap-2.5 bg-slate-900 hover:bg-slate-800 text-white border-slate-700 shadow-sm'
                }`}
              >
                <div className="shrink-0 flex items-center justify-center rounded-lg bg-amber-500 text-slate-950 w-7 h-7">
                  <ShieldCheck className="w-4 h-4 text-slate-950 font-bold" />
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold truncate block text-amber-400">
                      {isMaster ? 'Voltar ao Modo Master' : 'Voltar ao Modo ADM'}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block">
                      Retornar à administração
                    </span>
                  </div>
                )}
              </button>
            </div>
          )}

          <div className="px-3 mb-2 flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 ${isCollapsed ? 'hidden' : 'block'}`}>
              {isAdminOrMaster && !isUserTestMode ? 'Administração' : 'Navegação'}
            </span>
          </div>

          <nav className="space-y-1" aria-label="Navegação lateral">
            {isAdminOrMaster && !isUserTestMode ? (
              adminNavItems.map((item) => {
                const isActive = activeTab === 'admin' && (adminSubTab || 'overview') === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-admin-${item.id}`}
                    onClick={() => handleAdminSubTabClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full group flex items-center rounded-xl text-left transition-all cursor-pointer relative ${
                      isCollapsed 
                        ? 'justify-center p-3' 
                        : 'px-3 py-2.5 gap-3'
                    } ${
                      isActive
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-300 font-bold shadow-xs border border-amber-200/80 dark:border-amber-800/60'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    {/* Indicador lateral da aba ativa */}
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-500 rounded-r-md" />
                    )}

                    <div className={`shrink-0 flex items-center justify-center rounded-lg transition-colors ${
                      isCollapsed ? 'w-8 h-8' : 'w-7 h-7'
                    } ${
                      isActive 
                        ? 'bg-amber-500 text-slate-950' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:bg-slate-200/70 dark:group-hover:bg-slate-700'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold truncate leading-none">
                            {item.label}
                          </span>
                          {item.badge !== undefined && (
                            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950 leading-none">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal truncate block mt-0.5">
                          {item.description}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              mainNavItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => handleTabClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full group flex items-center rounded-xl text-left transition-all cursor-pointer relative ${
                      isCollapsed 
                        ? 'justify-center p-3' 
                        : 'px-3 py-2.5 gap-3'
                    } ${
                      isActive
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-300 font-bold shadow-xs border border-amber-200/80 dark:border-amber-800/60'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    {/* Indicador lateral da aba ativa */}
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-500 rounded-r-md" />
                    )}

                    <div className={`shrink-0 flex items-center justify-center rounded-lg transition-colors ${
                      isCollapsed ? 'w-8 h-8' : 'w-7 h-7'
                    } ${
                      isActive 
                        ? 'bg-amber-500 text-slate-950' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:bg-slate-200/70 dark:group-hover:bg-slate-700'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold truncate leading-none">
                            {item.label}
                          </span>
                          {item.badge !== undefined && (
                            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950 leading-none">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal truncate block mt-0.5">
                          {item.description}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </nav>

          {/* Botão de Testar Modo Usuário adicionado ao lado esquerdo */}
          {isAdminOrMaster && !isUserTestMode && (
            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                id="sidebar-btn-test-user-mode"
                type="button"
                onClick={() => {
                  if (onEnterUserTestMode) onEnterUserTestMode();
                  onCloseMobile();
                }}
                title={isCollapsed ? "Testar Modo Usuário (Calculadora)" : undefined}
                className={`w-full group flex items-center rounded-xl text-left transition-all cursor-pointer border ${
                  isCollapsed 
                    ? 'justify-center p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700' 
                    : 'px-3 py-2 gap-2.5 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/90 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className={`shrink-0 flex items-center justify-center rounded-lg bg-slate-800 dark:bg-slate-900 text-amber-400 ${
                  isCollapsed ? 'w-7 h-7' : 'w-6 h-6'
                }`}>
                  <Calculator className="w-3.5 h-3.5" />
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold truncate block leading-tight">
                      Testar Modo Usuário
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal truncate block mt-0.5">
                      Visualizar calculadora
                    </span>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Bloco: Tipos de Obra (Apenas para usuários ou ADMs em modo de teste) */}
        {showUserTabs && !isCollapsed && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Calcular por Obra
              </span>
              <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/50 dark:border-amber-800/40">
                Direto
              </span>
            </div>

            <div className="space-y-0.5">
              {WORK_TYPES.map((type) => {
                const isSelected = activeTab === 'calculator' && selectedWorkType === type.id;
                const Icon = workTypeIcons[type.id] || Layers;
                return (
                  <button
                    key={type.id}
                    id={`sidebar-worktype-${type.id}`}
                    onClick={() => handleWorkTypeClick(type.id)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-slate-800 text-white font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-400 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400'}`} />
                      <span className="truncate">{type.name}</span>
                    </div>
                    <ChevronRight className={`w-3 h-3 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Bloco Rodapé da Sidebar: Tabela Regional SINAPI + Alternador de Tema */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 transition-colors">
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px] font-bold">Tabela Regional</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/40">
                {currentLocation.priceMultiplier}x
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate font-medium">
              {currentLocation.stateName} ({currentLocation.uf})
            </p>
            <button
              onClick={onOpenLocationModal}
              className="mt-2 w-full py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors text-center cursor-pointer block"
            >
              Trocar Estado / Região
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLocationModal}
            title={`Tabela: ${currentLocation.uf} (${currentLocation.priceMultiplier}x)`}
            className="w-full flex items-center justify-center p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 transition-colors cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          </button>
        )}



        {/* Botão de colapsar/expandir em telas desktop */}
        {onToggleCollapse && (
          <div className="hidden md:flex justify-end mt-2">
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
              className="flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Recolher</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

    </div>
  );

  return (
    <>
      {/* 1. DESKTOP SIDEBAR (LATERAL ESQUERDA) */}
      <aside 
        className={`hidden md:flex flex-col shrink-0 border-r border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-16 h-[calc(100vh-4rem)] z-30 transition-all duration-200 ${
          isCollapsed ? 'w-18' : 'w-64'
        }`}
        id="desktop-left-sidebar"
      >
        {sidebarContent}
      </aside>

      {/* 2. MOBILE DRAWER (SLIDE-IN LATERAL ESQUERDA) */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop escuro com blur */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Gaveta lateral saindo da esquerda */}
          <div className="relative w-4/5 max-w-xs h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
