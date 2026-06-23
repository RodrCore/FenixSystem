import {
  Controller, Get, Query, UseGuards, Request, Res,
  ForbiddenException, BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportesService } from './reportes.service';

 
@Controller('reportes')
@UseGuards(JwtAuthGuard)
export class ReportesController {
  constructor(private reportes: ReportesService) {}  // ← inyectar ReportesService
 
  // GET /api/reportes/preventista?mes=11&anio=2026
  // Devuelve los DATOS para mostrar en pantalla (cards + lista)
  @Get('preventista')
  async dataPreventista(@Query() q: any, @Request() req: any) {
    this.validarMesAnio(q.mes, q.anio);
    if (!['SUPER_ADMIN','ADMIN','GERENTE','PREVENTISTA'].includes(req.user.rol)) {
      throw new ForbiddenException();
    }
    return this.reportes.getReportePreventista(
      req.user.id, parseInt(q.mes, 10), parseInt(q.anio, 10),
    );
  }
 
  // GET /api/reportes/preventista/pdf?mes=11&anio=2026
  // Devuelve el PDF descargable
  @Get('preventista/pdf')
  async pdfPreventista(@Query() q: any, @Request() req: any, @Res() res: Response) {
    this.validarMesAnio(q.mes, q.anio);
    const buffer = await this.reportes.generarPDFPreventista(
      req.user.id, parseInt(q.mes, 10), parseInt(q.anio, 10),
    );
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="reporte-ventas-${q.mes}-${q.anio}.pdf"`,
    }).end(buffer);
  }
 
  // GET /api/reportes/repartidor?mes=11&anio=2026
  @Get('repartidor')
  async dataRepartidor(@Query() q: any, @Request() req: any) {
    this.validarMesAnio(q.mes, q.anio);
    if (!['SUPER_ADMIN','ADMIN','GERENTE','REPARTIDOR'].includes(req.user.rol)) {
      throw new ForbiddenException();
    }
    return this.reportes.getReporteRepartidor(
      req.user.id, parseInt(q.mes, 10), parseInt(q.anio, 10),
    );
  }
 
  @Get('repartidor/pdf')
  async pdfRepartidor(@Query() q: any, @Request() req: any, @Res() res: Response) {
    this.validarMesAnio(q.mes, q.anio);
    const buffer = await this.reportes.generarPDFRepartidor(
      req.user.id, parseInt(q.mes, 10), parseInt(q.anio, 10),
    );
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="reporte-entregas-${q.mes}-${q.anio}.pdf"`,
    }).end(buffer);
  }
 
  private validarMesAnio(mes: any, anio: any) {
    const m = parseInt(mes, 10);
    const a = parseInt(anio, 10);
    if (isNaN(m) || m < 1 || m > 12)        throw new BadRequestException('Mes inválido (1-12)');
    if (isNaN(a) || a < 2020 || a > 2100)  throw new BadRequestException('Año inválido');
  }
}
