import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { UsuariosService, Usuario, UsuarioStats, Rol } from './services/usuarios.service';
import { UsuarioDetailComponent } from './components/usuario-detail/usuario-detail.component';
import { UsuarioFormComponent } from './components/usuario-form/usuario-form.component';
import { ConfirmActionComponent } from '../../shared/components/confirm-action/confirm-action.component';
import { PasswordTemporalComponent } from './components/password-temporal/password-temporal.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UsuarioDetailComponent,
    UsuarioFormComponent,
    ConfirmActionComponent,
    PasswordTemporalComponent,
  ],
  templateUrl: './usuarios.page.html',
  styleUrl: './usuarios.page.css',
})
export class UsuariosPage implements OnInit, OnDestroy {
  usuarios: Usuario[] = [];
  roles: Rol[] = [];

  stats: UsuarioStats = { total: 0, activos: 0, inactivos: 0, por_rol: {} };

  total = 0;
  page = 1;
  limit = 15;
  pages = 1;
  loading = true;

  filterForm!: FormGroup;

  /** Vista actual: 'normal' (activos + inactivos) o 'eliminados' */
  vistaActiva: 'normal' | 'eliminados' = 'normal';

  readonly estadosDisponibles = [
    { v: '', n: 'Todos' },
    { v: 'true', n: 'Activos' },
    { v: 'false', n: 'Inactivos' },
  ];

  // Drawer
  detalleAbierto = false;
  usuarioDetalleId: number | null = null;

  // Modal de crear/editar
  usuarioEditando: Usuario | null = null;
  mostrarModalNuevo = false;

  // Modal password temporal
  passwordTemporalConfig: {
    open: boolean;
    password: string;
    email: string;
    titulo: string;
  } = { open: false, password: '', email: '', titulo: '' };

  // Modal confirmación
  confirmConfig: any = {
    open: false,
    title: '',
    message: '',
    itemName: '',
    type: 'warning',
    confirmLabel: 'Confirmar',
    askMotivo: false,
    requireMotivo: false,
    motivoPlaceholder: '',
    loading: false,
    action: () => {},
  };

  private destroy$ = new Subject<void>();

