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
exports.ReportesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const reportes_service_1 = require("./reportes.service");
let ReportesController = class ReportesController {
    reportes;
    constructor(reportes) {
        this.reportes = reportes;
    }
    async dataPreventista(q, req) {
        this.validarMesAnio(q.mes, q.anio);
        if (!['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA'].includes(req.user.rol)) {
            throw new common_1.ForbiddenException();
        }
        return this.reportes.getReportePreventista(req.user.id, parseInt(q.mes, 10), parseInt(q.anio, 10));
    }
    async pdfPreventista(q, req, res) {
        this.validarMesAnio(q.mes, q.anio);
        const buffer = await this.reportes.generarPDFPreventista(req.user.id, parseInt(q.mes, 10), parseInt(q.anio, 10));
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="reporte-ventas-${q.mes}-${q.anio}.pdf"`,
        }).end(buffer);
    }
    async dataRepartidor(q, req) {
        this.validarMesAnio(q.mes, q.anio);
        if (!['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'REPARTIDOR'].includes(req.user.rol)) {
            throw new common_1.ForbiddenException();
        }
        return this.reportes.getReporteRepartidor(req.user.id, parseInt(q.mes, 10), parseInt(q.anio, 10));
    }
    async pdfRepartidor(q, req, res) {
        this.validarMesAnio(q.mes, q.anio);
        const buffer = await this.reportes.generarPDFRepartidor(req.user.id, parseInt(q.mes, 10), parseInt(q.anio, 10));
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="reporte-entregas-${q.mes}-${q.anio}.pdf"`,
        }).end(buffer);
    }
    validarMesAnio(mes, anio) {
        const m = parseInt(mes, 10);
        const a = parseInt(anio, 10);
        if (isNaN(m) || m < 1 || m > 12)
            throw new common_1.BadRequestException('Mes inválido (1-12)');
        if (isNaN(a) || a < 2020 || a > 2100)
            throw new common_1.BadRequestException('Año inválido');
    }
};
exports.ReportesController = ReportesController;
__decorate([
    (0, common_1.Get)('preventista'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportesController.prototype, "dataPreventista", null);
__decorate([
    (0, common_1.Get)('preventista/pdf'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportesController.prototype, "pdfPreventista", null);
__decorate([
    (0, common_1.Get)('repartidor'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportesController.prototype, "dataRepartidor", null);
__decorate([
    (0, common_1.Get)('repartidor/pdf'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportesController.prototype, "pdfRepartidor", null);
exports.ReportesController = ReportesController = __decorate([
    (0, common_1.Controller)('reportes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [reportes_service_1.ReportesService])
], ReportesController);
//# sourceMappingURL=reportes.controller.js.map