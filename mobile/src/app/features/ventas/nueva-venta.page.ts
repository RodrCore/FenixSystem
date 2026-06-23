import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  ToastController,
  LoadingController,
} from '@ionic/angular/standalone';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { VentasService } from '../../core/services/ventas.service';
import { CartService } from '../../core/services/cart.service';
import {
  ClienteResumen,
  ProductoResumen,
  PresentacionResumen,
  CartItem,
  Usuario,
} from '../../core/models/venta.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { Vehiculo } from '../../core/models/venta.model';

// Pasos del flujo
type Paso = 'cliente' | 'productos' | 'carrito';

@Component({
  selector: 'app-nueva-venta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    NavbarComponent,
  ],
  templateUrl: './nueva-venta.page.html',
  styleUrl: './nueva-venta.page.scss',
})
export class NuevaVentaPage implements OnInit, OnDestroy {
  // ── Estado del flujo ──────────────────────────────────────
  paso: Paso = 'cliente';

  // ── Paso 1: Cliente ───────────────────────────────────────
  clientes: ClienteResumen[] = [];
  clienteSeleccionado: ClienteResumen | null = null;
  buscarCliente = new FormControl('');
  loadingClientes = true;

  // ── Paso 2: Productos ─────────────────────────────────────
  productos: ProductoResumen[] = [];
  categorias: { id: number; nombre: string }[] = [];
  categoriaActiva = 0;
  buscarProducto = new FormControl('');
  loadingProductos = true;
  pageProds = 1;
  totalPagesProds = 1;

  // ── Paso 3: Carrito ───────────────────────────────────────
  notas = '';
  descuento = 0;
  guardando = false;

  vehiculos: Vehiculo[] = [];
  vehiculoSeleccionado: Vehiculo | null = null;
  loadingVehiculos = false;

  metodoPago: 'Efectivo' | 'Transferencia' | 'Cuenta_Corriente' | 'Tarjeta' =
    'Efectivo';

  repartidores: Usuario[] = [];
  repartidorSeleccionado: Usuario | null = null;
  loadingRepartidores = false;

  private destroy$ = new Subject<void>();

  constructor(
    private ventas: VentasService,
    public cart: CartService,
    private router: Router,
    private toast: ToastController,
    private loading: LoadingController,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cart.limpiar();
    this.cargarClientes();
    this.cargarCategorias();
    this.cargarVehiculos();
    this.cargarRepartidores();

    this.buscarCliente.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.cargarClientes());

