// src/app/features/productos/services/productos.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Categoria    { id: number; nombre: string; }
export interface Presentacion { id: number; nombre: string; siglas: string; }
export interface Proveedor    { id: number; razon_social: string; nombre_comercial?: string; }

export interface ProductoPresentacion {
  id: number;
  presentacion_id: number;
  unidades_equivalentes: number;
  precio_venta: number;
  precio_mayoreo?: number;
  cantidad_minima_mayoreo: number;
  activo: boolean;
  presentacion: Presentacion;
}

export interface Lote {
  id: number;
  codigo_lote: string;
  fecha_vencimiento: string;
  cantidad_unidades_inicial: number;
  cantidad_unidades_disponible: number;
  costo_unitario?: number;
  estado: 'Disponible' | 'Agotado' | 'Vencido' | 'Cuarentena' | 'Mermado';
  ubicacion_almacen?: string;
  proveedor?: { id: number; razon_social: string };
  presentacion?: Presentacion;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion_corta?: string;
  codigo_interno?: string;
  marca?: string;
  activo: boolean;
  precio_compra_promedio?: number;
  margen_ganancia_porcentaje?: number;
  stock_minimo: number;
  stock_maximo: number;
  dias_para_alerta_vencimiento: number;
  stock_total?: number;
  categoria?: Categoria;
  presentaciones?: ProductoPresentacion[];
  lotes?: Lote[];
}

export interface ProductosPage {
  data: Producto[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ProductoStats {
  total: number;
  activos: number;
  inactivos: number;
  sinStock: number;
  porVencer: number;
}

export interface ProductoQuery {
  buscar?: string;
  categoria_id?: number;
  marca?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private readonly url = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  // ── Productos ──────────────────────────────────────────────────
  getAll(query: ProductoQuery = {}): Observable<ProductosPage> {
    let params = new HttpParams();
 
    // page y limit — siempre incluir
    params = params.set('page',  String(query.page  ?? 1));
    params = params.set('limit', String(query.limit ?? 20));
 
    // orderBy y order — siempre incluir
    params = params.set('orderBy', query.orderBy ?? 'nombre');
    params = params.set('order',   query.order   ?? 'asc');
 
    // buscar — solo si tiene valor
    if (query.buscar && query.buscar.trim()) {
      params = params.set('buscar', query.buscar.trim());
    }
 
    // categoria_id — solo si es número positivo
    if (query.categoria_id && query.categoria_id > 0) {
      params = params.set('categoria_id', String(query.categoria_id));
    }
 
    // ✅ activo — solo si está definido explícitamente como true o false
    // NO enviar si no se eligió filtro (undefined = mostrar todos)
    if (query.activo === true)  params = params.set('activo', 'true');
    if (query.activo === false) params = params.set('activo', 'false');
    // Si query.activo === undefined → no agregar param → backend devuelve todos
 
    // marca — solo si tiene valor
    if (query.marca && query.marca.trim()) {
      params = params.set('marca', query.marca.trim());
    }
 
    return this.http.get<ProductosPage>(this.url, { params });
  }


  getOne(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.url}/${id}`);
  }

  create(dto: Partial<Producto>): Observable<Producto> {
    return this.http.post<Producto>(this.url, dto);
  }

  update(id: number, dto: Partial<Producto>): Observable<Producto> {
    return this.http.patch<Producto>(`${this.url}/${id}`, dto);
  }

  toggleActive(id: number, activo: boolean): Observable<any> {
    return this.http.patch(`${this.url}/${id}/toggle`, { activo });
  }

  getStats(): Observable<ProductoStats> {
    return this.http.get<ProductoStats>(`${this.url}/stats`);
  }

  // ── Catálogos ──────────────────────────────────────────────────
  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.url}/categorias`);
  }

  getPresentaciones(): Observable<Presentacion[]> {
    return this.http.get<Presentacion[]>(`${this.url}/presentaciones`);
  }

  getProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.url}/proveedores`);
  }

  // ── Presentaciones ─────────────────────────────────────────────
  addPresentacion(productoId: number, dto: any): Observable<ProductoPresentacion> {
    return this.http.post<ProductoPresentacion>(`${this.url}/${productoId}/presentaciones`, dto);
  }

  updatePresentacion(ppId: number, dto: any): Observable<ProductoPresentacion> {
    return this.http.patch<ProductoPresentacion>(`${this.url}/presentaciones/${ppId}`, dto);
  }

  // ── Lotes ──────────────────────────────────────────────────────
  addLote(dto: any): Observable<Lote> {
    return this.http.post<Lote>(`${this.url}/lotes`, dto);
  }

  updateLoteEstado(loteId: number, estado: string): Observable<Lote> {
    return this.http.patch<Lote>(`${this.url}/lotes/${loteId}/estado`, { estado });
  }
}