import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PriceCatalogItem, RegionalLocation, WorkTypeInfo } from '../models/types';
import { BASE_MATERIALS_CATALOG, REGIONAL_LOCATIONS, WORK_TYPES } from '../models/catalog';

@Injectable({
  providedIn: 'root'
})
export class MaterialService {
  private readonly http = inject(HttpClient);

  getStaticWorkTypes(): WorkTypeInfo[] {
    return WORK_TYPES;
  }

  getRegionalLocations(): RegionalLocation[] {
    return REGIONAL_LOCATIONS;
  }

  getStaticMaterials(): PriceCatalogItem[] {
    return BASE_MATERIALS_CATALOG;
  }

  async fetchWorkTypes(): Promise<WorkTypeInfo[]> {
    try {
      const remote = await firstValueFrom(this.http.get<any[]>('/api/tipos-obras'));
      if (Array.isArray(remote) && remote.length > 0) {
        return WORK_TYPES.filter(w => {
          const matched = remote.find(r => r.code === w.id || r.codigo === w.id);
          return matched ? matched.active !== false : true;
        });
      }
    } catch {
      // fallback estático
    }
    return WORK_TYPES;
  }
}
