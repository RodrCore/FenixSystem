import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  RefreshTokenRequest,
  Usuario,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly authUrl = `${this.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  // =============================================
  // LOGIN
  // =============================================

  login(email: string, password: string): Observable<AuthResponse> {
    const body: LoginRequest = { email, password };
    return this.http.post<AuthResponse>(`${this.authUrl}/login`, body);
  }

  // =============================================
  // REGISTER
  // =============================================

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/register`, data);
  }

  // =============================================
  // OBTENER USUARIO ACTUAL
  // =============================================

  getCurrentUser(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.authUrl}/me`);
  }

  // =============================================
  // REFRESH TOKEN
  // =============================================

  refreshToken(refreshToken: string, userId: number): Observable<AuthResponse> {
    const body: RefreshTokenRequest = { refreshToken, userId };
    return this.http.post<AuthResponse>(`${this.authUrl}/refresh`, body);
  }

  // =============================================
  // CAMBIAR CONTRASEÑA
  // =============================================

  changePassword(changePasswordData: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.authUrl}/change-password`,
      changePasswordData,
    );
  }

  // =============================================
  // LOGOUT
  // =============================================

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.authUrl}/logout`, {});
  }

  // =============================================
  // MÉTODOS DE UTILIDAD (localStorage)
  // =============================================

  /**
   * Guardar tokens en localStorage
   */
  saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  /**
   * Obtener access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Obtener refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Guardar usuario en localStorage
   */
  saveUsuario(usuario: Usuario): void { 
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  /**
   * Obtener usuario de localStorage
   */
  getUsuario(): Usuario | null {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  }

  /**
   * Limpiar tokens y usuario
   */
  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('usuario');
  }

  /**
   * Verificar si hay token válido
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Obtener rol del usuario actual
   */
  getCurrentUserRole(): string | null {
    const usuario = this.getUsuario();
    return usuario?.rol?.nombre || null;
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(rol: string): boolean {
    const currentRole = this.getCurrentUserRole();
    return currentRole === rol;
  }

  /**
   * Verificar si el usuario tiene alguno de los roles
   */
  hasAnyRole(roles: string[]): boolean {
    const currentRole = this.getCurrentUserRole();
    return currentRole ? roles.includes(currentRole) : false;
  }

  /**
   * Verificar si el usuario tiene un permiso
   */
  hasPermission(permission: string): boolean {
    const usuario = this.getUsuario();
    if (!usuario?.rol?.permisos) {
      return false;
    }

    const [modulo, accion] = permission.split('.');
    return usuario.rol.permisos[modulo]?.[accion] === true;
  }

  /**
   * Obtener permisos del usuario
   */
  getPermissions(): Record<string, any> {
    const usuario = this.getUsuario();
    return usuario?.rol?.permisos || {};
  }
}
