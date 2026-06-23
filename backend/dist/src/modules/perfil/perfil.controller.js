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
exports.PerfilController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const perfil_service_1 = require("./perfil.service");
let PerfilController = class PerfilController {
    perfilService;
    constructor(perfilService) {
        this.perfilService = perfilService;
    }
    getMi(req) {
        return this.perfilService.getMi(req.user.id);
    }
    actualizar(req, dto) {
        return this.perfilService.actualizarDatos(req.user.id, dto);
    }
    cambiarPassword(req, dto) {
        return this.perfilService.cambiarPassword(req.user.id, dto);
    }
    subirAvatar(req, archivo) {
        return this.perfilService.actualizarAvatar(req.user.id, archivo);
    }
    eliminarAvatar(req) {
        return this.perfilService.eliminarAvatar(req.user.id);
    }
    cerrarSesiones(req) {
        return this.perfilService.cerrarTodasLasSesiones(req.user.id);
    }
};
exports.PerfilController = PerfilController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PerfilController.prototype, "getMi", null);
__decorate([
    (0, common_1.Patch)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PerfilController.prototype, "actualizar", null);
__decorate([
    (0, common_1.Post)('password'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PerfilController.prototype, "cambiarPassword", null);
__decorate([
    (0, common_1.Post)('avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('avatar')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PerfilController.prototype, "subirAvatar", null);
__decorate([
    (0, common_1.Delete)('avatar'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PerfilController.prototype, "eliminarAvatar", null);
__decorate([
    (0, common_1.Post)('cerrar-sesiones'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PerfilController.prototype, "cerrarSesiones", null);
exports.PerfilController = PerfilController = __decorate([
    (0, common_1.Controller)('perfil'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [perfil_service_1.PerfilService])
], PerfilController);
//# sourceMappingURL=perfil.controller.js.map