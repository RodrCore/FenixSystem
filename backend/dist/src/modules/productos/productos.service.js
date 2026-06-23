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
var ProductosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
const toInt = (v, fallback) => {
    const n = parseInt(String(v ?? fallback), 10);
    return isNaN(n) ? fallback : n;
};
const toBool = (v) => {
    if (v === undefined || v === null || v === '')
        return undefined;
    return String(v) === 'true';
};
let ProductosService = ProductosService_1 = class ProductosService {
    prisma;
    logger = new common_1.Logger(ProductosService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        try {
            const page = toInt(query.page, 1);
            const limit = toInt(query.limit, 20);
            const skip = (page - 1) * limit;
            const where = {};
            const buscar = String(query.buscar ?? '').trim();
            if (buscar) {
                where.OR = [
                    { nombre: { contains: buscar, mode: 'insensitive' } },
                    { marca: { contains: buscar, mode: 'insensitive' } },
                    { codigo_interno: { contains: buscar, mode: 'insensitive' } },
                ];
            }
            if (query.categoria_id !== undefined &&
                query.categoria_id !== '' &&
                query.categoria_id !== null) {
                const catId = toInt(query.categoria_id, 0);
                if (catId > 0) {
                    where.categoria_id = catId;
                }
            }
            if (query.activo === true || query.activo === false) {
                where.activo = query.activo;
            }
            else if (query.activo === 'true') {
                where.activo = true;
            }
            else if (query.activo === 'false') {
                where.activo = false;
            }
            const marca = String(query.marca ?? '').trim();
            if (marca) {
                where.marca = { contains: marca, mode: 'insensitive' };
            }
            if (toBool(query.solo_bajo_stock)) {
                where._filtroStockBajo = true;
            }
            const validFields = [
                'nombre',
                'marca',
                'precio_compra_promedio',
                'created_at',
            ];
            const orderField = validFields.includes(String(query.orderBy ?? ''))
                ? String(query.orderBy)
                : 'nombre';
            const orderDir = String(query.order ?? '') === 'desc' ? 'desc' : 'asc';
            this.logger.debug(`findAll where: ${JSON.stringify(where)} | page:${page} limit:${limit}`);
            let [total, productos] = await Promise.all([
                this.prisma.producto.count({
                    where: { ...where, _filtroStockBajo: undefined },
                }),
                this.prisma.producto.findMany({
                    where: { ...where, _filtroStockBajo: undefined },
                    skip,
                    take: limit,
                    orderBy: { [orderField]: orderDir },
                    include: {
                        categoria: { select: { id: true, nombre: true } },
                        presentaciones: {
                            include: {
                                presentacion: {
                                    select: { id: true, nombre: true, siglas: true },
                                },
                            },
                            where: { activo: true },
                        },
                        lotes: {
                            where: { estado: 'Disponible' },
                            select: { cantidad_unidades_disponible: true },
                        },
                    },
                }),
            ]);
            let listaFinal = productos.map((p) => ({
                ...p,
                stock_total: p.lotes.reduce((sum, l) => sum + l.cantidad_unidades_disponible, 0),
            }));
            if (toBool(query.solo_bajo_stock)) {
                listaFinal = listaFinal.filter((p) => p.stock_total <= p.stock_minimo);
                total = listaFinal.length;
            }
            return {
                data: listaFinal,
                total,
                page,
                limit,
                pages: Math.ceil(total / limit) || 1,
            };
        }
        catch (error) {
            if (error instanceof Error)
                this.logger.error(`findAll: ${error.message}`);
            throw error;
        }
    }
    async findOne(id) {
        try {
            const producto = await this.prisma.producto.findUnique({
                where: { id },
                include: {
                    categoria: true,
                    presentaciones: {
                        include: { presentacion: true },
                        orderBy: { presentacion: { nombre: 'asc' } },
                    },
                    lotes: {
                        include: {
                            proveedor: { select: { id: true, razon_social: true } },
                            presentacion: { select: { id: true, nombre: true } },
                        },
                        orderBy: { fecha_vencimiento: 'asc' },
                    },
                },
            });
            if (!producto)
                throw new common_1.NotFoundException(`Producto ${id} no encontrado`);
            return producto;
        }
        catch (error) {
            if (error instanceof Error)
                this.logger.error(`findOne: ${error.message}`);
            throw error;
        }
    }
    async create(dto, usuarioId) {
        try {
            if (dto.codigo_interno) {
                const exists = await this.prisma.producto.findUnique({
                    where: { codigo_interno: dto.codigo_interno },
                });
                if (exists)
                    throw new common_1.ConflictException('El código interno ya existe');
            }
            const producto = await this.prisma.producto.create({
                data: {
                    nombre: String(dto.nombre),
                    descripcion_corta: dto.descripcion_corta || undefined,
                    categoria_id: dto.categoria_id
                        ? toInt(dto.categoria_id, 0) || undefined
                        : undefined,
                    marca: dto.marca || undefined,
                    codigo_interno: dto.codigo_interno || undefined,
                    precio_compra_promedio: dto.precio_compra_promedio
                        ? new library_1.Decimal(dto.precio_compra_promedio)
                        : undefined,
                    margen_ganancia_porcentaje: dto.margen_ganancia_porcentaje
                        ? new library_1.Decimal(dto.margen_ganancia_porcentaje)
                        : new library_1.Decimal('28'),
                    stock_minimo: dto.stock_minimo ? toInt(dto.stock_minimo, 10) : 10,
                    stock_maximo: dto.stock_maximo ? toInt(dto.stock_maximo, 500) : 500,
                    dias_para_alerta_vencimiento: dto.dias_para_alerta_vencimiento
                        ? toInt(dto.dias_para_alerta_vencimiento, 30)
                        : 30,
                    activo: true,
                },
                include: { categoria: { select: { id: true, nombre: true } } },
            });
            await this.registrarAuditoria({
                tabla: 'productos',
                registro_id: producto.id,
                accion: 'CREAR',
                descripcion: `Producto creado: ${producto.nombre}`,
                usuario_id: usuarioId,
                datos_nuevos: { nombre: producto.nombre, activo: producto.activo },
            });
            this.logger.log(`Producto creado: ${producto.nombre} (${producto.id})`);
            return producto;
        }
        catch (error) {
            if (error instanceof Error)
                this.logger.error(`create: ${error.message}`);
            throw error;
        }
    }
    async update(id, dto, usuarioId) {
        try {
            const anterior = await this.findOne(id);
            const producto = await this.prisma.producto.update({
                where: { id },
                data: {
                    nombre: dto.nombre ? String(dto.nombre) : undefined,
                    descripcion_corta: dto.descripcion_corta !== undefined
                        ? dto.descripcion_corta
                        : undefined,
                    categoria_id: dto.categoria_id
                        ? toInt(dto.categoria_id, 0) || undefined
                        : undefined,
                    marca: dto.marca !== undefined ? dto.marca : undefined,
                    precio_compra_promedio: dto.precio_compra_promedio
                        ? new library_1.Decimal(dto.precio_compra_promedio)
                        : undefined,
                    margen_ganancia_porcentaje: dto.margen_ganancia_porcentaje
                        ? new library_1.Decimal(dto.margen_ganancia_porcentaje)
                        : undefined,
                    stock_minimo: dto.stock_minimo !== undefined
                        ? toInt(dto.stock_minimo, 10)
                        : undefined,
                    stock_maximo: dto.stock_maximo !== undefined
                        ? toInt(dto.stock_maximo, 500)
                        : undefined,
                    dias_para_alerta_vencimiento: dto.dias_para_alerta_vencimiento !== undefined
                        ? toInt(dto.dias_para_alerta_vencimiento, 30)
                        : undefined,
                },
                include: { categoria: { select: { id: true, nombre: true } } },
            });
            await this.registrarAuditoria({
                tabla: 'productos',
                registro_id: id,
                accion: 'EDITAR',
                descripcion: `Producto editado: ${producto.nombre}`,
                usuario_id: usuarioId,
                datos_anteriores: { nombre: anterior.nombre, marca: anterior.marca },
                datos_nuevos: { nombre: producto.nombre, marca: producto.marca },
            });
            this.logger.log(`Producto actualizado: ${id}`);
            return producto;
        }
        catch (error) {
            if (error instanceof Error)
                this.logger.error(`update: ${error.message}`);
            throw error;
        }
    }
    async toggleActive(id, activo, usuarioId) {
        try {
            const anterior = await this.findOne(id);
            const producto = await this.prisma.producto.update({
                where: { id },
                data: { activo: Boolean(activo) },
            });
            await this.registrarAuditoria({
                tabla: 'productos',
                registro_id: id,
                accion: activo ? 'ACTIVAR' : 'DESACTIVAR',
                descripcion: `Producto ${activo ? 'activado' : 'desactivado'}: ${anterior.nombre}`,
                usuario_id: usuarioId,
                datos_anteriores: { activo: anterior.activo },
                datos_nuevos: { activo: producto.activo },
            });
            this.logger.log(`Producto ${id} → activo: ${activo}`);
            return { id: producto.id, activo: producto.activo };
        }
        catch (error) {
            if (error instanceof Error)
                this.logger.error(`toggleActive: ${error.message}`);
            throw error;
        }
    }
    async addPresentacion(productoId, dto, usuarioId) {
        try {
            await this.findOne(productoId);
            const pp = await this.prisma.productoPresentacion.create({
                data: {
                    producto_id: productoId,
                    presentacion_id: toInt(dto.presentacion_id, 0),
                    unidades_equivalentes: new library_1.Decimal(dto.unidades_equivalentes),
                    precio_venta: new library_1.Decimal(dto.precio_venta),
                    precio_mayoreo: dto.precio_mayoreo
                        ? new library_1.Decimal(dto.precio_mayoreo)
                        : undefined,
                    cantidad_minima_mayoreo: dto.cantidad_minima_mayoreo
                        ? toInt(dto.cantidad_minima_mayoreo, 1)
                        : 1,
                    activo: true,
                },
                include: { presentacion: true },
            });
            await this.registrarAuditoria({
                tabla: 'productos_presentaciones',
                registro_id: pp.id,
                accion: 'CREAR',
                descripcion: `Presentación agregada al producto ${productoId}`,
                usuario_id: usuarioId,
                datos_nuevos: {
                    presentacion_id: pp.presentacion_id,
                    precio_venta: dto.precio_venta,
                },
            });
            return pp;
        }
        catch (error) {
            if (error instanceof Error)
                this.logger.error(`addPresentacion: ${error.message}`);
            throw error;
        }
    }
    async updatePresentacion(ppId, dto) {
        try {
            return await this.prisma.productoPresentacion.update({
                where: { id: ppId },
                data: {
                    precio_venta: dto.precio_venta
                        ? new library_1.Decimal(dto.precio_venta)
                        : undefined,
                    precio_mayoreo: dto.precio_mayoreo
                        ? new library_1.Decimal(dto.precio_mayoreo)
                        : undefined,
                    cantidad_minima_mayoreo: dto.cantidad_minima_mayoreo
                        ? toInt(dto.cantidad_minima_mayoreo, 1)
                        : undefined,
                    activo: dto.activo !== undefined ? Boolean(dto.activo) : undefined,
                },
                include: { presentacion: true },
            });
        }
        catch (error) {
            if (error instanceof Error)
                this.logger.error(`updatePresentacion: ${error.message}`);
            throw error;
        }
    }
    async addLote(dto, usuarioId) {
        try {
            await this.findOne(toInt(dto.producto_id, 0));
            const cantRecibida = toInt(dto.cantidad_recibida_presentacion, 0);
            const unidadesPorPP = toInt(dto.unidades_por_presentacion, 1);
            const unidadesTotal = cantRecibida * unidadesPorPP;
            const costoUnitario = dto.costo_unitario
                ? new library_1.Decimal(dto.costo_unitario)
                : undefined;
            const costoTotal = costoUnitario
                ? costoUnitario.times(unidadesTotal)
                : undefined;
            const lote = await this.prisma.lote.create({
                data: {
                    producto_id: toInt(dto.producto_id, 0),
                    proveedor_id: dto.proveedor_id
                        ? toInt(dto.proveedor_id, 0)
                        : undefined,
                    codigo_lote: String(dto.codigo_lote),
                    fecha_vencimiento: new Date(dto.fecha_vencimiento),
                    presentacion_recibida_id: toInt(dto.presentacion_recibida_id, 0),
                    cantidad_recibida_presentacion: cantRecibida,
                    cantidad_unidades_inicial: unidadesTotal,
                    cantidad_unidades_disponible: unidadesTotal,
                    unidades_por_presentacion: unidadesPorPP,
                    costo_unitario: costoUnitario,
                    costo_total: costoTotal,
                    estado: 'Disponible',
                    ubicacion_almacen: dto.ubicacion_almacen || undefined,
                    notas: dto.notas || undefined,
                },
                include: {
                    proveedor: { select: { id: true, razon_social: true } },
                    presentacion: { select: { id: true, nombre: true } },
                },
            });
            await this.registrarAuditoria({
                tabla: 'lotes',
                registro_id: lote.id,
                accion: 'CREAR',
                descripcion: `Lote ${lote.codigo_lote} registrado para producto ${dto.producto_id}`,
                usuario_id: usuarioId,
                datos_nuevos: {
                    codigo_lote: lote.codigo_lote,
                    cantidad_unidades: unidadesTotal,
                    fecha_vencimiento: dto.fecha_vencimiento,
                },
            });
            this.logger.log(`Lote creado: ${lote.codigo_lote} → producto ${dto.producto_id}`);
            return lote;
        }
        catch (error) {
            if (error instanceof Error)
                this.logger.error(`addLote: ${error.message}`);
            throw error;
        }
    }
    async updateLoteEstado(loteId, estado, usuarioId) {
        try {
            const anterior = await this.prisma.lote.findUnique({
                where: { id: loteId },
            });
            const lote = await this.prisma.lote.update({
                where: { id: loteId },
                data: { estado: estado },
            });
            await this.registrarAuditoria({
                tabla: 'lotes',
                registro_id: loteId,
                accion: 'EDITAR',
                descripcion: `Estado del lote ${lote.codigo_lote} cambiado: ${anterior?.estado} → ${estado}`,
                usuario_id: usuarioId,
                datos_anteriores: { estado: anterior?.estado },
                datos_nuevos: { estado },
            });
            return lote;
        }
        catch (error) {
            if (error instanceof Error)
                this.logger.error(`updateLoteEstado: ${error.message}`);
            throw error;
        }
    }
    async getCategorias() {
        return this.prisma.categoria.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' },
            select: { id: true, nombre: true },
        });
    }
    async getPresentaciones() {
        return this.prisma.presentacion.findMany({
            orderBy: { nombre: 'asc' },
            select: { id: true, nombre: true, siglas: true },
        });
    }
    async getProveedores() {
        return this.prisma.proveedor.findMany({
            where: { activo: true },
            orderBy: { razon_social: 'asc' },
            select: { id: true, razon_social: true, nombre_comercial: true },
        });
    }
    async getStats() {
        const [total, activos, sinStock, porVencer] = await Promise.all([
            this.prisma.producto.count(),
            this.prisma.producto.count({ where: { activo: true } }),
            this.prisma.producto.count({
                where: {
                    activo: true,
                    lotes: { none: { estado: 'Disponible' } },
                },
            }),
            this.prisma.lote.count({
                where: {
                    estado: 'Disponible',
                    fecha_vencimiento: {
                        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);
        return {
            total,
            activos,
            inactivos: total - activos,
            sinStock,
            porVencer,
        };
    }
    async registrarAuditoria(params) {
        try {
            if (!params.usuario_id)
                return;
            await this.prisma.auditoriaLog.create({
                data: {
                    usuario_id: params.usuario_id,
                    accion: params.accion,
                    modulo: 'INVENTARIO',
                    tabla_afectada: params.tabla,
                    registro_id: String(params.registro_id),
                    valor_anterior: params.datos_anteriores
                        ? params.datos_anteriores
                        : undefined,
                    valor_nuevo: params.datos_nuevos
                        ? params.datos_nuevos
                        : undefined,
                    ip_origen: '127.0.0.1',
                },
            });
        }
        catch (e) {
            this.logger.warn(`Auditoría no registrada: ${e}`);
        }
    }
};
exports.ProductosService = ProductosService;
exports.ProductosService = ProductosService = ProductosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductosService);
//# sourceMappingURL=productos.service.js.map