import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import {
  ProveedoresService, Proveedor, ProveedorStats,
} from './services/proveedores.service';
import { ProveedorDetailComponent } from './components/proveedor-detail/proveedor-detail.component';
import { ProveedorFormComponent } from './components/proveedor-form/proveedor-form.component';
import { ConfirmActionComponent } from '../../shared/components/confirm-action/confirm-action.component';

@Component({
  selector:        'app-proveedores',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ProveedorDetailComponent,
    ProveedorFormComponent,
    ConfirmActionComponent,
  ],
  templateUrl: './proveedores.page.html',
  styleUrl:    './proveedores.page.css',
})
export class ProveedoresPage implements OnInit, OnDestroy {
  proveedores: Proveedor[] = [];
  stats: ProveedorStats = { total: 0, activos: 0, inactivos: 0, eliminados: 0 };

  total = 0;
  page  = 1;
  limit = 15;
  pages = 1;
  loading = true;

  filterForm!: FormGroup;
  vistaActiva: 'normal' | 'eliminados' = 'normal';

  readonly estadosDisponibles = [
    { v: '',      n: 'Todos' },
    { v: 'true',  n: 'Activos' },
    { v: 'false', n: 'Inactivos' },
  ];

  // Drawer
  detalleAbierto = false;
  proveedorDetalleId: number | null = null;

  // Modal crear/editar
  proveedorEditando: Proveedor | null = null;
  mostrarModalForm = false;

  // Confirm
  confirmConfig: any = {
    open: false, title: '', message: '', itemName: '',
    type: 'warning', confirmLabel: 'Confirmar',
    askMotivo: false, requireMotivo: false,
    motivoPlaceholder: '', loading: false,
    action: () => {},
  };

  private destroy$ = new Subject<void>();

