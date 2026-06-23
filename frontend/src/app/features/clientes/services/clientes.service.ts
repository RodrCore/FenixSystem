import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
 
export interface Cliente {
  id:                            number;
  razon_social:                  string;
  nombre_comercial?:             string;
  nit_rfc?:                      string;
  regimen_fiscal?:               string;
 
  contacto_nombres?:             string;
  contacto_apellido_paterno?:    string;
  contacto_apellido_materno?:    string;
  contacto_telefono:             string;
  contacto_whatsapp?:            string;
  contacto_email?:               string;
 
  direccion_calle?:              string;
  direccion_numero?:             string;
  direccion_colonia?:            string;
  direccion_ciudad?:             string;
  direccion_codigo_postal?:      string;
  direccion_referencias?:        string;
  latitud?:                      number | null;
  longitud?:                     number | null;
 
  horario_recepcion_desde?:      string;
  horario_recepcion_hasta?:      string;
  dias_entrega?:                 string;
  tiempo_promedio_entrega_minutos?: number;
 
  preventista_asignado_id?:      number;
  ruta_id?:                      number;
  lista_precios_especial?:       boolean;
  credito_habilitado?:           boolean;
  limite_credito?:               number;
  dias_credito?:                 number;
  saldo_pendiente?:              number;
  tipo_cliente?:                 string;
  frecuencia_promedio_dias?:     number;
  valor_promedio_pedido?:        number;
  estado?:                       string;
  notas_internas?:               string;
 
  deleted_at?:                   string | null;
  deleted_by?:                   number | null;
  motivo_eliminacion?:           string | null;
  eliminador?:                   { id: number; nombres: string; apellido_paterno?: string } | null;
 
  pedidos?: PedidoMini[];        // últimos 10 (en findOne)
}
 
export interface PedidoMini {
  id:             number;
  numero_pedido:  string;
  fecha_creacion: string;
  estado:         string;
  total_monto:    number;
  estado_pago:    string;
}
 
export interface ClienteQuery {
  page?:                 number;
  limit?:                number;
  buscar?:               string;
  estado?:               string;
  tipo_cliente?:         string;
  con_deuda?:            boolean;
  con_credito?:          boolean;
  incluir_eliminados?:   boolean;
}
 
export interface ClienteListResult {
  data:   Cliente[];
  total:  number;
  page:   number;
  pages:  number;
  limit:  number;
}
 
export interface ClienteStats {
  total:        number;
  activos:      number;
  inactivos:    number;
  con_deuda:    number;
  deuda_total:  number;
}
 
@Injectable({ providedIn: 'root' })
export class ClientesService {
  private base = `${environment.apiUrl}/clientes`;
 
  constructor(private http: HttpClient) {}
 
  // ── LISTAR ─────────────────────────────────────────
  getAll(query: ClienteQuery = {}): Observable<ClienteListResult> {
    let params = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<ClienteListResult>(this.base, { params });
  }
 
  // ── STATS ──────────────────────────────────────────
  getStats(): Observable<ClienteStats> {
    return this.http.get<ClienteStats>(`${this.base}/stats`);
  }
 
  // ── DETALLE ────────────────────────────────────────
  getOne(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.base}/${id}`);
  }
 
  // ── BÚSQUEDA RÁPIDA (autocomplete) ────────────────
  buscar(q: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.base}/buscar`, {
      params: new HttpParams().set('q', q),
    });
  }
 
  // ── CREAR ──────────────────────────────────────────
  create(dto: any): Observable<Cliente> {
    return this.http.post<Cliente>(this.base, dto);
  }
 
  // ── ACTUALIZAR ─────────────────────────────────────
  update(id: number, dto: any): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.base}/${id}`, dto);
  }
 
  // ── CAMBIAR ESTADO ─────────────────────────────────
  cambiarEstado(id: number, estado: string): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.base}/${id}/estado`, { estado });
  }
 
  // ── ELIMINAR (SOFT DELETE) ─────────────────────────
  delete(id: number, motivo: string): Observable<Cliente> {
    return this.http.delete<Cliente>(`${this.base}/${id}`, {
      body: { motivo },
    });
  }
 
  // ── RESTAURAR (solo SUPER_ADMIN) ───────────────────
  restore(id: number): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.base}/${id}/restore`, {});
  }
}