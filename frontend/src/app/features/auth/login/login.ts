import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  isLoading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  showPassword = false;
  returnUrl = '/dashboard';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.isLoading$ = this.store.select(selectIsLoading);
    this.error$     = this.store.select(selectError);
    this.returnUrl  = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    this.store.select(selectIsAuthenticated)
      .pipe(takeUntil(this.destroy$))
      .subscribe(auth => {
        if (auth) this.router.navigate([this.returnUrl]);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const { email, password } = this.loginForm.value;
    this.store.dispatch(AuthActions.login({ email, password }));
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  get emailError(): string {
    const c = this.loginForm.get('email');
    if (c?.touched && c?.hasError('required')) return 'El email es requerido';
    if (c?.touched && c?.hasError('email'))    return 'Ingresa un email válido';
    return '';
  }

  get passwordError(): string {
    const c = this.loginForm.get('password');
    if (c?.touched && c?.hasError('required'))  return 'La contraseña es requerida';
    if (c?.touched && c?.hasError('minlength')) return 'Mínimo 6 caracteres';
    return '';
  }
}