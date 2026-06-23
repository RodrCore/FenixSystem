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
exports.ProveedoresController = void 0;
const common_1 = require("@nestjs/common");
const proveedores_service_1 = require("./proveedores.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const decorators_1 = require("../auth/decorators");
let ProveedoresController = class ProveedoresController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    async findAll(query) {
        return this.svc.findAll(query);
    }
    async getStats() {
        return this.svc.getStatistics();
    }
    async findById(id) {
        return this.svc.findById(id);
    }
    async create(dto) {
        if (!dto.razon_social?.trim()) {
            throw new common_1.BadRequestException('La razón social es obligatoria');
        }
        return this.svc.create(dto);
    }
    async update(id, dto) {
        return this.svc.update(id, dto);
    }
    async toggleActive(id, activo) {
        if (typeof activo !== 'boolean') {
            throw new common_1.BadRequestException('El campo "activo" debe ser boolean');
        }
        return this.svc.toggleActive(id, activo);
    }
    async softDelete(id, motivo, req) {
        return this.svc.softDelete(id, motivo, req.user.id, req.user.rol);
    }
    async restore(id, req) {
        return this.svc.restore(id, req.user.rol);
    }
};
exports.ProveedoresController = ProveedoresController;
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'ALMACEN', 'GERENTE'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProveedoresController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'ALMACEN', 'GERENTE'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProveedoresController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'ALMACEN', 'GERENTE'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProveedoresController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'ALMACEN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProveedoresController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'ALMACEN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ProveedoresController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/toggle-active'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'ALMACEN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('activo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Boolean]),
    __metadata("design:returntype", Promise)
], ProveedoresController.prototype, "toggleActive", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('motivo')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], ProveedoresController.prototype, "softDelete", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, decorators_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ProveedoresController.prototype, "restore", null);
exports.ProveedoresController = ProveedoresController = __decorate([
    (0, common_1.Controller)('proveedores'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [proveedores_service_1.ProveedoresService])
], ProveedoresController);
//# sourceMappingURL=proveedores.controller.js.map