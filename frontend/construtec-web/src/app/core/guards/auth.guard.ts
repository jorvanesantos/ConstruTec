import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UiStateService } from '../services/ui-state.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const ui = inject(UiStateService);

  if (auth.isLoggedIn()) {
    return true;
  }

  ui.openAuthModal('Faça login para acessar seus orçamentos e histórico de obras.');
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const ui = inject(UiStateService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    ui.openAuthModal('Área restrita. Entre com uma conta administrativa.');
    router.navigateByUrl('/');
    return false;
  }

  if (auth.isAdmin() && !ui.isUserTestMode()) {
    return true;
  }

  return true;
};
