import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { SavedBudget } from '../models/types';

const BUDGETS_STORAGE_KEY = 'construtec_budgets';
const LEGACY_MOCK_IDS = new Set(['orc_1', 'orc_2', 'orc_3', 'obra_1', 'obra_2', 'obra_3']);

@Injectable({
  providedIn: 'root'
})
export class ObraService {
  private readonly http = inject(HttpClient);
  private readonly budgetsSubject = new BehaviorSubject<SavedBudget[]>([]);
  readonly budgets$ = this.budgetsSubject.asObservable();
  readonly budgets = signal<SavedBudget[]>([]);

  private filterReal(list: SavedBudget[]): SavedBudget[] {
    return list.filter(b => b && !LEGACY_MOCK_IDS.has(b.id));
  }

  private setBudgets(list: SavedBudget[]): void {
    const clean = this.filterReal(list);
    this.budgets.set(clean);
    this.budgetsSubject.next(clean);
    try {
      localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(clean));
    } catch {
      // ignore
    }
  }

  async loadBudgets(isLoggedIn: boolean, userId?: string): Promise<void> {
    if (!isLoggedIn) {
      this.budgets.set([]);
      this.budgetsSubject.next([]);
      return;
    }

    try {
      const list = await firstValueFrom(this.http.get<SavedBudget[]>('/api/orcamentos'));
      if (Array.isArray(list)) {
        this.setBudgets(list);
        return;
      }
    } catch {
      // fallback para cache local se servidor estiver reiniciando
    }

    try {
      const saved = localStorage.getItem(BUDGETS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SavedBudget[];
        const clean = this.filterReal(parsed).filter(b => !userId || !b.userId || b.userId === userId);
        this.budgets.set(clean);
        this.budgetsSubject.next(clean);
        return;
      }
    } catch {
      // ignore
    }

    this.budgets.set([]);
    this.budgetsSubject.next([]);
  }

  clearOnLogout(): void {
    this.budgets.set([]);
    this.budgetsSubject.next([]);
  }

  async saveBudget(budget: SavedBudget): Promise<SavedBudget> {
    try {
      const saved = await firstValueFrom(this.http.post<SavedBudget>('/api/orcamentos', budget));
      this.setBudgets([saved, ...this.budgets()]);
      return saved;
    } catch {
      this.setBudgets([budget, ...this.budgets()]);
      return budget;
    }
  }

  async deleteBudget(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`/api/orcamentos/${id}`));
    } catch {
      // remove localmente mesmo offline
    }
    this.setBudgets(this.budgets().filter(b => b.id !== id));
  }
}
