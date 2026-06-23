import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
 
// ─── Móvil (existente) ───
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
 
// ─── Web admin (nuevo) ───
import { ReportesAdminController } from './admin/reportes-admin.controller';
import { ReportesAdminService } from './admin/reportes-admin.service';
import { ExcelExporterService } from './admin/excel-exporter.service';
import { PdfExporterService } from './admin/pdf-exporter.service';
 
@Module({
  imports: [PrismaModule],
  controllers: [
    ReportesController,        // Móvil — /api/reportes/preventista, /api/reportes/repartidor
    ReportesAdminController,   // Web   — /api/reportes-admin/*
  ],
  providers: [
    ReportesService,           // Móvil
    ReportesAdminService,      // Web
    ExcelExporterService,      // Web
    PdfExporterService,        // Web
  ],
})
export class ReportesModule {}
