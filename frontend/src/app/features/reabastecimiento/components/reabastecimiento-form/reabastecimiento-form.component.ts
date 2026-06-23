import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

import {
  ReabastecimientoService,
  ProductoBajoStock,
} from '../../services/reabastecimiento.service';

import { ProveedoresService, Proveedor } from '../../../proveedores/services/proveedores.service';


interface ItemDetalle {
  producto_presentacion_id: number;
  producto_nombre: string;
  presentacion_nombre: string;
  cantidad_solicitada: number;
  precio_unitario_compra: number;
}

interface ProductoBuscado {
  id: number;
  nombre: string;
  codigo_interno?: string;
  presentaciones: Array<{
    id: number;
    precio_venta: number;
    presentacion: { id: number; nombre: string; siglas?: string };
  }>;
}

@Component({
  selector: 'app-reabastecimiento-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './reabastecimiento-form.component.html',
  styleUrl: './reabastecimiento-form.component.css',
})
export class ReabastecimientoFormComponent implements OnInit, OnDestroy {
  @Output() created = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  // Form state
  proveedores: Proveedor[] = [];
  proveedorSeleccionadoId: number | null = null;
  fechaEsperada = '';
  notas = '';

  // Búsqueda de productos
  busquedaProducto = '';
  resultadosBusqueda: ProductoBuscado[] = [];
  mostrandoResultados = false;
  buscandoProducto = false;

  // Detalles (productos agregados)
  detalles: ItemDetalle[] = [];

  // Sugerencias automáticas
  sugerencias: ProductoBajoStock[] = [];
  mostrarSugerencias = false;

  guardando = false;
  errorMsg = '';

  private destroy$ = new Subject<void>();
  private busquedaTimeout: any;

