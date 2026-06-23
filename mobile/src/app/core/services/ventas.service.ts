import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Pedido,
  ProductoResumen,
  ClienteResumen,
  DashboardVendedor,
  DetallePedido,
  Vehiculo,
  Usuario,
  PresentacionResumen,
  CartItem,
} from '../models/venta.model';

@Injectable({ providedIn: 'root' })
export class VentasService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Dashboard ─────────────────────────────────────────────
  getDashboard(): Observable<DashboardVendedor> {
    return this.http.get<DashboardVendedor>(
      `${this.api}/pedidos/dashboard-vendedor`,
    );
  }

  // ── Productos ─────────────────────────────────────────────
  getProductos(
    params: {
      buscar?: string;
      categoria_id?: number;
      page?: number;
      limit?: number;
      soloActivos?: boolean; // ✅ nuevo parámetro
    } = {},
  ): Observable<{ data: ProductoResumen[]; total: number; pages: number }> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('limit', String(params.limit ?? 30));

    if (params.buscar) p = p.set('buscar', params.buscar);
    if (params.categoria_id)
      p = p.set('categoria_id', String(params.categoria_id));

    // ✅ Si soloActivos=true, filtrar solo productos activos
    if (params.soloActivos) p = p.set('activo', 'true');

    return this.http.get<any>(`${this.api}/productos`, { params: p });
  }

  getCategorias(): Observable<{ id: number; nombre: string }[]> {
    return this.http.get<any>(`${this.api}/productos/categorias`);
  }

  // ── Clientes ──────────────────────────────────────────────
  getClientes(
    params: {
      buscar?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Observable<{ data: ClienteResumen[]; total: number; pages: number }> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('limit', String(params.limit ?? 20));
    if (params.buscar) p = p.set('buscar', params.buscar);
    return this.http.get<any>(`${this.api}/clientes`, { params: p });
  }

  getClienteById(id: number): Observable<ClienteResumen> {
    return this.http.get<ClienteResumen>(`${this.api}/clientes/${id}`);
  }

  getPedidos(
    params: {
      page?: number;
      limit?: number;
    } = {},
  ): Observable<{ data: Pedido[]; total: number; pages: number }> {
    const p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('limit', String(params.limit ?? 20))
      .set('solo_mios', 'true');
    return this.http.get<any>(`${this.api}/pedidos`, { params: p });
  }

  getPedidoById(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.api}/pedidos/${id}`);
  }
  getEntregasRecientes(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.api}/pedidos/entregas-recientes`);
  }

  editarPedido(
    id: number,
    dto: {
      notas?: string;
      descuento?: number;
      total?: number;
      vehiculo_id?: number | null;
      metodo_pago?: string;
    },
  ): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.api}/pedidos/${id}`, dto);
  }

  cancelarPedido(id: number): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.api}/pedidos/${id}/cancelar`, {});
  }

  // ── Crear cliente ──────────────────────────────────────────
  createCliente(dto: any): Observable<ClienteResumen> {
    return this.http.post<ClienteResumen>(`${this.api}/clientes`, dto);
  }

  // ── Actualizar cliente ─────────────────────────────────────
  updateCliente(id: number, dto: any): Observable<ClienteResumen> {
    return this.http.patch<ClienteResumen>(`${this.api}/clientes/${id}`, dto);
  }

  // ── Cambiar estado cliente ─────────────────────────────────
  cambiarEstadoCliente(id: number, estado: string): Observable<any> {
    return this.http.patch(`${this.api}/clientes/${id}/estado`, { estado });
  }

  getVehiculos(): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${this.api}/vehiculos`);
  }
  entregarPedido(
    id: number,
    entregas?: { detalle_id: number; cantidad: number }[],
  ): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.api}/pedidos/${id}/entregar`, {
      entregas: entregas || [],
    });
  }
  // AGREGAR al final de la clase VentasService:

  // ── Repartidores ──────────────────────────────────────────────
  getRepartidores(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.api}/users/repartidores`);
  }

  // ── Mis entregas (para repartidor) ─────────────────────────────
  getMisEntregas(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.api}/pedidos/mis-entregas`);
  }

  // ── Dashboard del repartidor ───────────────────────────────────
  getDashboardRepartidor(): Observable<{
    pendientes: number;
    en_ruta: number;
    entregados_hoy: number;
  }> {
    return this.http.get<any>(`${this.api}/pedidos/dashboard-repartidor`);
  }

  // ── Asignar repartidor (admin) ─────────────────────────────────
  asignarRepartidor(
    pedidoId: number,
    repartidorId: number | null,
  ): Observable<Pedido> {
    return this.http.patch<Pedido>(
      `${this.api}/pedidos/${pedidoId}/repartidor`,
      {
        repartidor_id: repartidorId,
      },
    );
  }

  // ── Actualizar crearPedido — agregar repartidor_id ─────────────
  crearPedido(dto: {
    cliente_id: number;
    vehiculo_id?: number;
    repartidor_id?: number; // ✅ AGREGAR
    metodo_pago?: 'Efectivo' | 'Transferencia' | 'Cuenta_Corriente' | 'Tarjeta';
    detalles: {
      producto_id: number;
      presentacion_id: number;
      cantidad: number;
      precio_unitario: number;
    }[];
    subtotal: number;
    descuento: number;
    total: number;
    notas?: string;
  }): Observable<Pedido> {
    const body = {
      cliente_id: dto.cliente_id,
      vehiculo_id: dto.vehiculo_id,
      repartidor_id: dto.repartidor_id, // ✅ AGREGAR
      metodo_pago: dto.metodo_pago ?? 'Efectivo',
      descuento: dto.descuento,
      notas: dto.notas,
      total: dto.total,
      detalles: dto.detalles,
    };
    return this.http.post<Pedido>(`${this.api}/pedidos`, body);
  }
  marcarDevolucion(id: number, motivo: string): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.api}/pedidos/${id}/devolver`, {
      motivo,
    });
  }
}
