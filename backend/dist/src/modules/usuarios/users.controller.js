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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("./user.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const decorators_1 = require("../auth/decorators");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async findAll(query) {
        return this.usersService.findAll(query);
    }
    async getStats() {
        return this.usersService.getStatistics();
    }
    async getStatistics() {
        return this.usersService.getStatistics();
    }
    async listRoles() {
        return this.usersService.listRoles();
    }
    getRepartidores() {
        return this.usersService.getRepartidores();
    }
    async findByEmail(email) {
        if (!email)
            throw new common_1.BadRequestException('El email es requerido');
        return this.usersService.findByEmail(email);
    }
    async findByRole(rolNombre) {
        if (!rolNombre)
            throw new common_1.BadRequestException('El nombre del rol es requerido');
        return this.usersService.findByRole(rolNombre);
    }
    async findById(id) {
        return this.usersService.findById(id);
    }
    async createUser(createUserDto, req) {
        if (!createUserDto.rol_id) {
            throw new common_1.BadRequestException('El rol_id es requerido');
        }
        return this.usersService.createUser(createUserDto);
    }
    async createAdmin(createAdminDto) {
        return this.usersService.createAdmin(createAdminDto);
    }
    async update(id, updateUserDto, req) {
        return this.usersService.update(id, updateUserDto, req.user.rol, req.user.id);
    }
    async toggleActive(id, estado, req) {
        if (typeof estado !== 'boolean') {
            throw new common_1.BadRequestException('El campo "estado" debe ser boolean');
        }
        return this.usersService.toggleActive(id, estado, req.user.rol, req.user.id);
    }
    async changeRole(userId, rolId) {
        if (!userId || !rolId) {
            throw new common_1.BadRequestException('userId y rolId son requeridos');
        }
        return this.usersService.changeRole(userId, rolId);
    }
    async resetPassword(id, req) {
        return this.usersService.resetPassword(id, req.user.rol);
    }
    async softDelete(id, motivo, req) {
        return this.usersService.softDelete(id, motivo, req.user.id, req.user.rol);
    }
    async restore(id, req) {
        return this.usersService.restore(id, req.user.rol);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, decorators_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('stats/all'),
    (0, decorators_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('roles'),
    (0, decorators_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "listRoles", null);
__decorate([
    (0, common_1.Get)('repartidores'),
    (0, decorators_1.Roles)('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getRepartidores", null);
__decorate([
    (0, common_1.Get)('email/:email'),
    (0, decorators_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findByEmail", null);
__decorate([
    (0, common_1.Get)('rol/:rolNombre'),
    (0, decorators_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('rolNombre')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findByRole", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, decorators_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, decorators_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createUser", null);
__decorate([
    (0, common_1.Post)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, decorators_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createAdmin", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorators_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/toggle-active'),
    (0, decorators_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('estado')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Boolean, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "toggleActive", null);
__decorate([
    (0, common_1.Patch)(':id/change-role'),
    (0, decorators_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('rolId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "changeRole", null);
__decorate([
    (0, common_1.Post)(':id/reset-password'),
    (0, decorators_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('motivo')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "softDelete", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, decorators_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "restore", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [user_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map