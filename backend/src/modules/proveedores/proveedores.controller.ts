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
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { ProveedoresService } from './proveedores.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators';

@Controller('proveedores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProveedoresController {
  constructor(private svc: ProveedoresService) {}

  // ═══════════════════════════════════════════════
  // LISTAR
  // ═══════════════════════════════════════════════
  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'ALMACEN', 'GERENTE')
  async findAll(@Query() query: any) {
    return this.svc.findAll(query);
  }

  // ═══════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════
  @Get('stats')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ALMACEN', 'GERENTE')
  async getStats() {
    return this.svc.getStatistics();
  }

  // ═══════════════════════════════════════════════
  // OBTENER POR ID
  // ═══════════════════════════════════════════════
  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ALMACEN', 'GERENTE')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findById(id);
  }

  // ═══════════════════════════════════════════════
  // CREAR
  // ═══════════════════════════════════════════════
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('SUPER_ADMIN', 'ADMIN', 'ALMACEN')
  async create(@Body() dto: any) {
    if (!dto.razon_social?.trim()) {
      throw new BadRequestException('La razón social es obligatoria');
    }
    return this.svc.create(dto);
  }

  // ═══════════════════════════════════════════════
  // ACTUALIZAR
  // ═══════════════════════════════════════════════
  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ALMACEN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.svc.update(id, dto);
  }

  // ═══════════════════════════════════════════════
  // ACTIVAR / DESACTIVAR
  // ═══════════════════════════════════════════════
  @Patch(':id/toggle-active')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ALMACEN')
  async toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @Body('activo') activo: boolean,
  ) {
    if (typeof activo !== 'boolean') {
      throw new BadRequestException('El campo "activo" debe ser boolean');
    }
    return this.svc.toggleActive(id, activo);
  }

  // ═══════════════════════════════════════════════
  // SOFT DELETE
  // ═══════════════════════════════════════════════
  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async softDelete(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @Request() req: any,
  ) {
    return this.svc.softDelete(id, motivo, req.user.id, req.user.rol);
  }

  // ═══════════════════════════════════════════════
  // RESTAURAR
  // ═══════════════════════════════════════════════
  @Patch(':id/restore')
  @Roles('SUPER_ADMIN')
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.svc.restore(id, req.user.rol);
  }
}