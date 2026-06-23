import {
  Component, Input, Output, EventEmitter,
  OnChanges, SimpleChanges,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidosService, Pedido } from '../../services/pedidos.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector:    'app-pedido-detail',
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:     [CommonModule],
  templateUrl: './pedido-detail.component.html',
  styleUrl:    './pedido-detail.component.css',
})
export class PedidoDetailComponent implements OnChanges {
  @Input() pedidoId: number | null = null;
  @Input() open = false;

  @Output() closed       = new EventEmitter<void>();
  @Output() editRequest  = new EventEmitter<Pedido>();
  @Output() cancelRequest = new EventEmitter<Pedido>();
  @Output() deleteRequest = new EventEmitter<Pedido>();

  pedido: Pedido | null = null;
  loading = false;

  // Generación de boleta
  generandoBoleta = false;

  constructor(
    private svc:  PedidosService,
    private auth: AuthService,
    private cdr:  ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pedidoId'] && this.pedidoId) {
      this.cargar();
    }
    if (changes['open'] && !this.open) {
      // Al cerrar, limpiar
      this.pedido = null;
    }
  }

  private cargar(): void {
    if (!this.pedidoId) return;
    this.loading = true;
    this.pedido  = null;

    this.svc.getOne(this.pedidoId).subscribe({
      next: p => {
        this.pedido  = p;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  cerrar(): void {
    this.closed.emit();
  }

  // ═══════════════════════════════════════════════
  // PERMISOS POR ROL
  // ═══════════════════════════════════════════════
  get rolActual(): string {
    return this.auth.getUsuario()?.rol?.nombre ?? '';
}

  get usuarioId(): number {
    return this.auth.getUsuario()?.id ?? 0;
  }

  get esAdmin(): boolean {
    return ['SUPER_ADMIN', 'ADMIN', 'GERENTE'].includes(this.rolActual);
  }

  /** Estados que permiten edición */
  private esEditable(): boolean {
    if (!this.pedido) return false;
    return ['Borrador', 'Confirmado', 'Preparando', 'Listo_Carga'].includes(this.pedido.estado);
  }

  /** Mostrar botón EDITAR */
  get puedeEditar(): boolean {
    return this.esAdmin && this.esEditable() && !this.pedido?.deleted_at;
  }

  /** Mostrar botón CANCELAR */
  get puedeCancelar(): boolean {
    if (!this.pedido) return false;
    if (this.pedido.deleted_at) return false;
    if (this.pedido.estado === 'Cancelado') return false;
    if (['Entregado_Total', 'Entregado_Parcial'].includes(this.pedido.estado)) return false;

    if (this.esAdmin) return true;

    // Preventista solo puede cancelar los suyos en Borrador/Confirmado
    if (this.rolActual === 'PREVENTISTA') {
      return this.pedido.preventista_id === this.usuarioId &&
        ['Borrador', 'Confirmado'].includes(this.pedido.estado);
    }
    return false;
  }

  /** Mostrar botón ELIMINAR */
  get puedeEliminar(): boolean {
    return this.esAdmin && !this.pedido?.deleted_at;
  }

  /** Mostrar botón GENERAR BOLETA */
  get puedeGenerarBoleta(): boolean {
    if (!this.pedido) return false;
    if (this.pedido.deleted_at) return false;
    if (this.pedido.estado === 'Borrador' || this.pedido.estado === 'Cancelado') return false;

    if (this.esAdmin) return true;
    if (this.rolActual === 'PREVENTISTA') {
      return this.pedido.preventista_id === this.usuarioId;
    }
    return false;
  }

  // ═══════════════════════════════════════════════
  // ACCIONES
  // ═══════════════════════════════════════════════
  onEditar(): void {
    if (this.pedido) this.editRequest.emit(this.pedido);
  }

  onCancelar(): void {
    if (this.pedido) this.cancelRequest.emit(this.pedido);
  }

  onEliminar(): void {
    if (this.pedido) this.deleteRequest.emit(this.pedido);
  }

  async onGenerarBoleta(): Promise<void> {
    if (!this.pedido || this.generandoBoleta) return;
    this.generandoBoleta = true;
    this.cdr.markForCheck();

    try {
      this.svc.generarBoleta(this.pedido.id).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `boleta-${this.pedido?.numero_pedido ?? this.pedido?.id}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.generandoBoleta = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.generandoBoleta = false;
          this.cdr.markForCheck();
          alert('Error generando la boleta');
        },
      });
    } catch (e) {
      this.generandoBoleta = false;
      this.cdr.markForCheck();
    }
  }

  // ═══════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════
  estadoColor(estado: string): string {
    const m: Record<string, string> = {
      Borrador:           '#64748B',
      Confirmado:         '#2563EB',
      Preparando:         '#D97706',
      Listo_Carga:        '#7C3AED',
      En_Ruta:            '#0891B2',
      Entregado_Total:    '#059669',
      Entregado_Parcial:  '#F59E0B',
      Cancelado:          '#DC2626',
      Devuelto:           '#EF4444',
    };
    return m[estado] ?? '#64748B';
  }

  // Recalcular totales locales para mostrar el desglose
  get subtotal(): number {
    if (!this.pedido?.detalles) return 0;
    return this.pedido.detalles.reduce((acc, d) =>
      acc + Number(d.subtotal_solicitado ?? 0), 0);
  }
}