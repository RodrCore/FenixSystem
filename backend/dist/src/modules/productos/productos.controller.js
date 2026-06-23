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
exports.ProductosController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const decorators_1 = require("../auth/decorators");
const productos_service_1 = require("./productos.service");
let ProductosController = class ProductosController {
    productosService;
    constructor(productosService) {
        this.productosService = productosService;
    }
    getStats() {
        return this.productosService.getStats();
    }
    getCategorias() {
        return this.productosService.getCategorias();
    }
    getPresentaciones() {
        return this.productosService.getPresentaciones();
    }
    getProveedores() {
        return this.productosService.getProveedores();
    }
    updateLoteEstado(loteId, estado) {
        return this.productosService.updateLoteEstado(loteId, estado);
    }
    addLote(dto) {
        return this.productosService.addLote(dto);
    }
    updatePresentacion(ppId, dto) {
        return this.productosService.updatePresentacion(ppId, dto);
    }
    findAll(query) {
        return this.productosService.findAll(query);
    }
    findOne(id) {
        return this.productosService.findOne(id);
    }
    create(dto) {
        return this.productosService.create(dto);
    }
    update(id, dto) {
        return this.productosService.update(id, dto);
    }
    toggle(id, activo) {
        return this.productosService.toggleActive(id, activo);
    }
    addPresentacion(id, dto) {
        return this.productosService.addPresentacion(id, dto);
    }
};
exports.ProductosController = ProductosController;
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('categorias'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "getCategorias", null);
__decorate([
    (0, common_1.Get)('presentaciones'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "getPresentaciones", null);
__decorate([
    (0, common_1.Get)('proveedores'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "getProveedores", null);
__decorate([
    (0, common_1.Patch)('lotes/:loteId/estado'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'ALMACEN'),
    __param(0, (0, common_1.Param)('loteId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('estado')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "updateLoteEstado", null);
__decorate([
    (0, common_1.Post)('lotes'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "addLote", null);
__decorate([
    (0, common_1.Patch)('presentaciones/:ppId'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN'),
    __param(0, (0, common_1.Param)('ppId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "updatePresentacion", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/toggle'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('activo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Boolean]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "toggle", null);
__decorate([
    (0, common_1.Post)(':id/presentaciones'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "addPresentacion", null);
exports.ProductosController = ProductosController = __decorate([
    (0, common_1.Controller)('productos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [productos_service_1.ProductosService])
], ProductosController);
//# sourceMappingURL=productos.controller.js.map