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
var AuditoriaInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditoriaInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuditoriaInterceptor = AuditoriaInterceptor_1 = class AuditoriaInterceptor {
    prisma;
    logger = new common_1.Logger(AuditoriaInterceptor_1.name);
    metodosAuditables = ['POST', 'PATCH', 'PUT', 'DELETE'];
    rutasExcluidas = [
        '/api/auth/login',
        '/api/auth/refresh',
        '/api/auth/logout',
    ];
    constructor(prisma) {
        this.prisma = prisma;
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const { method, originalUrl, body, user } = req;
        if (!this.metodosAuditables.includes(method)) {
            return next.handle();
        }
        if (!user?.id) {
            return next.handle();
        }
        if (this.rutasExcluidas.some(r => originalUrl.startsWith(r))) {
            return next.handle();
        }
        const inicio = Date.now();
        return next.handle().pipe((0, rxjs_1.tap)(async (response) => {
            await this.registrarAuditoria({
                usuarioId: user.id,
                metodo: method,
                url: originalUrl,
                body: this.sanitizarBody(body),
                response: this.sanitizarResponse(response),
                ip: this.extraerIp(req),
                userAgent: req.headers['user-agent'] || null,
                durationMs: Date.now() - inicio,
                exitoso: true,
            });
        }), (0, rxjs_1.catchError)(async (error) => {
            await this.registrarAuditoria({
                usuarioId: user.id,
                metodo: method,
                url: originalUrl,
                body: this.sanitizarBody(body),
                response: { error: error.message },
                ip: this.extraerIp(req),
                userAgent: req.headers['user-agent'] || null,
                durationMs: Date.now() - inicio,
                exitoso: false,
            });
            return (0, rxjs_1.throwError)(() => error);
        }));
    }
    async registrarAuditoria(data) {
        try {
            const { modulo, tabla, registroId } = this.inferirContexto(data.url, data.body, data.response);
            const accion = this.metodoAAccion(data.metodo, data.url);
            await this.prisma.auditoriaLog.create({
                data: {
                    usuario_id: data.usuarioId,
                    accion: accion,
                    modulo: modulo,
                    tabla_afectada: tabla,
                    registro_id: registroId,
                    valor_anterior: data.body?.__anterior ?? null,
                    valor_nuevo: {
                        url: data.url,
                        body: data.body,
                        response: data.response,
                        duracion_ms: data.durationMs,
                        exitoso: data.exitoso,
                    },
                    ip_origen: data.ip,
                    user_agent: data.userAgent,
                    dispositivo: this.detectarDispositivo(data.userAgent),
                    navegador: this.detectarNavegador(data.userAgent),
                },
            });
        }
        catch (e) {
            this.logger.error('Error registrando auditoría:', e);
        }
    }
    extraerIp(req) {
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string')
            return forwarded.split(',')[0].trim();
        return req.ip || req.socket?.remoteAddress || null;
    }
    sanitizarBody(body) {
        if (!body)
            return null;
        const sanitized = { ...body };
        delete sanitized.password;
        delete sanitized.password_hash;
        delete sanitized.token;
        delete sanitized.refresh_token;
        return sanitized;
    }
    sanitizarResponse(response) {
        if (!response)
            return null;
        if (Array.isArray(response))
            return { tipo: 'array', length: response.length };
        if (typeof response !== 'object')
            return response;
        const sanitized = { ...response };
        delete sanitized.password;
        delete sanitized.password_hash;
        delete sanitized.accessToken;
        delete sanitized.refreshToken;
        return sanitized;
    }
    inferirContexto(url, body, response) {
        const path = url.replace(/^\/api\//, '');
        const segments = path.split('/').filter(Boolean);
        const modulo = segments[0] ?? 'desconocido';
        const mapa = {
            pedidos: 'pedidos',
            productos: 'productos',
            clientes: 'clientes',
            usuarios: 'usuarios',
            vehiculos: 'vehiculos',
            rutas: 'rutas',
            perfil: 'usuarios',
            boletas: 'pedidos',
        };
        const tabla = mapa[modulo] ?? modulo;
        let registroId = null;
        if (segments[1] && /^\d+$/.test(segments[1])) {
            registroId = segments[1];
        }
        else if (response?.id) {
            registroId = String(response.id);
        }
        return { modulo, tabla, registroId };
    }
    metodoAAccion(metodo, url) {
        if (url.includes('/cancelar'))
            return 'CANCELAR';
        if (url.includes('/restore'))
            return 'RESTAURAR';
        if (url.includes('/estado'))
            return 'CAMBIAR_ESTADO';
        if (url.includes('/login'))
            return 'LOGIN';
        if (url.includes('/logout'))
            return 'LOGOUT';
        const m = {
            POST: 'CREAR',
            PATCH: 'EDITAR',
            PUT: 'ACTUALIZAR',
            DELETE: 'ELIMINAR',
        };
        return m[metodo] ?? metodo;
    }
    detectarDispositivo(ua) {
        if (!ua)
            return null;
        if (/mobile/i.test(ua))
            return 'móvil';
        if (/tablet/i.test(ua))
            return 'tablet';
        if (/windows|mac|linux/i.test(ua))
            return 'desktop';
        return 'otro';
    }
    detectarNavegador(ua) {
        if (!ua)
            return null;
        if (/edg\//i.test(ua))
            return 'Edge';
        if (/chrome/i.test(ua))
            return 'Chrome';
        if (/firefox/i.test(ua))
            return 'Firefox';
        if (/safari/i.test(ua))
            return 'Safari';
        if (/postman/i.test(ua))
            return 'Postman';
        if (/capacitor/i.test(ua))
            return 'App móvil';
        return 'Otro';
    }
};
exports.AuditoriaInterceptor = AuditoriaInterceptor;
exports.AuditoriaInterceptor = AuditoriaInterceptor = AuditoriaInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditoriaInterceptor);
//# sourceMappingURL=auditoria.interceptor.js.map