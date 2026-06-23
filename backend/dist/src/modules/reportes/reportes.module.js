"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportesModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const reportes_service_1 = require("./reportes.service");
const reportes_controller_1 = require("./reportes.controller");
const reportes_admin_controller_1 = require("./admin/reportes-admin.controller");
const reportes_admin_service_1 = require("./admin/reportes-admin.service");
const excel_exporter_service_1 = require("./admin/excel-exporter.service");
const pdf_exporter_service_1 = require("./admin/pdf-exporter.service");
let ReportesModule = class ReportesModule {
};
exports.ReportesModule = ReportesModule;
exports.ReportesModule = ReportesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [
            reportes_controller_1.ReportesController,
            reportes_admin_controller_1.ReportesAdminController,
        ],
        providers: [
            reportes_service_1.ReportesService,
            reportes_admin_service_1.ReportesAdminService,
            excel_exporter_service_1.ExcelExporterService,
            pdf_exporter_service_1.PdfExporterService,
        ],
    })
], ReportesModule);
//# sourceMappingURL=reportes.module.js.map