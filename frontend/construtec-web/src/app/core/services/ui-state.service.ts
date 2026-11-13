import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AdminTabKey,
  NavTab,
  RegionalLocation,
  SavedBudget,
  ThemeMode,
  WorkTypeKey
} from '../models/types';
import { REGIONAL_LOCATIONS } from '../models/catalog';

const THEME_KEY = 'construtec_theme';
const LOCATION_KEY = 'construtec_location';
const LOCATION_MANUAL_KEY = 'construtec_location_manual';

@Injectable({
  providedIn: 'root'
})
export class UiStateService {
  private readonly router = inject(Router);

  readonly theme = signal<ThemeMode>(this.loadInitialTheme());
  readonly isDark = computed(() => this.theme() === 'dark');

  readonly activeTab = signal<NavTab>('home');
  readonly adminSubTab = signal<AdminTabKey>('overview');
  readonly selectedWorkType = signal<WorkTypeKey>('muro');
  readonly isUserTestMode = signal<boolean>(false);

  readonly currentLocation = signal<RegionalLocation>(this.loadInitialLocation());
  readonly detectingLocation = signal<boolean>(false);
  readonly locationAutoDetected = signal<boolean>(false);
  readonly mobileSidebarOpen = signal<boolean>(false);
  readonly sidebarCollapsed = signal<boolean>(false);

  readonly authModalOpen = signal<boolean>(false);
  readonly authModalMessage = signal<string>('');
  readonly changePasswordModalOpen = signal<boolean>(false);
  readonly avatarModalOpen = signal<boolean>(false);
  readonly locationModalOpen = signal<boolean>(false);
  readonly printModalData = signal<SavedBudget | null>(null);

