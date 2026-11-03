import React from 'react';
import { SavedBudget, UserProfile, RegionalLocation } from '../types';
import { ConstruTecLogo } from './ConstruTecLogo';
import { 
  LayoutDashboard, 
  FileText, 
  Coins, 
  TrendingDown, 
  Plus, 
  PackageCheck, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  MapPin
} from 'lucide-react';

interface DashboardProps {
  budgets: SavedBudget[];
  user: UserProfile | null;
  location: RegionalLocation;
  onGoToCalculator: () => void;
  onGoToBudgets: () => void;
  onGoToMaterials: () => void;
  onViewBudget: (b: SavedBudget) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  budgets,
  user,
  location,
  onGoToCalculator,
  onGoToBudgets,
  onGoToMaterials,
  onViewBudget
}) => {
  const totalBudgetsCost = budgets.reduce((acc, b) => acc + b.calculationResult.totalEstimatedCost, 0);
  const totalWasteSavings = totalBudgetsCost * 0.12; // Média de 12% evitado

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* BOAS VINDAS / PROFILE HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ConstruTecLogo size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold">
                  Olá, {user?.name || 'Profissional da Construção'}!
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-amber-400 text-slate-950">
                  {user?.userType === 'ADM_MASTER' || user?.userType === 'PROPRIETARIO'
                    ? 'ADM Master'
                    : user?.userType === 'ADM'
                      ? 'ADM'
                      : 'Usuário'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Bem-vindo à central de gerenciamento e estimativa de obras da ConstruTec.
              </p>
            </div>
          </div>

          <button
            onClick={onGoToCalculator}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cálculo de Obra</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS / KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Obras Orçadas</span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {budgets.length}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">
            Projetos ativos no sistema
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Valor Total Estimado</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            R$ {totalBudgetsCost.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">
            Soma de todos os insumos
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Desperdício Evitado</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            ~R$ {totalWasteSavings.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">
            Economia média de 12% por quantitativo
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Região Ativa</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white">
            {location.stateName} ({location.uf})
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1 font-mono">
            Índice regional: {location.priceMultiplier}x
          </span>
        </div>

      </div>

      {/* PROJETOS RECENTES */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Projetos e Obras Recentes</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Últimos orçamentos calculados e salvos</p>
          </div>
          <button
            onClick={onGoToBudgets}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver todos ({budgets.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {budgets.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
            Nenhuma obra calculada ainda. Clique em "Novo Cálculo de Obra" para começar.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {budgets.slice(0, 4).map((b) => (
              <div
                key={b.id}
                className="py-3 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors cursor-pointer"
                onClick={() => onViewBudget(b)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{b.title}</span>
                    <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {b.workTypeName}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                    {b.clientName ? `Cliente: ${b.clientName} • ` : ''}
                    {new Date(b.createdAt).toLocaleDateString('pt-BR')} • {b.location.uf}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono block">
                    R$ {b.calculationResult.totalEstimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold hover:underline">
                    Ver orçamento →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SLOGAN FOOTER CALLOUT */}
      <div className="p-6 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 dark:border-amber-500/30 text-center">
        <p className="text-xs uppercase tracking-widest text-amber-700 dark:text-amber-300 font-bold">
          ConstruTec
        </p>
        <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
          "Calcule com precisão, construa com economia."
        </p>
      </div>

    </div>
  );
};
