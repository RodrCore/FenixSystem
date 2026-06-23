// src/app/shared/components/layout/layout.ts

import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { selectUsuario, selectUserRole } from '../../../store/auth/auth.selectors';
import * as AuthActions from '../../../store/auth/auth.actions';
import { Usuario } from '../../../features/auth/models';

// ─────────────────────────────────────────
// Definición de ítems de navegación
// ─────────────────────────────────────────
export interface NavItem {
  label: string;
  route: string;
  roles?: string[]; // undefined = todos los roles
  badge?: number; // contador opcional (ej: pedidos pendientes)
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard' },
  { label: 'Pedidos', route: '/pedidos' },
  { label: 'Inventario', route: '/inventario' },
  {
    label: 'Reabastecimiento',
    route: '/reabastecimiento',
    roles: ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN'],
  },
  {
    label: 'Clientes',
    route: '/clientes',
    roles: ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA'],
  },
  {
    label: 'Proveedores',
    route: '/proveedores',
    roles: ['SUPER_ADMIN', 'ADMIN', 'ALMACEN'],
  },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: 'Reportes', route: '/reportes', roles: ['SUPER_ADMIN', 'ADMIN', 'GERENTE'] },
  { label: 'Usuarios', route: '/usuarios', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Auditoría', route: '/auditoria', roles: ['SUPER_ADMIN'] },
];

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class LayoutComponent implements OnInit, OnDestroy {
  usuario$!: Observable<Usuario | null>;
  userRole$!: Observable<string | null>;

  usuarioActual: Usuario | null = null;
  rolActual: string | null = null;

  // Estado UI
  mobileOpen = false;
  profileOpen = false;
  darkMode = false;

  // Título dinámico de página
  pageTitle = 'Dashboard';
  pageSub = 'Resumen general del sistema';

  navItems = NAV_ITEMS;
  adminItems = ADMIN_ITEMS;

  // Subtítulos por ruta
  private readonly subtitles: Record<string, string> = {
    '/dashboard': 'Resumen general del sistema',
    '/pedidos': 'Gestión de pedidos y ventas',
    '/inventario': 'Control de stock y lotes',
    '/logistica': 'Rutas y repartos',
    '/clientes': 'Directorio de clientes',
    '/admin/reportes': 'Reportes y estadísticas',
    '/usuarios': 'Gestión de usuarios',
    '/auditoria': 'Registro de actividad',
  };

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.usuario$ = this.store.select(selectUsuario);
    this.userRole$ = this.store.select(selectUserRole);

    this.usuario$.pipe(takeUntil(this.destroy$)).subscribe((u) => (this.usuarioActual = u));

    this.userRole$.pipe(takeUntil(this.destroy$)).subscribe((r) => (this.rolActual = r));

    // Actualizar título según ruta activa
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.updatePageTitle());

    this.updatePageTitle();

    // Cargar preferencia de tema
    const saved = localStorage.getItem('fenix-theme');
    if (saved === 'dark') {
      this.applyDark(true);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Título dinámico ──────────────────────
  private updatePageTitle(): void {
    const url = this.router.url.split('?')[0];
    const all = [...NAV_ITEMS, ...ADMIN_ITEMS];
    const match = all.find((i) => url.startsWith(i.route));
    this.pageTitle = match?.label ?? 'FenixBd';
    this.pageSub = this.subtitles[match?.route ?? ''] ?? '';
  }

  // ── Dark mode ────────────────────────────
  toggleDark(): void {
    this.applyDark(!this.darkMode);
  }

  private applyDark(on: boolean): void {
    this.darkMode = on;

    // ✅ Aplica en <html> — necesario para que :root.dark funcione
    if (on) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('fenix-theme', on ? 'dark' : 'light');
    this.cdr.markForCheck();
  }

  // ── Mobile sidebar ───────────────────────
  toggleMobile(): void {
    this.mobileOpen = !this.mobileOpen;
  }
  closeMobile(): void {
    this.mobileOpen = false;
  }

  // ── Profile menu ─────────────────────────
  toggleProfile(): void {
    this.profileOpen = !this.profileOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('[data-profile]')) {
      this.profileOpen = false;
    }
  }

  // ── Logout ───────────────────────────────
  onLogout(): void {
    this.profileOpen = false;
    this.mobileOpen = false;
    this.store.dispatch(AuthActions.logout());
  }

  // ── Helpers ──────────────────────────────
  get initials(): string {
    if (!this.usuarioActual) return 'U';
    return (
      (this.usuarioActual.nombres?.[0] ?? '').toUpperCase() +
      (this.usuarioActual.apellido_paterno?.[0] ?? '').toUpperCase()
    );
  }

  get nombreCorto(): string {
    if (!this.usuarioActual) return '';
    return `${this.usuarioActual.nombres} ${this.usuarioActual.apellido_paterno[0]}.`;
  }

  canSee(item: NavItem): boolean {
    if (!item.roles) return true;
    return item.roles.includes(this.rolActual ?? '');
  }

  hasAdminItems(): boolean {
    return ADMIN_ITEMS.some((i) => this.canSee(i));
  }
}
