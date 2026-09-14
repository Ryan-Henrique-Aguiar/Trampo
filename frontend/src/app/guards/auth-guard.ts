import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth';
import { ViewModeService } from '../services/view-mode/view-mode-service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const viewModeService = inject(ViewModeService);

  if (await authService.validateSession()) {
    const user = authService.currentUser!;
    viewModeService.initializeForUser(user.id, user.provider);
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
