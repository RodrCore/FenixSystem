import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Request,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators';
import { ClientesService } from './clientes.service';

@Controller('clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientesController {
  constructor(private clientesService: ClientesService) {}

  @Get('stats')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA')
  async getStats() {
    return this.clientesService.getStats();
  }

  // GET /api/clientes/buscar?q=texto
  @Get('buscar')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA', 'REPARTIDOR')
  async buscar(@Query('q') q: string) {
    return this.clientesService.buscar(q);
  }

  // GET /clientes
  @Get()
  findAll(@Query() query: any) {
    return this.clientesService.findAll(query);
  }

  // GET /clientes/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findOne(id);
  }

  // POST /clientes
  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA', 'REPARTIDOR')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any, @Request() req: any) {
    return this.clientesService.create(dto, req.user.id);
  }

  // PATCH /clientes/:id
  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA', 'REPARTIDOR')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @Request() req: any,
  ) {
    return this.clientesService.update(id, dto, req.user.id);
  }

  // PATCH /clientes/:id/estado — solo admin
  @Patch(':id/estado')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: string,
    @Request() req: any,
  ) {
    return this.clientesService.cambiarEstado(id, estado, req.user.id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE')
  async softDelete(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @Request() req: any,
  ) {
    return this.clientesService.softDelete(
      id,
      motivo,
      req.user.id,
      req.user.rol,
    );
  }

  @Patch(':id/restore')
  @Roles('SUPER_ADMIN')
  async restore(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.clientesService.restore(id, req.user.rol);
  }
}
