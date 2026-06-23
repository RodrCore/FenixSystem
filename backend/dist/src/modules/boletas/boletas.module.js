"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoletasModule = void 0;
const common_1 = require("@nestjs/common");
const boletas_service_1 = require("./boletas.service");
const boletas_controller_1 = require("./boletas.controller");
const prisma_module_1 = require("../../prisma/prisma.module");
let BoletasModule = class BoletasModule {
};
exports.BoletasModule = BoletasModule;
exports.BoletasModule = BoletasModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [boletas_controller_1.BoletasController],
        providers: [boletas_service_1.BoletasService],
        exports: [boletas_service_1.BoletasService],
    })
], BoletasModule);
//# sourceMappingURL=boletas.module.js.map