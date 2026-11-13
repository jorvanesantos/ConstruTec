import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  Database,
  Edit3,
  Eye,
  History,
  Lock,
  LockOpen,
  LucideAngularModule,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
  Wrench,
  X
} from 'lucide-angular';
import { AdminService, DbStatusResponse } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { ObraService } from '../../core/services/obra.service';
import { UiStateService } from '../../core/services/ui-state.service';
import {
  AdminDashboardStats,
  AdminMaterial,
  AdminTabKey,
  AdminUser,
  AdminUserWork,
  AdminWorkType,
  MasterActionRequest,
  SystemAuditLog,
  UserType
} from '../../core/models/types';
import { AuthGuardViewComponent } from '../../shared/components/auth-guard-view.component';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AuthGuardViewComponent, BrlCurrencyPipe],
  template: `
    @if (!auth.isAdmin() || ui.isUserTestMode()) {
      <app-auth-guard-view
        [requireAdmin]="true"
        message="O Painel Administrativo está disponível apenas para contas Administrador autenticadas."
      ></app-auth-guard-view>
    } @else {
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <!-- Cabeçalho -->
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="space-y-1">
            <button
              type="button"
              (click)="ui.navigateTo('home')"
              class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-amber-600 cursor-pointer"
            >
              <lucide-icon [img]="ArrowLeft" class="w-4 h-4"></lucide-icon>
              Voltar ao Início
            </button>
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                <lucide-icon [img]="ShieldCheck" class="w-7 h-7 text-amber-500"></lucide-icon>
                Painel Administrativo
              </h1>
              <span class="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold">
                Admin
              </span>
            </div>
          </div>

          <button
            type="button"
            (click)="loadAll()"
            [disabled]="loading()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-amber-500 cursor-pointer"
          >
            <lucide-icon [img]="RefreshCw" class="w-4 h-4" [ngClass]="loading() ? 'animate-spin' : ''"></lucide-icon>
            Atualizar Dados
          </button>
        </div>

        <!-- Feedback de erro ou sucesso -->
        @if (loadError()) {
          <div class="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 flex flex-wrap items-center justify-between gap-3 text-xs text-red-700 dark:text-red-200">
            <div class="flex items-center gap-2 font-semibold">
              <lucide-icon [img]="AlertCircle" class="w-4 h-4 shrink-0"></lucide-icon>
              <span>{{ loadError() }}</span>
            </div>
            <button
              type="button"
              (click)="loadAll()"
              class="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 cursor-pointer"
            >
              Tentar Novamente
            </button>
          </div>
        }

        @if (actionMessage()) {
          <div class="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-200">
            {{ actionMessage() }}
          </div>
        }

        <!-- SOLICITAÇÕES PENDENTES PARA ESTE ADM MASTER -->
        @if (myPendingMasterRequests().length > 0) {
          <div class="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 space-y-3 shadow-sm">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                <lucide-icon [img]="ShieldCheck" class="w-5 h-5"></lucide-icon>
              </div>
              <div>
                <h2 class="text-sm font-extrabold text-amber-950 dark:text-amber-100">
                  Solicitações Pendentes de Aceite (ADM Master)
                </h2>
                <p class="text-xs text-amber-800 dark:text-amber-300">
                  Outro administrador solicitou alteração ou exclusão do seu nível ADM Master. Esta ação só ocorre se você aceitar.
                </p>
              </div>
            </div>

            <div class="space-y-2.5">
              @for (reqItem of myPendingMasterRequests(); track reqItem.id) {
                <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="space-y-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span
                        class="text-[11px] font-extrabold px-2 py-0.5 rounded-md"
                        [ngClass]="reqItem.actionType === 'EXCLUIR'
                          ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'"
                      >
                        {{ reqItem.actionType === 'EXCLUIR' ? 'EXCLUSÃO DE CONTA' : 'REBAIXAMENTO PARA ' + (reqItem.targetNewUserType || 'ADM') }}
                      </span>
                      <span class="text-xs text-slate-500 dark:text-slate-400">
                        Solicitado por <strong class="text-slate-800 dark:text-slate-100">{{ reqItem.requestedByName }}</strong> ({{ reqItem.requestedByEmail }})
                      </span>
                    </div>
                    @if (reqItem.reason) {
                      <p class="text-xs text-slate-600 dark:text-slate-300">Motivo: {{ reqItem.reason }}</p>
                    }
                    <p class="text-[11px] text-slate-400">Enviada em {{ reqItem.createdAt | date: 'dd/MM/yyyy HH:mm' }}</p>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      (click)="respondMasterRequest(reqItem, 'RECUSAR')"
                      [disabled]="saving()"
                      class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold cursor-pointer disabled:opacity-60"
                    >
                      <lucide-icon [img]="X" class="w-3.5 h-3.5"></lucide-icon>
                      Recusar
                    </button>
                    <button
                      type="button"
                      (click)="respondMasterRequest(reqItem, 'ACEITAR')"
                      [disabled]="saving()"
                      class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-60"
                      [ngClass]="reqItem.actionType === 'EXCLUIR'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-slate-950'"
                    >
                      <lucide-icon [img]="Check" class="w-3.5 h-3.5"></lucide-icon>
                      {{ reqItem.actionType === 'EXCLUIR' ? 'Aceitar Exclusão' : 'Aceitar Rebaixamento' }}
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Abas de Gestão -->
        <div class="flex flex-wrap gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          @for (tab of tabs; track tab.id) {
            <button
              type="button"
              (click)="activeTab.set(tab.id)"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              [ngClass]="activeTab() === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'"
            >
              <lucide-icon [img]="tab.icon" class="w-4 h-4"></lucide-icon>
              <span>{{ tab.label }}</span>
            </button>
          }
        </div>

        <!-- VISÃO GERAL -->
        @if (activeTab() === 'overview') {
          <div class="space-y-6">
            @if (stats(); as st) {
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Usuários Cadastrados</span>
                  <p class="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{{ st.totalUsuarios }}</p>
                </div>
                <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Obras Lançadas</span>
                  <p class="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{{ st.totalObras }}</p>
                </div>
                <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Insumos no Catálogo</span>
                  <p class="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{{ st.totalMateriais }}</p>
                </div>
                <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Contas Master / Adm</span>
                  <p class="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {{ st.totalProprietarios }} <span class="text-xs font-normal text-slate-400">/ máx {{ st.maxProprietarios }}</span>
                  </p>
                </div>
              </div>
            }

            <div class="grid grid-cols-1 gap-6">
              <!-- Status MySQL -->
              <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <div class="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center">
                      <lucide-icon [img]="Database" class="w-5 h-5"></lucide-icon>
                    </div>
                    <div>
                      <h3 class="text-base font-bold text-slate-900 dark:text-white">Conexão Banco de Dados MySQL</h3>
                      <p class="text-xs text-slate-500 dark:text-slate-400">
                        {{ dbStatus()?.connected ? 'Conectado ao banco relacional' : 'Operando em Contingência Segura (Memória)' }}
                      </p>
                    </div>
                  </div>
                  <span
                    class="px-2.5 py-1 rounded-lg text-[11px] font-bold"
                    [ngClass]="dbStatus()?.connected
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'"
                  >
                    {{ dbStatus()?.connected ? 'ONLINE' : 'FALLBACK' }}
                  </span>
                </div>

                @if (dbStatus(); as db) {
                  <div class="text-xs text-slate-600 dark:text-slate-300 space-y-1 bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl">
                    <p>Modo: <strong>{{ db.mode }}</strong></p>
                    <p>Schema: <strong class="font-mono">{{ db.database }}</strong> ({{ db.host }}:{{ db.port }})</p>
                  </div>
                }

                <button
                  type="button"
                  (click)="reconnectDb()"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold hover:opacity-90 cursor-pointer"
                >
                  <lucide-icon [img]="RefreshCw" class="w-3.5 h-3.5"></lucide-icon>
                  Testar / Reconectar MySQL
                </button>
              </div>
            </div>
          </div>
        }

        <!-- USUÁRIOS -->
        @if (activeTab() === 'users') {
          <div class="space-y-5">
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="text-base font-bold text-slate-900 dark:text-white">Gestão de Usuários & Administradores</h2>
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    Para um ADM se tornar Master ele deve ser colocado por outro ADM. Rebaixar ou excluir um ADM Master exige solicitação e aceite do Master em questão.
                  </p>
                </div>
                <button
                  type="button"
                  (click)="openUserModal()"
                  class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  <lucide-icon [img]="Plus" class="w-4 h-4"></lucide-icon>
                  Novo Usuário / Admin
                </button>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr class="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400">
                      <th class="py-3 px-6">Nome / E-mail</th>
                      <th class="py-3 px-4">Nível</th>
                      <th class="py-3 px-4">Status</th>
                      <th class="py-3 px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                    @if (users().length === 0) {
                      <tr>
                        <td colspan="4" class="py-10 px-6 text-center text-sm text-slate-500 dark:text-slate-400">
                          {{ loading() ? 'Carregando usuários cadastrados...' : 'Nenhum usuário encontrado.' }}
                        </td>
                      </tr>
                    }
                    @for (u of users(); track u.id) {
                      <tr>
                        <td class="py-3.5 px-6">
                          <p class="font-bold text-slate-900 dark:text-white">{{ u.name }}</p>
                          <p class="text-xs text-slate-500 dark:text-slate-400">{{ u.email }}</p>
                        </td>
                        <td class="py-3.5 px-4">
                          <span
                            class="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                            [ngClass]="isMasterUser(u)
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'"
                          >
                            {{ u.userType }}
                          </span>
                        </td>
                        <td class="py-3.5 px-4">
                          <span
                            class="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                            [ngClass]="u.active ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/15 text-red-700 dark:text-red-300'"
                          >
                            {{ u.active ? 'Ativo' : 'Bloqueado' }}
                          </span>
                        </td>
                        <td class="py-3.5 px-6 text-right space-x-2">
                          <button
                            type="button"
                            (click)="openUserModal(u)"
                            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer"
                            [title]="isMasterUser(u) && u.id !== auth.currentUser()?.id ? 'Editar / Solicitar Rebaixamento' : 'Editar usuário'"
                          >
                            <lucide-icon [img]="Edit3" class="w-3.5 h-3.5"></lucide-icon>
                          </button>
                          @if (!isMasterUser(u)) {
                            <button
                              type="button"
                              (click)="toggleUser(u)"
                              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer"
                              [title]="u.active ? 'Bloquear' : 'Ativar'"
                            >
                              <lucide-icon [img]="u.active ? Lock : LockOpen" class="w-3.5 h-3.5"></lucide-icon>
                            </button>
                            <button
                              type="button"
                              (click)="deleteUser(u)"
                              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold cursor-pointer"
                              title="Excluir"
                            >
                              <lucide-icon [img]="Trash2" class="w-3.5 h-3.5"></lucide-icon>
                            </button>
                          } @else if (u.id !== auth.currentUser()?.id) {
                            <button
                              type="button"
                              (click)="openMasterDeleteModal(u)"
                              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 text-xs font-semibold cursor-pointer"
                              title="Solicitar Exclusão (requer aceite do ADM Master)"
                            >
                              <lucide-icon [img]="Trash2" class="w-3.5 h-3.5"></lucide-icon>
                            </button>
                          } @else {
                            <span class="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Você (Master)</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- HISTÓRICO DE SOLICITAÇÕES DE REBAIXAMENTO / EXCLUSÃO DE ADM MASTER -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">Solicitações de Rebaixamento / Exclusão de ADM Master</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Acompanhe pedidos aguardando aceite ou já respondidos pelos administradores Master.
                </p>
              </div>
              @if (masterRequests().length === 0) {
                <div class="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  Nenhuma solicitação registrada até o momento.
                </div>
              } @else {
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr class="bg-slate-50 dark:bg-slate-800 uppercase text-slate-500 dark:text-slate-400">
                        <th class="py-3 px-6">ADM Master Alvo</th>
                        <th class="py-3 px-4">Ação Solicitada</th>
                        <th class="py-3 px-4">Solicitante</th>
                        <th class="py-3 px-4">Status</th>
                        <th class="py-3 px-6 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                      @for (reqItem of masterRequests(); track reqItem.id) {
                        <tr>
                          <td class="py-3 px-6">
                            <p class="font-bold text-slate-900 dark:text-white">{{ reqItem.targetUserName }}</p>
                            <p class="text-slate-500 dark:text-slate-400">{{ reqItem.targetUserEmail }}</p>
                          </td>
                          <td class="py-3 px-4 font-semibold">
                            {{ reqItem.actionType === 'EXCLUIR' ? 'Excluir Conta' : 'Rebaixar para ' + (reqItem.targetNewUserType || 'ADM') }}
                            @if (reqItem.reason) {
                              <p class="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">{{ reqItem.reason }}</p>
                            }
                          </td>
                          <td class="py-3 px-4">
                            <p>{{ reqItem.requestedByName }}</p>
                            <p class="text-slate-400">{{ reqItem.createdAt | date: 'dd/MM/yyyy HH:mm' }}</p>
                          </td>
                          <td class="py-3 px-4">
                            <span
                              class="px-2 py-0.5 rounded-md font-bold text-[11px]"
                              [ngClass]="reqItem.status === 'PENDENTE'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                : reqItem.status === 'ACEITA'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'"
                            >
                              {{ reqItem.status }}
                            </span>
                          </td>
                          <td class="py-3 px-6 text-right space-x-1.5">
                            @if (reqItem.status === 'PENDENTE' && reqItem.targetUserId === auth.currentUser()?.id) {
                              <button
                                type="button"
                                (click)="respondMasterRequest(reqItem, 'ACEITAR')"
                                [disabled]="saving()"
                                class="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold cursor-pointer"
                              >
                                Aceitar
                              </button>
                              <button
                                type="button"
                                (click)="respondMasterRequest(reqItem, 'RECUSAR')"
                                [disabled]="saving()"
                                class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                              >
                                Recusar
                              </button>
                            } @else if (reqItem.status === 'PENDENTE' && reqItem.requestedById === auth.currentUser()?.id) {
                              <button
                                type="button"
                                (click)="cancelMasterRequest(reqItem)"
                                [disabled]="saving()"
                                class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                              >
                                Cancelar
                              </button>
                            } @else {
                              <span class="text-slate-400">—</span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        }

        <!-- TIPOS DE OBRA -->
        @if (activeTab() === 'workTypes') {
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-base font-bold text-slate-900 dark:text-white">Tipos de Obra Configurados</h2>
              <button
                type="button"
                (click)="openWorkTypeModal()"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer"
              >
                <lucide-icon [img]="Plus" class="w-4 h-4"></lucide-icon>
                Novo Tipo
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-sm">
                <thead>
                  <tr class="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400">
                    <th class="py-3 px-6">Nome / Código</th>
                    <th class="py-3 px-4">Categoria</th>
                    <th class="py-3 px-4">Perda Padrão</th>
                    <th class="py-3 px-4">Status</th>
                    <th class="py-3 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  @for (wt of workTypes(); track wt.id) {
                    <tr>
                      <td class="py-3.5 px-6">
                        <p class="font-bold text-slate-900 dark:text-white">{{ wt.name }}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 font-mono">{{ wt.code }}</p>
                      </td>
                      <td class="py-3.5 px-4 text-xs capitalize">{{ wt.category }}</td>
                      <td class="py-3.5 px-4 font-semibold">{{ wt.defaultWaste }}%</td>
                      <td class="py-3.5 px-4">
                        <span
                          class="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                          [ngClass]="wt.active ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'"
                        >
                          {{ wt.active ? 'Ativo' : 'Inativo' }}
                        </span>
                      </td>
                      <td class="py-3.5 px-6 text-right space-x-2">
                        <button
                          type="button"
                          (click)="openWorkTypeModal(wt)"
                          class="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                        >
                          <lucide-icon [img]="Edit3" class="w-3.5 h-3.5"></lucide-icon>
                        </button>
                        <button
                          type="button"
                          (click)="toggleWorkType(wt)"
                          class="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                        >
                          {{ wt.active ? 'Desativar' : 'Ativar' }}
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- MATERIAIS -->
        @if (activeTab() === 'materials') {
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-base font-bold text-slate-900 dark:text-white">Insumos & Materiais Cadastrados</h2>
              <button
                type="button"
                (click)="openMaterialModal()"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer"
              >
                <lucide-icon [img]="Plus" class="w-4 h-4"></lucide-icon>
                Novo Material
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-sm">
                <thead>
                  <tr class="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400">
                    <th class="py-3 px-6">Material</th>
                    <th class="py-3 px-4">Categoria</th>
                    <th class="py-3 px-4">Preço Base</th>
                    <th class="py-3 px-4">Status</th>
                    <th class="py-3 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  @for (m of materials(); track m.id) {
                    <tr>
                      <td class="py-3.5 px-6">
                        <p class="font-bold text-slate-900 dark:text-white">{{ m.name }}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400">Unidade: {{ m.unit }}</p>
                      </td>
                      <td class="py-3.5 px-4 text-xs">{{ m.category }}</td>
                      <td class="py-3.5 px-4 font-bold text-amber-600 dark:text-amber-400">{{ m.price | brl }}</td>
                      <td class="py-3.5 px-4">
                        <span
                          class="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                          [ngClass]="m.status === 'ativo' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'"
                        >
                          {{ m.status }}
                        </span>
                      </td>
                      <td class="py-3.5 px-6 text-right space-x-2">
                        <button
                          type="button"
                          (click)="openMaterialModal(m)"
                          class="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                        >
                          <lucide-icon [img]="Edit3" class="w-3.5 h-3.5"></lucide-icon>
                        </button>
                        <button
                          type="button"
                          (click)="toggleMaterial(m)"
                          class="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                        >
                          {{ m.status === 'ativo' ? 'Inativar' : 'Ativar' }}
                        </button>
                        <button
                          type="button"
                          (click)="deleteMaterial(m)"
                          class="inline-flex items-center px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold cursor-pointer"
                        >
                          <lucide-icon [img]="Trash2" class="w-3.5 h-3.5"></lucide-icon>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- OBRAS CRIADAS -->
        @if (activeTab() === 'works') {
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 class="text-base font-bold text-slate-900 dark:text-white">Obras & Cálculos Reais Registrados</h2>
            </div>
            @if (works().length === 0) {
              <div class="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                Nenhuma obra registrada até o momento. Os registros aparecem conforme cálculos reais forem salvos.
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr class="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400">
                      <th class="py-3 px-6">Obra / Autor</th>
                      <th class="py-3 px-4">Tipo</th>
                      <th class="py-3 px-4">Total</th>
                      <th class="py-3 px-6 text-right">Inspecionar</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                    @for (w of works(); track w.id) {
                      <tr>
                        <td class="py-3.5 px-6">
                          <p class="font-bold text-slate-900 dark:text-white">{{ w.title }}</p>
                          <p class="text-xs text-slate-500 dark:text-slate-400">{{ w.userName }} ({{ w.locationUf || 'SP' }})</p>
                        </td>
                        <td class="py-3.5 px-4 text-xs">{{ w.workTypeName }}</td>
                        <td class="py-3.5 px-4 font-bold text-amber-600 dark:text-amber-400">{{ w.totalCost | brl }}</td>
                        <td class="py-3.5 px-6 text-right">
                          <button
                            type="button"
                            (click)="inspectingWork.set(w)"
                            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                          >
                            <lucide-icon [img]="Eye" class="w-3.5 h-3.5"></lucide-icon>
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

        <!-- HISTÓRICO / AUDITORIA -->
        @if (activeTab() === 'history') {
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-base font-bold text-slate-900 dark:text-white">Histórico de Auditoria</h2>
              <select
                [(ngModel)]="historyFilter"
                (ngModelChange)="loadHistory()"
                class="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
              >
                <option value="TODOS">Todas as Ações</option>
                <option value="LOGIN">Logins</option>
                <option value="CRIAR_CALCULO">Cálculos Criados</option>
                <option value="CADASTRAR_USUARIO">Cadastros</option>
                <option value="EDITAR_MATERIAL">Alteração de Materiais</option>
              </select>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-50 dark:bg-slate-800 uppercase text-slate-500 dark:text-slate-400">
                    <th class="py-3 px-6">Data / Hora</th>
                    <th class="py-3 px-4">Ação</th>
                    <th class="py-3 px-4">Usuário</th>
                    <th class="py-3 px-6">Descrição</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  @for (log of logs(); track log.id) {
                    <tr>
                      <td class="py-3 px-6 font-mono text-slate-500 dark:text-slate-400">
                        {{ log.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                      </td>
                      <td class="py-3 px-4 font-bold text-amber-600 dark:text-amber-400">{{ log.action }}</td>
                      <td class="py-3 px-4">{{ log.userName }}</td>
                      <td class="py-3 px-6 text-slate-700 dark:text-slate-300">{{ log.description }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- MODAL CRIAR / EDITAR USUÁRIO -->
        @if (userModalOpen()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <div class="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-bold text-slate-900 dark:text-white">
                  {{ editingUserId() ? 'Editar Usuário' : 'Cadastrar Nova Conta' }}
                </h3>
                <button type="button" (click)="userModalOpen.set(false)" class="p-1 text-slate-400 cursor-pointer">
                  <lucide-icon [img]="X" class="w-4 h-4"></lucide-icon>
                </button>
              </div>
              @if (modalError()) {
                <p class="text-xs text-red-600 dark:text-red-400 font-semibold">{{ modalError() }}</p>
              }
              <form (ngSubmit)="saveUser()" class="space-y-3">
                <div>
                  <label class="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-200">Nome</label>
                  <input type="text" [(ngModel)]="userForm.name" name="uName" required class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-200">E-mail</label>
                  <input type="email" [(ngModel)]="userForm.email" name="uEmail" required class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm" />
                </div>
                @if (!editingUserId()) {
                  <div>
                    <label class="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-200">Senha Inicial</label>
                    <input type="password" [(ngModel)]="userForm.password" name="uPass" required minlength="6" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm" />
                  </div>
                }
                <div>
                  <label class="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-200">Nível de Acesso</label>
                  <select [(ngModel)]="userForm.userType" name="uType" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm">
                    <option value="USUARIO">Usuário Padrão</option>
                    <option value="ADM">Administrador (ADM)</option>
                    <option value="ADM_MASTER" [disabled]="isMasterOptionDisabled()">
                      Administrador Master {{ isMasterOptionDisabled() ? '(somente ADM promovido por outro Admin)' : '' }}
                    </option>
                  </select>
                </div>
                @if (willTriggerDemotionRequest()) {
                  <div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 space-y-2">
                    <p class="font-semibold">
                      {{ editingUserId() === auth.currentUser()?.id
                        ? 'Para deixar de ser ADM Master, outro administrador deve enviar a solicitação para seu aceite.'
                        : 'Rebaixar este ADM Master enviará uma solicitação que só será aplicada após o aceite dele.' }}
                    </p>
                    @if (editingUserId() !== auth.currentUser()?.id) {
                      <div>
                        <label class="block text-[11px] font-semibold mb-1">Motivo da solicitação (opcional)</label>
                        <input
                          type="text"
                          [(ngModel)]="userForm.reason"
                          name="uReason"
                          placeholder="Ex: Reorganização da equipe técnica"
                          class="w-full px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    }
                  </div>
                }
                <div class="flex justify-end gap-2 pt-2">
                  <button type="button" (click)="userModalOpen.set(false)" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer">Cancelar</button>
                  <button type="submit" [disabled]="saving()" class="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold cursor-pointer disabled:opacity-60">
                    {{ saving() ? 'Salvando...' : (willTriggerDemotionRequest() ? 'Enviar Solicitação' : 'Salvar Conta') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        }

        <!-- MODAL SOLICITAR EXCLUSÃO DE ADM MASTER -->
        @if (masterDeleteTarget(); as mTarget) {
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <div class="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Solicitar Exclusão de ADM Master</h3>
                <button type="button" (click)="masterDeleteTarget.set(null)" class="p-1 text-slate-400 cursor-pointer">
                  <lucide-icon [img]="X" class="w-4 h-4"></lucide-icon>
                </button>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Você está solicitando a exclusão da conta Master de <strong class="text-slate-900 dark:text-white">{{ mTarget.name }}</strong> ({{ mTarget.email }}). A exclusão só será efetivada se este ADM Master aceitar a solicitação.
              </p>
              <div>
                <label class="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-200">Motivo (opcional)</label>
                <input
                  type="text"
                  [(ngModel)]="masterRequestReason"
                  name="mDelReason"
                  placeholder="Informe o motivo para o ADM Master"
                  class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div class="flex justify-end gap-2 pt-2">
                <button type="button" (click)="masterDeleteTarget.set(null)" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer">Cancelar</button>
                <button
                  type="button"
                  (click)="confirmMasterDeleteRequest()"
                  [disabled]="saving()"
                  class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                >
                  {{ saving() ? 'Enviando...' : 'Enviar Solicitação de Exclusão' }}
                </button>
              </div>
            </div>
          </div>
        }

        <!-- MODAL TIPO DE OBRA -->
        @if (workTypeModalOpen()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <div class="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ editingWorkTypeId() ? 'Editar Tipo de Obra' : 'Novo Tipo de Obra' }}</h3>
                <button type="button" (click)="workTypeModalOpen.set(false)" class="p-1 text-slate-400 cursor-pointer">
                  <lucide-icon [img]="X" class="w-4 h-4"></lucide-icon>
                </button>
              </div>
              @if (modalError()) {
                <p class="text-xs text-red-600 dark:text-red-400 font-semibold">{{ modalError() }}</p>
              }
              <form (ngSubmit)="saveWorkType()" class="space-y-3">
                <div>
                  <label class="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-200">Nome</label>
                  <input type="text" [(ngModel)]="wtForm.name" name="wtName" required class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-200">Descrição</label>
                  <textarea [(ngModel)]="wtForm.description" name="wtDesc" rows="2" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"></textarea>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-200">Categoria</label>
                    <select [(ngModel)]="wtForm.category" name="wtCat" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm">
                      <option value="alvenaria">Alvenaria</option>
                      <option value="acabamento">Acabamento</option>
                      <option value="estrutural">Estrutural</option>
                      <option value="cobertura">Cobertura</option>
                      <option value="geral">Geral</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-200">Perda Padrão (%)</label>
                    <input type="number" [(ngModel)]="wtForm.defaultWaste" name="wtWaste" required class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm" />
                  </div>
                </div>
                <div class="flex justify-end gap-2 pt-2">
                  <button type="button" (click)="workTypeModalOpen.set(false)" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer">Cancelar</button>
                  <button type="submit" [disabled]="saving()" class="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold cursor-pointer disabled:opacity-60">
                    {{ saving() ? 'Salvando...' : 'Salvar' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        }

        <!-- MODAL MATERIAL -->
        @if (materialModalOpen()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <div class="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ editingMaterialId() ? 'Editar Material' : 'Novo Material' }}</h3>
                <button type="button" (click)="materialModalOpen.set(false)" class="p-1 text-slate-400 cursor-pointer">
                  <lucide-icon [img]="X" class="w-4 h-4"></lucide-icon>
                </button>
              </div>
              @if (modalError()) {
                <p class="text-xs text-red-600 dark:text-red-400 font-semibold">{{ modalError() }}</p>
              }
              <form (ngSubmit)="saveMaterial()" class="space-y-3">
                <div>
                  <label class="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-200">Nome do Insumo</label>
                  <input type="text" [(ngModel)]="matForm.name" name="mName" required class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-200">Categoria</label>
                    <input type="text" [(ngModel)]="matForm.category" name="mCat" required class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-200">Unidade</label>
                    <input type="text" [(ngModel)]="matForm.unit" name="mUnit" required class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-200">Preço Base (R$)</label>
                  <input type="number" step="0.01" [(ngModel)]="matForm.price" name="mPrice" required class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-200">Descrição</label>
                  <textarea [(ngModel)]="matForm.description" name="mDesc" rows="2" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"></textarea>
                </div>
                <div class="flex justify-end gap-2 pt-2">
                  <button type="button" (click)="materialModalOpen.set(false)" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer">Cancelar</button>
                  <button type="submit" [disabled]="saving()" class="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold cursor-pointer disabled:opacity-60">
                    {{ saving() ? 'Salvando...' : 'Salvar Material' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        }

        <!-- MODAL INSPECIONAR OBRA -->
        @if (inspectingWork(); as w) {
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <div class="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ w.title }}</h3>
                <button type="button" (click)="inspectingWork.set(null)" class="p-1 text-slate-400 cursor-pointer">
                  <lucide-icon [img]="X" class="w-4 h-4"></lucide-icon>
                </button>
              </div>
              <div class="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <p>Autor: <strong>{{ w.userName }}</strong> ({{ w.userEmail }})</p>
                <p>Tipo: <strong>{{ w.workTypeName }}</strong> · Custo: <strong>{{ w.totalCost | brl }}</strong></p>
              </div>
              @if (w.calculationResult?.materials?.length) {
                <div class="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  @for (mat of w.calculationResult!.materials; track mat.id) {
                    <div class="p-2.5 flex items-center justify-between">
                      <span>{{ mat.name }}</span>
                      <strong>{{ mat.commercialQuantity ?? mat.quantityCommercial }} {{ mat.unit }}</strong>
                    </div>
                  }
                </div>
              }
              <div class="flex justify-end">
                <button type="button" (click)="inspectingWork.set(null)" class="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold cursor-pointer">Fechar</button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class AdminDashboardComponent implements OnInit {
  readonly ui = inject(UiStateService);
  readonly auth = inject(AuthService);
  private readonly adminService = inject(AdminService);
  private readonly obraService = inject(ObraService);

  readonly activeTab = signal<AdminTabKey>('overview');
  readonly loading = signal(false);
  readonly stats = signal<AdminDashboardStats | null>(null);
  readonly dbStatus = signal<DbStatusResponse | null>(null);
  readonly users = signal<AdminUser[]>([]);
  readonly masterRequests = signal<MasterActionRequest[]>([]);
  readonly workTypes = signal<AdminWorkType[]>([]);
  readonly materials = signal<AdminMaterial[]>([]);
  readonly works = signal<AdminUserWork[]>([]);
  readonly logs = signal<SystemAuditLog[]>([]);
  historyFilter = 'TODOS';

  readonly myPendingMasterRequests = computed(() => {
    const uid = this.auth.currentUser()?.id;
    if (!uid) return [];
    return this.masterRequests().filter(r => r.targetUserId === uid && r.status === 'PENDENTE');
  });

  // Modais e feedback
  readonly saving = signal(false);
  readonly loadError = signal('');
  readonly actionMessage = signal('');
  readonly userModalOpen = signal(false);
  readonly workTypeModalOpen = signal(false);
  readonly materialModalOpen = signal(false);
  readonly editingUserId = signal<string | null>(null);
  readonly editingTargetOriginalType = signal<UserType | null>(null);
  readonly masterDeleteTarget = signal<AdminUser | null>(null);
  readonly editingWorkTypeId = signal<string | null>(null);
  readonly editingMaterialId = signal<string | null>(null);
  readonly inspectingWork = signal<AdminUserWork | null>(null);
  readonly modalError = signal('');
  masterRequestReason = '';

  userForm: { name: string; email: string; password: string; userType: UserType; reason?: string } = {
    name: '',
    email: '',
    password: '',
    userType: 'USUARIO',
    reason: ''
  };

  wtForm: { name: string; description: string; category: AdminWorkType['category']; defaultWaste: number } = {
    name: '',
    description: '',
    category: 'geral',
    defaultWaste: 10
  };

  matForm = {
    name: '',
    category: 'Aglomerantes',
    unit: 'saco',
    price: 0,
    description: ''
  };

  readonly AlertCircle = AlertCircle;
  readonly ArrowLeft = ArrowLeft;
  readonly ShieldCheck = ShieldCheck;
  readonly RefreshCw = RefreshCw;
  readonly Database = Database;
  readonly Plus = Plus;
  readonly Lock = Lock;
  readonly LockOpen = LockOpen;
  readonly Trash2 = Trash2;
  readonly Edit3 = Edit3;
  readonly Eye = Eye;
  readonly X = X;
  readonly Check = Check;

  readonly tabs: { id: AdminTabKey; label: string; icon: any }[] = [
    { id: 'overview', label: 'Visão Geral', icon: Activity },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'workTypes', label: 'Tipos de Obra', icon: Wrench },
    { id: 'materials', label: 'Materiais', icon: Package },
    { id: 'works', label: 'Obras Criadas', icon: Building2 },
    { id: 'history', label: 'Histórico', icon: History }
  ];

  private hasLoadedOnce = false;

  constructor() {
    effect(() => {
      const canAccess = this.auth.isAdminAccount() && !this.ui.isUserTestMode();
      if (canAccess && !this.hasLoadedOnce) {
        this.hasLoadedOnce = true;
        this.loadAll();
      } else if (!canAccess) {
        this.hasLoadedOnce = false;
      }
    });
  }

  ngOnInit(): void {
    if (this.auth.isAdmin() && !this.ui.isUserTestMode() && !this.hasLoadedOnce) {
      this.hasLoadedOnce = true;
      this.loadAll();
    }
  }

  private showActionFeedback(msg: string): void {
    this.actionMessage.set(msg);
    setTimeout(() => {
      if (this.actionMessage() === msg) {
        this.actionMessage.set('');
      }
    }, 3500);
  }

  private handleRequestError(err: any, fallbackMessage: string): string {
    const status = err?.status;
    if (status === 401 || status === 403) {
      this.auth.logout();
      this.ui.openAuthModal('Sua sessão administrativa expirou ou é inválida. Faça login novamente.');
      return 'Sessão expirada. Faça login novamente.';
    }
    return err?.error?.error || fallbackMessage;
  }

  async loadAll(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    try {
      const results = await Promise.allSettled([
        this.adminService.getStats(),
        this.adminService.getDbStatus(),
        this.adminService.getUsers(),
        this.adminService.getWorkTypes(),
        this.adminService.getMaterials(),
        this.adminService.getWorks(),
        this.adminService.getHistory(this.historyFilter),
        this.adminService.getMasterRequests()
      ]);

      const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      const authFailed = rejected.find(r => r.reason?.status === 401 || r.reason?.status === 403);
      if (authFailed) {
        this.loadError.set(this.handleRequestError(authFailed.reason, 'Sessão administrativa expirada.'));
        return;
      }

      if (results[0].status === 'fulfilled') this.stats.set(results[0].value);
      if (results[1].status === 'fulfilled') this.dbStatus.set(results[1].value);
      if (results[2].status === 'fulfilled') this.users.set(results[2].value);
      if (results[3].status === 'fulfilled') this.workTypes.set(results[3].value);
      if (results[4].status === 'fulfilled') this.materials.set(results[4].value);
      if (results[5].status === 'fulfilled') this.works.set(results[5].value);
      if (results[6].status === 'fulfilled') this.logs.set(results[6].value);
      if (results[7].status === 'fulfilled') {
        this.masterRequests.set(results[7].value);
        const uid = this.auth.currentUser()?.id;
        if (uid) {
          const pendingForMe = results[7].value.filter(r => r.targetUserId === uid && r.status === 'PENDENTE').length;
          this.auth.syncCurrentUser({ pendingMasterRequestsCount: pendingForMe });
        }
      }

      if (rejected.length > 0) {
        this.loadError.set('Alguns dados administrativos não puderam ser carregados. Clique em "Tentar Novamente".');
      }
    } finally {
      this.loading.set(false);
    }
  }

  isMasterUser(u: AdminUser): boolean {
    return u.userType === 'ADM_MASTER' || u.userType === 'PROPRIETARIO';
  }

  isMasterOptionDisabled(): boolean {
    const editId = this.editingUserId();
    if (!editId) return false;
    const orig = this.editingTargetOriginalType();
    if (editId === this.auth.currentUser()?.id && orig !== 'ADM_MASTER' && orig !== 'PROPRIETARIO') {
      return true;
    }
    if (orig === 'USUARIO') {
      return true;
    }
    return false;
  }

  willTriggerDemotionRequest(): boolean {
    const editId = this.editingUserId();
    const orig = this.editingTargetOriginalType();
    if (!editId || (orig !== 'ADM_MASTER' && orig !== 'PROPRIETARIO')) {
      return false;
    }
    return this.userForm.userType !== 'ADM_MASTER' && this.userForm.userType !== 'PROPRIETARIO';
  }

  async reconnectDb(): Promise<void> {
    try {
      const res = await this.adminService.testDbConnection();
      this.dbStatus.set(res);
      this.showActionFeedback(res.connected ? 'Banco MySQL conectado.' : 'Sistema operando em modo de memória (fallback).');
    } catch (err: any) {
      this.loadError.set(this.handleRequestError(err, 'Não foi possível verificar o banco de dados.'));
    }
  }

  async loadHistory(): Promise<void> {
    try {
      const hist = await this.adminService.getHistory(this.historyFilter);
      this.logs.set(hist);
    } catch (err: any) {
      this.loadError.set(this.handleRequestError(err, 'Erro ao carregar histórico de auditoria.'));
    }
  }

  openUserModal(u?: AdminUser): void {
    this.modalError.set('');
    if (u) {
      this.editingUserId.set(u.id);
      this.editingTargetOriginalType.set(u.userType);
      this.userForm = {
        name: u.name,
        email: u.email,
        password: '',
        userType: u.userType,
        reason: ''
      };
    } else {
      this.editingUserId.set(null);
      this.editingTargetOriginalType.set(null);
      this.userForm = { name: '', email: '', password: '', userType: 'USUARIO', reason: '' };
    }
    this.userModalOpen.set(true);
  }

  async saveUser(): Promise<void> {
    this.modalError.set('');
    this.saving.set(true);
    try {
      const editId = this.editingUserId();
      if (editId) {
        const updated = await this.adminService.updateUser(editId, {
          name: this.userForm.name,
          email: this.userForm.email,
          userType: this.userForm.userType,
          reason: this.userForm.reason
        });
        if (editId === this.auth.currentUser()?.id) {
          this.auth.syncCurrentUser({
            name: updated.name,
            email: updated.email,
            userType: updated.userType
          });
        }
        this.showActionFeedback(
          updated.pendingApproval
            ? updated.message || 'Solicitação de rebaixamento enviada para aceite do ADM Master.'
            : 'Dados do usuário atualizados com sucesso.'
        );
      } else {
        await this.adminService.createUser(this.userForm);
        this.showActionFeedback('Nova conta cadastrada com sucesso.');
      }
      this.userModalOpen.set(false);
      await this.loadAll();
    } catch (err: any) {
      this.modalError.set(this.handleRequestError(err, 'Erro ao salvar usuário.'));
    } finally {
      this.saving.set(false);
    }
  }

  openMasterDeleteModal(u: AdminUser): void {
    this.masterRequestReason = '';
    this.masterDeleteTarget.set(u);
  }

  async confirmMasterDeleteRequest(): Promise<void> {
    const target = this.masterDeleteTarget();
    if (!target) return;
    this.saving.set(true);
    try {
      const res = await this.adminService.deleteUser(target.id, this.masterRequestReason.trim() || undefined);
      this.masterDeleteTarget.set(null);
      this.showActionFeedback(
        res.message || `Solicitação de exclusão enviada. Aguardando aceite de ${target.name}.`
      );
      await this.loadAll();
    } catch (err: any) {
      this.loadError.set(this.handleRequestError(err, 'Não foi possível enviar a solicitação de exclusão.'));
      this.masterDeleteTarget.set(null);
    } finally {
      this.saving.set(false);
    }
  }

  async respondMasterRequest(reqItem: MasterActionRequest, decision: 'ACEITAR' | 'RECUSAR'): Promise<void> {
    this.saving.set(true);
    try {
      const res = await this.adminService.respondMasterRequest(reqItem.id, decision);
      if (res.selfDeleted) {
        this.auth.logout();
        this.obraService.clearOnLogout();
        this.ui.isUserTestMode.set(false);
        this.ui.navigateTo('home');
        return;
      }
      if (res.accepted && res.actionType === 'REBAIXAR' && res.updatedUser) {
        this.auth.syncCurrentUser(
          {
            userType: res.updatedUser.userType,
            role: res.updatedUser.role as any,
            pendingMasterRequestsCount: 0
          },
          res.token
        );
      }
      this.showActionFeedback(res.message);
      if (!this.auth.isAdmin()) {
        this.ui.navigateTo('home');
        return;
      }
      await this.loadAll();
    } catch (err: any) {
      this.loadError.set(this.handleRequestError(err, 'Erro ao responder solicitação.'));
    } finally {
      this.saving.set(false);
    }
  }

  async cancelMasterRequest(reqItem: MasterActionRequest): Promise<void> {
    this.saving.set(true);
    try {
      await this.adminService.cancelMasterRequest(reqItem.id);
      this.showActionFeedback('Solicitação cancelada.');
      await this.loadAll();
    } catch (err: any) {
      this.loadError.set(this.handleRequestError(err, 'Erro ao cancelar solicitação.'));
    } finally {
      this.saving.set(false);
    }
  }

  async toggleUser(u: AdminUser): Promise<void> {
    try {
      await this.adminService.toggleUserStatus(u.id, !u.active);
      this.showActionFeedback(`Usuário ${u.name} ${!u.active ? 'ativado' : 'bloqueado'}.`);
      await this.loadAll();
    } catch (err: any) {
      this.loadError.set(this.handleRequestError(err, 'Erro ao alterar status do usuário.'));
    }
  }

  async deleteUser(u: AdminUser): Promise<void> {
    try {
      const res = await this.adminService.deleteUser(u.id);
      this.showActionFeedback(res.message || `Usuário ${u.name} excluído.`);
      await this.loadAll();
    } catch (err: any) {
      this.loadError.set(this.handleRequestError(err, 'Erro ao excluir usuário.'));
    }
  }

  openWorkTypeModal(wt?: AdminWorkType): void {
    this.modalError.set('');
    if (wt) {
      this.editingWorkTypeId.set(wt.id);
      this.wtForm = {
        name: wt.name,
        description: wt.description,
        category: wt.category,
        defaultWaste: wt.defaultWaste
      };
    } else {
      this.editingWorkTypeId.set(null);
      this.wtForm = { name: '', description: '', category: 'geral', defaultWaste: 10 };
    }
    this.workTypeModalOpen.set(true);
  }

  async saveWorkType(): Promise<void> {
    this.modalError.set('');
    this.saving.set(true);
    try {
      await this.adminService.saveWorkType(this.wtForm, this.editingWorkTypeId() || undefined);
      this.workTypeModalOpen.set(false);
      this.showActionFeedback('Tipo de obra salvo com sucesso.');
      await this.loadAll();
    } catch (err: any) {
      this.modalError.set(this.handleRequestError(err, 'Erro ao salvar tipo de obra.'));
    } finally {
      this.saving.set(false);
    }
  }

  async toggleWorkType(wt: AdminWorkType): Promise<void> {
    try {
      await this.adminService.toggleWorkTypeStatus(wt.id);
      this.showActionFeedback(`Tipo "${wt.name}" ${wt.active ? 'desativado' : 'ativado'}.`);
      await this.loadAll();
    } catch (err: any) {
      this.loadError.set(this.handleRequestError(err, 'Erro ao atualizar status do tipo de obra.'));
    }
  }

  openMaterialModal(m?: AdminMaterial): void {
    this.modalError.set('');
    if (m) {
      this.editingMaterialId.set(m.id);
      this.matForm = {
        name: m.name,
        category: m.category,
        unit: m.unit,
        price: m.price,
        description: m.description
      };
    } else {
      this.editingMaterialId.set(null);
      this.matForm = { name: '', category: 'Aglomerantes', unit: 'saco', price: 0, description: '' };
    }
    this.materialModalOpen.set(true);
  }

  async saveMaterial(): Promise<void> {
    this.modalError.set('');
    this.saving.set(true);
    try {
      await this.adminService.saveMaterial(this.matForm, this.editingMaterialId() || undefined);
      this.materialModalOpen.set(false);
      this.showActionFeedback('Material salvo com sucesso.');
      await this.loadAll();
    } catch (err: any) {
      this.modalError.set(this.handleRequestError(err, 'Erro ao salvar material.'));
    } finally {
      this.saving.set(false);
    }
  }

  async toggleMaterial(m: AdminMaterial): Promise<void> {
    try {
      await this.adminService.toggleMaterialStatus(m.id);
      this.showActionFeedback(`Material ${m.name} atualizado.`);
      await this.loadAll();
    } catch (err: any) {
      this.loadError.set(this.handleRequestError(err, 'Erro ao atualizar status do material.'));
    }
  }

  async deleteMaterial(m: AdminMaterial): Promise<void> {
    try {
      await this.adminService.deleteMaterial(m.id);
      this.showActionFeedback(`Material ${m.name} removido.`);
      await this.loadAll();
    } catch (err: any) {
      this.loadError.set(this.handleRequestError(err, 'Erro ao excluir material.'));
    }
  }
}
