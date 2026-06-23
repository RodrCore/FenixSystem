import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
 
export interface PerfilUsuario {
  id:                 number;
  nombres:            string;
  apellido_paterno?:  string;
  apellido_materno?:  string;
  email:              string;
  telefono?:          string;
  avatar_url?:        string;
  numero_empleado?:   string;
  fecha_contratacion?: string;
  created_at?:        string;
  rol?:               { id: number; nombre: string };
}
 
@Injectable({ providedIn: 'root' })
export class PerfilService {
  private api = environment.apiUrl;
 
  constructor(private http: HttpClient) {}
 
  // ── Obtener perfil del usuario logueado ────────────────────
  getMi(): Observable<PerfilUsuario> {
    return this.http.get<PerfilUsuario>(`${this.api}/perfil`);
  }
 
  // ── Actualizar datos personales ────────────────────────────
  actualizar(datos: {
    nombres?:          string;
    apellido_paterno?: string;
    apellido_materno?: string;
    telefono?:         string;
    email?:            string;
  }): Observable<PerfilUsuario> {
    return this.http.patch<PerfilUsuario>(`${this.api}/perfil`, datos);
  }
 
  // ── Cambiar contraseña ─────────────────────────────────────
  cambiarPassword(actual: string, nueva: string): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.api}/perfil/password`, {
      actual, nueva,
    });
  }
 
  // ── Subir foto de perfil ───────────────────────────────────
  // archivo viene en formato Blob (de Capacitor Camera o input file)
  subirAvatar(archivo: Blob, nombreOriginal: string = 'avatar.jpg'): Observable<PerfilUsuario> {
    const form = new FormData();
    form.append('avatar', archivo, nombreOriginal);
    return this.http.post<PerfilUsuario>(`${this.api}/perfil/avatar`, form);
  }
 
  // ── Eliminar foto de perfil ────────────────────────────────
  eliminarAvatar(): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.api}/perfil/avatar`);
  }
 
  // ── Cerrar todas las sesiones ──────────────────────────────
  cerrarSesionesRemotas(): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.api}/perfil/cerrar-sesiones`, {});
  }
 
  // ── Helper: convertir URL relativa a absoluta ──────────────
  urlCompleta(avatarUrl?: string): string | null {
    if (!avatarUrl) return null;
    // Si ya viene con http(s), devolverla tal cual
    if (/^https?:\/\//.test(avatarUrl)) return avatarUrl;
    // Si es relativa (/uploads/avatars/...), prepender la base del API
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${base}${avatarUrl}`;
  }
}
