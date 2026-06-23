import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const ESTADOS_VENTA = ['Entregado_Total', 'Entregado_Parcial'];
const ESTADOS_ACTIVOS = ['Confirmado', 'Preparando', 'Listo_Carga', 'En_Ruta'];

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(usuarioId: number, rol: string) {
    const now = new Date();
    const inicioHoy = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
    );
    const finHoy = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );

    const inicioAyer = new Date(inicioHoy);
    inicioAyer.setDate(inicioAyer.getDate() - 1);
    const finAyer = new Date(finHoy);
    finAyer.setDate(finAyer.getDate() - 1);

    // Filtro adicional por rol: preventistas/repartidores solo ven lo suyo
    const filtroRol = this.buildFiltroRol(usuarioId, rol);

    const [
      ventasHoy,
      ventasAyer,
      pedidosActivos,
      pedidosActivosAyer,
      tiempoEntregaHoy,
      tiempoEntregaAyer,
      totalPedidosHoy,
      entregadosHoy,
      ultimosPedidos,
      ventasUltimos7Dias,
      topProductosHoy,
      lotesPorVencer,
      productosSinStock,
      repartidoresActivos,
    ] = await Promise.all([
      this.getVentasTotal(inicioHoy, finHoy, filtroRol),
      this.getVentasTotal(inicioAyer, finAyer, filtroRol),
      this.getPedidosActivos(filtroRol),
      this.getPedidosActivos(filtroRol, finAyer),
      this.getTiempoPromedioEntrega(inicioHoy, finHoy, filtroRol),
      this.getTiempoPromedioEntrega(inicioAyer, finAyer, filtroRol),
      this.getPedidosCount(inicioHoy, finHoy, filtroRol),
      this.getPedidosCountPorEstado(
        inicioHoy,
        finHoy,
        ESTADOS_VENTA,
        filtroRol,
      ),
      this.getUltimosPedidos(filtroRol),
      this.getVentasUltimos7Dias(filtroRol),
      this.getTopProductosHoy(inicioHoy, finHoy, filtroRol),
      ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN'].includes(rol)
        ? this.getLotesPorVencer()
        : Promise.resolve([]),
      ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN'].includes(rol)
        ? this.getProductosSinStock()
        : Promise.resolve(0),
      ['SUPER_ADMIN', 'ADMIN', 'GERENTE'].includes(rol)
        ? this.getRepartidoresActivos()
        : Promise.resolve({ activos: 0, total: 0 }),
    ]);

    const tasaEntrega =
      totalPedidosHoy > 0
        ? Number(((entregadosHoy / totalPedidosHoy) * 100).toFixed(1))
        : 0;

    return {
      kpis: {
        ventas_hoy: {
          valor: ventasHoy,
          valor_ayer: ventasAyer,
          variacion: this.calcVariacionPct(ventasHoy, ventasAyer),
        },
        pedidos_activos: {
          valor: pedidosActivos,
          valor_ayer: pedidosActivosAyer,
          diferencia: pedidosActivos - pedidosActivosAyer,
        },
        tiempo_entrega: {
          horas: tiempoEntregaHoy,
          horas_ayer: tiempoEntregaAyer,
          variacion_min: Math.round(
            (tiempoEntregaAyer - tiempoEntregaHoy) * 60,
          ),
        },
        tasa_entrega: {
          valor: tasaEntrega,
          meta: 95,
          diferencia: Number((tasaEntrega - 95).toFixed(1)),
          total_pedidos: totalPedidosHoy,
          entregados: entregadosHoy,
        },
      },
      ultimos_pedidos: ultimosPedidos,
      ventas_7_dias: ventasUltimos7Dias,
      top_productos_hoy: topProductosHoy,
      alertas: {
        lotes_por_vencer: lotesPorVencer,
        productos_sin_stock: productosSinStock,
      },
      repartidores: repartidoresActivos,
      timestamp: now.toISOString(),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════

  private buildFiltroRol(usuarioId: number, rol: string): any {
    if (rol === 'PREVENTISTA') return { preventista_id: usuarioId };
    if (rol === 'REPARTIDOR') return { repartidor_id: usuarioId };
    return {};
  }

  private calcVariacionPct(actual: number, anterior: number): number {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return Number((((actual - anterior) / anterior) * 100).toFixed(1));
  }

  /**
   * Suma total_monto de pedidos entregados en el rango
   */
  private async getVentasTotal(
    desde: Date,
    hasta: Date,
    filtroRol: any,
  ): Promise<number> {
    const r = await this.prisma.pedido.aggregate({
      where: {
        ...filtroRol,
        deleted_at: null,
        estado: { in: ESTADOS_VENTA as any },
        fecha_creacion: { gte: desde, lte: hasta },
      },
      _sum: { total_monto: true },
    });
    return Number(r._sum?.total_monto || 0);
  }

  /**
   * Cuenta pedidos en estados activos.
   * Si pasas "antes" cuenta los que estaban activos hasta ese momento.
   */
  private async getPedidosActivos(
    filtroRol: any,
    hasta?: Date,
  ): Promise<number> {
    const where: any = {
      ...filtroRol,
      deleted_at: null,
      estado: { in: ESTADOS_ACTIVOS as any },
    };
    if (hasta) {
      where.fecha_creacion = { lte: hasta };
    }
    return this.prisma.pedido.count({ where });
  }

  /**
   * Tiempo promedio en HORAS entre fecha_creacion y fecha_entrega_real
   * para pedidos entregados en el rango.
   */
  private async getTiempoPromedioEntrega(
    desde: Date,
    hasta: Date,
    filtroRol: any,
  ): Promise<number> {
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        ...filtroRol,
        deleted_at: null,
        estado: { in: ESTADOS_VENTA as any },
        fecha_entrega_real: { gte: desde, lte: hasta, not: null },
      },
      select: { fecha_creacion: true, fecha_entrega_real: true },
    });

    if (pedidos.length === 0) return 0;

    const totalMs = pedidos.reduce((acc, p) => {
      if (!p.fecha_entrega_real) return acc;
      return (
        acc + (p.fecha_entrega_real.getTime() - p.fecha_creacion.getTime())
      );
    }, 0);

    const promedioHoras = totalMs / pedidos.length / (1000 * 60 * 60);
    return Number(promedioHoras.toFixed(2));
  }

  private async getPedidosCount(
    desde: Date,
    hasta: Date,
    filtroRol: any,
  ): Promise<number> {
    return this.prisma.pedido.count({
      where: {
        ...filtroRol,
        deleted_at: null,
        fecha_creacion: { gte: desde, lte: hasta },
      },
    });
  }

  private async getPedidosCountPorEstado(
    desde: Date,
    hasta: Date,
    estados: string[],
    filtroRol: any,
  ): Promise<number> {
    return this.prisma.pedido.count({
      where: {
        ...filtroRol,
        deleted_at: null,
        estado: { in: estados as any },
        fecha_creacion: { gte: desde, lte: hasta },
      },
    });
  }

  /**
   * Últimos 5 pedidos (cualquier estado)
   */
  private async getUltimosPedidos(filtroRol: any) {
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        ...filtroRol,
        deleted_at: null,
      },
      orderBy: { fecha_creacion: 'desc' },
      take: 5,
      include: {
        cliente: { select: { id: true, razon_social: true } },
      },
    });

    return pedidos.map((p) => ({
      id: p.id,
      numero: p.numero_pedido,
      cliente_id: p.cliente?.id,
      cliente_nombre: p.cliente?.razon_social || 'Desconocido',
      monto: Number(p.total_monto || 0),
      estado: p.estado,
      fecha: p.fecha_creacion,
    }));
  }

  /**
   * Ventas día por día de los últimos 7 días
   */
  private async getVentasUltimos7Dias(filtroRol: any) {
    const hace7 = new Date();
    hace7.setHours(0, 0, 0, 0);
    hace7.setDate(hace7.getDate() - 6); // 7 días incluyendo hoy

    const pedidos = await this.prisma.pedido.findMany({
      where: {
        ...filtroRol,
        deleted_at: null,
        estado: { in: ESTADOS_VENTA as any },
        fecha_creacion: { gte: hace7 },
      },
      select: { fecha_creacion: true, total_monto: true },
    });

    // Inicializar 7 días
    const grupos: Record<string, number> = {};
    const cursor = new Date(hace7);
    const hoyFin = new Date();
    while (cursor <= hoyFin) {
      const k = this.formatDateKey(cursor);
      grupos[k] = 0;
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const p of pedidos) {
      const k = this.formatDateKey(p.fecha_creacion);
      if (grupos[k] !== undefined) {
        grupos[k] += Number(p.total_monto || 0);
      }
    }

    return Object.entries(grupos).map(([fecha, total]) => ({
      fecha,
      total: Number(total.toFixed(2)),
    }));
  }

  /**
   * Top 3 productos vendidos hoy (por monto)
   */
  private async getTopProductosHoy(desde: Date, hasta: Date, filtroRol: any) {
    const wherePedido: any = {
      ...filtroRol,
      deleted_at: null,
      estado: { in: ESTADOS_VENTA as any },
      fecha_creacion: { gte: desde, lte: hasta },
    };

    const grupos = await this.prisma.detallePedido.groupBy({
      by: ['producto_id'],
      where: { pedido: wherePedido },
      _sum: { subtotal_solicitado: true },
      orderBy: { _sum: { subtotal_solicitado: 'desc' } },
      take: 3,
    });

    if (grupos.length === 0) return [];

    const productosIds = grupos.map((g) => g.producto_id);
    const productos = await this.prisma.producto.findMany({
      where: { id: { in: productosIds } },
      select: { id: true, nombre: true, codigo_interno: true },
    });

    return grupos.map((g) => {
      const p = productos.find((x) => x.id === g.producto_id);
      return {
        producto_id: g.producto_id,
        nombre: p?.nombre || 'Desconocido',
        codigo: p?.codigo_interno || '-',
        total: Number(g._sum?.subtotal_solicitado || 0),
      };
    });
  }

  /**
   * Lotes que vencen en los próximos 7 días
   */
  private async getLotesPorVencer() {
    const ahora = new Date();
    const en7Dias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);

    const lotes = await this.prisma.lote.findMany({
      where: {
        estado: 'Disponible' as any,
        cantidad_unidades_disponible: { gt: 0 },
        fecha_vencimiento: { gte: ahora, lte: en7Dias },
      },
      orderBy: { fecha_vencimiento: 'asc' },
      take: 5,
      include: {
        producto: { select: { nombre: true, codigo_interno: true } },
      },
    });

    return lotes.map((l) => ({
      id: l.id,
      codigo_lote: l.codigo_lote,
      producto: l.producto?.nombre || 'Desconocido',
      fecha_vencimiento: l.fecha_vencimiento,
      cantidad: l.cantidad_unidades_disponible,
      dias_restantes: Math.ceil(
        (l.fecha_vencimiento.getTime() - ahora.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    }));
  }

  /**
   * Cantidad de productos con stock total = 0
   */
  private async getProductosSinStock(): Promise<number> {
    const productos = await this.prisma.producto.findMany({
      where: { activo: true },
      include: {
        lotes: {
          where: { estado: 'Disponible' as any },
          select: { cantidad_unidades_disponible: true },
        },
      },
    });

    return productos.filter((p) => {
      const stock = p.lotes.reduce(
        (acc: number, l: any) => acc + l.cantidad_unidades_disponible,
        0,
      );
      return stock === 0;
    }).length;
  }

  /**
   * Repartidores con pedidos activos (en ruta) ahora mismo
   */
  private async getRepartidoresActivos() {
    const total = await this.prisma.usuario.count({
      where: {
        estado: true,
        deleted_at: null,
        rol: { nombre: 'REPARTIDOR' },
      },
    });

    const conRutaActiva = await this.prisma.pedido.findMany({
      where: {
        deleted_at: null,
        estado: 'En_Ruta' as any,
        repartidor_id: { not: null },
      },
      select: { repartidor_id: true },
      distinct: ['repartidor_id'],
    });

    return {
      activos: conRutaActiva.length,
      total,
    };
  }

  private formatDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
