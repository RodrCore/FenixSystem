import {
  Component, Output, EventEmitter,
  OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { PedidosService, Pedido } from '../../services/pedidos.service';
import { ClientesService, Cliente } from '../../../clientes/services/clientes.service';
import { UsuariosService, Usuario } from '../../../usuarios/services/usuarios.service';
import { VehiculosService, Vehiculo } from '../../../vehiculos/services/vehiculos.service';
import { ProductosService, Producto } from '../../../productos/services/productos.service';

interface DetalleNuevo {
  producto_id:         number;
  presentacion_id:     number;
  producto_nombre:     string;
  presentacion_nombre: string;
  cantidad:            number;
  precio_unitario:     number;
  subtotal:            number;
  stock_disponible:    number;
  sin_stock:           boolean;
}

@Component({
  selector:    'app-pedido-nuevo',
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:     [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './pedido-nuevo.component.html',
  styleUrl:    './pedido-nuevo.component.css',
})
export class PedidoNuevoComponent implements OnInit, OnDestroy {
  @Output() saved     = new EventEmitter<Pedido>();
  @Output() cancelled = new EventEmitter<void>();

  // ═══════════════════════════════════════════════
  // ESTADO DEL FORMULARIO
  // ═══════════════════════════════════════════════
  cliente:       Cliente | null = null;
  detalles:      DetalleNuevo[] = [];
  repartidorId:  number | null = null;
  vehiculoId:    number | null = null;
  fechaEntrega:  string = '';
  metodoPago:    string = 'Efectivo';
  notas:         string = '';
  descuento:     number = 0;

  // ═══════════════════════════════════════════════
  // CATÁLOGOS
  // ═══════════════════════════════════════════════
  repartidores: Usuario[]  = [];
  vehiculos:    Vehiculo[] = [];

  metodosPago = [
    { v: 'Efectivo',      n: 'Efectivo' },
    { v: 'Tarjeta',       n: 'Tarjeta' },
    { v: 'Transferencia', n: 'Transferencia' },
    { v: 'Credito',       n: 'Crédito' },
  ];

  // ═══════════════════════════════════════════════
  // BÚSQUEDA DE CLIENTE
  // ═══════════════════════════════════════════════
  busquedaClienteCtrl = new FormControl('');
  resultadosClientes:  Cliente[] = [];
  buscandoClientes = false;

  // ═══════════════════════════════════════════════
  // BÚSQUEDA DE PRODUCTOS
  // ═══════════════════════════════════════════════
  busquedaProductoCtrl = new FormControl('');
  resultadosProductos: Producto[] = [];
  buscandoProductos = false;

  guardando = false;
  errorMsg = '';

  private destroy$ = new Subject<void>();

  constructor(
    private svc:        PedidosService,
    private clientesSvc: ClientesService,
    private usuariosSvc: UsuariosService,
    private vehiSvc:    VehiculosService,
    private prodSvc:    ProductosService,
    private cdr:        ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.usuariosSvc.getRepartidores()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: reps => {
          this.repartidores = Array.isArray(reps) ? reps : ((reps as any).data ?? []);
          this.cdr.markForCheck();
        },
        error: e => console.error('Error cargando repartidores:', e),
      });

    this.vehiSvc.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: vs => {
          this.vehiculos = Array.isArray(vs) ? vs : ((vs as any).data ?? []);
          this.cdr.markForCheck();
        },
        error: e => console.error('Error cargando vehículos:', e),
      });

    this.busquedaClienteCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(q => this.buscarClientes(q ?? ''));

    this.busquedaProductoCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(q => this.buscarProductos(q ?? ''));

    // Fecha de entrega: día siguiente por defecto
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    this.fechaEntrega = manana.toISOString().split('T')[0];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ═══════════════════════════════════════════════
  // BUSCAR CLIENTES
  // ═══════════════════════════════════════════════
  buscarClientes(q: string): void {
    const query = q.trim();
    if (!query || query.length < 2) {
      this.resultadosClientes = [];
      this.cdr.markForCheck();
      return;
    }

    this.buscandoClientes = true;
    this.clientesSvc.buscar(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: clientes => {
          this.resultadosClientes = clientes;
          this.buscandoClientes = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.buscandoClientes = false;
          this.cdr.markForCheck();
        },
      });
  }

  seleccionarCliente(c: Cliente): void {
    this.cliente = c;
    this.busquedaClienteCtrl.setValue('');
    this.resultadosClientes = [];
    this.cdr.markForCheck();
  }

  quitarCliente(): void {
    this.cliente = null;
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // BUSCAR PRODUCTOS
  // ═══════════════════════════════════════════════
  buscarProductos(q: string): void {
    const query = q.trim();
    if (!query || query.length < 2) {
      this.resultadosProductos = [];
      this.cdr.markForCheck();
      return;
    }

    this.buscandoProductos = true;
    this.prodSvc.getAll({ buscar: query, activo: true, limit: 10 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.resultadosProductos = res.data;
          this.buscandoProductos = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.buscandoProductos = false;
          this.cdr.markForCheck();
        },
      });
  }

  agregarProducto(p: Producto, pres: any): void {
    const stock = Number(p.stock_total ?? 0);
    const sinStock = stock <= 0;

    const existente = this.detalles.find(d => d.presentacion_id === pres.id);
    if (existente) {
      existente.cantidad += 1;
      existente.subtotal = existente.cantidad * existente.precio_unitario;
    } else {
      this.detalles.push({
        producto_id:         p.id,
        presentacion_id:     pres.id,
        producto_nombre:     p.nombre,
        presentacion_nombre: pres.presentacion?.nombre ?? 'Unidad',
        cantidad:            1,
        precio_unitario:     Number(pres.precio_venta),
        subtotal:            Number(pres.precio_venta),
        stock_disponible:    stock,
        sin_stock:           sinStock,
      });
    }

    this.busquedaProductoCtrl.setValue('');
    this.resultadosProductos = [];
    this.cdr.markForCheck();
  }

  cambiarCantidad(detalle: DetalleNuevo, delta: number): void {
    const nuevaCant = detalle.cantidad + delta;
    if (nuevaCant < 1) return;
    detalle.cantidad = nuevaCant;
    detalle.subtotal = detalle.cantidad * detalle.precio_unitario;
    this.cdr.markForCheck();
  }

  setCantidad(detalle: DetalleNuevo, valor: any): void {
    const n = parseInt(String(valor), 10);
    if (isNaN(n) || n < 1) return;
    detalle.cantidad = n;
    detalle.subtotal = n * detalle.precio_unitario;
    this.cdr.markForCheck();
  }

  quitarProducto(detalle: DetalleNuevo): void {
    this.detalles = this.detalles.filter(d => d !== detalle);
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // CÁLCULOS
  // ═══════════════════════════════════════════════
  get subtotal(): number {
    return this.detalles.reduce((s, d) => s + d.subtotal, 0);
  }

  get total(): number {
    return Math.max(0, this.subtotal - this.descuento);
  }

  get hayProductosSinStock(): boolean {
    return this.detalles.some(d => d.sin_stock);
  }

  get esFormValido(): boolean {
    return !!this.cliente && this.detalles.length > 0;
  }

  // ═══════════════════════════════════════════════
  // GUARDAR
  // ═══════════════════════════════════════════════
  guardar(): void {
    this.errorMsg = '';

    if (!this.cliente) {
      this.errorMsg = 'Debes seleccionar un cliente';
      this.cdr.markForCheck();
      return;
    }

    if (!this.detalles.length) {
      this.errorMsg = 'El pedido debe tener al menos un producto';
      this.cdr.markForCheck();
      return;
    }

    this.guardando = true;
    this.cdr.markForCheck();

    const dto = {
      cliente_id:               this.cliente.id,
      repartidor_id:            this.repartidorId,
      vehiculo_id:              this.vehiculoId,
      fecha_entrega_programada: this.fechaEntrega || undefined,
      metodo_pago:              this.metodoPago,
      notas:                    this.notas,
      descuento:                this.descuento,
      detalles:                 this.detalles.map(d => ({
        presentacion_id: d.presentacion_id,
        cantidad:        d.cantidad,
        precio_unitario: d.precio_unitario,
      })),
    };

    this.svc.create(dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: nuevo => {
        this.guardando = false;
        this.saved.emit(nuevo);
      },
      error: (e) => {
        this.guardando = false;
        this.errorMsg = e?.error?.message ?? 'Error al crear el pedido';
        this.cdr.markForCheck();
      },
    });
  }

  cancelar(): void {
    this.cancelled.emit();
  }
}