"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const database_config_1 = require("./config/database.config");
const env_validation_1 = require("./config/env.validation");
const users_module_1 = require("./modules/usuarios/users.module");
const auth_module_1 = require("./modules/auth/auth.module");
const audit_module_1 = require("./modules/audit/audit.module");
const tracking_module_1 = require("./modules/tracking/tracking.module");
const productos_module_1 = require("./modules/productos/productos.module");
const clientes_module_1 = require("./modules/clientes/clientes.module");
const pedidos_module_1 = require("./modules/pedidos/pedidos.module");
const vehiculos_module_1 = require("./modules/vehiculos/vehiculos.module");
const routing_module_1 = require("./modules/routing/routing.module");
const reportes_module_1 = require("./modules/reportes/reportes.module");
const boletas_module_1 = require("./modules/boletas/boletas.module");
const perfil_module_1 = require("./modules/perfil/perfil.module");
const core_1 = require("@nestjs/core");
const auditoria_interceptor_1 = require("./common/interceptors/auditoria.interceptor");
const reabastecimiento_module_1 = require("./modules/reabastecimiento/reabastecimiento.module");
const proveedores_module_1 = require("./modules/proveedores/proveedores.module");
const auditoria_module_1 = require("./modules/auditoria/auditoria.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: env_validation_1.envValidationSchema,
                envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
            }),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            prisma_module_1.PrismaModule,
            audit_module_1.AuditModule,
            tracking_module_1.TrackingModule,
            productos_module_1.ProductosModule,
            clientes_module_1.ClientesModule,
            pedidos_module_1.PedidosModule,
            vehiculos_module_1.VehiculosModule,
            routing_module_1.RoutingModule,
            tracking_module_1.TrackingModule,
            reportes_module_1.ReportesModule,
            boletas_module_1.BoletasModule,
            perfil_module_1.PerfilModule,
            reabastecimiento_module_1.ReabastecimientoModule,
            proveedores_module_1.ProveedoresModule,
            auditoria_module_1.AuditoriaModule,
            dashboard_module_1.DashboardModule,
        ],
        providers: [
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: auditoria_interceptor_1.AuditoriaInterceptor,
            },
            database_config_1.DatabaseConfig,
        ],
        exports: [database_config_1.DatabaseConfig],
        controllers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map