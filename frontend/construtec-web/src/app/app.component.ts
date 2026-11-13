import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { ObraService } from './core/services/obra.service';
import { UiStateService } from './core/services/ui-state.service';
import { FooterComponent } from './layout/footer/footer.component';
import { HeaderComponent } from './layout/header/header.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { AuthModalComponent } from './shared/components/auth-modal.component';
import { AvatarModalComponent } from './shared/components/avatar-modal.component';
import { ChangePasswordModalComponent } from './shared/components/change-password-modal.component';
import { PrintBudgetModalComponent } from './shared/components/print-budget-modal.component';
import { RegionalLocationModalComponent } from './shared/components/regional-location-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    AuthModalComponent,
    AvatarModalComponent,
    ChangePasswordModalComponent,
    RegionalLocationModalComponent,
    PrintBudgetModalComponent
  ],
  template: `
    <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <app-header></app-header>

      <div class="flex flex-1 min-h-0 pt-16 print:pt-0">
        <app-sidebar></app-sidebar>

        <main class="flex-1 flex flex-col min-w-0">
          <div class="flex-1">
            <router-outlet></router-outlet>
          </div>
          <app-footer></app-footer>
        </main>
      </div>

      <!-- Modais Globais -->
      <app-auth-modal></app-auth-modal>
      <app-avatar-modal></app-avatar-modal>
      <app-change-password-modal></app-change-password-modal>
      <app-regional-location-modal></app-regional-location-modal>
      <app-print-budget-modal></app-print-budget-modal>
    </div>
  `
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly ui = inject(UiStateService);
  private readonly auth = inject(AuthService);
  private readonly obraService = inject(ObraService);

  async ngOnInit(): Promise<void> {
    this.ui.syncTabFromUrl(this.router.url);
    void this.ui.detectRegionAutomatically();

    this.router.events
      .pipe(filter((ev): ev is NavigationEnd => ev instanceof NavigationEnd))
      .subscribe(ev => {
        this.ui.syncTabFromUrl(ev.urlAfterRedirects);
      });

    if (this.auth.isLoggedIn()) {
      const valid = await this.auth.verifySession();
      if (!valid && this.router.url.startsWith('/admin')) {
        this.ui.openAuthModal('Sessão expirada. Faça login novamente para acessar o Painel Administrativo.');
      }
    }

    this.obraService.loadBudgets(this.auth.isLoggedIn(), this.auth.currentUser()?.id);
  }
}
