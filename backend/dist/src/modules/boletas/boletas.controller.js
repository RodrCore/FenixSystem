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
exports.BoletasController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const decorators_1 = require("../auth/decorators");
const boletas_service_1 = require("./boletas.service");
let BoletasController = class BoletasController {
    boletasService;
    constructor(boletasService) {
        this.boletasService = boletasService;
    }
    async generar(id, req, res) {
        const { buffer, filename } = await this.boletasService.generarBoletaPDF(id, req.user.id, req.user.rol);
        res
            .status(200)
            .set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${filename}"`,
            'Content-Length': buffer.length.toString(),
        })
            .end(buffer);
    }
};
exports.BoletasController = BoletasController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], BoletasController.prototype, "generar", null);
exports.BoletasController = BoletasController = __decorate([
    (0, common_1.Controller)('boletas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [boletas_service_1.BoletasService])
], BoletasController);
//# sourceMappingURL=boletas.controller.js.map