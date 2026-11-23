import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PriceCatalogItem, RegionalLocation, WorkTypeInfo } from '../models/types';

export interface RegionalPriceItem extends PriceCatalogItem {
  regionalPrice: number;
  uf: string;
  priceSource: string;
}

export interface RegionalPrices {
  location: RegionalLocation;
  items: RegionalPriceItem[];
  allLocations: RegionalLocation[];
}

@Injectable({
  providedIn: 'root'
})
export class MaterialService {
  private readonly http = inject(HttpClient);

  readonly workTypes = signal<WorkTypeInfo[]>([]);
  readonly workTypesError = signal('');
  private loadingWorkTypes?: Promise<void>;

  loadWorkTypes(): Promise<void> {
    if (this.loadingWorkTypes) return this.loadingWorkTypes;
    this.workTypesError.set('');
    this.loadingWorkTypes = firstValueFrom(this.http.get<WorkTypeInfo[]>('/api/calculadora/tipos'))
      .then(items => {
        if (!Array.isArray(items) || items.length === 0) {
          throw new Error('A API retornou uma lista vazia ou inválida de tipos de obra.');
        }
        this.workTypes.set(items);
      })
      .catch((err: unknown) => {
        console.error('[Catálogo] Falha ao carregar tipos de obra:', err);
        this.workTypesError.set('Não foi possível carregar os tipos de obra. Verifique a conexão.');
      })
      .finally(() => { this.loadingWorkTypes = undefined; });
    return this.loadingWorkTypes;
  }

  getRegionalPrices(uf: string): Promise<RegionalPrices> {
    return firstValueFrom(this.http.get<RegionalPrices>('/api/precos', { params: { uf } }));
  }
}
