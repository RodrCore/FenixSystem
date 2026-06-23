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
var ReabastecimientoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReabastecimientoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const toInt = (v, fb = 0) => {
    const n = parseInt(String(v ?? fb), 10);
    return isNaN(n) ? fb : n;
};
const toBool = (v) => v === true || v === 'true' || v === 1;
let ReabastecimientoService = ReabastecimientoService_1 = class ReabastecimientoService {
    prisma;
    logger = new common_1.Logger(ReabastecimientoService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generarNumeroOrden() {
        const year = new Date().getFullYear();
        const ultima = await this.prisma.ordenReabastecimiento.findFirst({
            where: { numero_orden: { startsWith: `REAB-${year}-` } },
            orderBy: { id: 'desc' },
            select: { numero_orden: true },
        });
        let siguiente = 1;
        if (ultima?.numero_orden) {
            const match = ultima.numero_orden.match(/REAB-\d{4}-(\d+)/);
            if (match)
                siguiente = parseInt(match[1], 10) + 1;
        }
        return `REAB-${year}-${String(siguiente).padStart(4, '0')}`;
    }
    async getStats() {
        const where = { deleted_at: null };
        const inicioHoy = new Date();
        inicioHoy.setHours(0, 0, 0, 0);
        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);
        const [total, pendientes, recibidasHoy, totalMes] = await Promise.all([
            this.prisma.ordenReabastecimiento.count({ where }),
            this.prisma.ordenReabastecimiento.count({
                where: { ...where, estado: 'Pendiente' },
            }),
            this.prisma.ordenReabastecimiento.count({
                where: {
                    ...where,
                    fecha_recepcion: { gte: inicioHoy },
                },
            }),
            this.prisma.ordenReabastecimiento.aggregate({
                where: {
                    ...where,
                    fecha_solicitud: { gte: inicioMes },
                },
                _sum: { total: true },
            }),
        ]);
        return {
            total,
            pendientes,
            recibidas_hoy: recibidasHoy,
            total_mes: Number(totalMes._sum.total ?? 0),
        };
    }
    async findAll(query = {}) {
        const page = toInt(query.page, 1);
        const limit = toInt(query.limit, 20);
        const skip = (page - 1) * limit;
        const where = {};
        if (!toBool(query.incluir_eliminados)) {
            where.deleted_at = null;
        }
        if (query.estado) {
            where.estado = query.estado;
        }
        if (query.proveedor_id) {
            where.proveedor_id = toInt(query.proveedor_id);
        }
        if (query.buscar?.trim()) {
            const q = query.buscar.trim();
            where.OR = [
                { numero_orden: { contains: q, mode: 'insensitive' } },
                { proveedor: { razon_social: { contains: q, mode: 'insensitive' } } },
                { proveedor: { nombre_comercial: { contains: q, mode: 'insensitive' } } },
            ];
        }
        if (query.desde) {
            where.fecha_solicitud = { ...(where.fecha_solicitud || {}), gte: new Date(query.desde) };
        }
        if (query.hasta) {
            const h = new Date(query.hasta);
            h.setHours(23, 59, 59, 999);
            where.fecha_solicitud = { ...(where.fecha_solicitud || {}), lte: h };
        }
        const [total, data] = await Promise.all([
            this.prisma.ordenReabastecimiento.count({ where }),
            this.prisma.ordenReabastecimiento.findMany({
                where,
                skip,
                take: limit,
                orderBy: { fecha_solicitud: 'desc' },
                include: {
                    proveedor: {
                        select: { id: true, razon_social: true, nombre_comercial: true },
                    },
                    solicitante: {
                        select: { id: true, nombres: true, apellido_paterno: true },
                    },
                    _count: { select: { detalles: true } },
                },
            }),
        ]);
        return {
            data: data.map((o) => ({
                ...o,
                subtotal: Number(o.subtotal),
                total: Number(o.total),
                cantidad_items: o._count.detalles,
            })),
            total,
            page,
            pages: Math.ceil(total / limit),
            limit,
        };
    }
    async findOne(id) {
        const orden = await this.prisma.ordenReabastecimiento.findUnique({
            where: { id },
            include: {
                proveedor: true,
                solicitante: {
                    select: { id: true, nombres: true, apellido_paterno: true, apellido_materno: true, email: true },
                },
                receptor: {
                    select: { id: true, nombres: true, apellido_paterno: true, apellido_materno: true },
                },
                eliminador: {
                    select: { id: true, nombres: true, apellido_paterno: true },
                },
                detalles: {
                    include: {
                        producto_presentacion: {
                            include: {
                                producto: {
                                    select: { id: true, nombre: true, codigo_interno: true, stock_minimo: true },
                                },
                                presentacion: {
                                    select: { id: true, nombre: true, siglas: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!orden) {
            throw new common_1.NotFoundException(`Orden de reabastecimiento ${id} no encontrada`);
        }
        return {
            ...orden,
            subtotal: Number(orden.subtotal),
            total: Number(orden.total),
            detalles: orden.detalles.map((d) => ({
                ...d,
                precio_unitario_compra: Number(d.precio_unitario_compra),
                subtotal: Number(d.subtotal),
            })),
        };
    }
    async create(dto, usuarioId, rolActual) {
        if (!['SUPER_ADMIN', 'ADMIN', 'ALMACEN'].includes(rolActual)) {
            throw new common_1.ForbiddenException('No tienes permisos para crear órdenes de reabastecimiento');
        }
        if (!dto.proveedor_id) {
            throw new common_1.BadRequestException('El proveedor es obligatorio');
        }
        if (!Array.isArray(dto.detalles) || dto.detalles.length === 0) {
            throw new common_1.BadRequestException('Debe agregar al menos un producto');
        }
        const proveedor = await this.prisma.proveedor.findUnique({
            where: { id: toInt(dto.proveedor_id) },
        });
        if (!proveedor) {
            throw new common_1.BadRequestException(`Proveedor ${dto.proveedor_id} no encontrado`);
        }
        let subtotal = 0;
        const detallesData = [];
        for (const det of dto.detalles) {
            const ppId = toInt(det.producto_presentacion_id);
            const cantidad = toInt(det.cantidad_solicitada);
            const precio = Number(det.precio_unitario_compra);
            if (!ppId || cantidad <= 0 || isNaN(precio) || precio < 0) {
                throw new common_1.BadRequestException('Cada detalle debe tener producto_presentacion_id, cantidad_solicitada > 0 y precio_unitario_compra válido');
            }
            const pp = await this.prisma.productoPresentacion.findUnique({
                where: { id: ppId },
                include: { producto: true, presentacion: true },
            });
            if (!pp) {
                throw new common_1.BadRequestException(`Presentación de producto ${ppId} no encontrada`);
            }
            const subDet = cantidad * precio;
            subtotal += subDet;
            detallesData.push({
                producto_presentacion_id: ppId,
                cantidad_solicitada: cantidad,
                cantidad_recibida: 0,
                precio_unitario_compra: precio,
                subtotal: subDet,
            });
        }
        const total = subtotal;
        const numeroOrden = await this.generarNumeroOrden();
        const orden = await this.prisma.ordenReabastecimiento.create({
            data: {
                numero_orden: numeroOrden,
                proveedor_id: toInt(dto.proveedor_id),
                estado: 'Pendiente',
                fecha_esperada: dto.fecha_esperada ? new Date(dto.fecha_esperada) : null,
                notas: dto.notas?.trim() || null,
                subtotal,
                total,
                solicitado_por_id: usuarioId,
                detalles: { create: detallesData },
            },
            include: {
                proveedor: { select: { id: true, razon_social: true } },
                detalles: { include: { producto_presentacion: { include: { producto: true, presentacion: true } } } },
            },
        });
        this.logger.log(`Orden ${orden.numero_orden} creada por usuario ${usuarioId}`);
        return orden;
    }
    async recibir(id, detallesRecibidos, usuarioId, rolActual) {
        if (!['SUPER_ADMIN', 'ADMIN', 'ALMACEN'].includes(rolActual)) {
            throw new common_1.ForbiddenException('No tienes permisos para recibir órdenes');
        }
        const orden = await this.prisma.ordenReabastecimiento.findUnique({
            where: { id },
            include: {
                detalles: {
                    include: {
                        producto_presentacion: { include: { producto: true, presentacion: true } },
                    },
                },
            },
        });
        if (!orden)
            throw new common_1.NotFoundException(`Orden ${id} no encontrada`);
        if (orden.deleted_at)
            throw new common_1.BadRequestException('Orden eliminada');
        if (orden.estado !== 'Pendiente') {
            throw new common_1.BadRequestException('Solo se pueden recibir órdenes pendientes');
        }
        if (!Array.isArray(detallesRecibidos) || detallesRecibidos.length === 0) {
            throw new common_1.BadRequestException('Debes enviar las cantidades recibidas');
        }
        const mapaRecibidos = new Map();
        for (const d of detallesRecibidos) {
            mapaRecibidos.set(toInt(d.detalle_id), toInt(d.cantidad_recibida));
        }
        return this.prisma.$transaction(async (tx) => {
            let totalEsperado = 0;
            let totalRecibido = 0;
            for (const detalle of orden.detalles) {
                const cantRecibida = mapaRecibidos.get(detalle.id) ?? 0;
                if (cantRecibida < 0 || cantRecibida > detalle.cantidad_solicitada) {
                    throw new common_1.BadRequestException(`Cantidad recibida inválida para ${detalle.producto_presentacion.producto.nombre} (solicitado: ${detalle.cantidad_solicitada}, recibido: ${cantRecibida})`);
                }
                totalEsperado += detalle.cantidad_solicitada;
                totalRecibido += cantRecibida;
                await tx.detalleReabastecimiento.update({
                    where: { id: detalle.id },
                    data: { cantidad_recibida: cantRecibida },
                });
                if (cantRecibida === 0)
                    continue;
                const pp = detalle.producto_presentacion;
                const unidadesPorPresentacion = Number(pp.unidades_equivalentes);
                const cantidadUnidades = cantRecibida * unidadesPorPresentacion;
                const codigoLote = `REAB-${orden.numero_orden}-${pp.producto.id}-${detalle.id}`;
                const fechaVenc = new Date();
                fechaVenc.setMonth(fechaVenc.getMonth() + 6);
                const nuevoLote = await tx.lote.create({
                    data: {
                        producto_id: pp.producto.id,
                        proveedor_id: orden.proveedor_id,
                        codigo_lote: codigoLote,
                        fecha_ingreso: new Date(),
                        fecha_vencimiento: fechaVenc,
                        presentacion_recibida_id: pp.presentacion.id,
                        cantidad_recibida_presentacion: cantRecibida,
                        cantidad_unidades_inicial: cantidadUnidades,
                        cantidad_unidades_disponible: cantidadUnidades,
                        unidades_por_presentacion: unidadesPorPresentacion,
                        costo_unitario: Number(detalle.precio_unitario_compra) / unidadesPorPresentacion,
                        costo_total: Number(detalle.subtotal),
                        estado: 'Disponible',
                        notas: `Lote creado desde orden ${orden.numero_orden}`,
                    },
                });
                await tx.movimientoInventario.create({
                    data: {
                        lote_id: nuevoLote.id,
                        usuario_id: usuarioId,
                        tipo: 'entrada_inicial',
                        cantidad_unidades: cantidadUnidades,
                        stock_anterior: 0,
                        stock_resultante: cantidadUnidades,
                        motivo: `Recepción de orden ${orden.numero_orden}`,
                        costo_unitario: Number(detalle.precio_unitario_compra) / unidadesPorPresentacion,
                        costo_total: Number(detalle.subtotal),
                    },
                });
            }
            let nuevoEstado;
            if (totalRecibido === totalEsperado) {
                nuevoEstado = 'Recibido_Total';
            }
            else {
                nuevoEstado = 'Recibido_Parcial';
            }
            const actualizada = await tx.ordenReabastecimiento.update({
                where: { id },
                data: {
                    estado: nuevoEstado,
                    fecha_recepcion: new Date(),
                    recibido_por_id: usuarioId,
                },
                include: {
                    proveedor: true,
                    solicitante: { select: { nombres: true, apellido_paterno: true } },
                    receptor: { select: { nombres: true, apellido_paterno: true } },
                    detalles: {
                        include: {
                            producto_presentacion: {
                                include: { producto: true, presentacion: true },
                            },
                        },
                    },
                },
            });
            this.logger.log(`Orden ${actualizada.numero_orden} recibida por usuario ${usuarioId} (${nuevoEstado})`);
            return actualizada;
        });
    }
    async cancelar(id, motivo, usuarioId, rolActual) {
        if (!['SUPER_ADMIN', 'ADMIN'].includes(rolActual)) {
            throw new common_1.ForbiddenException('Solo ADMIN y SUPER_ADMIN pueden cancelar órdenes');
        }
        if (!motivo || motivo.trim().length < 3) {
            throw new common_1.BadRequestException('Motivo obligatorio');
        }
        const orden = await this.prisma.ordenReabastecimiento.findUnique({ where: { id } });
        if (!orden)
            throw new common_1.NotFoundException(`Orden ${id} no encontrada`);
        if (orden.estado !== 'Pendiente') {
            throw new common_1.BadRequestException('Solo se pueden cancelar órdenes Pendientes');
        }
        return this.prisma.ordenReabastecimiento.update({
            where: { id },
            data: {
                estado: 'Cancelado',
                notas: `${orden.notas ?? ''}\n[CANCELADO] ${motivo.trim()}`.trim(),
            },
        });
    }
    async softDelete(id, motivo, usuarioId, rolActual) {
        if (!['SUPER_ADMIN', 'ADMIN'].includes(rolActual)) {
            throw new common_1.ForbiddenException('No tienes permisos');
        }
        if (!motivo || motivo.trim().length < 3) {
            throw new common_1.BadRequestException('Motivo obligatorio');
        }
        const orden = await this.prisma.ordenReabastecimiento.findUnique({ where: { id } });
        if (!orden)
            throw new common_1.NotFoundException(`Orden ${id} no encontrada`);
        if (orden.deleted_at)
            throw new common_1.BadRequestException('Ya está eliminada');
        return this.prisma.ordenReabastecimiento.update({
            where: { id },
            data: {
                deleted_at: new Date(),
                deleted_by: usuarioId,
                motivo_eliminacion: motivo.trim(),
            },
        });
    }
    async getSugerenciasBajoStock() {
        const productos = await this.prisma.producto.findMany({
            where: { activo: true },
            include: {
                lotes: {
                    where: { estado: 'Disponible' },
                    select: { cantidad_unidades_disponible: true },
                },
                presentaciones: {
                    where: { activo: true },
                    include: {
                        presentacion: { select: { id: true, nombre: true, siglas: true } },
                    },
                },
            },
        });
        const sugerencias = productos
            .map((p) => {
            const stockActual = p.lotes.reduce((sum, l) => sum + l.cantidad_unidades_disponible, 0);
            return {
                id: p.id,
                nombre: p.nombre,
                codigo_interno: p.codigo_interno,
                stock_actual: stockActual,
                stock_minimo: p.stock_minimo,
                stock_maximo: p.stock_maximo,
                cantidad_sugerida: Math.max(p.stock_maximo - stockActual, 0),
                presentaciones: p.presentaciones,
            };
        })
            .filter((p) => p.stock_actual <= p.stock_minimo);
        return sugerencias;
    }
};
exports.ReabastecimientoService = ReabastecimientoService;
exports.ReabastecimientoService = ReabastecimientoService = ReabastecimientoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReabastecimientoService);
//# sourceMappingURL=reabastecimiento.service.js.map