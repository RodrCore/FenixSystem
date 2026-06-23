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

import {
  ReabastecimientoService,
  OrdenReabastecimiento,
  ReabastecimientoStats,
} from './services/reabastecimiento.service';
import { ReabastecimientoDetailComponent } from './components/reabastecimiento-detail/reabastecimiento-detail.component';
import { ReabastecimientoFormComponent } from './components/reabastecimiento-form/reabastecimiento-form.component';
import { ConfirmActionComponent } from '../../shared/components/confirm-action/confirm-action.component';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-reabastecimiento',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ReabastecimientoDetailComponent,
    ReabastecimientoFormComponent,
    ConfirmActionComponent,
  ],
  templateUrl: './reabastecimiento.page.html',
  styleUrl: './reabastecimiento.page.css',
})
export class ReabastecimientoPage implements OnInit, OnDestroy {
  ordenes: OrdenReabastecimiento[] = [];
  stats: ReabastecimientoStats = {
    total: 0,
    pendientes: 0,
    recibidas_hoy: 0,
    total_mes: 0,
  };

  total = 0;
  page = 1;
  limit = 15;
  pages = 1;
  loading = true;

  filterForm!: FormGroup;

  readonly estadosDisponibles = [
    { v: '', n: 'Todos' },
    { v: 'Pendiente', n: 'Pendientes' },
    { v: 'Recibido_Total', n: 'Recibidos' },
    { v: 'Recibido_Parcial', n: 'Recibidos parciales' },
    { v: 'Cancelado', n: 'Cancelados' },
  ];

  // Drawer detalle
  detalleAbierto = false;
  ordenDetalleId: number | null = null;

  // Modal nuevo
  mostrarModalNuevo = false;

  // Confirm
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
    private svc: ReabastecimientoService,
    private fb: FormBuilder,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      buscar: [''],
      estado: [''],
    });

    this.filterForm
      .get('buscar')!
      .valueChanges.pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.load();
      });

    this.loadStats();
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ═══════════════════════════════════════════════
  // PERMISOS
  // ═══════════════════════════════════════════════
  get rolActual(): string {
    return this.auth.getUsuario()?.rol?.nombre ?? '';
  }

  get puedeCrear(): boolean {
    return ['SUPER_ADMIN', 'ADMIN', 'ALMACEN'].includes(this.rolActual);
  }

  // ═══════════════════════════════════════════════
  // CARGA
  // ═══════════════════════════════════════════════
  load(): void {
    this.loading = true;
    const f = this.filterForm.value;

    const query: any = { page: this.page, limit: this.limit };
    if ((f.buscar ?? '').trim()) query.buscar = f.buscar.trim();
    if (f.estado) query.estado = f.estado;

    this.svc
      .getAll(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.ordenes = res.data;
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

  // ═══════════════════════════════════════════════
  // FILTROS Y PAGINACIÓN
  // ═══════════════════════════════════════════════
  onFilterChange(): void {
    this.page = 1;
    this.load();
  }

  limpiarFiltros(): void {
    this.filterForm.reset({ buscar: '', estado: '' });
    this.page = 1;
    this.load();
  }

  get hayFiltrosActivos(): boolean {
    const f = this.filterForm.value;
    return !!(f.buscar || f.estado);
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
  verDetalle(o: OrdenReabastecimiento): void {
    this.ordenDetalleId = o.id;
    this.detalleAbierto = true;
    this.cdr.markForCheck();
  }

  cerrarDetalle(): void {
    this.detalleAbierto = false;
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // NUEVO REABASTECIMIENTO
  // ═══════════════════════════════════════════════
  abrirNuevo(): void {
    this.mostrarModalNuevo = true;
    this.cdr.markForCheck();
  }

  onCreado(): void {
    this.mostrarModalNuevo = false;
    this.load();
    this.loadStats();
    this.cdr.markForCheck();
  }

  onNuevoCancelado(): void {
    this.mostrarModalNuevo = false;
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // RECIBIR / CANCELAR / ELIMINAR — manejados desde el drawer
  // ═══════════════════════════════════════════════
  onOrdenActualizada(): void {
    this.load();
    this.loadStats();
    // Refrescar el drawer
    if (this.ordenDetalleId) {
      const id = this.ordenDetalleId;
      this.ordenDetalleId = null;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.ordenDetalleId = id;
        this.cdr.markForCheck();
      }, 50);
    }
  }

  pedirCancelarOrden(orden: OrdenReabastecimiento): void {
    this.confirmConfig = {
      open: true,
      title: 'Cancelar orden',
      message: 'La orden quedará cancelada y no se podrá recibir.',
      itemName: orden.numero_orden,
      type: 'warning',
      confirmLabel: 'Sí, cancelar',
      askMotivo: true,
      requireMotivo: true,
      motivoPlaceholder: 'Motivo (obligatorio)',
      loading: false,
      action: (motivo: string) => this.ejecutarCancelar(orden, motivo),
    };
    this.cdr.markForCheck();
  }

  private ejecutarCancelar(orden: OrdenReabastecimiento, motivo: string): void {
    this.confirmConfig.loading = true;
    this.cdr.markForCheck();
    this.svc
      .cancelar(orden.id, motivo)
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
          alert(e?.error?.message ?? 'Error al cancelar');
        },
      });
  }

  pedirEliminarOrden(orden: OrdenReabastecimiento): void {
    this.confirmConfig = {
      open: true,
      title: 'Eliminar orden',
      message: 'La orden quedará eliminada del listado. Esta acción queda registrada en auditoría.',
      itemName: orden.numero_orden,
      type: 'danger',
      confirmLabel: 'Sí, eliminar',
      askMotivo: true,
      requireMotivo: true,
      motivoPlaceholder: 'Motivo (obligatorio)',
      loading: false,
      action: (motivo: string) => this.ejecutarEliminar(orden, motivo),
    };
    this.cdr.markForCheck();
  }

  private ejecutarEliminar(orden: OrdenReabastecimiento, motivo: string): void {
    this.confirmConfig.loading = true;
    this.cdr.markForCheck();
    this.svc
      .delete(orden.id, motivo)
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

  onConfirmConfirmed(motivo: string): void {
    this.confirmConfig.action(motivo);
  }

  onConfirmCancelled(): void {
    this.confirmConfig.open = false;
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // PDF
  // ═══════════════════════════════════════════════
  descargarPdf(orden: OrdenReabastecimiento, event?: Event): void {
    event?.stopPropagation();

    this.svc
      .descargarPdf(orden.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          // Abrir en nueva pestaña
          const win = window.open(url, '_blank');
          // Liberar memoria luego de que se abra
          setTimeout(() => URL.revokeObjectURL(url), 5000);

          // Si el navegador bloquea el popup, forzar descarga
          if (!win) {
            const a = document.createElement('a');
            a.href = url;
            a.download = `${orden.numero_orden}.pdf`;
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
  estadoColor(e: string): string {
    const m: Record<string, string> = {
      Pendiente: '#D97706',
      Recibido_Total: '#059669',
      Recibido_Parcial: '#F59E0B',
      Cancelado: '#DC2626',
    };
    return m[e] ?? '#64748B';
  }

  formatEstado(e: string): string {
    return e.replace('_', ' ');
  }
}