  constructor(
    private svc: ProveedoresService,
    private fb:  FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      buscar: [''],
      activo: [''],
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

  load(): void {
    this.loading = true;
    const f = this.filterForm.value;

    const query: any = { page: this.page, limit: this.limit };
    if ((f.buscar ?? '').trim()) query.buscar = f.buscar.trim();

    if (this.vistaActiva === 'eliminados') {
      query.eliminados = true;
    } else if (f.activo !== '') {
      query.activo = f.activo;
    }

    this.svc.getAll(query).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.proveedores = res.data;
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
  // VISTA
  // ═══════════════════════════════════════════════
  cambiarVista(v: 'normal' | 'eliminados'): void {
    if (this.vistaActiva === v) return;
    this.vistaActiva = v;
    this.page = 1;
    if (v === 'eliminados') {
      this.filterForm.get('activo')?.setValue('');
    }
    this.load();
  }

  // ═══════════════════════════════════════════════
  // FILTROS
  // ═══════════════════════════════════════════════
  onFilterChange(): void { this.page = 1; this.load(); }

  limpiarFiltros(): void {
    this.filterForm.reset({ buscar: '', activo: '' });
    this.page = 1; this.load();
  }

  get hayFiltrosActivos(): boolean {
    const f = this.filterForm.value;
    return !!(f.buscar || f.activo !== '');
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
  // DRAWER
  // ═══════════════════════════════════════════════
  verDetalle(p: Proveedor): void {
    this.proveedorDetalleId = p.id;
    this.detalleAbierto = true;
    this.cdr.markForCheck();
  }

  cerrarDetalle(): void {
    this.detalleAbierto = false;
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // FORM
  // ═══════════════════════════════════════════════
  abrirNuevo(): void {
    this.proveedorEditando = null;
    this.mostrarModalForm = true;
    this.cdr.markForCheck();
  }

  abrirEditor(p: Proveedor): void {
    this.proveedorEditando = p;
    this.mostrarModalForm = true;
    this.cdr.markForCheck();
  }

  onProveedorGuardado(result: Proveedor): void {
    this.mostrarModalForm = false;
    this.proveedorEditando = null;
    this.load();
    this.loadStats();

    if (this.detalleAbierto && this.proveedorDetalleId === result.id) {
      const id = result.id;
      this.proveedorDetalleId = null;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.proveedorDetalleId = id;
        this.cdr.markForCheck();
      }, 50);
    } else {
      this.cdr.markForCheck();
    }
  }

  onEditCancelled(): void {
    this.mostrarModalForm = false;
    this.proveedorEditando = null;
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // TOGGLE ACTIVE
  // ═══════════════════════════════════════════════
  pedirToggleActive(p: Proveedor): void {
    const willActivate = !p.activo;
    this.confirmConfig = {
      open: true,
      title: willActivate ? 'Activar proveedor' : 'Desactivar proveedor',
      message: willActivate
        ? 'El proveedor podrá usarse en nuevas órdenes de reabastecimiento.'
        : 'El proveedor no aparecerá en nuevas órdenes hasta que lo reactives.',
      itemName: p.razon_social,
      type: 'warning',
      confirmLabel: willActivate ? 'Sí, activar' : 'Sí, desactivar',
      askMotivo: false,
      requireMotivo: false,
      motivoPlaceholder: '',
      loading: false,
      action: () => this.ejecutarToggleActive(p, willActivate),
    };
    this.cdr.markForCheck();
  }

  private ejecutarToggleActive(p: Proveedor, activo: boolean): void {
    this.confirmConfig.loading = true;
    this.cdr.markForCheck();

    this.svc.toggleActive(p.id, activo).pipe(takeUntil(this.destroy$)).subscribe({
      next: u => {
        this.confirmConfig.open = false;
        this.confirmConfig.loading = false;
        this.load();
        this.loadStats();
        if (this.proveedorDetalleId === u.id) {
          const id = u.id;
          this.proveedorDetalleId = null;
          this.cdr.markForCheck();
          setTimeout(() => {
            this.proveedorDetalleId = id;
            this.cdr.markForCheck();
          }, 50);
        }
        this.cdr.markForCheck();
      },
      error: e => {
        this.confirmConfig.loading = false;
        this.cdr.markForCheck();
        alert(e?.error?.message ?? 'Error al cambiar estado');
      },
    });
  }

  // ═══════════════════════════════════════════════
  // ELIMINAR
  // ═══════════════════════════════════════════════
  pedirEliminar(p: Proveedor): void {
    this.confirmConfig = {
      open: true,
      title: 'Eliminar proveedor',
      message:
        'El proveedor será eliminado del sistema. ' +
        'Las órdenes y lotes históricos se mantienen. Esta acción quedará registrada.',
      itemName: p.razon_social,
      type: 'danger',
      confirmLabel: 'Sí, eliminar',
      askMotivo: true,
      requireMotivo: true,
      motivoPlaceholder: 'Motivo (obligatorio)',
      loading: false,
      action: (motivo: string) => this.ejecutarEliminar(p, motivo),
    };
    this.cdr.markForCheck();
  }

  private ejecutarEliminar(p: Proveedor, motivo: string): void {
    this.confirmConfig.loading = true;
    this.cdr.markForCheck();

    this.svc.delete(p.id, motivo).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.confirmConfig.open = false;
        this.confirmConfig.loading = false;
        this.cerrarDetalle();
        this.load();
        this.loadStats();
      },
      error: e => {
        this.confirmConfig.loading = false;
        this.cdr.markForCheck();
        alert(e?.error?.message ?? 'Error al eliminar');
      },
    });
  }

  // ═══════════════════════════════════════════════
  // RESTAURAR
  // ═══════════════════════════════════════════════
  pedirRestaurar(p: Proveedor): void {
    this.confirmConfig = {
      open: true,
      title: 'Restaurar proveedor',
      message: 'El proveedor será restaurado en estado Inactivo. Podrás activarlo después.',
      itemName: p.razon_social,
      type: 'warning',
      confirmLabel: 'Sí, restaurar',
      askMotivo: false,
      requireMotivo: false,
      motivoPlaceholder: '',
      loading: false,
      action: () => this.ejecutarRestaurar(p),
    };
    this.cdr.markForCheck();
  }

  private ejecutarRestaurar(p: Proveedor): void {
    this.confirmConfig.loading = true;
    this.cdr.markForCheck();

    this.svc.restore(p.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.confirmConfig.open = false;
        this.confirmConfig.loading = false;
        this.cerrarDetalle();
        this.load();
        this.loadStats();
      },
      error: e => {
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

  // ═══════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════
  iniciales(p: Proveedor): string {
    const palabras = p.razon_social.split(/\s+/).filter(Boolean);
    if (palabras.length === 1) return palabras[0].substring(0, 2).toUpperCase();
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
  }

  colorPorId(id: number): string {
    // Color determinístico basado en el id
    const colores = ['#7C3AED', '#E11D48', '#0891B2', '#D97706', '#059669', '#6366F1', '#EC4899'];
    return colores[id % colores.length];
  }
}