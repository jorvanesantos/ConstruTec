import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CalculationResult, WorkTypeKey } from '../models/types';

export function calculationErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0 || error.status >= 500) {
      return 'Não foi possível conectar ao servidor de cálculos. Verifique a conexão e tente novamente.';
    }
    if (typeof error.error?.error === 'string' && error.error.error.trim()) {
      return error.error.error;
    }
  }
  return 'Não foi possível calcular. Revise os dados e tente novamente.';
}

@Injectable({
  providedIn: 'root'
})
export class CalculoService {
  private readonly http = inject(HttpClient);

  calculateRemote(workType: WorkTypeKey, params: object): Promise<CalculationResult> {
    return firstValueFrom(
      this.http.post<CalculationResult>(`/api/calculos/${workType}`, params)
    );
  }
}
