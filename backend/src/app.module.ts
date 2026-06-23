import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { DatabaseConfig } from './config/database.config';
import { envValidationSchema } from './config/env.validation';
import { UsersModule } from './modules/usuarios/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { ProductosModule } from './modules/productos/productos.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { VehiculosModule } from './modules/vehiculos/vehiculos.module';
import { RoutingModule } from './modules/routing/routing.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { BoletasModule } from './modules/boletas/boletas.module';
import { PerfilModule } from './modules/perfil/perfil.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditoriaInterceptor } from './common/interceptors/auditoria.interceptor';
import { ReabastecimientoModule } from './modules/reabastecimiento/reabastecimiento.module';
import { ProveedoresModule } from './modules/proveedores/proveedores.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    UsersModule,
    AuthModule,
    PrismaModule,
    AuditModule,
    TrackingModule,
    ProductosModule,
    ClientesModule,
    PedidosModule,
    VehiculosModule,
    RoutingModule,
    TrackingModule,
    ReportesModule,
    BoletasModule,
    PerfilModule,
    ReabastecimientoModule,
    ProveedoresModule,
    AuditoriaModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditoriaInterceptor,
    },
    DatabaseConfig,
  ],
  exports: [DatabaseConfig],
  controllers: [],
})
export class AppModule {}
