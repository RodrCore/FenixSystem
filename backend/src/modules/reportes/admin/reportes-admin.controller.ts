import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportesAdminService } from './reportes-admin.service';
import { ExcelExporterService } from './excel-exporter.service';
import { PdfExporterService } from './pdf-exporter.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators';
import type { ReporteQuery } from './dto/reporte-query.dto';

@Controller('reportes-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE')
export class ReportesAdminController {
  constructor(
    private svc: ReportesAdminService,
    private excelExporter: ExcelExporterService,
    private pdfExporter: PdfExporterService,
  ) {}

  // ═══════════════════════════════════════════════
  // SECCIONES (datos JSON para dashboard)
  // ═══════════════════════════════════════════════

  @Get('ventas')
  getVentas(@Query() query: ReporteQuery) {
    return this.svc.getVentas(query);
  }

  @Get('pedidos')
  getPedidos(@Query() query: ReporteQuery) {
    return this.svc.getPedidos(query);
  }

  @Get('reabastecimientos')
  getReabastecimientos(@Query() query: ReporteQuery) {
    return this.svc.getReabastecimientos(query);
  }

  @Get('inventario')
  getInventario(@Query() query: ReporteQuery) {
    return this.svc.getInventario(query);
  }

  @Get('comercial')
  getComercial(@Query() query: ReporteQuery) {
    return this.svc.getComercial(query);
  }

  @Get('clientes')
  getClientes(@Query() query: ReporteQuery) {
    return this.svc.getClientes(query);
  }

  // ═══════════════════════════════════════════════
  // EXPORTACIÓN
  // ═══════════════════════════════════════════════
  @Get(':seccion/export')
  async exportar(
    @Param('seccion') seccion: string,
    @Query() query: ReporteQuery & { formato: string },
    @Res() res: Response,
  ) {
    const formato = (query.formato || 'excel').toLowerCase();

    let data: any;
    switch (seccion) {
      case 'ventas':
        data = await this.svc.getVentas(query);
        break;
      case 'pedidos':
        data = await this.svc.getPedidos(query);
        break;
      case 'reabastecimientos':
        data = await this.svc.getReabastecimientos(query);
        break;
      case 'inventario':
        data = await this.svc.getInventario(query);
        break;
      case 'comercial':
        data = await this.svc.getComercial(query);
        break;
      case 'clientes':
        data = await this.svc.getClientes(query);
        break;
      default:
        throw new HttpException(`Sección '${seccion}' inválida`, HttpStatus.BAD_REQUEST);
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `reporte_${seccion}_${timestamp}`;

    if (formato === 'excel') {
      const buffer = await this.excelExporter.exportar(seccion, data);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      res.send(buffer);
    } else if (formato === 'pdf') {
      const buffer = await this.pdfExporter.exportar(seccion, data);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      res.send(buffer);
    } else {
      throw new HttpException(
        `Formato '${formato}' no soportado. Usa 'excel' o 'pdf'.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}