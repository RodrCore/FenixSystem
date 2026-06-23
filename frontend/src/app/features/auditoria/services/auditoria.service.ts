import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AuditoriaLog {
  id:               string;
  usuario_id:       number;
  usuario_nombre:   string;
  usuario_rol:      string;
  accion:           string;
  modulo:           string | null;
  tabla_afectada:   string | null;
  registro_id:      string | null;
  ip_origen:        string | null;
  fecha_hora:       string;
}

export interface AuditoriaLogDetalle {
  id:               string;
  sesion_id:        string | null;
  usuario: {
    id:       number;
    nombre:   string;
    email:    string;
    rol:      string;
  } | null;
  accion:           string;
  modulo:           string | null;
  tabla_afectada:   string | null;
  registro_id:      string | null;
  valor_anterior:   any;
  valor_nuevo:      any;
  ip_origen:        string | null;
  user_agent:       string | null;
  dispositivo:      string | null;
  navegador:        string | null;
  fecha_hora:       string;
}

export interface AuditoriaQuery {
  page?:        number;
  limit?:       number;
  buscar?:      string;
  usuario_id?:  number | string;
  modulo?:      string;
  accion?:      string;
  ip?:          string;
  desde?:       string;
  hasta?:       string;
  ver_todo?:    boolean;
}

export interface AuditoriaListResult {
  data:  AuditoriaLog[];
  total: number;
  page:  number;
  pages: number;
  limit: number;
}

export interface AuditoriaStats {
  total_periodo:           number;
  acciones_hoy:            number;
  usuarios_activos_hoy:    number;
  modulo_mas_activo:       string;
  modulo_mas_activo_count: number;
}

export interface AuditoriaFiltros {
  modulos:  string[];
  acciones: string[];
  usuarios: Array<{ id: number; nombre: string; rol: string }>;
}

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private base = `${environment.apiUrl}/auditoria`;

  constructor(private http: HttpClient) {}

  private buildParams(query: AuditoriaQuery): HttpParams {
    let params = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return params;
  }

  getAll(query: AuditoriaQuery = {}): Observable<AuditoriaListResult> {
    return this.http.get<AuditoriaListResult>(this.base, {
      params: this.buildParams(query),
    });
  }

  getStats(): Observable<AuditoriaStats> {
    return this.http.get<AuditoriaStats>(`${this.base}/stats`);
  }

  getFiltrosOpciones(): Observable<AuditoriaFiltros> {
    return this.http.get<AuditoriaFiltros>(`${this.base}/filtros/opciones`);
  }

  getOne(id: string): Observable<AuditoriaLogDetalle> {
    return this.http.get<AuditoriaLogDetalle>(`${this.base}/${id}`);
  }

  exportExcel(query: AuditoriaQuery = {}): Observable<Blob> {
    return this.http.get(`${this.base}/export`, {
      params: this.buildParams(query),
      responseType: 'blob',
    });
  }
}