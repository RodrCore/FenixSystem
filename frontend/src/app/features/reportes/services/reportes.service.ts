import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type Periodo = 'hoy' | 'semana' | 'mes' | 'anio' | 'custom';

export interface ReporteFiltro {
  periodo: Periodo;
  desde?: string;  // YYYY-MM-DD
  hasta?: string;  // YYYY-MM-DD
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private base = `${environment.apiUrl}/reportes-admin`;

  constructor(private http: HttpClient) {}

  private buildParams(filtro: ReporteFiltro): HttpParams {
    let params = new HttpParams().set('periodo', filtro.periodo);
    if (filtro.desde) params = params.set('desde', filtro.desde);
    if (filtro.hasta) params = params.set('hasta', filtro.hasta);
    return params;
  }

  getVentas(filtro: ReporteFiltro): Observable<any> {
    return this.http.get(`${this.base}/ventas`, { params: this.buildParams(filtro) });
  }

  getPedidos(filtro: ReporteFiltro): Observable<any> {
    return this.http.get(`${this.base}/pedidos`, { params: this.buildParams(filtro) });
  }

  getReabastecimientos(filtro: ReporteFiltro): Observable<any> {
    return this.http.get(`${this.base}/reabastecimientos`, { params: this.buildParams(filtro) });
  }

  getInventario(filtro: ReporteFiltro): Observable<any> {
    return this.http.get(`${this.base}/inventario`, { params: this.buildParams(filtro) });
  }

  getComercial(filtro: ReporteFiltro): Observable<any> {
    return this.http.get(`${this.base}/comercial`, { params: this.buildParams(filtro) });
  }

  getClientes(filtro: ReporteFiltro): Observable<any> {
    return this.http.get(`${this.base}/clientes`, { params: this.buildParams(filtro) });
  }

  /**
   * Descarga el reporte exportado como Blob.
   * El interceptor JWT envía el token automáticamente.
   */
  exportar(
    seccion: string,
    filtro: ReporteFiltro,
    formato: 'excel' | 'pdf',
  ): Observable<Blob> {
    const params = this.buildParams(filtro).set('formato', formato);
    return this.http.get(`${this.base}/${seccion}/export`, {
      params,
      responseType: 'blob',
    });
  }
}