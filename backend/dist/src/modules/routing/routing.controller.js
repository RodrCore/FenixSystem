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
exports.RoutingController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const osrm_service_1 = require("./osrm.service");
let RoutingController = class RoutingController {
    osrm;
    constructor(osrm) {
        this.osrm = osrm;
    }
    optimizar(dto) {
        if (!dto.origen?.lat || !dto.origen?.lng) {
            throw new common_1.BadRequestException('Origen inválido');
        }
        if (!Array.isArray(dto.paradas) || dto.paradas.length === 0) {
            throw new common_1.BadRequestException('Paradas requeridas');
        }
        return this.osrm.optimizarRuta(dto.origen, dto.paradas);
    }
    ruta(dto) {
        return this.osrm.rutaSimple(dto.origen, dto.destino);
    }
};
exports.RoutingController = RoutingController;
__decorate([
    (0, common_1.Post)('optimizar'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RoutingController.prototype, "optimizar", null);
__decorate([
    (0, common_1.Post)('ruta'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RoutingController.prototype, "ruta", null);
exports.RoutingController = RoutingController = __decorate([
    (0, common_1.Controller)('routing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [osrm_service_1.OsrmService])
], RoutingController);
//# sourceMappingURL=routing.controller.js.map