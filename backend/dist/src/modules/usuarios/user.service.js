"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
const toInt = (v, fb = 0) => {
    const n = parseInt(String(v ?? fb), 10);
    return isNaN(n) ? fb : n;
};
const toBool = (v) => v === true || v === 'true' || v === 1;
let UsersService = UsersService_1 = class UsersService {
    prisma;
    authService;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(prisma, authService) {
        this.prisma = prisma;
        this.authService = authService;
    }
    generarPasswordTemporal() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const random = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        return `${random(4)}-${random(4)}`;
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
        if (query.estado !== undefined && query.estado !== '') {
            where.estado = toBool(query.estado);
        }
        if (query.rol) {
            where.rol = { nombre: query.rol };
        }
        if (query.buscar?.trim()) {
            const q = query.buscar.trim();
            where.OR = [
                { nombres: { contains: q, mode: 'insensitive' } },
                { apellido_paterno: { contains: q, mode: 'insensitive' } },
                { apellido_materno: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { ci: { contains: q, mode: 'insensitive' } },
                { numero_empleado: { contains: q, mode: 'insensitive' } },
                { telefono: { contains: q } },
            ];
        }
        const [total, data] = await Promise.all([
            this.prisma.usuario.count({ where }),
            this.prisma.usuario.findMany({
                where,
                skip,
                take: limit,
                orderBy: { apellido_paterno: 'asc' },
                include: {
                    rol: {
                        select: {
                            id: true,
                            nombre: true,
                            descripcion: true,
                            nivel_jerarquico: true,
                        },
                    },
                },
            }),
        ]);
        return {
            data: data.map((u) => this.mapToResponse(u)),
            total,
            page,
            pages: Math.ceil(total / limit),
            limit,
        };
    }
    async findById(id) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id },
            include: {
                rol: {
                    select: {
                        id: true,
                        nombre: true,
                        descripcion: true,
                        permisos: true,
                        nivel_jerarquico: true,
                    },
                },
                eliminador: {
                    select: { id: true, nombres: true, apellido_paterno: true },
                },
            },
        });
        if (!usuario) {
            throw new common_1.NotFoundException(`Usuario con id ${id} no encontrado`);
        }
        return this.mapToResponseDetailed(usuario);
    }
    async findByEmail(email) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { email },
            include: { rol: true },
        });
        return usuario ? this.mapToResponse(usuario) : null;
    }
    async createUser(createUserDto) {
        const emailExiste = await this.prisma.usuario.findUnique({
            where: { email: createUserDto.email },
        });
        if (emailExiste) {
            throw new common_1.ConflictException('El email ya está registrado');
        }
        if (createUserDto.ci) {
            const ciExiste = await this.prisma.usuario.findFirst({
                where: { ci: createUserDto.ci },
            });
            if (ciExiste) {
                throw new common_1.ConflictException('El CI ya está registrado');
            }
        }
        if (!createUserDto.rol_id) {
            throw new common_1.BadRequestException('El rol es obligatorio');
        }
        const rol = await this.prisma.role.findUnique({
            where: { id: createUserDto.rol_id },
        });
        if (!rol) {
            throw new common_1.BadRequestException('Rol no válido');
        }
        let passwordPlain = createUserDto.password;
        let esTemporal = false;
        if (!passwordPlain || passwordPlain.length < 6) {
            passwordPlain = this.generarPasswordTemporal();
            esTemporal = true;
        }
        const hash = await bcrypt.hash(passwordPlain, 10);
        const data = {
            email: createUserDto.email,
            password_hash: hash,
            nombres: createUserDto.nombres,
            apellido_paterno: createUserDto.apellido_paterno,
            apellido_materno: createUserDto.apellido_materno || null,
            telefono: createUserDto.telefono || null,
            ci: createUserDto.ci || null,
            rol_id: createUserDto.rol_id,
            estado: true,
            password_temporal: esTemporal,
            requiere_cambio_password: esTemporal,
        };
        if (createUserDto.fecha_contratacion) {
            data.fecha_contratacion = new Date(createUserDto.fecha_contratacion);
        }
        if (createUserDto.numero_empleado) {
            data.numero_empleado = createUserDto.numero_empleado;
        }
        if (createUserDto.salario_base !== undefined) {
            data.salario_base = Number(createUserDto.salario_base);
        }
        if (createUserDto.comision_porcentaje !== undefined) {
            data.comision_porcentaje = Number(createUserDto.comision_porcentaje);
        }
        const usuario = await this.prisma.usuario.create({
            data,
            include: { rol: true },
        });
        this.logger.log(`Usuario creado: ${usuario.email}`);
        return {
            ...this.mapToResponse(usuario),
            password_temporal_generada: esTemporal ? passwordPlain : undefined,
        };
    }
    async update(id, dto, rolUsuarioActual, idUsuarioActual) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id },
            include: { rol: true },
        });
        if (!usuario) {
            throw new common_1.NotFoundException(`Usuario con id ${id} no encontrado`);
        }
        if (usuario.deleted_at) {
            throw new common_1.BadRequestException('No se puede editar un usuario eliminado');
        }
        if (rolUsuarioActual === 'ADMIN' && usuario.rol?.nombre === 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('No tienes permiso para editar a un SUPER_ADMIN');
        }
        if (dto.email && dto.email !== usuario.email) {
            const emailExiste = await this.prisma.usuario.findUnique({
                where: { email: dto.email },
            });
            if (emailExiste) {
                throw new common_1.ConflictException('El email ya está registrado');
            }
        }
        if (dto.ci && dto.ci !== usuario.ci) {
            const ciExiste = await this.prisma.usuario.findFirst({
                where: { ci: dto.ci, NOT: { id } },
            });
            if (ciExiste) {
                throw new common_1.ConflictException('El CI ya está registrado');
            }
        }
        const camposString = [
            'nombres',
            'apellido_paterno',
            'apellido_materno',
            'email',
            'telefono',
            'ci',
            'numero_empleado',
            'avatar_url',
        ];
        const camposNumeric = ['rol_id', 'salario_base', 'comision_porcentaje'];
        const camposBool = ['estado'];
        const camposDate = ['fecha_contratacion'];
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
        for (const k of camposDate) {
            if (dto[k] !== undefined && dto[k] !== null && dto[k] !== '') {
                data[k] = new Date(dto[k]);
            }
            else if (dto[k] === null || dto[k] === '') {
                data[k] = null;
            }
        }
        if (data.rol_id && rolUsuarioActual === 'ADMIN') {
            const nuevoRol = await this.prisma.role.findUnique({
                where: { id: data.rol_id },
            });
            if (nuevoRol?.nombre === 'SUPER_ADMIN') {
                throw new common_1.ForbiddenException('Solo SUPER_ADMIN puede asignar rol SUPER_ADMIN');
            }
        }
        try {
            const updated = await this.prisma.usuario.update({
                where: { id },
                data,
                include: { rol: true },
            });
            this.logger.log(`Usuario actualizado: ${updated.email}`);
            return this.mapToResponse(updated);
        }
        catch (e) {
            if (e.code === 'P2002') {
                throw new common_1.ConflictException('Email, CI o número de empleado ya registrado');
            }
            throw e;
        }
    }
    async toggleActive(id, estado, rolActual, idActual) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id },
            include: { rol: true },
        });
        if (!usuario)
            throw new common_1.NotFoundException(`Usuario ${id} no encontrado`);
        if (usuario.deleted_at) {
            throw new common_1.BadRequestException('No se puede cambiar el estado de un usuario eliminado. Restáuralo primero.');
        }
        if (rolActual === 'ADMIN' && usuario.rol?.nombre === 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('No puedes cambiar estado de un SUPER_ADMIN');
        }
        if (id === idActual && estado === false) {
            throw new common_1.BadRequestException('No puedes desactivarte a ti mismo');
        }
        const updated = await this.prisma.usuario.update({
            where: { id },
            data: { estado },
            include: { rol: true },
        });
        this.logger.log(`Usuario ${updated.email} ${estado ? 'activado' : 'desactivado'} por usuario ${idActual}`);
        return this.mapToResponse(updated);
    }
    async changeRole(userId, rolId) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id: userId },
            include: { rol: true },
        });
        if (!usuario)
            throw new common_1.NotFoundException(`Usuario ${userId} no encontrado`);
        const rol = await this.prisma.role.findUnique({ where: { id: rolId } });
        if (!rol)
            throw new common_1.BadRequestException(`Rol ${rolId} no existe`);
        const updated = await this.prisma.usuario.update({
            where: { id: userId },
            data: { rol_id: rolId },
            include: { rol: true },
        });
        return this.mapToResponse(updated);
    }
    async resetPassword(id, rolActual) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id },
            include: { rol: true },
        });
        if (!usuario)
            throw new common_1.NotFoundException(`Usuario ${id} no encontrado`);
        if (rolActual === 'ADMIN' && usuario.rol?.nombre === 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('No puedes resetear el password de un SUPER_ADMIN');
        }
        if (usuario.deleted_at) {
            throw new common_1.BadRequestException('No se puede resetear password de un usuario eliminado');
        }
        const passwordTemporal = this.generarPasswordTemporal();
        const hash = await bcrypt.hash(passwordTemporal, 10);
        await this.prisma.usuario.update({
            where: { id },
            data: {
                password_hash: hash,
                password_temporal: true,
                requiere_cambio_password: true,
                intentos_fallidos_login: 0,
                bloqueado_hasta: null,
            },
        });
        this.logger.log(`Password reseteada para usuario ${usuario.email}`);
        return {
            mensaje: 'Password reseteada correctamente',
            password_temporal: passwordTemporal,
            email: usuario.email,
        };
    }
    async softDelete(id, motivo, usuarioActualId, rolActual) {
        if (rolActual !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Solo SUPER_ADMIN puede eliminar usuarios definitivamente');
        }
        if (!motivo || motivo.trim().length < 3) {
            throw new common_1.BadRequestException('El motivo es obligatorio (mínimo 3 caracteres)');
        }
        const usuario = await this.prisma.usuario.findUnique({
            where: { id },
            include: { rol: true },
        });
        if (!usuario)
            throw new common_1.NotFoundException(`Usuario ${id} no encontrado`);
        if (usuario.deleted_at) {
            throw new common_1.BadRequestException('El usuario ya está eliminado');
        }
        if (usuario.estado === true) {
            throw new common_1.BadRequestException('El usuario debe estar Inactivo antes de eliminarlo. Desactívalo primero.');
        }
        if (usuario.rol?.nombre === 'SUPER_ADMIN') {
            throw new common_1.BadRequestException('No se puede eliminar a un SUPER_ADMIN');
        }
        if (id === usuarioActualId) {
            throw new common_1.BadRequestException('No puedes eliminarte a ti mismo');
        }
        this.logger.log(`Usuario ${usuario.email} eliminado por usuario ${usuarioActualId}`);
        return this.prisma.usuario.update({
            where: { id },
            data: {
                deleted_at: new Date(),
                deleted_by: usuarioActualId,
                motivo_eliminacion: motivo.trim(),
            },
        });
    }
    async restore(id, rolActual) {
        if (rolActual !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Solo SUPER_ADMIN puede restaurar usuarios');
        }
        const usuario = await this.prisma.usuario.findUnique({ where: { id } });
        if (!usuario)
            throw new common_1.NotFoundException(`Usuario ${id} no encontrado`);
        if (!usuario.deleted_at) {
            throw new common_1.BadRequestException('El usuario no está eliminado');
        }
        return this.prisma.usuario.update({
            where: { id },
            data: {
                deleted_at: null,
                deleted_by: null,
                motivo_eliminacion: null,
                estado: false,
            },
        });
    }
    async getStatistics() {
        const where = { deleted_at: null };
        const [total, activos, inactivos] = await Promise.all([
            this.prisma.usuario.count({ where }),
            this.prisma.usuario.count({ where: { ...where, estado: true } }),
            this.prisma.usuario.count({ where: { ...where, estado: false } }),
        ]);
        const roles = await this.prisma.role.findMany({
            where: { activo: true },
            orderBy: { nivel_jerarquico: 'desc' },
        });
        const porRol = {};
        for (const r of roles) {
            const count = await this.prisma.usuario.count({
                where: { ...where, rol_id: r.id },
            });
            porRol[r.nombre] = count;
        }
        return {
            total,
            activos,
            inactivos,
            por_rol: porRol,
        };
    }
    async listRoles() {
        return this.prisma.role.findMany({
            where: { activo: true },
            orderBy: { nivel_jerarquico: 'desc' },
            select: {
                id: true,
                nombre: true,
                descripcion: true,
                nivel_jerarquico: true,
            },
        });
    }
    async getRepartidores() {
        return this.prisma.usuario.findMany({
            where: {
                estado: true,
                deleted_at: null,
                rol: { nombre: 'REPARTIDOR' },
            },
            select: {
                id: true,
                nombres: true,
                apellido_paterno: true,
                apellido_materno: true,
                telefono: true,
            },
            orderBy: { nombres: 'asc' },
        });
    }
    async createAdmin(dto) {
        const rolAdmin = await this.prisma.role.findUnique({
            where: { nombre: 'ADMIN' },
        });
        if (!rolAdmin) {
            throw new common_1.BadRequestException('El rol ADMIN no existe en el sistema');
        }
        return this.createUser({ ...dto, rol_id: rolAdmin.id });
    }
    async findByRole(rolNombre) {
        const usuarios = await this.prisma.usuario.findMany({
            where: {
                deleted_at: null,
                rol: { nombre: rolNombre },
                estado: true,
            },
            include: { rol: true },
        });
        return usuarios.map((u) => this.mapToResponse(u));
    }
    async delete(id) {
        return { mensaje: 'Use el endpoint DELETE con motivo en el body' };
    }
    mapToResponse(usuario) {
        return {
            id: usuario.id,
            nombres: usuario.nombres,
            apellido_paterno: usuario.apellido_paterno,
            apellido_materno: usuario.apellido_materno,
            email: usuario.email,
            ci: usuario.ci,
            telefono: usuario.telefono,
            avatar_url: usuario.avatar_url,
            numero_empleado: usuario.numero_empleado,
            fecha_contratacion: usuario.fecha_contratacion,
            salario_base: usuario.salario_base ? Number(usuario.salario_base) : null,
            comision_porcentaje: usuario.comision_porcentaje
                ? Number(usuario.comision_porcentaje)
                : null,
            estado: usuario.estado,
            rol: usuario.rol,
            rol_id: usuario.rol_id,
            deleted_at: usuario.deleted_at,
            created_at: usuario.created_at,
        };
    }
    mapToResponseDetailed(usuario) {
        return {
            ...this.mapToResponse(usuario),
            ultimo_acceso: usuario.ultimo_acceso,
            ultima_ip: usuario.ultima_ip,
            intentos_fallidos_login: usuario.intentos_fallidos_login,
            bloqueado_hasta: usuario.bloqueado_hasta,
            password_temporal: usuario.password_temporal,
            requiere_cambio_password: usuario.requiere_cambio_password,
            deleted_by: usuario.deleted_by,
            motivo_eliminacion: usuario.motivo_eliminacion,
            eliminador: usuario.eliminador,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService])
], UsersService);
//# sourceMappingURL=user.service.js.map