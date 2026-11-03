import React, { useState } from 'react';
import { SavedBudget, UserProfile } from '../types';
import { 
  FileText, 
  Search, 
  Trash2, 
  Printer, 
  ExternalLink, 
  Calendar, 
  User, 
  MapPin, 
  Coins, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  Lock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface BudgetListProps {
  budgets: SavedBudget[];
  user: UserProfile | null;
  onOpenAuth: () => void;
  onDeleteBudget: (id: string) => void;
  onViewBudget: (budget: SavedBudget) => void;
  onPrintBudget: (budget: SavedBudget) => void;
  onNewBudget: () => void;
}

export const BudgetList: React.FC<BudgetListProps> = ({
  budgets,
  user,
  onOpenAuth,
  onDeleteBudget,
  onViewBudget,
  onPrintBudget,
  onNewBudget
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // REGRA DE NEGÓCIO: Somente usuários logados podem visualizar o histórico e emitir relatórios
  if (!user || !user.isLoggedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 mb-6">
            <Lock className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/60 text-xs font-bold uppercase tracking-wider mb-2">
            Regra do Sistema • Acesso Restrito
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Faça login para salvar histórico e exibir relatórios
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto mt-3 leading-relaxed">
            Como regra de segurança e controle de dados da plataforma ConstruTec, o histórico de orçamentos e a emissão de relatórios técnicos completos só podem ser acessados por usuários com conta ativa.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto my-8 text-left">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-amber-600 dark:text-amber-400 font-bold text-sm block mb-1">1. Histórico na Nuvem</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">Salve seus orçamentos e acerte medidas a qualquer momento pelo celular ou computador.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-amber-600 dark:text-amber-400 font-bold text-sm block mb-1">2. Relatórios em PDF</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">Gere e imprima relatórios oficiais com memorial de cálculo, materiais e valores por estado.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-amber-600 dark:text-amber-400 font-bold text-sm block mb-1">3. Status de Obra</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">Acompanhe propostas em andamento, orçamentos aprovados e custos consolidados.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="btn-login-to-view-budgets"
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <User className="w-4 h-4" />
              <span>Entrar ou Criar Conta Grátis</span>
            </button>

            <button
              onClick={onNewBudget}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
            >
              Fazer Novo Cálculo
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredBudgets = budgets.filter((b) => {
    const matchesSearch = 
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.clientName && b.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      b.workTypeName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: SavedBudget['status']) => {
    switch (status) {
      case 'aprovado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Aprovado
          </span>
        );
      case 'em_andamento':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" /> Em Andamento
          </span>
        );
      case 'concluido':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Concluído
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3" /> Rascunho
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Orçamentos Salvos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gerencie, imprima ou edite os cálculos de materiais das suas obras.
          </p>
        </div>

        <button
          id="btn-new-budget-list"
          onClick={onNewBudget}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cálculo</span>
        </button>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            id="input-search-budgets"
            type="text"
            placeholder="Buscar por título ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
          />
        </div>

        {/* STATUS FILTER BUTTONS */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'rascunho', label: 'Rascunhos' },
            { id: 'aprovado', label: 'Aprovados' },
            { id: 'em_andamento', label: 'Em Andamento' },
            { id: 'concluido', label: 'Concluídos' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTAGEM OU EMPTY STATE */}
      {filteredBudgets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Nenhum orçamento encontrado</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'todos'
              ? 'Nenhum orçamento corresponde aos filtros selecionados. Tente ajustar os termos de busca.'
              : 'Você ainda não salvou nenhum orçamento. Utilize a calculadora para gerar sua primeira lista de materiais!'}
          </p>
          <button
            onClick={onNewBudget}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-xs hover:bg-amber-400 transition-colors cursor-pointer"
          >
            Calcular Minha Primeira Obra
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBudgets.map((budget) => (
            <div
              key={budget.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {budget.workTypeName}
                  </span>
                  {getStatusBadge(budget.status)}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                  {budget.title}
                </h3>

                {budget.clientName && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Cliente: {budget.clientName}</span>
                  </p>
                )}

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3 h-3" /> Região:
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {budget.location.stateName} ({budget.location.uf})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3 h-3" /> Data:
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {new Date(budget.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 font-mono">
                    <span className="text-slate-400 text-[11px]">TOTAL:</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      R$ {budget.calculationResult.totalEstimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD ACTIONS */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  id={`btn-view-budget-${budget.id}`}
                  onClick={() => onViewBudget(budget)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Ver Detalhes</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    id={`btn-print-budget-${budget.id}`}
                    onClick={() => onPrintBudget(budget)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Imprimir / Gerar PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    id={`btn-delete-budget-${budget.id}`}
                    onClick={() => {
                      if (confirm('Deseja realmente excluir este orçamento?')) {
                        onDeleteBudget(budget.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Excluir Orçamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