  constructor(
    private svc: ReabastecimientoService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
    this.cargarSugerencias();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ═══════════════════════════════════════════════
  cargarProveedores(): void {
    this.http
      .get<any>(`${environment.apiUrl}/proveedores?limit=500&activo=true`)
      .pipe(
        takeUntil(this.destroy$),
        map((r) => (Array.isArray(r) ? r : r.data || [])),
      )
      .subscribe({
        next: (list) => {
          this.proveedores = list;
          this.cdr.markForCheck();
        },
        error: (e) => {
          console.error('Error cargando proveedores:', e);
        },
      });
  }

  cargarSugerencias(): void {
    this.svc
      .getSugerenciasBajoStock()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => {
          this.sugerencias = list;
          this.cdr.markForCheck();
        },
      });
  }

  toggleSugerencias(): void {
    this.mostrarSugerencias = !this.mostrarSugerencias;
    this.cdr.markForCheck();
  }

  agregarSugerencia(s: ProductoBajoStock): void {
    if (!s.presentaciones || s.presentaciones.length === 0) {
      alert('Este producto no tiene presentaciones activas');
      return;
    }
    // Usa la primera presentación por defecto
    const pp = s.presentaciones[0];
    this.agregarItem({
      producto_presentacion_id: pp.id,
      producto_nombre: s.nombre,
      presentacion_nombre: pp.presentacion.nombre,
      cantidad_solicitada: s.cantidad_sugerida || 10,
      precio_unitario_compra: Number(pp.precio_venta) * 0.7, // estimado 70% del precio venta
    });
  }

  // ═══════════════════════════════════════════════
  // BÚSQUEDA DE PRODUCTOS
  // ═══════════════════════════════════════════════
  onBuscarProductoInput(): void {
    if (this.busquedaTimeout) clearTimeout(this.busquedaTimeout);

    const q = this.busquedaProducto.trim();
    if (q.length < 2) {
      this.resultadosBusqueda = [];
      this.mostrandoResultados = false;
      this.cdr.markForCheck();
      return;
    }

    this.buscandoProducto = true;
    this.cdr.markForCheck();

    this.busquedaTimeout = setTimeout(() => {
      this.http
        .get<any>(`${environment.apiUrl}/productos`, {
          params: { buscar: q, limit: '8', activo: 'true' },
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            // Si tu endpoint devuelve { data: [...] } o un array directo:
            this.resultadosBusqueda = res.data ?? res;
            this.mostrandoResultados = true;
            this.buscandoProducto = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.buscandoProducto = false;
            this.cdr.markForCheck();
          },
        });
    }, 300);
  }

  agregarProductoBuscado(p: ProductoBuscado, pp: any): void {
    this.agregarItem({
      producto_presentacion_id: pp.id,
      producto_nombre: p.nombre,
      presentacion_nombre: pp.presentacion.nombre,
      cantidad_solicitada: 1,
      precio_unitario_compra: Number(pp.precio_venta) * 0.7,
    });
    this.busquedaProducto = '';
    this.mostrandoResultados = false;
    this.resultadosBusqueda = [];
    this.cdr.markForCheck();
  }

  cerrarResultados(): void {
    setTimeout(() => {
      this.mostrandoResultados = false;
      this.cdr.markForCheck();
    }, 200);
  }

  // ═══════════════════════════════════════════════
  // GESTIÓN DE DETALLES
  // ═══════════════════════════════════════════════
  agregarItem(item: ItemDetalle): void {
    // Si ya existe esa presentación, sumar cantidad
    const idx = this.detalles.findIndex(
      (d) => d.producto_presentacion_id === item.producto_presentacion_id,
    );
    if (idx >= 0) {
      this.detalles[idx].cantidad_solicitada += item.cantidad_solicitada;
    } else {
      this.detalles.push({ ...item });
    }
    this.cdr.markForCheck();
  }

  quitarItem(idx: number): void {
    this.detalles.splice(idx, 1);
    this.cdr.markForCheck();
  }

  actualizarCantidad(idx: number, valor: any): void {
    const n = Number(valor);
    if (isNaN(n) || n <= 0) {
      this.detalles[idx].cantidad_solicitada = 1;
    } else {
      this.detalles[idx].cantidad_solicitada = Math.floor(n);
    }
    this.cdr.markForCheck();
  }

  actualizarPrecio(idx: number, valor: any): void {
    const n = Number(valor);
    if (isNaN(n) || n < 0) {
      this.detalles[idx].precio_unitario_compra = 0;
    } else {
      this.detalles[idx].precio_unitario_compra = n;
    }
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // TOTALES
  // ═══════════════════════════════════════════════
  subtotalItem(d: ItemDetalle): number {
    return d.cantidad_solicitada * d.precio_unitario_compra;
  }

  get totalGeneral(): number {
    return this.detalles.reduce((sum, d) => sum + this.subtotalItem(d), 0);
  }

  // ═══════════════════════════════════════════════
  // GUARDAR
  // ═══════════════════════════════════════════════
  guardar(): void {
    this.errorMsg = '';

    if (!this.proveedorSeleccionadoId) {
      this.errorMsg = 'Selecciona un proveedor';
      this.cdr.markForCheck();
      return;
    }

    if (this.detalles.length === 0) {
      this.errorMsg = 'Agrega al menos un producto';
      this.cdr.markForCheck();
      return;
    }

    for (const d of this.detalles) {
      if (d.cantidad_solicitada <= 0) {
        this.errorMsg = `La cantidad debe ser mayor a 0 para ${d.producto_nombre}`;
        this.cdr.markForCheck();
        return;
      }
      if (d.precio_unitario_compra < 0) {
        this.errorMsg = `Precio inválido para ${d.producto_nombre}`;
        this.cdr.markForCheck();
        return;
      }
    }

    this.guardando = true;
    this.cdr.markForCheck();

    const dto = {
      proveedor_id: this.proveedorSeleccionadoId,
      fecha_esperada: this.fechaEsperada || null,
      notas: this.notas?.trim() || null,
      detalles: this.detalles.map((d) => ({
        producto_presentacion_id: d.producto_presentacion_id,
        cantidad_solicitada: d.cantidad_solicitada,
        precio_unitario_compra: d.precio_unitario_compra,
      })),
    };

    this.svc
      .create(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.guardando = false;
          this.created.emit();
        },
        error: (e) => {
          this.guardando = false;
          this.errorMsg = e?.error?.message ?? 'Error al crear la orden';
          this.cdr.markForCheck();
        },
      });
  }

  cancelar(): void {
    this.cancelled.emit();
  }
}
