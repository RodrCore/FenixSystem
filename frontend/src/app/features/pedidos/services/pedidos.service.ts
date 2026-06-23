import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Pedido {
  id:                       number;
  numero_pedido:            string;
  cliente_id:               number;
  cliente?:                 any;
  preventista_id?:          number;
  preventista?:             any;
  repartidor_id?:           number;
  repartidor?:              any;
  ruta_id?:                 number;
  ruta?:                    any;
  vehiculo_id?:             number;
  vehiculo?:                any;
  estado:                   string;
  metodo_pago:              string;
  estado_pago:              string;
  subtotal?:                number;
  descuento_general?:       number;
  iva_total?:               number;
  ieps_total?:              number;
  total_monto:              number;
  fecha_creacion:           string;
  fecha_confirmacion?:      string;
  fecha_entrega_programada?: string;
  fecha_entrega_real?:      string;
  notas_pedido?:            string;
  detalles?:                any[];
  created_by?:              number;
  deleted_at?:              string | null;
}

export interface PedidoQuery {
  page?:           number;
  limit?:          number;
  estado?:         string;
  cliente_id?:     number;
  repartidor_id?:  number;
  preventista_id?: number;
  desde?:          string;
  hasta?:          string;
  buscar?:         string;
  orderBy?:        string;
  order?:          'asc' | 'desc';
  incluir_eliminados?: boolean;
}

export interface PedidoListResult {
  data:   Pedido[];
  total:  number;
  page:   number;
  pages:  number;
  limit:  number;
}

export interface PedidoStats {
  total:           number;
  pendientes:      number;
  en_ruta:         number;
  entregados_hoy:  number;
  cancelados:      number;
  facturado_hoy:   number;
}

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private base = `${environment.apiUrl}/pedidos`;

  constructor(private http: HttpClient) {}

  // ─── LISTAR ─────────────────────────────────────────────
  getAll(query: PedidoQuery = {}): Observable<PedidoListResult> {
    let params = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<PedidoListResult>(this.base, { params });
  }

  // ─── STATS ──────────────────────────────────────────────
  getStats(): Observable<PedidoStats> {
    return this.http.get<PedidoStats>(`${this.base}/stats`);
  }

  // ─── DETALLE ────────────────────────────────────────────
  getOne(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.base}/${id}`);
  }

  // ─── CREAR ──────────────────────────────────────────────
  create(dto: any): Observable<Pedido> {
    return this.http.post<Pedido>(this.base, dto);
  }

  // ─── EDITAR ─────────────────────────────────────────────
  update(id: number, dto: any): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.base}/${id}`, dto);
  }

  // ─── CAMBIAR ESTADO ─────────────────────────────────────
  cambiarEstado(id: number, estado: string): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.base}/${id}/estado`, { estado });
  }

  // ─── CANCELAR ───────────────────────────────────────────
  cancelar(id: number, motivo?: string): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.base}/${id}/cancelar`, { motivo });
  }

  // ─── SOFT DELETE ────────────────────────────────────────
  delete(id: number, motivo?: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}`, {
      body: { motivo },
    });
  }

  // ─── RESTAURAR (después de soft delete) ────────────────
  restore(id: number): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.base}/${id}/restore`, {});
  }

  // ─── GENERAR BOLETA PDF ─────────────────────────────────
  generarBoleta(id: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/boletas/${id}`, {
      responseType: 'blob',
    });
  }
}