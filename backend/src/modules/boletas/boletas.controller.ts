import {
  Controller, Get, Param, ParseIntPipe, Res, UseGuards, Request,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard }   from '../auth/guards/roles.guard';
import { Roles }        from '../auth/decorators';
import { BoletasService } from './boletas.service';
 
@Controller('boletas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BoletasController {
  constructor(private boletasService: BoletasService) {}  // ← inyectar BoletasService
 
  // GET /api/boletas/:id → descarga el PDF
  // Roles permitidos: TODOS menos REPARTIDOR
  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA')
  async generar(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.boletasService.generarBoletaPDF(
      id, req.user.id, req.user.rol,
    );
 
    res
      .status(200)
      .set({
        'Content-Type':        'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length':       buffer.length.toString(),
      })
      .end(buffer);
  }
}
