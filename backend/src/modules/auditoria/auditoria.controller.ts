import {
  Controller, Get, Query, Param, UseGuards, Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuditoriaService } from './auditoria.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators';

@Controller('auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AuditoriaController {
  constructor(private svc: AuditoriaService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.svc.findAll(query);
  }

  @Get('stats')
  async getStats() {
    return this.svc.getStats();
  }

  @Get('filtros/opciones')
  async getFiltrosOpciones() {
    return this.svc.getFiltrosOpciones();
  }

  @Get('export')
  async export(@Query() query: any, @Res() res: Response) {
    const buffer = await this.svc.exportExcel(query);
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `auditoria_${timestamp}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.svc.findById(id);
  }
}