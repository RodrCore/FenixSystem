import { Routes } from '@angular/router';
import { RoleGuard } from '../../core/guards/role.guard';

export const adminRoutes: Routes = [
  {
    path: 'users',
    loadComponent: () =>
      import('./users/users').then((m) => m.UsersComponent),
    canActivate: [RoleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN'] },
  },
  {
    path: 'audit-logs',
    loadComponent: () =>
      import('./audit/audit').then((m) => m.AuditComponent),
    canActivate: [RoleGuard],
    data: { roles: ['SUPER_ADMIN'] },
  },
  { path: '', redirectTo: 'users', pathMatch: 'full' },
];