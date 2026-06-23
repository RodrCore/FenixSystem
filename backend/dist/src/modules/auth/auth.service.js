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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    configService;
    logger = new common_1.Logger(AuthService_1.name);
    JWT_EXPIRATION = '15m';
    REFRESH_TOKEN_EXPIRATION = '7d';
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(registerDto) {
        try {
            const { email, password, nombres, apellido_paterno, apellido_materno, telefono, numero_empleado, } = registerDto;
            const usuarioExistente = await this.prisma.usuario.findUnique({
                where: { email },
            });
            if (usuarioExistente) {
                throw new common_1.ConflictException('El email ya está registrado');
            }
            const passwordHash = await bcrypt.hash(password, 10);
            const rolDefault = await this.prisma.role.findUnique({
                where: { nombre: 'PREVENTISTA' },
            });
            if (!rolDefault) {
                throw new common_1.BadRequestException('El rol por defecto no existe');
            }
            const usuario = await this.prisma.usuario.create({
                data: {
                    email,
                    password_hash: passwordHash,
                    nombres,
                    apellido_paterno,
                    apellido_materno: apellido_materno || null,
                    telefono: telefono || null,
                    numero_empleado: numero_empleado || null,
                    rol_id: rolDefault.id,
                    estado: true,
                },
                include: {
                    rol: {
                        select: {
                            id: true,
                            nombre: true,
                            descripcion: true,
                            permisos: true,
                        },
                    },
                },
            });
            const tokens = await this.generateTokens(usuario);
            this.logger.log(`Usuario registrado: ${email}`);
            return {
                ...tokens,
                usuario: this.mapToUsuarioResponse(usuario),
            };
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Error en registro: ${error.message}`);
            }
            else {
                this.logger.error(`Error en registro: Error desconocido`);
            }
            throw error;
        }
    }
    async login(loginDto) {
        try {
            const { email, password } = loginDto;
            const usuario = await this.prisma.usuario.findUnique({
                where: { email },
                include: {
                    rol: {
                        select: {
                            id: true,
                            nombre: true,
                            descripcion: true,
                            permisos: true,
                        },
                    },
                },
            });
            if (!usuario) {
                throw new common_1.UnauthorizedException('Email o contraseña incorrectos');
            }
            if (!usuario.estado) {
                throw new common_1.UnauthorizedException('El usuario está inactivo');
            }
            const passwordValida = await bcrypt.compare(password, usuario.password_hash);
            if (!passwordValida) {
                throw new common_1.UnauthorizedException('Email o contraseña incorrectos');
            }
            await this.prisma.usuario.update({
                where: { id: usuario.id },
                data: { ultimo_acceso: new Date() },
            });
            const tokens = await this.generateTokens(usuario);
            this.logger.log(`Usuario autenticado: ${email}`);
            await this.logAuditoria(usuario.id, 'LOGIN', 'AUTH', null, null, {
                action: 'login_exitoso',
            });
            return {
                ...tokens,
                usuario: this.mapToUsuarioResponse(usuario),
            };
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Error en registro: ${error.message}`);
            }
            else {
                this.logger.error(`Error en registro: Error desconocido`);
            }
            throw error;
        }
    }
    async validateUser(email, password) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { email },
            include: {
                rol: {
                    select: {
                        nombre: true,
                        permisos: true,
                    },
                },
            },
        });
        if (usuario && (await bcrypt.compare(password, usuario.password_hash))) {
            const { password_hash, ...result } = usuario;
            return result;
        }
        return null;
    }
    async generateTokens(usuario) {
        const payload = {
            sub: usuario.id,
            email: usuario.email,
            nombres: usuario.nombres,
            rol: usuario.rol.nombre,
            permisos: usuario.rol.permisos,
        };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.JWT_EXPIRATION,
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET') ||
                this.configService.get('JWT_SECRET'),
            expiresIn: this.REFRESH_TOKEN_EXPIRATION,
        });
        await this.prisma.usuario.update({
            where: { id: usuario.id },
            data: { refresh_token: refreshToken },
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: 900,
        };
    }
    async refreshTokens(usuarioId, refreshToken) {
        try {
            const usuario = await this.prisma.usuario.findUnique({
                where: { id: usuarioId },
                include: {
                    rol: {
                        select: {
                            id: true,
                            nombre: true,
                            descripcion: true,
                            permisos: true,
                        },
                    },
                },
            });
            if (!usuario || usuario.refresh_token !== refreshToken) {
                throw new common_1.UnauthorizedException('Refresh token inválido');
            }
            const tokens = await this.generateTokens(usuario);
            return {
                ...tokens,
                usuario: this.mapToUsuarioResponse(usuario),
            };
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Error en registro: ${error.message}`);
            }
            else {
                this.logger.error(`Error en registro: Error desconocido`);
            }
            throw error;
        }
    }
    async changePassword(usuarioId, changePasswordDto) {
        try {
            const { oldPassword, newPassword, confirmPassword } = changePasswordDto;
            if (newPassword !== confirmPassword) {
                throw new common_1.BadRequestException('Las contraseñas no coinciden');
            }
            const usuario = await this.prisma.usuario.findUnique({
                where: { id: usuarioId },
            });
            if (!usuario) {
                throw new common_1.UnauthorizedException('Usuario no encontrado');
            }
            const passwordValida = await bcrypt.compare(oldPassword, usuario.password_hash);
            if (!passwordValida) {
                throw new common_1.BadRequestException('La contraseña actual es incorrecta');
            }
            const newPasswordHash = await bcrypt.hash(newPassword, 10);
            await this.prisma.usuario.update({
                where: { id: usuarioId },
                data: { password_hash: newPasswordHash },
            });
            this.logger.log(`Contraseña cambiada: usuario ${usuarioId}`);
            await this.logAuditoria(usuarioId, 'CHANGE_PASSWORD', 'AUTH', null, null, {
                action: 'cambio_contraseña',
            });
            return { message: 'Contraseña actualizada correctamente' };
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Error en registro: ${error.message}`);
            }
            else {
                this.logger.error(`Error en registro: Error desconocido`);
            }
            throw error;
        }
    }
    async createUser(createUserDto) {
        try {
            const { email, password, nombres, apellido_paterno, apellido_materno, rol_id, telefono, numero_empleado, } = createUserDto;
            const usuarioExistente = await this.prisma.usuario.findUnique({
                where: { email },
            });
            if (usuarioExistente) {
                throw new common_1.ConflictException('El email ya está registrado');
            }
            const rol = await this.prisma.role.findUnique({
                where: { id: rol_id },
            });
            if (!rol) {
                throw new common_1.BadRequestException('El rol especificado no existe');
            }
            const passwordHash = await bcrypt.hash(password, 10);
            const usuario = await this.prisma.usuario.create({
                data: {
                    email,
                    password_hash: passwordHash,
                    nombres,
                    apellido_paterno,
                    apellido_materno: apellido_materno || null,
                    telefono: telefono || null,
                    numero_empleado: numero_empleado || null,
                    rol_id,
                    estado: true,
                },
                include: {
                    rol: {
                        select: {
                            id: true,
                            nombre: true,
                            descripcion: true,
                            permisos: true,
                        },
                    },
                },
            });
            this.logger.log(`Usuario creado: ${email} con rol ${rol.nombre}`);
            return this.mapToUsuarioResponse(usuario);
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Error en registro: ${error.message}`);
            }
            else {
                this.logger.error(`Error en registro: Error desconocido`);
            }
            throw error;
        }
    }
    mapToUsuarioResponse(usuario) {
        return {
            id: usuario.id,
            nombres: usuario.nombres,
            apellido_paterno: usuario.apellido_paterno,
            apellido_materno: usuario.apellido_materno,
            email: usuario.email,
            numero_empleado: usuario.numero_empleado,
            telefono: usuario.telefono,
            avatar_url: usuario.avatar_url,
            rol: usuario.rol,
        };
    }
    async logAuditoria(usuarioId, accion, modulo, tablaAfectada, registroId, valorNuevo) {
        try {
            await this.prisma.auditoriaLog.create({
                data: {
                    usuario_id: usuarioId,
                    accion,
                    modulo,
                    tabla_afectada: tablaAfectada,
                    registro_id: registroId,
                    valor_nuevo: valorNuevo,
                    fecha_hora: new Date(),
                },
            });
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Error en registro: ${error.message}`);
            }
            else {
                this.logger.error(`Error en registro: Error desconocido`);
            }
            throw error;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map