// src/app/features/productos/components/producto-detail/producto-detail.ts

import {
  Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  ProductosService, Producto, Presentacion, Proveedor
} from '../../services/productos.service';

type Tab = 'presentaciones' | 'lotes' | 'nuevo-lote';

@Component({
  selector: 'app-producto-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './producto-detail.html',
  styleUrl: './producto-detail.css',
})
export class ProductoDetailComponent implements OnInit {
  @Input()  producto!:    Producto;
  @Output() close        = new EventEmitter<void>();
  @Output() loteAdded    = new EventEmitter<void>();
  @Output() editRequest  = new EventEmitter<Producto>();

  activeTab: Tab = 'presentaciones';

  presentaciones: Presentacion[] = [];
  proveedores:    Proveedor[]    = [];

  loteForm!:   FormGroup;
  ppForm!:     FormGroup;
  savingLote = false;
  savingPP   = false;
  loteError  = '';
  ppError    = '';
  editingPP: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private svc: ProductosService,
    private fb:  FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.buildLoteForm();
    this.buildPPForm();
    this.svc.getPresentaciones().pipe(takeUntil(this.destroy$)).subscribe(p => {
      this.presentaciones = p; this.cdr.markForCheck();
    });
    this.svc.getProveedores().pipe(takeUntil(this.destroy$)).subscribe(p => {
      this.proveedores = p; this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ── Formulario nuevo lote ─────────────────────────────────────
  private buildLoteForm(): void {
    this.loteForm = this.fb.group({
      codigo_lote:                    [`LOTE-${this.producto.codigo_interno}-${new Date().getFullYear()}-02`, [Validators.required]],
      fecha_vencimiento:              ['', [Validators.required]],
      presentacion_recibida_id:       ['', [Validators.required]],
      cantidad_recibida_presentacion: [100, [Validators.required, Validators.min(1)]],
      unidades_por_presentacion:      [12,  [Validators.required, Validators.min(1)]],
      costo_unitario:                 [this.producto.precio_compra_promedio ?? '', [Validators.min(0)]],
      proveedor_id:                   [''],
      ubicacion_almacen:              ['A-01'],
      notas:                          [''],
    });
  }

  // ── Formulario nueva presentación ────────────────────────────
  private buildPPForm(): void {
    this.ppForm = this.fb.group({
      presentacion_id:        ['', [Validators.required]],
      unidades_equivalentes:  [1,  [Validators.required, Validators.min(1)]],
      precio_venta:           ['', [Validators.required, Validators.min(0)]],
      precio_mayoreo:         ['', [Validators.min(0)]],
      cantidad_minima_mayoreo:[1,  [Validators.min(1)]],
    });
  }

  // ── Guardar nuevo lote ────────────────────────────────────────
  submitLote(): void {
    if (this.loteForm.invalid) { this.loteForm.markAllAsTouched(); return; }
    this.savingLote = true;
    this.loteError  = '';

    const dto = { ...this.loteForm.value, producto_id: this.producto.id };
    if (!dto.proveedor_id) delete dto.proveedor_id;

    this.svc.addLote(dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.savingLote = false;
        this.activeTab  = 'lotes';
        this.loteAdded.emit();
        this.buildLoteForm();
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.savingLote = false;
        this.loteError  = e?.error?.message ?? 'Error al guardar lote';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Guardar nueva presentación ────────────────────────────────
  submitPP(): void {
    if (this.ppForm.invalid) { this.ppForm.markAllAsTouched(); return; }
    this.savingPP = true;
    this.ppError  = '';

    const dto = { ...this.ppForm.value };
    if (!dto.precio_mayoreo) delete dto.precio_mayoreo;

    this.svc.addPresentacion(this.producto.id, dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.savingPP  = false;
        this.loteAdded.emit();
        this.buildPPForm();
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.savingPP = false;
        this.ppError  = e?.error?.message ?? 'Error al guardar presentación';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Cambiar estado de lote ────────────────────────────────────
  cambiarEstadoLote(loteId: number, estado: string): void {
    this.svc.updateLoteEstado(loteId, estado).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loteAdded.emit();
    });
  }

  // ── Helpers ──────────────────────────────────────────────────
  get stockTotal(): number {
    return (this.producto.lotes ?? [])
      .filter(l => l.estado === 'Disponible')
      .reduce((s, l) => s + l.cantidad_unidades_disponible, 0);
  }

  lotePct(l: any): number {
    if (!l.cantidad_unidades_inicial) return 0;
    return Math.round((l.cantidad_unidades_disponible / l.cantidad_unidades_inicial) * 100);
  }

  loteColor(l: any): string {
    const p = this.lotePct(l);
    if (p === 0)   return '#DC2626';
    if (p < 25)    return '#D97706';
    return '#059669';
  }

  estadoLoteOpts = ['Disponible', 'Agotado', 'Vencido', 'Cuarentena', 'Mermado'];

  fieldErr(form: FormGroup, field: string): string {
    const c = form.get(field);
    if (!c?.touched || !c?.invalid) return '';
    if (c.hasError('required')) return 'Requerido';
    if (c.hasError('min'))      return 'Valor mínimo inválido';
    return 'Inválido';
  }
}