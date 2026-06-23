// ═══════════════════════════════════════════════════════════════
// pedido-edit.component.ts — FIX
//
// Cambios:
// - pres.presentacion.nombre (campo correcto)
// - Cargar repartidores con manejo de error y log
// ═══════════════════════════════════════════════════════════════

import {
  Component, Input, Output, EventEmitter,
  OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { PedidosService, Pedido } from '../../services/pedidos.service';
import { UsuariosService, Usuario } from '../../../usuarios/services/usuarios.service';
import { VehiculosService, Vehiculo } from '../../../vehiculos/services/vehiculos.service';
import { ProductosService, Producto } from '../../../productos/services/productos.service';

interface DetalleEditando {
  producto_id:         number;
  presentacion_id:     number;
  producto_nombre:     string;
  presentacion_nombre: string;
  cantidad:            number;
  precio_unitario:     number;
  subtotal:            number;
}

@Component({
  selector:    'app-pedido-edit',
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:     [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './pedido-edit.component.html',
  styleUrl:    './pedido-edit.component.css',
})
export class PedidoEditComponent implements OnInit, OnDestroy {
  @Input() pedido!: Pedido;
  @Output() saved     = new EventEmitter<Pedido>();
  @Output() cancelled = new EventEmitter<void>();

  repartidorId: number | null = null;
  vehiculoId:   number | null = null;
  notas:        string = '';
  descuento:    number = 0;
  detalles:     DetalleEditando[] = [];

  repartidores: Usuario[]  = [];
  vehiculos:    Vehiculo[] = [];

  busquedaCtrl = new FormControl('');
  resultadosProductos: Producto[] = [];
  buscandoProductos = false;

  guardando = false;

  private destroy$ = new Subject<void>();

  constructor(
    private svc:        PedidosService,
    private usuariosSvc: UsuariosService,
    private vehiSvc:    VehiculosService,
    private prodSvc:    ProductosService,
    private cdr:        ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.repartidorId = this.pedido.repartidor_id ?? null;
    this.vehiculoId   = this.pedido.vehiculo_id   ?? null;
    this.notas        = this.pedido.notas_pedido  ?? '';
    this.descuento    = Number(this.pedido.descuento_general ?? 0);

    // ✅ FIX: extraer correctamente el nombre desde presentacion (objeto anidado)
    this.detalles = (this.pedido.detalles ?? []).map((d: any) => ({
  producto_id:         Number(d.producto_id),
  presentacion_id:     Number(d.presentacion_id),
  producto_nombre:     d.producto?.nombre ?? `Producto #${d.producto_id}`,
  presentacion_nombre: d.presentacion?.nombre ?? 'Unidad',
  cantidad:            Number(d.cantidad ?? 1),
  precio_unitario:     Number(d.precio_unitario ?? 0),
  subtotal:            Number(d.subtotal ?? 0),
}));

    // ✅ Cargar repartidores con log para debugging
    console.log('[PedidoEdit] Cargando repartidores...');
    this.usuariosSvc.getRepartidores()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: reps => {
          console.log('[PedidoEdit] Repartidores recibidos:', reps);
          // Soporta tanto array directo como objeto { data: [...] }
          this.repartidores = Array.isArray(reps) ? reps : ((reps as any).data ?? []);
          this.cdr.markForCheck();
        },
        error: e => {
          console.error('[PedidoEdit] Error cargando repartidores:', e);
        },
      });

    this.vehiSvc.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: vs => {
          this.vehiculos = Array.isArray(vs) ? vs : ((vs as any).data ?? []);
          this.cdr.markForCheck();
        },
        error: e => console.error('[PedidoEdit] Error cargando vehículos:', e),
      });

    this.busquedaCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(q => this.buscarProductos(q ?? ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buscarProductos(q: string): void {
    const query = q.trim();
    if (!query) {
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
    const existente = this.detalles.find(d => d.presentacion_id === pres.id);

    if (existente) {
      existente.cantidad += 1;
      existente.subtotal = existente.cantidad * existente.precio_unitario;
    } else {
      this.detalles.push({
        producto_id:         p.id,
        presentacion_id:     pres.id,
        producto_nombre:     p.nombre,
        // ✅ FIX: presentacion es un objeto, el nombre está adentro
        presentacion_nombre: pres.presentacion?.nombre ?? 'Presentación',
        cantidad:            1,
        precio_unitario:     Number(pres.precio_venta),
        subtotal:            Number(pres.precio_venta),
      });
    }

    this.busquedaCtrl.setValue('');
    this.resultadosProductos = [];
    this.cdr.markForCheck();
  }

  cambiarCantidad(detalle: DetalleEditando, delta: number): void {
    const nuevaCant = detalle.cantidad + delta;
    if (nuevaCant < 1) return;
    detalle.cantidad = nuevaCant;
    detalle.subtotal = detalle.cantidad * detalle.precio_unitario;
    this.cdr.markForCheck();
  }

  setCantidad(detalle: DetalleEditando, valor: any): void {
    const n = parseInt(String(valor), 10);
    if (isNaN(n) || n < 1) return;
    detalle.cantidad = n;
    detalle.subtotal = n * detalle.precio_unitario;
    this.cdr.markForCheck();
  }

  quitarProducto(detalle: DetalleEditando): void {
    this.detalles = this.detalles.filter(d => d !== detalle);
    this.cdr.markForCheck();
  }

  get subtotal(): number {
    return this.detalles.reduce((s, d) => s + d.subtotal, 0);
  }

  get total(): number {
    return Math.max(0, this.subtotal - this.descuento);
  }

  guardar(): void {
    if (!this.detalles.length) {
      alert('El pedido debe tener al menos un producto');
      return;
    }

    this.guardando = true;
    this.cdr.markForCheck();

    const dto = {
      repartidor_id: this.repartidorId,
      vehiculo_id:   this.vehiculoId,
      notas:         this.notas,
      descuento:     this.descuento,
      detalles:      this.detalles.map(d => ({
        presentacion_id: d.presentacion_id,
        cantidad:        d.cantidad,
        precio_unitario: d.precio_unitario,
      })),
    };

    this.svc.update(this.pedido.id, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: updated => {
          this.guardando = false;
          this.saved.emit(updated);
        },
        error: (e) => {
          this.guardando = false;
          this.cdr.markForCheck();
          alert(e?.error?.message ?? 'Error guardando los cambios');
        },
      });
  }

  cancelar(): void {
    this.cancelled.emit();
  }
}