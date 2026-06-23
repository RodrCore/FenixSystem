export interface Pedido {
  id: number;
  numero: string;
  cliente_id: number;
  cliente?: ClienteResumen;
  estado: EstadoPedido;
  subtotal: number;
  descuento: number;
  total: number;
  notas?: string;
  created_at: string;
  detalles?: DetallePedido[];
  repartidor_id?: number;
  repartidor?: Usuario;
  ruta_id?: number;
  ruta?: { id: number; nombre: string; color_mapa?: string };
  preventista?: Usuario;
  fecha_entrega_real?: string;
  vehiculo_id?: number;
}

export type EstadoPedido =
  | 'Borrador'
  | 'Confirmado'
  | 'Preparando'
  | 'Listo_Carga'
  | 'En_Ruta'
  | 'Entregado_Parcial'
  | 'Entregado_Total'
  | 'Cancelado'
  | 'Devuelto';

export interface DetallePedido {
  id: number;
  producto_id: number;
  presentacion_id: number;
  cantidad: number; // cantidad_presentacion_solicitada mapeado
  precio_unitario: number; // precio_unitario_presentacion mapeado
  subtotal: number; // subtotal_solicitado mapeado
  producto?: { id: number; nombre: string };
  presentacion?: { id: number; nombre: string };
}

export interface ProductoResumen {
  id: number;
  nombre: string;
  codigo_interno?: string;
  marca?: string;
  categoria?: { id: number; nombre: string };
  stock_total?: number;
  imagen_url?: string;
  activo: boolean;
  presentaciones?: PresentacionResumen[];
}

export interface PresentacionResumen {
  id: number;
  nombre: string;
  siglas: string;
  unidades_equivalentes: number;
  precio_venta: number;
  precio_mayoreo?: number;
}

export interface ClienteResumen {
  id: number;
  razon_social: string;
  nombre_comercial?: string;
  contacto_telefono: string;
  contacto_whatsapp?: string;
  contacto_email?: string;
  direccion_calle?: string;
  direccion_numero?: string;
  direccion_ciudad?: string;
  direccion_colonia?: string;
  direccion_referencias?: string;
  latitud?: number;
  longitud?: number;
  saldo_pendiente?: number;
  credito_habilitado: boolean;
  limite_credito?: number;
  dias_credito?: number;
  frecuencia_promedio_dias?: number;
  valor_promedio_pedido?: number;
  tipo_cliente?: string;
  estado: string;
  notas_internas?: string;
  pedidos?: any[];
}

export interface CartItem {
  producto: ProductoResumen;
  presentacion: PresentacionResumen;
  cantidad: number;
  precio_unit: number;
  total: number;
}

export interface DashboardVendedor {
  ventas_hoy: number;
  ventas_ayer: number;
  pedidos_hoy: number;
  ultimos_pedidos: Pedido[];
}

export interface Vehiculo {
  id: number;
  matricula: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  color?: string;
  tipo?: string;
  capacidad_kg?: number;
  activo: boolean;
}

export interface Usuario {
  id: number;
  nombres: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  telefono_movil?: string;
}
