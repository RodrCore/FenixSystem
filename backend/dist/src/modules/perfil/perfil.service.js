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
var PerfilService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerfilService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const promises_1 = require("fs/promises");
const path_1 = require("path");
let PerfilService = PerfilService_1 = class PerfilService {
    prisma;
    logger = new common_1.Logger(PerfilService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMi(usuarioId) {
        const u = await this.prisma.usuario.findUnique({
            where: { id: usuarioId },
            select: {
                id: true,
                nombres: true,
                apellido_paterno: true,
                apellido_materno: true,
                email: true,
                telefono: true,
                avatar_url: true,
                numero_empleado: true,
                fecha_contratacion: true,
                created_at: true,
                rol: { select: { id: true, nombre: true } },
            },
        });
        if (!u)
            throw new common_1.NotFoundException('Usuario no encontrado');
        return u;
    }
    async actualizarDatos(usuarioId, dto) {
        if (dto.email) {
            const existente = await this.prisma.usuario.findFirst({
                where: { email: dto.email, NOT: { id: usuarioId } },
            });
            if (existente) {
                throw new common_1.BadRequestException('Ese correo ya está en uso por otro usuario');
            }
        }
        const actualizado = await this.prisma.usuario.update({
            where: { id: usuarioId },
            data: {
                nombres: dto.nombres || undefined,
                apellido_paterno: dto.apellido_paterno || undefined,
                apellido_materno: dto.apellido_materno || undefined,
                telefono: dto.telefono || undefined,
                email: dto.email || undefined,
            },
            select: {
                id: true, nombres: true,
                apellido_paterno: true, apellido_materno: true,
                email: true, telefono: true, avatar_url: true,
                rol: { select: { id: true, nombre: true } },
            },
        });
        await this.auditar(usuarioId, 'EDITAR_PERFIL', { campos: Object.keys(dto) });
        this.logger.log(`Usuario ${usuarioId} actualizó su perfil`);
        return actualizado;
    }
    async cambiarPassword(usuarioId, dto) {
        if (!dto.actual || !dto.nueva) {
            throw new common_1.BadRequestException('Contraseña actual y nueva son obligatorias');
        }
        if (dto.nueva.length < 8) {
            throw new common_1.BadRequestException('La nueva contraseña debe tener al menos 8 caracteres');
        }
        if (dto.actual === dto.nueva) {
            throw new common_1.BadRequestException('La nueva contraseña debe ser diferente a la actual');
        }
        const usuario = await this.prisma.usuario.findUnique({
            where: { id: usuarioId },
            select: { id: true, password_hash: true },
        });
        if (!usuario)
            throw new common_1.NotFoundException('Usuario no encontrado');
        const ok = await bcrypt.compare(dto.actual, usuario.password_hash);
        if (!ok)
            throw new common_1.UnauthorizedException('La contraseña actual es incorrecta');
        const hash = await bcrypt.hash(dto.nueva, 10);
        await this.prisma.usuario.update({
            where: { id: usuarioId },
            data: { password_hash: hash, refresh_token: null },
        });
        await this.auditar(usuarioId, 'CAMBIAR_PASSWORD', {});
        this.logger.log(`Usuario ${usuarioId} cambió su contraseña`);
        return { mensaje: 'Contraseña actualizada. Tu sesión sigue activa.' };
    }
    async actualizarAvatar(usuarioId, archivo) {
        if (!archivo)
            throw new common_1.BadRequestException('No se recibió ningún archivo');
        const actual = await this.prisma.usuario.findUnique({
            where: { id: usuarioId },
            select: { avatar_url: true },
        });
        if (actual?.avatar_url) {
            const oldPath = (0, path_1.join)(process.cwd(), actual.avatar_url.replace(/^\//, ''));
            try {
                await (0, promises_1.unlink)(oldPath);
            }
            catch { }
        }
        const url = `/uploads/avatars/${archivo.filename}`;
        const actualizado = await this.prisma.usuario.update({
            where: { id: usuarioId },
            data: { avatar_url: url },
            select: {
                id: true, nombres: true,
                apellido_paterno: true, apellido_materno: true,
                email: true, telefono: true, avatar_url: true,
            },
        });
        await this.auditar(usuarioId, 'CAMBIAR_AVATAR', { url });
        this.logger.log(`Usuario ${usuarioId} actualizó su foto: ${url}`);
        return actualizado;
    }
    async eliminarAvatar(usuarioId) {
        const actual = await this.prisma.usuario.findUnique({
            where: { id: usuarioId },
            select: { avatar_url: true },
        });
        if (actual?.avatar_url) {
            const oldPath = (0, path_1.join)(process.cwd(), actual.avatar_url.replace(/^\//, ''));
            try {
                await (0, promises_1.unlink)(oldPath);
            }
            catch { }
        }
        await this.prisma.usuario.update({
            where: { id: usuarioId },
            data: { avatar_url: null },
        });
        await this.auditar(usuarioId, 'ELIMINAR_AVATAR', {});
        return { mensaje: 'Foto de perfil eliminada' };
    }
    async cerrarTodasLasSesiones(usuarioId) {
        await this.prisma.usuario.update({
            where: { id: usuarioId },
            data: { refresh_token: null },
        });
        await this.auditar(usuarioId, 'CERRAR_TODAS_SESIONES', {});
        return { mensaje: 'Sesiones cerradas. Vuelve a iniciar sesión.' };
    }
    async auditar(usuarioId, accion, datos) {
        try {
            await this.prisma.auditoriaLog.create({
                data: {
                    accion,
                    modulo: 'PERFIL',
                    tabla_afectada: 'usuarios',
                    registro_id: String(usuarioId),
                    valor_nuevo: datos,
                    ip_origen: '127.0.0.1',
                    usuario: { connect: { id: usuarioId } },
                },
            });
        }
        catch (e) {
            this.logger.warn(`Auditoría no registrada: ${e}`);
        }
    }
};
exports.PerfilService = PerfilService;
exports.PerfilService = PerfilService = PerfilService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PerfilService);
//# sourceMappingURL=perfil.service.js.map