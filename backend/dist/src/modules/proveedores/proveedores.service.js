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
var ProveedoresService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProveedoresService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const toInt = (v, fb = 0) => {
    const n = parseInt(String(v ?? fb), 10);
    return isNaN(n) ? fb : n;
};
const toBool = (v) => v === true || v === 'true' || v === 1;
const toDec = (v) => {
    if (v === null || v === undefined || v === '')
        return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
};
let ProveedoresService = ProveedoresService_1 = class ProveedoresService {
    prisma;
    logger = new common_1.Logger(ProveedoresService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query = {}) {
        const page = toInt(query.page, 1);
        const limit = toInt(query.limit, 20);
        const skip = (page - 1) * limit;
        const where = {};
        if (toBool(query.eliminados)) {
            where.deleted_at = { not: null };
        }
        else {
            where.deleted_at = null;
        }
        if (query.activo !== undefined && query.activo !== '') {
            where.activo = toBool(query.activo);
        }
        if (query.buscar?.trim()) {
            const q = query.buscar.trim();
            where.OR = [
                { razon_social: { contains: q, mode: 'insensitive' } },
                { nombre_comercial: { contains: q, mode: 'insensitive' } },
                { nit_rfc: { contains: q, mode: 'insensitive' } },
                { contacto_nombres: { contains: q, mode: 'insensitive' } },
                { contacto_email: { contains: q, mode: 'insensitive' } },
                { contacto_telefono: { contains: q } },
            ];
        }
        const [total, data] = await Promise.all([
            this.prisma.proveedor.count({ where }),
            this.prisma.proveedor.findMany({
                where,
                skip,
                take: limit,
                orderBy: { razon_social: 'asc' },
            }),
        ]);
        return {
            data: data.map((p) => this.mapToResponse(p)),
            total,
            page,
            pages: Math.ceil(total / limit),
            limit,
        };
    }
    async findById(id) {
        const proveedor = await this.prisma.proveedor.findUnique({
            where: { id },
            include: {
                eliminador: {
                    select: { id: true, nombres: true, apellido_paterno: true },
                },
            },
        });
        if (!proveedor) {
            throw new common_1.NotFoundException(`Proveedor ${id} no encontrado`);
        }
        const ordenes = await this.prisma.ordenReabastecimiento.findMany({
            where: { proveedor_id: id, deleted_at: null },
            orderBy: { fecha_solicitud: 'desc' },
            take: 10,
            include: {
                _count: { select: { detalles: true } },
            },
        });
        const lotes = await this.prisma.lote.findMany({
            where: { proveedor_id: id },
            orderBy: { fecha_ingreso: 'desc' },
            take: 10,
            include: {
                producto: { select: { id: true, nombre: true, codigo_interno: true } },
            },
        });
        const totalOrdenes = await this.prisma.ordenReabastecimiento.count({
            where: { proveedor_id: id, deleted_at: null },
        });
        const totalLotes = await this.prisma.lote.count({
            where: { proveedor_id: id },
        });
        return {
            ...this.mapToResponseDetailed(proveedor),
            ordenes_recientes: ordenes,
            lotes_recientes: lotes,
            total_ordenes: totalOrdenes,
            total_lotes: totalLotes,
        };
    }
    async create(dto) {
        if (dto.nit_rfc?.trim()) {
            const existe = await this.prisma.proveedor.findFirst({
                where: { nit_rfc: dto.nit_rfc.trim() },
            });
            if (existe) {
                throw new common_1.ConflictException('El NIT/RFC ya está registrado');
            }
        }
        const data = this.buildData(dto);
        const proveedor = await this.prisma.proveedor.create({ data });
        this.logger.log(`Proveedor creado: ${proveedor.razon_social}`);
        return this.mapToResponse(proveedor);
    }
    async update(id, dto) {
        const proveedor = await this.prisma.proveedor.findUnique({ where: { id } });
        if (!proveedor) {
            throw new common_1.NotFoundException(`Proveedor ${id} no encontrado`);
        }
        if (proveedor.deleted_at) {
            throw new common_1.BadRequestException('No se puede editar un proveedor eliminado');
        }
        if (dto.nit_rfc?.trim() && dto.nit_rfc.trim() !== proveedor.nit_rfc) {
            const existe = await this.prisma.proveedor.findFirst({
                where: { nit_rfc: dto.nit_rfc.trim(), NOT: { id } },
            });
            if (existe) {
                throw new common_1.ConflictException('El NIT/RFC ya está registrado');
            }
        }
        const data = this.buildData(dto);
        try {
            const updated = await this.prisma.proveedor.update({
                where: { id },
                data,
            });
            this.logger.log(`Proveedor actualizado: ${updated.razon_social}`);
            return this.mapToResponse(updated);
        }
        catch (e) {
            if (e.code === 'P2002') {
                throw new common_1.ConflictException('NIT/RFC ya registrado');
            }
            throw e;
        }
    }
    buildData(dto) {
        const camposString = [
            'razon_social', 'nombre_comercial', 'nit_rfc',
            'contacto_nombres', 'contacto_telefono', 'contacto_email',
            'direccion_completa', 'dias_entrega', 'condiciones_pago', 'notas',
        ];
        const camposNumeric = ['latitud', 'longitud'];
        const camposBool = ['activo'];
        const data = {};
        for (const k of camposString) {
            if (dto[k] !== undefined) {
                const v = typeof dto[k] === 'string' ? dto[k].trim() : dto[k];
                data[k] = v === '' ? null : v;
            }
        }
        for (const k of camposNumeric) {
            if (dto[k] !== undefined) {
                data[k] = toDec(dto[k]);
            }
        }
        for (const k of camposBool) {
            if (dto[k] !== undefined) {
                data[k] = toBool(dto[k]);
            }
        }
        return data;
    }
    async toggleActive(id, activo) {
        const proveedor = await this.prisma.proveedor.findUnique({ where: { id } });
        if (!proveedor)
            throw new common_1.NotFoundException(`Proveedor ${id} no encontrado`);
        if (proveedor.deleted_at) {
            throw new common_1.BadRequestException('No se puede modificar un proveedor eliminado');
        }
        const updated = await this.prisma.proveedor.update({
            where: { id },
            data: { activo },
        });
        return this.mapToResponse(updated);
    }
    async softDelete(id, motivo, usuarioId, rolActual) {
        if (rolActual !== 'SUPER_ADMIN' && rolActual !== 'ADMIN') {
            throw new common_1.ForbiddenException('No tienes permisos para eliminar proveedores');
        }
        if (!motivo || motivo.trim().length < 3) {
            throw new common_1.BadRequestException('El motivo es obligatorio (mínimo 3 caracteres)');
        }
        const proveedor = await this.prisma.proveedor.findUnique({ where: { id } });
        if (!proveedor)
            throw new common_1.NotFoundException(`Proveedor ${id} no encontrado`);
        if (proveedor.deleted_at) {
            throw new common_1.BadRequestException('El proveedor ya está eliminado');
        }
        return this.prisma.proveedor.update({
            where: { id },
            data: {
                deleted_at: new Date(),
                deleted_by: usuarioId,
                motivo_eliminacion: motivo.trim(),
                activo: false,
            },
        });
    }
    async restore(id, rolActual) {
        if (rolActual !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Solo SUPER_ADMIN puede restaurar proveedores');
        }
        const proveedor = await this.prisma.proveedor.findUnique({ where: { id } });
        if (!proveedor)
            throw new common_1.NotFoundException(`Proveedor ${id} no encontrado`);
        if (!proveedor.deleted_at) {
            throw new common_1.BadRequestException('El proveedor no está eliminado');
        }
        return this.prisma.proveedor.update({
            where: { id },
            data: {
                deleted_at: null,
                deleted_by: null,
                motivo_eliminacion: null,
                activo: false,
            },
        });
    }
    async getStatistics() {
        const where = { deleted_at: null };
        const [total, activos, inactivos, eliminados] = await Promise.all([
            this.prisma.proveedor.count({ where }),
            this.prisma.proveedor.count({ where: { ...where, activo: true } }),
            this.prisma.proveedor.count({ where: { ...where, activo: false } }),
            this.prisma.proveedor.count({ where: { deleted_at: { not: null } } }),
        ]);
        return { total, activos, inactivos, eliminados };
    }
    mapToResponse(p) {
        return {
            id: p.id,
            razon_social: p.razon_social,
            nombre_comercial: p.nombre_comercial,
            nit_rfc: p.nit_rfc,
            contacto_nombres: p.contacto_nombres,
            contacto_telefono: p.contacto_telefono,
            contacto_email: p.contacto_email,
            direccion_completa: p.direccion_completa,
            latitud: p.latitud ? Number(p.latitud) : null,
            longitud: p.longitud ? Number(p.longitud) : null,
            dias_entrega: p.dias_entrega,
            condiciones_pago: p.condiciones_pago,
            activo: p.activo,
            notas: p.notas,
            deleted_at: p.deleted_at,
            created_at: p.created_at,
            updated_at: p.updated_at,
        };
    }
    mapToResponseDetailed(p) {
        return {
            ...this.mapToResponse(p),
            deleted_by: p.deleted_by,
            motivo_eliminacion: p.motivo_eliminacion,
            eliminador: p.eliminador,
        };
    }
};
exports.ProveedoresService = ProveedoresService;
exports.ProveedoresService = ProveedoresService = ProveedoresService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProveedoresService);
//# sourceMappingURL=proveedores.service.js.map