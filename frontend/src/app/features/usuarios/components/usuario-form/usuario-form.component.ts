// ═══════════════════════════════════════════════════════════════
// frontend/src/app/features/usuarios/components/usuario-form/usuario-form.component.ts
// ═══════════════════════════════════════════════════════════════

import {
  Component, Input, Output, EventEmitter,
  OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { UsuariosService, Usuario, Rol } from '../../services/usuarios.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector:    'app-usuario-form',
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:     [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './usuario-form.component.html',
  styleUrl:    './usuario-form.component.css',
})
export class UsuarioFormComponent implements OnInit, OnDestroy {
  @Input() usuario: Usuario | null = null;
  @Input() roles:   Rol[] = [];
  @Output() saved     = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  guardando = false;
  errorMsg = '';
  seccionActiva: 'personal' | 'cuenta' | 'laboral' = 'personal';
  generarPasswordAuto = true;
  mostrarPassword = false;

  private destroy$ = new Subject<void>();

  constructor(
    private svc: UsuariosService,
    private fb:  FormBuilder,
    private cdr: ChangeDetectorRef,
    private auth: AuthService,
  ) {}

  get esEdicion(): boolean {
    return !!this.usuario;
  }

  get rolActual(): string {
    return this.auth.getUsuario()?.rol?.nombre ?? '';
  }

  /** Roles que el usuario actual puede asignar */
  get rolesDisponibles(): Rol[] {
    // SUPER_ADMIN puede asignar cualquier rol
    if (this.rolActual === 'SUPER_ADMIN') {
      return this.roles;
    }
    // ADMIN no puede asignar SUPER_ADMIN
    return this.roles.filter(r => r.nombre !== 'SUPER_ADMIN');
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      // Personal
      nombres:           [this.usuario?.nombres ?? '', [Validators.required, Validators.minLength(2)]],
      apellido_paterno:  [this.usuario?.apellido_paterno ?? '', Validators.required],
      apellido_materno:  [this.usuario?.apellido_materno ?? ''],
      ci:                [this.usuario?.ci ?? ''],
      telefono:          [this.usuario?.telefono ?? ''],

      // Cuenta
      email:             [this.usuario?.email ?? '', [Validators.required, Validators.email]],
      password:          [''],
      rol_id:            [this.usuario?.rol_id ?? null, Validators.required],
      estado:            [this.usuario?.estado ?? true],

      // Laboral
      numero_empleado:   [this.usuario?.numero_empleado ?? ''],
      fecha_contratacion: [this.usuario?.fecha_contratacion?.split('T')[0] ?? ''],
      salario_base:      [this.usuario?.salario_base ?? null],
      comision_porcentaje: [this.usuario?.comision_porcentaje ?? null],
    });

    // Si se está creando, password se genera automáticamente por defecto
    if (!this.esEdicion) {
      this.generarPasswordAuto = true;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ═══════════════════════════════════════════════
  // NAVEGACIÓN
  // ═══════════════════════════════════════════════
  irSeccion(s: typeof this.seccionActiva): void {
    this.seccionActiva = s;
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // PASSWORD
  // ═══════════════════════════════════════════════
  togglePasswordAuto(checked: boolean): void {
    this.generarPasswordAuto = checked;
    if (checked) {
      this.form.get('password')?.setValue('');
      this.form.get('password')?.clearValidators();
    } else {
      this.form.get('password')?.setValidators([
        Validators.required, Validators.minLength(6),
      ]);
    }
    this.form.get('password')?.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  togglePasswordVisible(): void {
    this.mostrarPassword = !this.mostrarPassword;
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // GUARDAR
  // ═══════════════════════════════════════════════
  guardar(): void {
    this.errorMsg = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const errs: string[] = [];
      if (this.form.get('nombres')?.invalid) errs.push('Nombres es requerido');
      if (this.form.get('apellido_paterno')?.invalid) errs.push('Apellido paterno es requerido');
      if (this.form.get('email')?.invalid) errs.push('Email inválido');
      if (this.form.get('rol_id')?.invalid) errs.push('Rol es requerido');
      if (this.form.get('password')?.invalid && !this.generarPasswordAuto) {
        errs.push('Password mínimo 6 caracteres');
      }
      this.errorMsg = errs.join(' · ');
      this.cdr.markForCheck();
      return;
    }

    this.guardando = true;
    this.cdr.markForCheck();

    const dto = this.buildDto();

    const obs = this.esEdicion
      ? this.svc.update(this.usuario!.id, dto)
      : this.svc.create(dto);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: result => {
        this.guardando = false;
        this.saved.emit(result);
      },
      error: e => {
        this.guardando = false;
        this.errorMsg = e?.error?.message ?? 'Error al guardar';
        this.cdr.markForCheck();
      },
    });
  }

  private buildDto(): any {
    const v = this.form.value;

    const dto: any = {
      nombres:           v.nombres,
      apellido_paterno:  v.apellido_paterno,
      apellido_materno:  v.apellido_materno || null,
      email:             v.email,
      ci:                v.ci || null,
      telefono:          v.telefono || null,
      rol_id:            Number(v.rol_id),
      estado:            !!v.estado,
      numero_empleado:   v.numero_empleado || null,
    };

    // Password: solo si se crea Y no se generó auto
    if (!this.esEdicion && !this.generarPasswordAuto && v.password) {
      dto.password = v.password;
    }
    // Si es creación y generarPasswordAuto, no enviar password → backend genera temporal

    if (v.fecha_contratacion) dto.fecha_contratacion = v.fecha_contratacion;
    if (v.salario_base !== null && v.salario_base !== '') dto.salario_base = Number(v.salario_base);
    if (v.comision_porcentaje !== null && v.comision_porcentaje !== '') dto.comision_porcentaje = Number(v.comision_porcentaje);

    return dto;
  }

  cancelar(): void {
    this.cancelled.emit();
  }
}