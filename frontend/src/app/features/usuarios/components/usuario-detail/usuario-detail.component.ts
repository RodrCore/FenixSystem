import {
  Component, Input, Output, EventEmitter,
  OnChanges, SimpleChanges,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuariosService, Usuario } from '../../services/usuarios.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector:    'app-usuario-detail',
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:     [CommonModule],
  templateUrl: './usuario-detail.component.html',
  styleUrl:    './usuario-detail.component.css',
})
export class UsuarioDetailComponent implements OnChanges {
  @Input() usuarioId: number | null = null;
  @Input() open = false;

  @Output() closed                = new EventEmitter<void>();
  @Output() editRequest           = new EventEmitter<Usuario>();
  @Output() resetPasswordRequest  = new EventEmitter<Usuario>();
  @Output() toggleActiveRequest   = new EventEmitter<Usuario>();   // ✅ NUEVO
  @Output() deleteRequest         = new EventEmitter<Usuario>();
  @Output() restoreRequest        = new EventEmitter<Usuario>();   // ✅ NUEVO

  usuario: Usuario | null = null;
  loading = false;

  constructor(
    private svc:  UsuariosService,
    private auth: AuthService,
    private cdr:  ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuarioId'] && this.usuarioId) {
      this.cargar();
    }
    if (changes['open'] && !this.open) {
      this.usuario = null;
    }
  }

  private cargar(): void {
    if (!this.usuarioId) return;
    this.loading = true;
    this.usuario = null;

    this.svc.getOne(this.usuarioId).subscribe({
      next: u => {
        this.usuario = u;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  cerrar(): void { this.closed.emit(); }

  // ═══════════════════════════════════════════════
  // PERMISOS
  // ═══════════════════════════════════════════════
  get rolActual(): string {
    return this.auth.getUsuario()?.rol?.nombre ?? '';
  }
  get idActual(): number {
    return this.auth.getUsuario()?.id ?? 0;
  }
  get esSuperAdmin(): boolean {
    return this.rolActual === 'SUPER_ADMIN';
  }
  get esAdmin(): boolean {
    return ['SUPER_ADMIN', 'ADMIN'].includes(this.rolActual);
  }
  get usuarioEsSuperAdmin(): boolean {
    return this.usuario?.rol?.nombre === 'SUPER_ADMIN';
  }
  get esYoMismo(): boolean {
    return this.usuario?.id === this.idActual;
  }
  get estaEliminado(): boolean {
    return !!this.usuario?.deleted_at;
  }
  get estaActivo(): boolean {
    return !!this.usuario?.estado && !this.estaEliminado;
  }

  /** Puede editar si es admin, no es super-admin (cuando ADMIN), y no está eliminado */
  get puedeEditar(): boolean {
    if (!this.usuario || this.estaEliminado) return false;
    if (!this.esAdmin) return false;
    if (this.rolActual === 'ADMIN' && this.usuarioEsSuperAdmin) return false;
    return true;
  }

  /** Puede resetear password si es admin (mismas reglas que editar) */
  get puedeResetearPassword(): boolean {
    return this.puedeEditar;
  }

  /** Puede activar/desactivar al usuario */
  get puedeToggleActive(): boolean {
    if (!this.usuario || this.estaEliminado) return false;
    if (!this.esAdmin) return false;
    if (this.rolActual === 'ADMIN' && this.usuarioEsSuperAdmin) return false;
    if (this.esYoMismo && this.estaActivo) return false; // no auto-desactivarse
    return true;
  }

  /** Texto del botón según el estado actual */
  get textoToggleActive(): string {
    return this.estaActivo ? 'Desactivar' : 'Reactivar';
  }

  /**
   * Solo SUPER_ADMIN puede ELIMINAR definitivamente
   * Y solo si el usuario YA está inactivo (estado: false)
   * Y no es SUPER_ADMIN, ni soy yo mismo
   */
  get puedeEliminar(): boolean {
    if (!this.usuario || this.estaEliminado) return false;
    if (!this.esSuperAdmin) return false;
    if (this.usuarioEsSuperAdmin) return false;
    if (this.esYoMismo) return false;
    // ✅ NUEVA REGLA: solo si ya está inactivo
    if (this.usuario.estado === true) return false;
    return true;
  }

  /** SUPER_ADMIN puede restaurar usuarios eliminados */
  get puedeRestaurar(): boolean {
    if (!this.usuario || !this.estaEliminado) return false;
    return this.esSuperAdmin;
  }

  // ═══════════════════════════════════════════════
  // ACCIONES
  // ═══════════════════════════════════════════════
  onEditar(): void {
    if (this.usuario) this.editRequest.emit(this.usuario);
  }

  onResetPassword(): void {
    if (this.usuario) this.resetPasswordRequest.emit(this.usuario);
  }

  onToggleActive(): void {
    if (this.usuario) this.toggleActiveRequest.emit(this.usuario);
  }

  onEliminar(): void {
    if (this.usuario) this.deleteRequest.emit(this.usuario);
  }

  onRestaurar(): void {
    if (this.usuario) this.restoreRequest.emit(this.usuario);
  }

  llamar(): void {
    if (this.usuario?.telefono) {
      window.location.href = `tel:${this.usuario.telefono}`;
    }
  }

  enviarEmail(): void {
    if (this.usuario?.email) {
      window.location.href = `mailto:${this.usuario.email}`;
    }
  }

  // ═══════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════
  get nombreCompleto(): string {
    if (!this.usuario) return '';
    return [
      this.usuario.nombres,
      this.usuario.apellido_paterno,
      this.usuario.apellido_materno,
    ].filter(Boolean).join(' ');
  }

  get iniciales(): string {
    if (!this.usuario) return '?';
    const n = (this.usuario.nombres?.[0] ?? '') + (this.usuario.apellido_paterno?.[0] ?? '');
    return n.toUpperCase() || '?';
  }

  colorRol(nombre?: string): string {
    const m: Record<string, string> = {
      SUPER_ADMIN: '#7C3AED',
      ADMIN:       '#E11D48',
      GERENTE:     '#0891B2',
      PREVENTISTA: '#D97706',
      REPARTIDOR:  '#059669',
    };
    return m[nombre ?? ''] ?? '#64748B';
  }

  get tieneIntentosFallidos(): boolean {
    return (this.usuario?.intentos_fallidos_login ?? 0) > 0;
  }

  get estaBloqueado(): boolean {
    if (!this.usuario?.bloqueado_hasta) return false;
    return new Date(this.usuario.bloqueado_hasta) > new Date();
  }
}