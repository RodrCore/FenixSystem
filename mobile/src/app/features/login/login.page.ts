// ═══════════════════════════════════════════════════════════════
// src/app/features/login/login.page.ts
// ═══════════════════════════════════════════════════════════════

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
import { NavController } from '@ionic/angular/standalone';
import { IonContent, IonSpinner, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  eyeOutline,
  eyeOffOutline,
  logInOutline,
  lockClosedOutline,
  mailOutline,
} from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonSpinner, IonIcon],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage implements OnInit, OnDestroy {
  form!: FormGroup;
  loading = false;
  showPw = false;
  error = '';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private nav: NavController,
    private cdr: ChangeDetectorRef,
  ) {
    addIcons({
      eyeOutline,
      eyeOffOutline,
      logInOutline,
      lockClosedOutline,
      mailOutline,
    });
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.nav.navigateRoot('/dashboard', { animated: false });
      return;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLogin(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    const { email, password } = this.form.value;

    this.auth
      .login({ email, password })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.cdr.detectChanges(); // ✅ forzar detección inmediata
          // ✅ Usar window.location para navegación más confiable en Capacitor
          window.location.href = '/dashboard';
        },
        error: (e: any) => {
          this.loading = false;
          this.error = e?.error?.message ?? 'Email o contraseña incorrectos';
          this.cdr.markForCheck();
        },
      });
  }

  togglePw(): void {
    this.showPw = !this.showPw;
    this.cdr.markForCheck();
  }

  // ── Helpers validación ───────────────────────────────────────
  get emailErr(): string {
    const c = this.form.get('email');
    if (!c?.touched || !c?.invalid) return '';
    if (c.hasError('required')) return 'El email es requerido';
    if (c.hasError('email')) return 'Ingresa un email válido';
    return '';
  }

  get passwordErr(): string {
    const c = this.form.get('password');
    if (!c?.touched || !c?.invalid) return '';
    if (c.hasError('required')) return 'La contraseña es requerida';
    if (c.hasError('minlength')) return 'Mínimo 6 caracteres';
    return '';
  }
}
