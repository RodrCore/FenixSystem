import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as AuthActions from '../../../store/auth/auth.actions';
import {
  selectIsLoading,
  selectError,
  selectIsAuthenticated,
} from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  isLoading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  showPassword = false;
  showConfirmPassword = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private store: Store,
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        nombres: ['', [Validators.required, Validators.minLength(2)]],
        apellido_paterno: ['', [Validators.required, Validators.minLength(2)]],
        apellido_materno: [''],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
        telefono: [''],
        numero_empleado: [''],
        acceptTerms: [false, Validators.requiredTrue],
      },
      { validators: this.passwordMatchValidator },
    );

    this.isLoading$ = this.store.select(selectIsLoading);
    this.error$ = this.store.select(selectError);

    this.store
      .select(selectIsAuthenticated)
      .pipe(takeUntil(this.destroy$))
      .subscribe((auth) => {
        if (auth) this.router.navigate(['/dashboard']);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private passwordMatchValidator(c: AbstractControl) {
    const pwd = c.get('password');
    const confirm = c.get('confirmPassword');
    if (!pwd || !confirm) return null;
    return pwd.value === confirm.value ? null : { passwordMismatch: true };
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const v = this.registerForm.value;
    this.store.dispatch(
      AuthActions.register({
        data: {
          email: v.email,
          password: v.password,
          nombres: v.nombres,
          apellido_paterno: v.apellido_paterno,
          apellido_materno: v.apellido_materno || undefined,
          telefono: v.telefono || undefined,
          numero_empleado: v.numero_empleado || undefined,
        },
      }),
    );
  }

  togglePasswordVisibility() { this.showPassword = !this.showPassword; }
  toggleConfirmPasswordVisibility() { this.showConfirmPassword = !this.showConfirmPassword; }

  // =============================================
  // GETTERS DE ERRORES
  // =============================================

  get emailError(): string {
    const c = this.registerForm.get('email');
    if (c?.hasError('required')) return 'El email es requerido';
    if (c?.hasError('email')) return 'Email inválido';
    return '';
  }

  get nombresError(): string {
    const c = this.registerForm.get('nombres');
    if (c?.hasError('required')) return 'El nombre es requerido';
    if (c?.hasError('minlength')) return 'Mínimo 2 caracteres';
    return '';
  }

  get apellidoPaternoError(): string {
    const c = this.registerForm.get('apellido_paterno');
    if (c?.hasError('required')) return 'El apellido es requerido';
    if (c?.hasError('minlength')) return 'Mínimo 2 caracteres';
    return '';
  }

  get passwordError(): string {
    const c = this.registerForm.get('password');
    if (c?.hasError('required')) return 'La contraseña es requerida';
    if (c?.hasError('minlength')) return 'Mínimo 8 caracteres';
    return '';
  }

  get confirmPasswordError(): string {
    if (this.registerForm.hasError('passwordMismatch')) return 'Las contraseñas no coinciden';
    if (this.registerForm.get('confirmPassword')?.hasError('required')) return 'La confirmación es requerida';
    return '';
  }

  // ✅ GETTER FALTANTE — causaba el error TS2339
  get acceptTermsError(): string {
    const c = this.registerForm.get('acceptTerms');
    if (c?.touched && c?.hasError('required')) return 'Debes aceptar los términos';
    return '';
  }
}