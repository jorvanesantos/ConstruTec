import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/auth.guard';
import { HomeComponent } from './features/home/home.component';
import { CalculatorComponent } from './features/calculos/calculator.component';
import { BudgetListComponent } from './features/historico/budget-list.component';
import { MaterialsCatalogComponent } from './features/obras/materials-catalog.component';
import { DashboardComponent } from './features/obras/dashboard.component';
import { AboutPageComponent } from './features/sobre/about-page.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';
import { AuthPageComponent } from './features/auth/auth-page.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: AuthPageComponent },
  { path: 'esqueci-senha', component: ForgotPasswordComponent },
  { path: 'redefinir-senha', component: ResetPasswordComponent },
  { path: 'calculo', component: CalculatorComponent, canDeactivate: [component => component.canLeave()] },
  { path: 'calculo/:tipo', component: CalculatorComponent, canDeactivate: [component => component.canLeave()] },
  { path: 'historico', component: BudgetListComponent },
  { path: 'obras', component: MaterialsCatalogComponent },
  { path: 'materiais', component: MaterialsCatalogComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'sobre', component: AboutPageComponent },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: '' }
];
