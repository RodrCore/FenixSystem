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
exports.PedidosController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const decorators_1 = require("../auth/decorators");
const pedidos_service_1 = require("./pedidos.service");
const common_2 = require("@nestjs/common");
let PedidosController = class PedidosController {
    pedidosService;
    constructor(pedidosService) {
        this.pedidosService = pedidosService;
    }
    getStats() {
        return this.pedidosService.getStats();
    }
    getDashboard(req) {
        return this.pedidosService.getDashboardVendedor(req.user.id);
    }
    getDashboardRepartidor(req) {
        return this.pedidosService.getDashboardRepartidor(req.user.id);
    }
    getMisEntregas(req) {
        return this.pedidosService.getMisEntregas(req.user.id);
    }
    findAll(query, req) {
        return this.pedidosService.findAll(query, req.user.id, req.user.rol);
    }
    create(dto, req) {
        return this.pedidosService.create(dto, req.user.id);
    }
    update(id, dto, req) {
        return this.pedidosService.update(id, dto, req.user.id, req.user.rol);
    }
    cambiarEstado(id, estado, req) {
        return this.pedidosService.cambiarEstado(id, estado, req.user.id);
    }
    entregar(id, dto, req) {
        return this.pedidosService.entregar(id, req.user.id, dto);
    }
    cancelar(id, motivo, req) {
        return this.pedidosService.cancelar(id, motivo, req.user.id, req.user.rol);
    }
    softDelete(id, motivo, req) {
        return this.pedidosService.softDelete(id, req.user.id, motivo, req.user.rol);
    }
    async marcarListoCarga(id, req) {
        return this.pedidosService.cambiarAListoCarga(id, req.user.id);
    }
    restore(id, req) {
        return this.pedidosService.restore(id, req.user.rol);
    }
    marcarDevolucion(id, motivo, req) {
        return this.pedidosService.marcarDevolucion(id, motivo, req.user.id, req.user.rol);
    }
    findOne(id) {
        return this.pedidosService.findOne(id);
    }
    getEntregasRecientes() {
        return this.pedidosService.getEntregasRecientes(5);
    }
};
exports.PedidosController = PedidosController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('dashboard-vendedor'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('dashboard-repartidor'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'REPARTIDOR'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "getDashboardRepartidor", null);
__decorate([
    (0, common_1.Get)('mis-entregas'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'REPARTIDOR'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "getMisEntregas", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA', 'REPARTIDOR'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA', 'REPARTIDOR'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/estado'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('estado')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "cambiarEstado", null);
__decorate([
    (0, common_1.Patch)(':id/entregar'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'REPARTIDOR'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "entregar", null);
__decorate([
    (0, common_1.Patch)(':id/cancelar'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('motivo')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "cancelar", null);
__decorate([
    (0, common_2.Delete)(':id'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('motivo')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "softDelete", null);
__decorate([
    (0, common_1.Patch)(':id/listo-carga'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'ALMACEN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PedidosController.prototype, "marcarListoCarga", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "restore", null);
__decorate([
    (0, common_1.Patch)(':id/devolver'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'REPARTIDOR'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('motivo')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "marcarDevolucion", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('entregas-recientes'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "getEntregasRecientes", null);
exports.PedidosController = PedidosController = __decorate([
    (0, common_1.Controller)('pedidos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [pedidos_service_1.PedidosService])
], PedidosController);
//# sourceMappingURL=pedidos.controller.js.map