import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  AdminUser, 
  AdminMaterial, 
  AdminWorkType, 
  AdminUserWork, 
  AdminCalculation,
  SystemAuditLog, 
  AdminDashboardStats,
  UserType,
  SupportTicket,
  SupportTicketStatus
} from '../types';
import { ConstruTecLogo } from './ConstruTecLogo';
import { DEFAULT_CALCULATION_SETTINGS, type CalculationSettings } from '../services/calculationSettings';
import { DEFAULT_SYSTEM_SETTINGS, type SystemSettings } from '../services/systemSettings';
import { 
  ShieldCheck, 
  Users, 
  Hammer, 
  PackageCheck, 
  FileText, 
  History, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  Crown, 
  ArrowUpRight, 
  AlertCircle, 
  RefreshCw, 
  Building2, 
  Calendar, 
  Mail, 
  Phone, 
  Layers, 
  Check, 
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sliders,
  Eye,
  Lock,
  KeyRound,
  ArrowLeft,
  Database,
  FlaskConical,
  Download,
  Bot,
  LifeBuoy
} from 'lucide-react';

export type AdminTabKey = 'overview' | 'users' | 'workTypes' | 'materials' | 'works' | 'support' | 'history';

interface AdminDashboardProps {
  user: UserProfile;
  onExitAdmin: () => void;
  onViewWorkCalculation?: (work: AdminUserWork) => void;
  activeAdminTab?: AdminTabKey;
  onAdminTabChange?: (tab: AdminTabKey) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  onExitAdmin,
  onViewWorkCalculation,
  activeAdminTab: controlledTab,
  onAdminTabChange
}) => {
  const [internalAdminTab, setInternalAdminTab] = useState<AdminTabKey>('overview');
  const activeAdminTab = controlledTab ?? internalAdminTab;
  const setActiveAdminTab = (tab: AdminTabKey) => {
    setInternalAdminTab(tab);
    if (onAdminTabChange) onAdminTabChange(tab);
  };
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Stats State
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalUsuarios: 125,
    totalObras: 348,
    totalCalculos: 721,
    totalMateriais: 42,
    totalProprietarios: 1,
    totalAdms: 1,
    maxProprietarios: 5
  });

  // Data Stores
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [materialsList, setMaterialsList] = useState<AdminMaterial[]>([]);
  const [workTypesList, setWorkTypesList] = useState<AdminWorkType[]>([]);
  const [userWorksList, setUserWorksList] = useState<AdminUserWork[]>([]);
  const [calculationsList, setCalculationsList] = useState<AdminCalculation[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [ticketResponses, setTicketResponses] = useState<Record<string, string>>({});
  const [ticketStatuses, setTicketStatuses] = useState<Record<string, SupportTicketStatus>>({});
  const [auditLogsList, setAuditLogsList] = useState<SystemAuditLog[]>([]);

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'TODOS' | UserType>('TODOS');
  const [userStatusFilter, setUserStatusFilter] = useState<'TODOS' | 'ativo' | 'inativo'>('TODOS');

  const [materialSearch, setMaterialSearch] = useState('');
  const [historyActionFilter, setHistoryActionFilter] = useState<string>('TODAS');

  // Modals State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [selectedUserTypeToCreate, setSelectedUserTypeToCreate] = useState<'ADM' | 'ADM_MASTER' | 'PROPRIETARIO' | 'USUARIO'>(
    user.userType === 'ADM' ? 'USUARIO' : 'ADM'
  );
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState('ADM Geral');

  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<AdminMaterial | null>(null);
  const [materialForm, setMaterialForm] = useState({
    name: '',
    description: '',
    unit: 'unidade',
    price: 0,
    minQuantity: 10,
    status: 'ativo' as 'ativo' | 'inativo',
    category: 'Alvenaria'
  });

  const [workTypeModalOpen, setWorkTypeModalOpen] = useState(false);
  const [editingWorkType, setEditingWorkType] = useState<AdminWorkType | null>(null);
  const [workTypeForm, setWorkTypeForm] = useState({
    name: '',
    description: '',
    category: 'geral' as AdminWorkType['category'],
    defaultWaste: 10
  });

  const [inspectWork, setInspectWork] = useState<AdminUserWork | null>(null);

  // Status de Conexão com o Banco de Dados MySQL
  const [dbStatus, setDbStatus] = useState<{
    sucesso: boolean;
    mensagem: string;
    configuracao: { host: string; port: number; user: string; database: string };
    modo_armazenamento: string;
  } | null>(null);
  const [testingDb, setTestingDb] = useState(false);
  const [calculationSettings, setCalculationSettings] = useState<CalculationSettings>(DEFAULT_CALCULATION_SETTINGS);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);

  const checkDbStatus = async () => {
    try {
      const res = await fetch('/api/status-banco', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (error) {
      console.error('Não foi possível consultar o estado do banco:', error);
    }
  };

  const handleTestDbConnection = async () => {
    setTestingDb(true);
    try {
      const res = await fetch('/api/conectar-banco', { method: 'POST', headers: getAuthHeaders() });
      const data = await res.json();
      if (data.sucesso) {
        showNotification(data.mensagem);
      } else {
        showNotification(data.mensagem, true);
      }
      await checkDbStatus();
      await loadAdminData();
    } catch (err: any) {
      showNotification('Erro ao testar conexão com MySQL: ' + err.message, true);
    } finally {
      setTestingDb(false);
    }
  };

  // Authentication header with JWT token
  const getAuthHeaders = () => {
    const token = user.token || localStorage.getItem('construtec_jwt_token') || 'demo_token';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Carrega estatísticas e dados
  const loadAdminData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const headers = getAuthHeaders();

      // 1. Stats
      const statsRes = await fetch('/api/admin/stats', { headers });
      if (statsRes.ok) {
        const data = await statsRes.json();
        if (data.stats) setStats(data.stats);
        if (data.recentActivities) setAuditLogsList(data.recentActivities);
      }

      // 2. Users
      const usersRes = await fetch('/api/admin/usuarios', { headers });
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsersList(data);
      }

      // 3. Materials
      const matRes = await fetch('/api/admin/materiais', { headers });
      if (matRes.ok) {
        const data = await matRes.json();
        setMaterialsList(data);
      }

      // 4. Work types
      const wtRes = await fetch('/api/admin/tipos-obra', { headers });
      if (wtRes.ok) {
        const data = await wtRes.json();
        setWorkTypesList(data);
      }

      // 5. User Works
      const worksRes = await fetch('/api/admin/obras', { headers });
      if (worksRes.ok) {
        const data = await worksRes.json();
        setUserWorksList(data.obras || []);
      }

      const ticketsRes = await fetch('/api/admin/chamados', { headers });
      if (!ticketsRes.ok) {
        const data = await ticketsRes.json();
        setErrorMessage(data.message || data.error || 'Não foi possível carregar os chamados de suporte.');
      } else {
        setSupportTickets(await ticketsRes.json());
      }

      const calculationsRes = await fetch('/api/admin/calculos', { headers });
      if (!calculationsRes.ok) {
        const data = await calculationsRes.json();
        setErrorMessage(data.message || data.error || 'Não foi possível carregar o histórico de cálculos.');
      } else {
        setCalculationsList(await calculationsRes.json());
      }

      // 6. History
      const histRes = await fetch('/api/admin/historico', { headers });
      if (histRes.ok) {
        const data = await histRes.json();
        setAuditLogsList(data);
      }

      const settingsRes = await fetch('/api/calculation-settings');
      if (settingsRes.ok) setCalculationSettings(await settingsRes.json());
      const systemSettingsRes = await fetch('/api/system-settings');
      if (systemSettingsRes.ok) setSystemSettings(await systemSettingsRes.json());

      await checkDbStatus();
    } catch (err: any) {
      console.warn('Fallback para dados locais no Painel ADM:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    checkDbStatus();
  }, []);

  const handleSaveCalculationSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/admin/calculation-settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(calculationSettings)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Não foi possível salvar as fórmulas.');
      setCalculationSettings(data.settings);
      showNotification('Parâmetros do motor de cálculo atualizados.');
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Erro ao salvar fórmulas.', true);
    }
  };

  const handleSaveSystemSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(systemSettings)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Não foi possível salvar as configurações.');
      setSystemSettings(data.settings);
      showNotification('Configurações gerais atualizadas.');
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Erro ao salvar configurações.', true);
    }
  };

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  // Ações de Usuários
  const handleToggleUserStatus = async (targetUser: AdminUser) => {
    try {
      const res = await fetch(`/api/admin/usuarios/${targetUser.id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Falha ao alterar status');
      }
      showNotification(`Status de ${targetUser.name} alterado com sucesso!`);
      loadAdminData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteUser = async (targetUser: AdminUser) => {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o usuário "${targetUser.name}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/usuarios/${targetUser.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Falha ao excluir usuário');
      }
      showNotification(`Usuário ${targetUser.name} excluído com sucesso!`);
      loadAdminData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  const handleResetUserPassword = async (targetUser: AdminUser) => {
    if (!window.confirm(`Gerar uma senha temporária para ${targetUser.name}?`)) return;
    try {
      const response = await fetch(`/api/admin/usuarios/${targetUser.id}/reset-password`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Não foi possível redefinir a senha.');
      showNotification(`Senha temporária de ${targetUser.name}: ${data.temporaryPassword}`);
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Erro ao redefinir senha.', true);
    }
  };

  const handleEditUser = (targetUser: AdminUser) => {
    setEditingUser(targetUser);
    setSelectedUserTypeToCreate(targetUser.userType);
    setNewUserName(targetUser.name);
    setNewUserEmail(targetUser.email);
    setNewUserPassword('');
    setNewUserRole(targetUser.role);
    setNewUserPhone(targetUser.phone || '');
    setUserModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(editingUser ? `/api/admin/usuarios/${editingUser.id}` : '/api/admin/usuarios', {
        method: editingUser ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          ...(editingUser ? {} : { password: newUserPassword }),
          phone: newUserPhone,
          userType: isMaster ? selectedUserTypeToCreate : undefined,
          role: newUserRole
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Erro ao cadastrar usuário');
      }
      showNotification(editingUser ? 'Conta atualizada com sucesso!' : `${selectedUserTypeToCreate === 'ADM_MASTER' ? 'ADM Master' : selectedUserTypeToCreate} cadastrado com sucesso!`);
      setUserModalOpen(false);
      setEditingUser(null);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserPhone('');
      setNewUserRole('ADM Geral');
      loadAdminData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  // Ações de Materiais
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingMaterial ? `/api/admin/materiais/${editingMaterial.id}` : '/api/admin/materiais';
      const method = editingMaterial ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(materialForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Erro ao salvar material');
      }
      showNotification(
        data.persisted === false
          ? `Material ${materialForm.name} atualizado somente nesta execução. Conecte o MySQL para manter a alteração.`
          : `Material ${materialForm.name} salvo com sucesso!`
      );
      setMaterialModalOpen(false);
      setEditingMaterial(null);
      loadAdminData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  const handleToggleMaterialStatus = async (mat: AdminMaterial) => {
    try {
      const res = await fetch(`/api/admin/materiais/${mat.id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showNotification(`Status do insumo ${mat.name} atualizado!`);
        loadAdminData();
      }
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteMaterial = async (mat: AdminMaterial) => {
    if (!window.confirm(`Deseja remover o material "${mat.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/materiais/${mat.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showNotification(`Material ${mat.name} excluído!`);
        loadAdminData();
      }
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  // Ações de Tipos de Obra
  const handleToggleWorkTypeStatus = async (wt: AdminWorkType) => {
    try {
      const res = await fetch(`/api/admin/tipos-obra/${wt.id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showNotification(`Status de "${wt.name}" atualizado!`);
        loadAdminData();
      }
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  const handleModerateWork = async (work: AdminUserWork) => {
    const reason = isMaster ? '' : window.prompt('Informe o motivo da moderação:')?.trim() || '';
    if (!isMaster && !reason) return;
    if (!window.confirm(`Remover o relatório "${work.title}"? Esta ação não pode ser desfeita.`)) return;

    try {
      const response = await fetch(`/api/admin/obras/${work.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Não foi possível remover o relatório.');
      showNotification(`Relatório "${work.title}" removido.`);
      await loadAdminData();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Erro ao moderar relatório.', true);
    }
  };

  const handleModerateCalculation = async (calculation: AdminCalculation) => {
    const reason = isMaster ? '' : window.prompt('Informe o motivo da moderação:')?.trim() || '';
    if (!isMaster && !reason) return;
    if (!window.confirm(`Remover o cálculo #${calculation.id}? Esta ação não pode ser desfeita.`)) return;

    try {
      const response = await fetch(`/api/admin/calculos/${calculation.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Não foi possível remover o cálculo.');
      setCalculationsList((current) => current.filter((item) => item.id !== calculation.id));
      showNotification(`Cálculo #${calculation.id} removido.`);
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Erro ao moderar cálculo.', true);
    }
  };

  const handleUpdateSupportTicket = async (ticket: SupportTicket) => {
    const status = ticketStatuses[ticket.id] || ticket.status;
    const responseDraft = ticketResponses[ticket.id];
    const responseText = responseDraft ?? ticket.response ?? '';
    const responseChanged = responseDraft !== undefined && responseDraft.trim() !== (ticket.response || '');
    try {
      const response = await fetch(`/api/admin/chamados/${ticket.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status,
          ...(responseChanged ? { response: responseText.trim() } : {})
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Não foi possível atualizar o chamado.');
      setTicketResponses((current) => ({ ...current, [ticket.id]: data.response || '' }));
      setTicketStatuses((current) => ({ ...current, [ticket.id]: data.status }));
      showNotification(data.persisted === false
        ? 'Chamado atualizado apenas nesta execução. Conecte o MySQL para manter a resposta.'
        : 'Chamado atualizado com sucesso.');
      await loadAdminData();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Erro ao atualizar chamado.', true);
    }
  };

  const handleSaveWorkType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingWorkType ? `/api/admin/tipos-obra/${editingWorkType.id}` : '/api/admin/tipos-obra';
      const method = editingWorkType ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(workTypeForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Erro ao salvar tipo');
      }
      showNotification(`Tipo de construção salvo com sucesso!`);
      setWorkTypeModalOpen(false);
      setEditingWorkType(null);
      loadAdminData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  // Filtros aplicados
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesType = userTypeFilter === 'TODOS' || 
                        u.userType === userTypeFilter ||
                        ((userTypeFilter === 'ADM_MASTER' || userTypeFilter === 'PROPRIETARIO') && (u.userType === 'ADM_MASTER' || u.userType === 'PROPRIETARIO'));
    const matchesStatus = userStatusFilter === 'TODOS' || (userStatusFilter === 'ativo' ? u.active : !u.active);
    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredMaterials = materialsList.filter(m => {
    return m.name.toLowerCase().includes(materialSearch.toLowerCase()) ||
           m.category.toLowerCase().includes(materialSearch.toLowerCase()) ||
           m.unit.toLowerCase().includes(materialSearch.toLowerCase());
  });

  const filteredHistory = auditLogsList.filter(l => {
    if (historyActionFilter === 'TODAS') return true;
    return l.action === historyActionFilter;
  });

  const isMaster = user.userType === 'ADM_MASTER' || user.userType === 'PROPRIETARIO';
  const isOwner = isMaster;
  const activeMastersCount = usersList.filter(u => (u.userType === 'ADM_MASTER' || u.userType === 'PROPRIETARIO') && u.active).length || stats.totalProprietarios || 1;
  const activeOwnersCount = activeMastersCount;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 selection:bg-amber-500 selection:text-slate-950 font-sans transition-colors">
      
      {/* BARRA SUPERIOR DO PAINEL ADM - Fixada abaixo do Header (top-16) com z-20 para nunca sobrepor o menu principal */}
      <div className="sticky top-16 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <ConstruTecLogo size="sm" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                Painel de Gestão
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 hidden sm:flex">
              <span>Administração & Auditoria do Sistema</span>
            </p>
          </div>
        </div>

        {/* LADO DIREITO: BADGE DE ROLE, BOTÃO DE MODO USUÁRIO */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Badge discreto */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px] leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                {isMaster ? 'Master' : 'Admin'}
              </span>
            </div>
          </div>

          {/* Botão de Atualizar Dados */}
          <button
            id="btn-refresh-admin"
            type="button"
            onClick={loadAdminData}
            title="Atualizar dados do painel"
            disabled={loading}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500 dark:text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ALERTAS DE SUCESSO / ERRO */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-900/40 border border-red-500/50 text-red-200 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-900/40 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* CONTEÚDO PRINCIPAL DAS ABAS DO PAINEL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">

        {/* ------------------------------------------------------------- */}
        {/* ABA: DASHBOARD GERAL / PAINEL ADMINISTRATIVO */}
        {/* ------------------------------------------------------------- */}
        {activeAdminTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Banner de Boas-Vindas */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/80 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                  Controle Central ConstruTec
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Painel de Gestão e Monitoramento
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Gerenciamento integral de usuários, tipos de construção, materiais com estoque mínimo e visualização de obras com auditoria em tempo real.
                </p>
              </div>

              {isOwner && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="btn-quick-new-adm"
                    type="button"
                    onClick={() => {
                      setSelectedUserTypeToCreate('ADM');
                      setNewUserRole('ADM Geral');
                      setUserModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar ADM</span>
                  </button>

                  <button
                    id="btn-quick-new-owner"
                    type="button"
                    disabled={activeMastersCount >= 5}
                    onClick={() => {
                      setSelectedUserTypeToCreate('ADM_MASTER');
                      setNewUserRole('ADM Master Geral');
                      setUserModalOpen(true);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                      activeMastersCount >= 5
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 cursor-pointer'
                    }`}
                    title={activeMastersCount >= 5 ? 'Limite máximo de 5 ADM Masters atingido' : 'Adicionar novo ADM Master (máx 5)'}
                  >
                    <Crown className="w-4 h-4" />
                    <span>Novo ADM Master ({activeMastersCount}/5)</span>
                  </button>
                </div>
              )}
            </div>

            {/* CARD DE STATUS DO BANCO DE DADOS MYSQL */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                  dbStatus?.sucesso
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30'
                    : 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30'
                }`}>
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Banco de Dados MySQL (Host: {dbStatus?.configuracao?.host || 'localhost'}:{dbStatus?.configuracao?.port || 3306})
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      dbStatus?.sucesso
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    }`}>
                      {dbStatus?.sucesso ? 'MySQL Relacional Ativo' : 'Armazenamento Seguro'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {dbStatus?.mensagem || `Configurado para ${dbStatus?.configuracao?.user || 'root'}@${dbStatus?.configuracao?.host || 'localhost'}:${dbStatus?.configuracao?.port || 3306} no banco '${dbStatus?.configuracao?.database || 'construtec'}'.`}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Scripts prontos: <code className="text-amber-600 dark:text-amber-400 font-mono">database/create_tables.sql</code> e <code className="text-amber-600 dark:text-amber-400 font-mono">database/admin_migration.sql</code>
                  </p>
                </div>
              </div>

              <button
                id="btn-test-db-connection"
                type="button"
                onClick={handleTestDbConnection}
                disabled={testingDb}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingDb ? 'animate-spin text-amber-500 dark:text-amber-400' : ''}`} />
                <span>{testingDb ? 'Testando Conexão...' : 'Testar Conexão com o Banco'}</span>
              </button>
            </div>

            <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white">Configurações gerais</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nome e termos de uso podem ser alterados pelo ADM Master. Integrações e faturamento não estão habilitados nesta instalação.
              </p>
              <form onSubmit={handleSaveSystemSettings} className="space-y-3">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Nome do sistema
                  <input value={systemSettings.systemName} maxLength={80} minLength={2} required disabled={!isMaster}
                    onChange={(event) => setSystemSettings({ ...systemSettings, systemName: event.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 disabled:opacity-60" />
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Termos de uso
                  <textarea value={systemSettings.termsOfUse} maxLength={10000} rows={3} required disabled={!isMaster}
                    onChange={(event) => setSystemSettings({ ...systemSettings, termsOfUse: event.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 disabled:opacity-60" />
                </label>
                {isMaster && <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold">
                  Salvar configurações
                </button>}
              </form>
            </section>

            {/* CARD DO GUIA ÚNICO DE APRESENTAÇÃO DO SISTEMA */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Guia Completo do Sistema
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 uppercase">
                      NOVO
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Tecnologias, funcionamento, fluxo de dados, organização do código e roteiro de apresentação em um único documento.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <a
                  href="/api/docs/download"
                  download="GUIA_COMPLETO_CONSTRUTEC.md"
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Guia (.md)</span>
                </a>
                <a
                  href="/api/docs/download"
                  download="GUIA_COMPLETO_CONSTRUTEC.md"
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors whitespace-nowrap"
                >
                  Markdown (.md)
                </a>
              </div>
            </div>

            {/* 4 CARDS PRINCIPAIS SOLICITADOS NA ESPECIFICAÇÃO */}
            {/* Usuários cadastrados: 125 | Obras cadastradas: 348 | Cálculos realizados: 721 | Materiais cadastrados: 42 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Usuários cadastrados */}
              <div 
                onClick={() => setActiveAdminTab('users')}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Usuários cadastrados</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {stats.totalUsuarios}
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">{activeMastersCount} ADM Masters</span>
                  <span>•</span>
                  <span>{stats.totalAdms} ADMs</span>
                </div>
              </div>

              {/* Card 2: Obras cadastradas */}
              <div 
                onClick={() => setActiveAdminTab('works')}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Obras cadastradas</span>
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {stats.totalObras}
                </div>
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Titularidade individual por usuário
                </div>
              </div>

              {/* Card 3: Cálculos realizados */}
              <div 
                onClick={() => setActiveAdminTab('works')}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Cálculos realizados</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {stats.totalCalculos}
                </div>
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  Quantitativos e orçamentos emitidos
                </div>
              </div>

              {/* Card 4: Materiais cadastrados */}
              <div 
                onClick={() => setActiveAdminTab('materials')}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Materiais cadastrados</span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {stats.totalMateriais}
                </div>
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  Preços base e estoque mínimo
                </div>
              </div>

            </div>

            {/* GRID INFERIOR: OBRAS RECENTES + ÚLTIMAS ATIVIDADES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Obras Recentes com formato Usuário | Obra | Tipo */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>Obras Recentes dos Usuários</span>
                  </h3>
                  <button
                    onClick={() => setActiveAdminTab('works')}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Ver todas <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {userWorksList.slice(0, 5).map((obra) => (
                    <div 
                      key={obra.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white truncate">{obra.title}</span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                            {obra.workTypeName}
                          </span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 flex items-center gap-2">
                          <span>Usuário: <strong className="text-slate-700 dark:text-slate-300">{obra.userName}</strong></span>
                          <span>•</span>
                          <span>{obra.locationCity || 'SP'}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          R$ {obra.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                          {obra.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Últimas Atividades do Sistema (Auditoria em Tempo Real) */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                    <span>Últimas Atividades no Sistema</span>
                  </h3>
                  <button
                    onClick={() => setActiveAdminTab('history')}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Auditoria completa <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {auditLogsList.slice(0, 5).map((log) => (
                    <div 
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-amber-700 dark:text-amber-400 text-[11px] px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 font-mono">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 mt-1 text-xs leading-relaxed">
                        {log.description}
                      </p>
                      <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                        <span>Por: {log.userName}</span>
                        <span>•</span>
                        <span className="uppercase text-slate-500 dark:text-slate-400 font-semibold">{log.userType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ABA 1: GESTÃO DE USUÁRIOS E EQUIPE */}
        {/* ------------------------------------------------------------- */}
        {activeAdminTab === 'users' && (
          <div className="space-y-4">
            
            {/* Header da seção de Usuários */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-800 border border-slate-700">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <span>Gestão de Usuários e Equipe</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualizar, pesquisar, ativar/desativar e identificar papéis (Usuário, ADM ou ADM Master).
                </p>
              </div>

              {/* Botões exclusivos do ADM Master */}
              {isMaster ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null);
                      setSelectedUserTypeToCreate('USUARIO');
                      setNewUserRole('cliente');
                      setUserModalOpen(true);
                    }}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Usuário
                  </button>
                  <button
                    id="btn-create-adm"
                    type="button"
                    onClick={() => {
                      setEditingUser(null);
                      setSelectedUserTypeToCreate('ADM');
                      setNewUserRole('ADM Geral');
                      setUserModalOpen(true);
                    }}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar ADM</span>
                  </button>

                  <button
                    id="btn-create-owner"
                    type="button"
                    disabled={activeMastersCount >= 5}
                    onClick={() => {
                      setEditingUser(null);
                      setSelectedUserTypeToCreate('ADM_MASTER');
                      setNewUserRole('ADM Master Geral');
                      setUserModalOpen(true);
                    }}
                    className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeMastersCount >= 5
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/40 cursor-pointer'
                    }`}
                    title={activeMastersCount >= 5 ? 'Limite máximo de 5 ADM Masters atingido' : 'Cadastrar ADM Master'}
                  >
                    <Crown className="w-4 h-4" />
                    <span>Cadastrar ADM Master ({activeMastersCount}/5)</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/70 border border-blue-500/30 text-blue-300 text-xs">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span>Nível 2 (ADM): Suporte a usuários finais</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null);
                      setSelectedUserTypeToCreate('USUARIO');
                      setNewUserRole('cliente');
                      setUserModalOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Cadastrar usuário
                  </button>
                </div>
              )}
            </div>

            {/* Barra de Busca e Filtros de Usuários */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="input-search-users"
                  type="text"
                  placeholder="Pesquisar por nome ou e-mail..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <select
                  id="select-filter-user-type"
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-amber-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="TODOS">Todos os tipos (ADM Master, ADM, Usuário)</option>
                  <option value="ADM_MASTER">Somente ADM MASTER</option>
                  <option value="ADM">Somente ADM</option>
                  <option value="USUARIO">Somente Usuário comum</option>
                </select>
              </div>

              <div>
                <select
                  id="select-filter-user-status"
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-amber-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="TODOS">Todos os status (Ativos e Inativos)</option>
                  <option value="ativo">Apenas Ativos</option>
                  <option value="inativo">Apenas Inativos</option>
                </select>
              </div>
            </div>

            {/* TABELA DE USUÁRIOS */}
            <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-800/80 shadow-md">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Usuário / Identificação</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Cargo / Perfil</th>
                    <th className="py-3 px-4">Data Cadastro</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Nenhum usuário encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isTargetMaster = u.userType === 'ADM_MASTER' || u.userType === 'PROPRIETARIO';
                      const isTargetAdm = u.userType === 'ADM';

                      return (
                        <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden">
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                                ) : (
                                  u.name.charAt(0)
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{u.name}</span>
                                <span className="text-[11px] text-slate-400">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {isTargetMaster ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <Crown className="w-3 h-3 text-amber-400" />
                                ADM MASTER
                              </span>
                            ) : isTargetAdm ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                <ShieldCheck className="w-3 h-3 text-sky-400" />
                                ADM
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-700 text-slate-300">
                                USUÁRIO
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-300 font-medium">
                            {isTargetMaster 
                              ? (u.role === 'proprietario' || u.role === 'gestor' || !u.role ? 'ADM Master Geral' : u.role)
                              : isTargetAdm 
                                ? (u.role === 'engenheiro' ? 'ADM Técnico / Obras' : (u.role || 'ADM Geral'))
                                : 'Usuário'}
                          </td>

                          <td className="py-3 px-4 text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                          </td>

                          <td className="py-3 px-4">
                            {u.active ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                Ativo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-400 font-semibold text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                Inativo
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botão Ativar / Desativar com restrição de hierarquia */}
                              {!isMaster && (isTargetMaster || isTargetAdm) ? (
                                <span 
                                  className="p-1.5 rounded-lg text-slate-500 cursor-not-allowed" 
                                  title="Apenas o ADM Master tem permissão para alterar status de Administradores ou outros ADM Masters"
                                >
                                  <Lock className="w-4 h-4 text-slate-500" />
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleToggleUserStatus(u)}
                                  disabled={u.id === user.id}
                                  className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                    u.id === user.id
                                      ? 'text-slate-600 cursor-not-allowed'
                                      : u.active
                                        ? 'text-amber-400 hover:bg-amber-500/10'
                                        : 'text-emerald-400 hover:bg-emerald-500/10'
                                  }`}
                                  title={u.active ? 'Desativar usuário' : 'Ativar usuário'}
                                >
                                  {u.active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                </button>
                              )}

                              {(isMaster || (!isTargetMaster && !isTargetAdm)) && u.id !== user.id && (
                                <button
                                  onClick={() => handleResetUserPassword(u)}
                                  className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                                  title="Gerar senha temporária"
                                >
                                  <KeyRound className="w-4 h-4" />
                                </button>
                              )}

                              {(isMaster || (!isTargetMaster && !isTargetAdm)) && (
                                <button
                                  onClick={() => handleEditUser(u)}
                                  className="p-1.5 rounded-lg text-sky-400 hover:bg-sky-500/10 cursor-pointer"
                                  title="Editar conta"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}

                              {/* Botão Excluir Usuário (exclusivo do ADM Master) */}
                              {isMaster && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  disabled={u.id === user.id}
                                  className={`p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                                    u.id === user.id
                                      ? 'text-slate-600 cursor-not-allowed'
                                      : 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                                  }`}
                                  title="Excluir usuário"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ABA 2: TIPOS DE CONSTRUÇÃO */}
        {/* ------------------------------------------------------------- */}
        {activeAdminTab === 'workTypes' && (
          <div className="space-y-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-800 border border-slate-700">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Hammer className="w-5 h-5 text-amber-400" />
                  <span>Tipos de Construção do Sistema</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adicione, edite ou desative tipos de obras como Muro, Parede, Piso, Pintura, Telhado, Revestimento, etc.
                </p>
              </div>

              {isMaster && <button
                id="btn-add-worktype"
                type="button"
                onClick={() => {
                  setEditingWorkType(null);
                  setWorkTypeForm({ name: '', description: '', category: 'geral', defaultWaste: 10 });
                  setWorkTypeModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Tipo de Obra</span>
              </button>}
            </div>

            <section className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-4">
              <div>
                <h4 className="font-bold text-white">Parâmetros do motor de cálculo</h4>
                <p className="text-xs text-slate-400 mt-1">
                  {isMaster
                    ? 'Apenas ADM Master pode alterar esses coeficientes globais. As alterações exigem MySQL ativo para serem persistidas.'
                    : 'Visualização: somente ADM Master pode alterar coeficientes e desperdícios padrão.'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Object.keys(calculationSettings.defaultWasteByWorkType) as Array<keyof CalculationSettings['defaultWasteByWorkType']>).map((type) => (
                  <label key={type} className="text-xs text-slate-300 space-y-1">
                    <span>Desperdício padrão — {type}</span>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" max="100" step="0.5" disabled={!isMaster}
                        value={calculationSettings.defaultWasteByWorkType[type]}
                        onChange={(event) => setCalculationSettings({
                          ...calculationSettings,
                          defaultWasteByWorkType: {
                            ...calculationSettings.defaultWasteByWorkType,
                            [type]: Number(event.target.value)
                          }
                        })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-60" />
                      <span>%</span>
                    </div>
                  </label>
                ))}
                <label className="text-xs text-slate-300 space-y-1">
                  <span>Blocos de concreto por m²</span>
                  <input type="number" min="1" max="100" step="0.1" disabled={!isMaster}
                    value={calculationSettings.masonryUnitsPerM2.concreteBlock}
                    onChange={(event) => setCalculationSettings({
                      ...calculationSettings,
                      masonryUnitsPerM2: { ...calculationSettings.masonryUnitsPerM2, concreteBlock: Number(event.target.value) }
                    })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-60" />
                </label>
                <label className="text-xs text-slate-300 space-y-1">
                  <span>Tijolos cerâmicos por m²</span>
                  <input type="number" min="1" max="200" step="0.1" disabled={!isMaster}
                    value={calculationSettings.masonryUnitsPerM2.ceramicBrick}
                    onChange={(event) => setCalculationSettings({
                      ...calculationSettings,
                      masonryUnitsPerM2: { ...calculationSettings.masonryUnitsPerM2, ceramicBrick: Number(event.target.value) }
                    })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-60" />
                </label>
              </div>
              {isMaster && (
                <button type="button" onClick={handleSaveCalculationSettings}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold">
                  Salvar parâmetros globais
                </button>
              )}
            </section>

            {/* Grid de Tipos de Construção */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workTypesList.map((wt) => (
                <div 
                  key={wt.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    wt.active 
                      ? 'bg-slate-800/90 border-slate-700' 
                      : 'bg-slate-900/60 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                        <Hammer className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">{wt.name}</h4>
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          Categoria: {wt.category}
                        </span>
                      </div>
                    </div>

                    {/* Toggle de Ativo/Inativo */}
                    <button
                      onClick={() => handleToggleWorkTypeStatus(wt)}
                      disabled={!isMaster}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${isMaster ? 'cursor-pointer' : 'cursor-default'} ${
                        wt.active
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}
                    >
                      {wt.active ? 'Ativo' : 'Desativado'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    {wt.description || 'Sem descrição cadastrada.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                    <span>Perda padrão: <strong className="text-amber-400">{wt.defaultWaste}%</strong></span>
                    {isMaster && <button
                      onClick={() => {
                        setEditingWorkType(wt);
                        setWorkTypeForm({
                          name: wt.name,
                          description: wt.description,
                          category: wt.category,
                          defaultWaste: wt.defaultWaste
                        });
                        setWorkTypeModalOpen(true);
                      }}
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Editar
                    </button>}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ABA 3: MATERIAIS */}
        {/* ------------------------------------------------------------- */}
        {activeAdminTab === 'materials' && (
          <div className="space-y-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-800 border border-slate-700">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-amber-400" />
                  <span>Cadastro e Controle de Materiais</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gerencie insumos essenciais: Material, Descrição, Unidade, Preço, Quantidade mínima e Status.
                </p>
              </div>

              <button
                id="btn-add-material"
                type="button"
                onClick={() => {
                  setEditingMaterial(null);
                  setMaterialForm({
                    name: '',
                    description: '',
                    unit: 'saco',
                    price: 40.00,
                    minQuantity: 10,
                    status: 'ativo',
                    category: 'Alvenaria'
                  });
                  setMaterialModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Material</span>
              </button>
            </div>

            {/* Barra de Busca de Materiais */}
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="input-search-materials"
                  type="text"
                  placeholder="Pesquisar material, categoria ou unidade (ex: cimento, tijolo, litro)..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* TABELA DE MATERIAIS */}
            <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-800/80 shadow-md">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Material / Insumo</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Unidade</th>
                    <th className="py-3 px-4">Preço Vigente</th>
                    <th className="py-3 px-4">Qtd. Mínima</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Nenhum material cadastrado ou encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((mat) => (
                      <tr key={mat.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-white block text-sm">{mat.name}</span>
                          <span className="text-[10px] text-amber-400 font-semibold uppercase">{mat.category}</span>
                        </td>

                        <td className="py-3 px-4 max-w-xs text-slate-300 truncate" title={mat.description}>
                          {mat.description || '—'}
                        </td>

                        <td className="py-3 px-4 font-mono font-medium text-slate-200">
                          {mat.unit}
                        </td>

                        <td className="py-3 px-4 font-bold text-emerald-400 text-sm">
                          R$ {mat.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-300">
                          {mat.minQuantity} {mat.unit}
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleMaterialStatus(mat)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                              mat.status === 'ativo'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-red-500/20 text-red-300 border-red-500/30'
                            }`}
                          >
                            {mat.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingMaterial(mat);
                                setMaterialForm({
                                  name: mat.name,
                                  description: mat.description,
                                  unit: mat.unit,
                                  price: mat.price,
                                  minQuantity: mat.minQuantity,
                                  status: mat.status,
                                  category: mat.category
                                });
                                setMaterialModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                              title="Editar Material"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteMaterial(mat)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 cursor-pointer"
                              title="Excluir Material"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ABA 4: OBRAS DOS USUÁRIOS */}
        {/* ------------------------------------------------------------- */}
        {activeAdminTab === 'works' && (
          <div className="space-y-4">
            
            <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>Obras Cadastradas pelos Usuários</span>
              </h3>
              <p className="text-xs text-amber-300/90 mt-1 leading-relaxed bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                <strong>Importante:</strong> Esta é uma visualização administrativa de acompanhamento técnico. A propriedade legal e técnica da obra continua sendo integralmente do usuário cadastrado.
              </p>
            </div>

            {/* TABELA DE OBRAS NO FORMATO SOLICITADO */}
            {/* Usuário | Obra | Tipo */}
            <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-800/80 shadow-md">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Usuário</th>
                    <th className="py-3 px-4">Obra</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Custo Estimado</th>
                    <th className="py-3 px-4">Local</th>
                    <th className="py-3 px-4">Data Cadastro</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {userWorksList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Nenhuma obra registrada pelos usuários no sistema.
                      </td>
                    </tr>
                  ) : (
                    userWorksList.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">
                          <div>
                            <span>{w.userName}</span>
                            <span className="block text-[10px] text-slate-400 font-normal">{w.userEmail}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-bold text-amber-300">
                          {w.title}
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-[11px]">
                            {w.workTypeName}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-bold text-emerald-400">
                          R$ {w.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-4 text-slate-300">
                          {w.locationCity ? `${w.locationCity}/${w.locationUf}` : 'SP'}
                        </td>

                        <td className="py-3 px-4 text-slate-400">
                          {new Date(w.createdAt).toLocaleDateString('pt-BR')}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setInspectWork(w)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspecionar</span>
                          </button>
                          <button
                            onClick={() => handleModerateWork(w)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                            title="Remover relatório por moderação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remover</span>
                          </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <section className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
              <div>
                <h3 className="font-bold text-white">Cálculos persistidos</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Histórico da API salvo no MySQL. A moderação exige motivo para ADM Normal.
                </p>
              </div>
              {calculationsList.length === 0 ? (
                <p className="text-xs text-slate-400">Nenhum cálculo persistido disponível.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="text-[10px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-2 pr-4">ID</th>
                        <th className="py-2 pr-4">Tipo de obra</th>
                        <th className="py-2 pr-4">Proprietário</th>
                        <th className="py-2 pr-4">Data</th>
                        <th className="py-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {calculationsList.map((calculation) => (
                        <tr key={calculation.id}>
                          <td className="py-2 pr-4 font-mono">{calculation.id}</td>
                          <td className="py-2 pr-4">{calculation.tipo_obra}</td>
                          <td className="py-2 pr-4">{calculation.owner_user_id || 'Não identificado'}</td>
                          <td className="py-2 pr-4">{new Date(calculation.criado_em).toLocaleString('pt-BR')}</td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => void handleModerateCalculation(calculation)}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1.5 font-semibold text-red-300 hover:bg-red-500/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

          </div>
        )}

        {activeAdminTab === 'support' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-white">
                <LifeBuoy className="h-5 w-5 text-amber-400" />
                Chamados de Suporte
              </h3>
              <p className="mt-1 text-xs text-slate-300">
                Analise as solicitações, responda ao usuário e atualize o status do atendimento.
              </p>
            </div>
            {supportTickets.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-600 p-6 text-center text-sm text-slate-400">
                Não há chamados registrados.
              </p>
            ) : supportTickets.map((ticket) => (
              <article key={ticket.id} className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/80 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white">{ticket.subject}</h4>
                    <p className="mt-1 text-xs text-slate-400">
                      {ticket.ownerName} · {ticket.ownerEmail} · {new Date(ticket.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-200">
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-900/70 p-3 text-sm text-slate-200">{ticket.message}</p>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Resposta ao usuário</span>
                  <textarea
                    rows={3}
                    maxLength={5000}
                    value={ticketResponses[ticket.id] ?? ticket.response ?? ''}
                    onChange={(event) => setTicketResponses((current) => ({ ...current, [ticket.id]: event.target.value }))}
                    className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                    placeholder="Escreva a orientação ou resposta..."
                  />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <select
                    value={ticketStatuses[ticket.id] || ticket.status}
                    onChange={(event) => setTicketStatuses((current) => ({
                      ...current,
                      [ticket.id]: event.target.value as SupportTicketStatus
                    }))}
                    className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-white"
                  >
                    <option value="aberto">Aberto</option>
                    <option value="em_atendimento">Em atendimento</option>
                    <option value="respondido">Respondido</option>
                    <option value="fechado">Fechado</option>
                  </select>
                  <button
                    onClick={() => void handleUpdateSupportTicket(ticket)}
                    className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
                  >
                    Salvar resposta e status
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ABA 5: HISTÓRICO DO SISTEMA (AUDITORIA) */}
        {/* ------------------------------------------------------------- */}
        {activeAdminTab === 'history' && (
          <div className="space-y-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-800 border border-slate-700">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-400" />
                  <span>Histórico e Auditoria de Ações do Sistema</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rastreabilidade de ações: LOGIN, CRIAR_CALCULO, EDITAR_OBRA, EXCLUIR_OBRA, CADASTRAR_USUARIO, EDITAR_MATERIAL, etc.
                </p>
              </div>

              {/* Filtro por tipo de Ação */}
              <div className="w-full sm:w-auto">
                <select
                  value={historyActionFilter}
                  onChange={(e) => setHistoryActionFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-amber-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="TODAS">Todas as ações</option>
                  <option value="LOGIN">LOGIN</option>
                  <option value="CRIAR_CALCULO">CRIAR_CALCULO</option>
                  <option value="EDITAR_OBRA">EDITAR_OBRA</option>
                  <option value="EXCLUIR_OBRA">EXCLUIR_OBRA</option>
                  <option value="CADASTRAR_USUARIO">CADASTRAR_USUARIO</option>
                  <option value="CADASTRAR_ADM">CADASTRAR_ADM</option>
                  <option value="CADASTRAR_PROPRIETARIO">CADASTRAR_PROPRIETARIO</option>
                  <option value="EDITAR_MATERIAL">EDITAR_MATERIAL</option>
                  <option value="CADASTRAR_MATERIAL">CADASTRAR_MATERIAL</option>
                </select>
              </div>
            </div>

            {/* LISTAGEM DE HISTÓRICO / AUDITORIA */}
            <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-800/80 shadow-md">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Ação Auditada</th>
                    <th className="py-3 px-4">Descrição do Evento</th>
                    <th className="py-3 px-4">Responsável</th>
                    <th className="py-3 px-4">Papel</th>
                    <th className="py-3 px-4">IP</th>
                    <th className="py-3 px-4 text-right">Data & Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-mono text-[11px]">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                        Nenhum registro de auditoria encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                            {item.action}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-sans text-xs text-white max-w-md">
                          {item.description}
                        </td>

                        <td className="py-3 px-4 font-sans text-slate-300">
                          {item.userName}
                        </td>

                        <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-400">
                          {item.userType}
                        </td>

                        <td className="py-3 px-4 text-slate-400">
                          {item.ip || '127.0.0.1'}
                        </td>

                        <td className="py-3 px-4 text-right text-slate-400 font-sans text-[11px]">
                          {new Date(item.createdAt).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CADASTRAR ADM OU PROPRIETÁRIO (EXCLUSIVO PROPRIETÁRIO) */}
      {/* ------------------------------------------------------------- */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => { setUserModalOpen(false); setEditingUser(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                {selectedUserTypeToCreate === 'ADM_MASTER' || selectedUserTypeToCreate === 'PROPRIETARIO'
                  ? <Crown className="w-5 h-5" />
                  : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingUser ? 'Editar conta' : `Cadastrar ${selectedUserTypeToCreate === 'USUARIO' ? 'usuário final' : selectedUserTypeToCreate === 'ADM_MASTER' || selectedUserTypeToCreate === 'PROPRIETARIO' ? 'ADM Master' : 'ADM'}`}
                </h3>
                <p className="text-xs text-slate-400">
                  Operação administrativa restrita com registro em auditoria.
                </p>
              </div>
            </div>

            {!editingUser && (selectedUserTypeToCreate === 'ADM_MASTER' || selectedUserTypeToCreate === 'PROPRIETARIO') && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                <span className="font-bold">Regra de Segurança:</span> O sistema permite no máximo <strong>5 ADM Masters</strong> simultâneos. ADM Masters ativos no momento: <strong>{activeMastersCount} / 5</strong>.
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              {!editingUser && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Acesso</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button type="button" onClick={() => { setSelectedUserTypeToCreate('USUARIO'); setNewUserRole('cliente'); }}
                    className={`py-2 text-xs font-bold rounded-xl border ${selectedUserTypeToCreate === 'USUARIO' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                    Usuário final
                  </button>
                  {isMaster && (
                    <>
                      <button type="button" onClick={() => { setSelectedUserTypeToCreate('ADM'); setNewUserRole('ADM Geral'); }}
                        className={`py-2 text-xs font-bold rounded-xl border ${selectedUserTypeToCreate === 'ADM' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                        Administrador (ADM)
                      </button>
                      <button type="button" disabled={activeMastersCount >= 5}
                        onClick={() => { setSelectedUserTypeToCreate('ADM_MASTER'); setNewUserRole('ADM Master Geral'); }}
                        className={`py-2 text-xs font-bold rounded-xl border ${activeMastersCount >= 5 ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed' : selectedUserTypeToCreate === 'ADM_MASTER' || selectedUserTypeToCreate === 'PROPRIETARIO' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                        ADM Master ({activeMastersCount}/5)
                      </button>
                    </>
                  )}
                </div>
              </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome completo</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  placeholder="Ex: Carlos Albuquerque"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail de acesso</label>
                <input
                  type="email"
                  required
                  placeholder="email@construtec.com.br"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              {!editingUser && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Senha Exclusiva de Acesso (Mínimo 6 caracteres)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Defina a senha única..."
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              {!editingUser && selectedUserTypeToCreate === 'ADM' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Selecione o tipo de ADM
                </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="ADM Geral">ADM Geral (Gestão Plena de Obras e Operações)</option>
                    <option value="ADM Técnico / Obras">ADM Técnico / Obras (Engenharia, Traços e Cálculos)</option>
                    <option value="ADM de Suprimentos">ADM de Suprimentos (Insumos, Preços e Materiais)</option>
                    <option value="ADM Financeiro">ADM Financeiro (Orçamentos, Custos e Relatórios)</option>
                    <option value="ADM Moderador">ADM Moderador (Auditoria e Controle de Usuários)</option>
                  </select>
              </div>
              )}
              {!editingUser && selectedUserTypeToCreate === 'ADM_MASTER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Especialidade do ADM Master</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="ADM Master Geral">ADM Master Geral (Controle Total & Gestão de Administradores)</option>
                  </select>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  {editingUser ? 'Salvar alterações' : `Confirmar cadastro de ${selectedUserTypeToCreate === 'USUARIO' ? 'usuário' : selectedUserTypeToCreate}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADICIONAR / EDITAR MATERIAL */}
      {/* ------------------------------------------------------------- */}
      {materialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => setMaterialModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingMaterial ? 'Editar Material' : 'Cadastrar Novo Material'}
                </h3>
                <p className="text-xs text-slate-400">
                  Defina nome, descrição, unidade, preço e quantidade mínima.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Material</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cimento Portland CP-II, Tijolo, Tinta..."
                  value={materialForm.name}
                  onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Descreva a finalidade técnica e especificação..."
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unidade</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: saco, litro, unidade, m²"
                    value={materialForm.unit}
                    onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Preço Base (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 42.00"
                    value={materialForm.price}
                    onChange={(e) => setMaterialForm({ ...materialForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Qtd. Mínima (Estoque / Alerta)</label>
                  <input
                    type="number"
                    required
                    value={materialForm.minQuantity}
                    onChange={(e) => setMaterialForm({ ...materialForm, minQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={materialForm.status}
                    onChange={(e) => setMaterialForm({ ...materialForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  Salvar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADICIONAR / EDITAR TIPO DE CONSTRUÇÃO */}
      {/* ------------------------------------------------------------- */}
      {workTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => setWorkTypeModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Hammer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingWorkType ? 'Editar Tipo de Obra' : 'Adicionar Tipo de Obra'}
                </h3>
                <p className="text-xs text-slate-400">
                  Ex: Muro, Parede, Piso, Pintura, Telhado, Revestimento, etc.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveWorkType} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Tipo de Construção</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Telhado Colonial, Contrapiso Nivelador..."
                  value={workTypeForm.name}
                  onChange={(e) => setWorkTypeForm({ ...workTypeForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição Técnica</label>
                <textarea
                  rows={2}
                  placeholder="Descreva o método executivo..."
                  value={workTypeForm.description}
                  onChange={(e) => setWorkTypeForm({ ...workTypeForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria</label>
                  <select
                    value={workTypeForm.category}
                    onChange={(e) => setWorkTypeForm({ ...workTypeForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="alvenaria">Alvenaria</option>
                    <option value="acabamento">Acabamento</option>
                    <option value="estrutural">Estrutural</option>
                    <option value="cobertura">Cobertura</option>
                    <option value="geral">Geral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Desperdício Padrão (%)</label>
                  <input
                    type="number"
                    required
                    value={workTypeForm.defaultWaste}
                    onChange={(e) => setWorkTypeForm({ ...workTypeForm, defaultWaste: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  Salvar Tipo de Obra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: INSPECIONAR OBRA (VISUALIZAÇÃO ADMINISTRATIVA AUDITÁVEL) */}
      {/* ------------------------------------------------------------- */}
      {inspectWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => setInspectWork(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Inspeção Administrativa de Obra
                </h3>
                <p className="text-xs text-amber-400">
                  Proprietário da obra: <strong>{inspectWork.userName}</strong> ({inspectWork.userEmail})
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Título do Projeto:</span>
                <span className="font-bold text-white">{inspectWork.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tipo de Construção:</span>
                <span className="font-bold text-amber-400">{inspectWork.workTypeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Valor Total Estimado:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  R$ {inspectWork.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Localidade de Referência:</span>
                <span className="text-white">{inspectWork.locationCity || 'São Paulo'} - {inspectWork.locationUf || 'SP'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Data de Registro:</span>
                <span className="text-white">{new Date(inspectWork.createdAt).toLocaleString('pt-BR')}</span>
              </div>
            </div>

            {inspectWork.calculationResult && inspectWork.calculationResult.materials && (
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Lista de Insumos Dimensionados
                </h4>
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden text-xs">
                  {inspectWork.calculationResult.materials.map((m, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-850 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-medium text-white block">{m.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {m.quantityCommercial} {m.commercialPackageDescription || m.unit}
                        </span>
                      </div>
                      <span className="font-bold text-emerald-400">
                        R$ {m.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectWork(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Fechar Inspeção
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
