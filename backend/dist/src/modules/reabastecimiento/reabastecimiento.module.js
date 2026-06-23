"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReabastecimientoModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const reabastecimiento_controller_1 = require("./reabastecimiento.controller");
const reabastecimiento_service_1 = require("./reabastecimiento.service");
const reabastecimiento_pdf_service_1 = require("./reabastecimiento-pdf.service");
let ReabastecimientoModule = class ReabastecimientoModule {
};
exports.ReabastecimientoModule = ReabastecimientoModule;
exports.ReabastecimientoModule = ReabastecimientoModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [reabastecimiento_controller_1.ReabastecimientoController],
        providers: [reabastecimiento_service_1.ReabastecimientoService, reabastecimiento_pdf_service_1.ReabastecimientoPdfService],
        exports: [reabastecimiento_service_1.ReabastecimientoService],
    })
], ReabastecimientoModule);
//# sourceMappingURL=reabastecimiento.module.js.map