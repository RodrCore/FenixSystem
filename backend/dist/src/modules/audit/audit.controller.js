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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("./audit.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const decorators_1 = require("../auth/decorators");
let AuditController = class AuditController {
    auditService;
    constructor(auditService) {
        this.auditService = auditService;
    }
    async getAll(page = 1, limit = 50) {
        return this.auditService.getAll(page, limit);
    }
    async getById(id) {
        if (!id) {
            throw new common_1.BadRequestException('El ID es requerido');
        }
        return this.auditService.getById(id);
    }
    async getByUser(userId, page = 1, limit = 50) {
        return this.auditService.getByUser(userId, page, limit);
    }
    async getByAction(accion, page = 1, limit = 50) {
        if (!accion) {
            throw new common_1.BadRequestException('La acción es requerida');
        }
        return this.auditService.getByAction(accion, page, limit);
    }
    async getByModule(modulo, page = 1, limit = 50) {
        if (!modulo) {
            throw new common_1.BadRequestException('El módulo es requerido');
        }
        return this.auditService.getByModule(modulo, page, limit);
    }
    async getByDateRange(desde, hasta, page = 1, limit = 50) {
        if (!desde || !hasta) {
            throw new common_1.BadRequestException('Los parámetros "desde" y "hasta" son requeridos (YYYY-MM-DD)');
        }
        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);
        if (isNaN(desdeDate.getTime()) || isNaN(hastaDate.getTime())) {
            throw new common_1.BadRequestException('Las fechas deben ser válidas (formato: YYYY-MM-DD)');
        }
        return this.auditService.getByDateRange(desdeDate, hastaDate, page, limit);
    }
    async getStatistics() {
        return this.auditService.getStatistics();
    }
    async exportCSV(desde, hasta, res) {
        if (!desde || !hasta) {
            throw new common_1.BadRequestException('Los parámetros "desde" y "hasta" son requeridos (YYYY-MM-DD)');
        }
        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);
        if (isNaN(desdeDate.getTime()) || isNaN(hastaDate.getTime())) {
            throw new common_1.BadRequestException('Las fechas deben ser válidas (formato: YYYY-MM-DD)');
        }
        const csv = await this.auditService.exportLogsAsCSV(desdeDate, hastaDate);
        const timestamp = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${timestamp}.csv"`);
        res.send(csv);
    }
    async deleteOldLogs(days = 90) {
        if (days < 1) {
            throw new common_1.BadRequestException('Days debe ser mayor a 0');
        }
        return this.auditService.deleteOldLogs(days);
    }
};
exports.AuditController = AuditController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(1, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getById", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getByUser", null);
__decorate([
    (0, common_1.Get)('action/:action'),
    __param(0, (0, common_1.Param)('action')),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getByAction", null);
__decorate([
    (0, common_1.Get)('module/:module'),
    __param(0, (0, common_1.Param)('module')),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getByModule", null);
__decorate([
    (0, common_1.Get)('date-range'),
    __param(0, (0, common_1.Query)('desde')),
    __param(1, (0, common_1.Query)('hasta')),
    __param(2, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getByDateRange", null);
__decorate([
    (0, common_1.Get)('stats/summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('export/csv'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)('desde')),
    __param(1, (0, common_1.Query)('hasta')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "exportCSV", null);
__decorate([
    (0, common_1.Delete)('cleanup'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)('days', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "deleteOldLogs", null);
exports.AuditController = AuditController = __decorate([
    (0, common_1.Controller)('audit-logs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('SUPER_ADMIN'),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditController);
//# sourceMappingURL=audit.controller.js.map