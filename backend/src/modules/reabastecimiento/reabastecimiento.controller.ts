import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators';
import { ReabastecimientoService } from './reabastecimiento.service';
import { ReabastecimientoPdfService } from './reabastecimiento-pdf.service';

@Controller('reabastecimiento')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReabastecimientoController {
  constructor(
    private svc: ReabastecimientoService,
    private pdfSvc: ReabastecimientoPdfService,
  ) {}

  @Get('stats')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN')
  getStats() {
    return this.svc.getStats();
  }

  @Get('sugerencias-bajo-stock')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN')
  getSugerencias() {
    return this.svc.getSugerenciasBajoStock();
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN')
  findAll(@Query() query: any) {
    return this.svc.findAll(query);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Get(':id/pdf')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN')
  async descargarPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const orden = await this.svc.findOne(id);
    const pdf = await this.pdfSvc.generar(orden);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${orden.numero_orden}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.send(pdf);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('SUPER_ADMIN', 'ADMIN', 'ALMACEN')
  create(@Body() dto: any, @Request() req: any) {
    return this.svc.create(dto, req.user.id, req.user.rol);
  }

  @Patch(':id/recibir')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ALMACEN')
  recibir(
    @Param('id', ParseIntPipe) id: number,
    @Body('detalles') detalles: any[],
    @Request() req: any,
  ) {
    return this.svc.recibir(id, detalles, req.user.id, req.user.rol);
  }

  @Patch(':id/cancelar')
  @Roles('SUPER_ADMIN', 'ADMIN')
  cancelar(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @Request() req: any,
  ) {
    return this.svc.cancelar(id, motivo, req.user.id, req.user.rol);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  softDelete(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @Request() req: any,
  ) {
    return this.svc.softDelete(id, motivo, req.user.id, req.user.rol);
  }
}