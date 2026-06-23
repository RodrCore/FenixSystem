import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.page').then((m) => m.LoginPage),
  },
  // Dashboard común — todos los roles entran y se redirige internamente
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.page').then(
        (m) => m.DashboardPage,
      ),
  },

  // ── Productos: solo PREVENTISTA/ADMIN/SUPER_ADMIN/GERENTE/ALMACEN ──
  {
    path: 'productos',
    canActivate: [
      authGuard,
      roleGuard(['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN', 'PREVENTISTA']),
    ],
    loadComponent: () =>
      import('./features/productos/productos.page').then(
        (m) => m.ProductosPage,
      ),
  },

  // ── Clientes: todos pueden ver ──
  {
    path: 'clientes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/clientes/clientes.page').then((m) => m.ClientesPage),
  },
  {
    path: 'clientes/nuevo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/clientes/cliente-form.page').then(
        (m) => m.ClienteFormPage,
      ),
  },
  {
    path: 'clientes/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/clientes/cliente-detalle.page').then(
        (m) => m.ClienteDetallePage,
      ),
  },
  {
    path: 'clientes/:id/editar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/clientes/cliente-form.page').then(
        (m) => m.ClienteFormPage,
      ),
  },

  // ── Ventas: NO acceso para REPARTIDOR ──
  {
    path: 'ventas',
    canActivate: [
      authGuard,
      roleGuard(['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA']),
    ],
    loadComponent: () =>
      import('./features/ventas/ventas.page').then((m) => m.VentasPage),
  },
  {
    path: 'ventas/nueva',
    canActivate: [
      authGuard,
      roleGuard(['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA']),
    ],
    loadComponent: () =>
      import('./features/ventas/nueva-venta.page').then(
        (m) => m.NuevaVentaPage,
      ),
  },
  {
    path: 'ventas/detalle/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/ventas/venta-detalle.page').then(
        (m) => m.VentaDetallePage,
      ),
  },

  {
    path: 'carrito',
    canActivate: [
      authGuard,
      roleGuard(['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA']),
    ],
    loadComponent: () =>
      import('./features/carrito/carrito.page').then((m) => m.CarritoPage),
  },

  // ── Repartidor: solo REPARTIDOR/ADMIN/SUPER_ADMIN/GERENTE ──
  {
    path: 'repartidor/entregas',
    canActivate: [
      authGuard,
      roleGuard(['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'REPARTIDOR']),
    ],
    loadComponent: () =>
      import('./features/repartidor/mis-entregas.page').then(
        (m) => m.MisEntregasPage,
      ),
  },
  {
    path: 'repartidor/mapa',
    canActivate: [
      authGuard,
      roleGuard(['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'REPARTIDOR']),
    ],
    loadComponent: () =>
      import('./features/repartidor/mapa-entregas.page').then(
        (m) => m.MapaEntregasPage,
      ),
  },
  {
    path: 'reportes',
    canActivate: [
      authGuard,
      roleGuard(['SUPER_ADMIN', 'PREVENTISTA', 'REPARTIDOR']),
    ],
    loadComponent: () =>
      import('./features/reportes/reportes.page').then((m) => m.ReportesPage),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/perfil/perfil.page').then((m) => m.PerfilPage),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
