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
exports.AuditoriaController = void 0;
const common_1 = require("@nestjs/common");
const auditoria_service_1 = require("./auditoria.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const decorators_1 = require("../auth/decorators");
let AuditoriaController = class AuditoriaController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    async findAll(query) {
        return this.svc.findAll(query);
    }
    async getStats() {
        return this.svc.getStats();
    }
    async getFiltrosOpciones() {
        return this.svc.getFiltrosOpciones();
    }
    async export(query, res) {
        const buffer = await this.svc.exportExcel(query);
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `auditoria_${timestamp}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    async findById(id) {
        return this.svc.findById(id);
    }
};
exports.AuditoriaController = AuditoriaController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuditoriaController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuditoriaController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('filtros/opciones'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuditoriaController.prototype, "getFiltrosOpciones", null);
__decorate([
    (0, common_1.Get)('export'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuditoriaController.prototype, "export", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuditoriaController.prototype, "findById", null);
exports.AuditoriaController = AuditoriaController = __decorate([
    (0, common_1.Controller)('auditoria'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('SUPER_ADMIN'),
    __metadata("design:paramtypes", [auditoria_service_1.AuditoriaService])
], AuditoriaController);
//# sourceMappingURL=auditoria.controller.js.map