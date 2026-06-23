import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { CanActivateUnauthGuard } from './core/guards/can-activate-unauth.guard';
import { LayoutComponent } from './shared/components/layout/layout';
import { ProductosComponent } from './features/productos/productos';

export const routes: Routes = [
  // ── RUTAS PÚBLICAS (sin layout) ──
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent),
    canActivate: [CanActivateUnauthGuard],
  },

  // ── RUTAS PROTEGIDAS (con layout) ──
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'admin',
        canActivate: [RoleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN'] },
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'inventario',
        loadComponent: () =>
          import('./features/productos/productos').then((m) => m.ProductosComponent),
      },
      {
        path: 'pedidos',
        canActivate: [RoleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'ALMACEN'] },
        loadComponent: () => import('./features/pedidos/pedidos.page').then((m) => m.PedidosPage),
      },
      {
        path: 'clientes',
        canActivate: [RoleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'GERENTE'] },
        loadComponent: () =>
          import('./features/clientes/clientes.page').then((m) => m.ClientesPage),
      },
      {
        path: 'usuarios',
        canActivate: [RoleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN'] },
        loadComponent: () =>
          import('./features/usuarios/usuarios.page').then((m) => m.UsuariosPage),
      },
      {
        path: 'reabastecimiento',
        canActivate: [RoleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN'] },
        loadComponent: () =>
          import('./features/reabastecimiento/reabastecimiento.page').then(
            (m) => m.ReabastecimientoPage,
          ),
      },
      {
        path: 'proveedores',
        canActivate: [RoleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN'] },
        loadComponent: () =>
          import('./features/proveedores/proveedores.page').then((m) => m.ProveedoresPage),
      },
      {
        path: 'reportes',
        canActivate: [RoleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'GERENTE'] },
        loadComponent: () =>
          import('./features/reportes/reportes.page').then((m) => m.ReportesPage),
      },
      {
        path: 'auditoria',
        canActivate: [RoleGuard],
        data: { roles: ['SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/auditoria/auditoria.page').then((m) => m.AuditoriaPage),
      }
    ],
  },

  { path: '**', redirectTo: '/dashboard' },
];
