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
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuditService = AuditService_1 = class AuditService {
    prisma;
    logger = new common_1.Logger(AuditService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAll(page = 1, limit = 50) {
        try {
            if (page < 1 || limit < 1) {
                throw new common_1.BadRequestException('Page y limit deben ser mayores a 0');
            }
            if (limit > 500) {
                limit = 500;
            }
            const skip = (page - 1) * limit;
            const total = await this.prisma.auditoriaLog.count();
            const data = await this.prisma.auditoriaLog.findMany({
                skip,
                take: limit,
                include: {
                    usuario: {
                        select: {
                            id: true,
                            email: true,
                            nombres: true,
                            apellido_paterno: true,
                        },
                    },
                },
                orderBy: { fecha_hora: 'desc' },
            });
            const pages = Math.ceil(total / limit);
            this.logger.log(`Auditoría consultada: página ${page} de ${pages}`);
            return {
                data,
                total,
                page,
                limit,
                pages,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Error al obtener auditoría: ${error.message}`);
            }
            else {
                this.logger.error(`Error desconocido al obtener auditoría`);
            }
            throw error;
        }
    }
    async getById(id) {
        try {
            if (!id) {
                throw new common_1.BadRequestException('El ID es requerido');
            }
            const log = await this.prisma.auditoriaLog.findUnique({
                where: { id },
                include: {
                    usuario: {
                        select: {
                            id: true,
                            email: true,
                            nombres: true,
                            apellido_paterno: true,
                        },
                    },
                },
            });
            if (!log) {
                throw new common_1.NotFoundException(`Log de auditoría con ID ${id} no encontrado`);
            }
            return log;
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Error al obtener log por ID: ${error.message}`);
            }
            else {
                this.logger.error(`Error desconocido al obtener log por ID`);
            }
            throw error;
        }
    }
    async getByUser(userId, page = 1, limit = 50) {
        try {
            if (!userId) {
                throw new common_1.BadRequestException('El userId es requerido');
            }
            if (page < 1 || limit < 1) {
                throw new common_1.BadRequestException('Page y limit deben ser mayores a 0');
            }
            if (limit > 500) {
                limit = 500;
            }
            const skip = (page - 1) * limit;
            const usuario = await this.prisma.usuario.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    nombres: true,
                    apellido_paterno: true,
                },
            });
            if (!usuario) {
                throw new common_1.NotFoundException(`Usuario con ID ${userId} no encontrado`);
            }
            const total = await this.prisma.auditoriaLog.count({
                where: { usuario_id: userId },
            });
            const data = await this.prisma.auditoriaLog.findMany({
                where: { usuario_id: userId },
                skip,
                take: limit,
                include: {
                    usuario: {
                        select: {
                            id: true,
                            email: true,
                            nombres: true,
                            apellido_paterno: true,
                        },
                    },
                },
                orderBy: { fecha_hora: 'desc' },
            });
            this.logger.log(`Auditoría consultada para usuario ${usuario.email}`);
            return {
                data,
                total,
                page,
                limit,
                usuario,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Error al obtener logs por usuario: ${error.message}`);
            }
            else {
                this.logger.error(`Error desconocido al obtener logs por usuario`);
            }
            throw error;
        }
    }
    async getByAction(accion, page = 1, limit = 50) {
        try {
            if (!accion) {
                throw new common_1.BadRequestException('La acción es requerida');
            }
            if (page < 1 || limit < 1) {
                throw new common_1.BadRequestException('Page y limit deben ser mayores a 0');
            }
            if (limit > 500) {
                limit = 500;
            }
            const skip = (page - 1) * limit;
            const total = await this.prisma.auditoriaLog.count({
                where: { accion },
            });
            const data = await this.prisma.auditoriaLog.findMany({
                where: { accion },
                skip,
                take: limit,
                include: {
                    usuario: {
                        select: {
                            id: true,
                            email: true,
                            nombres: true,
                            apellido_paterno: true,
                        },
                    },
                },
                orderBy: { fecha_hora: 'desc' },
            });
            this.logger.log(`Auditoría consultada por acción: ${accion}`);
            return {
                data,
                total,
                page,
                limit,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Error al obtener logs por acción: ${error.message}`);
            }
            else {
                this.logger.error(`Error desconocido al obtener logs por acción`);
            }
            throw error;
        }
    }
    async getByModule(modulo, page = 1, limit = 50) {
        try {
            if (!modulo) {
                throw new common_1.BadRequestException('El módulo es requerido');
            }
            if (page < 1 || limit < 1) {
                throw new common_1.BadRequestException('Page y limit deben ser mayores a 0');
            }
            if (limit > 500) {
                limit = 500;
            }
            const skip = (page - 1) * limit;
            const total = await this.prisma.auditoriaLog.count({
                where: { modulo },
            });
            const data = await this.prisma.auditoriaLog.findMany({
                where: { modulo },
                skip,
                take: limit,
                include: {
                    usuario: {
                        select: {
                            id: true,
                            email: true,
                            nombres: true,
                            apellido_paterno: true,
                        },
                    },
                },
                orderBy: { fecha_hora: 'desc' },
            });
            this.logger.log(`Auditoría consultada por módulo: ${modulo}`);
            return {
                data,
                total,
                page,
                limit,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Error al obtener logs por módulo: ${error.message}`);
            }
            else {
                this.logger.error(`Error desconocido al obtener logs por módulo`);
            }
            throw error;
        }
    }
    async getByDateRange(desde, hasta, page = 1, limit = 50) {
        try {
            if (!desde || !hasta) {
                throw new common_1.BadRequestException('Desde y Hasta (fechas) son requeridas');
            }
            const desdeDate = new Date(desde);
            const hastaDate = new Date(hasta);
            if (desdeDate > hastaDate) {
                throw new common_1.BadRequestException('La fecha "desde" no puede ser mayor a "hasta"');
            }
            if (page < 1 || limit < 1) {
                throw new common_1.BadRequestException('Page y limit deben ser mayores a 0');
            }
            if (limit > 500) {
                limit = 500;
            }
            const skip = (page - 1) * limit;
            const total = await this.prisma.auditoriaLog.count({
                where: {
                    fecha_hora: {
                        gte: desdeDate,
                        lte: hastaDate,
                    },
                },
            });
            const data = await this.prisma.auditoriaLog.findMany({
                where: {
                    fecha_hora: {
                        gte: desdeDate,
                        lte: hastaDate,
                    },
                },
                skip,
                take: limit,
                include: {
                    usuario: {
                        select: {
                            id: true,
                            email: true,
                            nombres: true,
                            apellido_paterno: true,
                        },
                    },
                },
                orderBy: { fecha_hora: 'desc' },
            });
            this.logger.log(`Auditoría consultada entre ${desdeDate} y ${hastaDate}`);
            return {
                data,
                total,
                page,
                limit,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Error al obtener logs por rango de fechas: ${error.message}`);
            }
            else {
                this.logger.error(`Error desconocido al obtener logs por rango de fechas`);
            }
            throw error;
        }
    }
    async getStatistics() {
        try {
            const ahora = new Date();
            const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
            const hace7d = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
            const totalLogs = await this.prisma.auditoriaLog.count();
            const logsHoy = await this.prisma.auditoriaLog.count({
                where: {
                    fecha_hora: {
                        gte: hace24h,
                    },
                },
            });
            const logsEstaSemana = await this.prisma.auditoriaLog.count({
                where: {
                    fecha_hora: {
                        gte: hace7d,
                    },
                },
            });
            const accionesRaw = await this.prisma.auditoriaLog.groupBy({
                by: ['accion'],
                _count: {
                    id: true,
                },
                orderBy: {
                    _count: {
                        id: 'desc',
                    },
                },
                take: 5,
            });
            const accionesTop5 = accionesRaw.map((item) => ({
                accion: item.accion,
                cantidad: item._count.id,
            }));
            const usuariosTop5Raw = await this.prisma.$queryRaw `
        SELECT 
          u.email, 
          u.nombres, 
          COUNT(a.id) as cantidad
        FROM auditoria_logs a
        JOIN usuarios u ON a.usuario_id = u.id
        GROUP BY u.id, u.email, u.nombres
        ORDER BY cantidad DESC
        LIMIT 5
      `;
            const usuariosTop5 = usuariosTop5Raw.map((item) => ({
                email: item.email,
                nombres: item.nombres,
                cantidad: parseInt(item.cantidad),
            }));
            const modulosRaw = await this.prisma.auditoriaLog.groupBy({
                by: ['modulo'],
                _count: {
                    id: true,
                },
                orderBy: {
                    _count: {
                        id: 'desc',
                    },
                },
                take: 5,
            });
            const modulosTop5 = modulosRaw
                .filter((item) => item.modulo !== null)
                .map((item) => ({
                modulo: item.modulo || 'Sin módulo',
                cantidad: item._count.id,
            }));
            this.logger.log('Estadísticas de auditoría obtenidas');
            return {
                totalLogs,
                logsHoy,
                logsEstaSemana,
                accionesTop5,
                usuariosTop5,
                modulosTop5,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Error al obtener estadísticas: ${error.message}`);
            }
            else {
                this.logger.error(`Error desconocido al obtener estadísticas`);
            }
            throw error;
        }
    }
    async deleteOldLogs(daysOld = 90) {
        try {
            if (daysOld < 1) {
                throw new common_1.BadRequestException('daysOld debe ser mayor a 0');
            }
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - daysOld);
            const result = await this.prisma.auditoriaLog.deleteMany({
                where: {
                    fecha_hora: {
                        lt: fecha,
                    },
                },
            });
            this.logger.log(`${result.count} logs antiguos eliminados (más de ${daysOld} días)`);
            return {
                deletedCount: result.count,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Error al eliminar logs antiguos: ${error.message}`);
            }
            else {
                this.logger.error(`Error desconocido al eliminar logs antiguos`);
            }
            throw error;
        }
    }
    async exportLogsAsCSV(desde, hasta) {
        try {
            const desdeDate = new Date(desde);
            const hastaDate = new Date(hasta);
            if (desdeDate > hastaDate) {
                throw new common_1.BadRequestException('La fecha "desde" no puede ser mayor a "hasta"');
            }
            const logs = await this.prisma.auditoriaLog.findMany({
                where: {
                    fecha_hora: {
                        gte: desdeDate,
                        lte: hastaDate,
                    },
                },
                include: {
                    usuario: {
                        select: {
                            email: true,
                            nombres: true,
                        },
                    },
                },
                orderBy: { fecha_hora: 'asc' },
            });
            const headers = [
                'ID',
                'Usuario',
                'Email',
                'Acción',
                'Módulo',
                'Tabla',
                'Registro ID',
                'IP Origen',
                'Fecha/Hora',
            ];
            const rows = logs.map((log) => [
                log.id,
                log.usuario.nombres,
                log.usuario.email,
                log.accion,
                log.modulo || 'N/A',
                log.tabla_afectada || 'N/A',
                log.registro_id || 'N/A',
                log.ip_origen || 'N/A',
                log.fecha_hora.toISOString(),
            ]);
            const csv = [headers, ...rows]
                .map((row) => row.map((cell) => `"${cell}"`).join(','))
                .join('\n') + '\n';
            this.logger.log(`CSV exportado: ${logs.length} registros`);
            return csv;
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Error al exportar CSV: ${error.message}`);
            }
            else {
                this.logger.error(`Error desconocido al exportar CSV`);
            }
            throw error;
        }
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map