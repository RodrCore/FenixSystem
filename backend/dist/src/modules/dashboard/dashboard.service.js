"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const ESTADOS_VENTA = ['Entregado_Total', 'Entregado_Parcial'];
const ESTADOS_ACTIVOS = ['Confirmado', 'Preparando', 'Listo_Carga', 'En_Ruta'];
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardData(usuarioId, rol) {
        const now = new Date();
        const inicioHoy = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const finHoy = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        const inicioAyer = new Date(inicioHoy);
        inicioAyer.setDate(inicioAyer.getDate() - 1);
        const finAyer = new Date(finHoy);
        finAyer.setDate(finAyer.getDate() - 1);
        const filtroRol = this.buildFiltroRol(usuarioId, rol);
        const [ventasHoy, ventasAyer, pedidosActivos, pedidosActivosAyer, tiempoEntregaHoy, tiempoEntregaAyer, totalPedidosHoy, entregadosHoy, ultimosPedidos, ventasUltimos7Dias, topProductosHoy, lotesPorVencer, productosSinStock, repartidoresActivos,] = await Promise.all([
            this.getVentasTotal(inicioHoy, finHoy, filtroRol),
            this.getVentasTotal(inicioAyer, finAyer, filtroRol),
            this.getPedidosActivos(filtroRol),
            this.getPedidosActivos(filtroRol, finAyer),
            this.getTiempoPromedioEntrega(inicioHoy, finHoy, filtroRol),
            this.getTiempoPromedioEntrega(inicioAyer, finAyer, filtroRol),
            this.getPedidosCount(inicioHoy, finHoy, filtroRol),
            this.getPedidosCountPorEstado(inicioHoy, finHoy, ESTADOS_VENTA, filtroRol),
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
        const tasaEntrega = totalPedidosHoy > 0
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
                    variacion_min: Math.round((tiempoEntregaAyer - tiempoEntregaHoy) * 60),
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
    buildFiltroRol(usuarioId, rol) {
        if (rol === 'PREVENTISTA')
            return { preventista_id: usuarioId };
        if (rol === 'REPARTIDOR')
            return { repartidor_id: usuarioId };
        return {};
    }
    calcVariacionPct(actual, anterior) {
        if (anterior === 0)
            return actual > 0 ? 100 : 0;
        return Number((((actual - anterior) / anterior) * 100).toFixed(1));
    }
    async getVentasTotal(desde, hasta, filtroRol) {
        const r = await this.prisma.pedido.aggregate({
            where: {
                ...filtroRol,
                deleted_at: null,
                estado: { in: ESTADOS_VENTA },
                fecha_creacion: { gte: desde, lte: hasta },
            },
            _sum: { total_monto: true },
        });
        return Number(r._sum?.total_monto || 0);
    }
    async getPedidosActivos(filtroRol, hasta) {
        const where = {
            ...filtroRol,
            deleted_at: null,
            estado: { in: ESTADOS_ACTIVOS },
        };
        if (hasta) {
            where.fecha_creacion = { lte: hasta };
        }
        return this.prisma.pedido.count({ where });
    }
    async getTiempoPromedioEntrega(desde, hasta, filtroRol) {
        const pedidos = await this.prisma.pedido.findMany({
            where: {
                ...filtroRol,
                deleted_at: null,
                estado: { in: ESTADOS_VENTA },
                fecha_entrega_real: { gte: desde, lte: hasta, not: null },
            },
            select: { fecha_creacion: true, fecha_entrega_real: true },
        });
        if (pedidos.length === 0)
            return 0;
        const totalMs = pedidos.reduce((acc, p) => {
            if (!p.fecha_entrega_real)
                return acc;
            return (acc + (p.fecha_entrega_real.getTime() - p.fecha_creacion.getTime()));
        }, 0);
        const promedioHoras = totalMs / pedidos.length / (1000 * 60 * 60);
        return Number(promedioHoras.toFixed(2));
    }
    async getPedidosCount(desde, hasta, filtroRol) {
        return this.prisma.pedido.count({
            where: {
                ...filtroRol,
                deleted_at: null,
                fecha_creacion: { gte: desde, lte: hasta },
            },
        });
    }
    async getPedidosCountPorEstado(desde, hasta, estados, filtroRol) {
        return this.prisma.pedido.count({
            where: {
                ...filtroRol,
                deleted_at: null,
                estado: { in: estados },
                fecha_creacion: { gte: desde, lte: hasta },
            },
        });
    }
    async getUltimosPedidos(filtroRol) {
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
    async getVentasUltimos7Dias(filtroRol) {
        const hace7 = new Date();
        hace7.setHours(0, 0, 0, 0);
        hace7.setDate(hace7.getDate() - 6);
        const pedidos = await this.prisma.pedido.findMany({
            where: {
                ...filtroRol,
                deleted_at: null,
                estado: { in: ESTADOS_VENTA },
                fecha_creacion: { gte: hace7 },
            },
            select: { fecha_creacion: true, total_monto: true },
        });
        const grupos = {};
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
    async getTopProductosHoy(desde, hasta, filtroRol) {
        const wherePedido = {
            ...filtroRol,
            deleted_at: null,
            estado: { in: ESTADOS_VENTA },
            fecha_creacion: { gte: desde, lte: hasta },
        };
        const grupos = await this.prisma.detallePedido.groupBy({
            by: ['producto_id'],
            where: { pedido: wherePedido },
            _sum: { subtotal_solicitado: true },
            orderBy: { _sum: { subtotal_solicitado: 'desc' } },
            take: 3,
        });
        if (grupos.length === 0)
            return [];
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
    async getLotesPorVencer() {
        const ahora = new Date();
        const en7Dias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);
        const lotes = await this.prisma.lote.findMany({
            where: {
                estado: 'Disponible',
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
            dias_restantes: Math.ceil((l.fecha_vencimiento.getTime() - ahora.getTime()) /
                (1000 * 60 * 60 * 24)),
        }));
    }
    async getProductosSinStock() {
        const productos = await this.prisma.producto.findMany({
            where: { activo: true },
            include: {
                lotes: {
                    where: { estado: 'Disponible' },
                    select: { cantidad_unidades_disponible: true },
                },
            },
        });
        return productos.filter((p) => {
            const stock = p.lotes.reduce((acc, l) => acc + l.cantidad_unidades_disponible, 0);
            return stock === 0;
        }).length;
    }
    async getRepartidoresActivos() {
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
                estado: 'En_Ruta',
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
    formatDateKey(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map