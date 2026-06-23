import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  selectUsuario,
  selectUserRole,
  selectIsAuthenticated,
} from '../../../store/auth/auth.selectors';
import * as AuthActions from '../../../store/auth/auth.actions';
import { Usuario } from '../../../features/auth/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  usuario$!: Observable<Usuario | null>;
  userRole$!: Observable<string | null>;
  isAuthenticated$!: Observable<boolean>;
  isMenuOpen = false;
  isProfileMenuOpen = false;

  // ✅ Propiedades calculadas en el TS (no en el template)
  usuarioActual: Usuario | null = null;
  rolActual: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private store: Store, private router: Router) {}

  ngOnInit(): void {
    this.usuario$ = this.store.select(selectUsuario);
    this.userRole$ = this.store.select(selectUserRole);
    this.isAuthenticated$ = this.store.select(selectIsAuthenticated);

    // ✅ Guardar valores en propiedades para usar en el template sin lógica compleja
    this.usuario$
      .pipe(takeUntil(this.destroy$))
      .subscribe((u) => (this.usuarioActual = u));

    this.userRole$
      .pipe(takeUntil(this.destroy$))
      .subscribe((r) => (this.rolActual = r));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleMenu() { this.isMenuOpen = !this.isMenuOpen; }
  toggleProfileMenu() { this.isProfileMenuOpen = !this.isProfileMenuOpen; }
  closeMenus() { this.isMenuOpen = false; this.isProfileMenuOpen = false; }

  onLogout(): void {
    this.store.dispatch(AuthActions.logout());
    this.closeMenus();
    this.router.navigate(['/login']);
  }

  // ✅ Getter para iniciales — calculado en TS, no en template
  get initials(): string {
    if (!this.usuarioActual) return 'U';
    return (
      (this.usuarioActual.nombres?.[0] ?? '').toUpperCase() +
      (this.usuarioActual.apellido_paterno?.[0] ?? '').toUpperCase()
    );
  }

  // ✅ Getters para roles — simples, en TS
  get isAdmin(): boolean {
    return this.rolActual === 'SUPER_ADMIN' || this.rolActual === 'ADMIN';
  }

  get isSuperAdmin(): boolean {
    return this.rolActual === 'SUPER_ADMIN';
  }
}