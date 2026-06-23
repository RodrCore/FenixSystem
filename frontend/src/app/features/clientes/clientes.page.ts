import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import {
  ClientesService, Cliente, ClienteStats,
} from './services/clientes.service';
import { ClienteDetailComponent } from './components/cliente-detail/cliente-detail.component';
import { ClienteFormComponent } from './components/cliente-form/cliente-form.component';
import { ConfirmActionComponent } from '../../shared/components/confirm-action/confirm-action.component';

@Component({
  selector:        'app-clientes',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ClienteDetailComponent,
    ClienteFormComponent,
    ConfirmActionComponent,
  ],
  templateUrl: './clientes.page.html',
  styleUrl:    './clientes.page.css',
})
export class ClientesPage implements OnInit, OnDestroy {
  clientes: Cliente[] = [];
  stats: ClienteStats = {
    total: 0, activos: 0, inactivos: 0, con_deuda: 0, deuda_total: 0,
  };

  total = 0;
  page  = 1;
  limit = 15;
  pages = 1;
  loading = true;

  filterForm!: FormGroup;

  readonly estadosDisponibles = [
    { v: '',          n: 'Todos los estados' },
    { v: 'Activo',    n: 'Activos' },
    { v: 'Inactivo',  n: 'Inactivos' },
  ];

  readonly tiposCliente = [
    { v: '',            n: 'Todos los tipos' },
    { v: 'Minorista',   n: 'Minorista' },
    { v: 'Mayorista',   n: 'Mayorista' },
    { v: 'Distribuidor',n: 'Distribuidor' },
    { v: 'Kiosco',      n: 'Kiosco' },
    { v: 'Supermercado',n: 'Supermercado' },
  ];

  // ─── Estado del drawer / modal / confirm ───
  detalleAbierto = false;
  clienteDetalleId: number | null = null;

  clienteEditando: Cliente | null = null;
  mostrarModalNuevo = false;

  confirmConfig: {
    open:     boolean;
    title:    string;
    message:  string;
    itemName: string;
    type:     'warning' | 'danger';
    confirmLabel: string;
    askMotivo: boolean;
    requireMotivo: boolean;
    motivoPlaceholder: string;
    loading:  boolean;
    action:   (motivo: string) => void;
  } = {
    open: false, title: '', message: '', itemName: '',
    type: 'warning', confirmLabel: 'Confirmar',
    askMotivo: false, requireMotivo: false,
    motivoPlaceholder: '', loading: false,
    action: () => {},
  };

  private destroy$ = new Subject<void>();

  constructor(
    private svc: ClientesService,
    private fb:  FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      buscar:       [''],
      estado:       [''],
      tipo_cliente: [''],
      con_deuda:    [false],
    });

    this.filterForm.get('buscar')!.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.page = 1; this.load(); });

    this.loadStats();
    this.load();
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
    };

    const buscar = (f.buscar ?? '').trim();
    if (buscar) query.buscar = buscar;
    if (f.estado) query.estado = f.estado;
    if (f.tipo_cliente) query.tipo_cliente = f.tipo_cliente;
    if (f.con_deuda) query.con_deuda = true;

    this.svc.getAll(query).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.clientes = res.data;
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
    this.svc.getStats().pipe(takeUntil(this.destroy$)).subscribe({
      next: s => {
        this.stats = s;
        this.cdr.markForCheck();
      },
    });
  }

  // ═══════════════════════════════════════════════
  // FILTROS / PAGINACIÓN
  // ═══════════════════════════════════════════════
  onFilterChange(): void { this.page = 1; this.load(); }

  limpiarFiltros(): void {
    this.filterForm.reset({
      buscar: '', estado: '', tipo_cliente: '', con_deuda: false,
    });
    this.page = 1; this.load();
  }

  get hayFiltrosActivos(): boolean {
    const f = this.filterForm.value;
    return !!(f.buscar || f.estado || f.tipo_cliente || f.con_deuda);
  }

  goPage(p: number): void {
    if (p < 1 || p > this.pages) return;
    this.page = p; this.load();
  }

  get pageNumbers(): number[] {
    const t = this.pages, c = this.page;
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
    if (c <= 4) return [1, 2, 3, 4, 5, -1, t];
    if (c >= t - 3) return [1, -1, t - 4, t - 3, t - 2, t - 1, t];
    return [1, -1, c - 1, c, c + 1, -1, t];
  }

  get desde(): number { return (this.page - 1) * this.limit + 1; }
  get hasta(): number { return Math.min(this.page * this.limit, this.total); }

  // ═══════════════════════════════════════════════
  // DRAWER DETALLE
  // ═══════════════════════════════════════════════
  verDetalle(c: Cliente): void {
    this.clienteDetalleId = c.id;
    this.detalleAbierto = true;
    this.cdr.markForCheck();
  }

  cerrarDetalle(): void {
    this.detalleAbierto = false;
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // NUEVO CLIENTE
  // ═══════════════════════════════════════════════
  abrirNuevoCliente(): void {
    this.clienteEditando = null;
    this.mostrarModalNuevo = true;
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // EDITAR
  // ═══════════════════════════════════════════════
  abrirEditor(cliente: Cliente): void {
    this.clienteEditando = cliente;
    this.mostrarModalNuevo = true;
    this.cdr.markForCheck();
  }

  onClienteGuardado(c: Cliente): void {
    this.mostrarModalNuevo = false;
    this.clienteEditando = null;
    this.load();
    this.loadStats();

    // Si el drawer estaba abierto y editamos, recargarlo
    if (this.detalleAbierto && this.clienteDetalleId === c.id) {
      const id = c.id;
      this.clienteDetalleId = null;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.clienteDetalleId = id;
        this.cdr.markForCheck();
      }, 50);
    } else {
      this.cdr.markForCheck();
    }
  }

  onEditCancelled(): void {
    this.mostrarModalNuevo = false;
    this.clienteEditando = null;
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // ELIMINAR (SOFT DELETE)
  // ═══════════════════════════════════════════════
  pedirEliminarCliente(cliente: Cliente): void {
    this.confirmConfig = {
      open: true,
      title: 'Dar de baja al cliente',
      message:
        'El cliente quedará marcado como Inactivo y eliminado del sistema. ' +
        'Si tiene pedidos activos, no se podrá eliminar. Esta acción quedará registrada en auditoría.',
      itemName: cliente.razon_social,
      type: 'danger',
      confirmLabel: 'Sí, dar de baja',
      askMotivo: true,
      requireMotivo: true,
      motivoPlaceholder: 'Motivo (obligatorio)',
      loading: false,
      action: (motivo: string) => this.ejecutarEliminacion(cliente, motivo),
    };
    this.cdr.markForCheck();
  }

  private ejecutarEliminacion(cliente: Cliente, motivo: string): void {
    this.confirmConfig.loading = true;
    this.cdr.markForCheck();

    this.svc.delete(cliente.id, motivo).pipe(takeUntil(this.destroy$)).subscribe({
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
        alert(e?.error?.message ?? 'Error al dar de baja');
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
    return estado === 'Activo' ? '#059669' : '#DC2626';
  }

  iniciales(c: Cliente): string {
    const nom = c.nombre_comercial ?? c.razon_social ?? '';
    const partes = nom.trim().split(/\s+/);
    return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || '?';
  }

  direccionResumen(c: Cliente): string {
    const partes = [
      c.direccion_calle,
      c.direccion_numero,
      c.direccion_ciudad,
    ].filter(Boolean);
    return partes.join(' ') || '—';
  }
}