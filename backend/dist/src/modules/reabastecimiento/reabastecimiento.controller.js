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
exports.ReabastecimientoController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const decorators_1 = require("../auth/decorators");
const reabastecimiento_service_1 = require("./reabastecimiento.service");
const reabastecimiento_pdf_service_1 = require("./reabastecimiento-pdf.service");
let ReabastecimientoController = class ReabastecimientoController {
    svc;
    pdfSvc;
    constructor(svc, pdfSvc) {
        this.svc = svc;
        this.pdfSvc = pdfSvc;
    }
    getStats() {
        return this.svc.getStats();
    }
    getSugerencias() {
        return this.svc.getSugerenciasBajoStock();
    }
    findAll(query) {
        return this.svc.findAll(query);
    }
    findOne(id) {
        return this.svc.findOne(id);
    }
    async descargarPdf(id, res) {
        const orden = await this.svc.findOne(id);
        const pdf = await this.pdfSvc.generar(orden);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${orden.numero_orden}.pdf"`,
            'Content-Length': pdf.length,
        });
        res.send(pdf);
    }
    create(dto, req) {
        return this.svc.create(dto, req.user.id, req.user.rol);
    }
    recibir(id, detalles, req) {
        return this.svc.recibir(id, detalles, req.user.id, req.user.rol);
    }
    cancelar(id, motivo, req) {
        return this.svc.cancelar(id, motivo, req.user.id, req.user.rol);
    }
    softDelete(id, motivo, req) {
        return this.svc.softDelete(id, motivo, req.user.id, req.user.rol);
    }
};
exports.ReabastecimientoController = ReabastecimientoController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReabastecimientoController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('sugerencias-bajo-stock'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReabastecimientoController.prototype, "getSugerencias", null);
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReabastecimientoController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ReabastecimientoController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ReabastecimientoController.prototype, "descargarPdf", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'ALMACEN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ReabastecimientoController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/recibir'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'ALMACEN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('detalles')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Array, Object]),
    __metadata("design:returntype", void 0)
], ReabastecimientoController.prototype, "recibir", null);
__decorate([
    (0, common_1.Patch)(':id/cancelar'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('motivo')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", void 0)
], ReabastecimientoController.prototype, "cancelar", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('motivo')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", void 0)
], ReabastecimientoController.prototype, "softDelete", null);
exports.ReabastecimientoController = ReabastecimientoController = __decorate([
    (0, common_1.Controller)('reabastecimiento'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [reabastecimiento_service_1.ReabastecimientoService,
        reabastecimiento_pdf_service_1.ReabastecimientoPdfService])
], ReabastecimientoController);
//# sourceMappingURL=reabastecimiento.controller.js.map