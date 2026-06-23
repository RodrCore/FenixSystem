import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  ProductosService,
  Producto,
  Categoria,
} from '../../services/productos.service';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './producto-form.html',
  styleUrl: './producto-form.css',
})
export class ProductoFormComponent implements OnInit, OnDestroy {
  @Input()  producto: Producto | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  form!:      FormGroup;
  categorias: Categoria[] = [];
  saving    = false;
  error     = '';

  private destroy$ = new Subject<void>();

  get isEdit(): boolean { return !!this.producto; }
  get title():  string  { return this.isEdit ? 'Editar producto' : 'Nuevo producto'; }

  constructor(
    private fb:  FormBuilder,
    private svc: ProductosService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: [
        this.producto?.nombre ?? '',
        [Validators.required, Validators.minLength(2)],
      ],
      descripcion_corta:          [this.producto?.descripcion_corta          ?? ''],
      codigo_interno:             [this.producto?.codigo_interno             ?? ''],
      categoria_id:               [this.producto?.categoria?.id              ?? ''],
      marca:                      [this.producto?.marca                      ?? ''],
      precio_compra_promedio:     [this.producto?.precio_compra_promedio     ?? '', [Validators.min(0)]],
      margen_ganancia_porcentaje: [this.producto?.margen_ganancia_porcentaje ?? 28, [Validators.min(0), Validators.max(100)]],
      stock_minimo:               [this.producto?.stock_minimo               ?? 10, [Validators.min(0)]],
      stock_maximo:               [this.producto?.stock_maximo               ?? 500,[Validators.min(0)]],
      dias_para_alerta_vencimiento: [this.producto?.dias_para_alerta_vencimiento ?? 30, [Validators.min(1)]],
    });

    this.svc.getCategorias()
      .pipe(takeUntil(this.destroy$))
      .subscribe(cats => {
        this.categorias = cats;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.saving = true;
    this.error  = '';

    const dto = { ...this.form.value };
    if (!dto.categoria_id)           delete dto.categoria_id;
    if (!dto.descripcion_corta)      delete dto.descripcion_corta;
    if (!dto.codigo_interno)         delete dto.codigo_interno;
    if (!dto.marca)                  delete dto.marca;
    if (!dto.precio_compra_promedio) delete dto.precio_compra_promedio;

    const obs$ = this.isEdit
      ? this.svc.update(this.producto!.id, dto)
      : this.svc.create(dto);

    obs$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.saving = false; this.saved.emit(); },
      error: (e) => {
        this.saving = false;
        this.error  = e?.error?.message ?? 'Error al guardar el producto';
        this.cdr.markForCheck();
      },
    });
  }

  fieldErr(field: string): string {
    const c = this.form.get(field);
    if (!c?.touched || !c?.invalid) return '';
    if (c.hasError('required'))  return 'Campo requerido';
    if (c.hasError('minlength')) return 'Mínimo 2 caracteres';
    if (c.hasError('min'))       return 'El valor no puede ser negativo';
    if (c.hasError('max'))       return 'Máximo 100%';
    return 'Valor inválido';
  }

  hasErr(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.touched && c?.invalid);
  }
}