  constructor(
    private svc: UsuariosService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      buscar: [''],
      estado: [''],
      rol: [''],
    });

    this.filterForm
      .get('buscar')!
      .valueChanges.pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.load();
      });

    this.loadStats();
    this.loadRoles();
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading = true;
    const f = this.filterForm.value;

    const query: any = { page: this.page, limit: this.limit };
    if ((f.buscar ?? '').trim()) query.buscar = f.buscar.trim();
    if (f.rol) query.rol = f.rol;

    // ✅ Vista
    if (this.vistaActiva === 'eliminados') {
      query.eliminados = true;
    } else {
      // En vista normal aplica el filtro estado
      if (f.estado !== '') query.estado = f.estado;
    }

    this.svc
      .getAll(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.usuarios = res.data;
          this.total = res.total;
          this.pages = res.pages;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  loadStats(): void {
    this.svc
      .getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (s) => {
          this.stats = s;
          this.cdr.markForCheck();
        },
      });
  }

  loadRoles(): void {
    this.svc
      .getRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r) => {
          this.roles = r;
          this.cdr.markForCheck();
        },
      });
  }

  // ═══════════════════════════════════════════════
  // VISTA NORMAL / ELIMINADOS
  // ═══════════════════════════════════════════════
  cambiarVista(v: 'normal' | 'eliminados'): void {
    if (this.vistaActiva === v) return;
    this.vistaActiva = v;
    this.page = 1;
    // Reset filtros de estado al cambiar de vista
    if (v === 'eliminados') {
      this.filterForm.get('estado')?.setValue('');
    }
    this.load();
  }

  // ═══════════════════════════════════════════════
  // FILTROS Y PAGINACIÓN
  // ═══════════════════════════════════════════════
  onFilterChange(): void {
    this.page = 1;
    this.load();
  }

  limpiarFiltros(): void {
    this.filterForm.reset({ buscar: '', estado: '', rol: '' });
    this.page = 1;
    this.load();
  }

  get hayFiltrosActivos(): boolean {
    const f = this.filterForm.value;
    return !!(f.buscar || f.estado !== '' || f.rol);
  }

  goPage(p: number): void {
    if (p < 1 || p > this.pages) return;
    this.page = p;
    this.load();
  }

  get pageNumbers(): number[] {
    const t = this.pages,
      c = this.page;
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
    if (c <= 4) return [1, 2, 3, 4, 5, -1, t];
    if (c >= t - 3) return [1, -1, t - 4, t - 3, t - 2, t - 1, t];
    return [1, -1, c - 1, c, c + 1, -1, t];
  }

  get desde(): number {
    return (this.page - 1) * this.limit + 1;
  }
  get hasta(): number {
    return Math.min(this.page * this.limit, this.total);
  }

  // ═══════════════════════════════════════════════
  // DRAWER
  // ═══════════════════════════════════════════════
  verDetalle(u: Usuario): void {
    this.usuarioDetalleId = u.id;
    this.detalleAbierto = true;
    this.cdr.markForCheck();
  }

  cerrarDetalle(): void {
    this.detalleAbierto = false;
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // NUEVO / EDITAR
  // ═══════════════════════════════════════════════
  abrirNuevoUsuario(): void {
    this.usuarioEditando = null;
    this.mostrarModalNuevo = true;
    this.cdr.markForCheck();
  }

  abrirEditor(u: Usuario): void {
    this.usuarioEditando = u;
    this.mostrarModalNuevo = true;
    this.cdr.markForCheck();
  }

  onUsuarioGuardado(result: any): void {
    this.mostrarModalNuevo = false;
    this.usuarioEditando = null;
    this.load();
    this.loadStats();

    if (result.password_temporal_generada) {
      this.passwordTemporalConfig = {
        open: true,
        password: result.password_temporal_generada,
        email: result.email,
        titulo: 'Usuario creado con password temporal',
      };
    }

    if (this.detalleAbierto && this.usuarioDetalleId === result.id) {
      const id = result.id;
      this.usuarioDetalleId = null;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.usuarioDetalleId = id;
        this.cdr.markForCheck();
      }, 50);
    } else {
      this.cdr.markForCheck();
    }
  }

  onEditCancelled(): void {
    this.mostrarModalNuevo = false;
    this.usuarioEditando = null;
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // RESET PASSWORD
  // ═══════════════════════════════════════════════
  pedirResetPassword(usuario: Usuario): void {
    this.confirmConfig = {
      open: true,
      title: 'Resetear contraseña',
      message:
        'Se generará una nueva contraseña temporal. El usuario deberá cambiarla ' +
        'en su próximo inicio de sesión. Esta acción quedará registrada en auditoría.',
      itemName: `${usuario.nombres} ${usuario.apellido_paterno} · ${usuario.email}`,
      type: 'warning',
      confirmLabel: 'Sí, resetear',
      askMotivo: false,
      requireMotivo: false,
      motivoPlaceholder: '',
      loading: false,
      action: () => this.ejecutarResetPassword(usuario),
    };
    this.cdr.markForCheck();
  }

  private ejecutarResetPassword(usuario: Usuario): void {
    this.confirmConfig.loading = true;
    this.cdr.markForCheck();

    this.svc
      .resetPassword(usuario.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r) => {
          this.confirmConfig.open = false;
          this.confirmConfig.loading = false;
          this.passwordTemporalConfig = {
            open: true,
            password: r.password_temporal,
            email: r.email,
            titulo: 'Contraseña reseteada',
          };
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.confirmConfig.loading = false;
          this.cdr.markForCheck();
          alert(e?.error?.message ?? 'Error al resetear');
        },
      });
  }

  // ═══════════════════════════════════════════════
  // ACTIVAR / DESACTIVAR
  // ═══════════════════════════════════════════════
  pedirToggleActive(usuario: Usuario): void {
    const willActivate = !usuario.estado;
    this.confirmConfig = {
      open: true,
      title: willActivate ? 'Reactivar usuario' : 'Desactivar usuario',
      message: willActivate
        ? 'El usuario podrá volver a iniciar sesión en el sistema.'
        : 'El usuario quedará Inactivo y no podrá iniciar sesión. ' +
          'Podrás reactivarlo más tarde o eliminarlo definitivamente.',
      itemName: `${usuario.nombres} ${usuario.apellido_paterno} · ${usuario.email}`,
      type: willActivate ? 'warning' : 'warning',
      confirmLabel: willActivate ? 'Sí, reactivar' : 'Sí, desactivar',
      askMotivo: false,
      requireMotivo: false,
      motivoPlaceholder: '',
      loading: false,
      action: () => this.ejecutarToggleActive(usuario, willActivate),
    };
    this.cdr.markForCheck();
  }

  private ejecutarToggleActive(usuario: Usuario, nuevoEstado: boolean): void {
    this.confirmConfig.loading = true;
    this.cdr.markForCheck();

    this.svc
      .toggleActive(usuario.id, nuevoEstado)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (u) => {
          this.confirmConfig.open = false;
          this.confirmConfig.loading = false;
          this.load();
          this.loadStats();
          // Recargar drawer
          if (this.usuarioDetalleId === u.id) {
            const id = u.id;
            this.usuarioDetalleId = null;
            this.cdr.markForCheck();
            setTimeout(() => {
              this.usuarioDetalleId = id;
              this.cdr.markForCheck();
            }, 50);
          }
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.confirmConfig.loading = false;
          this.cdr.markForCheck();
          alert(e?.error?.message ?? 'Error al cambiar estado');
        },
      });
  }

  // ═══════════════════════════════════════════════
  // ELIMINAR DEFINITIVO (solo SUPER_ADMIN, solo si está inactivo)
  // ═══════════════════════════════════════════════
  pedirEliminarUsuario(usuario: Usuario): void {
    // Doble seguridad en el cliente
    if (usuario.estado === true) {
      alert('El usuario debe estar Inactivo antes de eliminarlo. Desactívalo primero.');
      return;
    }

    this.confirmConfig = {
      open: true,
      title: 'Eliminar usuario definitivamente',
      message:
        'El usuario será eliminado del sistema. Esta acción es permanente ' +
        '(solo SUPER_ADMIN puede restaurarlo). Quedará registrada en auditoría.',
      itemName: `${usuario.nombres} ${usuario.apellido_paterno} · ${usuario.email}`,
      type: 'danger',
      confirmLabel: 'Sí, eliminar',
      askMotivo: true,
      requireMotivo: true,
      motivoPlaceholder: 'Motivo (obligatorio)',
      loading: false,
      action: (motivo: string) => this.ejecutarEliminacion(usuario, motivo),
    };
    this.cdr.markForCheck();
  }

  private ejecutarEliminacion(usuario: Usuario, motivo: string): void {
    this.confirmConfig.loading = true;
    this.cdr.markForCheck();

    this.svc
      .delete(usuario.id, motivo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.confirmConfig.open = false;
          this.confirmConfig.loading = false;
          this.cerrarDetalle();
          this.load();
          this.loadStats();
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.confirmConfig.loading = false;
          this.cdr.markForCheck();
          alert(e?.error?.message ?? 'Error al eliminar');
        },
      });
  }

  // ═══════════════════════════════════════════════
  // RESTAURAR
  // ═══════════════════════════════════════════════
  pedirRestaurarUsuario(usuario: Usuario): void {
    this.confirmConfig = {
      open: true,
      title: 'Restaurar usuario eliminado',
      message:
        'El usuario será restaurado y volverá a aparecer en la lista. ' +
        'Quedará en estado Inactivo; podrás reactivarlo cuando quieras.',
      itemName: `${usuario.nombres} ${usuario.apellido_paterno} · ${usuario.email}`,
      type: 'warning',
      confirmLabel: 'Sí, restaurar',
      askMotivo: false,
      requireMotivo: false,
      motivoPlaceholder: '',
      loading: false,
      action: () => this.ejecutarRestaurar(usuario),
    };
    this.cdr.markForCheck();
  }

  private ejecutarRestaurar(usuario: Usuario): void {
    this.confirmConfig.loading = true;
    this.cdr.markForCheck();

    this.svc
      .restore(usuario.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.confirmConfig.open = false;
          this.confirmConfig.loading = false;
          this.cerrarDetalle();
          this.load();
          this.loadStats();
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.confirmConfig.loading = false;
          this.cdr.markForCheck();
          alert(e?.error?.message ?? 'Error al restaurar');
        },
      });
  }

  onConfirmConfirmed(motivo: string): void {
    this.confirmConfig.action(motivo);
  }

  onConfirmCancelled(): void {
    this.confirmConfig.open = false;
    this.cdr.markForCheck();
  }

  cerrarPasswordTemporal(): void {
    this.passwordTemporalConfig.open = false;
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════
  iniciales(u: Usuario): string {
    const n = (u.nombres?.[0] ?? '') + (u.apellido_paterno?.[0] ?? '');
    return n.toUpperCase() || '?';
  }

  colorRol(nombre?: string): string {
    const m: Record<string, string> = {
      SUPER_ADMIN: '#7C3AED',
      ADMIN: '#E11D48',
      GERENTE: '#0891B2',
      PREVENTISTA: '#D97706',
      REPARTIDOR: '#059669',
    };
    return m[nombre ?? ''] ?? '#64748B';
  }

  nombreCompleto(u: Usuario): string {
    return [u.nombres, u.apellido_paterno, u.apellido_materno].filter(Boolean).join(' ');
  }
}
