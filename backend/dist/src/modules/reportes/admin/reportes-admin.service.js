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
var ReportesAdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportesAdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const reporte_query_dto_1 = require("./dto/reporte-query.dto");
let ReportesAdminService = ReportesAdminService_1 = class ReportesAdminService {
    prisma;
    logger = new common_1.Logger(ReportesAdminService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getVentas(query) {
        const { desde, hasta, desdePeriodoAnterior, hastaPeriodoAnterior } = (0, reporte_query_dto_1.calcularRango)(query);
        const estadosVenta = ['Entregado_Total', 'Entregado_Parcial'];
        const ventasActual = await this.prisma.pedido.aggregate({
            where: {
                estado: { in: estadosVenta },
                deleted_at: null,
                fecha_creacion: { gte: desde, lte: hasta },
            },
            _sum: { total_monto: true },
            _count: { id: true },
            _avg: { total_monto: true },
        });
        const ventasAnterior = await this.prisma.pedido.aggregate({
            where: {
                estado: { in: estadosVenta },
                deleted_at: null,
                fecha_creacion: { gte: desdePeriodoAnterior, lte: hastaPeriodoAnterior },
            },
            _sum: { total_monto: true },
            _count: { id: true },
        });
        const totalActual = Number(ventasActual._sum?.total_monto || 0);
        const totalAnterior = Number(ventasAnterior._sum?.total_monto || 0);
        const cantActual = ventasActual._count?.id || 0;
        const cantAnterior = ventasAnterior._count?.id || 0;
        const ticketProm = Number(ventasActual._avg?.total_monto || 0);
        const evolucion = await this.evolucionPorDia(desde, hasta, estadosVenta);
        const topProductos = await this.topProductosVendidos(desde, hasta);
        const topClientes = await this.topClientes(desde, hasta);
        const porMetodoPago = await this.prisma.pedido.groupBy({
            by: ['metodo_pago'],
            where: {
                estado: { in: estadosVenta },
                deleted_at: null,
                fecha_creacion: { gte: desde, lte: hasta },
            },
            _sum: { total_monto: true },
            _count: { id: true },
        });
        return {
            periodo: { desde: desde.toISOString(), hasta: hasta.toISOString() },
            kpis: {
                total_ventas: totalActual,
                cantidad_pedidos: cantActual,
                ticket_promedio: ticketProm,
                variacion_total: (0, reporte_query_dto_1.calcularVariacion)(totalActual, totalAnterior),
                variacion_cantidad: (0, reporte_query_dto_1.calcularVariacion)(cantActual, cantAnterior),
                total_anterior: totalAnterior,
                cantidad_anterior: cantAnterior,
            },
            evolucion,
            top_productos: topProductos,
            top_clientes: topClientes,
            por_metodo_pago: porMetodoPago.map(p => ({
                metodo: p.metodo_pago || 'Sin definir',
                total: Number(p._sum?.total_monto || 0),
                cantidad: p._count?.id || 0,
            })),
        };
    }
    async getPedidos(query) {
        const { desde, hasta, desdePeriodoAnterior, hastaPeriodoAnterior } = (0, reporte_query_dto_1.calcularRango)(query);
        const porEstado = await this.prisma.pedido.groupBy({
            by: ['estado'],
            where: {
                deleted_at: null,
                fecha_creacion: { gte: desde, lte: hasta },
            },
            _count: { id: true },
            _sum: { total_monto: true },
        });
        const totalActual = await this.prisma.pedido.count({
            where: { deleted_at: null, fecha_creacion: { gte: desde, lte: hasta } },
        });
        const totalAnterior = await this.prisma.pedido.count({
            where: {
                deleted_at: null,
                fecha_creacion: { gte: desdePeriodoAnterior, lte: hastaPeriodoAnterior },
            },
        });
        const evolucion = await this.evolucionPorDia(desde, hasta);
        const entregados = await this.prisma.pedido.findMany({
            where: {
                estado: { in: ['Entregado_Total', 'Entregado_Parcial'] },
                deleted_at: null,
                fecha_creacion: { gte: desde, lte: hasta },
                fecha_entrega_real: { not: null },
            },
            select: { fecha_creacion: true, fecha_entrega_real: true },
        });
        let promedioDiasEntrega = 0;
        if (entregados.length > 0) {
            const total = entregados.reduce((acc, p) => {
                if (p.fecha_entrega_real) {
                    const ms = p.fecha_entrega_real.getTime() - p.fecha_creacion.getTime();
                    return acc + ms / (1000 * 60 * 60 * 24);
                }
                return acc;
            }, 0);
            promedioDiasEntrega = Number((total / entregados.length).toFixed(1));
        }
        const topPreventistas = await this.prisma.pedido.groupBy({
            by: ['preventista_id'],
            where: {
                deleted_at: null,
                fecha_creacion: { gte: desde, lte: hasta },
            },
            _count: { id: true },
            _sum: { total_monto: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });
        const userIds = topPreventistas
            .map(p => p.preventista_id)
            .filter(Boolean);
        const usuarios = await this.prisma.usuario.findMany({
            where: { id: { in: userIds } },
            select: { id: true, nombres: true, apellido_paterno: true },
        });
        const topPreventistasConNombre = topPreventistas.map(p => {
            const u = usuarios.find(x => x.id === p.preventista_id);
            return {
                usuario_id: p.preventista_id,
                nombre: u ? `${u.nombres} ${u.apellido_paterno}` : 'Sin asignar',
                cantidad_pedidos: p._count?.id || 0,
                total_vendido: Number(p._sum?.total_monto || 0),
            };
        });
        return {
            periodo: { desde: desde.toISOString(), hasta: hasta.toISOString() },
            kpis: {
                total_pedidos: totalActual,
                variacion: (0, reporte_query_dto_1.calcularVariacion)(totalActual, totalAnterior),
                promedio_dias_entrega: promedioDiasEntrega,
                total_anterior: totalAnterior,
            },
            por_estado: porEstado.map(p => ({
                estado: p.estado,
                cantidad: p._count?.id || 0,
                total: Number(p._sum?.total_monto || 0),
            })),
            evolucion,
            top_preventistas: topPreventistasConNombre,
        };
    }
    async getReabastecimientos(query) {
        const { desde, hasta, desdePeriodoAnterior, hastaPeriodoAnterior } = (0, reporte_query_dto_1.calcularRango)(query);
        const totalActual = await this.prisma.ordenReabastecimiento.aggregate({
            where: {
                deleted_at: null,
                fecha_solicitud: { gte: desde, lte: hasta },
            },
            _sum: { total: true },
            _count: { id: true },
        });
        const totalAnterior = await this.prisma.ordenReabastecimiento.aggregate({
            where: {
                deleted_at: null,
                fecha_solicitud: { gte: desdePeriodoAnterior, lte: hastaPeriodoAnterior },
            },
            _sum: { total: true },
            _count: { id: true },
        });
        const porEstado = await this.prisma.ordenReabastecimiento.groupBy({
            by: ['estado'],
            where: {
                deleted_at: null,
                fecha_solicitud: { gte: desde, lte: hasta },
            },
            _count: { id: true },
            _sum: { total: true },
        });
        const porProveedor = await this.prisma.ordenReabastecimiento.groupBy({
            by: ['proveedor_id'],
            where: {
                deleted_at: null,
                fecha_solicitud: { gte: desde, lte: hasta },
            },
            _sum: { total: true },
            _count: { id: true },
            orderBy: { _sum: { total: 'desc' } },
            take: 10,
        });
        const proveedoresIds = porProveedor.map(p => p.proveedor_id);
        const proveedores = await this.prisma.proveedor.findMany({
            where: { id: { in: proveedoresIds } },
            select: { id: true, razon_social: true, nombre_comercial: true },
        });
        const porProveedorConNombre = porProveedor.map(p => {
            const prov = proveedores.find(x => x.id === p.proveedor_id);
            return {
                proveedor_id: p.proveedor_id,
                nombre: prov?.razon_social || 'Desconocido',
                cantidad_ordenes: p._count?.id || 0,
                total_comprado: Number(p._sum?.total || 0),
            };
        });
        const productosComprados = [];
        return {
            periodo: { desde: desde.toISOString(), hasta: hasta.toISOString() },
            kpis: {
                total_comprado: Number(totalActual._sum?.total || 0),
                cantidad_ordenes: totalActual._count?.id || 0,
                variacion: (0, reporte_query_dto_1.calcularVariacion)(Number(totalActual._sum?.total || 0), Number(totalAnterior._sum?.total || 0)),
            },
            por_estado: porEstado.map(p => ({
                estado: p.estado,
                cantidad: p._count?.id || 0,
                total: Number(p._sum?.total || 0),
            })),
            por_proveedor: porProveedorConNombre,
            productos_mas_comprados: productosComprados,
        };
    }
    async getInventario(_query) {
        const totalProductos = await this.prisma.producto.count({
            where: { activo: true },
        });
        const productos = await this.prisma.producto.findMany({
            where: { activo: true },
            include: {
                lotes: {
                    where: { estado: 'Disponible' },
                    select: { cantidad_unidades_disponible: true },
                },
            },
        });
        const productosStockBajo = productos
            .map(p => {
            const stock = p.lotes.reduce((acc, l) => acc + l.cantidad_unidades_disponible, 0);
            return { ...p, stock_total: stock };
        })
            .filter(p => p.stock_total < p.stock_minimo)
            .sort((a, b) => a.stock_total - b.stock_total)
            .slice(0, 20)
            .map(p => ({
            id: p.id,
            nombre: p.nombre,
            codigo: p.codigo_interno,
            stock_actual: p.stock_total,
            stock_minimo: p.stock_minimo,
            deficit: p.stock_minimo - p.stock_total,
        }));
        const sinStock = productos.filter(p => {
            const stock = p.lotes.reduce((acc, l) => acc + l.cantidad_unidades_disponible, 0);
            return stock === 0;
        }).length;
        const ahora = new Date();
        const en30Dias = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);
        const lotesPorVencer = await this.prisma.lote.findMany({
            where: {
                estado: 'Disponible',
                fecha_vencimiento: { gte: ahora, lte: en30Dias },
                cantidad_unidades_disponible: { gt: 0 },
            },
            include: {
                producto: { select: { nombre: true, codigo_interno: true } },
            },
            orderBy: { fecha_vencimiento: 'asc' },
            take: 20,
        });
        const lotesVencidos = await this.prisma.lote.count({
            where: {
                fecha_vencimiento: { lt: ahora },
                cantidad_unidades_disponible: { gt: 0 },
            },
        });
        const lotesValor = await this.prisma.lote.findMany({
            where: { estado: 'Disponible', cantidad_unidades_disponible: { gt: 0 } },
            select: { cantidad_unidades_disponible: true, costo_unitario: true },
        });
        const valorInventario = lotesValor.reduce((acc, l) => acc + l.cantidad_unidades_disponible * Number(l.costo_unitario || 0), 0);
        const porCategoria = await this.prisma.producto.groupBy({
            by: ['categoria_id'],
            where: { activo: true },
            _count: { id: true },
        });
        const categoriasIds = porCategoria
            .map(c => c.categoria_id)
            .filter(Boolean);
        const categorias = await this.prisma.categoria.findMany({
            where: { id: { in: categoriasIds } },
            select: { id: true, nombre: true },
        });
        const porCategoriaConNombre = porCategoria.map(c => {
            const cat = categorias.find(x => x.id === c.categoria_id);
            return {
                categoria: cat?.nombre || 'Sin categoría',
                cantidad_productos: c._count?.id || 0,
            };
        });
        return {
            kpis: {
                total_productos: totalProductos,
                productos_stock_bajo: productosStockBajo.length,
                productos_sin_stock: sinStock,
                lotes_por_vencer: lotesPorVencer.length,
                lotes_vencidos: lotesVencidos,
                valor_inventario: Number(valorInventario.toFixed(2)),
            },
            productos_stock_bajo: productosStockBajo,
            lotes_por_vencer: lotesPorVencer.map(l => ({
                id: l.id,
                codigo_lote: l.codigo_lote,
                producto: l.producto?.nombre || 'Desconocido',
                cantidad: l.cantidad_unidades_disponible,
                fecha_vencimiento: l.fecha_vencimiento,
                dias_restantes: Math.ceil((l.fecha_vencimiento.getTime() - ahora.getTime()) /
                    (1000 * 60 * 60 * 24)),
            })),
            por_categoria: porCategoriaConNombre,
        };
    }
    async getComercial(query) {
        const { desde, hasta } = (0, reporte_query_dto_1.calcularRango)(query);
        const ventasPreventistas = await this.prisma.pedido.groupBy({
            by: ['preventista_id'],
            where: {
                deleted_at: null,
                fecha_creacion: { gte: desde, lte: hasta },
            },
            _count: { id: true },
            _sum: { total_monto: true },
        });
        const preventistasIds = ventasPreventistas
            .map(v => v.preventista_id)
            .filter(Boolean);
        const preventistas = await this.prisma.usuario.findMany({
            where: { id: { in: preventistasIds } },
            include: { rol: { select: { nombre: true } } },
        });
        const preventistasReport = ventasPreventistas
            .map(v => {
            const u = preventistas.find(x => x.id === v.preventista_id);
            const cantidad = v._count?.id || 0;
            const total = Number(v._sum?.total_monto || 0);
            return {
                usuario_id: v.preventista_id,
                nombre: u
                    ? `${u.nombres} ${u.apellido_paterno} ${u.apellido_materno || ''}`.trim()
                    : 'Sin asignar',
                rol: u?.rol?.nombre || '-',
                cantidad_pedidos: cantidad,
                total_vendido: total,
                ticket_promedio: cantidad > 0 ? Number((total / cantidad).toFixed(2)) : 0,
            };
        })
            .sort((a, b) => b.total_vendido - a.total_vendido);
        const entregasRepartidores = await this.prisma.pedido.groupBy({
            by: ['repartidor_id'],
            where: {
                deleted_at: null,
                fecha_creacion: { gte: desde, lte: hasta },
                estado: { in: ['Entregado_Total', 'Entregado_Parcial'] },
            },
            _count: { id: true },
            _sum: { total_monto: true },
        });
        const repartidoresIds = entregasRepartidores
            .map(v => v.repartidor_id)
            .filter(Boolean);
        const repartidores = await this.prisma.usuario.findMany({
            where: { id: { in: repartidoresIds } },
            select: { id: true, nombres: true, apellido_paterno: true, apellido_materno: true },
        });
        const repartidoresReport = entregasRepartidores
            .map(v => {
            const u = repartidores.find(x => x.id === v.repartidor_id);
            return {
                usuario_id: v.repartidor_id,
                nombre: u
                    ? `${u.nombres} ${u.apellido_paterno} ${u.apellido_materno || ''}`.trim()
                    : 'Sin asignar',
                entregas: v._count?.id || 0,
                monto_entregado: Number(v._sum?.total_monto || 0),
            };
        })
            .sort((a, b) => b.entregas - a.entregas);
        return {
            periodo: { desde: desde.toISOString(), hasta: hasta.toISOString() },
            preventistas: preventistasReport,
            repartidores: repartidoresReport,
            kpis: {
                total_preventistas_activos: preventistasReport.length,
                total_repartidores_activos: repartidoresReport.length,
                mejor_vendedor: preventistasReport[0] || null,
                mejor_repartidor: repartidoresReport[0] || null,
            },
        };
    }
    async getClientes(query) {
        const { desde, hasta } = (0, reporte_query_dto_1.calcularRango)(query);
        const ventasPorCliente = await this.prisma.pedido.groupBy({
            by: ['cliente_id'],
            where: {
                deleted_at: null,
                estado: { in: ['Entregado_Total', 'Entregado_Parcial'] },
                fecha_creacion: { gte: desde, lte: hasta },
            },
            _sum: { total_monto: true },
            _count: { id: true },
            orderBy: { _sum: { total_monto: 'desc' } },
            take: 20,
        });
        const clientesIds = ventasPorCliente.map(v => v.cliente_id);
        const clientes = await this.prisma.cliente.findMany({
            where: { id: { in: clientesIds } },
            select: {
                id: true,
                razon_social: true,
            },
        });
        const topClientes = ventasPorCliente.map(v => {
            const c = clientes.find(x => x.id === v.cliente_id);
            return {
                cliente_id: v.cliente_id,
                nombre: c?.razon_social || 'Desconocido',
                zona: '-',
                compras: v._count?.id || 0,
                total: Number(v._sum?.total_monto || 0),
            };
        });
        const nuevosClientes = await this.prisma.cliente.count({
            where: {
                deleted_at: null,
                created_at: { gte: desde, lte: hasta },
            },
        });
        const hace60dias = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        const totalClientes = await this.prisma.cliente.count({
            where: { deleted_at: null, estado: 'Activo' },
        });
        const clientesConVentas = await this.prisma.pedido.findMany({
            where: {
                deleted_at: null,
                fecha_creacion: { gte: hace60dias },
            },
            select: { cliente_id: true },
            distinct: ['cliente_id'],
        });
        const clientesActivosIds = clientesConVentas.map(c => c.cliente_id);
        const clientesInactivos = await this.prisma.cliente.count({
            where: {
                deleted_at: null,
                estado: 'Activo',
                id: { notIn: clientesActivosIds.length > 0 ? clientesActivosIds : [0] },
            },
        });
        const porZona = [];
        return {
            periodo: { desde: desde.toISOString(), hasta: hasta.toISOString() },
            kpis: {
                total_clientes: totalClientes,
                nuevos_en_periodo: nuevosClientes,
                clientes_inactivos: clientesInactivos,
                clientes_activos: clientesActivosIds.length,
            },
            top_clientes: topClientes,
            por_zona: porZona,
        };
    }
    async evolucionPorDia(desde, hasta, estados) {
        const where = {
            deleted_at: null,
            fecha_creacion: { gte: desde, lte: hasta },
        };
        if (estados)
            where.estado = { in: estados };
        const pedidos = await this.prisma.pedido.findMany({
            where,
            select: { fecha_creacion: true, total_monto: true },
        });
        const grupos = {};
        const cursor = new Date(desde);
        cursor.setHours(0, 0, 0, 0);
        const fin = new Date(hasta);
        fin.setHours(0, 0, 0, 0);
        while (cursor <= fin) {
            grupos[(0, reporte_query_dto_1.formatDate)(cursor)] = { cantidad: 0, total: 0 };
            cursor.setDate(cursor.getDate() + 1);
        }
        for (const p of pedidos) {
            const k = (0, reporte_query_dto_1.formatDate)(p.fecha_creacion);
            if (!grupos[k])
                grupos[k] = { cantidad: 0, total: 0 };
            grupos[k].cantidad++;
            grupos[k].total += Number(p.total_monto || 0);
        }
        return Object.entries(grupos).map(([fecha, v]) => ({
            fecha,
            cantidad: v.cantidad,
            total: Number(v.total.toFixed(2)),
        }));
    }
    async topProductosVendidos(_desde, _hasta) {
        return [];
    }
    async topClientes(desde, hasta) {
        const grupos = await this.prisma.pedido.groupBy({
            by: ['cliente_id'],
            where: {
                deleted_at: null,
                estado: { in: ['Entregado_Total', 'Entregado_Parcial'] },
                fecha_creacion: { gte: desde, lte: hasta },
            },
            _sum: { total_monto: true },
            _count: { id: true },
            orderBy: { _sum: { total_monto: 'desc' } },
            take: 10,
        });
        const ids = grupos.map(g => g.cliente_id);
        const clientes = await this.prisma.cliente.findMany({
            where: { id: { in: ids } },
            select: { id: true, razon_social: true },
        });
        return grupos.map(g => {
            const c = clientes.find(x => x.id === g.cliente_id);
            return {
                cliente_id: g.cliente_id,
                nombre: c?.razon_social || 'Desconocido',
                compras: g._count?.id || 0,
                total: Number(g._sum?.total_monto || 0),
            };
        });
    }
};
exports.ReportesAdminService = ReportesAdminService;
exports.ReportesAdminService = ReportesAdminService = ReportesAdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportesAdminService);
//# sourceMappingURL=reportes-admin.service.js.map