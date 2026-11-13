import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  AdminDashboardStats,
  AdminMaterial,
  AdminUser,
  AdminUserWork,
  AdminWorkType,
  MasterActionRequest,
  MasterRequestAction,
  SystemAuditLog,
  UserType
} from '../models/types';

export interface DbStatusResponse {
  connected: boolean;
  mode: string;
  database: string;
  host?: string;
  port?: number;
  error?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly http = inject(HttpClient);

  getStats(): Promise<AdminDashboardStats> {
    return firstValueFrom(this.http.get<AdminDashboardStats>('/api/admin/stats'));
  }

  getUsers(): Promise<AdminUser[]> {
    return firstValueFrom(this.http.get<AdminUser[]>('/api/admin/usuarios'));
  }

  createUser(payload: Partial<AdminUser> & { password: string }): Promise<AdminUser> {
    return firstValueFrom(this.http.post<AdminUser>('/api/admin/usuarios', payload));
  }

  updateUser(
    id: string,
    payload: Partial<AdminUser> & { reason?: string }
  ): Promise<AdminUser & { pendingApproval?: boolean; message?: string; request?: MasterActionRequest }> {
    return firstValueFrom(
      this.http.put<AdminUser & { pendingApproval?: boolean; message?: string; request?: MasterActionRequest }>(
        `/api/admin/usuarios/${id}`,
        payload
      )
    );
  }

  toggleUserStatus(id: string, active: boolean): Promise<AdminUser> {
    return firstValueFrom(this.http.patch<AdminUser>(`/api/admin/usuarios/${id}/status`, { active }));
  }

  deleteUser(
    id: string,
    reason?: string
  ): Promise<{ success: boolean; pendingApproval?: boolean; message?: string; request?: MasterActionRequest }> {
    const url = reason ? `/api/admin/usuarios/${id}?reason=${encodeURIComponent(reason)}` : `/api/admin/usuarios/${id}`;
    return firstValueFrom(
      this.http.delete<{ success: boolean; pendingApproval?: boolean; message?: string; request?: MasterActionRequest }>(url)
    );
  }

  getMasterRequests(): Promise<MasterActionRequest[]> {
    return firstValueFrom(this.http.get<MasterActionRequest[]>('/api/admin/master-solicitacoes'));
  }

  createMasterRequest(payload: {
    targetUserId: string;
    actionType: MasterRequestAction;
    targetNewUserType?: UserType;
    reason?: string;
  }): Promise<MasterActionRequest> {
    return firstValueFrom(this.http.post<MasterActionRequest>('/api/admin/master-solicitacoes', payload));
  }

  respondMasterRequest(
    id: string,
    decision: 'ACEITAR' | 'RECUSAR'
  ): Promise<{
    accepted: boolean;
    actionType?: MasterRequestAction;
    selfDeleted?: boolean;
    updatedUser?: AdminUser;
    token?: string;
    request: MasterActionRequest;
    message: string;
  }> {
    return firstValueFrom(
      this.http.post<{
        accepted: boolean;
        actionType?: MasterRequestAction;
        selfDeleted?: boolean;
        updatedUser?: AdminUser;
        token?: string;
        request: MasterActionRequest;
        message: string;
      }>(`/api/admin/master-solicitacoes/${id}/responder`, { decision })
    );
  }

  cancelMasterRequest(id: string): Promise<{ success: boolean; request: MasterActionRequest }> {
    return firstValueFrom(this.http.delete<{ success: boolean; request: MasterActionRequest }>(`/api/admin/master-solicitacoes/${id}`));
  }

  getWorkTypes(): Promise<AdminWorkType[]> {
    return firstValueFrom(this.http.get<AdminWorkType[]>('/api/admin/tipos-construcao'));
  }

  saveWorkType(payload: Partial<AdminWorkType>, editId?: string): Promise<AdminWorkType> {
    if (editId) {
      return firstValueFrom(this.http.put<AdminWorkType>(`/api/admin/tipos-construcao/${editId}`, payload));
    }
    return firstValueFrom(this.http.post<AdminWorkType>('/api/admin/tipos-construcao', payload));
  }

  toggleWorkTypeStatus(id: string): Promise<AdminWorkType> {
    return firstValueFrom(this.http.patch<AdminWorkType>(`/api/admin/tipos-construcao/${id}/status`, {}));
  }

  getMaterials(): Promise<AdminMaterial[]> {
    return firstValueFrom(this.http.get<AdminMaterial[]>('/api/admin/materiais'));
  }

  saveMaterial(payload: Partial<AdminMaterial>, editId?: string): Promise<AdminMaterial> {
    if (editId) {
      return firstValueFrom(this.http.put<AdminMaterial>(`/api/admin/materiais/${editId}`, payload));
    }
    return firstValueFrom(this.http.post<AdminMaterial>('/api/admin/materiais', payload));
  }

  toggleMaterialStatus(id: string): Promise<AdminMaterial> {
    return firstValueFrom(this.http.patch<AdminMaterial>(`/api/admin/materiais/${id}/status`, {}));
  }

  deleteMaterial(id: string): Promise<{ success: boolean }> {
    return firstValueFrom(this.http.delete<{ success: boolean }>(`/api/admin/materiais/${id}`));
  }

  getWorks(): Promise<AdminUserWork[]> {
    return firstValueFrom(this.http.get<AdminUserWork[]>('/api/admin/obras'));
  }

  getHistory(actionFilter?: string): Promise<SystemAuditLog[]> {
    const url = actionFilter && actionFilter !== 'TODOS' ? `/api/admin/historico?action=${actionFilter}` : '/api/admin/historico';
    return firstValueFrom(this.http.get<SystemAuditLog[]>(url));
  }

  getDbStatus(): Promise<DbStatusResponse> {
    return firstValueFrom(this.http.get<DbStatusResponse>('/api/status-banco'));
  }

  testDbConnection(): Promise<DbStatusResponse> {
    return firstValueFrom(this.http.post<DbStatusResponse>('/api/conectar-banco', {}));
  }
}
