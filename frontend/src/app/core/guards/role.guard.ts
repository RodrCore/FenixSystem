import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { selectUserRole } from '../../store/auth/auth.selectors';

export const RoleGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);
  const requiredRoles: string[] = route.data['roles'] || [];

  if (!requiredRoles.length) return true;

  return store.select(selectUserRole).pipe(
    take(1),
    map((userRole) => {
      if (userRole && requiredRoles.includes(userRole)) return true;
      return router.createUrlTree(['/']);
    }),
  );
};