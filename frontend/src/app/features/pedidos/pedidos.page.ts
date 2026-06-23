import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { MapaRepartidoresComponent } from '../../shared/components/mapa-repartidores/mapa-repartidores.component';
import { PedidosService, Pedido, PedidoStats } from './services/pedidos.service';
import { PedidoDetailComponent } from './components/pedido-detail/pedido-detail.component';
import { PedidoEditComponent } from './components/pedido-edit/pedido-edit.component';
import { ConfirmActionComponent } from '../../shared/components/confirm-action/confirm-action.component';
import { PedidoNuevoComponent } from './components/pedido-nuevo/pedido-nuevo.component';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MapaRepartidoresComponent,
    PedidoDetailComponent,
    PedidoEditComponent,
    ConfirmActionComponent,
    PedidoNuevoComponent,
  ],
  templateUrl: './pedidos.page.html',
  styleUrl: './pedidos.page.css',
})
export class PedidosPage implements OnInit, OnDestroy {
  @ViewChild(MapaRepartidoresComponent) mapaRef?: MapaRepartidoresComponent;

  pedidos: Pedido[] = [];
  pedidosParaMapa: Pedido[] = [];

  stats: PedidoStats = {
    total: 0,
    pendientes: 0,
    en_ruta: 0,
    entregados_hoy: 0,
    cancelados: 0,
    facturado_hoy: 0,
  };

  total = 0;
  page = 1;
  limit = 5;
  pages = 1;

  loading = true;
  mapaFullscreen = false;
  mostrarModalNuevo = false;

  filterForm!: FormGroup;

  // ✅ Estados simplificados
  readonly estadosDisponibles = [
    { v: '', n: 'Todos los estados' },
    { v: 'Borrador', n: 'Borrador' },
    { v: 'Confirmado', n: 'Confirmado' },
    { v: 'Entregado', n: 'Entregado' },
    { v: 'Cancelado', n: 'Cancelado' },
    { v: 'Devuelto', n: 'Devuelto' },
  ];

  // ─── Estado del drawer / modal de edit / confirm ───
  detalleAbierto: boolean = false;
  pedidoDetalleId: number | null = null;

  pedidoEditando: Pedido | null = null;

  confirmConfig: {
    open: boolean;
    title: string;
    message: string;
    itemName: string;
    type: 'warning' | 'danger';
    confirmLabel: string;
    askMotivo: boolean;
    requireMotivo: boolean;
    motivoPlaceholder: string;
    loading: boolean;
    action: (motivo: string) => void;
  } = {
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
    private svc: PedidosService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      buscar: [''],
      estado: [''],
      desde: [''],
      hasta: [''],
      orderBy: ['fecha_creacion'],
      order: ['desc'],
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
    this.cargarPedidosParaMapa();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ═══════════════════════════════════════════════
  load(): void {
    this.loading = true;
    const f = this.filterForm.value;

    const query: any = {
      page: this.page,
      limit: this.limit,
      orderBy: f.orderBy,
      order: f.order,
    };

    const buscar = (f.buscar ?? '').trim();
    if (buscar) query.buscar = buscar;
    if (f.estado) query.estado = f.estado;
    if (f.desde) query.desde = f.desde;
    if (f.hasta) query.hasta = f.hasta;

    this.svc
      .getAll(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.pedidos = res.data;
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
      .subscribe((s) => {
        this.stats = s;
        this.cdr.markForCheck();
      });
  }

  private cargarPedidosParaMapa(): void {
    const hoy0 = new Date();
    hoy0.setHours(0, 0, 0, 0);
    this.svc
      .getAll({
        page: 1,
        limit: 200,
        orderBy: 'fecha_creacion',
        order: 'desc',
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const todos = res.data;
        this.pedidosParaMapa = todos.filter((p) => {
          const esPendiente = ['Confirmado', 'Preparando', 'Listo_Carga', 'En_Ruta'].includes(
            p.estado,
          );
          const esEntregadoHoy =
            ['Entregado_Total', 'Entregado_Parcial'].includes(p.estado) &&
            p.fecha_entrega_real &&
            new Date(p.fecha_entrega_real) >= hoy0;
          return esPendiente || esEntregadoHoy;
        });
        this.cdr.markForCheck();
      });
  }

  // ═══════════════════════════════════════════════
  // FILTROS / PAGINACIÓN
  // ═══════════════════════════════════════════════
  onFilterChange(): void {
    this.page = 1;
    this.load();
  }

  limpiarFiltros(): void {
    this.filterForm.reset({
      buscar: '',
      estado: '',
      desde: '',
      hasta: '',
      orderBy: 'fecha_creacion',
      order: 'desc',
    });
    this.page = 1;
    this.load();
  }

  get hayFiltrosActivos(): boolean {
    const f = this.filterForm.value;
    return !!(f.buscar || f.estado || f.desde || f.hasta);
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
  // MAPA
  // ═══════════════════════════════════════════════
  abrirMapaFullscreen(): void {
    this.mapaFullscreen = true;
    this.cdr.markForCheck();
    setTimeout(() => this.mapaRef?.invalidateMapSize(), 50);
    setTimeout(() => this.mapaRef?.invalidateMapSize(), 250);
    setTimeout(() => this.mapaRef?.invalidateMapSize(), 600);
  }

  cerrarMapaFullscreen(): void {
    this.mapaFullscreen = false;
    this.cdr.markForCheck();
    setTimeout(() => this.mapaRef?.invalidateMapSize(), 100);
    setTimeout(() => this.mapaRef?.invalidateMapSize(), 350);
  }

  // ═══════════════════════════════════════════════
  // DRAWER DE DETALLE
  // ═══════════════════════════════════════════════
  verDetalle(p: Pedido): void {
    this.pedidoDetalleId = p.id;
    this.detalleAbierto = true;
    this.cdr.markForCheck();
  }

  cerrarDetalle(): void {
    this.detalleAbierto = false;
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // EDITAR
  // ═══════════════════════════════════════════════
  abrirEditor(pedido: Pedido): void {
    this.pedidoEditando = pedido;
    this.cdr.markForCheck();
  }

  onPedidoActualizado(actualizado: Pedido): void {
    this.pedidoEditando = null;
    this.load();
    this.loadStats();

    if (this.detalleAbierto) {
      const id = actualizado.id;
      this.pedidoDetalleId = null;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.pedidoDetalleId = id;
        this.cdr.markForCheck();
      }, 50);
    }
  }

  onEditCancelled(): void {
    this.pedidoEditando = null;
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // CANCELAR
  // ═══════════════════════════════════════════════
  pedirCancelarPedido(pedido: Pedido): void {
    this.confirmConfig = {
      open: true,
      title: 'Cancelar pedido',
      message:
        'Este pedido pasará al estado "Cancelado" y se devolverá el inventario reservado. Esta acción quedará registrada en la auditoría.',
      itemName: `${pedido.numero_pedido} · ${pedido.cliente?.razon_social ?? ''}`,
      type: 'warning',
      confirmLabel: 'Sí, cancelar',
      askMotivo: true,
      requireMotivo: true,
      motivoPlaceholder: 'Motivo de la cancelación (obligatorio)',
      loading: false,
      action: (motivo: string) => this.ejecutarCancelacion(pedido, motivo),
    };
    this.cdr.markForCheck();
  }

  private ejecutarCancelacion(pedido: Pedido, motivo: string): void {
    this.confirmConfig.loading = true;
    this.cdr.markForCheck();

    this.svc
      .cancelar(pedido.id, motivo)
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
          alert(e?.error?.message ?? 'Error cancelando el pedido');
        },
      });
  }

