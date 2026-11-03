import React from 'react';
import { UserProfile } from '../types';
import { AuthService } from '../services/auth.service';
import { ConstruTecLogo } from '../components/ConstruTecLogo';
import { ShieldCheck, Lock, LogIn, UserPlus, AlertOctagon } from 'lucide-react';

interface AuthGuardProps {
  user: UserProfile | null;
  requireAdmin?: boolean;
  requireOwner?: boolean;
  onOpenAuth: (message?: string) => void;
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  user,
  requireAdmin = false,
  requireOwner = false,
  onOpenAuth,
  children
}) => {
  // 1. Caso o usuário não esteja logado
  if (!user || !user.isLoggedIn || !user.email) {
    return (
      <div className="py-16 px-4 sm:px-6 max-w-xl mx-auto text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80 relative overflow-hidden">
          {/* Luz âmbar superior */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />
          
          <div className="flex justify-center mb-6">
            <ConstruTecLogo size="lg" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <Lock className="w-3.5 h-3.5" />
            Acesso Protegido por E-mail
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            Identifique-se para Continuar
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-8 max-w-md mx-auto">
            Por motivos de segurança e integridade de dados, o acesso aos motores de cálculo, 
            orçamentos salvos e catálogo de insumos exige um e-mail verificado.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onOpenAuth('Informe seu e-mail e senha para acessar o ConstruTec.')}
              className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Entrar
            </button>
            <button
              onClick={() => onOpenAuth('Crie sua conta informando nome, e-mail e senha.')}
              className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Criar Conta Gratuita
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Sessão Criptografada JWT
            </span>
            <span>·</span>
            <span>Hierarquia Segura</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Caso requeira ADM MASTER estrito
  if (requireOwner && !AuthService.isMaster(user)) {
    return (
      <div className="py-20 px-4 max-w-lg mx-auto text-center">
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-red-200">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Acesso Exclusivo para ADM Master</h3>
          <p className="text-slate-600 text-sm mb-6">
            Esta funcionalidade requer privilégios de ADM Master (Nível 1). 
            Seu perfil atual é <strong>{AuthService.getRoleLabel(user.userType)}</strong>.
          </p>
          <div className="text-xs text-slate-500">
            Entre em contato com um dos Administradores Principais para solicitar alteração de permissão.
          </div>
        </div>
      </div>
    );
  }

  // 3. Caso requeira ADMINISTRADOR ou ADM MASTER
  if (requireAdmin && !AuthService.isAdmin(user)) {
    return (
      <div className="py-20 px-4 max-w-lg mx-auto text-center">
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-amber-200">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Painel Restrito à Administração</h3>
          <p className="text-slate-600 text-sm mb-6">
            Você está autenticado como <strong>{user.name} ({user.email})</strong> com perfil de <strong>{AuthService.getRoleLabel(user.userType)}</strong>.
            Apenas Administradores (ADM e ADM Master) têm acesso a este módulo.
          </p>
        </div>
      </div>
    );
  }

  // Usuário autorizado! Renderiza o conteúdo protegido
  return <>{children}</>;
};
