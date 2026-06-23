import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Rol {
  id:                number;
  nombre:            string;
  descripcion?:      string;
  nivel_jerarquico?: number;
  permisos?:         any;
}

export interface Usuario {
  id:                  number;
  nombres:             string;
  apellido_paterno:    string;
  apellido_materno?:   string;
  email:               string;
  ci?:                 string;
  telefono?:           string;
  avatar_url?:         string;
  numero_empleado?:    string;
  fecha_contratacion?: string;
  salario_base?:       number;
  comision_porcentaje?: number;
  estado:              boolean;
  rol?:                 Rol;
  rol_id:              number;
  deleted_at?:         string | null;
  created_at?:         string;

  // Detallado:
  ultimo_acceso?:           string;
  ultima_ip?:               string;
  intentos_fallidos_login?: number;
  bloqueado_hasta?:         string;
  password_temporal?:       boolean;
  requiere_cambio_password?: boolean;
  deleted_by?:              number;
  motivo_eliminacion?:      string;
  eliminador?:              { id: number; nombres: string; apellido_paterno: string };
}

export interface UsuarioQuery {
  page?:                number;
  limit?:               number;
  buscar?:              string;
  estado?:              boolean | string;
  rol?:                 string;
  incluir_eliminados?:  boolean;
}

export interface UsuarioListResult {
  data:  Usuario[];
  total: number;
  page:  number;
  pages: number;
  limit: number;
}

export interface UsuarioStats {
  total:     number;
  activos:   number;
  inactivos: number;
  por_rol:   Record<string, number>;
}

export interface ResetPasswordResult {
  mensaje:           string;
  password_temporal: string;
  email:             string;
}

export interface CreateUsuarioResult extends Usuario {
  password_temporal_generada?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private base = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  // ── LISTAR ─────────────────────────────────────
  getAll(query: UsuarioQuery = {}): Observable<UsuarioListResult> {
    let params = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<UsuarioListResult>(this.base, { params });
  }

  // ── STATS ──────────────────────────────────────
  getStats(): Observable<UsuarioStats> {
    return this.http.get<UsuarioStats>(`${this.base}/stats`);
  }

  // ── DETALLE ────────────────────────────────────
  getOne(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.base}/${id}`);
  }

  // ── ROLES ──────────────────────────────────────
  getRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.base}/roles`);
  }

  // ── REPARTIDORES ───────────────────────────────
  getRepartidores(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.base}/repartidores`);
  }

  // ── CREAR ──────────────────────────────────────
  create(dto: any): Observable<CreateUsuarioResult> {
    return this.http.post<CreateUsuarioResult>(this.base, dto);
  }

  // ── ACTUALIZAR ─────────────────────────────────
  update(id: number, dto: any): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.base}/${id}`, dto);
  }

  // ── ACTIVAR / DESACTIVAR ───────────────────────
  toggleActive(id: number, estado: boolean): Observable<Usuario> {
    return this.http.patch<Usuario>(
      `${this.base}/${id}/toggle-active`,
      { estado },
    );
  }

  // ── CAMBIAR ROL ────────────────────────────────
  changeRole(id: number, rolId: number): Observable<Usuario> {
    return this.http.patch<Usuario>(
      `${this.base}/${id}/change-role`,
      { rolId },
    );
  }

  // ── RESETEAR PASSWORD ──────────────────────────
  resetPassword(id: number): Observable<ResetPasswordResult> {
    return this.http.post<ResetPasswordResult>(
      `${this.base}/${id}/reset-password`,
      {},
    );
  }

  // ── ELIMINAR (SOFT DELETE) ─────────────────────
  delete(id: number, motivo: string): Observable<Usuario> {
    return this.http.delete<Usuario>(`${this.base}/${id}`, {
      body: { motivo },
    });
  }

  // ── RESTAURAR (solo SUPER_ADMIN) ───────────────
  restore(id: number): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.base}/${id}/restore`, {});
  }
}