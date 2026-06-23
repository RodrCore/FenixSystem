import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DashboardData {
  kpis: {
    ventas_hoy:      { valor: number; valor_ayer: number; variacion: number };
    pedidos_activos: { valor: number; valor_ayer: number; diferencia: number };
    tiempo_entrega:  { horas: number; horas_ayer: number; variacion_min: number };
    tasa_entrega:    {
      valor: number; meta: number; diferencia: number;
      total_pedidos: number; entregados: number;
    };
  };
  ultimos_pedidos: Array<{
    id:             number;
    numero:         string;
    cliente_id:     number;
    cliente_nombre: string;
    monto:          number;
    estado:         string;
    fecha:          string;
  }>;
  ventas_7_dias: Array<{ fecha: string; total: number }>;
  top_productos_hoy: Array<{
    producto_id: number;
    nombre:      string;
    codigo:      string;
    total:       number;
  }>;
  alertas: {
    lotes_por_vencer: Array<{
      id:                 number;
      codigo_lote:        string;
      producto:           string;
      fecha_vencimiento:  string;
      cantidad:           number;
      dias_restantes:     number;
    }>;
    productos_sin_stock: number;
  };
  repartidores: { activos: number; total: number };
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private base = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(this.base);
  }
}