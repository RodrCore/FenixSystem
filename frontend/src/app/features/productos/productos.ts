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
  ProductosService,
  Producto,
  ProductoStats,
  Categoria,
  ProductoQuery,
} from './services/productos.service';
import { ProductoFormComponent } from './components/producto-form/producto-form';
import { ProductoDetailComponent } from './components/producto-detail/producto-detail';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';

@Component({
  selector: 'app-productos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // ✅ RouterLink eliminado — no se usa en el template
    ProductoFormComponent,
    ProductoDetailComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class ProductosComponent implements OnInit, OnDestroy {
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  stats: ProductoStats = { total: 0, activos: 0, inactivos: 0, sinStock: 0, porVencer: 0 };

  total = 0;
  page = 1;
  limit = 10;
  pages = 1;
  loading = false;
  allChecked = false;
  checked = new Set<number>();

  showForm = false;
  showDetail = false;
  editando: Producto | null = null;
  detalle: Producto | null = null;

  showConfirm = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmLabel = '';
  confirmItemName = '';
  confirmType: 'danger' | 'success' = 'danger';
  private pendingToggle: Producto | null = null;

  filterForm!: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private svc: ProductosService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      buscar: [''],
      categoria_id: [''],
      activo: [''],
      orderBy: ['nombre'],
      order: ['asc'],
    });

    this.filterForm
      .get('buscar')!
      .valueChanges.pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.load();
      });

    this.loadCategorias();
    this.loadStats();
    this.load();
  }

  onSelectChange(): void {
    this.page = 1;
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading = true;
    const f = this.filterForm.value;

    // ✅ Construir query limpio — SOLO incluir campos con valor real
    const query: ProductoQuery = {
      page: this.page,
      limit: this.limit,
      orderBy: f.orderBy || 'nombre',
      order: f.order || 'asc',
    };

    // buscar — solo si tiene texto real
    const buscar = (f.buscar ?? '').trim();
    if (buscar) query.buscar = buscar;

    // categoria_id — solo si es número válido mayor a 0
    const catId = Number(f.categoria_id);
    if (!isNaN(catId) && catId > 0) query.categoria_id = catId;

    // activo — solo si eligió 'true' o 'false' explícitamente
    // '' = todos (no filtrar), 'true' = activos, 'false' = inactivos
    if (f.activo === 'true') query.activo = true;
    if (f.activo === 'false') query.activo = false;
    // si f.activo === '' → no agregar nada al query → backend devuelve todos

    this.svc
      .getAll(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.productos = res.data;
          this.total = res.total;
          this.pages = res.pages;
          this.loading = false;
          this.checked.clear();
          this.allChecked = false;
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

  loadCategorias(): void {
    this.svc
      .getCategorias()
      .pipe(takeUntil(this.destroy$))
      .subscribe((c) => {
        this.categorias = c;
        this.cdr.markForCheck();
      });
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

  toggleAll(): void {
    this.allChecked = !this.allChecked;
    if (this.allChecked) this.productos.forEach((p) => this.checked.add(p.id));
    else this.checked.clear();
  }

  toggleCheck(id: number): void {
    if (this.checked.has(id)) this.checked.delete(id);
    else this.checked.add(id);
    this.allChecked = this.checked.size === this.productos.length;
  }

  openAdd(): void {
    this.editando = null;
    this.showForm = true;
  }
  openEdit(p: Producto): void {
    this.editando = p;
    this.showForm = true;
    this.showDetail = false;
  }

  openDetail(p: Producto): void {
    this.svc
      .getOne(p.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((full) => {
        this.detalle = full;
        this.showDetail = true;
        this.cdr.markForCheck();
      });
  }

  closeForm(): void {
    this.showForm = false;
    this.editando = null;
  }
  closeDetail(): void {
    this.showDetail = false;
    this.detalle = null;
  }

  onSaved(): void {
    this.closeForm();
    this.load();
    this.loadStats();
  }

  onLoteAdded(): void {
    if (this.detalle) {
      this.svc
        .getOne(this.detalle.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((full) => {
          this.detalle = full;
          this.cdr.markForCheck();
        });
    }
    this.load();
    this.loadStats();
  }

  // ✅ Confirmación antes de desactivar
  toggleActive(p: Producto): void {
    this.pendingToggle = p;
    this.confirmItemName = p.nombre;

    if (p.activo) {
      // Desactivar
      this.confirmTitle = 'Desactivar producto';
      this.confirmMessage =
        'Este producto dejará de estar disponible para pedidos y ventas. Puedes reactivarlo en cualquier momento.';
      this.confirmLabel = 'Sí, desactivar';
      this.confirmType = 'danger';
    } else {
      // Reactivar
      this.confirmTitle = 'Reactivar producto';
      this.confirmMessage =
        'El producto volverá a estar disponible para pedidos y ventas inmediatamente.';
      this.confirmLabel = 'Sí, reactivar';
      this.confirmType = 'success';
    }

    this.showConfirm = true;
    this.cdr.markForCheck();
  }

  onConfirmToggle(): void {
    if (!this.pendingToggle) return;
    const p = this.pendingToggle;
    this.showConfirm = false;
    this.pendingToggle = null;

    this.svc
      .toggleActive(p.id, !p.activo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.load();
          this.loadStats();
        },
        error: (e) => console.error('Error al cambiar estado:', e),
      });
  }

  onCancelConfirm(): void {
    this.showConfirm = false;
    this.pendingToggle = null;
  }

  get desde(): number {
    return (this.page - 1) * this.limit + 1;
  }
  get hasta(): number {
    return Math.min(this.page * this.limit, this.total);
  }

  stockColor(p: Producto): string {
    const s = p.stock_total ?? 0;
    if (s === 0) return '#DC2626';
    if (s < p.stock_minimo) return '#D97706';
    return '#059669';
  }

  stockPct(p: Producto): number {
    const s = p.stock_total ?? 0;
    return Math.min(100, Math.round((s / (p.stock_maximo || 500)) * 100));
  }

  avatarColor(nombre: string): string {
    const palette = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#BE185D'];
    let hash = 0;
    for (const c of nombre) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
    return palette[Math.abs(hash) % palette.length];
  }

  initials(nombre: string): string {
    return nombre
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase();
  }
}
