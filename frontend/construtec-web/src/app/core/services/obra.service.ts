import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { SavedBudget } from '../models/types';

const LEGACY_MOCK_IDS = new Set(['orc_1', 'orc_2', 'orc_3', 'obra_1', 'obra_2', 'obra_3']);

@Injectable({
  providedIn: 'root'
})
export class ObraService {
  private readonly http = inject(HttpClient);
  private readonly budgetsSubject = new BehaviorSubject<SavedBudget[]>([]);
  readonly budgets$ = this.budgetsSubject.asObservable();
  readonly budgets = signal<SavedBudget[]>([]);
  readonly loadError = signal('');
  private loadRequestId = 0;

  private filterReal(list: SavedBudget[]): SavedBudget[] {
    return list.filter(b => b && !LEGACY_MOCK_IDS.has(b.id));
  }

  private setBudgets(list: SavedBudget[]): void {
    const clean = this.filterReal(list);
    this.budgets.set(clean);
    this.budgetsSubject.next(clean);
  }

  async loadBudgets(isLoggedIn: boolean, _userId?: string): Promise<void> {
    const requestId = ++this.loadRequestId;
    this.loadError.set('');
    if (!isLoggedIn) {
      this.budgets.set([]);
      this.budgetsSubject.next([]);
      return;
    }

    try {
      const list = await firstValueFrom(this.http.get<SavedBudget[]>('/api/orcamentos'));
      if (requestId !== this.loadRequestId) return;
      if (Array.isArray(list)) {
        this.setBudgets(list);
        return;
      }
      throw new Error('Resposta inválida ao carregar orçamentos.');
    } catch (err) {
      if (requestId !== this.loadRequestId) return;
      console.error('[Orçamentos] Falha ao carregar orçamentos:', err);
      this.loadError.set('Não foi possível carregar os orçamentos. Verifique a conexão e tente novamente.');
    }

    this.budgets.set([]);
    this.budgetsSubject.next([]);
  }

  clearOnLogout(): void {
    this.loadRequestId++;
    this.budgets.set([]);
    this.budgetsSubject.next([]);
    this.loadError.set('');
  }

  async saveBudget(budget: SavedBudget): Promise<SavedBudget> {
    const saved = await firstValueFrom(this.http.post<SavedBudget>('/api/orcamentos', budget));
    this.setBudgets([saved, ...this.budgets()]);
    return saved;
  }

  async updateBudget(budget: SavedBudget): Promise<SavedBudget> {
    const saved = await firstValueFrom(this.http.put<SavedBudget>(`/api/orcamentos/${encodeURIComponent(budget.id)}`, {
      title: budget.title,
      clientName: budget.clientName,
      status: budget.status,
      calculationResults: budget.calculationResults || [budget.calculationResult]
    }));
    this.setBudgets(this.budgets().map(item => item.id === saved.id ? saved : item));
    return saved;
  }

  async deleteBudget(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/orcamentos/${encodeURIComponent(id)}`));
    this.setBudgets(this.budgets().filter(b => b.id !== id));
  }
}
