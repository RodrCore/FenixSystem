import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { VentasService } from '../../core/services/ventas.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductoResumen } from '../../core/models/venta.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { TabbarComponent } from '../../shared/components/tabbar/tabbar';

@Component({
  selector: 'app-productos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    NavbarComponent,
    TabbarComponent,
  ],
  templateUrl: './productos.page.html',
  styleUrl: './productos.page.scss',
})
export class ProductosPage implements OnInit, OnDestroy {
  productos: ProductoResumen[] = [];
  categorias: { id: number; nombre: string }[] = [];
  categoriaActiva = 0;
  buscarCtrl = new FormControl('');
  loading = true;
  page = 1;
  totalPages = 1;

  // Modal detalle
  productoSeleccionado: ProductoResumen | null = null;
  showDetalle = false;

  private destroy$ = new Subject<void>();

  constructor(
    private ventas: VentasService,
    private auth: AuthService,
    private router: Router,
    private alert: AlertController,
    private toast: ToastController,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
    this.load();
    this.buscarCtrl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.load();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Roles ─────────────────────────────────────────────────
  get puedeEditar(): boolean {
    return this.auth.hasRole('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN');
  }

  get puedeEliminar(): boolean {
    return this.auth.hasRole('SUPER_ADMIN', 'ADMIN');
  }

  // ── Carga ─────────────────────────────────────────────────
  cargarCategorias(): void {
    this.ventas
      .getCategorias()
      .pipe(takeUntil(this.destroy$))
      .subscribe((cats) => {
        this.categorias = cats;
        this.cdr.markForCheck();
      });
  }

  filtrarCategoria(id: number): void {
    this.categoriaActiva = id;
    this.page = 1;
    this.load();
  }

  load(event?: any): void {
    if (!event) this.loading = true;
    this.ventas
      .getProductos({
        buscar: this.buscarCtrl.value ?? '',
        categoria_id: this.categoriaActiva || undefined,
        page: this.page,
        limit: 20,
        // ✅ El vendedor (preventista) solo ve activos
        // Admin y superiores ven todos
        soloActivos: !this.puedeEliminar,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.productos =
            this.page === 1 ? res.data : [...this.productos, ...res.data];
          this.totalPages = res.pages;
          this.loading = false;
          event?.target?.complete();
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          event?.target?.complete();
          this.cdr.markForCheck();
        },
      });
  }

  cargarMas(event: any): void {
    if (this.page >= this.totalPages) {
      event.target.complete();
      return;
    }
    this.page++;
    this.load(event);
  }

  // ── Detalle ───────────────────────────────────────────────
  abrirDetalle(p: ProductoResumen): void {
    this.productoSeleccionado = p;
    this.showDetalle = true;
    this.cdr.markForCheck();
  }

  cerrarDetalle(): void {
    this.showDetalle = false;
    this.productoSeleccionado = null;
    this.cdr.markForCheck();
  }

  // ── Editar ────────────────────────────────────────────────
  editar(p: ProductoResumen, ev: Event): void {
    ev.stopPropagation();
    this.router.navigate(['/productos/editar', p.id]);
  }

  // ── Eliminar (toggle activo) ──────────────────────────────
  async eliminar(p: ProductoResumen, ev: Event): Promise<void> {
    ev.stopPropagation();
    const accion = p.activo ? 'desactivar' : 'activar';
    const a = await this.alert.create({
      header: `${p.activo ? 'Desactivar' : 'Activar'} producto`,
      message: `¿${p.activo ? 'Desactivar' : 'Activar'} "${p.nombre}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: p.activo ? 'Desactivar' : 'Activar',
          role: p.activo ? 'destructive' : 'confirm',
          handler: async () => {
            // llamar al endpoint toggle del backend web
            const t = await this.toast.create({
              message: `Producto ${accion}do`,
              duration: 1500,
              position: 'bottom',
              color: p.activo ? 'danger' : 'success',
            });
            await t.present();
            this.load();
          },
        },
      ],
      cssClass: 'fenix-alert',
    });
    await a.present();
  }

  // ── Helpers ───────────────────────────────────────────────
  stockColor(p: ProductoResumen): string {
    const s = p.stock_total ?? 0;
    if (s === 0) return '#DC2626';
    if (s < 50) return '#D97706';
    return '#059669';
  }

  stockLabel(p: ProductoResumen): string {
    const s = p.stock_total ?? 0;
    if (s === 0) return 'SIN STOCK';
    if (s < 50) return 'BAJO STOCK';
    return 'EN STOCK';
  }

  get today(): Date {
    return new Date();
  }
}
