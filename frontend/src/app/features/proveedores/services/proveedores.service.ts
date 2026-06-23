import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Proveedor {
  id:                 number;
  razon_social:       string;
  nombre_comercial?:  string;
  nit_rfc?:           string;
  contacto_nombres?:  string;
  contacto_telefono?: string;
  contacto_email?:    string;
  direccion_completa?: string;
  latitud?:           number;
  longitud?:          number;
  dias_entrega?:      string;
  condiciones_pago?:  string;
  activo:             boolean;
  notas?:             string;
  deleted_at?:        string | null;
  created_at?:        string;
  updated_at?:        string;

  // Detallado
  deleted_by?:        number;
  motivo_eliminacion?: string;
  eliminador?:        { id: number; nombres: string; apellido_paterno: string };
  ordenes_recientes?: any[];
  lotes_recientes?:   any[];
  total_ordenes?:     number;
  total_lotes?:       number;
}

export interface ProveedorQuery {
  page?:       number;
  limit?:      number;
  buscar?:     string;
  activo?:     boolean | string;
  eliminados?: boolean;
}

export interface ProveedorListResult {
  data:  Proveedor[];
  total: number;
  page:  number;
  pages: number;
  limit: number;
}

export interface ProveedorStats {
  total:      number;
  activos:    number;
  inactivos:  number;
  eliminados: number;
}

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private base = `${environment.apiUrl}/proveedores`;

  constructor(private http: HttpClient) {}

  getAll(query: ProveedorQuery = {}): Observable<ProveedorListResult> {
    let params = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<ProveedorListResult>(this.base, { params });
  }

  /**
   * Obtiene todos los proveedores activos (para dropdowns como reabastecimiento).
   * Soporta backend que devuelve { data: [...] } o array directo.
   */
  getActivosForSelect(): Observable<Proveedor[]> {
    return this.http
      .get<any>(`${this.base}?limit=500&activo=true`)
      .pipe(map(r => (Array.isArray(r) ? r : r.data || [])));
  }

  getStats(): Observable<ProveedorStats> {
    return this.http.get<ProveedorStats>(`${this.base}/stats`);
  }

  getOne(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.base}/${id}`);
  }

  create(dto: any): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.base, dto);
  }

  update(id: number, dto: any): Observable<Proveedor> {
    return this.http.patch<Proveedor>(`${this.base}/${id}`, dto);
  }

  toggleActive(id: number, activo: boolean): Observable<Proveedor> {
    return this.http.patch<Proveedor>(`${this.base}/${id}/toggle-active`, { activo });
  }

  delete(id: number, motivo: string): Observable<Proveedor> {
    return this.http.delete<Proveedor>(`${this.base}/${id}`, { body: { motivo } });
  }

  restore(id: number): Observable<Proveedor> {
    return this.http.patch<Proveedor>(`${this.base}/${id}/restore`, {});
  }
}