  constructor() {
    effect(() => {
      const currentTheme = this.theme();
      if (typeof document !== 'undefined') {
        if (currentTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      try {
        localStorage.setItem(THEME_KEY, currentTheme);
      } catch {
        // Ignora erro de localStorage restrito
      }
    });

    effect(() => {
      try {
        localStorage.setItem(LOCATION_KEY, JSON.stringify(this.currentLocation()));
      } catch {
        // Ignora erro de localStorage restrito
      }
    });
  }

  private loadInitialTheme(): ThemeMode {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore
    }
    return 'light';
  }

  private loadInitialLocation(): RegionalLocation {
    try {
      const isManual = localStorage.getItem(LOCATION_MANUAL_KEY) === 'true';
      const saved = localStorage.getItem(LOCATION_KEY);
      if (isManual && saved) {
        return JSON.parse(saved) as RegionalLocation;
      }
    } catch {
      // ignore
    }
    return REGIONAL_LOCATIONS[0];
  }

  hasManualLocation(): boolean {
    try {
      return localStorage.getItem(LOCATION_MANUAL_KEY) === 'true';
    } catch {
      return false;
    }
  }

  toggleTheme(): void {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  setTheme(mode: ThemeMode): void {
    this.theme.set(mode);
  }

  setLocation(location: RegionalLocation, manual = false): void {
    this.currentLocation.set(location);
    try {
      if (manual) {
        localStorage.setItem(LOCATION_MANUAL_KEY, 'true');
        this.locationAutoDetected.set(false);
      }
    } catch {
      // ignore
    }
  }

  private normalizeRegionName(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private matchBrazilianLocation(ufCandidate?: string, stateCandidate?: string, cityCandidate?: string): RegionalLocation | null {
    const cleanUf = String(ufCandidate || '')
      .replace(/^BR-/i, '')
      .toUpperCase()
      .trim();

    const byUf = REGIONAL_LOCATIONS.find(l => l.uf === cleanUf);
    if (byUf) {
      return {
        ...byUf,
        city: cityCandidate ? `${cityCandidate} (${byUf.uf})` : byUf.city
      };
    }

    if (stateCandidate) {
      const target = this.normalizeRegionName(stateCandidate);
      const byName = REGIONAL_LOCATIONS.find(l => this.normalizeRegionName(l.stateName) === target);
      if (byName) {
        return {
          ...byName,
          city: cityCandidate ? `${cityCandidate} (${byName.uf})` : byName.city
        };
      }
    }

    return null;
  }

  private async fetchWithTimeout(url: string, timeoutMs = 3500): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  private getBrowserCoords(timeoutMs = 4500): Promise<{ lat: number; lon: number } | null> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return Promise.resolve(null);
    }
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 5 * 60 * 1000 }
      );
    });
  }

  private async reverseGeocodeCoords(lat: number, lon: number): Promise<RegionalLocation | null> {
    try {
      const resp = await this.fetchWithTimeout(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=pt`,
        3500
      );
      if (resp.ok) {
        const data = await resp.json();
        if (String(data?.countryCode || '').toUpperCase() === 'BR') {
          const matched = this.matchBrazilianLocation(
            data.principalSubdivisionCode,
            data.principalSubdivision,
            data.city || data.locality
          );
          if (matched) return matched;
        }
      }
    } catch {
      // Fallback para backend reverse geocoding
    }

    try {
      const resp = await this.fetchWithTimeout(
        `/api/regiao/detectar?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
        3500
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data?.detected && data?.location) {
          return data.location as RegionalLocation;
        }
      }
    } catch {
      // ignore
    }

    return null;
  }

  private async detectViaIpProviders(): Promise<RegionalLocation | null> {
    try {
      const resp = await this.fetchWithTimeout('/api/regiao/detectar', 3500);
      if (resp.ok) {
        const data = await resp.json();
        if (data?.detected && data?.location) {
          return data.location as RegionalLocation;
        }
      }
    } catch {
      // ignore
    }

    try {
      const resp = await this.fetchWithTimeout('https://ipwho.is/', 3500);
      if (resp.ok) {
        const data = await resp.json();
        if (data?.success !== false && String(data?.country_code || '').toUpperCase() === 'BR') {
          const matched = this.matchBrazilianLocation(data.region_code, data.region, data.city);
          if (matched) return matched;
        }
      }
    } catch {
      // ignore
    }

    try {
      const resp = await this.fetchWithTimeout('https://ipapi.co/json/', 3500);
      if (resp.ok) {
        const data = await resp.json();
        if (!data?.error && String(data?.country_code || 'BR').toUpperCase() === 'BR') {
          const matched = this.matchBrazilianLocation(data.region_code, data.region, data.city);
          if (matched) return matched;
        }
      }
    } catch {
      // ignore
    }

    try {
      const resp = await this.fetchWithTimeout('https://get.geojs.io/v1/ip/geo.json', 3500);
      if (resp.ok) {
        const data = await resp.json();
        if (String(data?.country_code || '').toUpperCase() === 'BR') {
          const matched = this.matchBrazilianLocation(undefined, data.region, data.city);
          if (matched) return matched;
        }
      }
    } catch {
      // ignore
    }

    return null;
  }

  async detectRegionAutomatically(
    options: { force?: boolean; allowPrompt?: boolean } = {}
  ): Promise<{ detected: boolean; location: RegionalLocation; message: string }> {
    const { force = false, allowPrompt = false } = options;

    if (!force && this.hasManualLocation()) {
      return {
        detected: true,
        location: this.currentLocation(),
        message: `Região mantida: ${this.currentLocation().city}`
      };
    }

    if (this.detectingLocation()) {
      return {
        detected: false,
        location: this.currentLocation(),
        message: 'Detecção de região já em andamento.'
      };
    }

    this.detectingLocation.set(true);

    try {
      if (force) {
        try {
          localStorage.removeItem(LOCATION_MANUAL_KEY);
        } catch {
          // ignore
        }
      }

      let permissionState: PermissionState | null = null;
      if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
        try {
          const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          permissionState = perm.state;
        } catch {
          permissionState = null;
        }
      }

      // 1. Se permissão já concedida ou usuário clicou explicitamente em detectar, tenta GPS do navegador primeiro
      if (allowPrompt || permissionState === 'granted') {
        const coords = await this.getBrowserCoords(4500);
        if (coords) {
          const byGps = await this.reverseGeocodeCoords(coords.lat, coords.lon);
          if (byGps) {
            this.setLocation(byGps, false);
            this.locationAutoDetected.set(true);
            return {
              detected: true,
              location: byGps,
              message: `Região detectada automaticamente: ${byGps.city} (${byGps.priceMultiplier.toFixed(2)}x)`
            };
          }
        }
      }

      // 2. Fallback silencioso e automático por IP (sem bloquear por popup de permissão)
      const byIp = await this.detectViaIpProviders();
      if (byIp) {
        this.setLocation(byIp, false);
        this.locationAutoDetected.set(true);
        return {
          detected: true,
          location: byIp,
          message: `Região detectada automaticamente: ${byIp.city} (${byIp.priceMultiplier.toFixed(2)}x)`
        };
      }

      // 3. Se IP não apontou UF brasileira e ainda não tentamos geolocalização do navegador na carga inicial
      if (!allowPrompt && permissionState !== 'granted' && permissionState !== 'denied') {
        const coords = await this.getBrowserCoords(3500);
        if (coords) {
          const byGps = await this.reverseGeocodeCoords(coords.lat, coords.lon);
          if (byGps) {
            this.setLocation(byGps, false);
            this.locationAutoDetected.set(true);
            return {
              detected: true,
              location: byGps,
              message: `Região detectada automaticamente: ${byGps.city} (${byGps.priceMultiplier.toFixed(2)}x)`
            };
          }
        }
      }

      return {
        detected: false,
        location: this.currentLocation(),
        message: 'Não foi possível identificar a UF automaticamente. Selecione seu estado abaixo.'
      };
    } finally {
      this.detectingLocation.set(false);
    }
  }

  openAuthModal(message = ''): void {
    this.authModalMessage.set(message);
    this.authModalOpen.set(true);
  }

  closeAuthModal(): void {
    this.authModalOpen.set(false);
    this.authModalMessage.set('');
  }

  openPrintModal(budget: SavedBudget): void {
    this.printModalData.set(budget);
  }

  closePrintModal(): void {
    this.printModalData.set(null);
  }

  toggleUserTestMode(): void {
    this.isUserTestMode.update(v => !v);
    if (this.isUserTestMode() && this.activeTab() === 'admin') {
      this.navigateTo('calculator');
    }
  }

  navigateTo(tab: NavTab, workType?: WorkTypeKey): void {
    if (workType) {
      this.selectedWorkType.set(workType);
    }
    this.activeTab.set(tab);
    this.mobileSidebarOpen.set(false);

    const routeMap: Record<NavTab, string> = {
      home: '/',
      calculator: workType ? `/calculo/${workType}` : '/calculo',
      budgets: '/historico',
      materials: '/obras',
      dashboard: '/dashboard',
      about: '/sobre',
      admin: '/admin'
    };

    const targetUrl = routeMap[tab] || '/';
    if (this.router.url !== targetUrl) {
      this.router.navigateByUrl(targetUrl);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  syncTabFromUrl(url: string): void {
    const clean = url.split('?')[0];
    if (clean.startsWith('/calculo')) {
      this.activeTab.set('calculator');
      const parts = clean.split('/').filter(Boolean);
      if (parts[1]) {
        this.selectedWorkType.set(parts[1] as WorkTypeKey);
      }
    } else if (clean.startsWith('/historico')) {
      this.activeTab.set('budgets');
    } else if (clean.startsWith('/obras') || clean.startsWith('/materiais')) {
      this.activeTab.set('materials');
    } else if (clean.startsWith('/dashboard')) {
      this.activeTab.set('dashboard');
    } else if (clean.startsWith('/sobre')) {
      this.activeTab.set('about');
    } else if (clean.startsWith('/admin')) {
      this.activeTab.set('admin');
    } else {
      this.activeTab.set('home');
    }
  }
}