    this.buscarProducto.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageProds = 1;
        this.cargarProductos();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Paso 1: Clientes ──────────────────────────────────────
  cargarClientes(): void {
    this.loadingClientes = true;
    this.ventas
      .getClientes({ buscar: this.buscarCliente.value ?? '' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.clientes = res.data;
          this.loadingClientes = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingClientes = false;
          this.cdr.markForCheck();
        },
      });
  }

  elegirCliente(c: ClienteResumen): void {
    this.clienteSeleccionado = c;
    this.cart.setCliente(c.id);

    // ✅ Si el cliente tiene crédito habilitado, sugerir Cuenta_Corriente
    if (c.credito_habilitado) {
      this.metodoPago = 'Cuenta_Corriente';
    }

    this.paso = 'productos';
    this.cargarProductos();
    this.cdr.markForCheck();
  }
  cargarRepartidores(): void {
    this.loadingRepartidores = true;
    this.ventas
      .getRepartidores()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rs) => {
          this.repartidores = rs;
          this.loadingRepartidores = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingRepartidores = false;
          this.cdr.markForCheck();
        },
      });
  }
  elegirRepartidor(r: Usuario | null): void {
    this.repartidorSeleccionado = r;
    this.cdr.markForCheck();
  }

  nombreRepartidor(r: Usuario): string {
    return [r.nombres, r.apellido_paterno].filter(Boolean).join(' ');
  }

  initialsRepartidor(r: Usuario): string {
    const partes = [r.nombres?.[0], r.apellido_paterno?.[0]]
      .filter(Boolean)
      .join('');
    return partes.toUpperCase();
  }
  // ── Paso 2: Productos ─────────────────────────────────────
  cargarCategorias(): void {
    this.ventas
      .getCategorias()
      .pipe(takeUntil(this.destroy$))
      .subscribe((cats) => {
        this.categorias = cats;
        this.cdr.markForCheck();
      });
  }
  cargarVehiculos(): void {
    this.loadingVehiculos = true;
    this.ventas
      .getVehiculos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vs) => {
          this.vehiculos = vs;
          this.loadingVehiculos = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingVehiculos = false;
          this.cdr.markForCheck();
        },
      });
  }

  elegirVehiculo(v: Vehiculo | null): void {
    this.vehiculoSeleccionado = v;
    this.cdr.markForCheck();
  }

  filtrarCategoria(id: number): void {
    this.categoriaActiva = id;
    this.pageProds = 1;
    this.cargarProductos();
  }

  cargarProductos(event?: any): void {
    if (!event) this.loadingProductos = true;
    this.ventas
      .getProductos({
        buscar: this.buscarProducto.value ?? '',
        categoria_id: this.categoriaActiva || undefined,
        page: this.pageProds,
        limit: 20,
        soloActivos: true, // ✅ En ventas siempre solo activos con stock
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.productos =
            this.pageProds === 1 ? res.data : [...this.productos, ...res.data];
          this.totalPagesProds = res.pages;
          this.loadingProductos = false;
          event?.target?.complete();
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingProductos = false;
          event?.target?.complete();
          this.cdr.markForCheck();
        },
      });
  }

  cargarMasProductos(event: any): void {
    if (this.pageProds >= this.totalPagesProds) {
      event.target.complete();
      return;
    }
    this.pageProds++;
    this.cargarProductos(event);
  }

  async agregarProducto(p: ProductoResumen): Promise<void> {
    if (!p.presentaciones?.length) return;
    const pres = p.presentaciones[0];
    this.cart.agregar(p, pres, 1);
    const t = await this.toast.create({
      message: `${p.nombre} agregado`,
      duration: 1000,
      position: 'bottom',
      color: 'dark',
      cssClass: 'fenix-toast',
    });
    await t.present();
    this.cdr.markForCheck();
  }

  irACarrito(): void {
    if (!this.cart.count) return;
    this.paso = 'carrito';
    this.cdr.markForCheck();
  }

  // ── Paso 3: Carrito ───────────────────────────────────────
  get items(): CartItem[] {
    return this.cart.getItems();
  }
  get subtotal(): number {
    return this.cart.subtotal;
  }
  get total(): number {
    return Math.max(0, this.subtotal - this.descuento);
  }

  incrementar(item: CartItem): void {
    this.cart.setCantidad(
      item.producto.id,
      item.presentacion.id,
      item.cantidad + 1,
    );
  }

  decrementar(item: CartItem): void {
    if (item.cantidad <= 1) {
      this.cart.quitar(item.producto.id, item.presentacion.id);
      return;
    }
    this.cart.setCantidad(
      item.producto.id,
      item.presentacion.id,
      item.cantidad - 1,
    );
  }

  quitar(item: CartItem): void {
    this.cart.quitar(item.producto.id, item.presentacion.id);
    this.cdr.markForCheck();
  }

  async confirmarVenta(): Promise<void> {
    if (!this.items.length || !this.clienteSeleccionado) return;
    const loader = await this.loading.create({ message: 'Guardando venta...' });
    await loader.present();

    this.ventas
      .crearPedido({
        cliente_id: this.clienteSeleccionado.id,
        vehiculo_id: this.vehiculoSeleccionado?.id,
        repartidor_id: this.repartidorSeleccionado?.id, // ✅ AGREGAR
        metodo_pago: this.metodoPago,
        detalles: this.items.map((i) => ({
          producto_id: i.producto.id,
          presentacion_id: i.presentacion.id,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unit,
        })),
        subtotal: this.subtotal,
        descuento: this.descuento,
        total: this.total,
        notas: this.notas || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (pedido) => {
          await loader.dismiss();
          this.cart.limpiar();
          const t = await this.toast.create({
            message: '¡Venta confirmada!',
            duration: 2000,
            position: 'bottom',
            color: 'success',
          });
          await t.present();
          this.router.navigate(['/ventas/detalle', pedido.id]);
        },
        error: async (e: any) => {
          await loader.dismiss();
          const msg = e?.error?.message ?? 'Error al guardar la venta';
          const t = await this.toast.create({
            message: msg,
            duration: 2500,
            position: 'bottom',
            color: 'danger',
          });
          await t.present();
        },
      });
  }

  // ── Navegación entre pasos ────────────────────────────────
  volver(): void {
    if (this.paso === 'productos') {
      this.paso = 'cliente';
    } else if (this.paso === 'carrito') {
      this.paso = 'productos';
    } else {
      this.router.navigate(['/dashboard']);
    }
    this.cdr.markForCheck();
  }

  get tituloPaso(): string {
    if (this.paso === 'cliente') return 'Elegir cliente';
    if (this.paso === 'productos') return 'Agregar productos';
    return 'Confirmar venta';
  }

  // ── Helpers ───────────────────────────────────────────────
  initials(nombre: string): string {
    return nombre
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  stockColor(p: ProductoResumen): string {
    const s = p.stock_total ?? 0;
    if (s === 0) return '#DC2626';
    if (s < 50) return '#D97706';
    return '#059669';
  }

  get cartCount(): number {
    return this.cart.count;
  }
}
