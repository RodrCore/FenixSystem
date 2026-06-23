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
exports.ReportesAdminController = void 0;
const common_1 = require("@nestjs/common");
const reportes_admin_service_1 = require("./reportes-admin.service");
const excel_exporter_service_1 = require("./excel-exporter.service");
const pdf_exporter_service_1 = require("./pdf-exporter.service");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const decorators_1 = require("../../auth/decorators");
let ReportesAdminController = class ReportesAdminController {
    svc;
    excelExporter;
    pdfExporter;
    constructor(svc, excelExporter, pdfExporter) {
        this.svc = svc;
        this.excelExporter = excelExporter;
        this.pdfExporter = pdfExporter;
    }
    getVentas(query) {
        return this.svc.getVentas(query);
    }
    getPedidos(query) {
        return this.svc.getPedidos(query);
    }
    getReabastecimientos(query) {
        return this.svc.getReabastecimientos(query);
    }
    getInventario(query) {
        return this.svc.getInventario(query);
    }
    getComercial(query) {
        return this.svc.getComercial(query);
    }
    getClientes(query) {
        return this.svc.getClientes(query);
    }
    async exportar(seccion, query, res) {
        const formato = (query.formato || 'excel').toLowerCase();
        let data;
        switch (seccion) {
            case 'ventas':
                data = await this.svc.getVentas(query);
                break;
            case 'pedidos':
                data = await this.svc.getPedidos(query);
                break;
            case 'reabastecimientos':
                data = await this.svc.getReabastecimientos(query);
                break;
            case 'inventario':
                data = await this.svc.getInventario(query);
                break;
            case 'comercial':
                data = await this.svc.getComercial(query);
                break;
            case 'clientes':
                data = await this.svc.getClientes(query);
                break;
            default:
                throw new common_1.HttpException(`Sección '${seccion}' inválida`, common_1.HttpStatus.BAD_REQUEST);
        }
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `reporte_${seccion}_${timestamp}`;
        if (formato === 'excel') {
            const buffer = await this.excelExporter.exportar(seccion, data);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
            res.send(buffer);
        }
        else if (formato === 'pdf') {
            const buffer = await this.pdfExporter.exportar(seccion, data);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
            res.send(buffer);
        }
        else {
            throw new common_1.HttpException(`Formato '${formato}' no soportado. Usa 'excel' o 'pdf'.`, common_1.HttpStatus.BAD_REQUEST);
        }
    }
};
exports.ReportesAdminController = ReportesAdminController;
__decorate([
    (0, common_1.Get)('ventas'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportesAdminController.prototype, "getVentas", null);
__decorate([
    (0, common_1.Get)('pedidos'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportesAdminController.prototype, "getPedidos", null);
__decorate([
    (0, common_1.Get)('reabastecimientos'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportesAdminController.prototype, "getReabastecimientos", null);
__decorate([
    (0, common_1.Get)('inventario'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportesAdminController.prototype, "getInventario", null);
__decorate([
    (0, common_1.Get)('comercial'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportesAdminController.prototype, "getComercial", null);
__decorate([
    (0, common_1.Get)('clientes'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportesAdminController.prototype, "getClientes", null);
__decorate([
    (0, common_1.Get)(':seccion/export'),
    __param(0, (0, common_1.Param)('seccion')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportesAdminController.prototype, "exportar", null);
exports.ReportesAdminController = ReportesAdminController = __decorate([
    (0, common_1.Controller)('reportes-admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE'),
    __metadata("design:paramtypes", [reportes_admin_service_1.ReportesAdminService,
        excel_exporter_service_1.ExcelExporterService,
        pdf_exporter_service_1.PdfExporterService])
], ReportesAdminController);
//# sourceMappingURL=reportes-admin.controller.js.map