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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditoriaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const ExcelJS = __importStar(require("exceljs"));
const toInt = (v, fb = 0) => {
    const n = parseInt(String(v ?? fb), 10);
    return isNaN(n) ? fb : n;
};
const toBool = (v) => v === true || v === 'true' || v === 1;
let AuditoriaService = class AuditoriaService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query = {}) {
        const page = toInt(query.page, 1);
        const limit = toInt(query.limit, 25);
        const skip = (page - 1) * limit;
        const where = this.buildWhere(query);
        const [total, data] = await Promise.all([
            this.prisma.auditoriaLog.count({ where }),
            this.prisma.auditoriaLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { fecha_hora: 'desc' },
                include: {
                    usuario: {
                        select: {
                            id: true,
                            nombres: true,
                            apellido_paterno: true,
                            apellido_materno: true,
                            rol: { select: { nombre: true } },
                        },
                    },
                },
            }),
        ]);
        return {
            data: data.map(d => this.mapToResponse(d)),
            total,
            page,
            pages: Math.ceil(total / limit),
            limit,
        };
    }
    async findById(id) {
        const log = await this.prisma.auditoriaLog.findUnique({
            where: { id },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nombres: true,
                        apellido_paterno: true,
                        apellido_materno: true,
                        email: true,
                        rol: { select: { nombre: true } },
                    },
                },
            },
        });
        if (!log) {
            throw new common_1.NotFoundException(`Registro de auditoría ${id} no encontrado`);
        }
        return this.mapToResponseDetailed(log);
    }
    async getStats() {
        const inicioHoy = new Date();
        inicioHoy.setHours(0, 0, 0, 0);
        const hace90dias = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const [totalActivos, hoyCount, usuariosHoyRaw, porModulo] = await Promise.all([
            this.prisma.auditoriaLog.count({
                where: { fecha_hora: { gte: hace90dias } },
            }),
            this.prisma.auditoriaLog.count({
                where: { fecha_hora: { gte: inicioHoy } },
            }),
            this.prisma.auditoriaLog.findMany({
                where: { fecha_hora: { gte: inicioHoy } },
                select: { usuario_id: true },
                distinct: ['usuario_id'],
            }),
            this.prisma.auditoriaLog.groupBy({
                by: ['modulo'],
                where: { fecha_hora: { gte: hace90dias }, modulo: { not: null } },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 1,
            }),
        ]);
        return {
            total_periodo: totalActivos,
            acciones_hoy: hoyCount,
            usuarios_activos_hoy: usuariosHoyRaw.length,
            modulo_mas_activo: porModulo[0]?.modulo || '—',
            modulo_mas_activo_count: porModulo[0]?._count?.id || 0,
        };
    }
    async getFiltrosOpciones() {
        const [modulos, acciones, usuarios] = await Promise.all([
            this.prisma.auditoriaLog.findMany({
                select: { modulo: true },
                distinct: ['modulo'],
                where: { modulo: { not: null } },
                orderBy: { modulo: 'asc' },
            }),
            this.prisma.auditoriaLog.findMany({
                select: { accion: true },
                distinct: ['accion'],
                orderBy: { accion: 'asc' },
            }),
            this.prisma.auditoriaLog.findMany({
                select: { usuario_id: true },
                distinct: ['usuario_id'],
            }),
        ]);
        const usuariosIds = usuarios.map(u => u.usuario_id);
        const usuariosData = await this.prisma.usuario.findMany({
            where: { id: { in: usuariosIds } },
            select: {
                id: true,
                nombres: true,
                apellido_paterno: true,
                rol: { select: { nombre: true } },
            },
            orderBy: { nombres: 'asc' },
        });
        return {
            modulos: modulos.map(m => m.modulo).filter(Boolean),
            acciones: acciones.map(a => a.accion),
            usuarios: usuariosData.map(u => ({
                id: u.id,
                nombre: `${u.nombres} ${u.apellido_paterno}`,
                rol: u.rol?.nombre || '-',
            })),
        };
    }
    async exportExcel(query = {}) {
        const where = this.buildWhere(query);
        const data = await this.prisma.auditoriaLog.findMany({
            where,
            take: 10000,
            orderBy: { fecha_hora: 'desc' },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nombres: true,
                        apellido_paterno: true,
                        apellido_materno: true,
                        rol: { select: { nombre: true } },
                    },
                },
            },
        });
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'FenixBd';
        workbook.created = new Date();
        const sheet = workbook.addWorksheet('Auditoría');
        sheet.addRow(['Reporte de Auditoría — FenixBd']).font = { size: 16, bold: true };
        sheet.addRow([`Generado: ${new Date().toLocaleString('es-BO')}`]).font = {
            italic: true,
            color: { argb: 'FF64748B' },
        };
        sheet.addRow([`Total de registros: ${data.length}`]).font = { color: { argb: 'FF64748B' } };
        sheet.addRow([]);
        const headerRow = sheet.addRow([
            'Fecha/Hora', 'Usuario', 'Rol', 'Acción', 'Módulo',
            'Tabla', 'Registro ID', 'IP', 'Valor Anterior', 'Valor Nuevo',
        ]);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE11D48' },
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 22;
        const widths = [22, 28, 18, 14, 16, 18, 14, 18, 35, 35];
        widths.forEach((w, i) => sheet.getColumn(i + 1).width = w);
        for (const log of data) {
            const u = log.usuario;
            const nombre = u
                ? `${u.nombres} ${u.apellido_paterno} ${u.apellido_materno || ''}`.trim()
                : 'Desconocido';
            sheet.addRow([
                log.fecha_hora.toLocaleString('es-BO'),
                nombre,
                u?.rol?.nombre || '-',
                log.accion,
                log.modulo || '-',
                log.tabla_afectada || '-',
                log.registro_id || '-',
                log.ip_origen || '-',
                log.valor_anterior ? JSON.stringify(log.valor_anterior) : '',
                log.valor_nuevo ? JSON.stringify(log.valor_nuevo) : '',
            ]);
        }
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
    buildWhere(query) {
        const where = {};
        if (query.desde || query.hasta) {
            where.fecha_hora = {};
            if (query.desde)
                where.fecha_hora.gte = new Date(query.desde + 'T00:00:00');
            if (query.hasta)
                where.fecha_hora.lte = new Date(query.hasta + 'T23:59:59');
        }
        else if (!toBool(query.ver_todo)) {
            const hace90dias = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            where.fecha_hora = { gte: hace90dias };
        }
        if (query.usuario_id) {
            where.usuario_id = toInt(query.usuario_id);
        }
        if (query.modulo?.trim()) {
            where.modulo = query.modulo.trim();
        }
        if (query.accion?.trim()) {
            where.accion = query.accion.trim();
        }
        if (query.ip?.trim()) {
            where.ip_origen = { contains: query.ip.trim() };
        }
        if (query.buscar?.trim()) {
            const q = query.buscar.trim();
            where.OR = [
                { tabla_afectada: { contains: q, mode: 'insensitive' } },
                { registro_id: { contains: q, mode: 'insensitive' } },
            ];
        }
        return where;
    }
    mapToResponse(log) {
        const u = log.usuario;
        return {
            id: log.id,
            usuario_id: log.usuario_id,
            usuario_nombre: u
                ? `${u.nombres} ${u.apellido_paterno}`.trim()
                : 'Desconocido',
            usuario_rol: u?.rol?.nombre || '-',
            accion: log.accion,
            modulo: log.modulo,
            tabla_afectada: log.tabla_afectada,
            registro_id: log.registro_id,
            ip_origen: log.ip_origen,
            fecha_hora: log.fecha_hora,
        };
    }
    mapToResponseDetailed(log) {
        const u = log.usuario;
        return {
            id: log.id,
            sesion_id: log.sesion_id,
            usuario: u
                ? {
                    id: u.id,
                    nombre: `${u.nombres} ${u.apellido_paterno} ${u.apellido_materno || ''}`.trim(),
                    email: u.email,
                    rol: u.rol?.nombre || '-',
                }
                : null,
            accion: log.accion,
            modulo: log.modulo,
            tabla_afectada: log.tabla_afectada,
            registro_id: log.registro_id,
            valor_anterior: log.valor_anterior,
            valor_nuevo: log.valor_nuevo,
            ip_origen: log.ip_origen,
            user_agent: log.user_agent,
            dispositivo: log.dispositivo,
            navegador: log.navegador,
            fecha_hora: log.fecha_hora,
        };
    }
};
exports.AuditoriaService = AuditoriaService;
exports.AuditoriaService = AuditoriaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditoriaService);
//# sourceMappingURL=auditoria.service.js.map