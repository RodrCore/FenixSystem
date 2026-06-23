import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
 
export interface Proveedor {
  id:                 number;
  razon_social:       string;
  nombre_comercial?:  string;
  nit_rfc?:           string;
  contacto_telefono?: string;
  contacto_email?:    string;
}
 
export interface DetalleReabastecimiento {
  id?:                       number;
  producto_presentacion_id:  number;
  cantidad_solicitada:       number;
  cantidad_recibida:         number;
  precio_unitario_compra:    number;
  subtotal:                  number;
  producto_presentacion?:    any;
}
 
export interface OrdenReabastecimiento {
  id:                  number;
  numero_orden:        string;
  proveedor_id:        number;
  proveedor?:          Proveedor;
  estado:              'Pendiente' | 'Recibido_Parcial' | 'Recibido_Total' | 'Cancelado';
  fecha_solicitud:     string;
  fecha_recepcion?:    string;
  fecha_esperada?:     string;
  subtotal:            number;
  total:               number;
  notas?:              string;
  solicitante?:        { id: number; nombres: string; apellido_paterno: string };
  receptor?:           { id: number; nombres: string; apellido_paterno: string };
  detalles?:           DetalleReabastecimiento[];
  deleted_at?:         string;
  motivo_eliminacion?: string;
  cantidad_items?:     number;
  created_at?:         string;
}
 
export interface ReabastecimientoStats {
  total:          number;
  pendientes:     number;
  recibidas_hoy:  number;
  total_mes:      number;
}
 
export interface ReabastecimientoListResult {
  data:  OrdenReabastecimiento[];
  total: number;
  page:  number;
  pages: number;
  limit: number;
}
 
export interface ProductoBajoStock {
  id:                  number;
  nombre:              string;
  codigo_interno?:     string;
  stock_actual:        number;
  stock_minimo:        number;
  stock_maximo:        number;
  cantidad_sugerida:   number;
  presentaciones:      Array<{
    id: number;
    unidades_equivalentes: number;
    precio_venta: number;
    presentacion: { id: number; nombre: string; siglas?: string };
  }>;
}
 
@Injectable({ providedIn: 'root' })
export class ReabastecimientoService {
  private base = `${environment.apiUrl}/reabastecimiento`;
 
  constructor(private http: HttpClient) {}
 
  getAll(query: any = {}): Observable<ReabastecimientoListResult> {
    let params = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<ReabastecimientoListResult>(this.base, { params });
  }
 
  getStats(): Observable<ReabastecimientoStats> {
    return this.http.get<ReabastecimientoStats>(`${this.base}/stats`);
  }
 
  getOne(id: number): Observable<OrdenReabastecimiento> {
    return this.http.get<OrdenReabastecimiento>(`${this.base}/${id}`);
  }
 
  getSugerenciasBajoStock(): Observable<ProductoBajoStock[]> {
    return this.http.get<ProductoBajoStock[]>(`${this.base}/sugerencias-bajo-stock`);
  }
 
  create(dto: any): Observable<OrdenReabastecimiento> {
    return this.http.post<OrdenReabastecimiento>(this.base, dto);
  }
 
  recibir(id: number, detalles: { detalle_id: number; cantidad_recibida: number }[]):
    Observable<OrdenReabastecimiento> {
    return this.http.patch<OrdenReabastecimiento>(
      `${this.base}/${id}/recibir`,
      { detalles },
    );
  }
 
  cancelar(id: number, motivo: string): Observable<OrdenReabastecimiento> {
    return this.http.patch<OrdenReabastecimiento>(
      `${this.base}/${id}/cancelar`,
      { motivo },
    );
  }
 
  delete(id: number, motivo: string): Observable<OrdenReabastecimiento> {
    return this.http.delete<OrdenReabastecimiento>(`${this.base}/${id}`, {
      body: { motivo },
    });
  }
 
  /** URL del PDF para abrir/descargar */
  getPdfUrl(id: number): string {
    return `${this.base}/${id}/pdf`;
  }
 
  /** Descargar PDF como blob */
  descargarPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/pdf`, { responseType: 'blob' });
  }
}
