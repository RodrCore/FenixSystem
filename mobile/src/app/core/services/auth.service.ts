// mobile/src/app/core/services/auth.service.ts — CORREGIDO
// El problema: loadFromStorage() es async pero el interceptor
// llama getTokenValue() antes de que termine de leer el storage.
// Solución: exponer una promesa de inicialización.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, Usuario } from '../models/auth.model';

const TOKEN_KEY = 'fenix_token';
const REFRESH_KEY = 'fenix_refresh';
const USER_KEY = 'fenix_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser$ = new BehaviorSubject<Usuario | null>(null);
  private token$ = new BehaviorSubject<string | null>(null);

  // ✅ Promesa pública — el interceptor puede await esto
  readonly ready: Promise<void>;

  constructor(private http: HttpClient) {
    this.ready = this.loadFromStorage();
  }

  // ── Cargar sesión guardada ────────────────────────────────
  private async loadFromStorage(): Promise<void> {
    try {
      const [tokenRes, userRes] = await Promise.all([
        Preferences.get({ key: TOKEN_KEY }),
        Preferences.get({ key: USER_KEY }),
      ]);

      if (tokenRes.value) {
        this.token$.next(tokenRes.value);
      }

      if (userRes.value) {
        try {
          this.currentUser$.next(JSON.parse(userRes.value));
        } catch {
          // JSON inválido — limpiar
          await this.logout();
        }
      }
    } catch (e) {
      console.error('Error cargando sesión:', e);
    }
  }

  // ── Login ─────────────────────────────────────────────────
  login(dto: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, dto)
      .pipe(
        tap(async (res: LoginResponse) => {
          await Preferences.set({ key: TOKEN_KEY, value: res.accessToken });
          await Preferences.set({ key: REFRESH_KEY, value: res.refreshToken });
          await Preferences.set({
            key: USER_KEY,
            value: JSON.stringify(res.usuario),
          });
          this.token$.next(res.accessToken);
          this.currentUser$.next(res.usuario);
        }),
      );
  }

  // ── Logout ────────────────────────────────────────────────
  async logout(): Promise<void> {
    await Promise.all([
      Preferences.remove({ key: TOKEN_KEY }),
      Preferences.remove({ key: REFRESH_KEY }),
      Preferences.remove({ key: USER_KEY }),
    ]);
    this.token$.next(null);
    this.currentUser$.next(null);
  }
  actualizarUsuarioEnMemoria(usuario: any): void {
    localStorage.setItem('usuario', JSON.stringify(usuario));
    this.currentUser$.next(usuario);
  }

  // ── Getters ───────────────────────────────────────────────
  getToken(): Observable<string | null> {
    return this.token$.asObservable();
  }
  getUser(): Observable<Usuario | null> {
    return this.currentUser$.asObservable();
  }
  getCurrentUser(): Usuario | null {
    return this.currentUser$.getValue();
  }
  getTokenValue(): string | null {
    return this.token$.getValue();
  }
  isAuthenticated(): boolean {
    return !!this.token$.getValue();
  }

  get rolNombre(): string {
    const rol = this.currentUser$.getValue()?.rol;
    if (!rol) return '';
    if (typeof rol === 'string') return rol;
    return (rol as any).nombre ?? '';
  }

  hasRole(...roles: string[]): boolean {
    return roles.includes(this.rolNombre);
  }

  isPreventista(): boolean {
    return this.hasRole('PREVENTISTA', 'GERENTE', 'ADMIN', 'SUPER_ADMIN');
  }

  isRepartidor(): boolean {
    return this.hasRole('REPARTIDOR', 'GERENTE', 'ADMIN', 'SUPER_ADMIN');
  }
}