  // ═══════════════════════════════════════════════
  // ELIMINAR (SOFT DELETE)
  // ═══════════════════════════════════════════════
  pedirEliminarPedido(pedido: Pedido): void {
    this.confirmConfig = {
      open: true,
      title: 'Eliminar pedido',
      message:
        'El pedido se marcará como eliminado pero se conservará en el sistema para auditoría. Solo SUPER_ADMIN podrá restaurarlo después.',
      itemName: `${pedido.numero_pedido} · ${pedido.cliente?.razon_social ?? ''}`,
      type: 'danger',
      confirmLabel: 'Sí, eliminar',
      askMotivo: true,
      requireMotivo: true,
      motivoPlaceholder: 'Motivo de la eliminación (obligatorio)',
      loading: false,
      action: (motivo: string) => this.ejecutarEliminacion(pedido, motivo),
    };
    this.cdr.markForCheck();
  }

  private ejecutarEliminacion(pedido: Pedido, motivo: string): void {
    this.confirmConfig.loading = true;
    this.cdr.markForCheck();

    this.svc
      .delete(pedido.id, motivo)
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
          alert(e?.error?.message ?? 'Error eliminando el pedido');
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
  // HELPERS
  // ═══════════════════════════════════════════════
  estadoColor(estado: string): string {
    const m: Record<string, string> = {
      Borrador: '#64748B',
      Confirmado: '#2563EB',
      Preparando: '#D97706',
      Listo_Carga: '#7C3AED',
      En_Ruta: '#0891B2',
      Entregado_Total: '#059669',
      Entregado_Parcial: '#F59E0B',
      Cancelado: '#DC2626',
      Devuelto: '#EF4444',
    };
    return m[estado] ?? '#64748B';
  }

  esPendiente(p: Pedido): boolean {
    return ['Confirmado', 'Preparando', 'Listo_Carga'].includes(p.estado);
  }

  abrirNuevoPedido(): void {
    this.mostrarModalNuevo = true;
    this.cdr.markForCheck();
  }

  cerrarNuevoPedido(): void {
    this.mostrarModalNuevo = false;
    this.cdr.markForCheck();
  }

  onPedidoCreado(nuevo: Pedido): void {
    this.mostrarModalNuevo = false;
    this.load(); // recargar lista
    this.loadStats(); // recargar stats
    this.cargarPedidosParaMapa(); // recargar mapa

    // Abrir el detalle del nuevo pedido automáticamente
    this.pedidoDetalleId = nuevo.id;
    this.detalleAbierto = true;

    this.cdr.markForCheck();
  }
}
