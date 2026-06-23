import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import {
  ReabastecimientoService,
  OrdenReabastecimiento,
} from '../../services/reabastecimiento.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-reabastecimiento-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './reabastecimiento-detail.component.html',
  styleUrl: './reabastecimiento-detail.component.css',
})
export class ReabastecimientoDetailComponent implements OnChanges {
  @Input() ordenId: number | null = null;
  @Input() open = false;

  @Output() closed = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<void>();
  @Output() cancelRequest = new EventEmitter<OrdenReabastecimiento>();
  @Output() deleteRequest = new EventEmitter<OrdenReabastecimiento>();

  orden: OrdenReabastecimiento | null = null;
  loading = false;

  // Modo "Recibir"
  modoRecibir = false;
  recibiendo = false;
  cantidadesRecibidas: { [detalleId: number]: number } = {};

  private destroy$ = new Subject<void>();

  constructor(
    private svc: ReabastecimientoService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ordenId'] && this.ordenId) {
      this.cargar();
    }
    if (changes['open'] && !this.open) {
      this.orden = null;
      this.modoRecibir = false;
    }
  }

  private cargar(): void {
    if (!this.ordenId) return;
    this.loading = true;
    this.orden = null;
    this.modoRecibir = false;

    this.svc.getOne(this.ordenId).subscribe({
      next: (o) => {
        this.orden = o;
        this.loading = false;
        // Pre-llenar cantidades recibidas con cantidad_solicitada
        this.cantidadesRecibidas = {};
        o.detalles?.forEach((d) => {
          if (d.id) this.cantidadesRecibidas[d.id] = d.cantidad_solicitada;
        });
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
  // PERMISOS
  // ═══════════════════════════════════════════════
  get rolActual(): string {
    return this.auth.getUsuario()?.rol?.nombre ?? '';
  }

  get puedeRecibir(): boolean {
    return (
      ['SUPER_ADMIN', 'ADMIN', 'ALMACEN'].includes(this.rolActual) &&
      this.orden?.estado === 'Pendiente' &&
      !this.orden?.deleted_at
    );
  }

  get puedeCancelar(): boolean {
    return (
      ['SUPER_ADMIN', 'ADMIN'].includes(this.rolActual) &&
      this.orden?.estado === 'Pendiente' &&
      !this.orden?.deleted_at
    );
  }

  get puedeEliminar(): boolean {
    return ['SUPER_ADMIN', 'ADMIN'].includes(this.rolActual) && !this.orden?.deleted_at;
  }

  get puedeDescargarPdf(): boolean {
    return !!this.orden && !this.orden.deleted_at;
  }

  // ═══════════════════════════════════════════════
  // MODO RECIBIR
  // ═══════════════════════════════════════════════
  iniciarRecibir(): void {
    this.modoRecibir = true;
    this.cdr.markForCheck();
  }

  cancelarRecibir(): void {
    this.modoRecibir = false;
    // Restaurar cantidades
    this.cantidadesRecibidas = {};
    this.orden?.detalles?.forEach((d) => {
      if (d.id) this.cantidadesRecibidas[d.id] = d.cantidad_solicitada;
    });
    this.cdr.markForCheck();
  }

  actualizarRecibido(detalleId: number, valor: any): void {
    const n = Math.max(0, Math.floor(Number(valor) || 0));
    const detalle = this.orden?.detalles?.find((d) => d.id === detalleId);
    if (detalle) {
      const max = detalle.cantidad_solicitada;
      this.cantidadesRecibidas[detalleId] = Math.min(n, max);
    }
    this.cdr.markForCheck();
  }

  marcarTodoCompleto(): void {
    this.orden?.detalles?.forEach((d) => {
      if (d.id) this.cantidadesRecibidas[d.id] = d.cantidad_solicitada;
    });
    this.cdr.markForCheck();
  }

  marcarNadaRecibido(): void {
    this.orden?.detalles?.forEach((d) => {
      if (d.id) this.cantidadesRecibidas[d.id] = 0;
    });
    this.cdr.markForCheck();
  }

  confirmarRecepcion(): void {
    if (!this.orden) return;

    const totalRecibido = Object.values(this.cantidadesRecibidas).reduce((sum, v) => sum + v, 0);
    if (totalRecibido === 0) {
      if (!confirm('No has marcado ninguna cantidad recibida. ¿Continuar?')) return;
    }

    this.recibiendo = true;
    this.cdr.markForCheck();

    const detalles = Object.entries(this.cantidadesRecibidas).map(([k, v]) => ({
      detalle_id: Number(k),
      cantidad_recibida: v,
    }));

    this.svc
      .recibir(this.orden.id, detalles)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.recibiendo = false;
          this.modoRecibir = false;
          this.actualizado.emit();
        },
        error: (e) => {
          this.recibiendo = false;
          this.cdr.markForCheck();
          alert(e?.error?.message ?? 'Error al recibir');
        },
      });
  }

  // ═══════════════════════════════════════════════
  // OTRAS ACCIONES
  // ═══════════════════════════════════════════════
  cancelarOrden(): void {
    if (this.orden) this.cancelRequest.emit(this.orden);
  }

  eliminarOrden(): void {
    if (this.orden) this.deleteRequest.emit(this.orden);
  }

  descargarPdf(): void {
    if (!this.orden) return;

    this.svc.descargarPdf(this.orden.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 5000);

        if (!win) {
          const a = document.createElement('a');
          a.href = url;
          a.download = `${this.orden!.numero_orden}.pdf`;
          a.click();
        }
      },
      error: (e) => {
        console.error('Error descargando PDF:', e);
        alert(e?.error?.message || 'Error al descargar el PDF');
      },
    });
  }

  // ═══════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════
  estadoColor(e?: string): string {
    const m: Record<string, string> = {
      Pendiente: '#D97706',
      Recibido_Total: '#059669',
      Recibido_Parcial: '#F59E0B',
      Cancelado: '#DC2626',
    };
    return m[e ?? ''] ?? '#64748B';
  }

  formatEstado(e?: string): string {
    return (e ?? '').replace('_', ' ');
  }

  get totalItems(): number {
    return this.orden?.detalles?.length ?? 0;
  }

  get totalSolicitado(): number {
    return this.orden?.detalles?.reduce((sum, d) => sum + d.cantidad_solicitada, 0) ?? 0;
  }

  get totalRecibidoActual(): number {
    return this.orden?.detalles?.reduce((sum, d) => sum + d.cantidad_recibida, 0) ?? 0;
  }

  get totalRecibiendoNuevo(): number {
    return Object.values(this.cantidadesRecibidas).reduce((sum, v) => sum + v, 0);
  }
}
