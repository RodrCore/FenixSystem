import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  ToastController,
  LoadingController,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { VentasService } from '../../core/services/ventas.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import {
  UbicacionMapaComponent,
  LatLng,
} from '../../shared/components/ubicacion-mapa/ubicacion-mapa';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    NavbarComponent,
    UbicacionMapaComponent,
  ],
  templateUrl: './cliente-form.page.html',
  styleUrl: './cliente-form.page.scss',
})
export class ClienteFormPage implements OnInit, OnDestroy {
  form!: FormGroup;
  loading = false;
  isEdit = false;
  clienteId: number | null = null;
  private destroy$ = new Subject<void>();
  showMapa = false;
  latitud: number | null = null;
  longitud: number | null = null;

  get titulo(): string {
    return this.isEdit ? 'Editar cliente' : 'Nuevo cliente';
  }

  constructor(
    private fb: FormBuilder,
    private ventas: VentasService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastController,
    private loader: LoadingController,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.buildForm();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nuevo') {
      this.isEdit = true;
      this.clienteId = Number(id);
      this.cargarCliente(this.clienteId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      // Datos principales
      razon_social: ['', [Validators.required, Validators.minLength(2)]],
      nombre_comercial: [''],
      nit_rfc: [''],
      tipo_cliente: [''],
      // Contacto
      contacto_nombres: [''],
      contacto_telefono: ['', [Validators.required]],
      contacto_whatsapp: [''],
      contacto_email: ['', [Validators.email]],
      // Dirección
      direccion_calle: [''],
      direccion_numero: [''],
      direccion_colonia: [''],
      direccion_ciudad: [''],
      direccion_referencias: [''],
      // Crédito
      credito_habilitado: [false],
      limite_credito: [''],
      dias_credito: [0],
      // Notas
      notas_internas: [''],
    });
  }

  private cargarCliente(id: number): void {
    this.loading = true;
    this.ventas
      .getClienteById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (c) => {
          this.form.patchValue({
            razon_social: c.razon_social,
            nombre_comercial: c.nombre_comercial ?? '',
            nit_rfc: (c as any).nit_rfc ?? '',
            tipo_cliente: (c as any).tipo_cliente ?? '',
            contacto_nombres: (c as any).contacto_nombres ?? '',
            contacto_telefono: c.contacto_telefono,
            contacto_whatsapp: c.contacto_whatsapp ?? '',
            contacto_email: (c as any).contacto_email ?? '',
            direccion_calle: (c as any).direccion_calle ?? '',
            direccion_numero: (c as any).direccion_numero ?? '',
            direccion_colonia: c.direccion_colonia ?? '',
            direccion_ciudad: (c as any).direccion_ciudad ?? '',
            direccion_referencias: (c as any).direccion_referencias ?? '',
            credito_habilitado: c.credito_habilitado,
            limite_credito: c.limite_credito ?? '',
            dias_credito: (c as any).dias_credito ?? 0,
            notas_internas: (c as any).notas_internas ?? '',
          });
          this.loading = false;
          this.cdr.markForCheck();
          this.latitud  = c.latitud  ? Number(c.latitud)  : null;
          this.longitud = c.longitud ? Number(c.longitud) : null;
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const load = await this.loader.create({
      message: this.isEdit ? 'Actualizando...' : 'Guardando...',
    });
    await load.present();

    const dto = { ...this.form.value };
    if (!dto.nit_rfc) delete dto.nit_rfc;
    if (!dto.nombre_comercial) delete dto.nombre_comercial;
    if (!dto.contacto_nombres) delete dto.contacto_nombres;
    if (!dto.contacto_apellido_paterno) delete dto.contacto_apellido_paterno;
    if (!dto.contacto_apellido_materno) delete dto.contacto_apellido_materno;
    if (!dto.contacto_whatsapp) delete dto.contacto_whatsapp;
    if (!dto.contacto_email) delete dto.contacto_email;
    if (!dto.limite_credito) delete dto.limite_credito;
    if (!dto.notas_internas) delete dto.notas_internas;
    if (this.latitud  !== null) dto.latitud  = this.latitud;
    if (this.longitud !== null) dto.longitud = this.longitud;

    const obs$ = this.isEdit
      ? this.ventas.updateCliente(this.clienteId!, dto)
      : this.ventas.createCliente(dto);

    obs$.pipe(takeUntil(this.destroy$)).subscribe({
      next: async () => {
        await load.dismiss();
        const t = await this.toast.create({
          message: this.isEdit ? 'Cliente actualizado' : 'Cliente registrado',
          duration: 2000,
          position: 'bottom',
          color: 'success',
        });
        await t.present();
        this.router.navigate(['/clientes']);
      },
      error: async (e: any) => {
        await load.dismiss();
        const t = await this.toast.create({
          message: e?.error?.message ?? 'Error al guardar',
          duration: 2500,
          position: 'bottom',
          color: 'danger',
        });
        await t.present();
      },
    });
  }

  hasErr(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.touched && c?.invalid);
  }

  fieldErr(field: string): string {
    const c = this.form.get(field);
    if (!c?.touched || !c?.invalid) return '';
    if (c.hasError('required')) return 'Campo requerido';
    if (c.hasError('minlength')) return 'Mínimo 2 caracteres';
    if (c.hasError('email')) return 'Email inválido';
    return 'Valor inválido';
  }

  abrirMapa(): void {
    this.showMapa = true;
    this.cdr.markForCheck();
  }

  onUbicacionSeleccionada(coords: LatLng): void {
    this.latitud = coords.lat;
    this.longitud = coords.lng;
    this.showMapa = false;
    this.cdr.markForCheck();
  }

  onMapaCancelado(): void {
    this.showMapa = false;
    this.cdr.markForCheck();
  }

  get tieneUbicacion(): boolean {
    return this.latitud !== null && this.longitud !== null;
  }
}
