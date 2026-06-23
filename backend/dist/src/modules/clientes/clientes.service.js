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
var ClientesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const common_2 = require("@nestjs/common");
const toInt = (v, fb) => {
    const n = parseInt(String(v ?? fb), 10);
    return isNaN(n) ? fb : n;
};
const toBool = (v) => v === true || v === 'true';
let ClientesService = ClientesService_1 = class ClientesService {
    prisma;
    logger = new common_1.Logger(ClientesService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats() {
        const where = { deleted_at: null };
        const [total, activos, inactivos, conDeuda, deudaTotal] = await Promise.all([
            this.prisma.cliente.count({ where }),
            this.prisma.cliente.count({ where: { ...where, estado: 'Activo' } }),
            this.prisma.cliente.count({ where: { ...where, estado: 'Inactivo' } }),
            this.prisma.cliente.count({
                where: { ...where, saldo_pendiente: { gt: 0 } },
            }),
            this.prisma.cliente.aggregate({
                where: { ...where, saldo_pendiente: { gt: 0 } },
                _sum: { saldo_pendiente: true },
            }),
        ]);
        return {
            total,
            activos,
            inactivos,
            con_deuda: conDeuda,
            deuda_total: Number(deudaTotal._sum.saldo_pendiente ?? 0),
        };
    }
    async buscar(q) {
        if (!q || q.trim().length < 2)
            return [];
        return this.prisma.cliente.findMany({
            where: {
                estado: 'Activo',
                OR: [
                    { razon_social: { contains: q.trim(), mode: 'insensitive' } },
                    { nombre_comercial: { contains: q.trim(), mode: 'insensitive' } },
                    { contacto_telefono: { contains: q.trim() } },
                ],
            },
            select: {
                id: true,
                razon_social: true,
                nombre_comercial: true,
                contacto_telefono: true,
                direccion_calle: true,
                direccion_ciudad: true,
                latitud: true,
                longitud: true,
            },
            take: 20,
            orderBy: { razon_social: 'asc' },
        });
    }
    async findAll(query) {
        const page = toInt(query.page, 1);
        const limit = toInt(query.limit, 20);
        const skip = (page - 1) * limit;
        const where = {};
        if (!toBool(query.incluir_eliminados)) {
            where.deleted_at = null;
        }
        if (query.buscar?.trim()) {
            where.OR = [
                { razon_social: { contains: query.buscar, mode: 'insensitive' } },
                { nombre_comercial: { contains: query.buscar, mode: 'insensitive' } },
                { contacto_telefono: { contains: query.buscar, mode: 'insensitive' } },
                { contacto_nombres: { contains: query.buscar, mode: 'insensitive' } },
                { nit_rfc: { contains: query.buscar, mode: 'insensitive' } },
            ];
        }
        if (query.estado)
            where.estado = query.estado;
        if (toBool(query.con_deuda)) {
            where.saldo_pendiente = { gt: 0 };
        }
        if (toBool(query.con_credito)) {
            where.credito_habilitado = true;
        }
        if (query.tipo_cliente) {
            where.tipo_cliente = query.tipo_cliente;
        }
        const [total, data] = await Promise.all([
            this.prisma.cliente.count({ where }),
            this.prisma.cliente.findMany({
                where,
                skip,
                take: limit,
                orderBy: { razon_social: 'asc' },
            }),
        ]);
        return {
            data,
            total,
            page,
            pages: Math.ceil(total / limit),
            limit,
        };
    }
    async findOne(id) {
        const cliente = await this.prisma.cliente.findUnique({
            where: { id },
            include: {
                eliminador: {
                    select: { id: true, nombres: true, apellido_paterno: true },
                },
                pedidos: {
                    where: { deleted_at: null },
                    take: 10,
                    orderBy: { fecha_creacion: 'desc' },
                    select: {
                        id: true,
                        numero_pedido: true,
                        fecha_creacion: true,
                        estado: true,
                        total_monto: true,
                        estado_pago: true,
                    },
                },
            },
        });
        if (!cliente) {
            throw new common_1.NotFoundException(`Cliente ${id} no encontrado`);
        }
        return cliente;
    }
    async create(dto, usuarioId) {
        if (!dto.razon_social || !dto.razon_social.trim()) {
            throw new common_2.BadRequestException('La razón social es obligatoria');
        }
        if (!dto.contacto_telefono || !dto.contacto_telefono.trim()) {
            throw new common_2.BadRequestException('El teléfono es obligatorio');
        }
        const camposString = [
            'razon_social',
            'nombre_comercial',
            'nit_rfc',
            'regimen_fiscal',
            'tipo_cliente',
            'contacto_nombres',
            'contacto_apellido_paterno',
            'contacto_apellido_materno',
            'contacto_telefono',
            'contacto_whatsapp',
            'contacto_email',
            'direccion_calle',
            'direccion_numero',
            'direccion_colonia',
            'direccion_ciudad',
            'direccion_codigo_postal',
            'direccion_referencias',
            'dias_entrega',
            'notas_internas',
        ];
        const camposNumeric = [
            'limite_credito',
            'dias_credito',
            'latitud',
            'longitud',
            'preventista_asignado_id',
            'ruta_id',
            'tiempo_promedio_entrega_minutos',
        ];
        const camposBool = ['credito_habilitado', 'lista_precios_especial'];
        const camposDateTime = [
            'horario_recepcion_desde',
            'horario_recepcion_hasta',
        ];
        const data = {
            estado: dto.estado === 'Inactivo' ? 'Inactivo' : 'Activo',
        };
        for (const k of camposString) {
            if (dto[k] !== undefined && dto[k] !== null && dto[k] !== '') {
                data[k] = dto[k];
            }
        }
        for (const k of camposNumeric) {
            if (dto[k] !== undefined && dto[k] !== null && dto[k] !== '') {
                data[k] = Number(dto[k]);
            }
        }
        for (const k of camposBool) {
            if (dto[k] !== undefined) {
                data[k] = toBool(dto[k]);
            }
        }
        for (const k of camposDateTime) {
            if (dto[k] !== undefined && dto[k] !== null && dto[k] !== '') {
                data[k] = new Date(dto[k]);
            }
        }
        if (data.credito_habilitado === undefined)
            data.credito_habilitado = false;
        if (data.dias_credito === undefined)
            data.dias_credito = 0;
        if (data.saldo_pendiente === undefined)
            data.saldo_pendiente = 0;
        try {
            const cliente = await this.prisma.cliente.create({ data });
            this.logger.log(`Cliente ${cliente.id} creado por usuario ${usuarioId}`);
            return cliente;
        }
        catch (e) {
            if (e.code === 'P2002') {
                throw new common_1.ConflictException('El NIT/RFC ya está registrado');
            }
            throw e;
        }
    }
    async update(id, dto, usuarioId) {
        const anterior = await this.prisma.cliente.findUnique({
            where: { id },
            select: { id: true, deleted_at: true },
        });
        if (!anterior) {
            throw new common_1.NotFoundException(`Cliente ${id} no encontrado`);
        }
        if (anterior.deleted_at) {
            throw new common_2.BadRequestException('No se puede editar un cliente eliminado');
        }
        const camposString = [
            'razon_social',
            'nombre_comercial',
            'nit_rfc',
            'regimen_fiscal',
            'tipo_cliente',
            'contacto_nombres',
            'contacto_apellido_paterno',
            'contacto_apellido_materno',
            'contacto_telefono',
            'contacto_whatsapp',
            'contacto_email',
            'direccion_calle',
            'direccion_numero',
            'direccion_colonia',
            'direccion_ciudad',
            'direccion_codigo_postal',
            'direccion_referencias',
            'dias_entrega',
            'notas_internas',
            'estado',
        ];
        const camposNumeric = [
            'limite_credito',
            'dias_credito',
            'latitud',
            'longitud',
            'preventista_asignado_id',
            'ruta_id',
            'tiempo_promedio_entrega_minutos',
        ];
        const camposBool = ['credito_habilitado', 'lista_precios_especial'];
        const camposDateTime = [
            'horario_recepcion_desde',
            'horario_recepcion_hasta',
        ];
        const data = {};
        for (const k of camposString) {
            if (dto[k] !== undefined) {
                data[k] = dto[k] === '' ? null : dto[k];
            }
        }
        for (const k of camposNumeric) {
            if (dto[k] !== undefined && dto[k] !== null && dto[k] !== '') {
                data[k] = Number(dto[k]);
            }
            else if (dto[k] === null || dto[k] === '') {
                data[k] = null;
            }
        }
        for (const k of camposBool) {
            if (dto[k] !== undefined) {
                data[k] = toBool(dto[k]);
            }
        }
        for (const k of camposDateTime) {
            if (dto[k] !== undefined && dto[k] !== null && dto[k] !== '') {
                data[k] = new Date(dto[k]);
            }
            else if (dto[k] === null || dto[k] === '') {
                data[k] = null;
            }
        }
        try {
            const cliente = await this.prisma.cliente.update({
                where: { id },
                data,
            });
            this.logger.log(`Cliente ${id} actualizado por usuario ${usuarioId}: ${Object.keys(data).join(', ')}`);
            return cliente;
        }
        catch (e) {
            if (e.code === 'P2002') {
                throw new common_1.ConflictException('El NIT/RFC ya está registrado en otro cliente');
            }
            throw e;
        }
    }
    async softDelete(id, motivo, usuarioId, rol) {
        if (!['SUPER_ADMIN', 'ADMIN', 'GERENTE'].includes(rol)) {
            throw new common_2.ForbiddenException('No tienes permisos para eliminar clientes');
        }
        const cliente = await this.prisma.cliente.findUnique({
            where: { id },
            select: { id: true, deleted_at: true, razon_social: true },
        });
        if (!cliente) {
            throw new common_1.NotFoundException(`Cliente ${id} no encontrado`);
        }
        if (cliente.deleted_at) {
            throw new common_2.BadRequestException('El cliente ya está eliminado');
        }
        if (!motivo || motivo.trim().length < 3) {
            throw new common_2.BadRequestException('Motivo de eliminación obligatorio');
        }
        const pedidosActivos = await this.prisma.pedido.count({
            where: {
                cliente_id: id,
                deleted_at: null,
                estado: {
                    in: [
                        'Borrador',
                        'Confirmado',
                        'Preparando',
                        'Listo_Carga',
                        'En_Ruta',
                    ],
                },
            },
        });
        if (pedidosActivos > 0) {
            throw new common_2.BadRequestException(`No se puede eliminar: el cliente tiene ${pedidosActivos} pedido(s) activo(s). Cancélalos primero.`);
        }
        return this.prisma.cliente.update({
            where: { id },
            data: {
                deleted_at: new Date(),
                deleted_by: usuarioId,
                motivo_eliminacion: motivo.trim(),
                estado: 'Inactivo',
            },
        });
    }
    async restore(id, rol) {
        if (rol !== 'SUPER_ADMIN') {
            throw new common_2.ForbiddenException('Solo SUPER_ADMIN puede restaurar clientes');
        }
        const cliente = await this.prisma.cliente.findUnique({
            where: { id },
            select: { id: true, deleted_at: true },
        });
        if (!cliente)
            throw new common_1.NotFoundException(`Cliente ${id} no encontrado`);
        if (!cliente.deleted_at) {
            throw new common_2.BadRequestException('El cliente no está eliminado');
        }
        return this.prisma.cliente.update({
            where: { id },
            data: {
                deleted_at: null,
                deleted_by: null,
                motivo_eliminacion: null,
                estado: 'Activo',
            },
        });
    }
    async cambiarEstado(id, estado, usuarioId) {
        try {
            const anterior = await this.findOne(id);
            const cliente = await this.prisma.cliente.update({
                where: { id },
                data: { estado: estado },
            });
            await this.auditoria({
                tabla: 'clientes',
                registro_id: id,
                accion: estado === 'Activo' ? 'ACTIVAR' : 'DESACTIVAR',
                usuario_id: usuarioId,
                descripcion: `Cliente ${estado === 'Activo' ? 'activado' : 'desactivado'}: ${anterior.razon_social}`,
                datos_anteriores: { estado: anterior.estado },
                datos_nuevos: { estado },
            });
            return { id: cliente.id, estado: cliente.estado };
        }
        catch (error) {
            if (error instanceof Error)
                this.logger.error(`cambiarEstado: ${error.message}`);
            throw error;
        }
    }
    async auditoria(p) {
        if (!p.usuario_id) {
            this.logger.warn(`Auditoría sin usuario_id, saltando registro`);
            return;
        }
        try {
            await this.prisma.auditoriaLog.create({
                data: {
                    accion: p.accion,
                    modulo: 'PEDIDOS',
                    tabla_afectada: p.tabla,
                    registro_id: String(p.registro_id),
                    valor_anterior: p.datos_anteriores
                        ? p.datos_anteriores
                        : undefined,
                    valor_nuevo: p.datos_nuevos ? p.datos_nuevos : undefined,
                    ip_origen: '127.0.0.1',
                    usuario: { connect: { id: p.usuario_id } },
                },
            });
        }
        catch (e) {
            this.logger.warn(`Auditoría no registrada: ${e}`);
        }
    }
};
exports.ClientesService = ClientesService;
exports.ClientesService = ClientesService = ClientesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClientesService);
//# sourceMappingURL=clientes.service.js.map