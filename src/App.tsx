import React, { useState, useEffect } from 'react';
import { 
  WorkTypeKey, 
  CalculationResult, 
  RegionalLocation, 
  UserProfile, 
  SavedBudget,
  ThemeMode 
} from './types';
import { REGIONAL_LOCATIONS } from './data/catalog';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ConstruTecLogo } from './components/ConstruTecLogo';
import { Hero } from './components/Hero';
import { Calculator } from './components/Calculator';
import { BudgetList } from './components/BudgetList';
import { MaterialsCatalog } from './components/MaterialsCatalog';
import { AboutPage } from './components/AboutPage';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { RegionalLocationModal } from './components/RegionalLocationModal';
import { PrintBudgetModal } from './components/PrintBudgetModal';
import { AuthGuard } from './guards/AuthGuard';
import { AuthService } from './services/auth.service';
import { HardHat, ShieldCheck, Heart, Mail, Phone, MapPin, Calculator as CalcIcon, FlaskConical } from 'lucide-react';

export default function App() {
  // Theme State (Modo Claro / Escuro)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('construtec_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('construtec_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // User Authentication State - Recuperado via AuthService
  const [user, setUser] = useState<UserProfile | null>(() => {
    return AuthService.getCurrentUser();
  });

  const [activeTab, setActiveTab] = useState<'home' | 'calculator' | 'budgets' | 'materials' | 'about' | 'dashboard' | 'admin'>(() => {
    const u = AuthService.getCurrentUser();
    if (u && (u.userType === 'ADM' || u.userType === 'ADM_MASTER' || u.userType === 'PROPRIETARIO')) {
      return 'admin';
    }
    return 'home';
  });

  const [selectedWorkType, setSelectedWorkType] = useState<WorkTypeKey>('muro');
  const [isUserTestMode, setIsUserTestMode] = useState<boolean>(false);
  const [adminSubTab, setAdminSubTab] = useState<'overview' | 'users' | 'workTypes' | 'materials' | 'works' | 'history'>('overview');

  // Regional Location State
  const [currentLocation, setCurrentLocation] = useState<RegionalLocation>(() => {
    const saved = localStorage.getItem('construtec_location');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return REGIONAL_LOCATIONS[0]; // SP default
  });

  // Saved Budgets State
  const [budgets, setBudgets] = useState<SavedBudget[]>(() => {
    const saved = localStorage.getItem('construtec_budgets');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  // Modals state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState<string | undefined>();
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [printModalData, setPrintModalData] = useState<{
    isOpen: boolean;
    result: CalculationResult | null;
    title: string;
    clientName?: string;
  }>({
    isOpen: false,
    result: null,
    title: '',
    clientName: ''
  });

  // Sync to API on mount to load sample or backend budgets
  useEffect(() => {
    fetch('/api/orcamentos')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0 && budgets.length === 0) {
          setBudgets(data);
        }
      })
      .catch(() => {
        // Fallback local ok
      });
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('construtec_location', JSON.stringify(currentLocation));
  }, [currentLocation]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('construtec_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('construtec_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('construtec_budgets', JSON.stringify(budgets));
  }, [budgets]);

  // Handlers
  const handleSelectWorkTypeFromHero = (type: WorkTypeKey) => {
    setSelectedWorkType(type);
    setActiveTab('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuthWithMessage = (msg?: string) => {
    setAuthModalMessage(msg);
    setAuthModalOpen(true);
  };

  const handleEnterUserTestMode = () => {
    setIsUserTestMode(true);
    setActiveTab('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitUserTestMode = () => {
    setIsUserTestMode(false);
    setActiveTab('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (newUser: UserProfile) => {
    setUser(newUser);
    // Redireciona ADMs e ADM Masters diretamente para o Painel Administrativo com modo de teste desligado
    if (newUser.userType === 'ADM' || newUser.userType === 'ADM_MASTER' || newUser.userType === 'PROPRIETARIO') {
      setIsUserTestMode(false);
      setActiveTab('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
    setIsUserTestMode(false);
    setActiveTab('home');
  };

  const handleSaveBudgetSuccess = (newBudget: SavedBudget) => {
    setBudgets((prev) => [newBudget, ...prev]);
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    fetch(`/api/orcamentos/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleViewBudget = (budget: SavedBudget) => {
    setSelectedWorkType(budget.workType);
    setActiveTab('calculator');
  };

  const handlePrintFromCalculator = (result: CalculationResult, title: string, clientName?: string) => {
    if (!user || !user.isLoggedIn) {
      handleOpenAuthWithMessage('Como regra de negócio, faça login para gerar, visualizar ou imprimir relatórios.');
      return;
    }
    setPrintModalData({
      isOpen: true,
      result,
      title,
      clientName
    });
  };

  const handlePrintFromBudgetList = (budget: SavedBudget) => {
    if (!user || !user.isLoggedIn) {
      handleOpenAuthWithMessage('Como regra de negócio, faça login para gerar, visualizar ou imprimir relatórios.');
      return;
    }
    setPrintModalData({
      isOpen: true,
      result: budget.calculationResult,
      title: budget.title,
      clientName: budget.clientName
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950 transition-colors">
      
      {/* HEADER PRINCIPAL */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => handleOpenAuthWithMessage()}
        onLogout={handleLogout}
        currentLocation={currentLocation}
        onOpenLocationModal={() => setLocationModalOpen(true)}
        savedBudgetsCount={budgets.length}
        onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        onOpenChangePassword={() => setChangePasswordModalOpen(true)}
        isUserTestMode={isUserTestMode}
        onEnterUserTestMode={handleEnterUserTestMode}
        onExitUserTestMode={handleExitUserTestMode}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* CONTAINER COM SIDEBAR NA LATERAL ESQUERDA + CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex w-full">
        {/* NAVEGAÇÃO NA LATERAL ESQUERDA */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          savedBudgetsCount={budgets.length}
          user={user}
          selectedWorkType={selectedWorkType}
          onSelectWorkType={(wt) => {
            setSelectedWorkType(wt);
            setActiveTab('calculator');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isMobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          currentLocation={currentLocation}
          onOpenLocationModal={() => setLocationModalOpen(true)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          isUserTestMode={isUserTestMode}
          onEnterUserTestMode={handleEnterUserTestMode}
          onExitUserTestMode={handleExitUserTestMode}
          adminSubTab={adminSubTab}
          onSelectAdminSubTab={setAdminSubTab}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* COLUNA PRINCIPAL COM CONTEÚDO E FOOTER */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* CONTEÚDO PRINCIPAL RENDERIZADO POR TAB */}
          <main className="flex-1">
        {activeTab === 'home' && (
          <Hero
            onSelectWorkType={handleSelectWorkTypeFromHero}
            onGoToBudgets={() => setActiveTab('budgets')}
            onGoToCalculator={() => setActiveTab('calculator')}
          />
        )}

        {activeTab === 'calculator' && (
          <AuthGuard user={user} onOpenAuth={handleOpenAuthWithMessage}>
            <Calculator
              initialWorkType={selectedWorkType}
              location={currentLocation}
              user={user}
              onOpenAuth={handleOpenAuthWithMessage}
              onSaveBudgetSuccess={handleSaveBudgetSuccess}
              onPrintBudget={handlePrintFromCalculator}
            />
          </AuthGuard>
        )}

        {activeTab === 'budgets' && (
          <AuthGuard user={user} onOpenAuth={handleOpenAuthWithMessage}>
            <BudgetList
              budgets={budgets}
              user={user}
              onOpenAuth={() => handleOpenAuthWithMessage('Faça login com seu e-mail para salvar histórico e emitir relatórios.')}
              onDeleteBudget={handleDeleteBudget}
              onViewBudget={handleViewBudget}
              onPrintBudget={handlePrintFromBudgetList}
              onNewBudget={() => {
                setActiveTab('calculator');
              }}
            />
          </AuthGuard>
        )}

        {activeTab === 'materials' && (
          <MaterialsCatalog
            location={currentLocation}
            onOpenLocationModal={() => setLocationModalOpen(true)}
          />
        )}

        {activeTab === 'about' && (
          <AboutPage />
        )}

        {activeTab === 'dashboard' && (
          <AuthGuard user={user} onOpenAuth={handleOpenAuthWithMessage}>
            <Dashboard
              budgets={budgets}
              user={user}
              location={currentLocation}
              onGoToCalculator={() => setActiveTab('calculator')}
              onGoToBudgets={() => setActiveTab('budgets')}
              onGoToMaterials={() => setActiveTab('materials')}
              onViewBudget={handleViewBudget}
            />
          </AuthGuard>
        )}

        {/* PAINEL ADMINISTRATIVO COM HIERARQUIA ESTREITA (ADM & ADM MASTER) */}
        {activeTab === 'admin' && (
          <AuthGuard user={user} requireAdmin={true} onOpenAuth={handleOpenAuthWithMessage}>
            {user && (user.userType === 'ADM' || user.userType === 'ADM_MASTER' || user.userType === 'PROPRIETARIO') && (
              <AdminDashboard
                user={user}
                onExitAdmin={handleEnterUserTestMode}
                activeAdminTab={adminSubTab}
                onAdminTabChange={setAdminSubTab}
                onViewWorkCalculation={(work) => {
                  handleEnterUserTestMode();
                  if (work.workType) {
                    setSelectedWorkType(work.workType as WorkTypeKey);
                  }
                }}
              />
            )}
          </AuthGuard>
        )}
      </main>

      {/* FOOTER OFICIAL CONSTRUTEC */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 pt-12 pb-8 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-800">
            
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <ConstruTecLogo size="sm" />
                <span className="text-xl font-extrabold tracking-tight">
                  Constru<span className="text-amber-400">Tec</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
                Plataforma inteligente para pessoas e profissionais da construção civil calcularem com precisão materiais, perdas e custos de obras e reformas.
              </p>
              <p className="text-xs font-mono font-bold text-amber-400">
                "Calcule com precisão, construa com economia."
              </p>
            </div>

            <div className="md:col-span-2 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Módulos
              </span>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li><button onClick={() => { setSelectedWorkType('muro'); setActiveTab('calculator'); }} className="hover:text-white">Muros & Alvenaria</button></li>
                <li><button onClick={() => { setSelectedWorkType('piso'); setActiveTab('calculator'); }} className="hover:text-white">Pisos & Porcelanato</button></li>
                <li><button onClick={() => { setSelectedWorkType('pintura'); setActiveTab('calculator'); }} className="hover:text-white">Pintura Residencial</button></li>
                <li><button onClick={() => { setSelectedWorkType('concreto'); setActiveTab('calculator'); }} className="hover:text-white">Concreto Estrutural</button></li>
                <li><button onClick={() => { setSelectedWorkType('telhado'); setActiveTab('calculator'); }} className="hover:text-white">Telhados & Coberturas</button></li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Recursos
              </span>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li><button onClick={() => setActiveTab('budgets')} className="hover:text-white">Meus Orçamentos</button></li>
                <li><button onClick={() => setActiveTab('materials')} className="hover:text-white">Catálogo de Insumos</button></li>
                <li><button onClick={() => setActiveTab('about')} className="hover:text-white">Metodologia Técnica</button></li>
                <li><button onClick={() => setLocationModalOpen(true)} className="hover:text-white">Tabelas Regionais SINAPI</button></li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Responsabilidade Técnica
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Estimativas baseadas em parâmetros das normas NBR 6118, NBR 13753 e tabelas de referência do SINAPI. Para projetos estruturais, consulte um profissional habilitado (CREA/CAU).
              </p>
            </div>

          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} ConstruTec. Todos os direitos reservados.</p>
            <p className="flex items-center gap-1">
              <span>Desenvolvido para engenheiros, mestres de obras e construtores</span>
            </p>
          </div>
        </div>
      </footer>
        </div>
      </div>

      {/* MODAL DE AUTENTICAÇÃO */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        message={authModalMessage}
      />

      {/* MODAL DE ALTERAÇÃO DE SENHA ÚNICA */}
      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        user={user}
      />

      {/* MODAL DE SELEÇÃO REGIONAL */}
      <RegionalLocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        currentLocation={currentLocation}
        onSelectLocation={(loc) => setCurrentLocation(loc)}
      />

      {/* MODAL DE IMPRESSÃO / PDF */}
      {printModalData.result && (
        <PrintBudgetModal
          isOpen={printModalData.isOpen}
          onClose={() => setPrintModalData((prev) => ({ ...prev, isOpen: false }))}
          result={printModalData.result}
          title={printModalData.title}
          clientName={printModalData.clientName}
          location={currentLocation}
        />
      )}

    </div>
  );
}
