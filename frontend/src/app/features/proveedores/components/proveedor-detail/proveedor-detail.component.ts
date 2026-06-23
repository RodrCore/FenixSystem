import {
  Component, Input, Output, EventEmitter,
  OnChanges, SimpleChanges,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProveedoresService, Proveedor } from '../../services/proveedores.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector:    'app-proveedor-detail',
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:     [CommonModule],
  templateUrl: './proveedor-detail.component.html',
  styleUrl:    './proveedor-detail.component.css',
})
export class ProveedorDetailComponent implements OnChanges {
  @Input() proveedorId: number | null = null;
  @Input() open = false;

  @Output() closed              = new EventEmitter<void>();
  @Output() editRequest         = new EventEmitter<Proveedor>();
  @Output() toggleActiveRequest = new EventEmitter<Proveedor>();
  @Output() deleteRequest       = new EventEmitter<Proveedor>();
  @Output() restoreRequest      = new EventEmitter<Proveedor>();

  proveedor: Proveedor | null = null;
  loading = false;
  tabActiva: 'datos' | 'ordenes' | 'lotes' = 'datos';

  constructor(
    private svc:  ProveedoresService,
    private auth: AuthService,
    private cdr:  ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['proveedorId'] && this.proveedorId) {
      this.cargar();
    }
    if (changes['open'] && !this.open) {
      this.proveedor = null;
      this.tabActiva = 'datos';
    }
  }

  private cargar(): void {
    if (!this.proveedorId) return;
    this.loading = true;
    this.proveedor = null;
    this.tabActiva = 'datos';

    this.svc.getOne(this.proveedorId).subscribe({
      next: p => {
        this.proveedor = p;
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

  irTab(t: typeof this.tabActiva): void {
    this.tabActiva = t;
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // PERMISOS
  // ═══════════════════════════════════════════════
  get rolActual(): string {
    return this.auth.getUsuario()?.rol?.nombre ?? '';
  }

  get esSuperAdmin(): boolean {
    return this.rolActual === 'SUPER_ADMIN';
  }

  get puedeGestionar(): boolean {
    return ['SUPER_ADMIN', 'ADMIN', 'ALMACEN'].includes(this.rolActual);
  }

  get puedeEliminar(): boolean {
    return ['SUPER_ADMIN', 'ADMIN'].includes(this.rolActual);
  }

  get estaEliminado(): boolean {
    return !!this.proveedor?.deleted_at;
  }

  get estaActivo(): boolean {
    return !!this.proveedor?.activo && !this.estaEliminado;
  }

  get textoToggleActive(): string {
    return this.estaActivo ? 'Desactivar' : 'Activar';
  }

  // ═══════════════════════════════════════════════
  // ACCIONES
  // ═══════════════════════════════════════════════
  onEditar(): void {
    if (this.proveedor) this.editRequest.emit(this.proveedor);
  }

  onToggleActive(): void {
    if (this.proveedor) this.toggleActiveRequest.emit(this.proveedor);
  }

  onEliminar(): void {
    if (this.proveedor) this.deleteRequest.emit(this.proveedor);
  }

  onRestaurar(): void {
    if (this.proveedor) this.restoreRequest.emit(this.proveedor);
  }

  llamar(): void {
    if (this.proveedor?.contacto_telefono) {
      window.location.href = `tel:${this.proveedor.contacto_telefono}`;
    }
  }

  enviarEmail(): void {
    if (this.proveedor?.contacto_email) {
      window.location.href = `mailto:${this.proveedor.contacto_email}`;
    }
  }

  abrirMapa(): void {
    if (this.proveedor?.latitud && this.proveedor?.longitud) {
      window.open(
        `https://www.openstreetmap.org/?mlat=${this.proveedor.latitud}&mlon=${this.proveedor.longitud}&zoom=17`,
        '_blank',
      );
    }
  }

  // ═══════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════
  iniciales(): string {
    if (!this.proveedor) return '?';
    const palabras = this.proveedor.razon_social.split(/\s+/).filter(Boolean);
    if (palabras.length === 1) return palabras[0].substring(0, 2).toUpperCase();
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
  }

  colorEstado(estado: string): string {
    const m: Record<string, string> = {
      Pendiente: '#D97706',
      Recibido_Total: '#059669',
      Recibido_Parcial: '#0891B2',
      Cancelado: '#94A3B8',
    };
    return m[estado] || '#64748B';
  }

  colorEstadoLote(estado: string): string {
    const m: Record<string, string> = {
      Disponible: '#059669',
      Agotado: '#94A3B8',
      Vencido: '#DC2626',
      Por_Vencer: '#D97706',
    };
    return m[estado] || '#64748B';
  }
}